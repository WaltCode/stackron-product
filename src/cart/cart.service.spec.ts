import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CartService } from './cart.service';
import { CartItem } from './entities/cart-item.entity';
import { ProductsService } from '../products/products.service';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { Product } from '../products/entities/product.entity';

describe('CartService', () => {
  let service: CartService;
  let cartRepository: Repository<CartItem>;
  let productsService: ProductsService;

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

  const mockCartItem = {
    id: '456e7890-e89b-12d3-a456-426614174001',
    product_id: '123e4567-e89b-12d3-a456-426614174000',
    quantity: 2,
    created_at: new Date(),
    product: mockProduct,
  };

  const mockCartRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
    clear: jest.fn(),
  };

  const mockProductsService = {
    findOne: jest.fn(),
    findOneEntity: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CartService,
        {
          provide: getRepositoryToken(CartItem),
          useValue: mockCartRepository,
        },
        {
          provide: ProductsService,
          useValue: mockProductsService,
        },
      ],
    }).compile();

    service = module.get<CartService>(CartService);
    cartRepository = module.get<Repository<CartItem>>(getRepositoryToken(CartItem));
    productsService = module.get<ProductsService>(ProductsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('addToCart', () => {
    const addToCartDto: AddToCartDto = {
      product_id: '123e4567-e89b-12d3-a456-426614174000',
      quantity: 2,
    };

    it('should add a new item to cart', async () => {
      mockProductsService.findOneEntity.mockResolvedValue(mockProduct);
      mockCartRepository.findOne.mockResolvedValue(null);
      mockCartRepository.create.mockReturnValue(mockCartItem);
      mockCartRepository.save.mockResolvedValue(mockCartItem);

      const result = await service.addToCart(addToCartDto);

      expect(productsService.findOneEntity).toHaveBeenCalledWith(
        '123e4567-e89b-12d3-a456-426614174000',
      );
      expect(cartRepository.create).toHaveBeenCalledWith({
        product_id: '123e4567-e89b-12d3-a456-426614174000',
        quantity: 2,
      });
      expect(result).toEqual(mockCartItem);
    });

    it('should update existing cart item quantity', async () => {
      const existingCartItem = { ...mockCartItem, quantity: 1 };
      const updatedCartItem = { ...mockCartItem, quantity: 3 };

      mockProductsService.findOneEntity.mockResolvedValue(mockProduct);
      mockCartRepository.findOne.mockResolvedValue(existingCartItem);
      mockCartRepository.save.mockResolvedValue(updatedCartItem);

      const result = await service.addToCart(addToCartDto);

      expect(cartRepository.save).toHaveBeenCalledWith({
        ...existingCartItem,
        quantity: 3,
      });
      expect(result).toEqual(updatedCartItem);
    });

    it('should throw BadRequestException when insufficient stock', async () => {
      const lowStockProduct = { ...mockProduct, stock_quantity: 1 };
      mockProductsService.findOneEntity.mockResolvedValue(lowStockProduct);

      await expect(service.addToCart(addToCartDto)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when total quantity exceeds stock', async () => {
      const existingCartItem = { ...mockCartItem, quantity: 9 };
      mockProductsService.findOneEntity.mockResolvedValue(mockProduct);
      mockCartRepository.findOne.mockResolvedValue(existingCartItem);

      await expect(service.addToCart(addToCartDto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('getCart', () => {
    it('should return cart with totals', async () => {
      const cartItems = [mockCartItem];
      mockCartRepository.find.mockResolvedValue(cartItems);

      const result = await service.getCart();

      expect(cartRepository.find).toHaveBeenCalledWith({
        relations: ['product'],
        order: { created_at: 'DESC' },
      });
      expect(result.totalItems).toBe(2);
      expect(result.totalPrice).toBe(199.98);
      expect(result.totalOriginalPrice).toBe(199.98);
      expect(result.totalSavings).toBe(0);
      expect(result.uniqueProducts).toBe(1);
      expect(result.items).toHaveLength(1);
      expect(result.items[0].lineTotal).toBe(199.98);
      expect(result.items[0].lineSavings).toBe(0);
    });

    it('should return empty cart when no items', async () => {
      mockCartRepository.find.mockResolvedValue([]);

      const result = await service.getCart();

      expect(result.items).toHaveLength(0);
      expect(result.totalItems).toBe(0);
      expect(result.totalPrice).toBe(0);
      expect(result.totalOriginalPrice).toBe(0);
      expect(result.totalSavings).toBe(0);
      expect(result.uniqueProducts).toBe(0);
    });

    it('should calculate totals correctly with discounted products', async () => {
      const discountedProduct = createMockProduct({
        discount_percentage: 20,
        discount_start_date: new Date('2020-01-01'),
        discount_end_date: new Date('2030-12-31'),
      });

      const cartItemWithDiscount = {
        ...mockCartItem,
        product: discountedProduct,
      };

      mockCartRepository.find.mockResolvedValue([cartItemWithDiscount]);

      const result = await service.getCart();

      expect(result.totalItems).toBe(2);
      expect(result.totalPrice).toBe(159.98); // 2 * 79.99
      expect(result.totalOriginalPrice).toBe(199.98); // 2 * 99.99
      expect(result.totalSavings).toBe(39.98); // 199.98 - 159.98
      expect(result.items[0].lineTotal).toBe(159.98);
      expect(result.items[0].lineSavings).toBe(39.98);
    });
  });

  describe('clearCart', () => {
    it('should clear all cart items', async () => {
      mockCartRepository.clear.mockResolvedValue(undefined);

      await service.clearCart();

      expect(cartRepository.clear).toHaveBeenCalled();
    });
  });

  describe('removeFromCart', () => {
    it('should remove cart item', async () => {
      mockCartRepository.findOne.mockResolvedValue(mockCartItem);
      mockCartRepository.remove.mockResolvedValue(mockCartItem);

      await service.removeFromCart('456e7890-e89b-12d3-a456-426614174001');

      expect(cartRepository.findOne).toHaveBeenCalledWith({
        where: { id: '456e7890-e89b-12d3-a456-426614174001' },
      });
      expect(cartRepository.remove).toHaveBeenCalledWith(mockCartItem);
    });

    it('should throw NotFoundException when cart item not found', async () => {
      mockCartRepository.findOne.mockResolvedValue(null);

      await expect(service.removeFromCart('999e7890-e89b-12d3-a456-426614174999')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
