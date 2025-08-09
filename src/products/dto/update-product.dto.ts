import { PartialType } from '@nestjs/swagger';
import { CreateProductDto } from './create-product.dto';

export class UpdateProductDto extends PartialType(CreateProductDto) {
  // Note: Image file will be handled separately via multipart/form-data upload
  // Existing image_url will be replaced if a new image file is uploaded
}
