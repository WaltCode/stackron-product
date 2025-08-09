import { Test, TestingModule } from '@nestjs/testing';
import { CommonModule } from './common.module';
import { S3Service } from './services/s3.service';

describe('CommonModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [CommonModule],
    }).compile();
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

  it('should export S3Service', async () => {
    // Test that S3Service can be imported by other modules
    const testModule = await Test.createTestingModule({
      imports: [CommonModule],
      providers: [
        {
          provide: 'TEST_SERVICE',
          useFactory: (s3Service: S3Service) => {
            return { s3Service };
          },
          inject: [S3Service],
        },
      ],
    }).compile();

    const testService = testModule.get('TEST_SERVICE');
    expect(testService.s3Service).toBeDefined();
    expect(testService.s3Service).toBeInstanceOf(S3Service);

    await testModule.close();
  });
});
