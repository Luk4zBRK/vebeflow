/**
 * Property-Based Tests for Slack Webhooks Database Constraints
 * Feature: slack-community-integration
 * Task: 1.5 Write property tests for database constraints
 */

import fc from 'fast-check';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Test configuration
const SUPABASE_URL = process.env.SUPABASE_URL || 'http://localhost:54321';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

describe('Slack Webhooks Database Constraints - Property Tests', () => {
  let supabase: SupabaseClient;

  beforeAll(() => {
    if (!SUPABASE_SERVICE_ROLE_KEY) {
      console.warn('SUPABASE_SERVICE_ROLE_KEY not set. Tests will be skipped.');
    }
    // Only create client if key is available
    if (SUPABASE_SERVICE_ROLE_KEY) {
      supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    }
  });

  beforeEach(async () => {
    // Clean up test data before each test
    if (SUPABASE_SERVICE_ROLE_KEY) {
      await supabase.from('slack_webhooks').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    }
  });

  afterAll(async () => {
    // Final cleanup
    if (SUPABASE_SERVICE_ROLE_KEY) {
      await supabase.from('slack_webhooks').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    }
  });

  /**
   * Property 17: Content type constraint
   * **Validates: Requirements 7.3**
   * 
   * For any value inserted into slack_webhooks.content_type, it should be rejected 
   * if not in the set {'workflow', 'mcp_server', 'blog_post', 'ide_news'}.
   */
  test('Property 17: Content type constraint', async () => {
    if (!SUPABASE_SERVICE_ROLE_KEY) {
      console.warn('Skipping test: SUPABASE_SERVICE_ROLE_KEY not set');
      return;
    }

    await fc.assert(
      fc.asyncProperty(
        // Generate invalid content types (strings that are NOT in the allowed set)
        fc.string({ minLength: 1, maxLength: 50 })
          .filter(s => !['workflow', 'mcp_server', 'blog_post', 'ide_news'].includes(s)),
        fc.webUrl({ validSchemes: ['https'] }),
        fc.string({ minLength: 1, maxLength: 50 }).map(s => `#${s}`),
        async (invalidContentType, webhookUrl, channelName) => {
          // Attempt to insert with invalid content_type
          const { data, error } = await supabase
            .from('slack_webhooks')
            .insert({
              content_type: invalidContentType,
              webhook_url: webhookUrl,
              channel_name: channelName,
              is_enabled: true,
            })
            .select();

          // Should fail with constraint violation
          expect(error).not.toBeNull();
          expect(data).toBeNull();
          
          // PostgreSQL check constraint violation code
          if (error) {
            expect(error.code).toMatch(/23514|PGRST204/); // 23514 = check_violation, PGRST204 = PostgREST check violation
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 17 (Valid Case): Content type constraint allows valid values
   * **Validates: Requirements 7.3**
   * 
   * For any valid content type in the set {'workflow', 'mcp_server', 'blog_post', 'ide_news'},
   * the insert should succeed.
   */
  test('Property 17 (Valid): Content type constraint allows valid values', async () => {
    if (!SUPABASE_SERVICE_ROLE_KEY) {
      console.warn('Skipping test: SUPABASE_SERVICE_ROLE_KEY not set');
      return;
    }

    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom('workflow', 'mcp_server', 'blog_post', 'ide_news'),
        fc.webUrl({ validSchemes: ['https'] }),
        fc.string({ minLength: 1, maxLength: 50 }).map(s => `#${s.replace(/[^a-z0-9-]/gi, '')}`),
        async (validContentType, webhookUrl, channelName) => {
          // Insert with valid content_type
          const { data, error } = await supabase
            .from('slack_webhooks')
            .insert({
              content_type: validContentType,
              webhook_url: webhookUrl,
              channel_name: channelName,
              is_enabled: true,
            })
            .select();

          // Should succeed
          expect(error).toBeNull();
          expect(data).not.toBeNull();
          expect(data).toHaveLength(1);
          expect(data![0].content_type).toBe(validContentType);

          // Cleanup
          if (data && data[0]) {
            await supabase.from('slack_webhooks').delete().eq('id', data[0].id);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 19: Unique content type and channel
   * **Validates: Requirements 7.5**
   * 
   * For any two webhook configurations with the same (content_type, channel_name) pair, 
   * the second insert should be rejected with a unique constraint violation.
   */
  test('Property 19: Unique content type and channel', async () => {
    if (!SUPABASE_SERVICE_ROLE_KEY) {
      console.warn('Skipping test: SUPABASE_SERVICE_ROLE_KEY not set');
      return;
    }

    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom('workflow', 'mcp_server', 'blog_post', 'ide_news'),
        fc.string({ minLength: 1, maxLength: 50 }).map(s => `#${s.replace(/[^a-z0-9-]/gi, '')}`),
        fc.webUrl({ validSchemes: ['https'] }),
        fc.webUrl({ validSchemes: ['https'] }),
        async (contentType, channelName, webhookUrl1, webhookUrl2) => {
          // First insert should succeed
          const { data: firstData, error: firstError } = await supabase
            .from('slack_webhooks')
            .insert({
              content_type: contentType,
              channel_name: channelName,
              webhook_url: webhookUrl1,
              is_enabled: true,
            })
            .select();

          expect(firstError).toBeNull();
          expect(firstData).not.toBeNull();
          expect(firstData).toHaveLength(1);

          // Second insert with same content_type and channel_name should fail
          const { data: secondData, error: secondError } = await supabase
            .from('slack_webhooks')
            .insert({
              content_type: contentType,
              channel_name: channelName,
              webhook_url: webhookUrl2, // Different URL, but same content_type + channel_name
              is_enabled: true,
            })
            .select();

          // Should fail with unique constraint violation
          expect(secondError).not.toBeNull();
          expect(secondData).toBeNull();
          
          // PostgreSQL unique violation code
          if (secondError) {
            expect(secondError.code).toMatch(/23505|PGRST409/); // 23505 = unique_violation, PGRST409 = PostgREST conflict
          }

          // Cleanup
          if (firstData && firstData[0]) {
            await supabase.from('slack_webhooks').delete().eq('id', firstData[0].id);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 19 (Different Channels): Unique constraint allows same content_type with different channels
   * **Validates: Requirements 7.5**
   * 
   * For any two webhook configurations with the same content_type but different channel_name,
   * both inserts should succeed.
   */
  test('Property 19 (Different Channels): Same content_type with different channels allowed', async () => {
    if (!SUPABASE_SERVICE_ROLE_KEY) {
      console.warn('Skipping test: SUPABASE_SERVICE_ROLE_KEY not set');
      return;
    }

    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom('workflow', 'mcp_server', 'blog_post', 'ide_news'),
        fc.string({ minLength: 1, maxLength: 50 }).map(s => `#${s.replace(/[^a-z0-9-]/gi, '')}`),
        fc.string({ minLength: 1, maxLength: 50 }).map(s => `#${s.replace(/[^a-z0-9-]/gi, '')}`),
        fc.webUrl({ validSchemes: ['https'] }),
        fc.webUrl({ validSchemes: ['https'] }),
        async (contentType, channelName1, channelName2, webhookUrl1, webhookUrl2) => {
          // Ensure channel names are different
          fc.pre(channelName1 !== channelName2);

          // First insert
          const { data: firstData, error: firstError } = await supabase
            .from('slack_webhooks')
            .insert({
              content_type: contentType,
              channel_name: channelName1,
              webhook_url: webhookUrl1,
              is_enabled: true,
            })
            .select();

          expect(firstError).toBeNull();
          expect(firstData).not.toBeNull();

          // Second insert with same content_type but different channel_name should succeed
          const { data: secondData, error: secondError } = await supabase
            .from('slack_webhooks')
            .insert({
              content_type: contentType,
              channel_name: channelName2,
              webhook_url: webhookUrl2,
              is_enabled: true,
            })
            .select();

          expect(secondError).toBeNull();
          expect(secondData).not.toBeNull();
          expect(secondData).toHaveLength(1);

          // Cleanup
          if (firstData && firstData[0]) {
            await supabase.from('slack_webhooks').delete().eq('id', firstData[0].id);
          }
          if (secondData && secondData[0]) {
            await supabase.from('slack_webhooks').delete().eq('id', secondData[0].id);
          }
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property 20: Soft delete behavior
   * **Validates: Requirements 7.6**
   * 
   * For any webhook configuration deletion request, the record should remain in the database 
   * with is_enabled set to false rather than being removed.
   */
  test('Property 20: Soft delete behavior', async () => {
    if (!SUPABASE_SERVICE_ROLE_KEY) {
      console.warn('Skipping test: SUPABASE_SERVICE_ROLE_KEY not set');
      return;
    }

    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom('workflow', 'mcp_server', 'blog_post', 'ide_news'),
        fc.webUrl({ validSchemes: ['https'] }),
        fc.string({ minLength: 1, maxLength: 50 }).map(s => `#${s.replace(/[^a-z0-9-]/gi, '')}`),
        async (contentType, webhookUrl, channelName) => {
          // Insert a webhook
          const { data: insertData, error: insertError } = await supabase
            .from('slack_webhooks')
            .insert({
              content_type: contentType,
              webhook_url: webhookUrl,
              channel_name: channelName,
              is_enabled: true,
            })
            .select();

          expect(insertError).toBeNull();
          expect(insertData).not.toBeNull();
          expect(insertData).toHaveLength(1);

          const webhookId = insertData![0].id;

          // Perform soft delete by setting is_enabled to false
          const { error: updateError } = await supabase
            .from('slack_webhooks')
            .update({ is_enabled: false })
            .eq('id', webhookId);

          expect(updateError).toBeNull();

          // Verify the record still exists but is disabled
          const { data: afterDeleteData, error: selectError } = await supabase
            .from('slack_webhooks')
            .select('*')
            .eq('id', webhookId)
            .single();

          expect(selectError).toBeNull();
          expect(afterDeleteData).not.toBeNull();
          expect(afterDeleteData!.id).toBe(webhookId);
          expect(afterDeleteData!.is_enabled).toBe(false);
          expect(afterDeleteData!.content_type).toBe(contentType);
          expect(afterDeleteData!.channel_name).toBe(channelName);

          // Verify all original data is preserved
          expect(afterDeleteData!.webhook_url).toBe(webhookUrl);
          expect(afterDeleteData!.created_at).toBeDefined();
          expect(afterDeleteData!.updated_at).toBeDefined();

          // Cleanup
          await supabase.from('slack_webhooks').delete().eq('id', webhookId);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 20 (Re-enable): Soft deleted webhooks can be re-enabled
   * **Validates: Requirements 7.6**
   * 
   * For any soft-deleted webhook (is_enabled=false), it should be possible to re-enable it
   * by setting is_enabled back to true.
   */
  test('Property 20 (Re-enable): Soft deleted webhooks can be re-enabled', async () => {
    if (!SUPABASE_SERVICE_ROLE_KEY) {
      console.warn('Skipping test: SUPABASE_SERVICE_ROLE_KEY not set');
      return;
    }

    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom('workflow', 'mcp_server', 'blog_post', 'ide_news'),
        fc.webUrl({ validSchemes: ['https'] }),
        fc.string({ minLength: 1, maxLength: 50 }).map(s => `#${s.replace(/[^a-z0-9-]/gi, '')}`),
        async (contentType, webhookUrl, channelName) => {
          // Insert a webhook
          const { data: insertData } = await supabase
            .from('slack_webhooks')
            .insert({
              content_type: contentType,
              webhook_url: webhookUrl,
              channel_name: channelName,
              is_enabled: true,
            })
            .select()
            .single();

          const webhookId = insertData!.id;

          // Soft delete
          await supabase
            .from('slack_webhooks')
            .update({ is_enabled: false })
            .eq('id', webhookId);

          // Re-enable
          const { error: reEnableError } = await supabase
            .from('slack_webhooks')
            .update({ is_enabled: true })
            .eq('id', webhookId);

          expect(reEnableError).toBeNull();

          // Verify it's enabled again
          const { data: finalData } = await supabase
            .from('slack_webhooks')
            .select('*')
            .eq('id', webhookId)
            .single();

          expect(finalData!.is_enabled).toBe(true);
          expect(finalData!.content_type).toBe(contentType);

          // Cleanup
          await supabase.from('slack_webhooks').delete().eq('id', webhookId);
        }
      ),
      { numRuns: 50 }
    );
  });
});
