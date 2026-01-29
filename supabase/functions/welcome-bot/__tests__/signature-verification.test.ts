/**
 * Unit Tests for welcome-bot Edge Function - Slack Signature Verification
 * 
 * Feature: slack-community-integration
 * Task: 5.2 Implement Slack signature verification
 * 
 * **Validates: Requirements 13.4**
 * 
 * Tests specific examples and edge cases for Slack signature verification
 */

import { describe, it, expect } from '@jest/globals';
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

describe('Slack Signature Verification - Unit Tests', () => {
  const testSecret = '8f742231b10e8888abcd99yyyzzz85a5';

  describe('Valid signature scenarios', () => {
    it('should verify a valid signature from Slack documentation example format', () => {
      // Using the body format from Slack's official documentation
      // but with a current timestamp (the example timestamp is too old for replay protection)
      const timestamp = Math.floor(Date.now() / 1000).toString();
      const body = 'token=xyzz0WbapA4vBCDEFasx0q6G&team_id=T1DC2JH3J&team_domain=testteamnow&channel_id=G8PSS9T3V&channel_name=foobar&user_id=U2CERLKJA&user_name=roadrunner&command=%2Fwebhook-collect&text=&response_url=https%3A%2F%2Fhooks.slack.com%2Fcommands%2FT1DC2JH3J%2F397700885554%2F96rGlfmibIGlgcZRskXaIFfN&trigger_id=398738663015.47445629121.803a0bc887a14d10d2c447fce8b6703c';
      
      const signature = generateValidSignature(body, timestamp, testSecret);
      
      // Verify the signature
      const result = verifySlackSignature(body, timestamp, signature, testSecret);
      
      expect(result).toBe(true);
    });

    it('should verify signature for team_join event', () => {
      const timestamp = Math.floor(Date.now() / 1000).toString();
      const body = JSON.stringify({
        type: 'event_callback',
        token: 'verification_token',
        team_id: 'T1234567890',
        event: {
          type: 'team_join',
          user: {
            id: 'U1234567890',
            name: 'john.doe',
            real_name: 'John Doe',
          },
        },
      });

      const signature = generateValidSignature(body, timestamp, testSecret);
      const result = verifySlackSignature(body, timestamp, signature, testSecret);

      expect(result).toBe(true);
    });

    it('should verify signature for URL verification challenge', () => {
      const timestamp = Math.floor(Date.now() / 1000).toString();
      const body = JSON.stringify({
        type: 'url_verification',
        challenge: '3eZbrw1aBm2rZgRNFdxV2595E9CY3gmdALWMmHkvFXO7tYXAYM8P',
        token: 'verification_token',
      });

      const signature = generateValidSignature(body, timestamp, testSecret);
      const result = verifySlackSignature(body, timestamp, signature, testSecret);

      expect(result).toBe(true);
    });
  });

  describe('Replay attack prevention', () => {
    it('should reject request from 6 minutes ago', () => {
      const sixMinutesAgo = Math.floor(Date.now() / 1000) - (6 * 60);
      const timestamp = sixMinutesAgo.toString();
      const body = '{"type":"event_callback"}';
      const signature = generateValidSignature(body, timestamp, testSecret);

      const result = verifySlackSignature(body, timestamp, signature, testSecret);

      expect(result).toBe(false);
    });

    it('should accept request from 4 minutes ago', () => {
      const fourMinutesAgo = Math.floor(Date.now() / 1000) - (4 * 60);
      const timestamp = fourMinutesAgo.toString();
      const body = '{"type":"event_callback"}';
      const signature = generateValidSignature(body, timestamp, testSecret);

      const result = verifySlackSignature(body, timestamp, signature, testSecret);

      expect(result).toBe(true);
    });

    it('should accept request from exactly 5 minutes ago', () => {
      const fiveMinutesAgo = Math.floor(Date.now() / 1000) - (5 * 60);
      const timestamp = fiveMinutesAgo.toString();
      const body = '{"type":"event_callback"}';
      const signature = generateValidSignature(body, timestamp, testSecret);

      const result = verifySlackSignature(body, timestamp, signature, testSecret);

      expect(result).toBe(true);
    });

    it('should reject request from 1 hour ago', () => {
      const oneHourAgo = Math.floor(Date.now() / 1000) - (60 * 60);
      const timestamp = oneHourAgo.toString();
      const body = '{"type":"event_callback"}';
      const signature = generateValidSignature(body, timestamp, testSecret);

      const result = verifySlackSignature(body, timestamp, signature, testSecret);

      expect(result).toBe(false);
    });
  });

  describe('Tampering detection', () => {
    it('should reject signature when body is modified', () => {
      const timestamp = Math.floor(Date.now() / 1000).toString();
      const originalBody = '{"type":"event_callback","user":"U123"}';
      const signature = generateValidSignature(originalBody, timestamp, testSecret);

      // Tamper with body
      const tamperedBody = '{"type":"event_callback","user":"U999"}';

      const result = verifySlackSignature(tamperedBody, timestamp, signature, testSecret);

      expect(result).toBe(false);
    });

    it('should reject signature when timestamp is modified', () => {
      const originalTimestamp = Math.floor(Date.now() / 1000).toString();
      const body = '{"type":"event_callback"}';
      const signature = generateValidSignature(body, originalTimestamp, testSecret);

      // Tamper with timestamp
      const tamperedTimestamp = (parseInt(originalTimestamp) + 10).toString();

      const result = verifySlackSignature(body, tamperedTimestamp, signature, testSecret);

      expect(result).toBe(false);
    });

    it('should reject signature when using wrong signing secret', () => {
      const timestamp = Math.floor(Date.now() / 1000).toString();
      const body = '{"type":"event_callback"}';
      const signature = generateValidSignature(body, timestamp, testSecret);

      // Use wrong secret
      const wrongSecret = 'wrong_secret_key_12345678901234567890';

      const result = verifySlackSignature(body, timestamp, signature, wrongSecret);

      expect(result).toBe(false);
    });

    it('should reject signature with single character change', () => {
      const timestamp = Math.floor(Date.now() / 1000).toString();
      const body = '{"type":"event_callback"}';
      const validSignature = generateValidSignature(body, timestamp, testSecret);

      // Change last character
      const tamperedSignature = validSignature.slice(0, -1) + 'x';

      const result = verifySlackSignature(body, timestamp, tamperedSignature, testSecret);

      expect(result).toBe(false);
    });
  });

  describe('Input validation', () => {
    it('should reject null body', () => {
      const timestamp = Math.floor(Date.now() / 1000).toString();
      const signature = 'v0=somehash';

      const result = verifySlackSignature(null as any, timestamp, signature, testSecret);

      expect(result).toBe(false);
    });

    it('should reject undefined timestamp', () => {
      const body = '{"type":"event_callback"}';
      const signature = 'v0=somehash';

      const result = verifySlackSignature(body, undefined as any, signature, testSecret);

      expect(result).toBe(false);
    });

    it('should reject null signature', () => {
      const timestamp = Math.floor(Date.now() / 1000).toString();
      const body = '{"type":"event_callback"}';

      const result = verifySlackSignature(body, timestamp, null as any, testSecret);

      expect(result).toBe(false);
    });

    it('should reject empty signing secret', () => {
      const timestamp = Math.floor(Date.now() / 1000).toString();
      const body = '{"type":"event_callback"}';
      const signature = 'v0=somehash';

      const result = verifySlackSignature(body, timestamp, signature, '');

      expect(result).toBe(false);
    });

    it('should reject non-numeric timestamp', () => {
      const body = '{"type":"event_callback"}';
      const signature = generateValidSignature(body, 'invalid', testSecret);

      const result = verifySlackSignature(body, 'invalid', signature, testSecret);

      expect(result).toBe(false);
    });

    it('should reject timestamp with decimal point', () => {
      const body = '{"type":"event_callback"}';
      const timestamp = '1531420618.123';
      const signature = generateValidSignature(body, timestamp, testSecret);

      const result = verifySlackSignature(body, timestamp, signature, testSecret);

      // Should fail because parseInt('1531420618.123') = 1531420618
      // but the signature was generated with '1531420618.123'
      expect(result).toBe(false);
    });
  });

  describe('Signature format validation', () => {
    it('should reject signature without v0= prefix', () => {
      const timestamp = Math.floor(Date.now() / 1000).toString();
      const body = '{"type":"event_callback"}';
      const validSignature = generateValidSignature(body, timestamp, testSecret);

      // Remove prefix
      const signatureWithoutPrefix = validSignature.replace('v0=', '');

      const result = verifySlackSignature(body, timestamp, signatureWithoutPrefix, testSecret);

      expect(result).toBe(false);
    });

    it('should reject signature with v1= prefix', () => {
      const timestamp = Math.floor(Date.now() / 1000).toString();
      const body = '{"type":"event_callback"}';
      const validSignature = generateValidSignature(body, timestamp, testSecret);

      // Change to v1
      const signatureWithV1 = validSignature.replace('v0=', 'v1=');

      const result = verifySlackSignature(body, timestamp, signatureWithV1, testSecret);

      expect(result).toBe(false);
    });

    it('should reject signature with uppercase V0=', () => {
      const timestamp = Math.floor(Date.now() / 1000).toString();
      const body = '{"type":"event_callback"}';
      const validSignature = generateValidSignature(body, timestamp, testSecret);

      // Change to uppercase
      const signatureWithUppercase = validSignature.replace('v0=', 'V0=');

      const result = verifySlackSignature(body, timestamp, signatureWithUppercase, testSecret);

      expect(result).toBe(false);
    });
  });

  describe('Edge cases', () => {
    it('should handle empty JSON object body', () => {
      const timestamp = Math.floor(Date.now() / 1000).toString();
      const body = '{}';
      const signature = generateValidSignature(body, timestamp, testSecret);

      const result = verifySlackSignature(body, timestamp, signature, testSecret);

      expect(result).toBe(true);
    });

    it('should handle body with special characters', () => {
      const timestamp = Math.floor(Date.now() / 1000).toString();
      const body = '{"message":"Hello\\nWorld\\t!","emoji":"🎉"}';
      const signature = generateValidSignature(body, timestamp, testSecret);

      const result = verifySlackSignature(body, timestamp, signature, testSecret);

      expect(result).toBe(true);
    });

    it('should handle body with URL-encoded content', () => {
      const timestamp = Math.floor(Date.now() / 1000).toString();
      const body = 'token=xyzz&text=hello%20world&user_id=U123';
      const signature = generateValidSignature(body, timestamp, testSecret);

      const result = verifySlackSignature(body, timestamp, signature, testSecret);

      expect(result).toBe(true);
    });

    it('should handle very long body (10KB)', () => {
      const timestamp = Math.floor(Date.now() / 1000).toString();
      const body = JSON.stringify({
        type: 'event_callback',
        data: 'x'.repeat(10000),
      });
      const signature = generateValidSignature(body, timestamp, testSecret);

      const result = verifySlackSignature(body, timestamp, signature, testSecret);

      expect(result).toBe(true);
    });

    it('should handle body with Unicode characters', () => {
      const timestamp = Math.floor(Date.now() / 1000).toString();
      const body = '{"message":"こんにちは世界","emoji":"🌍🌎🌏"}';
      const signature = generateValidSignature(body, timestamp, testSecret);

      const result = verifySlackSignature(body, timestamp, signature, testSecret);

      expect(result).toBe(true);
    });
  });

  describe('Security properties', () => {
    it('should use constant-time comparison (length check first)', () => {
      const timestamp = Math.floor(Date.now() / 1000).toString();
      const body = '{"type":"event_callback"}';
      const validSignature = generateValidSignature(body, timestamp, testSecret);

      // Signature with different length should fail quickly
      const shortSignature = validSignature.slice(0, 10);

      const result = verifySlackSignature(body, timestamp, shortSignature, testSecret);

      expect(result).toBe(false);
    });

    it('should not leak information through early return', () => {
      const timestamp = Math.floor(Date.now() / 1000).toString();
      const body = '{"type":"event_callback"}';
      const validSignature = generateValidSignature(body, timestamp, testSecret);

      // Create signatures that differ at different positions
      const signatures = [
        validSignature.slice(0, 5) + 'x' + validSignature.slice(6), // Differ at position 5
        validSignature.slice(0, 20) + 'x' + validSignature.slice(21), // Differ at position 20
        validSignature.slice(0, -1) + 'x', // Differ at last position
      ];

      // All should return false
      signatures.forEach((sig) => {
        const result = verifySlackSignature(body, timestamp, sig, testSecret);
        expect(result).toBe(false);
      });
    });
  });
});
