# Setup Guide for Property-Based Tests

## Quick Start

### Option 1: Local Supabase (Recommended for Development)

1. **Install Supabase CLI** (if not already installed):
   ```bash
   npm install -g supabase
   ```

2. **Start Local Supabase**:
   ```bash
   supabase start
   ```
   
   This will start a local Supabase instance with PostgreSQL, PostgREST, and other services.

3. **Get your credentials**:
   ```bash
   supabase status
   ```
   
   Look for:
   - `API URL`: This is your `SUPABASE_URL` (usually `http://localhost:54321`)
   - `service_role key`: This is your `SUPABASE_SERVICE_ROLE_KEY`

4. **Apply migrations**:
   ```bash
   supabase db push
   ```

5. **Create .env.test file**:
   ```bash
   cp .env.test.example .env.test
   ```
   
   Edit `.env.test` and add your credentials from step 3.

6. **Run tests**:
   ```bash
   npm test
   ```

### Option 2: Remote Supabase Instance

1. **Get credentials from Supabase Dashboard**:
   - Go to your project settings
   - Navigate to API section
   - Copy the `URL` and `service_role` key

2. **Create .env.test file**:
   ```bash
   cp .env.test.example .env.test
   ```
   
   Edit `.env.test`:
   ```env
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

3. **Ensure migrations are applied**:
   - Check that the `slack_webhooks` table exists in your database
   - If not, apply migrations via Supabase Dashboard or CLI

4. **Run tests**:
   ```bash
   npm test
   ```

## Troubleshooting

### "Tests are skipped" warning

**Problem**: Tests show a warning and are skipped.

**Solution**: 
- Ensure `.env.test` file exists in the project root
- Verify `SUPABASE_SERVICE_ROLE_KEY` is set in `.env.test`
- Check that the key is not empty or invalid

### Connection refused errors

**Problem**: Tests fail with connection errors.

**Solution**:
- For local: Ensure `supabase start` is running
- For remote: Check your internet connection and Supabase URL
- Verify the `SUPABASE_URL` in `.env.test` is correct

### "Table does not exist" errors

**Problem**: Tests fail because `slack_webhooks` table is not found.

**Solution**:
```bash
# For local Supabase
supabase db push

# For remote Supabase
# Apply migrations via Supabase Dashboard or:
supabase db push --linked
```

### Permission denied errors

**Problem**: Tests fail with permission errors.

**Solution**:
- Ensure you're using the `service_role` key, not the `anon` key
- The service role key bypasses RLS policies and is required for tests

### Tests timeout

**Problem**: Tests take too long and timeout.

**Solution**:
- Check your database connection speed
- For remote instances, consider using local Supabase for testing
- The timeout is set to 30 seconds in `jest.config.js`

## Running Specific Tests

```bash
# Run only constraint tests
npm test -- slack-webhooks-constraints

# Run a specific property test
npm test -- -t "Property 17"

# Run in watch mode
npm run test:watch

# Run with verbose output
npm test -- --verbose
```

## CI/CD Setup

For GitHub Actions, add these secrets to your repository:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

Example workflow:

```yaml
name: Test

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm install
      
      - name: Setup Supabase CLI
        uses: supabase/setup-cli@v1
      
      - name: Start Supabase
        run: supabase start
      
      - name: Run tests
        run: npm test
        env:
          SUPABASE_URL: http://localhost:54321
          SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
```

## Security Notes

⚠️ **IMPORTANT**: Never commit `.env.test` to version control!

The `.env.test` file contains sensitive credentials. It's already in `.gitignore`, but double-check:

```bash
# Verify .env.test is ignored
git check-ignore .env.test
# Should output: .env.test
```

## What Gets Tested

These property-based tests validate database constraints using randomized inputs:

1. **Property 17**: Content type constraint - validates only allowed values
2. **Property 19**: Unique constraint - ensures no duplicate (content_type, channel_name) pairs
3. **Property 20**: Soft delete - verifies records are disabled, not deleted

Each property runs 50-100 iterations with random data to ensure robustness.
