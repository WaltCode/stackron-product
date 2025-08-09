import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CartItem } from './entities/cart-item.entity';
import { ProductsService } from '../products/products.service';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { CartResponseDto, CartItemWithPricingDto } from './dto/cart-response.dto';
import { RedisService } from '../common/services/redis.service';

@Injectable()
export class CartService {
  private readonly CART_CACHE_KEY = 'cart:items';
  private readonly CART_CACHE_TTL = 300; // 5 minutes

  constructor(
    @InjectRepository(CartItem)
    private readonly cartItemRepository: Repository<CartItem>,
    private readonly productsService: ProductsService,
    private readonly redisService: RedisService,
  ) {}

  async addToCart(addToCartDto: AddToCartDto): Promise<CartItem> {
    const { product_id, quantity } = addToCartDto;

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

    // Transform cart items to include pricing information
    const itemsWithPricing: CartItemWithPricingDto[] = cartItems.map((item) => {
      const lineTotal = item.quantity * item.product.effectivePrice;
      const originalLineTotal = item.quantity * Number(item.product.price);
      const lineSavings = originalLineTotal - lineTotal;

      return {
        id: item.id,
        product_id: item.product_id,
        quantity: item.quantity,
        created_at: item.created_at,
        product: {
          id: item.product.id,
          name: item.product.name,
          description: item.product.description,
          originalPrice: Number(item.product.price),
          effectivePrice: item.product.effectivePrice,
          discountAmount: item.product.discountAmount,
          isDiscountActive: item.product.isDiscountActive,
          image_url: item.product.image_url,
          stock_quantity: item.product.stock_quantity,
        },
        lineTotal: Number(lineTotal.toFixed(2)),
        lineSavings: Number(lineSavings.toFixed(2)),
      };
    });

    const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = itemsWithPricing.reduce((sum, item) => sum + item.lineTotal, 0);
    const totalOriginalPrice = itemsWithPricing.reduce(
      (sum, item) => sum + item.quantity * item.product.originalPrice,
      0,
    );
    const totalSavings = totalOriginalPrice - totalPrice;
    const uniqueProducts = cartItems.length;

    return {
      items: itemsWithPricing,
      totalItems,
      totalPrice: Number(totalPrice.toFixed(2)),
      totalOriginalPrice: Number(totalOriginalPrice.toFixed(2)),
      totalSavings: Number(totalSavings.toFixed(2)),
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
