import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { ParseUUIDPipe } from './parse-uuid.pipe';

describe('ParseUUIDPipe', () => {
  let pipe: ParseUUIDPipe;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ParseUUIDPipe],
    }).compile();

    pipe = module.get<ParseUUIDPipe>(ParseUUIDPipe);
  });

  describe('transform', () => {
    it('should return valid UUID string', () => {
      const validUUID = '123e4567-e89b-12d3-a456-426614174000';

      const result = pipe.transform(validUUID, { type: 'param' });

      expect(result).toBe(validUUID);
    });

    it('should throw BadRequestException for invalid UUID format', () => {
      const invalidUUID = 'invalid-uuid';

      expect(() => {
        pipe.transform(invalidUUID, { type: 'param' });
      }).toThrow(BadRequestException);
    });

    it('should throw BadRequestException for empty string', () => {
      expect(() => {
        pipe.transform('', { type: 'param' });
      }).toThrow(BadRequestException);
    });

    it('should throw BadRequestException for whitespace-only string', () => {
      expect(() => {
        pipe.transform('   ', { type: 'param' });
      }).toThrow(BadRequestException);
    });

    it('should throw BadRequestException for null value', () => {
      expect(() => {
        pipe.transform(null, { type: 'param' });
      }).toThrow(BadRequestException);
    });

    it('should throw BadRequestException for undefined value', () => {
      expect(() => {
        pipe.transform(undefined, { type: 'param' });
      }).toThrow(BadRequestException);
    });

    it('should throw BadRequestException for non-string value', () => {
      expect(() => {
        pipe.transform(123, { type: 'param' });
      }).toThrow(BadRequestException);
    });

    it('should accept different valid UUID formats', () => {
      const validUUIDs = [
        '123e4567-e89b-12d3-a456-426614174000',
        'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        '00000000-0000-0000-0000-000000000000',
        'ffffffff-ffff-ffff-ffff-ffffffffffff',
      ];

      validUUIDs.forEach((uuid) => {
        expect(pipe.transform(uuid, { type: 'param' })).toBe(uuid);
      });
    });

    it('should reject invalid UUID patterns', () => {
      const invalidUUIDs = [
        '123e4567-e89b-12d3-a456-42661417400', // too short
        '123e4567-e89b-12d3-a456-4266141740000', // too long
        '123e4567-e89b-12d3-a456-42661417400g', // invalid character
        '123e4567e89b12d3a456426614174000', // missing hyphens
        '123e4567-e89b-12d3-a456', // incomplete
      ];

      invalidUUIDs.forEach((uuid) => {
        expect(() => {
          pipe.transform(uuid, { type: 'param' });
        }).toThrow(BadRequestException);
      });
    });
  });
});
