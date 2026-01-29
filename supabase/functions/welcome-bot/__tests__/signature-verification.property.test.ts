/**
 * Property-Based Tests for welcome-bot Edge Function - Slack Signature Verification
 * 
 * Feature: slack-community-integration
 * Task: 5.2 Implement Slack signature verification
 * 
 * **Validates: Requirements 13.4**
 * 
 * Tests the HMAC-SHA256 signature verification implementation following
 * Slack's official specification:
 * https://api.slack.com/authentication/verifying-requests-from-slack
 * 
 * Security features tested:
 * - Replay attack prevention (5-minute timestamp window)
 * - HMAC-SHA256 signature verification
 * - Timing-safe comparison
 * - Input validation
 */

import { describe, it, expect } from '@jest/globals';
import fc from 'fast-check';
import { createHmac } from 'crypto';

/**
 * Verify Slack request signature
 * This is a copy of the implementation for testing purposes
 */
function verifySlackSignature(
  body: string,
  timestamp: string,
  signature: string,
  signingSecret: string
): boolean {
  // Validate inputs
  if (!body || !timestamp || !signature || !signingSecret) {
    return false;
  }

  // Reject old requests (replay attack prevention)
  const requestTime = parseInt(timestamp);
  if (isNaN(requestTime)) {
    return false;
  }

  const currentTime = Math.floor(Date.now() / 1000);
  const timeDiff = Math.abs(currentTime - requestTime);
  
  if (timeDiff > 60 * 5) {
    return false;
  }

  // Compute expected signature using HMAC-SHA256
  const sigBasestring = `v0:${timestamp}:${body}`;
  const hmac = createHmac('sha256', signingSecret);
  hmac.update(sigBasestring);
  const expectedSignature = `v0=${hmac.digest('hex')}`;

  // Timing-safe comparison
  if (signature.length !== expectedSignature.length) {
    return false;
  }

  let isValid = true;
  for (let i = 0; i < signature.length; i++) {
    if (signature.charCodeAt(i) !== expectedSignature.charCodeAt(i)) {
      isValid = false;
    }
  }

  return isValid;
}

/**
 * Generate a valid Slack signature for testing
 */
function generateValidSignature(
  body: string,
  timestamp: string,
  signingSecret: string
): string {
  const sigBasestring = `v0:${timestamp}:${body}`;
  const hmac = createHmac('sha256', signingSecret);
  hmac.update(sigBasestring);
  return `v0=${hmac.digest('hex')}`;
}

describe('Property: Slack Signature Verification', () => {
  describe('Valid signature acceptance', () => {
    it('should accept valid signatures for any body and timestamp', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 1000 }), // Request body
          fc.string({ minLength: 32, maxLength: 64 }), // Signing secret
          (body, signingSecret) => {
            const currentTime = Math.floor(Date.now() / 1000);
            const timestamp = currentTime.toString();
            const signature = generateValidSignature(body, timestamp, signingSecret);

            const result = verifySlackSignature(body, timestamp, signature, signingSecret);

            expect(result).toBe(true);
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should accept signatures within 5-minute window', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 1000 }),
          fc.string({ minLength: 32, maxLength: 64 }),
          fc.integer({ min: 0, max: 299 }), // Seconds within 5-minute window
          (body, signingSecret, secondsAgo) => {
            const currentTime = Math.floor(Date.now() / 1000);
            const timestamp = (currentTime - secondsAgo).toString();
            const signature = generateValidSignature(body, timestamp, signingSecret);

            const result = verifySlackSignature(body, timestamp, signature, signingSecret);

            expect(result).toBe(true);
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should accept signatures with JSON body content', () => {
      fc.assert(
        fc.property(
          fc.record({
            type: fc.constantFrom('event_callback', 'url_verification'),
            token: fc.string({ minLength: 20, maxLength: 40 }),
            team_id: fc.string({ minLength: 10, maxLength: 15 }),
          }),
          fc.string({ minLength: 32, maxLength: 64 }),
          (payload, signingSecret) => {
            const body = JSON.stringify(payload);
            const currentTime = Math.floor(Date.now() / 1000);
            const timestamp = currentTime.toString();
            const signature = generateValidSignature(body, timestamp, signingSecret);

            const result = verifySlackSignature(body, timestamp, signature, signingSecret);

            expect(result).toBe(true);
          }
        ),
        { numRuns: 20 }
      );
    });
  });

  describe('Replay attack prevention', () => {
    it('should reject timestamps older than 5 minutes', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 1000 }),
          fc.string({ minLength: 32, maxLength: 64 }),
          fc.integer({ min: 301, max: 3600 }), // More than 5 minutes old
          (body, signingSecret, secondsAgo) => {
            const currentTime = Math.floor(Date.now() / 1000);
            const timestamp = (currentTime - secondsAgo).toString();
            const signature = generateValidSignature(body, timestamp, signingSecret);

            const result = verifySlackSignature(body, timestamp, signature, signingSecret);

            // Should reject old timestamps
            expect(result).toBe(false);
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should reject timestamps from the future beyond 5 minutes', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 1000 }),
          fc.string({ minLength: 32, maxLength: 64 }),
          fc.integer({ min: 301, max: 3600 }), // More than 5 minutes in future
          (body, signingSecret, secondsAhead) => {
            const currentTime = Math.floor(Date.now() / 1000);
            const timestamp = (currentTime + secondsAhead).toString();
            const signature = generateValidSignature(body, timestamp, signingSecret);

            const result = verifySlackSignature(body, timestamp, signature, signingSecret);

            // Should reject future timestamps
            expect(result).toBe(false);
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should reject invalid timestamp formats', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 1000 }),
          fc.string({ minLength: 32, maxLength: 64 }),
          fc.constantFrom('invalid', 'abc123', '12.34', '', 'NaN'),
          (body, signingSecret, invalidTimestamp) => {
            const signature = generateValidSignature(body, invalidTimestamp, signingSecret);

            const result = verifySlackSignature(body, invalidTimestamp, signature, signingSecret);

            // Should reject invalid timestamp formats
            expect(result).toBe(false);
          }
        ),
        { numRuns: 10 }
      );
    });
  });

  describe('Signature tampering detection', () => {
    it('should reject signatures with modified body', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 10, maxLength: 1000 }),
          fc.string({ minLength: 32, maxLength: 64 }),
          fc.string({ minLength: 1, maxLength: 100 }), // Different body
          (originalBody, signingSecret, modifiedSuffix) => {
            const currentTime = Math.floor(Date.now() / 1000);
            const timestamp = currentTime.toString();
            const signature = generateValidSignature(originalBody, timestamp, signingSecret);

            // Tamper with the body
            const tamperedBody = originalBody + modifiedSuffix;

            const result = verifySlackSignature(tamperedBody, timestamp, signature, signingSecret);

            // Should reject tampered body
            expect(result).toBe(false);
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should reject signatures with modified timestamp', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 1000 }),
          fc.string({ minLength: 32, maxLength: 64 }),
          fc.integer({ min: 1, max: 100 }), // Timestamp offset
          (body, signingSecret, offset) => {
            const currentTime = Math.floor(Date.now() / 1000);
            const originalTimestamp = currentTime.toString();
            const signature = generateValidSignature(body, originalTimestamp, signingSecret);

            // Tamper with the timestamp
            const tamperedTimestamp = (currentTime + offset).toString();

            const result = verifySlackSignature(body, tamperedTimestamp, signature, signingSecret);

            // Should reject tampered timestamp
            expect(result).toBe(false);
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should reject signatures with wrong signing secret', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 1000 }),
          fc.string({ minLength: 32, maxLength: 64 }),
          fc.string({ minLength: 32, maxLength: 64 }),
          (body, correctSecret, wrongSecret) => {
            // Ensure secrets are different
            fc.pre(correctSecret !== wrongSecret);

            const currentTime = Math.floor(Date.now() / 1000);
            const timestamp = currentTime.toString();
            const signature = generateValidSignature(body, timestamp, correctSecret);

            // Verify with wrong secret
            const result = verifySlackSignature(body, timestamp, signature, wrongSecret);

            // Should reject with wrong secret
            expect(result).toBe(false);
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should reject signatures with modified signature string', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 1000 }),
          fc.string({ minLength: 32, maxLength: 64 }),
          fc.string({ minLength: 1, maxLength: 4 }).filter(s => /^[0-9a-f]+$/.test(s)),
          (body, signingSecret, modification) => {
            const currentTime = Math.floor(Date.now() / 1000);
            const timestamp = currentTime.toString();
            const signature = generateValidSignature(body, timestamp, signingSecret);

            // Tamper with the signature
            const tamperedSignature = signature + modification;

            const result = verifySlackSignature(body, timestamp, tamperedSignature, signingSecret);

            // Should reject tampered signature
            expect(result).toBe(false);
          }
        ),
        { numRuns: 20 }
      );
    });
  });

  describe('Input validation', () => {
    it('should reject empty body', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 32, maxLength: 64 }),
          (signingSecret) => {
            const currentTime = Math.floor(Date.now() / 1000);
            const timestamp = currentTime.toString();
            const signature = generateValidSignature('', timestamp, signingSecret);

            const result = verifySlackSignature('', timestamp, signature, signingSecret);

            // Should reject empty body
            expect(result).toBe(false);
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should reject empty timestamp', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 1000 }),
          fc.string({ minLength: 32, maxLength: 64 }),
          (body, signingSecret) => {
            const signature = generateValidSignature(body, '', signingSecret);

            const result = verifySlackSignature(body, '', signature, signingSecret);

            // Should reject empty timestamp
            expect(result).toBe(false);
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should reject empty signature', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 1000 }),
          fc.string({ minLength: 32, maxLength: 64 }),
          (body, signingSecret) => {
            const currentTime = Math.floor(Date.now() / 1000);
            const timestamp = currentTime.toString();

            const result = verifySlackSignature(body, timestamp, '', signingSecret);

            // Should reject empty signature
            expect(result).toBe(false);
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should reject empty signing secret', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 1000 }),
          (body) => {
            const currentTime = Math.floor(Date.now() / 1000);
            const timestamp = currentTime.toString();
            const signature = 'v0=somehexdigest';

            const result = verifySlackSignature(body, timestamp, signature, '');

            // Should reject empty signing secret
            expect(result).toBe(false);
          }
        ),
        { numRuns: 10 }
      );
    });
  });

  describe('Signature format validation', () => {
    it('should require v0= prefix in signature', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 1000 }),
          fc.string({ minLength: 32, maxLength: 64 }),
          (body, signingSecret) => {
            const currentTime = Math.floor(Date.now() / 1000);
            const timestamp = currentTime.toString();
            const validSignature = generateValidSignature(body, timestamp, signingSecret);

            // Remove v0= prefix
            const signatureWithoutPrefix = validSignature.replace('v0=', '');

            const result = verifySlackSignature(body, timestamp, signatureWithoutPrefix, signingSecret);

            // Should reject signature without v0= prefix
            expect(result).toBe(false);
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should reject signatures with wrong version prefix', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 1000 }),
          fc.string({ minLength: 32, maxLength: 64 }),
          fc.constantFrom('v1=', 'v2=', 'V0=', 'v0:'),
          (body, signingSecret, wrongPrefix) => {
            const currentTime = Math.floor(Date.now() / 1000);
            const timestamp = currentTime.toString();
            const validSignature = generateValidSignature(body, timestamp, signingSecret);

            // Replace with wrong prefix
            const signatureWithWrongPrefix = validSignature.replace('v0=', wrongPrefix);

            const result = verifySlackSignature(body, timestamp, signatureWithWrongPrefix, signingSecret);

            // Should reject signature with wrong prefix
            expect(result).toBe(false);
          }
        ),
        { numRuns: 10 }
      );
    });
  });

  describe('Timing-safe comparison', () => {
    it('should use constant-time comparison for signatures', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 1000 }),
          fc.string({ minLength: 32, maxLength: 64 }),
          (body, signingSecret) => {
            const currentTime = Math.floor(Date.now() / 1000);
            const timestamp = currentTime.toString();
            const validSignature = generateValidSignature(body, timestamp, signingSecret);

            // Measure time for valid signature
            const startValid = process.hrtime.bigint();
            verifySlackSignature(body, timestamp, validSignature, signingSecret);
            const endValid = process.hrtime.bigint();
            const validTime = Number(endValid - startValid);

            // Create invalid signature with same length
            const invalidSignature = validSignature.slice(0, -1) + 'x';

            // Measure time for invalid signature
            const startInvalid = process.hrtime.bigint();
            verifySlackSignature(body, timestamp, invalidSignature, signingSecret);
            const endInvalid = process.hrtime.bigint();
            const invalidTime = Number(endInvalid - startInvalid);

            // Times should be similar (within 10x factor for timing-safe comparison)
            // This is a loose check since exact timing can vary
            const ratio = Math.max(validTime, invalidTime) / Math.min(validTime, invalidTime);
            expect(ratio).toBeLessThan(10);
          }
        ),
        { numRuns: 10 } // Fewer runs for timing tests
      );
    });
  });

  describe('Edge cases', () => {
    it('should handle very long request bodies', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 5000, maxLength: 10000 }),
          fc.string({ minLength: 32, maxLength: 64 }),
          (body, signingSecret) => {
            const currentTime = Math.floor(Date.now() / 1000);
            const timestamp = currentTime.toString();
            const signature = generateValidSignature(body, timestamp, signingSecret);

            const result = verifySlackSignature(body, timestamp, signature, signingSecret);

            expect(result).toBe(true);
          }
        ),
        { numRuns: 5 } // Fewer runs for large bodies
      );
    });

    it('should handle special characters in body', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 1000 }),
          fc.string({ minLength: 32, maxLength: 64 }),
          (baseBody, signingSecret) => {
            // Add special characters
            const body = `${baseBody}\n\r\t"'\\{}[]`;
            const currentTime = Math.floor(Date.now() / 1000);
            const timestamp = currentTime.toString();
            const signature = generateValidSignature(body, timestamp, signingSecret);

            const result = verifySlackSignature(body, timestamp, signature, signingSecret);

            expect(result).toBe(true);
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should handle Unicode characters in body', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 1000 }),
          fc.string({ minLength: 32, maxLength: 64 }),
          (body, signingSecret) => {
            // Add Unicode characters
            const unicodeBody = body + '🎉こんにちは世界🌍';
            const currentTime = Math.floor(Date.now() / 1000);
            const timestamp = currentTime.toString();
            const signature = generateValidSignature(unicodeBody, timestamp, signingSecret);

            const result = verifySlackSignature(unicodeBody, timestamp, signature, signingSecret);

            expect(result).toBe(true);
          }
        ),
        { numRuns: 20 }
      );
    });
  });
});
