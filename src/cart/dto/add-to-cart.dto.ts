import { IsNumber, IsPositive, Min, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class AddToCartDto {
  @ApiProperty({
    description: 'Product ID to add to cart',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  product_id: string;

  @ApiProperty({ description: 'Quantity to add to cart', example: 2 })
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  quantity: number;
}
