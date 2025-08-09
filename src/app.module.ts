import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerGuard } from '@nestjs/throttler';
import { DatabaseModule } from './database/database.module';
import { ProductsModule } from './products/products.module';
import { CartModule } from './cart/cart.module';
import { CommonModule } from './common/common.module';
import { RedisThrottlerStorageService } from './common/services/redis-throttler-storage.service';
import { CacheInterceptor } from './common/interceptors/cache.interceptor';

@Module({
  imports: [
    DatabaseModule,
    CommonModule,
    ThrottlerModule.forRootAsync({
      imports: [CommonModule],
      inject: [RedisThrottlerStorageService],
      useFactory: (storage: RedisThrottlerStorageService) => ({
        throttlers: [
          {
            name: 'short',
            ttl: 60000, // 1 minute
            limit: 100, // 100 requests per minute
          },
          {
            name: 'medium',
            ttl: 600000, // 10 minutes
            limit: 500, // 500 requests per 10 minutes
          },
          {
            name: 'long',
            ttl: 3600000, // 1 hour
            limit: 1000, // 1000 requests per hour
          },
        ],
        storage,
      }),
    }),
    ProductsModule,
    CartModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: CacheInterceptor,
    },
  ],
})
export class AppModule {}
