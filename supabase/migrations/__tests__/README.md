# Slack Community Integration - Property-Based Tests

This directory contains property-based tests for the Slack Community Integration database constraints using `fast-check`.

## Test Files

- `slack-webhooks-constraints.test.ts` - Property tests for database constraints (Task 1.5)

## Properties Tested

### Property 17: Content type constraint
**Validates: Requirements 7.3**

Tests that the `content_type` column only accepts values from the set: `{'workflow', 'mcp_server', 'blog_post', 'ide_news'}`. Any other value should be rejected with a check constraint violation.

### Property 19: Unique content type and channel
**Validates: Requirements 7.5**

Tests that the unique constraint on `(content_type, channel_name)` is enforced. Two webhooks cannot have the same content type and channel name combination.

### Property 20: Soft delete behavior
**Validates: Requirements 7.6**

Tests that webhook deletions are "soft deletes" - the record remains in the database with `is_enabled` set to `false` rather than being physically removed.

## Setup

### Prerequisites

1. **Supabase Local Development** (recommended):
   ```bash
   # Install Supabase CLI
   npm install -g supabase
   
   # Start local Supabase
   supabase start
   ```

2. **Environment Variables**:
   Create a `.env.test` file in the project root:
   ```env
   SUPABASE_URL=http://localhost:54321
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
   ```

   For local development, get the service role key from:
   ```bash
   supabase status
   ```

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run only property tests
npm test -- slack-webhooks-constraints

# Run with coverage
npm test -- --coverage
```

## Test Configuration

- **Number of runs**: Each property test runs 100 iterations by default (50 for some complex tests)
- **Test environment**: Node.js with Jest and ts-jest
- **Database**: Tests require a live Supabase instance (local or remote)

## Important Notes

1. **Database State**: Tests clean up after themselves, but if tests fail unexpectedly, you may need to manually clean the `slack_webhooks` table.

2. **Service Role Key**: Tests use the service role key to bypass RLS policies. Never commit this key to version control.

3. **Test Isolation**: Each test cleans up before and after execution to ensure isolation.

4. **Skipped Tests**: If `SUPABASE_SERVICE_ROLE_KEY` is not set, tests will be skipped with a warning rather than failing.

## Troubleshooting

### Tests are skipped
- Ensure `SUPABASE_SERVICE_ROLE_KEY` environment variable is set
- Check that Supabase is running (local or remote)

### Connection errors
- Verify `SUPABASE_URL` is correct
- Check that the database migrations have been applied:
  ```bash
  supabase db push
  ```

### Constraint violations not detected
- Ensure migrations are up to date
- Check that the `slack_webhooks` table has the correct constraints:
  ```sql
  \d+ slack_webhooks
  ```

## CI/CD Integration

These tests should be run in CI/CD pipelines before deployment. Example GitHub Actions workflow:

```yaml
- name: Start Supabase
  run: supabase start

- name: Run property tests
  run: npm test
  env:
    SUPABASE_URL: http://localhost:54321
    SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
```
