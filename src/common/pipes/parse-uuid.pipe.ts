import { PipeTransform, Injectable, ArgumentMetadata, BadRequestException } from '@nestjs/common';
import { validate as isUUID } from 'uuid';

@Injectable()
export class ParseUUIDPipe implements PipeTransform<any, string> {
  transform(value: any, _metadata: ArgumentMetadata): string {
    // Check if value is a string
    if (typeof value !== 'string') {
      throw new BadRequestException(
        `Invalid UUID format: expected string, received ${typeof value}`,
      );
    }

    // Check if it's empty
    if (!value || value.trim() === '') {
      throw new BadRequestException('UUID cannot be empty');
    }

    // Validate UUID format
    if (!isUUID(value)) {
      throw new BadRequestException(`Invalid UUID format: ${value}`);
    }

    return value;
  }
}
