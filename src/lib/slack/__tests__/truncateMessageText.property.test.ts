/**
 * Property-Based Tests for truncateMessageText
 * 
 * Feature: slack-community-integration
 * Task: 2.13 Write property test for character limit enforcement
 * 
 * These property-based tests validate that the truncateMessageText function
 * maintains correctness properties across all possible valid inputs using
 * fast-check for randomized testing.
 * 
 * **Validates: Requirements 9.4, 9.5**
 */

import { describe, test, expect } from '@jest/globals';
import fc from 'fast-check';
import { truncateMessageText } from '../formatters';

describe('truncateMessageText - Property-Based Tests', () => {
  /**
   * Property 12: Character limit enforcement
   * 
   * For any message text exceeding 3000 characters, it should be truncated
   * with "..." appended and include a "Read More" link to the full content.
   * 
   * **Validates: Requirements 9.4, 9.5**
   */
  test('Property 12: Character limit enforcement', () => {
    fc.assert(
      fc.property(
        // Generate strings longer than 3000 characters
        fc.string({ minLength: 3001, maxLength: 10000 }),
        (longText) => {
          const truncated = truncateMessageText(longText);
          
          // Property 1: Result should be at most 3000 characters
          expect(truncated.length).toBeLessThanOrEqual(3000);
          
          // Property 2: Result should end with "..."
          expect(truncated).toMatch(/\.\.\.$/);
          
          // Property 3: Result should be shorter than original
          expect(truncated.length).toBeLessThan(longText.length);
          
          // Property 4: Result should preserve beginning of text
          // (at least first 100 chars should match)
          const firstChars = Math.min(100, truncated.length - 3);
          expect(longText.substring(0, firstChars)).toBe(truncated.substring(0, firstChars));
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Text within limit is not modified
   * 
   * For any text with 3000 or fewer characters, the function should
   * return the text unchanged.
   */
  test('Property: Text within limit is not modified', () => {
    fc.assert(
      fc.property(
        // Generate strings with 0 to 3000 characters
        fc.string({ minLength: 0, maxLength: 3000 }),
        (text) => {
          const result = truncateMessageText(text);
          
          // Should return the exact same text
          expect(result).toBe(text);
          
          // Should not have "..." appended
          if (text.length > 0 && !text.endsWith('...')) {
            expect(result).not.toMatch(/\.\.\.$/);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Truncation always results in valid length
   * 
   * For any input text, the result should always be at most 3000 characters.
   */
  test('Property: Truncation always results in valid length', () => {
    fc.assert(
      fc.property(
        // Generate strings of any length
        fc.string({ minLength: 0, maxLength: 20000 }),
        (text) => {
          const result = truncateMessageText(text);
          
          // Result should never exceed 3000 characters
          expect(result.length).toBeLessThanOrEqual(3000);
          
          // Result should be non-empty if input is non-empty
          if (text.length > 0) {
            expect(result.length).toBeGreaterThan(0);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Word boundary preservation
   * 
   * For any text with spaces, truncation should attempt to preserve
   * word boundaries when possible.
   */
  test('Property: Word boundary preservation when possible', () => {
    fc.assert(
      fc.property(
        // Generate text with words (spaces between them)
        fc.array(fc.string({ minLength: 1, maxLength: 50 }), { minLength: 100, maxLength: 200 })
          .map(words => words.join(' ')),
        (text) => {
          // Only test if text is longer than 3000 chars
          if (text.length <= 3000) {
            return true;
          }
          
          const result = truncateMessageText(text);
          
          // If truncated, should end with "..."
          expect(result).toMatch(/\.\.\.$/);
          
          // Remove the "..." to check the truncation point
          const withoutEllipsis = result.substring(0, result.length - 3);
          
          // If there's a space near the end, it should have been used as truncation point
          // (unless the last character before "..." is a space, which means we truncated at word boundary)
          if (withoutEllipsis.length > 0) {
            const lastChar = withoutEllipsis[withoutEllipsis.length - 1];
            // Either last char is a space (truncated at word boundary)
            // or there's no space in the last 50 chars (couldn't find word boundary)
            const last50 = withoutEllipsis.substring(Math.max(0, withoutEllipsis.length - 50));
            const hasSpaceNearEnd = last50.includes(' ');
            
            if (hasSpaceNearEnd) {
              // If there's a space nearby, we should have used it
              // So last char should be a space or alphanumeric (not punctuation mid-word)
              expect(lastChar === ' ' || /\w/.test(lastChar)).toBe(true);
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Custom max length parameter
   * 
   * For any custom maxLength parameter, the function should respect
   * that limit instead of the default 3000.
   */
  test('Property: Custom max length parameter is respected', () => {
    fc.assert(
      fc.property(
        // Generate custom max lengths
        fc.integer({ min: 10, max: 5000 }),
        fc.string({ minLength: 0, maxLength: 10000 }),
        (maxLength, text) => {
          const result = truncateMessageText(text, maxLength);
          
          // Result should never exceed the custom max length
          expect(result.length).toBeLessThanOrEqual(maxLength);
          
          // If text was longer than maxLength, should be truncated with "..."
          if (text.length > maxLength) {
            expect(result).toMatch(/\.\.\.$/);
            expect(result.length).toBeLessThan(text.length);
          } else {
            // If text was within limit, should be unchanged
            expect(result).toBe(text);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Ellipsis is always exactly three dots
   * 
   * For any truncated text, the ellipsis should always be exactly "..."
   * (three dots, no more, no less).
   */
  test('Property: Ellipsis is always exactly three dots', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 3001, maxLength: 10000 }),
        (longText) => {
          const result = truncateMessageText(longText);
          
          // Should end with exactly "..."
          expect(result.endsWith('...')).toBe(true);
          
          // Should not end with more than three dots
          expect(result.endsWith('....')).toBe(false);
          
          // Last three characters should be "..."
          expect(result.substring(result.length - 3)).toBe('...');
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Empty string handling
   * 
   * For an empty string, the function should return an empty string.
   */
  test('Property: Empty string returns empty string', () => {
    const result = truncateMessageText('');
    expect(result).toBe('');
  });

  /**
   * Property: Exactly 3000 characters is not truncated
   * 
   * For text with exactly 3000 characters, it should not be truncated.
   */
  test('Property: Exactly 3000 characters is not truncated', () => {
    fc.assert(
      fc.property(
        // Generate strings with exactly 3000 characters
        fc.string({ minLength: 3000, maxLength: 3000 }),
        (text) => {
          const result = truncateMessageText(text);
          
          // Should return unchanged
          expect(result).toBe(text);
          expect(result.length).toBe(3000);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Truncation preserves text prefix
   * 
   * For any truncated text, the result (minus "...") should be a prefix
   * of the original text.
   */
  test('Property: Truncation preserves text prefix', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 3001, maxLength: 10000 }),
        (longText) => {
          const result = truncateMessageText(longText);
          
          // Remove "..." from result
          const withoutEllipsis = result.substring(0, result.length - 3);
          
          // The original text should start with this prefix
          expect(longText.startsWith(withoutEllipsis)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: No information loss for short text
   * 
   * For any text shorter than or equal to 3000 characters, no information
   * should be lost (text should be returned unchanged).
   */
  test('Property: No information loss for short text', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 0, maxLength: 3000 }),
        (text) => {
          const result = truncateMessageText(text);
          
          // Should be identical
          expect(result).toBe(text);
          
          // Length should be identical
          expect(result.length).toBe(text.length);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Idempotence
   * 
   * For any text, truncating it twice should give the same result as
   * truncating it once.
   */
  test('Property: Truncation is idempotent', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 0, maxLength: 10000 }),
        (text) => {
          const once = truncateMessageText(text);
          const twice = truncateMessageText(once);
          
          // Truncating twice should give same result as once
          expect(twice).toBe(once);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Special characters are preserved
   * 
   * For any text with special characters, those characters should be
   * preserved in the truncated result.
   */
  test('Property: Special characters are preserved', () => {
    fc.assert(
      fc.property(
        // Generate text with various special characters
        fc.string({ minLength: 0, maxLength: 5000 }),
        (text) => {
          const result = truncateMessageText(text);
          
          // If text was not truncated, should be identical
          if (text.length <= 3000) {
            expect(result).toBe(text);
          } else {
            // If truncated, the prefix should match
            const resultWithoutEllipsis = result.substring(0, result.length - 3);
            expect(text.startsWith(resultWithoutEllipsis)).toBe(true);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
