import { Injectable } from '@nestjs/common';
import { ThrottlerStorage } from '@nestjs/throttler';
import { RedisService } from './redis.service';

@Injectable()
export class RedisThrottlerStorageService implements ThrottlerStorage {
  constructor(private readonly redisService: RedisService) {}

  async increment(key: string, ttl: number): Promise<{ totalHits: number; timeToExpire: number }> {
    const redisKey = `throttle:${key}`;
    
    try {
      if (!this.redisService.isConnected()) {
        // Fallback to in-memory behavior if Redis is not available
        return { totalHits: 1, timeToExpire: ttl * 1000 };
      }

      const totalHits = await this.redisService.increment(redisKey, ttl);
      const timeToExpire = await this.redisService.getTtl(redisKey);
      
      return {
        totalHits: totalHits || 1,
        timeToExpire: (timeToExpire || ttl) * 1000, // Convert to milliseconds
      };
    } catch (error) {
      // Fallback behavior on error
      return { totalHits: 1, timeToExpire: ttl * 1000 };
    }
  }
}
