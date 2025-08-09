import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, CallHandler } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { of } from 'rxjs';
import { CacheInterceptor } from './cache.interceptor';
import { RedisService } from '../services/redis.service';

describe('CacheInterceptor', () => {
  let interceptor: CacheInterceptor;
  let redisService: RedisService;
  let mockExecutionContext: ExecutionContext;
  let mockCallHandler: CallHandler;
  let mockGetRequest: jest.Mock;

  const mockRedisService = {
    isConnected: jest.fn(),
    getJson: jest.fn(),
    setJson: jest.fn(),
  };

  const mockReflector = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CacheInterceptor,
        { provide: RedisService, useValue: mockRedisService },
        { provide: Reflector, useValue: mockReflector },
      ],
    }).compile();

    interceptor = module.get<CacheInterceptor>(CacheInterceptor);
    redisService = module.get<RedisService>(RedisService);

    mockCallHandler = {
      handle: jest.fn(() => of('test-result')),
    };

    const mockRequest = {
      method: 'GET',
      url: '/test',
      query: {},
      params: {},
    };

    mockGetRequest = jest.fn().mockReturnValue(mockRequest);

    mockExecutionContext = {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: mockGetRequest,
      }),
      getHandler: jest.fn(),
    } as any;

    jest.clearAllMocks();
  });

  describe('intercept', () => {
    it('should bypass cache when no cache options are set', async () => {
      mockReflector.get.mockReturnValue(undefined);

      await interceptor.intercept(mockExecutionContext, mockCallHandler);

      expect(mockCallHandler.handle).toHaveBeenCalled();
      expect(redisService.getJson).not.toHaveBeenCalled();
    });

    it('should bypass cache when Redis is not connected', async () => {
      mockReflector.get.mockReturnValue({ ttl: 300 });
      mockRedisService.isConnected.mockReturnValue(false);

      await interceptor.intercept(mockExecutionContext, mockCallHandler);

      expect(mockCallHandler.handle).toHaveBeenCalled();
      expect(redisService.getJson).not.toHaveBeenCalled();
    });

    it('should return cached result when cache hit', async () => {
      const cacheOptions = { ttl: 300, keyPrefix: 'test' };
      const cachedResult = { data: 'cached' };

      mockReflector.get.mockReturnValue(cacheOptions);
      mockRedisService.isConnected.mockReturnValue(true);
      mockRedisService.getJson.mockResolvedValue(cachedResult);

      const result = await interceptor.intercept(mockExecutionContext, mockCallHandler);

      expect(redisService.getJson).toHaveBeenCalled();
      expect(mockCallHandler.handle).not.toHaveBeenCalled();

      result.subscribe((value) => {
        expect(value).toEqual(cachedResult);
      });
    });

    it('should execute method and cache result on cache miss', async () => {
      const cacheOptions = { ttl: 300, keyPrefix: 'test' };
      const methodResult = { data: 'fresh' };

      mockReflector.get.mockReturnValue(cacheOptions);
      mockRedisService.isConnected.mockReturnValue(true);
      mockRedisService.getJson.mockResolvedValue(null);
      (mockCallHandler.handle as jest.Mock).mockReturnValue(of(methodResult));

      const result = await interceptor.intercept(mockExecutionContext, mockCallHandler);

      expect(redisService.getJson).toHaveBeenCalled();
      expect(mockCallHandler.handle).toHaveBeenCalled();

      result.subscribe((value) => {
        expect(value).toEqual(methodResult);
        // Verify caching happens asynchronously
        setTimeout(() => {
          expect(redisService.setJson).toHaveBeenCalledWith(expect.any(String), methodResult, 300);
        }, 0);
      });
    });

    it('should handle cache errors gracefully', async () => {
      const cacheOptions = { ttl: 300 };
      mockReflector.get.mockReturnValue(cacheOptions);
      mockRedisService.isConnected.mockReturnValue(true);
      mockRedisService.getJson.mockRejectedValue(new Error('Cache error'));

      await interceptor.intercept(mockExecutionContext, mockCallHandler);

      expect(mockCallHandler.handle).toHaveBeenCalled();
    });

    it('should generate cache key with query parameters', async () => {
      const cacheOptions = { ttl: 300, keyPrefix: 'test' };
      mockReflector.get.mockReturnValue(cacheOptions);
      mockRedisService.isConnected.mockReturnValue(true);
      mockRedisService.getJson.mockResolvedValue(null);

      const mockRequest = {
        method: 'GET',
        url: '/test',
        query: { page: 1, limit: 10 },
        params: { id: '123' },
      };

      mockGetRequest.mockReturnValue(mockRequest);

      await interceptor.intercept(mockExecutionContext, mockCallHandler);

      expect(redisService.getJson).toHaveBeenCalledWith(expect.stringContaining('test:GET:/test:'));
    });

    it('should use custom key generator when provided', async () => {
      const customKey = 'custom-cache-key';
      const cacheOptions = {
        ttl: 300,
        generateKey: jest.fn().mockReturnValue(customKey),
      };

      mockReflector.get.mockReturnValue(cacheOptions);
      mockRedisService.isConnected.mockReturnValue(true);
      mockRedisService.getJson.mockResolvedValue(null);

      await interceptor.intercept(mockExecutionContext, mockCallHandler);

      expect(cacheOptions.generateKey).toHaveBeenCalled();
      expect(redisService.getJson).toHaveBeenCalledWith(customKey);
    });

    it('should not cache null or undefined results', async () => {
      const cacheOptions = { ttl: 300 };
      mockReflector.get.mockReturnValue(cacheOptions);
      mockRedisService.isConnected.mockReturnValue(true);
      mockRedisService.getJson.mockResolvedValue(null);
      (mockCallHandler.handle as jest.Mock).mockReturnValue(of(null));

      const result = await interceptor.intercept(mockExecutionContext, mockCallHandler);

      result.subscribe(() => {
        setTimeout(() => {
          expect(redisService.setJson).not.toHaveBeenCalled();
        }, 0);
      });
    });
  });
});
