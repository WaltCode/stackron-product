import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { RedisService } from '../services/redis.service';
import { CACHE_KEY, CacheOptions } from '../decorators/cache.decorator';

@Injectable()
export class CacheInterceptor implements NestInterceptor {
  private readonly logger = new Logger(CacheInterceptor.name);

  constructor(
    private readonly redisService: RedisService,
    private readonly reflector: Reflector,
  ) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const cacheOptions = this.reflector.get<CacheOptions>(CACHE_KEY, context.getHandler());
    
    if (!cacheOptions || !this.redisService.isConnected()) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    const cacheKey = this.generateCacheKey(request, cacheOptions);

    try {
      // Try to get cached result
      const cachedResult = await this.redisService.getJson(cacheKey);
      if (cachedResult !== null) {
        this.logger.debug(`Cache hit for key: ${cacheKey}`);
        return of(cachedResult);
      }

      this.logger.debug(`Cache miss for key: ${cacheKey}`);

      // Execute the method and cache the result
      return next.handle().pipe(
        tap(async (result) => {
          if (result !== undefined && result !== null) {
            const ttl = cacheOptions.ttl || 300; // Default 5 minutes
            await this.redisService.setJson(cacheKey, result, ttl);
            this.logger.debug(`Cached result for key: ${cacheKey} with TTL: ${ttl}s`);
          }
        }),
      );
    } catch (error) {
      this.logger.error(`Cache error for key ${cacheKey}:`, error);
      return next.handle();
    }
  }

  private generateCacheKey(request: any, options: CacheOptions): string {
    const { method, url, query, params } = request;
    
    if (options.generateKey) {
      return options.generateKey(method, url, query, params);
    }

    const prefix = options.keyPrefix || 'cache';
    const baseKey = `${prefix}:${method}:${url}`;
    
    // Include query parameters and route parameters in the key
    const queryString = Object.keys(query).length > 0 ? `:${JSON.stringify(query)}` : '';
    const paramsString = Object.keys(params).length > 0 ? `:${JSON.stringify(params)}` : '';
    
    return `${baseKey}${paramsString}${queryString}`;
  }
}
