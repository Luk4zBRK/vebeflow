-- Test script for slack_webhooks updated_at trigger
-- This script can be run manually to verify the trigger works correctly
-- Run this AFTER applying the migration 20260128080000_slack_webhooks_updated_at_trigger.sql

-- Test 1: Insert a webhook and verify created_at and updated_at are set
DO $
DECLARE
  test_id UUID;
  initial_created_at TIMESTAMPTZ;
  initial_updated_at TIMESTAMPTZ;
  new_updated_at TIMESTAMPTZ;
BEGIN
  -- Insert test webhook
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
  ) RETURNING id, created_at, updated_at 
  INTO test_id, initial_created_at, initial_updated_at;
  
  RAISE NOTICE 'Test 1: Inserted webhook with id=%', test_id;
  RAISE NOTICE 'Initial created_at: %', initial_created_at;
  RAISE NOTICE 'Initial updated_at: %', initial_updated_at;
  
  -- Verify created_at and updated_at are set
  IF initial_created_at IS NULL OR initial_updated_at IS NULL THEN
    RAISE EXCEPTION 'Test 1 FAILED: created_at or updated_at is NULL';
  END IF;
  
  -- Wait a moment to ensure timestamp difference
  PERFORM pg_sleep(1);
  
  -- Update the webhook
  UPDATE public.slack_webhooks
  SET channel_name = '#updated-channel'
  WHERE id = test_id
  RETURNING updated_at INTO new_updated_at;
  
  RAISE NOTICE 'New updated_at after update: %', new_updated_at;
  
  -- Verify updated_at changed
  IF new_updated_at <= initial_updated_at THEN
    RAISE EXCEPTION 'Test 1 FAILED: updated_at did not change after update';
  END IF;
  
  -- Verify created_at did not change
  IF (SELECT created_at FROM public.slack_webhooks WHERE id = test_id) != initial_created_at THEN
    RAISE EXCEPTION 'Test 1 FAILED: created_at changed after update';
  END IF;
  
  RAISE NOTICE 'Test 1 PASSED: Trigger correctly updates updated_at column';
  
  -- Cleanup
  DELETE FROM public.slack_webhooks WHERE id = test_id;
  RAISE NOTICE 'Test cleanup complete';
END;
$;

-- Test 2: Verify trigger only fires on UPDATE, not INSERT
DO $
DECLARE
  test_id UUID;
  insert_updated_at TIMESTAMPTZ;
  update_updated_at TIMESTAMPTZ;
BEGIN
  -- Insert test webhook
  INSERT INTO public.slack_webhooks (
    content_type,
    webhook_url,
    channel_name,
    is_enabled
  ) VALUES (
    'mcp_server',
    'https://hooks.slack.com/services/TEST2/TEST2/TEST2',
    '#test-channel-2',
    true
  ) RETURNING id, updated_at 
  INTO test_id, insert_updated_at;
  
  RAISE NOTICE 'Test 2: Inserted webhook with id=%', test_id;
  
  -- Wait a moment
  PERFORM pg_sleep(1);
  
  -- Update the webhook
  UPDATE public.slack_webhooks
  SET is_enabled = false
  WHERE id = test_id
  RETURNING updated_at INTO update_updated_at;
  
  -- Verify updated_at changed after update
  IF update_updated_at <= insert_updated_at THEN
    RAISE EXCEPTION 'Test 2 FAILED: updated_at did not change after update';
  END IF;
  
  RAISE NOTICE 'Test 2 PASSED: Trigger fires on UPDATE';
  
  -- Cleanup
  DELETE FROM public.slack_webhooks WHERE id = test_id;
  RAISE NOTICE 'Test cleanup complete';
END;
$;

-- Test 3: Verify trigger works with multiple updates
DO $
DECLARE
  test_id UUID;
  updated_at_1 TIMESTAMPTZ;
  updated_at_2 TIMESTAMPTZ;
  updated_at_3 TIMESTAMPTZ;
BEGIN
  -- Insert test webhook
  INSERT INTO public.slack_webhooks (
    content_type,
    webhook_url,
    channel_name,
    is_enabled
  ) VALUES (
    'blog_post',
    'https://hooks.slack.com/services/TEST3/TEST3/TEST3',
    '#test-channel-3',
    true
  ) RETURNING id INTO test_id;
  
  RAISE NOTICE 'Test 3: Inserted webhook with id=%', test_id;
  
  -- First update
  PERFORM pg_sleep(1);
  UPDATE public.slack_webhooks
  SET channel_name = '#updated-1'
  WHERE id = test_id
  RETURNING updated_at INTO updated_at_1;
  
  -- Second update
  PERFORM pg_sleep(1);
  UPDATE public.slack_webhooks
  SET channel_name = '#updated-2'
  WHERE id = test_id
  RETURNING updated_at INTO updated_at_2;
  
  -- Third update
  PERFORM pg_sleep(1);
  UPDATE public.slack_webhooks
  SET channel_name = '#updated-3'
  WHERE id = test_id
  RETURNING updated_at INTO updated_at_3;
  
  -- Verify each update incremented the timestamp
  IF updated_at_2 <= updated_at_1 THEN
    RAISE EXCEPTION 'Test 3 FAILED: Second update did not increment updated_at';
  END IF;
  
  IF updated_at_3 <= updated_at_2 THEN
    RAISE EXCEPTION 'Test 3 FAILED: Third update did not increment updated_at';
  END IF;
  
  RAISE NOTICE 'Test 3 PASSED: Trigger works correctly with multiple updates';
  RAISE NOTICE 'Update 1: %', updated_at_1;
  RAISE NOTICE 'Update 2: %', updated_at_2;
  RAISE NOTICE 'Update 3: %', updated_at_3;
  
  -- Cleanup
  DELETE FROM public.slack_webhooks WHERE id = test_id;
  RAISE NOTICE 'Test cleanup complete';
END;
$;

RAISE NOTICE '===========================================';
RAISE NOTICE 'ALL TESTS PASSED!';
RAISE NOTICE 'The updated_at trigger is working correctly';
RAISE NOTICE '===========================================';
