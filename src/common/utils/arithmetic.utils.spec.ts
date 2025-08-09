import {
  toPreciseDecimal,
  safeAdd,
  safeSubtract,
  safeMultiply,
  safeDivide,
  calculatePercentage,
  applyDiscount,
  calculateLineTotal,
  sumArray,
  isValidMonetaryAmount,
  formatCurrency,
} from './arithmetic.utils';

describe('ArithmeticUtils', () => {
  describe('toPreciseDecimal', () => {
    it('should round numbers to 2 decimal places by default', () => {
      expect(toPreciseDecimal(10.555)).toBe(10.56);
      expect(toPreciseDecimal(10.554)).toBe(10.55);
      expect(toPreciseDecimal(10.1)).toBe(10.1);
    });

    it('should handle string inputs', () => {
      expect(toPreciseDecimal('10.555')).toBe(10.56);
      expect(toPreciseDecimal('10.1')).toBe(10.1);
    });

    it('should handle custom decimal places', () => {
      expect(toPreciseDecimal(10.5555, 3)).toBe(10.556);
      expect(toPreciseDecimal(10.5554, 3)).toBe(10.555);
    });

    it('should handle invalid inputs', () => {
      expect(toPreciseDecimal('invalid')).toBe(0);
      expect(toPreciseDecimal(NaN)).toBe(0);
    });
  });

  describe('safeAdd', () => {
    it('should add numbers correctly', () => {
      expect(safeAdd(10.1, 20.2)).toBe(30.3);
      expect(safeAdd(0.1, 0.2)).toBe(0.3); // Floating point precision test
    });

    it('should handle multiple numbers', () => {
      expect(safeAdd(1, 2, 3, 4, 5)).toBe(15);
      expect(safeAdd(10.5, 20.25, 5.75)).toBe(36.5);
    });

    it('should handle string inputs', () => {
      expect(safeAdd('10.5', '20.25')).toBe(30.75);
      expect(safeAdd(10, '20.5')).toBe(30.5);
    });

    it('should handle invalid inputs', () => {
      expect(safeAdd(10, 'invalid', 20)).toBe(30);
      expect(safeAdd(NaN, 10, 20)).toBe(30);
    });
  });

  describe('safeSubtract', () => {
    it('should subtract numbers correctly', () => {
      expect(safeSubtract(30.3, 10.1)).toBe(20.2);
      expect(safeSubtract(0.3, 0.1)).toBe(0.2); // Floating point precision test
    });

    it('should handle string inputs', () => {
      expect(safeSubtract('30.75', '10.25')).toBe(20.5);
    });

    it('should handle invalid inputs', () => {
      expect(safeSubtract('invalid', 10)).toBe(0);
      expect(safeSubtract(10, 'invalid')).toBe(0);
    });
  });

  describe('safeMultiply', () => {
    it('should multiply numbers correctly', () => {
      expect(safeMultiply(10.5, 2)).toBe(21);
      expect(safeMultiply(0.1, 3)).toBe(0.3);
    });

    it('should handle string inputs', () => {
      expect(safeMultiply('10.5', '2')).toBe(21);
    });

    it('should handle invalid inputs', () => {
      expect(safeMultiply('invalid', 10)).toBe(0);
      expect(safeMultiply(10, 'invalid')).toBe(0);
    });
  });

  describe('safeDivide', () => {
    it('should divide numbers correctly', () => {
      expect(safeDivide(21, 2)).toBe(10.5);
      expect(safeDivide(1, 3)).toBe(0.33);
    });

    it('should handle division by zero', () => {
      expect(safeDivide(10, 0)).toBe(0);
    });

    it('should handle string inputs', () => {
      expect(safeDivide('21', '2')).toBe(10.5);
    });

    it('should handle invalid inputs', () => {
      expect(safeDivide('invalid', 10)).toBe(0);
      expect(safeDivide(10, 'invalid')).toBe(0);
    });
  });

  describe('calculatePercentage', () => {
    it('should calculate percentage correctly', () => {
      expect(calculatePercentage(100, 10)).toBe(10);
      expect(calculatePercentage(50, 20)).toBe(10);
      expect(calculatePercentage(33.33, 15)).toBe(5);
    });

    it('should handle string inputs', () => {
      expect(calculatePercentage('100', '10')).toBe(10);
    });

    it('should handle invalid inputs', () => {
      expect(calculatePercentage('invalid', 10)).toBe(0);
      expect(calculatePercentage(100, 'invalid')).toBe(0);
    });
  });

  describe('applyDiscount', () => {
    it('should apply discount correctly', () => {
      const result = applyDiscount(100, 10);
      expect(result.originalPrice).toBe(100);
      expect(result.discountAmount).toBe(10);
      expect(result.finalPrice).toBe(90);
    });

    it('should handle zero discount', () => {
      const result = applyDiscount(100, 0);
      expect(result.originalPrice).toBe(100);
      expect(result.discountAmount).toBe(0);
      expect(result.finalPrice).toBe(100);
    });

    it('should handle invalid discount percentage', () => {
      const result = applyDiscount(100, 150); // Over 100%
      expect(result.originalPrice).toBe(100);
      expect(result.discountAmount).toBe(0);
      expect(result.finalPrice).toBe(100);
    });

    it('should handle string inputs', () => {
      const result = applyDiscount('100', '15');
      expect(result.originalPrice).toBe(100);
      expect(result.discountAmount).toBe(15);
      expect(result.finalPrice).toBe(85);
    });
  });

  describe('calculateLineTotal', () => {
    it('should calculate line total correctly', () => {
      expect(calculateLineTotal(3, 10.5)).toBe(31.5);
      expect(calculateLineTotal(2, 15.75)).toBe(31.5);
    });

    it('should handle string price', () => {
      expect(calculateLineTotal(3, '10.5')).toBe(31.5);
    });
  });

  describe('sumArray', () => {
    it('should sum array of numbers', () => {
      expect(sumArray([10, 20, 30])).toBe(60);
      expect(sumArray([10.5, 20.25, 5.75])).toBe(36.5);
    });

    it('should handle mixed number and string array', () => {
      expect(sumArray([10, '20.5', 30])).toBe(60.5);
    });

    it('should handle empty array', () => {
      expect(sumArray([])).toBe(0);
    });

    it('should handle invalid values in array', () => {
      expect(sumArray([10, 'invalid', 20])).toBe(30);
    });
  });

  describe('isValidMonetaryAmount', () => {
    it('should validate positive numbers', () => {
      expect(isValidMonetaryAmount(10.5)).toBe(true);
      expect(isValidMonetaryAmount(0)).toBe(true);
      expect(isValidMonetaryAmount('10.5')).toBe(true);
    });

    it('should reject negative numbers', () => {
      expect(isValidMonetaryAmount(-10)).toBe(false);
    });

    it('should reject invalid values', () => {
      expect(isValidMonetaryAmount('invalid')).toBe(false);
      expect(isValidMonetaryAmount(NaN)).toBe(false);
      expect(isValidMonetaryAmount(Infinity)).toBe(false);
    });
  });

  describe('formatCurrency', () => {
    it('should format currency correctly', () => {
      const formatted = formatCurrency(10.5);
      expect(formatted).toMatch(/\$10\.50/); // Should contain $10.50
    });

    it('should handle string input', () => {
      const formatted = formatCurrency('10.5');
      expect(formatted).toMatch(/\$10\.50/);
    });

    it('should handle different currencies', () => {
      const formatted = formatCurrency(10.5, 'EUR', 'en-US');
      expect(formatted).toMatch(/€10\.50/);
    });
  });
});
