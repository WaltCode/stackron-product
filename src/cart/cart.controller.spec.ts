import { Test, TestingModule } from '@nestjs/testing';
import { CartController } from './cart.controller';
import { CartService } from './cart.service';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { Product } from '../products/entities/product.entity';

describe('CartController', () => {
  let controller: CartController;
  let service: CartService;

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

  const mockCartItem = {
    id: '456e7890-e89b-12d3-a456-426614174001',
    product_id: '123e4567-e89b-12d3-a456-426614174000',
    quantity: 2,
    created_at: new Date(),
    product: createMockProduct(),
  };

  const mockCartResponse = {
    items: [mockCartItem],
    totalItems: 2,
    totalPrice: 199.98,
    uniqueProducts: 1,
  };

  const mockCartService = {
    addToCart: jest.fn(),
    getCart: jest.fn(),
    clearCart: jest.fn(),
    removeFromCart: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CartController],
      providers: [
        {
          provide: CartService,
          useValue: mockCartService,
        },
      ],
    }).compile();

    controller = module.get<CartController>(CartController);
    service = module.get<CartService>(CartService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('addToCart', () => {
    it('should add item to cart', async () => {
      const addToCartDto: AddToCartDto = {
        product_id: '123e4567-e89b-12d3-a456-426614174000',
        quantity: 2,
      };

      mockCartService.addToCart.mockResolvedValue(mockCartItem);

      const result = await controller.addToCart(addToCartDto);

      expect(service.addToCart).toHaveBeenCalledWith(addToCartDto);
      expect(result).toEqual(mockCartItem);
    });
  });

  describe('getCart', () => {
    it('should return cart with totals', async () => {
      mockCartService.getCart.mockResolvedValue(mockCartResponse);

      const result = await controller.getCart();

      expect(service.getCart).toHaveBeenCalled();
      expect(result).toEqual(mockCartResponse);
    });
  });

  describe('clearCart', () => {
    it('should clear cart', async () => {
      mockCartService.clearCart.mockResolvedValue(undefined);

      await controller.clearCart();

      expect(service.clearCart).toHaveBeenCalled();
    });
  });

  describe('removeFromCart', () => {
    it('should remove item from cart', async () => {
      mockCartService.removeFromCart.mockResolvedValue(undefined);

      await controller.removeFromCart('456e7890-e89b-12d3-a456-426614174001');

      expect(service.removeFromCart).toHaveBeenCalledWith('456e7890-e89b-12d3-a456-426614174001');
    });
  });
});
