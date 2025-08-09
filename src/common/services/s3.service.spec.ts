import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { S3Service } from './s3.service';

// Mock AWS SDK
jest.mock('@aws-sdk/client-s3', () => ({
  S3Client: jest.fn().mockImplementation(() => ({
    send: jest.fn(),
  })),
  PutObjectCommand: jest.fn(),
  DeleteObjectCommand: jest.fn(),
}));

describe('S3Service', () => {
  let service: S3Service;
  let mockS3Client: any;

  const mockFile = {
    originalname: 'test-image.jpg',
    mimetype: 'image/jpeg',
    size: 1024 * 1024, // 1MB
    buffer: Buffer.from('test image data'),
  } as any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [S3Service],
    }).compile();

    service = module.get<S3Service>(S3Service);
    mockS3Client = (service as any).s3Client;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('uploadFile', () => {
    it('should upload a valid image file', async () => {
      mockS3Client.send.mockResolvedValue({});

      const result = await service.uploadFile(mockFile, 'products');

      expect(result).toContain('https://');
      expect(result).toContain('.jpg');
      expect(mockS3Client.send).toHaveBeenCalled();
    });

    // Note: File validation is now handled by ImageValidationInterceptor in the controller

    it('should throw BadRequestException when no file provided', async () => {
      await expect(service.uploadFile(null as any)).rejects.toThrow(BadRequestException);
      expect(mockS3Client.send).not.toHaveBeenCalled();
    });

    it('should handle S3 upload errors', async () => {
      mockS3Client.send.mockRejectedValue(new Error('S3 Error'));

      await expect(service.uploadFile(mockFile)).rejects.toThrow(BadRequestException);
    });
  });

  describe('deleteFile', () => {
    it('should delete file from S3', async () => {
      mockS3Client.send.mockResolvedValue({});
      const fileUrl = 'https://bucket.s3.region.amazonaws.com/products/test.jpg';

      await service.deleteFile(fileUrl);

      expect(mockS3Client.send).toHaveBeenCalled();
    });

    it('should handle delete errors gracefully', async () => {
      mockS3Client.send.mockRejectedValue(new Error('Delete Error'));
      const fileUrl = 'https://bucket.s3.region.amazonaws.com/products/test.jpg';

      // Should not throw error
      await expect(service.deleteFile(fileUrl)).resolves.toBeUndefined();
    });
  });
});
