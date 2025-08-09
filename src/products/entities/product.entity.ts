import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('products')
export class Product {
  @ApiProperty({ description: 'Product ID' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'Product name' })
  @Column({ type: 'varchar', length: 255 })
  name: string;

  @ApiProperty({ description: 'Product description' })
  @Column({ type: 'text' })
  description: string;

  @ApiProperty({ description: 'Product price' })
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @ApiProperty({ description: 'Stock quantity' })
  @Column({ type: 'integer' })
  stock_quantity: number;

  @ApiProperty({ description: 'Product image URL', required: false })
  @Column({ type: 'varchar', length: 500, nullable: true })
  image_url?: string;

  @ApiProperty({ description: 'Discount percentage (0-100)', required: false })
  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  discount_percentage?: number;

  @ApiProperty({ description: 'Discount start date', required: false })
  @Column({ type: 'datetime', nullable: true })
  discount_start_date?: Date;

  @ApiProperty({ description: 'Discount end date', required: false })
  @Column({ type: 'datetime', nullable: true })
  discount_end_date?: Date;

  @ApiProperty({ description: 'Creation date' })
  @CreateDateColumn()
  created_at: Date;

  @ApiProperty({ description: 'Last update date' })
  @UpdateDateColumn()
  updated_at: Date;

  // Computed properties for discount logic
  @ApiProperty({ description: 'Whether discount is currently active' })
  get isDiscountActive(): boolean {
    if (!this.discount_percentage || this.discount_percentage <= 0) {
      return false;
    }

    const now = new Date();
    const startValid = !this.discount_start_date || this.discount_start_date <= now;
    const endValid = !this.discount_end_date || this.discount_end_date >= now;

    return startValid && endValid;
  }

  @ApiProperty({ description: 'Effective price after discount (if applicable)' })
  get effectivePrice(): number {
    if (this.isDiscountActive) {
      const discountAmount = (Number(this.price) * Number(this.discount_percentage)) / 100;
      return Number((Number(this.price) - discountAmount).toFixed(2));
    }
    return Number(this.price);
  }

  @ApiProperty({ description: 'Discount amount in currency' })
  get discountAmount(): number {
    if (this.isDiscountActive) {
      return Number((Number(this.price) - this.effectivePrice).toFixed(2));
    }
    return 0;
  }
}
