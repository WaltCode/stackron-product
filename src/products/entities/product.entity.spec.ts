import { Product } from './product.entity';

describe('Product Entity', () => {
  let product: Product;

  beforeEach(() => {
    product = new Product();
    product.id = '123e4567-e89b-12d3-a456-426614174000';
    product.name = 'Test Product';
    product.description = 'Test Description';
    product.price = 100;
    product.stock_quantity = 10;
    product.created_at = new Date();
    product.updated_at = new Date();
  });

  describe('isDiscountActive', () => {
    it('should return false when no discount percentage is set', () => {
      product.discount_percentage = null;
      expect(product.isDiscountActive).toBe(false);
    });

    it('should return false when discount percentage is 0', () => {
      product.discount_percentage = 0;
      expect(product.isDiscountActive).toBe(false);
    });

    it('should return true when discount is valid and within date range', () => {
      product.discount_percentage = 20;
      product.discount_start_date = new Date('2020-01-01');
      product.discount_end_date = new Date('2030-12-31');
      expect(product.isDiscountActive).toBe(true);
    });

    it('should return false when current date is before start date', () => {
      product.discount_percentage = 20;
      product.discount_start_date = new Date('2030-01-01');
      product.discount_end_date = new Date('2030-12-31');
      expect(product.isDiscountActive).toBe(false);
    });

    it('should return false when current date is after end date', () => {
      product.discount_percentage = 20;
      product.discount_start_date = new Date('2020-01-01');
      product.discount_end_date = new Date('2020-12-31');
      expect(product.isDiscountActive).toBe(false);
    });

    it('should return true when only start date is set and current date is after', () => {
      product.discount_percentage = 20;
      product.discount_start_date = new Date('2020-01-01');
      product.discount_end_date = null;
      expect(product.isDiscountActive).toBe(true);
    });

    it('should return true when only end date is set and current date is before', () => {
      product.discount_percentage = 20;
      product.discount_start_date = null;
      product.discount_end_date = new Date('2030-12-31');
      expect(product.isDiscountActive).toBe(true);
    });
  });

  describe('effectivePrice', () => {
    it('should return original price when no discount is active', () => {
      product.discount_percentage = null;
      expect(product.effectivePrice).toBe(100);
    });

    it('should return discounted price when discount is active', () => {
      product.discount_percentage = 20;
      product.discount_start_date = new Date('2020-01-01');
      product.discount_end_date = new Date('2030-12-31');
      expect(product.effectivePrice).toBe(80);
    });

    it('should return original price when discount is not active due to dates', () => {
      product.discount_percentage = 20;
      product.discount_start_date = new Date('2030-01-01');
      product.discount_end_date = new Date('2030-12-31');
      expect(product.effectivePrice).toBe(100);
    });

    it('should handle decimal discount percentages correctly', () => {
      product.discount_percentage = 15.5;
      product.discount_start_date = new Date('2020-01-01');
      product.discount_end_date = new Date('2030-12-31');
      expect(product.effectivePrice).toBe(84.5);
    });
  });

  describe('discountAmount', () => {
    it('should return 0 when no discount is active', () => {
      product.discount_percentage = null;
      expect(product.discountAmount).toBe(0);
    });

    it('should return correct discount amount when discount is active', () => {
      product.discount_percentage = 20;
      product.discount_start_date = new Date('2020-01-01');
      product.discount_end_date = new Date('2030-12-31');
      expect(product.discountAmount).toBe(20);
    });

    it('should handle decimal discount amounts correctly', () => {
      product.discount_percentage = 15.5;
      product.discount_start_date = new Date('2020-01-01');
      product.discount_end_date = new Date('2030-12-31');
      expect(product.discountAmount).toBe(15.5);
    });
  });
});
