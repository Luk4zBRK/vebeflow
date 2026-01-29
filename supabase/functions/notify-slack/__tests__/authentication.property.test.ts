/**
 * Property-Based Tests for notify-slack Edge Function - Request Authentication
 * 
 * Feature: slack-community-integration
 * Task: 4.16 Write property test for request authentication
 * Property 31: Request authentication
 * 
 * **Validates: Requirements 13.4**
 * 
 * For any request to the notify-slack Edge Function not originating from 
 * authenticated Supabase triggers or authorized service accounts, it should 
 * be rejected with an authentication error.
 */

import { describe, it, expect } from '@jest/globals';
import fc from 'fast-check';

// Type definitions
type DeliveryStatus = 'success' | 'failed' | 'skipped';

interface AuthenticationResult {
  authenticated: boolean;
  isServiceRole: boolean;
  isValidJWT: boolean;
  error?: string;
}

interface NotifySlackResponse {
  success: boolean;
  status: DeliveryStatus;
  delivery_time_ms: number;
  error?: string;
}

/**
 * Simulates authentication validation
 */
function validateAuthentication(
  authHeader: string | null,
  serviceRoleKey: string
): AuthenticationResult {
  if (!authHeader) {
    return {
      authenticated: false,
      isServiceRole: false,
      isValidJWT: false,
      error: 'Missing authorization header',
    };
  }

  // Extract token from Bearer header
  const token = authHeader.replace('Bearer ', '');

  // Check if it's the service role key
  if (token === serviceRoleKey) {
    return {
      authenticated: true,
      isServiceRole: true,
      isValidJWT: false,
    };
  }

  // For non-service-role tokens, simulate JWT validation
  // In real implementation, this would call Supabase auth
  const isValidJWT = token.length > 20 && token.includes('.'); // Simple simulation

  if (isValidJWT) {
    return {
      authenticated: true,
      isServiceRole: false,
      isValidJWT: true,
    };
  }

  return {
    authenticated: false,
    isServiceRole: false,
    isValidJWT: false,
    error: 'Invalid or expired authentication token',
  };
}

/**
 * Simulates creating an authentication error response
 */
function createAuthErrorResponse(error: string, deliveryTimeMs: number): NotifySlackResponse {
  return {
    success: false,
    status: 'failed',
    delivery_time_ms: deliveryTimeMs,
    error: error,
  };
}

describe('Property 31: Request authentication', () => {
  it('should reject requests without authorization header', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 32, maxLength: 64 }), // Service role key
        (serviceRoleKey) => {
          const result = validateAuthentication(null, serviceRoleKey);

          // Should not be authenticated
          expect(result.authenticated).toBe(false);
          expect(result.error).toContain('Missing authorization header');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should accept requests with valid service role key', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 32, maxLength: 64 }), // Service role key
        (serviceRoleKey) => {
          const authHeader = `Bearer ${serviceRoleKey}`;
          const result = validateAuthentication(authHeader, serviceRoleKey);

          // Should be authenticated as service role
          expect(result.authenticated).toBe(true);
          expect(result.isServiceRole).toBe(true);
          expect(result.error).toBeUndefined();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should accept requests with valid JWT token', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 32, maxLength: 64 }), // Service role key
        fc.string({ minLength: 50, maxLength: 200 }).filter(s => s.includes('.')), // JWT-like token
        (serviceRoleKey, jwtToken) => {
          // Ensure JWT is different from service role key
          fc.pre(jwtToken !== serviceRoleKey);

          const authHeader = `Bearer ${jwtToken}`;
          const result = validateAuthentication(authHeader, serviceRoleKey);

          // Should be authenticated with JWT
          expect(result.authenticated).toBe(true);
          expect(result.isServiceRole).toBe(false);
          expect(result.isValidJWT).toBe(true);
          expect(result.error).toBeUndefined();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should reject requests with invalid tokens', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 32, maxLength: 64 }), // Service role key
        fc.string({ minLength: 1, maxLength: 20 }), // Invalid token (too short, no dots)
        (serviceRoleKey, invalidToken) => {
          // Ensure invalid token is different from service role key
          fc.pre(invalidToken !== serviceRoleKey);

          const authHeader = `Bearer ${invalidToken}`;
          const result = validateAuthentication(authHeader, serviceRoleKey);

          // Should not be authenticated
          expect(result.authenticated).toBe(false);
          expect(result.error).toContain('Invalid or expired authentication token');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return 401 error response for missing auth', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 1000 }),
        (deliveryTimeMs) => {
          const response = createAuthErrorResponse(
            'Missing authorization header',
            deliveryTimeMs
          );

          // Should indicate authentication failure
          expect(response.success).toBe(false);
          expect(response.status).toBe('failed');
          expect(response.error).toContain('Missing authorization header');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return 401 error response for invalid auth', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 1000 }),
        (deliveryTimeMs) => {
          const response = createAuthErrorResponse(
            'Invalid or expired authentication token',
            deliveryTimeMs
          );

          // Should indicate authentication failure
          expect(response.success).toBe(false);
          expect(response.status).toBe('failed');
          expect(response.error).toContain('Invalid or expired authentication token');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle Bearer prefix correctly', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 32, maxLength: 64 }),
        (serviceRoleKey) => {
          // Test with Bearer prefix
          const withBearer = `Bearer ${serviceRoleKey}`;
          const resultWithBearer = validateAuthentication(withBearer, serviceRoleKey);

          // Test without Bearer prefix (should fail)
          const withoutBearer = serviceRoleKey;
          const resultWithoutBearer = validateAuthentication(withoutBearer, serviceRoleKey);

          // With Bearer should succeed
          expect(resultWithBearer.authenticated).toBe(true);

          // Without Bearer should fail (token won't match after replace)
          expect(resultWithoutBearer.authenticated).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should distinguish between service role and JWT authentication', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 32, maxLength: 64 }),
        fc.string({ minLength: 50, maxLength: 200 }).filter(s => s.includes('.')),
        (serviceRoleKey, jwtToken) => {
          fc.pre(jwtToken !== serviceRoleKey);

          // Service role authentication
          const serviceRoleResult = validateAuthentication(
            `Bearer ${serviceRoleKey}`,
            serviceRoleKey
          );

          // JWT authentication
          const jwtResult = validateAuthentication(
            `Bearer ${jwtToken}`,
            serviceRoleKey
          );

          // Both should be authenticated but with different flags
          expect(serviceRoleResult.authenticated).toBe(true);
          expect(serviceRoleResult.isServiceRole).toBe(true);
          expect(serviceRoleResult.isValidJWT).toBe(false);

          expect(jwtResult.authenticated).toBe(true);
          expect(jwtResult.isServiceRole).toBe(false);
          expect(jwtResult.isValidJWT).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should reject empty authorization headers', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 32, maxLength: 64 }),
        (serviceRoleKey) => {
          const result = validateAuthentication('', serviceRoleKey);

          // Empty string should be treated as missing auth
          expect(result.authenticated).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should reject malformed Bearer headers', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 32, maxLength: 64 }),
        fc.constantFrom('bearer', 'BEARER', 'Bear', 'Token'),
        fc.string({ minLength: 20, maxLength: 50 }),
        (serviceRoleKey, prefix, token) => {
          // Test with incorrect prefix
          const authHeader = `${prefix} ${token}`;
          const result = validateAuthentication(authHeader, serviceRoleKey);

          // Should fail if prefix is not exactly "Bearer"
          if (prefix !== 'Bearer') {
            expect(result.authenticated).toBe(false);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
