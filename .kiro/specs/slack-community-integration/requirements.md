# Requirements Document: Slack Community Integration

## Introduction

This document specifies the requirements for integrating Slack workspace functionality into the Vibe Flow platform. The integration enables automated community engagement through a welcome bot, webhook-based content notifications, and administrative controls for managing Slack integrations.

The system will notify the Slack community when new content is published (workflows, MCP servers, blog posts, IDE news) and provide administrators with tools to configure and monitor these integrations.

## Glossary

- **Slack_Integration_System**: The complete system for managing Slack workspace integrations
- **Welcome_Bot**: Automated bot that sends greeting messages to new Slack workspace members
- **Webhook_Notifier**: Component that sends HTTP POST requests to Slack webhook URLs
- **Admin_Dashboard**: Web interface for administrators to configure Slack integrations
- **Integration_Config**: Database record storing webhook URLs and channel mappings
- **Content_Publisher**: System component that triggers notifications when content is published
- **Slack_Message_Formatter**: Component that formats messages using Slack Block Kit
- **Delivery_Logger**: Component that records webhook delivery attempts and results
- **Rate_Limiter**: Component that prevents exceeding Slack API rate limits

## Requirements

### Requirement 1: Welcome Bot

**User Story:** As a Slack workspace administrator, I want new members to receive automated welcome messages, so that they feel welcomed and understand how to navigate the community.

#### Acceptance Criteria

1. WHEN a new member joins the Slack workspace, THE Welcome_Bot SHALL send a direct message to that member within 60 seconds
2. THE Welcome_Bot SHALL include links to the #regras channel, #geral channel, and #ajuda channel in the welcome message
3. THE Welcome_Bot SHALL include a brief navigation guide in the welcome message
4. WHEN the Welcome_Bot fails to send a message, THE Delivery_Logger SHALL record the failure with timestamp and error details
5. THE Welcome_Bot SHALL use Slack Block Kit formatting for rich message presentation

### Requirement 2: Workflow Publication Notifications

**User Story:** As a community member, I want to be notified in Slack when new workflows are published, so that I can discover and use new automation tools.

#### Acceptance Criteria

1. WHEN a workflow is published (is_published = true), THE Webhook_Notifier SHALL send a notification to the configured #anuncios channel within 5 minutes
2. THE Slack_Message_Formatter SHALL include the workflow title, description, and a "View Workflow" button linking to the workflow page
3. WHEN no webhook URL is configured for workflows, THE Webhook_Notifier SHALL skip sending and log the skip event
4. WHEN a webhook delivery fails, THE Webhook_Notifier SHALL retry up to 3 times with exponential backoff (1s, 2s, 4s)
5. THE Delivery_Logger SHALL record all delivery attempts with status (success, failed, skipped)

### Requirement 3: MCP Server Publication Notifications

**User Story:** As a developer in the community, I want to be notified when new MCP servers are added, so that I can explore and integrate new tools.

#### Acceptance Criteria

1. WHEN an MCP server is published (is_published = true), THE Webhook_Notifier SHALL send a notification to the configured #mcp-servers channel within 5 minutes
2. THE Slack_Message_Formatter SHALL include the server name, description, npm package name, GitHub URL, and a "View Details" button
3. WHEN the MCP server has tags, THE Slack_Message_Formatter SHALL include up to 5 tags in the message
4. WHEN no webhook URL is configured for MCP servers, THE Webhook_Notifier SHALL skip sending and log the skip event
5. THE Delivery_Logger SHALL record all delivery attempts with status and response code

### Requirement 4: Blog Post Publication Notifications

**User Story:** As a community member, I want to be notified when new blog posts are published, so that I can stay updated with platform news and tutorials.

#### Acceptance Criteria

1. WHEN a blog post is published, THE Webhook_Notifier SHALL send a notification to the configured #anuncios channel within 5 minutes
2. THE Slack_Message_Formatter SHALL include the post title, excerpt (first 200 characters), and a "Read More" button
3. WHEN the blog post has a featured image, THE Slack_Message_Formatter SHALL include the image in the message
4. WHEN no webhook URL is configured for blog posts, THE Webhook_Notifier SHALL skip sending and log the skip event
5. THE Delivery_Logger SHALL record all delivery attempts with timestamp and payload size

### Requirement 5: IDE News Notifications

**User Story:** As a developer interested in AI coding tools, I want to be notified when new IDE news is synced, so that I can stay current with tool updates.

#### Acceptance Criteria

1. WHEN IDE news items are synced via auto-sync-ide-news, THE Webhook_Notifier SHALL send a notification to the configured #ai-coding channel within 5 minutes
2. THE Slack_Message_Formatter SHALL include the news title, source, and a link to the original article
3. WHEN multiple IDE news items are synced simultaneously, THE Webhook_Notifier SHALL batch them into a single message (maximum 10 items per message)
4. WHEN no webhook URL is configured for IDE news, THE Webhook_Notifier SHALL skip sending and log the skip event
5. THE Delivery_Logger SHALL record batch size and delivery status

### Requirement 6: Admin Dashboard Configuration

**User Story:** As a platform administrator, I want to configure Slack webhook URLs and channel mappings through a web interface, so that I can manage integrations without database access.

#### Acceptance Criteria

1. THE Admin_Dashboard SHALL display a "Slack Integrations" section in the dashboard navigation
2. WHEN an administrator views the Slack Integrations page, THE Admin_Dashboard SHALL display all configured webhook URLs with their associated content types and channel names
3. THE Admin_Dashboard SHALL provide forms to add, edit, and delete webhook configurations
4. WHEN an administrator saves a webhook configuration, THE Slack_Integration_System SHALL validate the webhook URL format (must start with https://hooks.slack.com/)
5. THE Admin_Dashboard SHALL allow administrators to enable or disable individual webhook configurations without deleting them
6. WHEN an administrator tests a webhook, THE Slack_Integration_System SHALL send a test message and display the result (success or error message)

### Requirement 7: Database Schema for Integration Configuration

**User Story:** As a system architect, I want webhook configurations stored in a database table, so that settings persist and can be managed programmatically.

#### Acceptance Criteria

1. THE Slack_Integration_System SHALL store webhook configurations in a table named "slack_webhooks"
2. THE slack_webhooks table SHALL include columns: id, content_type, webhook_url, channel_name, is_enabled, created_at, updated_at
3. THE content_type column SHALL accept values: 'workflow', 'mcp_server', 'blog_post', 'ide_news'
4. THE webhook_url column SHALL be encrypted at rest
5. THE Slack_Integration_System SHALL enforce unique constraint on (content_type, channel_name) pairs
6. WHEN a webhook configuration is deleted, THE Slack_Integration_System SHALL soft-delete by setting is_enabled to false

### Requirement 8: Edge Functions for Webhook Delivery

**User Story:** As a system architect, I want webhook delivery handled by Edge Functions, so that notifications are sent reliably without blocking the main application.

#### Acceptance Criteria

1. THE Slack_Integration_System SHALL implement an Edge Function named "notify-slack"
2. WHEN the notify-slack function is invoked, THE Webhook_Notifier SHALL accept parameters: content_type, content_id, and action (published, updated, deleted)
3. THE Webhook_Notifier SHALL retrieve the appropriate webhook URL from the slack_webhooks table based on content_type
4. WHEN the webhook URL is found and enabled, THE Webhook_Notifier SHALL format and send the message
5. THE notify-slack function SHALL return a response with status (success, failed, skipped) and delivery_time_ms
6. THE notify-slack function SHALL complete within 10 seconds or timeout

### Requirement 9: Slack Message Formatting

**User Story:** As a community member, I want Slack notifications to be visually appealing and easy to read, so that I can quickly understand the content.

#### Acceptance Criteria

1. THE Slack_Message_Formatter SHALL use Slack Block Kit JSON format for all messages
2. WHEN formatting a workflow notification, THE Slack_Message_Formatter SHALL include a header block, section block with text, and actions block with button
3. WHEN formatting an MCP server notification, THE Slack_Message_Formatter SHALL include a context block with tags
4. THE Slack_Message_Formatter SHALL limit message text to 3000 characters (Slack limit)
5. WHEN content exceeds character limits, THE Slack_Message_Formatter SHALL truncate with "..." and include a "Read More" link

### Requirement 10: Error Handling and Logging

**User Story:** As a platform administrator, I want detailed logs of webhook delivery attempts, so that I can troubleshoot integration issues.

#### Acceptance Criteria

1. THE Delivery_Logger SHALL create a log entry for every webhook delivery attempt
2. THE Delivery_Logger SHALL store logs in a table named "slack_delivery_logs"
3. THE slack_delivery_logs table SHALL include columns: id, webhook_id, content_type, content_id, status, response_code, error_message, attempt_number, delivered_at
4. WHEN a delivery fails, THE Delivery_Logger SHALL record the HTTP response code and error message
5. THE Admin_Dashboard SHALL display recent delivery logs (last 100 entries) with filtering by status and content_type
6. WHEN a delivery fails after all retries, THE Slack_Integration_System SHALL send an alert email to administrators

### Requirement 11: Rate Limiting

**User Story:** As a system architect, I want to prevent exceeding Slack API rate limits, so that the integration remains functional and doesn't get throttled.

#### Acceptance Criteria

1. THE Rate_Limiter SHALL enforce a maximum of 1 message per second per webhook URL
2. WHEN the rate limit is reached, THE Rate_Limiter SHALL queue messages for delayed delivery
3. THE Rate_Limiter SHALL maintain a queue with maximum size of 100 messages per webhook URL
4. WHEN the queue is full, THE Rate_Limiter SHALL reject new messages and log the rejection
5. THE Rate_Limiter SHALL process queued messages in FIFO order

### Requirement 12: Integration Triggers

**User Story:** As a system architect, I want content publication events to automatically trigger Slack notifications, so that the integration works seamlessly without manual intervention.

#### Acceptance Criteria

1. WHEN a workflow's is_published column changes from false to true, THE Content_Publisher SHALL invoke the notify-slack Edge Function with content_type='workflow'
2. WHEN an MCP server's is_published column changes from false to true, THE Content_Publisher SHALL invoke the notify-slack Edge Function with content_type='mcp_server'
3. WHEN a blog post is created with is_published=true, THE Content_Publisher SHALL invoke the notify-slack Edge Function with content_type='blog_post'
4. WHEN the auto-sync-ide-news function completes successfully, THE Content_Publisher SHALL invoke the notify-slack Edge Function with content_type='ide_news'
5. THE Content_Publisher SHALL use database triggers or Edge Function invocations to detect publication events

### Requirement 13: Security and Authentication

**User Story:** As a security-conscious administrator, I want webhook URLs and sensitive data protected, so that unauthorized users cannot access or modify integrations.

#### Acceptance Criteria

1. THE Admin_Dashboard SHALL require authentication with admin role to access Slack integration settings
2. THE Slack_Integration_System SHALL encrypt webhook URLs using AES-256 encryption before storing in database
3. WHEN displaying webhook URLs in the Admin_Dashboard, THE Slack_Integration_System SHALL mask all but the last 8 characters
4. THE notify-slack Edge Function SHALL validate that requests originate from authenticated Supabase triggers or authorized service accounts
5. THE Slack_Integration_System SHALL log all configuration changes with user_id and timestamp for audit purposes
