import { 
  IsNumber, 
  Min, 
  Max, 
  IsOptional, 
  IsDateString 
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateAfter } from './validators/date-range.validator';

export class ApplyDiscountDto {
  @ApiProperty({ 
    description: 'Discount percentage (0-100)', 
    example: 15.5,
    minimum: 0,
    maximum: 100
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0, { message: 'discount_percentage must be at least 0' })
  @Max(100, { message: 'discount_percentage must not exceed 100' })
  @Type(() => Number)
  discount_percentage: number;

  @ApiPropertyOptional({ 
    description: 'Discount start date (ISO string)', 
    example: '2024-01-01T00:00:00.000Z' 
  })
  @IsOptional()
  @IsDateString({}, { message: 'discount_start_date must be a valid ISO date string' })
  discount_start_date?: string;

  @ApiPropertyOptional({ 
    description: 'Discount end date (ISO string)', 
    example: '2024-12-31T23:59:59.000Z' 
  })
  @IsOptional()
  @IsDateString({}, { message: 'discount_end_date must be a valid ISO date string' })
  @IsDateAfter('discount_start_date', { 
    message: 'discount_end_date must be after discount_start_date' 
  })
  discount_end_date?: string;
}
