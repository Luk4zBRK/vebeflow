# Slack Signature Verification Implementation

## Overview

This document describes the Slack signature verification implementation in the welcome-bot Edge Function, following Slack's official specification.

## Implementation Details

### Algorithm: HMAC-SHA256

The implementation follows Slack's signature verification process:

1. **Extract Headers**: Get `x-slack-request-timestamp` and `x-slack-signature` from request headers
2. **Validate Timestamp**: Reject requests older than 5 minutes (replay attack prevention)
3. **Compute Signature**: Create HMAC-SHA256 hash of `v0:timestamp:body` using signing secret
4. **Compare Signatures**: Use timing-safe comparison to verify signatures match

### Security Features

#### 1. Replay Attack Prevention
- Rejects requests with timestamps older than 5 minutes
- Rejects requests with timestamps more than 5 minutes in the future
- Validates timestamp format (must be valid Unix timestamp)

```typescript
const requestTime = parseInt(timestamp);
const currentTime = Math.floor(Date.now() / 1000);
const timeDiff = Math.abs(currentTime - requestTime);

if (timeDiff > 60 * 5) {
  return false; // Reject old/future requests
}
```

#### 2. HMAC-SHA256 Signature Verification
- Uses Node.js crypto module's `createHmac` function
- Follows Slack's exact format: `v0:timestamp:body`
- Generates hex digest with `v0=` prefix

```typescript
const sigBasestring = `v0:${timestamp}:${body}`;
const hmac = createHmac('sha256', signingSecret);
hmac.update(sigBasestring);
const expectedSignature = `v0=${hmac.digest('hex')}`;
```

#### 3. Timing-Safe Comparison
- Prevents timing attacks by comparing all bytes
- Does not short-circuit on first mismatch
- Checks length first for early rejection

```typescript
if (signature.length !== expectedSignature.length) {
  return false;
}

let isValid = true;
for (let i = 0; i < signature.length; i++) {
  if (signature.charCodeAt(i) !== expectedSignature.charCodeAt(i)) {
    isValid = false; // Don't return early
  }
}
return isValid;
```

#### 4. Input Validation
- Validates all required parameters are present
- Checks timestamp is a valid number
- Logs detailed error messages for debugging

### Usage

```typescript
const body = await req.text();
const timestamp = req.headers.get('x-slack-request-timestamp') || '';
const signature = req.headers.get('x-slack-signature') || '';
const signingSecret = Deno.env.get('SLACK_SIGNING_SECRET');

if (!verifySlackSignature(body, timestamp, signature, signingSecret)) {
  return new Response(
    JSON.stringify({ error: 'Invalid signature' }),
    { status: 401 }
  );
}
```

## Testing

### Unit Tests
Located in `__tests__/signature-verification.test.ts`

Tests cover:
- Valid signature acceptance
- Replay attack prevention (5-minute window)
- Tampering detection (body, timestamp, signature modifications)
- Input validation (null, empty, invalid formats)
- Signature format validation (v0= prefix requirement)
- Edge cases (special characters, Unicode, large bodies)
- Security properties (timing-safe comparison)

### Property-Based Tests
Located in `__tests__/signature-verification.property.test.ts`

Tests verify properties across randomized inputs:
- Valid signatures always accepted within time window
- Old timestamps always rejected (>5 minutes)
- Tampered data always rejected
- Input validation always enforced
- Timing-safe comparison behavior

## Configuration

### Environment Variables

- `SLACK_SIGNING_SECRET`: Your app's signing secret from Slack admin panel
  - Found in: Slack App Settings → Basic Information → App Credentials
  - Format: 32-64 character alphanumeric string
  - Example: `8f742231b10e8888abcd99yyyzzz85a5`

### Security Best Practices

1. **Never commit signing secret**: Use environment variables
2. **Rotate regularly**: Use Slack's "Regenerate" button periodically
3. **Monitor logs**: Check for repeated signature failures (potential attack)
4. **Use HTTPS**: Always use HTTPS endpoints for Slack webhooks

## References

- [Slack Official Documentation](https://api.slack.com/authentication/verifying-requests-from-slack)
- [HMAC Security Best Practices](https://tools.ietf.org/html/rfc2104)
- Task: 5.2 Implement Slack signature verification
- Requirements: 13.4 (Security and Authentication)

## Compliance

✅ **Requirement 13.4**: Validates that requests originate from authenticated sources
✅ **Replay Attack Prevention**: 5-minute timestamp window
✅ **HMAC-SHA256**: Industry-standard signature algorithm
✅ **Timing-Safe Comparison**: Prevents timing attack vulnerabilities
✅ **Input Validation**: Comprehensive parameter checking
✅ **Logging**: Detailed error messages for debugging

## Maintenance

### Common Issues

1. **"Invalid signature" errors**
   - Verify `SLACK_SIGNING_SECRET` is correct
   - Check timestamp is within 5-minute window
   - Ensure request body is not modified before verification

2. **"Request timestamp too old"**
   - Check server time is synchronized (NTP)
   - Verify network latency is acceptable
   - Consider clock skew between Slack and your server

3. **"Invalid timestamp format"**
   - Ensure `x-slack-request-timestamp` header is present
   - Verify header contains Unix timestamp (seconds, not milliseconds)

### Debugging

Enable debug logging by checking console output:
```typescript
console.log('🔐 Verifying Slack signature...');
console.debug('Request details:', {
  hasTimestamp: !!timestamp,
  hasSignature: !!signature,
  bodyLength: body.length,
});
```

## Version History

- **v1.0** (2024-01-28): Initial implementation with HMAC-SHA256 and timing-safe comparison
