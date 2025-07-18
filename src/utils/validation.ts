/**
 * Utility functions for form validation and data validation
 */

/**
 * Validates a Norwegian postal code
 * @param postalCode - Postal code to validate
 * @returns True if valid Norwegian postal code
 */
export function isValidNorwegianPostalCode(postalCode: string): boolean {
  const postalCodeRegex = /^[0-9]{4}$/;
  return postalCodeRegex.test(postalCode);
}

/**
 * Validates an email address
 * @param email - Email to validate
 * @returns True if valid email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validates a Norwegian phone number
 * @param phone - Phone number to validate
 * @returns True if valid Norwegian phone number
 */
export function isValidNorwegianPhone(phone: string): boolean {
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');
  
  // Norwegian mobile numbers are 8 digits
  return digits.length === 8 && digits.startsWith('4', 0) || digits.startsWith('9', 0);
}

/**
 * Validates that a string is not empty or just whitespace
 * @param value - String to validate
 * @returns True if string has content
 */
export function isNotEmpty(value: string): boolean {
  return value.trim().length > 0;
}

/**
 * Validates that a number is within a specified range
 * @param value - Number to validate
 * @param min - Minimum allowed value
 * @param max - Maximum allowed value
 * @returns True if number is within range
 */
export function isInRange(value: number, min: number, max: number): boolean {
  return value >= min && value <= max;
}

/**
 * Validates that a price is positive and reasonable for stable pricing
 * @param price - Price in øre to validate
 * @returns True if price is valid for stable context
 */
export function isValidStablePrice(price: number): boolean {
  // Price should be between 100 kr (10000 øre) and 10000 kr (1000000 øre) per month
  return isInRange(price, 10000, 1000000);
}

/**
 * Validates that coordinates are within Norway's approximate bounds
 * @param latitude - Latitude to validate
 * @param longitude - Longitude to validate
 * @returns True if coordinates are within Norway
 */
export function isValidNorwegianCoordinates(latitude: number, longitude: number): boolean {
  // Approximate bounds for Norway
  const latInRange = isInRange(latitude, 58, 72);
  const lonInRange = isInRange(longitude, 4, 32);
  return latInRange && lonInRange;
}

/**
 * Validates that an image URL is accessible
 * @param url - Image URL to validate
 * @returns Promise that resolves to true if image is accessible
 */
export async function isValidImageUrl(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok && response.headers.get('content-type')?.startsWith('image/') === true;
  } catch {
    return false;
  }
}

/**
 * Sanitizes user input by removing potentially harmful characters
 * @param input - User input to sanitize
 * @returns Sanitized string
 */
export function sanitizeUserInput(input: string): string {
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
    .replace(/[<>]/g, '') // Remove < and >
    .trim();
}

/**
 * Validates that a stable name is appropriate
 * @param name - Stable name to validate
 * @returns Object with isValid boolean and error message if invalid
 */
export function validateStableName(name: string): { isValid: boolean; error?: string } {
  const sanitized = sanitizeUserInput(name);
  
  if (!isNotEmpty(sanitized)) {
    return { isValid: false, error: 'Stallnavn er påkrevd' };
  }
  
  if (sanitized.length < 2) {
    return { isValid: false, error: 'Stallnavn må være minst 2 tegn' };
  }
  
  if (sanitized.length > 100) {
    return { isValid: false, error: 'Stallnavn kan ikke være lengre enn 100 tegn' };
  }
  
  return { isValid: true };
}