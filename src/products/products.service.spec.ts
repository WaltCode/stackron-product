import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { ProductsService } from './products.service';
import { Product } from './entities/product.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ApplyDiscountDto } from './dto/apply-discount.dto';
import { S3Service } from '../common/services/s3.service';
import { RedisService } from '../common/services/redis.service';

describe('ProductsService', () => {
  let service: ProductsService;
  let repository: Repository<Product>;

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

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findAndCount: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
  };

  const mockS3Service = {
    uploadFile: jest.fn(),
    deleteFile: jest.fn(),
  };

  const mockRedisService = {
    getJson: jest.fn(),
    setJson: jest.fn(),
    del: jest.fn(),
    flushPattern: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        {
          provide: getRepositoryToken(Product),
          useValue: mockRepository,
        },
        {
          provide: S3Service,
          useValue: mockS3Service,
        },
        {
          provide: RedisService,
          useValue: mockRedisService,
        },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
    repository = module.get<Repository<Product>>(getRepositoryToken(Product));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new product', async () => {
      const createProductDto: CreateProductDto = {
        name: 'Test Product',
        description: 'Test Description',
        price: 99.99,
        stock_quantity: 10,
      };

      mockRepository.create.mockReturnValue(mockProduct);
      mockRepository.save.mockResolvedValue(mockProduct);

      const result = await service.create(createProductDto);

      expect(repository.create).toHaveBeenCalled();
      expect(repository.save).toHaveBeenCalledWith(mockProduct);
      expect(result).toEqual(mockProduct);
    });

    it('should create a product with image upload', async () => {
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

      const imageUrl = 'https://s3.amazonaws.com/bucket/products/test.jpg';

      mockRepository.create.mockReturnValue(mockProduct);
      mockRepository.save.mockResolvedValue(mockProduct);
      mockS3Service.uploadFile.mockResolvedValue(imageUrl);

      const result = await service.create(createProductDto, mockImageFile);

      expect(mockS3Service.uploadFile).toHaveBeenCalledWith(mockImageFile, 'products');
      expect(repository.create).toHaveBeenCalledWith({
        ...createProductDto,
        image_url: imageUrl,
        discount_start_date: undefined,
        discount_end_date: undefined,
      });
      expect(result).toEqual(mockProduct);
    });
  });

  describe('findAll', () => {
    it('should return paginated products', async () => {
      const query = { page: 1, limit: 10 };
      const products = [mockProduct];
      const total = 1;

      mockRepository.findAndCount.mockResolvedValue([products, total]);

      const result = await service.findAll(query);

      expect(result).toEqual({
        products,
        total,
        page: 1,
        limit: 10,
      });
    });

    it('should filter products by name', async () => {
      const query = { page: 1, limit: 10, name: 'Test' };
      const products = [mockProduct];
      const total = 1;

      mockRepository.findAndCount.mockResolvedValue([products, total]);

      await service.findAll(query);

      expect(repository.findAndCount).toHaveBeenCalledWith({
        where: { name: expect.any(Object) },
        skip: 0,
        take: 10,
        order: { created_at: 'DESC' },
      });
    });
  });

  describe('findOne', () => {
    it('should return a product by id', async () => {
      mockRepository.findOne.mockResolvedValue(mockProduct);

      const result = await service.findOne('123e4567-e89b-12d3-a456-426614174000');

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: '123e4567-e89b-12d3-a456-426614174000' },
      });
      expect(result).toEqual(mockProduct);
    });

    it('should throw NotFoundException when product not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('999e4567-e89b-12d3-a456-426614174999')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update a product', async () => {
      const updateProductDto: UpdateProductDto = { name: 'Updated Product' };
      const updatedProduct = { ...mockProduct, ...updateProductDto };

      mockRepository.findOne.mockResolvedValue(mockProduct);
      mockRepository.save.mockResolvedValue(updatedProduct);

      const result = await service.update('123e4567-e89b-12d3-a456-426614174000', updateProductDto);

      expect(repository.save).toHaveBeenCalled();
      expect(result.name).toBe('Updated Product');
    });

    it('should throw NotFoundException when updating non-existent product', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.update('999e4567-e89b-12d3-a456-426614174999', {})).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('should remove a product', async () => {
      mockRepository.findOne.mockResolvedValue(mockProduct);
      mockRepository.remove.mockResolvedValue(mockProduct);

      await service.remove('123e4567-e89b-12d3-a456-426614174000');

      expect(repository.remove).toHaveBeenCalledWith(mockProduct);
    });

    it('should throw NotFoundException when removing non-existent product', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.remove('999e4567-e89b-12d3-a456-426614174999')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('applyDiscount', () => {
    it('should apply discount to a product', async () => {
      const applyDiscountDto: ApplyDiscountDto = {
        discount_percentage: 20,
        discount_start_date: '2024-01-01T00:00:00.000Z',
        discount_end_date: '2024-12-31T23:59:59.000Z',
      };

      const productWithDiscount = {
        ...mockProduct,
        discount_percentage: 20,
        discount_start_date: new Date('2024-01-01T00:00:00.000Z'),
        discount_end_date: new Date('2024-12-31T23:59:59.000Z'),
      };

      mockRepository.findOne.mockResolvedValue(mockProduct);
      mockRepository.save.mockResolvedValue(productWithDiscount);

      const result = await service.applyDiscount(
        '123e4567-e89b-12d3-a456-426614174000',
        applyDiscountDto,
      );

      expect(repository.save).toHaveBeenCalled();
      expect(result.discount_percentage).toBe(20);
    });

    it('should throw BadRequestException for invalid date range', async () => {
      const applyDiscountDto: ApplyDiscountDto = {
        discount_percentage: 20,
        discount_start_date: '2024-12-31T23:59:59.000Z',
        discount_end_date: '2024-01-01T00:00:00.000Z', // End before start
      };

      mockRepository.findOne.mockResolvedValue(mockProduct);

      await expect(
        service.applyDiscount('123e4567-e89b-12d3-a456-426614174000', applyDiscountDto),
      ).rejects.toThrow('Discount end date must be after start date');
    });
  });

  describe('removeDiscount', () => {
    it('should remove discount from a product', async () => {
      const productWithDiscount = {
        ...mockProduct,
        discount_percentage: 20,
        discount_start_date: new Date('2024-01-01T00:00:00.000Z'),
        discount_end_date: new Date('2024-12-31T23:59:59.000Z'),
      };

      const productWithoutDiscount = {
        ...mockProduct,
        discount_percentage: null,
        discount_start_date: null,
        discount_end_date: null,
      };

      mockRepository.findOne.mockResolvedValue(productWithDiscount);
      mockRepository.save.mockResolvedValue(productWithoutDiscount);

      const result = await service.removeDiscount('123e4567-e89b-12d3-a456-426614174000');

      expect(repository.save).toHaveBeenCalled();
      expect(result.discount_percentage).toBeUndefined();
    });
  });
});
