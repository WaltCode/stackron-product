import { Test, TestingModule } from '@nestjs/testing';
import { CommonModule } from './common.module';
import { S3Service } from './services/s3.service';
import { RedisService } from './services/redis.service';
import { RedisThrottlerStorageService } from './services/redis-throttler-storage.service';
import { CacheInterceptor } from './interceptors/cache.interceptor';

describe('CommonModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [CommonModule],
    })
      .overrideProvider(RedisService)
      .useValue({
        getJson: jest.fn(),
        setJson: jest.fn(),
        del: jest.fn(),
        isConnected: jest.fn().mockReturnValue(false),
      })
      .compile();
  });

  afterEach(async () => {
    await module.close();
  });

  it('should be defined', () => {
    expect(module).toBeDefined();
  });

  it('should provide S3Service', () => {
    const s3Service = module.get<S3Service>(S3Service);
    expect(s3Service).toBeDefined();
    expect(s3Service).toBeInstanceOf(S3Service);
  });

  it('should provide RedisService', () => {
    const redisService = module.get<RedisService>(RedisService);
    expect(redisService).toBeDefined();
  });

  it('should provide RedisThrottlerStorageService', () => {
    const throttlerService = module.get<RedisThrottlerStorageService>(RedisThrottlerStorageService);
    expect(throttlerService).toBeDefined();
    expect(throttlerService).toBeInstanceOf(RedisThrottlerStorageService);
  });

  it('should provide CacheInterceptor', () => {
    const cacheInterceptor = module.get<CacheInterceptor>(CacheInterceptor);
    expect(cacheInterceptor).toBeDefined();
    expect(cacheInterceptor).toBeInstanceOf(CacheInterceptor);
  });

  it('should export all services', async () => {
    // Test that all services can be imported by other modules
    const testModule = await Test.createTestingModule({
      imports: [CommonModule],
      providers: [
        {
          provide: 'TEST_SERVICE',
          useFactory: (
            s3Service: S3Service,
            redisService: RedisService,
            throttlerService: RedisThrottlerStorageService,
            cacheInterceptor: CacheInterceptor,
          ) => {
            return { s3Service, redisService, throttlerService, cacheInterceptor };
          },
          inject: [S3Service, RedisService, RedisThrottlerStorageService, CacheInterceptor],
        },
      ],
    })
      .overrideProvider(RedisService)
      .useValue({
        getJson: jest.fn(),
        setJson: jest.fn(),
        del: jest.fn(),
        isConnected: jest.fn().mockReturnValue(false),
      })
      .compile();

    const testService = testModule.get('TEST_SERVICE');
    expect(testService.s3Service).toBeDefined();
    expect(testService.s3Service).toBeInstanceOf(S3Service);
    expect(testService.redisService).toBeDefined();
    expect(testService.throttlerService).toBeDefined();
    expect(testService.throttlerService).toBeInstanceOf(RedisThrottlerStorageService);
    expect(testService.cacheInterceptor).toBeDefined();
    expect(testService.cacheInterceptor).toBeInstanceOf(CacheInterceptor);

    await testModule.close();
  });
});
