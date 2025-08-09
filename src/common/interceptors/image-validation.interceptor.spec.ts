import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ExecutionContext, CallHandler } from '@nestjs/common';
import { ImageValidationInterceptor } from './image-validation.interceptor';
import { of } from 'rxjs';

describe('ImageValidationInterceptor', () => {
  let interceptor: ImageValidationInterceptor;
  let mockExecutionContext: ExecutionContext;
  let mockCallHandler: CallHandler;
  let mockGetRequest: jest.Mock;

  const mockValidFile = {
    originalname: 'test-image.jpg',
    mimetype: 'image/jpeg',
    size: 1024 * 1024, // 1MB
    buffer: Buffer.from('test image data'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ImageValidationInterceptor],
    }).compile();

    interceptor = module.get<ImageValidationInterceptor>(ImageValidationInterceptor);

    mockCallHandler = {
      handle: jest.fn().mockReturnValue(of('test')),
    };

    mockGetRequest = jest.fn().mockReturnValue({
      file: mockValidFile,
    });

    const mockHttpArgumentsHost = {
      getRequest: mockGetRequest,
    };

    mockExecutionContext = {
      switchToHttp: jest.fn().mockReturnValue(mockHttpArgumentsHost),
    } as any;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('intercept', () => {
    it('should allow valid image file', () => {
      const result = interceptor.intercept(mockExecutionContext, mockCallHandler);

      expect(mockCallHandler.handle).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should allow request when no file is uploaded', () => {
      mockGetRequest.mockReturnValue({
        file: undefined,
      });

      const result = interceptor.intercept(mockExecutionContext, mockCallHandler);

      expect(mockCallHandler.handle).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should throw BadRequestException for invalid file type', () => {
      const invalidFile = {
        ...mockValidFile,
        mimetype: 'text/plain',
      };

      mockGetRequest.mockReturnValue({
        file: invalidFile,
      });

      expect(() => {
        interceptor.intercept(mockExecutionContext, mockCallHandler);
      }).toThrow(BadRequestException);

      expect(mockCallHandler.handle).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException for file too large', () => {
      const largeFile = {
        ...mockValidFile,
        size: 6 * 1024 * 1024, // 6MB
      };

      mockGetRequest.mockReturnValue({
        file: largeFile,
      });

      expect(() => {
        interceptor.intercept(mockExecutionContext, mockCallHandler);
      }).toThrow(BadRequestException);

      expect(mockCallHandler.handle).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException for invalid file extension', () => {
      const invalidExtensionFile = {
        ...mockValidFile,
        originalname: 'test-file.txt',
        mimetype: 'image/jpeg', // Valid MIME type but invalid extension
      };

      mockGetRequest.mockReturnValue({
        file: invalidExtensionFile,
      });

      expect(() => {
        interceptor.intercept(mockExecutionContext, mockCallHandler);
      }).toThrow(BadRequestException);

      expect(mockCallHandler.handle).not.toHaveBeenCalled();
    });

    it('should allow PNG files', () => {
      const pngFile = {
        ...mockValidFile,
        originalname: 'test-image.png',
        mimetype: 'image/png',
      };

      mockGetRequest.mockReturnValue({
        file: pngFile,
      });

      const result = interceptor.intercept(mockExecutionContext, mockCallHandler);

      expect(mockCallHandler.handle).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should allow WebP files', () => {
      const webpFile = {
        ...mockValidFile,
        originalname: 'test-image.webp',
        mimetype: 'image/webp',
      };

      mockGetRequest.mockReturnValue({
        file: webpFile,
      });

      const result = interceptor.intercept(mockExecutionContext, mockCallHandler);

      expect(mockCallHandler.handle).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should allow GIF files', () => {
      const gifFile = {
        ...mockValidFile,
        originalname: 'test-image.gif',
        mimetype: 'image/gif',
      };

      mockGetRequest.mockReturnValue({
        file: gifFile,
      });

      const result = interceptor.intercept(mockExecutionContext, mockCallHandler);

      expect(mockCallHandler.handle).toHaveBeenCalled();
      expect(result).toBeDefined();
    });
  });
});
