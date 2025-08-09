import { SetMetadata } from '@nestjs/common';

export const CACHE_KEY = 'cache';

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  keyPrefix?: string; // Prefix for cache key
  generateKey?: (...args: any[]) => string; // Custom key generator
}

export const Cache = (options: CacheOptions = {}) => SetMetadata(CACHE_KEY, options);
