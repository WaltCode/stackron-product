import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { createClient, RedisClientType } from 'redis';
import config from '../config';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: RedisClientType;
  private readonly logger = new Logger(RedisService.name);

  constructor() {
    this.client = createClient({
      url: config.redis.url || 'redis://localhost:6379',
      socket: {
        connectTimeout: 5000,
      },
    });

    this.client.on('error', (error) => {
      this.logger.error('Redis connection error:', error);
    });

    this.client.on('connect', () => {
      this.logger.log('Connected to Redis');
    });

    this.client.on('disconnect', () => {
      this.logger.warn('Disconnected from Redis');
    });
  }

  async onModuleInit() {
    try {
      await this.client.connect();
      this.logger.log('Redis service initialized');
    } catch (error) {
      this.logger.error('Failed to connect to Redis:', error);
      // Don't throw error to allow app to start without Redis
    }
  }

  async onModuleDestroy() {
    try {
      await this.client.disconnect();
      this.logger.log('Redis connection closed');
    } catch (error) {
      this.logger.error('Error closing Redis connection:', error);
    }
  }

  async get(key: string): Promise<string | null> {
    try {
      if (!this.client.isOpen) {
        this.logger.warn('Redis client not connected');
        return null;
      }
      return await this.client.get(key);
    } catch (error) {
      this.logger.error(`Error getting key ${key}:`, error);
      return null;
    }
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<boolean> {
    try {
      if (!this.client.isOpen) {
        this.logger.warn('Redis client not connected');
        return false;
      }

      if (ttlSeconds) {
        await this.client.setEx(key, ttlSeconds, value);
      } else {
        await this.client.set(key, value);
      }
      return true;
    } catch (error) {
      this.logger.error(`Error setting key ${key}:`, error);
      return false;
    }
  }

  async del(key: string): Promise<boolean> {
    try {
      if (!this.client.isOpen) {
        this.logger.warn('Redis client not connected');
        return false;
      }
      const result = await this.client.del(key);
      return result > 0;
    } catch (error) {
      this.logger.error(`Error deleting key ${key}:`, error);
      return false;
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      if (!this.client.isOpen) {
        this.logger.warn('Redis client not connected');
        return false;
      }
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      this.logger.error(`Error checking existence of key ${key}:`, error);
      return false;
    }
  }

  async getJson<T>(key: string): Promise<T | null> {
    try {
      const value = await this.get(key);
      if (!value) return null;
      return JSON.parse(value) as T;
    } catch (error) {
      this.logger.error(`Error parsing JSON for key ${key}:`, error);
      return null;
    }
  }

  async setJson<T>(key: string, value: T, ttlSeconds?: number): Promise<boolean> {
    try {
      const jsonString = JSON.stringify(value);
      return await this.set(key, jsonString, ttlSeconds);
    } catch (error) {
      this.logger.error(`Error setting JSON for key ${key}:`, error);
      return false;
    }
  }

  async increment(key: string, ttlSeconds?: number): Promise<number | null> {
    try {
      if (!this.client.isOpen) {
        this.logger.warn('Redis client not connected');
        return null;
      }

      const result = await this.client.incr(key);
      
      if (ttlSeconds && result === 1) {
        // Set TTL only on first increment
        await this.client.expire(key, ttlSeconds);
      }
      
      return result;
    } catch (error) {
      this.logger.error(`Error incrementing key ${key}:`, error);
      return null;
    }
  }

  async getTtl(key: string): Promise<number | null> {
    try {
      if (!this.client.isOpen) {
        this.logger.warn('Redis client not connected');
        return null;
      }
      return await this.client.ttl(key);
    } catch (error) {
      this.logger.error(`Error getting TTL for key ${key}:`, error);
      return null;
    }
  }

  async flushPattern(pattern: string): Promise<boolean> {
    try {
      if (!this.client.isOpen) {
        this.logger.warn('Redis client not connected');
        return false;
      }

      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(keys);
      }
      return true;
    } catch (error) {
      this.logger.error(`Error flushing pattern ${pattern}:`, error);
      return false;
    }
  }

  isConnected(): boolean {
    return this.client?.isOpen || false;
  }
}
