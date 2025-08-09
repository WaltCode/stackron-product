import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CartItem } from './entities/cart-item.entity';
import { ProductsService } from '../products/products.service';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { CartResponseDto, CartItemWithPricingDto } from './dto/cart-response.dto';
import { RedisService } from '../common/services/redis.service';
import {
  calculateLineTotal,
  safeSubtract,
  sumArray,
  toPreciseDecimal,
} from '../common/utils/arithmetic.utils';

@Injectable()
export class CartService {
  private readonly CART_CACHE_KEY = 'cart:items';

  constructor(
    @InjectRepository(CartItem)
    private readonly cartItemRepository: Repository<CartItem>,
    private readonly productsService: ProductsService,
    private readonly redisService: RedisService,
  ) {}

  async addToCart(addToCartDto: AddToCartDto): Promise<CartItem> {
    const { product_id, quantity } = addToCartDto;

    // Validate quantity
    if (!Number.isInteger(quantity) || quantity <= 0) {
      throw new BadRequestException('Quantity must be a positive integer');
    }

    // Verify product exists and has sufficient stock
    const product = await this.productsService.findOneEntity(product_id);

    if (product.stock_quantity < quantity) {
      throw new BadRequestException(
        `Insufficient stock. Available: ${product.stock_quantity}, Requested: ${quantity}`,
      );
    }

    // Check if item already exists in cart
    const existingCartItem = await this.cartItemRepository.findOne({
      where: { product_id },
    });

    if (existingCartItem) {
      // Update quantity if item already exists
      const newQuantity = existingCartItem.quantity + quantity;

      if (product.stock_quantity < newQuantity) {
        throw new BadRequestException(
          `Insufficient stock. Available: ${product.stock_quantity}, Total requested: ${newQuantity}`,
        );
      }

      existingCartItem.quantity = newQuantity;
      const savedItem = await this.cartItemRepository.save(existingCartItem);
      // Invalidate cart cache
      await this.redisService.del(this.CART_CACHE_KEY);
      return savedItem;
    } else {
      // Create new cart item
      const cartItem = this.cartItemRepository.create({
        product_id,
        quantity,
      });
      const savedItem = await this.cartItemRepository.save(cartItem);
      // Invalidate cart cache
      await this.redisService.del(this.CART_CACHE_KEY);
      return savedItem;
    }
  }

  async getCart(): Promise<CartResponseDto> {
    const cartItems = await this.cartItemRepository.find({
      relations: ['product'],
      order: { created_at: 'DESC' },
    });

    // Transform cart items to include pricing information with optimized arithmetic
    const itemsWithPricing: CartItemWithPricingDto[] = cartItems.map((item) => {
      const originalPrice = toPreciseDecimal(item.product.price);
      const effectivePrice = item.product.effectivePrice;
      const lineTotal = calculateLineTotal(item.quantity, effectivePrice);
      const originalLineTotal = calculateLineTotal(item.quantity, originalPrice);
      const lineSavings = safeSubtract(originalLineTotal, lineTotal);

      return {
        id: item.id,
        product_id: item.product_id,
        quantity: item.quantity,
        created_at: item.created_at,
        product: {
          id: item.product.id,
          name: item.product.name,
          description: item.product.description,
          originalPrice,
          effectivePrice,
          discountAmount: item.product.discountAmount,
          isDiscountActive: item.product.isDiscountActive,
          image_url: item.product.image_url,
          stock_quantity: item.product.stock_quantity,
        },
        lineTotal,
        lineSavings,
      };
    });

    // Calculate totals with optimized arithmetic
    const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = sumArray(itemsWithPricing.map((item) => item.lineTotal));
    const totalOriginalPrice = sumArray(
      itemsWithPricing.map((item) => calculateLineTotal(item.quantity, item.product.originalPrice)),
    );
    const totalSavings = safeSubtract(totalOriginalPrice, totalPrice);
    const uniqueProducts = cartItems.length;

    return {
      items: itemsWithPricing,
      totalItems,
      totalPrice,
      totalOriginalPrice,
      totalSavings,
      uniqueProducts,
    };
  }

  async clearCart(): Promise<void> {
    await this.cartItemRepository.clear();

    // Invalidate cart cache
    await this.redisService.del(this.CART_CACHE_KEY);
  }

  async removeFromCart(id: string): Promise<void> {
    const cartItem = await this.cartItemRepository.findOne({ where: { id } });
    if (!cartItem) {
      throw new NotFoundException(`Cart item with ID ${id} not found`);
    }
    await this.cartItemRepository.remove(cartItem);

    // Invalidate cart cache
    await this.redisService.del(this.CART_CACHE_KEY);
  }
}
