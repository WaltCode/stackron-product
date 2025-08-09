import { Test, TestingModule } from '@nestjs/testing';

// Mock Redis client
const mockRedisClient = {
  connect: jest.fn(),
  disconnect: jest.fn(),
  get: jest.fn(),
  set: jest.fn(),
  setEx: jest.fn(),
  del: jest.fn(),
  exists: jest.fn(),
  incr: jest.fn(),
  expire: jest.fn(),
  ttl: jest.fn(),
  keys: jest.fn(),
  isOpen: true,
  on: jest.fn(),
};

// Mock the redis module before importing RedisService
jest.mock('redis', () => ({
  createClient: jest.fn(() => mockRedisClient),
}));

// Import RedisService after mocking
import { RedisService } from './redis.service';

describe('RedisService', () => {
  let service: RedisService;

  beforeEach(async () => {
    // Reset all mocks
    jest.clearAllMocks();

    // Reset isOpen to default state
    mockRedisClient.isOpen = true;

    const module: TestingModule = await Test.createTestingModule({
      providers: [RedisService],
    }).compile();

    service = module.get<RedisService>(RedisService);
  });

  afterEach(() => {
    // Reset isOpen to default state after each test
    mockRedisClient.isOpen = true;
    jest.clearAllMocks();
  });

  describe('onModuleInit', () => {
    it('should connect to Redis successfully', async () => {
      mockRedisClient.connect.mockResolvedValue(undefined);

      await service.onModuleInit();

      expect(mockRedisClient.connect).toHaveBeenCalled();
    });

    it('should handle connection errors gracefully', async () => {
      mockRedisClient.connect.mockRejectedValue(new Error('Connection failed'));

      // Should not throw
      await expect(service.onModuleInit()).resolves.toBeUndefined();
    });
  });

  describe('get', () => {
    it('should get value from Redis', async () => {
      const key = 'test-key';
      const value = 'test-value';
      mockRedisClient.get.mockResolvedValue(value);

      const result = await service.get(key);

      expect(mockRedisClient.get).toHaveBeenCalledWith(key);
      expect(result).toBe(value);
    });

    it('should return null when Redis is not connected', async () => {
      // Temporarily set isOpen to false
      const originalIsOpen = mockRedisClient.isOpen;
      mockRedisClient.isOpen = false;

      const result = await service.get('test-key');

      expect(result).toBeNull();
      expect(mockRedisClient.get).not.toHaveBeenCalled();

      // Restore original state
      mockRedisClient.isOpen = originalIsOpen;
    });

    it('should handle errors gracefully', async () => {
      mockRedisClient.get.mockRejectedValue(new Error('Redis error'));

      const result = await service.get('test-key');

      expect(result).toBeNull();
    });
  });

  describe('set', () => {
    it('should set value in Redis without TTL', async () => {
      const key = 'test-key';
      const value = 'test-value';
      mockRedisClient.set.mockResolvedValue('OK');

      const result = await service.set(key, value);

      expect(mockRedisClient.set).toHaveBeenCalledWith(key, value);
      expect(result).toBe(true);
    });

    it('should set value in Redis with TTL', async () => {
      const key = 'test-key';
      const value = 'test-value';
      const ttl = 300;
      mockRedisClient.setEx.mockResolvedValue('OK');

      const result = await service.set(key, value, ttl);

      expect(mockRedisClient.setEx).toHaveBeenCalledWith(key, ttl, value);
      expect(result).toBe(true);
    });

    it('should return false when Redis is not connected', async () => {
      // Temporarily set isOpen to false
      const originalIsOpen = mockRedisClient.isOpen;
      mockRedisClient.isOpen = false;

      const result = await service.set('test-key', 'test-value');

      expect(result).toBe(false);
      expect(mockRedisClient.set).not.toHaveBeenCalled();
      expect(mockRedisClient.setEx).not.toHaveBeenCalled();

      // Restore original state
      mockRedisClient.isOpen = originalIsOpen;
    });
  });

  describe('getJson', () => {
    it('should get and parse JSON value', async () => {
      const key = 'test-key';
      const value = { test: 'data' };
      mockRedisClient.get.mockResolvedValue(JSON.stringify(value));

      const result = await service.getJson(key);

      expect(result).toEqual(value);
    });

    it('should return null for invalid JSON', async () => {
      const key = 'test-key';
      mockRedisClient.get.mockResolvedValue('invalid-json');

      const result = await service.getJson(key);

      expect(result).toBeNull();
    });
  });

  describe('setJson', () => {
    it('should stringify and set JSON value', async () => {
      const key = 'test-key';
      const value = { test: 'data' };
      mockRedisClient.set.mockResolvedValue('OK');

      const result = await service.setJson(key, value);

      expect(mockRedisClient.set).toHaveBeenCalledWith(key, JSON.stringify(value));
      expect(result).toBe(true);
    });

    it('should handle JSON stringify errors', async () => {
      const key = 'test-key';
      const circularValue: any = {};
      circularValue.self = circularValue; // Create circular reference

      const result = await service.setJson(key, circularValue);

      expect(result).toBe(false);
    });
  });

  describe('del', () => {
    it('should delete key and return true when successful', async () => {
      const key = 'test-key';
      mockRedisClient.del.mockResolvedValue(1);

      const result = await service.del(key);

      expect(mockRedisClient.del).toHaveBeenCalledWith(key);
      expect(result).toBe(true);
    });

    it('should return false when key does not exist', async () => {
      const key = 'test-key';
      mockRedisClient.del.mockResolvedValue(0);

      const result = await service.del(key);

      expect(mockRedisClient.del).toHaveBeenCalledWith(key);
      expect(result).toBe(false);
    });

    it('should return false when Redis is not connected', async () => {
      const originalIsOpen = mockRedisClient.isOpen;
      mockRedisClient.isOpen = false;

      const result = await service.del('test-key');

      expect(result).toBe(false);
      expect(mockRedisClient.del).not.toHaveBeenCalled();

      mockRedisClient.isOpen = originalIsOpen;
    });
  });

  describe('exists', () => {
    it('should return true when key exists', async () => {
      const key = 'test-key';
      mockRedisClient.exists.mockResolvedValue(1);

      const result = await service.exists(key);

      expect(mockRedisClient.exists).toHaveBeenCalledWith(key);
      expect(result).toBe(true);
    });

    it('should return false when key does not exist', async () => {
      const key = 'test-key';
      mockRedisClient.exists.mockResolvedValue(0);

      const result = await service.exists(key);

      expect(mockRedisClient.exists).toHaveBeenCalledWith(key);
      expect(result).toBe(false);
    });
  });

  describe('getTtl', () => {
    it('should return TTL value', async () => {
      const key = 'test-key';
      const ttl = 300;
      mockRedisClient.ttl.mockResolvedValue(ttl);

      const result = await service.getTtl(key);

      expect(mockRedisClient.ttl).toHaveBeenCalledWith(key);
      expect(result).toBe(ttl);
    });

    it('should return null when Redis is not connected', async () => {
      const originalIsOpen = mockRedisClient.isOpen;
      mockRedisClient.isOpen = false;

      const result = await service.getTtl('test-key');

      expect(result).toBeNull();
      expect(mockRedisClient.ttl).not.toHaveBeenCalled();

      mockRedisClient.isOpen = originalIsOpen;
    });
  });

  describe('increment', () => {
    it('should increment value and set TTL on first increment', async () => {
      const key = 'test-key';
      const ttl = 300;
      mockRedisClient.incr.mockResolvedValue(1);
      mockRedisClient.expire.mockResolvedValue(1);

      const result = await service.increment(key, ttl);

      expect(mockRedisClient.incr).toHaveBeenCalledWith(key);
      expect(mockRedisClient.expire).toHaveBeenCalledWith(key, ttl);
      expect(result).toBe(1);
    });

    it('should increment value without setting TTL on subsequent increments', async () => {
      const key = 'test-key';
      const ttl = 300;
      mockRedisClient.incr.mockResolvedValue(2);

      const result = await service.increment(key, ttl);

      expect(mockRedisClient.incr).toHaveBeenCalledWith(key);
      expect(mockRedisClient.expire).not.toHaveBeenCalled();
      expect(result).toBe(2);
    });

    it('should return null when Redis is not connected', async () => {
      const originalIsOpen = mockRedisClient.isOpen;
      mockRedisClient.isOpen = false;

      const result = await service.increment('test-key', 300);

      expect(result).toBeNull();
      expect(mockRedisClient.incr).not.toHaveBeenCalled();

      mockRedisClient.isOpen = originalIsOpen;
    });

    it('should handle errors gracefully', async () => {
      mockRedisClient.incr.mockRejectedValue(new Error('Redis error'));

      const result = await service.increment('test-key', 300);

      expect(result).toBeNull();
    });
  });

  describe('flushPattern', () => {
    it('should delete keys matching pattern', async () => {
      const pattern = 'test:*';
      const keys = ['test:1', 'test:2'];
      mockRedisClient.keys.mockResolvedValue(keys);
      mockRedisClient.del.mockResolvedValue(2);

      const result = await service.flushPattern(pattern);

      expect(mockRedisClient.keys).toHaveBeenCalledWith(pattern);
      expect(mockRedisClient.del).toHaveBeenCalledWith(keys);
      expect(result).toBe(true);
    });

    it('should handle empty key list', async () => {
      const pattern = 'test:*';
      mockRedisClient.keys.mockResolvedValue([]);

      const result = await service.flushPattern(pattern);

      expect(mockRedisClient.keys).toHaveBeenCalledWith(pattern);
      expect(mockRedisClient.del).not.toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should return false when Redis is not connected', async () => {
      const originalIsOpen = mockRedisClient.isOpen;
      mockRedisClient.isOpen = false;

      const result = await service.flushPattern('test:*');

      expect(result).toBe(false);
      expect(mockRedisClient.keys).not.toHaveBeenCalled();

      mockRedisClient.isOpen = originalIsOpen;
    });

    it('should handle errors gracefully', async () => {
      mockRedisClient.keys.mockRejectedValue(new Error('Redis error'));

      const result = await service.flushPattern('test:*');

      expect(result).toBe(false);
    });
  });

  describe('isConnected', () => {
    it('should return true when Redis is connected', () => {
      mockRedisClient.isOpen = true;
      expect(service.isConnected()).toBe(true);
    });

    it('should return false when Redis is not connected', () => {
      const originalIsOpen = mockRedisClient.isOpen;
      mockRedisClient.isOpen = false;

      expect(service.isConnected()).toBe(false);

      // Restore original state
      mockRedisClient.isOpen = originalIsOpen;
    });

    it('should return false when client is undefined', () => {
      // This tests the fallback behavior
      const originalIsOpen = mockRedisClient.isOpen;
      mockRedisClient.isOpen = undefined;

      expect(service.isConnected()).toBe(false);

      // Restore original state
      mockRedisClient.isOpen = originalIsOpen;
    });
  });
});
