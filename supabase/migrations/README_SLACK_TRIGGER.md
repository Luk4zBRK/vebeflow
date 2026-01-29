# Slack Webhooks Updated_at Trigger Migration

## Overview

This migration adds an automatic `updated_at` trigger to the `slack_webhooks` table. The trigger ensures that whenever a webhook configuration is updated, the `updated_at` timestamp is automatically set to the current time.

## Migration File

- **File**: `20260128080000_slack_webhooks_updated_at_trigger.sql`
- **Purpose**: Create trigger to auto-update `updated_at` column on `slack_webhooks` table
- **Dependencies**: 
  - Requires `public.update_updated_at_column()` function (created in migration `20250918134732`)
  - Requires `public.slack_webhooks` table (created in migration `20260128050000`)

## What the Trigger Does

1. **Fires on UPDATE**: The trigger activates before any UPDATE operation on the `slack_webhooks` table
2. **Updates timestamp**: Sets `NEW.updated_at = NOW()` automatically
3. **Per-row execution**: Runs for each row being updated
4. **Preserves created_at**: Does not modify the `created_at` column

## How to Apply the Migration

### Option 1: Using Supabase CLI (Recommended)

```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Link to your project
supabase link --project-ref zarigqmtaexgcayzfqpt

# Apply the migration
supabase db push
```

### Option 2: Using Supabase Dashboard

1. Go to https://supabase.com/dashboard/project/zarigqmtaexgcayzfqpt
2. Navigate to **SQL Editor**
3. Copy the contents of `20260128080000_slack_webhooks_updated_at_trigger.sql`
4. Paste and execute the SQL

### Option 3: Using psql

```bash
# Connect to your database
psql "postgresql://postgres:[YOUR-PASSWORD]@db.zarigqmtaexgcayzfqpt.supabase.co:5432/postgres"

# Run the migration
\i supabase/migrations/20260128080000_slack_webhooks_updated_at_trigger.sql
```

## How to Test the Migration

After applying the migration, you can verify it works correctly by running the test script:

```bash
# Using Supabase CLI
supabase db execute < supabase/migrations/test_slack_webhooks_trigger.sql

# Or using psql
psql "postgresql://..." < supabase/migrations/test_slack_webhooks_trigger.sql
```

### Expected Test Output

```
NOTICE:  Test 1: Inserted webhook with id=...
NOTICE:  Initial created_at: ...
NOTICE:  Initial updated_at: ...
NOTICE:  New updated_at after update: ...
NOTICE:  Test 1 PASSED: Trigger correctly updates updated_at column
NOTICE:  Test cleanup complete
NOTICE:  Test 2: Inserted webhook with id=...
NOTICE:  Test 2 PASSED: Trigger fires on UPDATE
NOTICE:  Test cleanup complete
NOTICE:  Test 3: Inserted webhook with id=...
NOTICE:  Test 3 PASSED: Trigger works correctly with multiple updates
NOTICE:  Update 1: ...
NOTICE:  Update 2: ...
NOTICE:  Update 3: ...
NOTICE:  Test cleanup complete
NOTICE:  ===========================================
NOTICE:  ALL TESTS PASSED!
NOTICE:  The updated_at trigger is working correctly
NOTICE:  ===========================================
```

## Manual Testing

You can also test manually using SQL:

```sql
-- 1. Insert a test webhook
INSERT INTO public.slack_webhooks (
  content_type,
  webhook_url,
  channel_name,
  is_enabled
) VALUES (
  'workflow',
  'https://hooks.slack.com/services/TEST/TEST/TEST',
  '#test-channel',
  true
) RETURNING id, created_at, updated_at;

-- Note the id and timestamps

-- 2. Wait a moment, then update the webhook
UPDATE public.slack_webhooks
SET channel_name = '#updated-channel'
WHERE id = '<your-id-here>'
RETURNING created_at, updated_at;

-- 3. Verify:
--    - created_at should be the same as before
--    - updated_at should be newer than the initial value

-- 4. Cleanup
DELETE FROM public.slack_webhooks WHERE id = '<your-id-here>';
```

## Verification Checklist

After applying the migration, verify:

- [ ] Trigger exists: `SELECT * FROM pg_trigger WHERE tgname = 'update_slack_webhooks_updated_at';`
- [ ] Trigger is enabled: Check `tgenabled` column is 'O' (enabled)
- [ ] Test script passes all 3 tests
- [ ] Manual update test shows `updated_at` changes
- [ ] Manual update test shows `created_at` stays the same

## Rollback

If you need to remove the trigger:

```sql
DROP TRIGGER IF EXISTS update_slack_webhooks_updated_at ON public.slack_webhooks;
```

## Related Files

- **Migration**: `supabase/migrations/20260128080000_slack_webhooks_updated_at_trigger.sql`
- **Test Script**: `supabase/migrations/test_slack_webhooks_trigger.sql`
- **Table Migration**: `supabase/migrations/20260128050000_slack_webhooks.sql`
- **Function Definition**: `supabase/migrations/20250918134732_db46b781-e901-4c06-bbf8-c97486dd13c3.sql`

## Requirements Satisfied

This migration satisfies **Requirement 7.2** from the Slack Community Integration spec:

> THE slack_webhooks table SHALL include columns: id, content_type, webhook_url, channel_name, is_enabled, created_at, **updated_at**

The trigger ensures the `updated_at` column is automatically maintained without requiring manual updates in application code.
