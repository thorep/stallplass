/**
 * Application constants and configuration values
 */

// Query stale times (in milliseconds)
export const QUERY_STALE_TIMES = {
  STABLE_DATA: 5 * 60 * 1000, // 5 minutes
  MESSAGING: 30 * 1000, // 30 seconds
  REAL_TIME_MESSAGES: 10 * 1000, // 10 seconds
  AMENITIES: 10 * 60 * 1000, // 10 minutes
  USER_DATA: 5 * 60 * 1000, // 5 minutes
} as const;

// Polling intervals (in milliseconds)
export const POLLING_INTERVALS = {
  CONVERSATIONS: 30 * 1000, // 30 seconds
  MESSAGES: 15 * 1000, // 15 seconds
} as const;

// Price constraints (in øre)
export const PRICE_LIMITS = {
  MIN_STABLE_PRICE: 10000, // 100 kr
  MAX_STABLE_PRICE: 1000000, // 10,000 kr
  MIN_BOX_PRICE: 5000, // 50 kr
  MAX_BOX_PRICE: 500000, // 5,000 kr
} as const;

// Norwegian counties for address validation
export const NORWEGIAN_COUNTIES = [
  'Agder',
  'Innlandet',
  'Møre og Romsdal',
  'Nordland',
  'Oslo',
  'Rogaland',
  'Troms og Finnmark',
  'Trøndelag',
  'Vestfold og Telemark',
  'Vestland',
  'Viken',
] as const;

// Form validation limits
export const VALIDATION_LIMITS = {
  STABLE_NAME_MIN: 2,
  STABLE_NAME_MAX: 100,
  DESCRIPTION_MAX: 2000,
  BOX_NAME_MIN: 1,
  BOX_NAME_MAX: 50,
  PHONE_LENGTH: 8,
  POSTAL_CODE_LENGTH: 4,
} as const;

// Image constraints
export const IMAGE_CONSTRAINTS = {
  MAX_FILE_SIZE: 4 * 1024 * 1024, // 4MB (Vercel Hobby plan limit is 4.5MB)
  ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
  MAX_IMAGES_PER_STABLE: 10,
  MAX_IMAGES_PER_BOX: 5,
} as const;

// Box size categories (in square meters)
export const BOX_SIZE_CATEGORIES = {
  SMALL: { min: 0, max: 12, label: 'Liten (under 12 m²)' },
  MEDIUM: { min: 12, max: 20, label: 'Medium (12-20 m²)' },
  LARGE: { min: 20, max: 999, label: 'Stor (over 20 m²)' },
} as const;

// Horse size categories
export const HORSE_SIZE_CATEGORIES = [
  'Ponni (under 148 cm)',
  'Liten hest (148-158 cm)', 
  'Medium hest (158-168 cm)',
  'Stor hest (over 168 cm)',
] as const;

// Default coordinates for Norway (Oslo)
export const DEFAULT_COORDINATES = {
  LATITUDE: 59.9139,
  LONGITUDE: 10.7522,
} as const;

// Map configuration
export const MAP_CONFIG = {
  DEFAULT_ZOOM: 10,
  MAX_ZOOM: 18,
  MIN_ZOOM: 5,
  TILE_URL: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  ATTRIBUTION: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
} as const;

// Rental status options
export const RENTAL_STATUS = {
  PENDING: 'PENDING',
  ACTIVE: 'ACTIVE',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
} as const;

// Conversation status options
export const CONVERSATION_STATUS = {
  ACTIVE: 'ACTIVE',
  RENTAL_CONFIRMED: 'RENTAL_CONFIRMED',
  ARCHIVED: 'ARCHIVED',
} as const;

// Note: MessageType enum is defined in Prisma schema and generated types
// Available values: TEXT, IMAGE, STABLE_LINK, BOX_LINK

// Responsive breakpoints (matches Tailwind CSS)
export const BREAKPOINTS = {
  SM: 640,
  MD: 768,
  LG: 1024,
  XL: 1280,
  '2XL': 1536,
} as const;

// Error messages
export const ERROR_MESSAGES = {
  GENERIC: 'En feil oppstod. Prøv igjen senere.',
  NETWORK: 'Nettverksfeil. Sjekk internettforbindelsen din.',
  UNAUTHORIZED: 'Du er ikke autorisert til å utføre denne handlingen.',
  NOT_FOUND: 'Ressursen ble ikke funnet.',
  VALIDATION: 'Vennligst rett opp feilene i skjemaet.',
  IMAGE_TOO_LARGE: 'Bildet er for stort. Maksimal størrelse er 4MB.',
  INVALID_FILE_TYPE: 'Ugyldig filtype. Kun JPEG, PNG og WebP er tillatt.',
} as const;

// Success messages
export const SUCCESS_MESSAGES = {
  STABLE_CREATED: 'Stallen ble opprettet!',
  STABLE_UPDATED: 'Stallen ble oppdatert!',
  STABLE_DELETED: 'Stallen ble slettet!',
  BOX_CREATED: 'Boksen ble opprettet!',
  BOX_UPDATED: 'Boksen ble oppdatert!',
  BOX_DELETED: 'Boksen ble slettet!',
  MESSAGE_SENT: 'Melding sendt!',
  RENTAL_CONFIRMED: 'Leieforhold bekreftet!',
} as const;