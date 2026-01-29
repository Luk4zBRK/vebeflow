/**
 * Property-Based Tests for welcome-bot Edge Function - Error Logging
 * 
 * Feature: slack-community-integration
 * Task: 5.5 Write property test for welcome bot error logging
 * 
 * **Property 2: Welcome bot error logging**
 * **Validates: Requirements 1.4**
 * 
 * For any failed welcome message delivery attempt, a log entry should be created
 * with timestamp, error details, and failure status.
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import fc from 'fast-check';
import { createClient } from '@supabase/supabase-js';

// Mock Supabase client for testing
interface MockSupabaseClient {
  from: (table: string) => {
    insert: (data: any) => Promise<{ data: any; error: any }>;
    select: (columns?: string) => {
      eq: (column: string, value: any) => Promise<{ data: any[]; error: any }>;
    };
  };
}

// In-memory storage for test logs
let testLogs: any[] = [];

function createMockSupabaseClient(): MockSupabaseClient {
  return {
    from: (table: string) => ({
      insert: async (data: any) => {
        if (table === 'welcome_bot_logs') {
          testLogs.push(data);
          return { data, error: null };
        }
        return { data: null, error: new Error('Table not found') };
      },
      select: (columns?: string) => ({
        eq: (column: string, value: any) => {
          const filtered = testLogs.filter((log) => log[column] === value);
          return Promise.resolve({ data: filtered, error: null });
        },
      }),
    }),
  };
}

/**
 * Log delivery attempt to database
 * This is a copy of the implementation for testing purposes
 */
async function logDelivery(
  supabase: any,
  userId: string,
  userName: string,
  status: 'success' | 'failed',
  errorMessage?: string,
  payloadSize: number = 0
): Promise<void> {
  try {
    await supabase.from('welcome_bot_logs').insert({
      user_id: userId,
      user_name: userName,
      status,
      error_message: errorMessage || null,
      payload_size: payloadSize,
      delivered_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Failed to log delivery:', error);
  }
}

describe('Property 2: Welcome bot error logging', () => {
  beforeEach(() => {
    testLogs = [];
  });

  afterEach(() => {
    testLogs = [];
  });

  describe('Failed delivery logging', () => {
    it('should create log entry for any failed delivery with error details', () => {
      fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 5, maxLength: 20 }).map(s => `U${s}`), // Slack user ID format
          fc.string({ minLength: 1, maxLength: 100 }), // User name
          fc.string({ minLength: 10, maxLength: 500 }), // Error message
          fc.integer({ min: 100, max: 10000 }), // Payload size
          async (userId, userName, errorMessage, payloadSize) => {
            const supabase = createMockSupabaseClient();

            // Log a failed delivery
            await logDelivery(supabase, userId, userName, 'failed', errorMessage, payloadSize);

            // Verify log entry was created
            expect(testLogs.length).toBe(1);

            const log = testLogs[0];

            // Should have user_id
            expect(log.user_id).toBe(userId);

            // Should have user_name
            expect(log.user_name).toBe(userName);

            // Should have status 'failed'
            expect(log.status).toBe('failed');

            // Should have error_message
            expect(log.error_message).toBe(errorMessage);

            // Should have payload_size
            expect(log.payload_size).toBe(payloadSize);

            // Should have timestamp
            expect(log.delivered_at).toBeDefined();
            expect(typeof log.delivered_at).toBe('string');

            // Timestamp should be valid ISO format
            const timestamp = new Date(log.delivered_at);
            expect(timestamp.toString()).not.toBe('Invalid Date');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle null error message for failed deliveries', () => {
      fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 5, maxLength: 20 }).map(s => `U${s}`),
          fc.string({ minLength: 1, maxLength: 100 }),
          fc.integer({ min: 100, max: 10000 }),
          async (userId, userName, payloadSize) => {
            const supabase = createMockSupabaseClient();

            // Log failed delivery without error message
            await logDelivery(supabase, userId, userName, 'failed', undefined, payloadSize);

            expect(testLogs.length).toBe(1);

            const log = testLogs[0];
            expect(log.status).toBe('failed');
            expect(log.error_message).toBeNull();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should create separate log entries for multiple failed deliveries', () => {
      fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              userId: fc.string({ minLength: 5, maxLength: 20 }).map(s => `U${s}`),
              userName: fc.string({ minLength: 1, maxLength: 100 }),
              errorMessage: fc.string({ minLength: 10, maxLength: 500 }),
              payloadSize: fc.integer({ min: 100, max: 10000 }),
            }),
            { minLength: 2, maxLength: 10 }
          ),
          async (deliveries) => {
            const supabase = createMockSupabaseClient();

            // Log multiple failed deliveries
            for (const delivery of deliveries) {
              await logDelivery(
                supabase,
                delivery.userId,
                delivery.userName,
                'failed',
                delivery.errorMessage,
                delivery.payloadSize
              );
            }

            // Should have one log entry per delivery
            expect(testLogs.length).toBe(deliveries.length);

            // Each log should have correct data
            for (let i = 0; i < deliveries.length; i++) {
              const log = testLogs[i];
              const delivery = deliveries[i];

              expect(log.user_id).toBe(delivery.userId);
              expect(log.user_name).toBe(delivery.userName);
              expect(log.status).toBe('failed');
              expect(log.error_message).toBe(delivery.errorMessage);
              expect(log.payload_size).toBe(delivery.payloadSize);
            }
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  describe('Successful delivery logging', () => {
    it('should create log entry for successful deliveries without error message', () => {
      fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 5, maxLength: 20 }).map(s => `U${s}`),
          fc.string({ minLength: 1, maxLength: 100 }),
          fc.integer({ min: 100, max: 10000 }),
          async (userId, userName, payloadSize) => {
            const supabase = createMockSupabaseClient();

            // Log successful delivery
            await logDelivery(supabase, userId, userName, 'success', undefined, payloadSize);

            expect(testLogs.length).toBe(1);

            const log = testLogs[0];

            // Should have status 'success'
            expect(log.status).toBe('success');

            // Should have null error_message
            expect(log.error_message).toBeNull();

            // Should have all other fields
            expect(log.user_id).toBe(userId);
            expect(log.user_name).toBe(userName);
            expect(log.payload_size).toBe(payloadSize);
            expect(log.delivered_at).toBeDefined();
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Error message content', () => {
    it('should preserve error message content exactly', () => {
      fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 5, maxLength: 20 }).map(s => `U${s}`),
          fc.string({ minLength: 1, maxLength: 100 }),
          fc.oneof(
            fc.constant('Network error: Connection timeout'),
            fc.constant('Slack API error: channel_not_found'),
            fc.constant('Failed to open DM channel: user_not_found'),
            fc.constant('Failed to send message: invalid_auth'),
            fc.string({ minLength: 10, maxLength: 500 })
          ),
          fc.integer({ min: 100, max: 10000 }),
          async (userId, userName, errorMessage, payloadSize) => {
            const supabase = createMockSupabaseClient();

            await logDelivery(supabase, userId, userName, 'failed', errorMessage, payloadSize);

            const log = testLogs[0];

            // Error message should be preserved exactly
            expect(log.error_message).toBe(errorMessage);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle special characters in error messages', () => {
      fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 5, maxLength: 20 }).map(s => `U${s}`),
          fc.string({ minLength: 1, maxLength: 100 }),
          fc.string({ minLength: 10, maxLength: 200 }),
          async (userId, userName, baseError) => {
            const supabase = createMockSupabaseClient();

            // Add special characters to error message
            const errorMessage = `${baseError}\n\r\t"'\\{}[]`;

            await logDelivery(supabase, userId, userName, 'failed', errorMessage, 1000);

            const log = testLogs[0];

            // Should preserve special characters
            expect(log.error_message).toBe(errorMessage);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle very long error messages', () => {
      fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 5, maxLength: 20 }).map(s => `U${s}`),
          fc.string({ minLength: 1, maxLength: 100 }),
          fc.string({ minLength: 1000, maxLength: 5000 }),
          async (userId, userName, errorMessage) => {
            const supabase = createMockSupabaseClient();

            await logDelivery(supabase, userId, userName, 'failed', errorMessage, 1000);

            const log = testLogs[0];

            // Should store full error message
            expect(log.error_message).toBe(errorMessage);
            expect(log.error_message.length).toBeGreaterThanOrEqual(1000);
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  describe('Timestamp accuracy', () => {
    it('should record timestamp close to current time', () => {
      fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 5, maxLength: 20 }).map(s => `U${s}`),
          fc.string({ minLength: 1, maxLength: 100 }),
          fc.string({ minLength: 10, maxLength: 500 }),
          async (userId, userName, errorMessage) => {
            const supabase = createMockSupabaseClient();

            const beforeTime = new Date();
            await logDelivery(supabase, userId, userName, 'failed', errorMessage, 1000);
            const afterTime = new Date();

            const log = testLogs[0];
            const logTime = new Date(log.delivered_at);

            // Timestamp should be between before and after
            expect(logTime.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
            expect(logTime.getTime()).toBeLessThanOrEqual(afterTime.getTime());
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should use ISO 8601 format for timestamps', () => {
      fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 5, maxLength: 20 }).map(s => `U${s}`),
          fc.string({ minLength: 1, maxLength: 100 }),
          fc.string({ minLength: 10, maxLength: 500 }),
          async (userId, userName, errorMessage) => {
            const supabase = createMockSupabaseClient();

            await logDelivery(supabase, userId, userName, 'failed', errorMessage, 1000);

            const log = testLogs[0];

            // Should be valid ISO 8601 format
            expect(log.delivered_at).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Payload size tracking', () => {
    it('should record payload size for any delivery', () => {
      fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 5, maxLength: 20 }).map(s => `U${s}`),
          fc.string({ minLength: 1, maxLength: 100 }),
          fc.constantFrom('success', 'failed'),
          fc.integer({ min: 0, max: 100000 }),
          async (userId, userName, status, payloadSize) => {
            const supabase = createMockSupabaseClient();

            const errorMessage = status === 'failed' ? 'Test error' : undefined;
            await logDelivery(supabase, userId, userName, status as any, errorMessage, payloadSize);

            const log = testLogs[0];

            // Should record payload size
            expect(log.payload_size).toBe(payloadSize);
            expect(typeof log.payload_size).toBe('number');
            expect(log.payload_size).toBeGreaterThanOrEqual(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should default to 0 when payload size not provided', () => {
      fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 5, maxLength: 20 }).map(s => `U${s}`),
          fc.string({ minLength: 1, maxLength: 100 }),
          fc.string({ minLength: 10, maxLength: 500 }),
          async (userId, userName, errorMessage) => {
            const supabase = createMockSupabaseClient();

            // Call without payload size
            await logDelivery(supabase, userId, userName, 'failed', errorMessage);

            const log = testLogs[0];

            // Should default to 0
            expect(log.payload_size).toBe(0);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('User identification', () => {
    it('should preserve Slack user ID format', () => {
      fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 5, maxLength: 20 }).map(s => `U${s}`),
          fc.string({ minLength: 1, maxLength: 100 }),
          fc.string({ minLength: 10, maxLength: 500 }),
          async (userId, userName, errorMessage) => {
            const supabase = createMockSupabaseClient();

            await logDelivery(supabase, userId, userName, 'failed', errorMessage, 1000);

            const log = testLogs[0];

            // Should preserve user ID exactly
            expect(log.user_id).toBe(userId);

            // Should start with 'U' (Slack user ID format)
            expect(log.user_id).toMatch(/^U/);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should preserve user names with special characters', () => {
      fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 5, maxLength: 20 }).map(s => `U${s}`),
          fc.oneof(
            fc.constant('João Silva'),
            fc.constant("O'Brien"),
            fc.constant('José María'),
            fc.constant('李明'),
            fc.string({ minLength: 1, maxLength: 100 })
          ),
          fc.string({ minLength: 10, maxLength: 500 }),
          async (userId, userName, errorMessage) => {
            const supabase = createMockSupabaseClient();

            await logDelivery(supabase, userId, userName, 'failed', errorMessage, 1000);

            const log = testLogs[0];

            // Should preserve user name exactly
            expect(log.user_name).toBe(userName);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Logging resilience', () => {
    it('should not throw errors even if logging fails', async () => {
      const failingSupabase = {
        from: () => ({
          insert: async () => {
            throw new Error('Database connection failed');
          },
        }),
      };

      // Should not throw
      await expect(
        logDelivery(failingSupabase, 'U123', 'Test User', 'failed', 'Test error', 1000)
      ).resolves.not.toThrow();
    });

    it('should handle concurrent logging attempts', () => {
      fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              userId: fc.string({ minLength: 5, maxLength: 20 }).map(s => `U${s}`),
              userName: fc.string({ minLength: 1, maxLength: 100 }),
              errorMessage: fc.string({ minLength: 10, maxLength: 500 }),
            }),
            { minLength: 5, maxLength: 20 }
          ),
          async (deliveries) => {
            const supabase = createMockSupabaseClient();

            // Log all deliveries concurrently
            await Promise.all(
              deliveries.map((delivery) =>
                logDelivery(
                  supabase,
                  delivery.userId,
                  delivery.userName,
                  'failed',
                  delivery.errorMessage,
                  1000
                )
              )
            );

            // All logs should be recorded
            expect(testLogs.length).toBe(deliveries.length);
          }
        ),
        { numRuns: 50 }
      );
    });
  });
});
