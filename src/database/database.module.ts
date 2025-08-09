import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from '../products/entities/product.entity';
import { CartItem } from '../cart/entities/cart-item.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: 'stackron.db',
      entities: [Product, CartItem],
      synchronize: true, // Only for development
      logging: true,
    }),
  ],
})
export class DatabaseModule {}
