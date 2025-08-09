import { ApiProperty } from '@nestjs/swagger';
import { Product } from '../entities/product.entity';

export class ProductWithPricingDto {
  @ApiProperty({ description: 'Product ID' })
  id: string;

  @ApiProperty({ description: 'Product name' })
  name: string;

  @ApiProperty({ description: 'Product description' })
  description: string;

  @ApiProperty({ description: 'Original product price' })
  originalPrice: number;

  @ApiProperty({ description: 'Effective price (after discount if applicable)' })
  effectivePrice: number;

  @ApiProperty({ description: 'Discount amount in currency' })
  discountAmount: number;

  @ApiProperty({ description: 'Stock quantity' })
  stock_quantity: number;

  @ApiProperty({ description: 'Product image URL', required: false })
  image_url?: string;

  @ApiProperty({ description: 'Discount percentage', required: false })
  discount_percentage?: number;

  @ApiProperty({ description: 'Whether discount is currently active' })
  isDiscountActive: boolean;

  @ApiProperty({ description: 'Discount start date', required: false })
  discount_start_date?: Date;

  @ApiProperty({ description: 'Discount end date', required: false })
  discount_end_date?: Date;

  @ApiProperty({ description: 'Creation date' })
  created_at: Date;

  @ApiProperty({ description: 'Last update date' })
  updated_at: Date;

  static fromProduct(product: Product): ProductWithPricingDto {
    return {
      id: product.id,
      name: product.name,
      description: product.description,
      originalPrice: Number(product.price),
      effectivePrice: product.effectivePrice,
      discountAmount: product.discountAmount,
      stock_quantity: product.stock_quantity,
      image_url: product.image_url,
      discount_percentage: product.discount_percentage
        ? Number(product.discount_percentage)
        : undefined,
      isDiscountActive: product.isDiscountActive,
      discount_start_date: product.discount_start_date,
      discount_end_date: product.discount_end_date,
      created_at: product.created_at,
      updated_at: product.updated_at,
    };
  }
}
