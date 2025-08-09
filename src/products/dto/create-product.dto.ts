import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsPositive,
  Min,
  Max,
  IsOptional,
  IsDateString,
  ValidateIf,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateAfter } from './validators/date-range.validator';

export class CreateProductDto {
  @ApiProperty({ description: 'Product name', example: 'iPhone 15' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Product description',
    example: 'Latest iPhone with advanced features',
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ description: 'Product price', example: 999.99 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  @Type(() => Number)
  price: number;

  @ApiProperty({ description: 'Stock quantity', example: 50 })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  stock_quantity: number;

  // Note: Image file will be handled separately via multipart/form-data upload

  @ApiPropertyOptional({
    description: 'Discount percentage (0-100)',
    example: 15.5,
    minimum: 0,
    maximum: 100,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0, { message: 'discount_percentage must be at least 0' })
  @Max(100, { message: 'discount_percentage must not exceed 100' })
  @Type(() => Number)
  discount_percentage?: number;

  @ApiPropertyOptional({
    description: 'Discount start date (ISO string)',
    example: '2024-01-01T00:00:00.000Z',
  })
  @IsOptional()
  @IsDateString({}, { message: 'discount_start_date must be a valid ISO date string' })
  discount_start_date?: string;

  @ApiPropertyOptional({
    description: 'Discount end date (ISO string)',
    example: '2024-12-31T23:59:59.000Z',
  })
  @IsOptional()
  @IsDateString({}, { message: 'discount_end_date must be a valid ISO date string' })
  @ValidateIf((o: CreateProductDto) => o.discount_start_date !== undefined)
  @IsDateAfter('discount_start_date', {
    message: 'discount_end_date must be after discount_start_date',
  })
  discount_end_date?: string;
}
