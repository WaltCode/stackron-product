import { Test, TestingModule } from '@nestjs/testing';
import { RedisService } from './redis.service';

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

jest.mock('redis', () => ({
  createClient: jest.fn(() => mockRedisClient),
}));

describe('RedisService', () => {
  let service: RedisService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RedisService],
    }).compile();

    service = module.get<RedisService>(RedisService);
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
      mockRedisClient.isOpen = false;

      const result = await service.get('test-key');

      expect(result).toBeNull();
      expect(mockRedisClient.get).not.toHaveBeenCalled();
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
      mockRedisClient.isOpen = false;

      const result = await service.set('test-key', 'test-value');

      expect(result).toBe(false);
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
  });

  describe('isConnected', () => {
    it('should return connection status', () => {
      mockRedisClient.isOpen = true;
      expect(service.isConnected()).toBe(true);

      mockRedisClient.isOpen = false;
      expect(service.isConnected()).toBe(false);
    });
  });
});
