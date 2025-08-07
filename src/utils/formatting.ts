/**
 * Utility functions for formatting data display
 */

/**
 * Formats a price in øre (cents) to a readable Norwegian kroner string
 * @param price - Price in øre (1 kr = 100 øre)
 * @returns Formatted price string (e.g., "1 250 kr")
 */
export function formatPrice(price: number): string {
  // Ensure consistent Norwegian formatting with comma as decimal separator
  return `${price.toLocaleString("nb-NO", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} kr`;
}

/**
 * Formats a date to Norwegian locale string
 * @param date - Date to format
 * @param options - Intl.DateTimeFormatOptions for customization
 * @returns Formatted date string
 */
export function formatDate(date: Date | string, options: Intl.DateTimeFormatOptions = {}): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    ...options,
  };
  return dateObj.toLocaleDateString("nb-NO", defaultOptions);
}

/**
 * Formats a Norwegian phone number
 * @param phone - Phone number string
 * @returns Formatted phone number
 */
export function formatPhoneNumber(phone: string): string {
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, "");

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
  return text.slice(0, maxLength).trim() + "...";
}

/**
 * Formats box size display
 * @param size - Box size enum value
 * @returns Formatted size string or default text
 */
export function formatBoxSize(size?: 'SMALL' | 'MEDIUM' | 'LARGE'): string {
  if (!size) return "Ikke oppgitt";
  
  switch (size) {
    case 'SMALL':
      return 'Liten';
    case 'MEDIUM':
      return 'Middels';
    case 'LARGE':
      return 'Stor';
    default:
      return "Ikke oppgitt";
  }
}

/**
 * Formats horse size display
 * @param size - Horse size enum value or string
 * @returns Formatted horse size string or default text
 */
export function formatHorseSize(size?: string | null): string {
  if (!size) return "Ikke oppgitt";
  
  switch (size.toUpperCase()) {
    case 'PONY':
    case 'PONNI':
      return 'Ponni';
    case 'SMALL':
    case 'LITEN':
      return 'Liten hest';
    case 'MEDIUM':
    case 'MIDDELS':
      return 'Middels hest';
    case 'LARGE':
    case 'STOR':
      return 'Stor hest';
    default:
      return size; // Return original if not a standard size
  }
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
  const names = amenities.map((a) => a.amenity.name);
  if (names.length <= maxItems) {
    return names.join(", ");
  }
  return `${names.slice(0, maxItems).join(", ")} (+${names.length - maxItems} flere)`;
}

/**
 * Formats location display from stable data
 * Handles cases where location field is empty, malformed, or incomplete
 * @param stable - Stable object with location-related fields (updated for new schema)
 * @returns Formatted location string
 */
export function formatStableLocation(stable: {
  location?: string | null;
  municipality?: string | null;
  poststed?: string | null;
  address?: string | null;
  fylke?: { navn: string } | null;
}): string {
  // Clean up the location field - check if it's meaningful
  const cleanLocation = stable.location?.trim();
  const isLocationMeaningful =
    cleanLocation &&
    cleanLocation !== "," &&
    cleanLocation !== ", " &&
    cleanLocation.length > 2 &&
    !cleanLocation.match(/^[,\s]*$/);

  // If location is meaningful, use it
  if (isLocationMeaningful) {
    return cleanLocation;
  }

  // Otherwise, build location from available components
  const parts: string[] = [];

  if (stable.municipality) {
    parts.push(stable.municipality);
  } else if (stable.poststed) {
    parts.push(stable.poststed);
  }

  if (stable.fylke?.navn && stable.fylke.navn !== stable.municipality) {
    parts.push(stable.fylke.navn);
  }

  if (parts.length > 0) {
    return parts.join(", ");
  }

  return "Ukjent lokasjon";
}

/**
 * Format location display using address, municipalities, and counties
 * Works for both stables and boxes with location data
 * @param entity - Entity object with location fields
 * @returns Formatted location string
 */
export function formatLocationDisplay(entity: {
  address?: string | null;
  postalPlace?: string | null;
  municipalities?: { name: string } | null;
  counties?: { name: string } | null;
}): string {
  const parts: string[] = [];
  // Add address if available
  if (entity.address?.trim()) {
    parts.push(entity.address.trim());
  }

  // Add municipality if available
  if (entity.municipalities?.name) {
    parts.push(entity.municipalities.name);
  } else if (entity.postalPlace?.trim()) {
    parts.push(entity.postalPlace.trim());
  }
  // Add county if available and different from municipality
  if (entity.counties?.name && entity.counties.name !== entity.municipalities?.name) {
    parts.push(entity.counties.name);
  }
  return parts.length > 0 ? parts.join(", ") : "Ukjent lokasjon";
}

/**
 * Generates the location field for database storage using Norwegian address format
 * @param addressData - Address components from form or API
 * @returns Generated location string for database storage
 */
export function generateStableLocation(addressData: {
  address?: string | null;
  postal_code?: string | null;
  poststed?: string | null;
  municipality?: string | null;
  fylke?: { navn: string } | null;
}): string {
  const { address, postal_code, poststed, municipality, fylke } = addressData;

  if (address && postal_code && poststed) {
    // Full address format
    if (municipality && municipality !== poststed) {
      // Case: "Address 12, 3214 Stavern, Larvik, Vestfold"
      return `${address}, ${postal_code} ${poststed}, ${municipality}, ${
        fylke?.navn || ""
      }`.replace(/, $/, "");
    } else {
      // Case: "Albatrossveien 28C, 3212 Sandefjord, Vestfold"
      return `${address}, ${postal_code} ${poststed}, ${fylke?.navn || ""}`.replace(/, $/, "");
    }
  }

  // Fallbacks for incomplete addresses
  if (municipality && fylke?.navn) return `${municipality}, ${fylke.navn}`;
  if (municipality) return municipality;
  if (poststed && fylke?.navn) return `${poststed}, ${fylke.navn}`;
  if (poststed) return poststed;
  if (fylke?.navn) return fylke.navn;
  return "Ukjent lokasjon";
}
