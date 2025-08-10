/**
 * Safely converts a number to a fixed decimal string
 * @param value - The number to format
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted string or '0.00' if value is invalid
 */
export const safeToFixed = (value: number | undefined | null, decimals: number = 2): string => {
  if (value === undefined || value === null || isNaN(value)) {
    return '0'.padEnd(decimals + 1, '0');
  }
  return value.toFixed(decimals);
};

/**
 * Safely formats a number as currency
 * @param value - The number to format
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted currency string or '$0.00' if value is invalid
 */
export const safeCurrency = (value: number | undefined | null, decimals: number = 2): string => {
  return `$${safeToFixed(value, decimals)}`;
};

/**
 * Safely formats a number as percentage
 * @param value - The number to format
 * @param decimals - Number of decimal places (default: 1)
 * @returns Formatted percentage string or '0.0%' if value is invalid
 */
export const safePercentage = (value: number | undefined | null, decimals: number = 1): string => {
  return `${safeToFixed(value, decimals)}%`;
};

/**
 * Safely parses a string to number
 * @param value - The string to parse
 * @param defaultValue - Default value if parsing fails (default: 0)
 * @returns Parsed number or defaultValue
 */
export const safeParseFloat = (value: string | undefined | null, defaultValue: number = 0): number => {
  if (!value) return defaultValue;
  const parsed = parseFloat(value);
  return isNaN(parsed) ? defaultValue : parsed;
};
