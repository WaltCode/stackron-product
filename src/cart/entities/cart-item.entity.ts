import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Product } from '../../products/entities/product.entity';

@Entity('cart_items')
export class CartItem {
  @ApiProperty({ description: 'Cart item ID' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'Product ID' })
  @Column({ type: 'varchar' })
  product_id: string;

  @ApiProperty({ description: 'Quantity of the product in cart' })
  @Column({ type: 'integer' })
  quantity: number;

  @ApiProperty({ description: 'Creation date' })
  @CreateDateColumn()
  created_at: Date;

  @ApiProperty({ description: 'Product details', type: () => Product })
  @ManyToOne(() => Product, { eager: true })
  @JoinColumn({ name: 'product_id' })
  product: Product;
}
