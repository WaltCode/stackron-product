import { Controller, Get, Post, Body, HttpStatus, HttpCode, Delete, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { CartService } from './cart.service';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { CartResponseDto } from './dto/cart-response.dto';
import { CartItem } from './entities/cart-item.entity';
import { ParseUUIDPipe } from '../common/pipes/parse-uuid.pipe';

@ApiTags('cart')
@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Post('items')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add a product to cart' })
  @ApiResponse({
    status: 201,
    description: 'Product added to cart successfully',
    type: CartItem,
  })
  @ApiResponse({ status: 400, description: 'Bad request - insufficient stock or invalid data' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async addToCart(@Body() addToCartDto: AddToCartDto): Promise<CartItem> {
    return await this.cartService.addToCart(addToCartDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all items in cart with totals' })
  @ApiResponse({
    status: 200,
    description: 'Cart retrieved successfully',
    type: CartResponseDto,
  })
  async getCart(): Promise<CartResponseDto> {
    return await this.cartService.getCart();
  }

  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Clear all items from cart' })
  @ApiResponse({
    status: 204,
    description: 'Cart cleared successfully',
  })
  async clearCart(): Promise<void> {
    return await this.cartService.clearCart();
  }

  @Delete('items/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove a specific item from cart' })
  @ApiParam({ name: 'id', description: 'Cart item ID' })
  @ApiResponse({
    status: 204,
    description: 'Item removed from cart successfully',
  })
  @ApiResponse({ status: 404, description: 'Cart item not found' })
  async removeFromCart(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return await this.cartService.removeFromCart(id);
  }
}
