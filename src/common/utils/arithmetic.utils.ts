/**
 * Arithmetic utilities for precise financial calculations
 * Handles floating point precision issues and provides consistent rounding
 */

/**
 * Converts a value to a precise decimal number with proper rounding
 * @param value - The value to convert
 * @param decimals - Number of decimal places (default: 2)
 * @returns Precisely rounded number
 */
export function toPreciseDecimal(value: number | string, decimals: number = 2): number {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return 0;
  
  // Use Math.round with power of 10 for precise rounding
  const factor = Math.pow(10, decimals);
  return Math.round((num + Number.EPSILON) * factor) / factor;
}

/**
 * Safely adds two or more numbers with precise decimal handling
 * @param values - Numbers to add
 * @returns Sum with precise decimal handling
 */
export function safeAdd(...values: (number | string)[]): number {
  const sum = values.reduce((acc, val) => {
    acc = typeof acc === 'string' ? parseFloat(acc) : acc;
    const num = typeof val === 'string' ? parseFloat(val) : val;
    return acc + (isNaN(num) ? 0 : num);
  }, 0);
  
  return toPreciseDecimal(sum);
}

/**
 * Safely subtracts numbers with precise decimal handling
 * @param minuend - Number to subtract from
 * @param subtrahend - Number to subtract
 * @returns Difference with precise decimal handling
 */
export function safeSubtract(minuend: number | string, subtrahend: number | string): number {
  const num1 = typeof minuend === 'string' ? parseFloat(minuend) : minuend;
  const num2 = typeof subtrahend === 'string' ? parseFloat(subtrahend) : subtrahend;
  
  if (isNaN(num1) || isNaN(num2)) return 0;
  
  return toPreciseDecimal(num1 - num2);
}

/**
 * Safely multiplies two numbers with precise decimal handling
 * @param multiplicand - First number
 * @param multiplier - Second number
 * @returns Product with precise decimal handling
 */
export function safeMultiply(multiplicand: number | string, multiplier: number | string): number {
  const num1 = typeof multiplicand === 'string' ? parseFloat(multiplicand) : multiplicand;
  const num2 = typeof multiplier === 'string' ? parseFloat(multiplier) : multiplier;
  
  if (isNaN(num1) || isNaN(num2)) return 0;
  
  return toPreciseDecimal(num1 * num2);
}

/**
 * Safely divides two numbers with precise decimal handling
 * @param dividend - Number to divide
 * @param divisor - Number to divide by
 * @returns Quotient with precise decimal handling
 */
export function safeDivide(dividend: number | string, divisor: number | string): number {
  const num1 = typeof dividend === 'string' ? parseFloat(dividend) : dividend;
  const num2 = typeof divisor === 'string' ? parseFloat(divisor) : divisor;
  
  if (isNaN(num1) || isNaN(num2) || num2 === 0) return 0;
  
  return toPreciseDecimal(num1 / num2);
}

/**
 * Calculates percentage of a value
 * @param value - Base value
 * @param percentage - Percentage (0-100)
 * @returns Percentage amount with precise decimal handling
 */
export function calculatePercentage(value: number | string, percentage: number | string): number {
  const baseValue = typeof value === 'string' ? parseFloat(value) : value;
  const percent = typeof percentage === 'string' ? parseFloat(percentage) : percentage;
  
  if (isNaN(baseValue) || isNaN(percent)) return 0;
  
  return toPreciseDecimal((baseValue * percent) / 100);
}

/**
 * Applies discount to a price
 * @param price - Original price
 * @param discountPercentage - Discount percentage (0-100)
 * @returns Object with original price, discount amount, and final price
 */
export function applyDiscount(price: number | string, discountPercentage: number | string) {
  const originalPrice = toPreciseDecimal(price);
  const discountPercent = toPreciseDecimal(discountPercentage);
  
  if (discountPercent <= 0 || discountPercent > 100) {
    return {
      originalPrice,
      discountAmount: 0,
      finalPrice: originalPrice,
    };
  }
  
  const discountAmount = calculatePercentage(originalPrice, discountPercent);
  const finalPrice = safeSubtract(originalPrice, discountAmount);
  
  return {
    originalPrice,
    discountAmount,
    finalPrice,
  };
}

/**
 * Calculates line total for cart items
 * @param quantity - Item quantity
 * @param unitPrice - Price per unit
 * @returns Line total with precise decimal handling
 */
export function calculateLineTotal(quantity: number, unitPrice: number | string): number {
  return safeMultiply(quantity, unitPrice);
}

/**
 * Sums an array of numbers with precise decimal handling
 * @param values - Array of numbers to sum
 * @returns Sum with precise decimal handling
 */
export function sumArray(values: (number | string)[]): number {
  return safeAdd(...values);
}

/**
 * Validates if a number is a valid monetary amount
 * @param value - Value to validate
 * @returns True if valid monetary amount
 */
export function isValidMonetaryAmount(value: number | string): boolean {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return !isNaN(num) && isFinite(num) && num >= 0;
}

/**
 * Formats a number as currency (for display purposes)
 * @param value - Value to format
 * @param currency - Currency code (default: USD)
 * @param locale - Locale for formatting (default: en-US)
 * @returns Formatted currency string
 */
export function formatCurrency(
  value: number | string,
  currency: string = 'USD',
  locale: string = 'en-US'
): string {
  const num = toPreciseDecimal(value);
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(num);
}
