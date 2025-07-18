/**
 * Centralized exports for all utility functions
 */

// Re-export everything from helpers (including cn function)
export * from './helpers';

// Re-export formatting utilities
export * from './formatting';

// Re-export validation utilities
export * from './validation';

// Re-export constants
export * from './constants';

// Additional utility types
export type DeepPartial<T> = {
  [P in keyof T]?: DeepPartial<T[P]>;
};

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type RequiredField<T, K extends keyof T> = T & Required<Pick<T, K>>;