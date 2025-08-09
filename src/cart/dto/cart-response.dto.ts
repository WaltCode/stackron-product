import { ApiProperty } from '@nestjs/swagger';
import { CartItem } from '../entities/cart-item.entity';

export class CartItemWithPricingDto {
  @ApiProperty({ description: 'Cart item ID' })
  id: string;

  @ApiProperty({ description: 'Product ID' })
  product_id: string;

  @ApiProperty({ description: 'Quantity of the product in cart' })
  quantity: number;

  @ApiProperty({ description: 'Creation date' })
  created_at: Date;

  @ApiProperty({ description: 'Product details with pricing' })
  product: {
    id: string;
    name: string;
    description: string;
    originalPrice: number;
    effectivePrice: number;
    discountAmount: number;
    isDiscountActive: boolean;
    image_url?: string;
    stock_quantity: number;
  };

  @ApiProperty({ description: 'Line total (quantity × effective price)' })
  lineTotal: number;

  @ApiProperty({ description: 'Total savings for this line item' })
  lineSavings: number;
}

export class CartResponseDto {
  @ApiProperty({ description: 'List of cart items with pricing', type: [CartItemWithPricingDto] })
  items: CartItemWithPricingDto[];

  @ApiProperty({ description: 'Total number of items in cart' })
  totalItems: number;

  @ApiProperty({ description: 'Total price of all items in cart (after discounts)' })
  totalPrice: number;

  @ApiProperty({ description: 'Total original price (before discounts)' })
  totalOriginalPrice: number;

  @ApiProperty({ description: 'Total savings from discounts' })
  totalSavings: number;

  @ApiProperty({ description: 'Number of unique products in cart' })
  uniqueProducts: number;
}
