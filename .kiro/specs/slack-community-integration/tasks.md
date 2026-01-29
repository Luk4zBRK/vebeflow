# Implementation Plan: Slack Community Integration

## Overview

This implementation plan breaks down the Slack Community Integration feature into discrete, incremental coding tasks. Each task builds on previous work, with testing integrated throughout to validate functionality early. The plan follows this sequence:

1. Database schema and migrations
2. Edge Functions for webhook delivery
3. Message formatters
4. Database triggers
5. Admin UI components
6. Integration and final testing

## Tasks

- [ ] 1. Create database schema and migrations
  - [x] 1.1 Create slack_webhooks table migration
    - Write migration SQL for slack_webhooks table with columns: id, content_type, webhook_url, channel_name, is_enabled, created_at, updated_at
    - Add unique constraint on (content_type, channel_name)
    - Add check constraint for content_type enum values
    - Set up pgcrypto extension for webhook_url encryption
    - Create indexes on content_type and is_enabled
    - _Requirements: 7.1, 7.2, 7.3, 7.5_
  
  - [x] 1.2 Create slack_delivery_logs table migration
    - Write migration SQL for slack_delivery_logs table with columns: id, webhook_id, content_type, content_id, status, response_code, error_message, attempt_number, payload_size, delivered_at
    - Add foreign key to slack_webhooks with CASCADE delete
    - Create indexes on webhook_id, delivered_at, and status
    - _Requirements: 10.2, 10.3_
  
  - [x] 1.3 Set up RLS policies for admin-only access
    - Create RLS policy for slack_webhooks allowing only admin role
    - Create RLS policy for slack_delivery_logs allowing only admin role for SELECT
    - _Requirements: 13.1_
  
  - [x] 1.4 Create updated_at trigger for slack_webhooks
    - Write trigger function to auto-update updated_at column
    - Apply trigger to slack_webhooks table
    - _Requirements: 7.2_
  
  - [x] 1.5 Write property tests for database constraints
    - **Property 17: Content type constraint**
    - **Validates: Requirements 7.3**
    - **Property 19: Unique content type and channel**
    - **Validates: Requirements 7.5**
    - **Property 20: Soft delete behavior**
    - **Validates: Requirements 7.6**

- [ ] 2. Implement message formatter functions
  - [x] 2.1 Create Slack message type definitions
    - Define TypeScript interfaces for SlackMessage, SlackBlock, SlackElement, SlackAccessory
    - Create ContentType union type
    - _Requirements: 9.1_
  
  - [x] 2.2 Implement formatWorkflowMessage function
    - Create function that takes Workflow and returns SlackMessage
    - Include header block with emoji
    - Include section block with title and description
    - Include image accessory if image_url present
    - Include actions block with "View Workflow" button
    - _Requirements: 2.2_
  
  - [x] 2.3 Write property test for workflow message formatting
    - **Property 7: Workflow message content**
    - **Validates: Requirements 2.2**
  
  - [x] 2.4 Implement formatMcpServerMessage function
    - Create function that takes McpServer and returns SlackMessage
    - Include header block
    - Include section block with name, description, and npm package
    - Include context block with up to 5 tags
    - Include actions block with "View Details" and "GitHub" buttons
    - _Requirements: 3.2, 3.3_
  
  - [x] 2.5 Write property test for MCP server message formatting
    - **Property 8: MCP server message content**
    - **Validates: Requirements 3.2, 3.3**
  
  - [x] 2.6 Implement formatBlogPostMessage function
    - Create function that takes BlogPost and returns SlackMessage
    - Include header block
    - Include section block with title and excerpt (first 200 chars)
    - Include image accessory if cover_image_url present
    - Include actions block with "Read More" button
    - _Requirements: 4.2, 4.3_
  
  - [x] 2.7 Write property test for blog post message formatting
    - **Property 9: Blog post message content**
    - **Validates: Requirements 4.2, 4.3**
  
  - [x] 2.8 Implement formatIdeNewsMessage function
    - Create function that takes IdeNews[] and returns SlackMessage
    - Batch maximum 10 items per message
    - Include header block with count
    - Include section blocks for each news item with title, resumo, link, and fonte
    - Include context block with "View all" link
    - _Requirements: 5.2, 5.3_
  
  - [x] 2.9 Write property test for IDE news batching
    - **Property 10: IDE news batching**
    - **Validates: Requirements 5.2, 5.3**
  
  - [x] 2.10 Implement formatWelcomeMessage function
    - Create function that returns SlackMessage for new members
    - Include welcome text with links to #regras, #geral, #ajuda
    - Include navigation guide
    - Use Block Kit formatting
    - _Requirements: 1.2, 1.3, 1.5_
  
  - [x] 2.11 Write property test for welcome message content
    - **Property 1: Welcome message delivery**
    - **Validates: Requirements 1.1, 1.2, 1.3, 1.5**
  
  - [x] 2.12 Implement truncateMessageText utility
    - Create function to truncate text to 3000 characters
    - Append "..." when truncated
    - Preserve word boundaries when possible
    - _Requirements: 9.4, 9.5_
  
  - [x] 2.13 Write property test for character limit enforcement
    - **Property 12: Character limit enforcement**
    - **Validates: Requirements 9.4, 9.5**
  
  - [x] 2.14 Write property test for Block Kit format compliance
    - **Property 11: Block Kit format compliance**
    - **Validates: Requirements 9.1, 9.2, 9.3**

- [x] 3. Checkpoint - Ensure message formatters work correctly
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Implement notify-slack Edge Function
  - [x] 4.1 Create Edge Function boilerplate
    - Create supabase/functions/notify-slack/index.ts
    - Set up CORS headers
    - Define NotifySlackRequest and NotifySlackResponse interfaces
    - _Requirements: 8.1_
  
  - [x] 4.2 Implement webhook configuration lookup
    - Query slack_webhooks table by content_type where is_enabled=true
    - Decrypt webhook_url using pgcrypto
    - Return null if no webhook found
    - _Requirements: 8.3_
  
  - [x] 4.3 Implement content fetching logic
    - Fetch workflow/mcp_server/blog_post/ide_news based on content_type and content_id
    - Handle case where content not found
    - _Requirements: 8.2_
  
  - [x] 4.4 Implement message formatting dispatcher
    - Call appropriate formatter based on content_type
    - Handle IDE news batching for multiple items
    - _Requirements: 8.4_
  
  - [x] 4.5 Implement webhook delivery with retry logic
    - Send HTTP POST to webhook URL with formatted message
    - Implement exponential backoff retry (1s, 2s, 4s) for failures
    - Track attempt_number for each retry
    - _Requirements: 2.4, 8.4_
  
  - [x] 4.6 Write property test for retry with exponential backoff
    - **Property 5: Retry with exponential backoff**
    - **Validates: Requirements 2.4**
  
  - [x] 4.7 Implement delivery logging
    - Insert log entry into slack_delivery_logs after each attempt
    - Record webhook_id, content_type, content_id, status, response_code, error_message, attempt_number, payload_size, delivered_at
    - _Requirements: 2.5, 3.5, 4.5, 5.5, 10.1, 10.4_
  
  - [x] 4.8 Write property test for delivery logging completeness
    - **Property 6: Delivery logging completeness**
    - **Validates: Requirements 2.5, 3.5, 4.5, 5.5, 10.1, 10.4**
  
  - [x] 4.9 Implement skip logic for missing webhooks
    - Return status='skipped' when no webhook configured
    - Log skip event
    - _Requirements: 2.3, 3.4, 4.4, 5.4_
  
  - [x] 4.10 Write property test for skip when no webhook configured
    - **Property 4: Skip when no webhook configured**
    - **Validates: Requirements 2.3, 3.4, 4.4, 5.4**
  
  - [x] 4.11 Implement response formatting
    - Return NotifySlackResponse with status, delivery_time_ms, and optional error
    - _Requirements: 8.5_
  
  - [x] 4.12 Write property test for response format
    - **Property 24: Response format**
    - **Validates: Requirements 8.5**
  
  - [x] 4.13 Implement function timeout handling
    - Set 10-second timeout for function execution
    - Return timeout error if exceeded
    - _Requirements: 8.6_
  
  - [x] 4.14 Write property test for function timeout
    - **Property 25: Function timeout**
    - **Validates: Requirements 8.6**
  
  - [x] 4.15 Implement request authentication
    - Validate requests come from Supabase service role or authenticated triggers
    - Reject unauthorized requests
    - _Requirements: 13.4_
  
  - [x] 4.16 Write property test for request authentication
    - **Property 31: Request authentication**
    - **Validates: Requirements 13.4**

- [ ] 5. Implement welcome-bot Edge Function
  - [x] 5.1 Create Edge Function boilerplate
    - Create supabase/functions/welcome-bot/index.ts
    - Set up Slack event verification
    - Define SlackTeamJoinEvent interface
    - _Requirements: 1.1_
  
  - [x] 5.2 Implement Slack signature verification
    - Verify request signature using Slack signing secret
    - Reject requests with invalid signatures
    - _Requirements: 13.4_
  
  - [x] 5.3 Implement welcome message sending
    - Extract user ID from team_join event
    - Format welcome message using formatWelcomeMessage
    - Send DM to user via Slack API
    - _Requirements: 1.1, 1.2, 1.3_
  
  - [x] 5.4 Implement welcome bot error logging
    - Log failed delivery attempts with timestamp and error details
    - _Requirements: 1.4_
  
  - [-] 5.5 Write property test for welcome bot error logging
    - **Property 2: Welcome bot error logging**
    - **Validates: Requirements 1.4**
  
  - [x] 5.6 Return 200 OK immediately to Slack
    - Slack requires quick response to event webhooks
    - Process message sending asynchronously if needed
    - _Requirements: 1.1_

- [~] 6. Checkpoint - Ensure Edge Functions work correctly
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 7. Implement database triggers for content publication
  - [~] 7.1 Create trigger function for workflow publication
    - Write notify_workflow_published() function
    - Detect when is_published changes from false to true
    - Invoke notify-slack Edge Function with content_type='workflow'
    - _Requirements: 12.1_
  
  - [~] 7.2 Create trigger for workflows table
    - Apply AFTER UPDATE trigger on workflows table
    - Call notify_workflow_published() function
    - _Requirements: 12.1_
  
  - [~] 7.3 Write property test for workflow publication trigger
    - **Property 3: Publication triggers notification** (workflow case)
    - **Validates: Requirements 2.1, 12.1**
  
  - [~] 7.4 Create trigger function for MCP server publication
    - Write notify_mcp_server_published() function
    - Detect when is_published changes from false to true
    - Invoke notify-slack Edge Function with content_type='mcp_server'
    - _Requirements: 12.2_
  
  - [~] 7.5 Create trigger for mcp_servers table
    - Apply AFTER UPDATE trigger on mcp_servers table
    - Call notify_mcp_server_published() function
    - _Requirements: 12.2_
  
  - [~] 7.6 Write property test for MCP server publication trigger
    - **Property 3: Publication triggers notification** (MCP server case)
    - **Validates: Requirements 3.1, 12.2**
  
  - [~] 7.7 Create trigger function for blog post publication
    - Write notify_blog_post_published() function
    - Detect when status changes to 'published' or INSERT with status='published'
    - Invoke notify-slack Edge Function with content_type='blog_post'
    - _Requirements: 12.3_
  
  - [~] 7.8 Create trigger for blog_posts table
    - Apply AFTER INSERT OR UPDATE trigger on blog_posts table
    - Call notify_blog_post_published() function
    - _Requirements: 12.3_
  
  - [~] 7.9 Write property test for blog post publication trigger
    - **Property 3: Publication triggers notification** (blog post case)
    - **Validates: Requirements 4.1, 12.3**
  
  - [~] 7.10 Modify auto-sync-ide-news to trigger notification
    - Add call to notify-slack Edge Function at end of sync
    - Pass all newly synced IDE news items
    - _Requirements: 12.4_
  
  - [~] 7.11 Write property test for IDE news sync trigger
    - **Property 3: Publication triggers notification** (IDE news case)
    - **Validates: Requirements 5.1, 12.4**

- [ ] 8. Implement Rate Limiter
  - [~] 8.1 Create RateLimiter class
    - Implement RateLimiter with Map of MessageQueues
    - Set MAX_QUEUE_SIZE = 100
    - Set RATE_LIMIT_MS = 1000
    - _Requirements: 11.1, 11.3_
  
  - [~] 8.2 Implement MessageQueue class
    - Track messages array and lastSendTime
    - Implement canSend() method checking 1-second interval
    - Implement recordSend() method updating lastSendTime
    - _Requirements: 11.1_
  
  - [~] 8.3 Write property test for rate limit enforcement
    - **Property 26: Rate limit enforcement**
    - **Validates: Requirements 11.1**
  
  - [~] 8.4 Implement message queueing logic
    - Add messages to queue when rate limit reached
    - Reject messages when queue is full
    - Log rejections
    - _Requirements: 11.2, 11.4_
  
  - [~] 8.5 Write property test for message queueing
    - **Property 27: Message queueing**
    - **Validates: Requirements 11.2**
    - **Property 28: Queue size limit**
    - **Validates: Requirements 11.3, 11.4**
  
  - [~] 8.6 Implement FIFO queue processing
    - Process queued messages in order added
    - Respect rate limit during processing
    - _Requirements: 11.5_
  
  - [~] 8.7 Write property test for FIFO queue processing
    - **Property 29: FIFO queue processing**
    - **Validates: Requirements 11.5**
  
  - [~] 8.8 Integrate RateLimiter into notify-slack Edge Function
    - Use RateLimiter for all webhook sends
    - Handle queue full errors
    - _Requirements: 11.1, 11.2, 11.3_

- [~] 9. Checkpoint - Ensure triggers and rate limiting work
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 10. Implement Admin Dashboard UI components
  - [~] 10.1 Create SlackIntegrations page component
    - Create src/pages/SlackIntegrations.tsx
    - Set up page layout with header and navigation
    - Add to dashboard routing
    - _Requirements: 6.1_
  
  - [~] 10.2 Implement webhook list display
    - Fetch all webhooks from slack_webhooks table
    - Display in table with columns: content_type, channel_name, webhook_url (masked), is_enabled
    - Mask webhook URLs showing only last 8 characters
    - _Requirements: 6.2, 13.3_
  
  - [~] 10.3 Write property test for webhook configuration display
    - **Property 13: Webhook configuration display**
    - **Validates: Requirements 6.2, 13.3**
  
  - [~] 10.4 Create WebhookForm component
    - Create src/components/slack/WebhookForm.tsx
    - Add form fields: content_type (select), channel_name (text), webhook_url (text)
    - Implement form validation
    - _Requirements: 6.3_
  
  - [~] 10.5 Implement webhook URL validation
    - Validate URL matches pattern: ^https://hooks\.slack\.com/services/[A-Z0-9/]+$
    - Show error message for invalid URLs
    - _Requirements: 6.4_
  
  - [~] 10.6 Write property test for webhook URL validation
    - **Property 14: Webhook URL validation**
    - **Validates: Requirements 6.4**
  
  - [~] 10.7 Implement webhook save functionality
    - Handle form submission
    - Encrypt webhook URL before saving
    - Insert or update webhook in database
    - Show success/error toast
    - _Requirements: 6.3, 7.4, 13.2_
  
  - [~] 10.8 Write property test for webhook URL encryption
    - **Property 18: Webhook URL encryption**
    - **Validates: Requirements 7.4, 13.2**
  
  - [~] 10.9 Implement webhook enable/disable toggle
    - Add toggle switch in webhook list
    - Update is_enabled column without deleting record
    - _Requirements: 6.5_
  
  - [~] 10.10 Write property test for webhook toggle without deletion
    - **Property 15: Webhook toggle without deletion**
    - **Validates: Requirements 6.5**
  
  - [~] 10.11 Implement webhook test functionality
    - Add "Test" button for each webhook
    - Invoke notify-slack with test content
    - Display success or error message
    - _Requirements: 6.6_
  
  - [~] 10.12 Write property test for test webhook functionality
    - **Property 16: Test webhook functionality**
    - **Validates: Requirements 6.6**
  
  - [~] 10.13 Implement webhook deletion (soft delete)
    - Add "Delete" button for each webhook
    - Set is_enabled=false instead of removing record
    - Confirm deletion with user
    - _Requirements: 7.6_
  
  - [~] 10.14 Create DeliveryLogsTable component
    - Create src/components/slack/DeliveryLogsTable.tsx
    - Fetch recent logs from slack_delivery_logs
    - Display in table with columns: delivered_at, content_type, status, response_code
    - _Requirements: 10.5_
  
  - [~] 10.15 Implement log filtering and sorting
    - Add filters for status and content_type
    - Add sorting by delivered_at
    - Implement pagination (50 logs per page)
    - _Requirements: 10.5_
  
  - [~] 10.16 Write property test for delivery logs display
    - **Property 13: Webhook configuration display** (logs portion)
    - **Validates: Requirements 10.5**
  
  - [~] 10.17 Implement expandable error details
    - Make log rows expandable
    - Show full error_message when expanded
    - Show payload_size and attempt_number
    - _Requirements: 10.4_
  
  - [~] 10.18 Add admin-only access control
    - Check user has admin role before rendering page
    - Redirect non-admin users to dashboard
    - _Requirements: 13.1_
  
  - [~] 10.19 Write property test for admin-only access
    - **Property 30: Admin-only access**
    - **Validates: Requirements 13.1**

- [ ] 11. Implement audit logging
  - [~] 11.1 Create slack_config_audit_logs table migration
    - Add table with columns: id, user_id, action, webhook_id, changes, created_at
    - Create index on user_id and created_at
    - _Requirements: 13.5_
  
  - [~] 11.2 Implement audit log trigger function
    - Write log_slack_config_change() function
    - Capture INSERT, UPDATE, DELETE on slack_webhooks
    - Record user_id, action type, and changes
    - _Requirements: 13.5_
  
  - [~] 11.3 Apply audit log trigger to slack_webhooks
    - Create AFTER INSERT OR UPDATE OR DELETE trigger
    - Call log_slack_config_change() function
    - _Requirements: 13.5_
  
  - [~] 11.4 Write property test for audit logging
    - **Property 32: Audit logging**
    - **Validates: Requirements 13.5**

- [ ] 12. Implement failed delivery alerts
  - [~] 12.1 Create alert email Edge Function
    - Create supabase/functions/send-admin-alert/index.ts
    - Accept parameters: subject, message, error_details
    - Send email to admin email addresses
    - _Requirements: 10.6_
  
  - [~] 12.2 Integrate alert into notify-slack function
    - After 3 failed retry attempts, invoke send-admin-alert
    - Include webhook_id, content_type, content_id, and error message
    - _Requirements: 10.6_
  
  - [~] 12.3 Write property test for failed delivery alerts
    - **Property 33: Failed delivery alerts**
    - **Validates: Requirements 10.6**

- [~] 13. Checkpoint - Ensure admin UI and alerts work
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 14. Integration and final testing
  - [~] 14.1 Test end-to-end workflow publication flow
    - Create test workflow
    - Publish workflow
    - Verify Slack notification sent
    - Verify delivery log created
    - _Requirements: 2.1, 2.2, 12.1_
  
  - [~] 14.2 Test end-to-end MCP server publication flow
    - Create test MCP server
    - Publish MCP server
    - Verify Slack notification sent
    - Verify delivery log created
    - _Requirements: 3.1, 3.2, 12.2_
  
  - [~] 14.3 Test end-to-end blog post publication flow
    - Create test blog post
    - Publish blog post
    - Verify Slack notification sent
    - Verify delivery log created
    - _Requirements: 4.1, 4.2, 12.3_
  
  - [~] 14.4 Test IDE news sync notification
    - Trigger auto-sync-ide-news
    - Verify batch notification sent
    - Verify delivery log created
    - _Requirements: 5.1, 5.2, 5.3, 12.4_
  
  - [~] 14.5 Test admin UI CRUD operations
    - Add new webhook configuration
    - Edit existing webhook
    - Toggle webhook enabled/disabled
    - Test webhook
    - Delete webhook (soft delete)
    - Verify all operations work correctly
    - _Requirements: 6.2, 6.3, 6.4, 6.5, 6.6, 7.6_
  
  - [~] 14.6 Test error handling scenarios
    - Test with invalid webhook URL
    - Test with network failure (mock)
    - Test with Slack API error (mock)
    - Verify retry logic works
    - Verify error logging works
    - Verify admin alerts sent
    - _Requirements: 2.4, 10.4, 10.6_
  
  - [~] 14.7 Test rate limiting
    - Send multiple messages rapidly
    - Verify rate limit enforced (1 msg/sec)
    - Verify messages queued
    - Verify FIFO processing
    - _Requirements: 11.1, 11.2, 11.5_
  
  - [~] 14.8 Test security and authentication
    - Test admin-only access to UI
    - Test webhook URL encryption
    - Test webhook URL masking in UI
    - Test Edge Function authentication
    - Test audit logging
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5_

- [~] 15. Final checkpoint - Complete integration testing
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- All tasks including property-based tests are required for comprehensive implementation
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation throughout implementation
- Property tests validate universal correctness properties across randomized inputs
- Unit tests validate specific examples, edge cases, and integration points
- TypeScript is used throughout for type safety and better developer experience
- All Edge Functions use Deno runtime (Supabase standard)
- Database migrations should be numbered sequentially (e.g., 20260128040000_slack_webhooks.sql)
