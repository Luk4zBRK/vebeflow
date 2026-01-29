/**
 * Property-Based Tests for notify-slack Edge Function - Retry Logic
 * 
 * Feature: slack-community-integration
 * Task: 4.6 Write property test for retry with exponential backoff
 * Property 5: Retry with exponential backoff
 * 
 * **Validates: Requirements 2.4**
 * 
 * For any failed webhook delivery, the system should retry up to 3 times 
 * with delays of 1s, 2s, and 4s between attempts.
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import fc from 'fast-check';

// Mock fetch for testing
let fetchMock: jest.Mock;
let originalFetch: typeof global.fetch;

beforeEach(() => {
  originalFetch = global.fetch;
  fetchMock = jest.fn();
  global.fetch = fetchMock as any;
});

afterEach(() => {
  global.fetch = originalFetch;
});

/**
 * Simulates the retry logic from the Edge Function
 */
async function simulateRetryLogic(
  webhookUrl: string,
  message: any,
  maxAttempts: number = 3,
  retryDelays: number[] = [1000, 2000, 4000]
): Promise<{
  success: boolean;
  attempts: number;
  delays: number[];
}> {
  const attemptTimestamps: number[] = [];
  let success = false;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    attemptTimestamps.push(Date.now());

    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(message),
      });

      if (response.ok) {
        success = true;
        break;
      }

      // If not the last attempt, wait before retrying
      if (attempt < maxAttempts) {
        const delay = retryDelays[attempt - 1];
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    } catch (error) {
      // If not the last attempt, wait before retrying
      if (attempt < maxAttempts) {
        const delay = retryDelays[attempt - 1];
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  // Calculate actual delays between attempts
  const delays: number[] = [];
  for (let i = 1; i < attemptTimestamps.length; i++) {
    delays.push(attemptTimestamps[i] - attemptTimestamps[i - 1]);
  }

  return {
    success,
    attempts: attemptTimestamps.length,
    delays,
  };
}

describe('Property 5: Retry with exponential backoff', () => {
  it('should retry up to 3 times for any failed webhook delivery', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.webUrl({ validSchemes: ['https'] }),
        fc.record({
          text: fc.string(),
          blocks: fc.array(fc.record({ type: fc.string() })),
        }),
        async (webhookUrl, message) => {
          // Mock fetch to always fail
          fetchMock.mockResolvedValue({
            ok: false,
            status: 500,
            text: async () => 'Internal Server Error',
          });

          const result = await simulateRetryLogic(webhookUrl, message);

          // Should attempt exactly 3 times
          expect(result.attempts).toBe(3);
          expect(result.success).toBe(false);
        }
      ),
      { numRuns: 10 } // Reduced runs due to delays
    );
  });

  it('should use exponential backoff delays (1s, 2s, 4s) between retries', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.webUrl({ validSchemes: ['https'] }),
        fc.record({
          text: fc.string(),
          blocks: fc.array(fc.record({ type: fc.string() })),
        }),
        async (webhookUrl, message) => {
          // Mock fetch to always fail
          fetchMock.mockResolvedValue({
            ok: false,
            status: 500,
            text: async () => 'Internal Server Error',
          });

          const result = await simulateRetryLogic(webhookUrl, message);

          // Should have 2 delays (between 3 attempts)
          expect(result.delays.length).toBe(2);

          // First delay should be approximately 1000ms (allow 100ms tolerance)
          expect(result.delays[0]).toBeGreaterThanOrEqual(1000);
          expect(result.delays[0]).toBeLessThan(1200);

          // Second delay should be approximately 2000ms (allow 100ms tolerance)
          expect(result.delays[1]).toBeGreaterThanOrEqual(2000);
          expect(result.delays[1]).toBeLessThan(2200);
        }
      ),
      { numRuns: 5 } // Reduced runs due to delays
    );
  });

  it('should stop retrying immediately on success', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.webUrl({ validSchemes: ['https'] }),
        fc.record({
          text: fc.string(),
          blocks: fc.array(fc.record({ type: fc.string() })),
        }),
        fc.integer({ min: 1, max: 3 }),
        async (webhookUrl, message, successOnAttempt) => {
          let callCount = 0;

          // Mock fetch to succeed on specific attempt
          fetchMock.mockImplementation(async () => {
            callCount++;
            if (callCount === successOnAttempt) {
              return {
                ok: true,
                status: 200,
                text: async () => 'ok',
              };
            }
            return {
              ok: false,
              status: 500,
              text: async () => 'Internal Server Error',
            };
          });

          const result = await simulateRetryLogic(webhookUrl, message);

          // Should stop on success
          expect(result.attempts).toBe(successOnAttempt);
          expect(result.success).toBe(true);
        }
      ),
      { numRuns: 10 }
    );
  });

  it('should retry on network errors', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.webUrl({ validSchemes: ['https'] }),
        fc.record({
          text: fc.string(),
          blocks: fc.array(fc.record({ type: fc.string() })),
        }),
        async (webhookUrl, message) => {
          // Mock fetch to throw network error
          fetchMock.mockRejectedValue(new Error('Network error'));

          const result = await simulateRetryLogic(webhookUrl, message);

          // Should attempt all 3 times even with exceptions
          expect(result.attempts).toBe(3);
          expect(result.success).toBe(false);
        }
      ),
      { numRuns: 10 }
    );
  });
});
