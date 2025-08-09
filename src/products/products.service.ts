import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, Between, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';
import { Product } from './entities/product.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductQueryDto } from './dto/product-query.dto';
import { ApplyDiscountDto } from './dto/apply-discount.dto';
import { ProductWithPricingDto } from './dto/product-with-pricing.dto';
import { S3Service } from '../common/services/s3.service';
import { RedisService } from '../common/services/redis.service';
import { isValidMonetaryAmount } from '../common/utils/arithmetic.utils';

@Injectable()
export class ProductsService {
  private readonly CACHE_TTL = 300; // 5 minutes
  private readonly PRODUCT_CACHE_PREFIX = 'product';
  private readonly PRODUCTS_LIST_CACHE_PREFIX = 'products_list';

  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    private readonly s3Service: S3Service,
    private readonly redisService: RedisService,
  ) {}

  async create(createProductDto: CreateProductDto, imageFile?: any): Promise<Product> {
    // Validate price
    if (!isValidMonetaryAmount(createProductDto.price)) {
      throw new BadRequestException('Price must be a valid positive number');
    }

    // Validate discount percentage if provided
    if (createProductDto.discount_percentage !== undefined) {
      if (
        !isValidMonetaryAmount(createProductDto.discount_percentage) ||
        createProductDto.discount_percentage > 100
      ) {
        throw new BadRequestException('Discount percentage must be between 0 and 100');
      }
    }

    let imageUrl: string | undefined;

    // Upload image to S3 if provided
    if (imageFile) {
      imageUrl = await this.s3Service.uploadFile(imageFile, 'products');
    }

    // Convert date strings to Date objects if provided
    const productData = {
      ...createProductDto,
      image_url: imageUrl,
      discount_start_date: createProductDto.discount_start_date
        ? new Date(createProductDto.discount_start_date)
        : undefined,
      discount_end_date: createProductDto.discount_end_date
        ? new Date(createProductDto.discount_end_date)
        : undefined,
    };

    const product = this.productRepository.create(productData);
    return await this.productRepository.save(product);
  }

  async findAll(query: ProductQueryDto): Promise<{
    products: ProductWithPricingDto[];
    total: number;
    page: number;
    limit: number;
  }> {
    const { page = 1, limit = 10, name, minPrice, maxPrice } = query;
    const skip = (page - 1) * limit;

    const whereConditions: any = {};

    if (name) {
      whereConditions.name = Like(`%${name}%`);
    }

    if (minPrice !== undefined && maxPrice !== undefined) {
      whereConditions.price = Between(minPrice, maxPrice);
    } else if (minPrice !== undefined) {
      whereConditions.price = MoreThanOrEqual(minPrice);
    } else if (maxPrice !== undefined) {
      whereConditions.price = LessThanOrEqual(maxPrice);
    }

    const [products, total] = await this.productRepository.findAndCount({
      where: whereConditions,
      skip,
      take: limit,
      order: { created_at: 'DESC' },
    });

    // Transform products to include pricing information
    const productsWithPricing = products.map((product) =>
      ProductWithPricingDto.fromProduct(product),
    );

    return {
      products: productsWithPricing,
      total,
      page,
      limit,
    };
  }

  async findOne(id: string): Promise<ProductWithPricingDto> {
    // Try to get from cache first
    const cacheKey = `${this.PRODUCT_CACHE_PREFIX}:${id}`;
    const cachedProduct = await this.redisService.getJson<ProductWithPricingDto>(cacheKey);

    if (cachedProduct) {
      return cachedProduct;
    }

    // If not in cache, get from database
    const product = await this.productRepository.findOne({ where: { id } });
    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    const productWithPricing = ProductWithPricingDto.fromProduct(product);

    // Cache the result
    await this.redisService.setJson(cacheKey, productWithPricing, this.CACHE_TTL);

    return productWithPricing;
  }

  async findOneEntity(id: string): Promise<Product> {
    const product = await this.productRepository.findOne({ where: { id } });
    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }
    return product;
  }

  async update(
    id: string,
    updateProductDto: UpdateProductDto,
    imageFile?: any,
  ): Promise<ProductWithPricingDto> {
    // Validate price if provided
    if (updateProductDto.price !== undefined && !isValidMonetaryAmount(updateProductDto.price)) {
      throw new BadRequestException('Price must be a valid positive number');
    }

    // Validate discount percentage if provided
    if (updateProductDto.discount_percentage !== undefined) {
      if (
        !isValidMonetaryAmount(updateProductDto.discount_percentage) ||
        updateProductDto.discount_percentage > 100
      ) {
        throw new BadRequestException('Discount percentage must be between 0 and 100');
      }
    }

    const product = await this.findOneEntity(id);

    let imageUrl: string | undefined;

    // Upload new image to S3 if provided
    if (imageFile) {
      // Delete old image if it exists
      if (product.image_url) {
        await this.s3Service.deleteFile(product.image_url);
      }
      imageUrl = await this.s3Service.uploadFile(imageFile, 'products');
    }

    // Convert date strings to Date objects if provided
    const updateData = {
      ...updateProductDto,
      ...(imageUrl && { image_url: imageUrl }),
      discount_start_date: updateProductDto.discount_start_date
        ? new Date(updateProductDto.discount_start_date)
        : updateProductDto.discount_start_date,
      discount_end_date: updateProductDto.discount_end_date
        ? new Date(updateProductDto.discount_end_date)
        : updateProductDto.discount_end_date,
    };

    Object.assign(product, updateData);
    const savedProduct = await this.productRepository.save(product);

    // Invalidate cache
    const cacheKey = `${this.PRODUCT_CACHE_PREFIX}:${id}`;
    await this.redisService.del(cacheKey);
    await this.invalidateProductListCache();

    return ProductWithPricingDto.fromProduct(savedProduct);
  }

  async remove(id: string): Promise<void> {
    const product = await this.findOneEntity(id);

    // Delete image from S3 if it exists
    if (product.image_url) {
      await this.s3Service.deleteFile(product.image_url);
    }

    await this.productRepository.remove(product);

    // Invalidate cache
    const cacheKey = `${this.PRODUCT_CACHE_PREFIX}:${id}`;
    await this.redisService.del(cacheKey);
    await this.invalidateProductListCache();
  }

  async applyDiscount(
    id: string,
    applyDiscountDto: ApplyDiscountDto,
  ): Promise<ProductWithPricingDto> {
    // Validate discount percentage
    if (
      !isValidMonetaryAmount(applyDiscountDto.discount_percentage) ||
      applyDiscountDto.discount_percentage <= 0 ||
      applyDiscountDto.discount_percentage > 100
    ) {
      throw new BadRequestException('Discount percentage must be between 0 and 100');
    }

    const product = await this.findOneEntity(id);

    // Validate date range if both dates are provided
    if (applyDiscountDto.discount_start_date && applyDiscountDto.discount_end_date) {
      const startDate = new Date(applyDiscountDto.discount_start_date);
      const endDate = new Date(applyDiscountDto.discount_end_date);

      if (endDate <= startDate) {
        throw new BadRequestException('Discount end date must be after start date');
      }
    }

    // Apply discount
    product.discount_percentage = applyDiscountDto.discount_percentage;
    product.discount_start_date = applyDiscountDto.discount_start_date
      ? new Date(applyDiscountDto.discount_start_date)
      : undefined;
    product.discount_end_date = applyDiscountDto.discount_end_date
      ? new Date(applyDiscountDto.discount_end_date)
      : undefined;

    const savedProduct = await this.productRepository.save(product);

    // Invalidate cache
    const cacheKey = `${this.PRODUCT_CACHE_PREFIX}:${id}`;
    await this.redisService.del(cacheKey);
    await this.invalidateProductListCache();

    return ProductWithPricingDto.fromProduct(savedProduct);
  }

  async removeDiscount(id: string): Promise<ProductWithPricingDto> {
    const product = await this.findOneEntity(id);

    // Remove discount
    product.discount_percentage = null;
    product.discount_start_date = null;
    product.discount_end_date = null;

    const savedProduct = await this.productRepository.save(product);

    // Invalidate cache
    const cacheKey = `${this.PRODUCT_CACHE_PREFIX}:${id}`;
    await this.redisService.del(cacheKey);
    await this.invalidateProductListCache();

    return ProductWithPricingDto.fromProduct(savedProduct);
  }

  private async invalidateProductListCache(): Promise<void> {
    // Invalidate all product list caches (they may have different query parameters)
    await this.redisService.flushPattern(`${this.PRODUCTS_LIST_CACHE_PREFIX}:*`);
  }
}
