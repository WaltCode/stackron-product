import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  BadRequestException,
} from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class ImageValidationInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const file = request.file;

    // If no file is uploaded, continue (image is optional)
    if (!file) {
      return next.handle();
    }

    // Validate file type
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        'Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.'
      );
    }

    // Validate file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new BadRequestException('File size too large. Maximum size is 5MB.');
    }

    // Validate file extension
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
      throw new BadRequestException(
        'Invalid file extension. Only .jpg, .jpeg, .png, .gif, .webp are allowed.'
      );
    }

    // If validation passes, continue with the request
    return next.handle();
  }
}
