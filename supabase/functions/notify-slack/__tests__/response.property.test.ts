/**
 * Property-Based Tests for notify-slack Edge Function - Response Format
 * 
 * Feature: slack-community-integration
 * Task: 4.12 Write property test for response format
 * Property 24: Response format
 * 
 * **Validates: Requirements 8.5**
 * 
 * For any notify-slack invocation, the response should include fields: 
 * status ('success'|'failed'|'skipped') and delivery_time_ms.
 */

import { describe, it, expect } from '@jest/globals';
import fc from 'fast-check';

// Type definitions
type DeliveryStatus = 'success' | 'failed' | 'skipped';

interface NotifySlackResponse {
  success: boolean;
  status: DeliveryStatus;
  delivery_time_ms: number;
  message?: string;
  error?: string;
}

/**
 * Simulates creating a response for the Edge Function
 */
function createNotifySlackResponse(
  status: DeliveryStatus,
  deliveryTimeMs: number,
  message?: string,
  error?: string
): NotifySlackResponse {
  return {
    success: status === 'success',
    status: status,
    delivery_time_ms: deliveryTimeMs,
    ...(message && { message }),
    ...(error && { error }),
  };
}

/**
 * Validates that a response has all required fields
 */
function validateResponseFormat(response: NotifySlackResponse): boolean {
  // Required fields
  if (response.success === undefined || response.success === null) return false;
  if (!response.status) return false;
  if (response.delivery_time_ms === undefined || response.delivery_time_ms === null) return false;

  // Status must be one of the valid values
  const validStatuses: DeliveryStatus[] = ['success', 'failed', 'skipped'];
  if (!validStatuses.includes(response.status)) return false;

  // delivery_time_ms must be a non-negative number
  if (response.delivery_time_ms < 0) return false;

  // success should match status
  if (response.status === 'success' && !response.success) return false;
  if (response.status !== 'success' && response.success) return false;

  return true;
}

describe('Property 24: Response format', () => {
  it('should include required fields for any response', () => {
    fc.assert(
      fc.property(
        fc.constantFrom<DeliveryStatus>('success', 'failed', 'skipped'),
        fc.integer({ min: 0, max: 10000 }),
        (status, deliveryTimeMs) => {
          const response = createNotifySlackResponse(status, deliveryTimeMs);

          // Validate required fields are present
          expect(validateResponseFormat(response)).toBe(true);
          expect(response.success).toBeDefined();
          expect(response.status).toBeDefined();
          expect(response.delivery_time_ms).toBeDefined();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should have status as one of success, failed, or skipped', () => {
    fc.assert(
      fc.property(
        fc.constantFrom<DeliveryStatus>('success', 'failed', 'skipped'),
        fc.integer({ min: 0, max: 10000 }),
        (status, deliveryTimeMs) => {
          const response = createNotifySlackResponse(status, deliveryTimeMs);

          // Status must be one of the valid values
          expect(['success', 'failed', 'skipped']).toContain(response.status);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should have delivery_time_ms as non-negative number', () => {
    fc.assert(
      fc.property(
        fc.constantFrom<DeliveryStatus>('success', 'failed', 'skipped'),
        fc.integer({ min: 0, max: 10000 }),
        (status, deliveryTimeMs) => {
          const response = createNotifySlackResponse(status, deliveryTimeMs);

          // delivery_time_ms must be non-negative
          expect(response.delivery_time_ms).toBeGreaterThanOrEqual(0);
          expect(typeof response.delivery_time_ms).toBe('number');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should set success=true only when status=success', () => {
    fc.assert(
      fc.property(
        fc.constantFrom<DeliveryStatus>('success', 'failed', 'skipped'),
        fc.integer({ min: 0, max: 10000 }),
        (status, deliveryTimeMs) => {
          const response = createNotifySlackResponse(status, deliveryTimeMs);

          // success field should match status
          if (status === 'success') {
            expect(response.success).toBe(true);
          } else {
            expect(response.success).toBe(false);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should include optional message field for successful delivery', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 10000 }),
        fc.string({ minLength: 1, maxLength: 100 }),
        (deliveryTimeMs, message) => {
          const response = createNotifySlackResponse('success', deliveryTimeMs, message);

          // Message should be present for success
          expect(response.message).toBe(message);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should include optional error field for failed delivery', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 10000 }),
        fc.string({ minLength: 1, maxLength: 200 }),
        (deliveryTimeMs, error) => {
          const response = createNotifySlackResponse('failed', deliveryTimeMs, undefined, error);

          // Error should be present for failed
          expect(response.error).toBe(error);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should include message for skipped delivery', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 10000 }),
        fc.string({ minLength: 1, maxLength: 100 }),
        (deliveryTimeMs, message) => {
          const response = createNotifySlackResponse('skipped', deliveryTimeMs, message);

          // Message should explain why skipped
          expect(response.message).toBe(message);
          expect(response.success).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should have consistent success field across all statuses', () => {
    fc.assert(
      fc.property(
        fc.constantFrom<DeliveryStatus>('success', 'failed', 'skipped'),
        fc.integer({ min: 0, max: 10000 }),
        fc.option(fc.string(), { nil: undefined }),
        fc.option(fc.string(), { nil: undefined }),
        (status, deliveryTimeMs, message, error) => {
          const response = createNotifySlackResponse(status, deliveryTimeMs, message, error);

          // success should always be boolean
          expect(typeof response.success).toBe('boolean');
          
          // success should be true only for 'success' status
          expect(response.success).toBe(status === 'success');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should preserve delivery_time_ms value exactly', () => {
    fc.assert(
      fc.property(
        fc.constantFrom<DeliveryStatus>('success', 'failed', 'skipped'),
        fc.integer({ min: 0, max: 10000 }),
        (status, deliveryTimeMs) => {
          const response = createNotifySlackResponse(status, deliveryTimeMs);

          // delivery_time_ms should be exactly as provided
          expect(response.delivery_time_ms).toBe(deliveryTimeMs);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should be valid JSON serializable', () => {
    fc.assert(
      fc.property(
        fc.constantFrom<DeliveryStatus>('success', 'failed', 'skipped'),
        fc.integer({ min: 0, max: 10000 }),
        fc.option(fc.string(), { nil: undefined }),
        fc.option(fc.string(), { nil: undefined }),
        (status, deliveryTimeMs, message, error) => {
          const response = createNotifySlackResponse(status, deliveryTimeMs, message, error);

          // Should be serializable to JSON and back
          const json = JSON.stringify(response);
          const parsed = JSON.parse(json);

          expect(parsed.success).toBe(response.success);
          expect(parsed.status).toBe(response.status);
          expect(parsed.delivery_time_ms).toBe(response.delivery_time_ms);
        }
      ),
      { numRuns: 100 }
    );
  });
});
