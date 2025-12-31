/**
 * Token utilities for handling SPLITDO token conversions and formatting
 */

// SPLITDO token has 6 decimal places (like USDC)
export const SPLITDO_TOKEN_DECIMALS = 6;
export const SPLITDO_DECIMALS_MULTIPLIER = Math.pow(10, SPLITDO_TOKEN_DECIMALS); // 1,000,000

// Type definitions for clarity
export type SplitdoRawAmount = number; // Raw token amount from API (needs division by 10^6)
export type SplitdoUIAmount = number;  // UI-friendly amount for display

/**
 * Converts raw token amount (from API) to UI amount for display
 * @param rawAmount Raw token amount from API response
 * @returns UI amount for display (e.g., 13453300 → 13.4533)
 */
export function rawToUIAmount(rawAmount: SplitdoRawAmount): SplitdoUIAmount {
  return rawAmount / SPLITDO_DECIMALS_MULTIPLIER;
}

/**
 * Converts UI amount to raw token amount for API calls
 * @param uiAmount UI amount (e.g., 13.45)
 * @returns Raw token amount for API (e.g., 13450000)
 */
export function uiToRawAmount(uiAmount: SplitdoUIAmount): SplitdoRawAmount {
  return Math.floor(uiAmount * SPLITDO_DECIMALS_MULTIPLIER);
}

/**
 * Validates if a number is a valid raw amount (integer >= 0)
 */
export function isValidRawAmount(amount: number): amount is SplitdoRawAmount {
  return Number.isInteger(amount) && amount >= 0;
}

/**
 * Validates if a number is a valid UI amount (finite number >= 0)
 */
export function isValidUIAmount(amount: number): amount is SplitdoUIAmount {
  return Number.isFinite(amount) && amount >= 0;
}