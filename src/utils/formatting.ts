/**
 * Utility functions for formatting data display
 */

/**
 * Formats a price in øre (cents) to a readable Norwegian kroner string
 * @param price - Price in øre (1 kr = 100 øre)
 * @returns Formatted price string (e.g., "1 250 kr")
 */
export function formatPrice(price: number): string {
  return `${price.toLocaleString('nb-NO')} kr`;
}

/**
 * Formats a date to Norwegian locale string
 * @param date - Date to format
 * @param options - Intl.DateTimeFormatOptions for customization
 * @returns Formatted date string
 */
export function formatDate(
  date: Date | string, 
  options: Intl.DateTimeFormatOptions = {}
): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    ...options
  };
  return dateObj.toLocaleDateString('nb-NO', defaultOptions);
}

/**
 * Formats a Norwegian phone number
 * @param phone - Phone number string
 * @returns Formatted phone number
 */
export function formatPhoneNumber(phone: string): string {
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');
  
  // Format as Norwegian mobile: +47 XXX XX XXX
  if (digits.length === 8) {
    return `+47 ${digits.slice(0, 3)} ${digits.slice(3, 5)} ${digits.slice(5)}`;
  }
  
  // Return original if format doesn't match
  return phone;
}

/**
 * Truncates text to specified length with ellipsis
 * @param text - Text to truncate
 * @param maxLength - Maximum length before truncation
 * @returns Truncated text with ellipsis if needed
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + '...';
}

/**
 * Formats box size display
 * @param size - Size in square meters
 * @returns Formatted size string or default text
 */
export function formatBoxSize(size?: number): string {
  return size ? `${size} m²` : 'Ikke oppgitt';
}

/**
 * Formats price range display
 * @param min - Minimum price in øre
 * @param max - Maximum price in øre
 * @returns Formatted price range string
 */
export function formatPriceRange(min: number, max: number): string {
  if (min === max) {
    return formatPrice(min);
  }
  return `${formatPrice(min)} - ${formatPrice(max)}`;
}

/**
 * Formats amenity list for display
 * @param amenities - Array of amenity objects
 * @param maxItems - Maximum number of items to show
 * @returns Formatted amenity string
 */
export function formatAmenityList(
  amenities: Array<{ amenity: { name: string } }>,
  maxItems: number = 3
): string {
  const names = amenities.map(a => a.amenity.name);
  if (names.length <= maxItems) {
    return names.join(', ');
  }
  return `${names.slice(0, maxItems).join(', ')} (+${names.length - maxItems} flere)`;
}