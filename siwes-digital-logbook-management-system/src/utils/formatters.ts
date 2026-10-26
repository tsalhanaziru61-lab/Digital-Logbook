/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Capitalizes the first letter of each word in a string.
 */
export const capitalize = (str: string): string => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
};

/**
 * Returns a human-friendly formatted date string.
 */
export const formatDate = (date: Date | string = new Date()): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(d);
};

/**
 * Helper to mask sensitive strings like API keys in UI diagnostics.
 */
export const maskSecret = (value: string | undefined): string => {
  if (!value || value.length < 8) return '••••••••';
  return `${value.slice(0, 4)}••••••••${value.slice(-4)}`;
};
