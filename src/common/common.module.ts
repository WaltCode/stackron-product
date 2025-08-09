import { Module } from '@nestjs/common';
import { S3Service } from './services/s3.service';
import { RedisService } from './services/redis.service';
import { RedisThrottlerStorageService } from './services/redis-throttler-storage.service';
import { CacheInterceptor } from './interceptors/cache.interceptor';

@Module({
  providers: [S3Service, RedisService, RedisThrottlerStorageService, CacheInterceptor],
  exports: [S3Service, RedisService, RedisThrottlerStorageService, CacheInterceptor],
})
export class CommonModule {}
