import { Test, TestingModule } from '@nestjs/testing';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductQueryDto } from './dto/product-query.dto';
import { ProductWithPricingDto } from './dto/product-with-pricing.dto';
import { ApplyDiscountDto } from './dto/apply-discount.dto';
import { Product } from './entities/product.entity';

describe('ProductsController', () => {
  let controller: ProductsController;
  let service: ProductsService;

  const createMockProduct = (overrides: Partial<Product> = {}): Product => {
    const product = new Product();
    Object.assign(product, {
      id: '123e4567-e89b-12d3-a456-426614174000',
      name: 'Test Product',
      description: 'Test Description',
      price: 99.99,
      stock_quantity: 10,
      image_url: 'https://example.com/image.jpg',
      discount_percentage: null,
      discount_start_date: null,
      discount_end_date: null,
      created_at: new Date('2024-01-01'),
      updated_at: new Date('2024-01-01'),
      ...overrides,
    });
    return product;
  };

  const mockProduct = createMockProduct();

  const mockProductWithPricing = ProductWithPricingDto.fromProduct(mockProduct);

  const mockProductsService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    applyDiscount: jest.fn(),
    removeDiscount: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductsController],
      providers: [
        {
          provide: ProductsService,
          useValue: mockProductsService,
        },
      ],
    }).compile();

    controller = module.get<ProductsController>(ProductsController);
    service = module.get<ProductsService>(ProductsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a product without image', async () => {
      const createProductDto: CreateProductDto = {
        name: 'Test Product',
        description: 'Test Description',
        price: 99.99,
        stock_quantity: 10,
      };

      mockProductsService.create.mockResolvedValue(mockProduct);

      const result = await controller.create(createProductDto);

      expect(service.create).toHaveBeenCalledWith(createProductDto, undefined);
      expect(result).toEqual(mockProductWithPricing);
    });

    it('should create a product with image file', async () => {
      const createProductDto: CreateProductDto = {
        name: 'Test Product',
        description: 'Test Description',
        price: 99.99,
        stock_quantity: 10,
      };

      const mockImageFile = {
        originalname: 'test.jpg',
        mimetype: 'image/jpeg',
        size: 1024,
        buffer: Buffer.from('test'),
      };

      mockProductsService.create.mockResolvedValue(mockProduct);

      const result = await controller.create(createProductDto, mockImageFile);

      expect(service.create).toHaveBeenCalledWith(createProductDto, mockImageFile);
      expect(result).toEqual(mockProductWithPricing);
    });
  });

  describe('findAll', () => {
    it('should return all products with pagination', async () => {
      const query: ProductQueryDto = { page: 1, limit: 10 };
      const expectedResult = {
        products: [mockProductWithPricing],
        total: 1,
        page: 1,
        limit: 10,
      };

      mockProductsService.findAll.mockResolvedValue(expectedResult);

      const result = await controller.findAll(query);

      expect(service.findAll).toHaveBeenCalledWith(query);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('findOne', () => {
    it('should return a single product', async () => {
      mockProductsService.findOne.mockResolvedValue(mockProductWithPricing);

      const result = await controller.findOne('123e4567-e89b-12d3-a456-426614174000');

      expect(service.findOne).toHaveBeenCalledWith('123e4567-e89b-12d3-a456-426614174000');
      expect(result).toEqual(mockProductWithPricing);
    });
  });

  describe('update', () => {
    it('should update a product without image', async () => {
      const updateProductDto: UpdateProductDto = { name: 'Updated Product' };
      const updatedProduct = { ...mockProductWithPricing, name: 'Updated Product' };

      mockProductsService.update.mockResolvedValue(updatedProduct);

      const result = await controller.update(
        '123e4567-e89b-12d3-a456-426614174000',
        updateProductDto,
        undefined,
      );

      expect(service.update).toHaveBeenCalledWith(
        '123e4567-e89b-12d3-a456-426614174000',
        updateProductDto,
        undefined,
      );
      expect(result).toEqual(updatedProduct);
    });

    it('should update a product with new image', async () => {
      const updateProductDto: UpdateProductDto = { name: 'Updated Product' };
      const mockImageFile = {
        originalname: 'updated.jpg',
        mimetype: 'image/jpeg',
        size: 2048,
        buffer: Buffer.from('updated image'),
      };
      const updatedProduct = { ...mockProductWithPricing, name: 'Updated Product' };

      mockProductsService.update.mockResolvedValue(updatedProduct);

      const result = await controller.update(
        '123e4567-e89b-12d3-a456-426614174000',
        updateProductDto,
        mockImageFile,
      );

      expect(service.update).toHaveBeenCalledWith(
        '123e4567-e89b-12d3-a456-426614174000',
        updateProductDto,
        mockImageFile,
      );
      expect(result).toEqual(updatedProduct);
    });
  });

  describe('remove', () => {
    it('should remove a product', async () => {
      mockProductsService.remove.mockResolvedValue(undefined);

      await controller.remove('123e4567-e89b-12d3-a456-426614174000');

      expect(service.remove).toHaveBeenCalledWith('123e4567-e89b-12d3-a456-426614174000');
    });
  });

  describe('applyDiscount', () => {
    it('should apply discount to a product', async () => {
      const discountDto: ApplyDiscountDto = {
        discount_percentage: 20,
        discount_start_date: '2024-01-01T00:00:00.000Z',
        discount_end_date: '2024-12-31T23:59:59.000Z',
      };
      const discountedProduct = { ...mockProductWithPricing, discount_percentage: 20 };

      mockProductsService.applyDiscount.mockResolvedValue(discountedProduct);

      const result = await controller.applyDiscount(
        '123e4567-e89b-12d3-a456-426614174000',
        discountDto,
      );

      expect(service.applyDiscount).toHaveBeenCalledWith(
        '123e4567-e89b-12d3-a456-426614174000',
        discountDto,
      );
      expect(result).toEqual(discountedProduct);
    });
  });

  describe('removeDiscount', () => {
    it('should remove discount from a product', async () => {
      const productWithoutDiscount = { ...mockProductWithPricing, discount_percentage: null };

      mockProductsService.removeDiscount.mockResolvedValue(productWithoutDiscount);

      const result = await controller.removeDiscount('123e4567-e89b-12d3-a456-426614174000');

      expect(service.removeDiscount).toHaveBeenCalledWith('123e4567-e89b-12d3-a456-426614174000');
      expect(result).toEqual(productWithoutDiscount);
    });
  });
});
