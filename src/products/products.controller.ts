import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  Query,
  HttpStatus,
  HttpCode,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductQueryDto } from './dto/product-query.dto';
import { ApplyDiscountDto } from './dto/apply-discount.dto';
import { ProductWithPricingDto } from './dto/product-with-pricing.dto';
import { ParseUUIDPipe } from '../common/pipes/parse-uuid.pipe';
import { ImageValidationInterceptor } from '../common/interceptors/image-validation.interceptor';
import { Cache } from '../common/decorators/cache.decorator';

@ApiTags('products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('image'), ImageValidationInterceptor)
  @ApiOperation({ summary: 'Create a new product with optional image upload' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Product data with optional image file',
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', example: 'iPhone 15' },
        description: { type: 'string', example: 'Latest iPhone with advanced features' },
        price: { type: 'number', example: 999.99 },
        stock_quantity: { type: 'number', example: 50 },
        discount_percentage: { type: 'number', example: 15.5 },
        discount_start_date: { type: 'string', format: 'date-time' },
        discount_end_date: { type: 'string', format: 'date-time' },
        image: {
          type: 'string',
          format: 'binary',
          description: 'Product image file (JPEG, PNG, WebP, GIF - max 5MB)',
        },
      },
      required: ['name', 'description', 'price', 'stock_quantity'],
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Product created successfully',
    type: ProductWithPricingDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request - invalid data or file' })
  async create(
    @Body() createProductDto: CreateProductDto,
    @UploadedFile() imageFile?: any,
  ): Promise<ProductWithPricingDto> {
    const product = await this.productsService.create(createProductDto, imageFile);
    return ProductWithPricingDto.fromProduct(product);
  }

  @Get()
  @Cache({ ttl: 300, keyPrefix: 'products_list' }) // Cache for 5 minutes
  @ApiOperation({ summary: 'Get all products with optional filtering and pagination' })
  @ApiResponse({
    status: 200,
    description: 'Products retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        products: {
          type: 'array',
          items: { $ref: '#/components/schemas/ProductWithPricingDto' },
        },
        total: { type: 'number' },
        page: { type: 'number' },
        limit: { type: 'number' },
      },
    },
  })
  async findAll(@Query() query: ProductQueryDto) {
    return await this.productsService.findAll(query);
  }

  @Get(':id')
  @Cache({ ttl: 600, keyPrefix: 'product' }) // Cache for 10 minutes
  @ApiOperation({ summary: 'Get a product by ID' })
  @ApiParam({ name: 'id', description: 'Product ID' })
  @ApiResponse({
    status: 200,
    description: 'Product retrieved successfully',
    type: ProductWithPricingDto,
  })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<ProductWithPricingDto> {
    return await this.productsService.findOne(id);
  }

  @Put(':id')
  @UseInterceptors(FileInterceptor('image'), ImageValidationInterceptor)
  @ApiOperation({ summary: 'Update a product by ID with optional image upload' })
  @ApiConsumes('multipart/form-data')
  @ApiParam({ name: 'id', description: 'Product ID' })
  @ApiBody({
    description: 'Product data with optional image file',
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', example: 'iPhone 15 Pro' },
        description: { type: 'string', example: 'Updated description' },
        price: { type: 'number', example: 1099.99 },
        stock_quantity: { type: 'number', example: 25 },
        discount_percentage: { type: 'number', example: 10 },
        discount_start_date: { type: 'string', format: 'date-time' },
        discount_end_date: { type: 'string', format: 'date-time' },
        image: {
          type: 'string',
          format: 'binary',
          description: 'New product image file (JPEG, PNG, WebP, GIF - max 5MB)',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Product updated successfully',
    type: ProductWithPricingDto,
  })
  @ApiResponse({ status: 404, description: 'Product not found' })
  @ApiResponse({ status: 400, description: 'Bad request - invalid data or file' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateProductDto: UpdateProductDto,
    @UploadedFile() imageFile?: any,
  ): Promise<ProductWithPricingDto> {
    return await this.productsService.update(id, updateProductDto, imageFile);
  }

  @Put(':id/discount')
  @ApiOperation({ summary: 'Apply discount to a product' })
  @ApiParam({ name: 'id', description: 'Product ID' })
  @ApiResponse({
    status: 200,
    description: 'Discount applied successfully',
    type: ProductWithPricingDto,
  })
  @ApiResponse({ status: 404, description: 'Product not found' })
  @ApiResponse({ status: 400, description: 'Bad request - invalid discount data' })
  async applyDiscount(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() applyDiscountDto: ApplyDiscountDto,
  ): Promise<ProductWithPricingDto> {
    return await this.productsService.applyDiscount(id, applyDiscountDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a product by ID' })
  @ApiParam({ name: 'id', description: 'Product ID' })
  @ApiResponse({
    status: 204,
    description: 'Product deleted successfully',
  })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return await this.productsService.remove(id);
  }

  @Delete(':id/discount')
  @ApiOperation({ summary: 'Remove discount from a product' })
  @ApiParam({ name: 'id', description: 'Product ID' })
  @ApiResponse({
    status: 200,
    description: 'Discount removed successfully',
    type: ProductWithPricingDto,
  })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async removeDiscount(@Param('id', ParseUUIDPipe) id: string): Promise<ProductWithPricingDto> {
    return await this.productsService.removeDiscount(id);
  }
}
