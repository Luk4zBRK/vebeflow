# Design Document: Slack Community Integration

## Overview

The Slack Community Integration system enables automated engagement with the Vibe Flow Slack workspace through three main capabilities:

1. **Welcome Bot**: Automatically greets new members with navigation guidance
2. **Content Notifications**: Sends formatted messages to Slack channels when content is published (workflows, MCP servers, blog posts, IDE news)
3. **Admin Management**: Provides a dashboard interface for configuring webhooks and monitoring delivery

The system is built on Supabase Edge Functions for serverless webhook delivery, database triggers for automatic event detection, and React components for administrative controls. All webhook URLs are encrypted at rest, and delivery attempts are logged for troubleshooting.

### Key Design Decisions

- **Edge Functions over Client-Side**: Webhook delivery happens server-side to protect webhook URLs and ensure reliability
- **Database Triggers**: Automatic detection of publication events without polling or manual invocation
- **Slack Block Kit**: Rich message formatting for better user experience
- **Retry Logic**: Exponential backoff for failed deliveries (3 attempts: 1s, 2s, 4s)
- **Rate Limiting**: Queue-based approach to prevent hitting Slack API limits (1 msg/sec per webhook)

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                     Vibe Flow Platform                       │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐         ┌──────────────┐                  │
│  │   Admin UI   │────────▶│  Supabase    │                  │
│  │  Dashboard   │         │   Database   │                  │
│  └──────────────┘         └──────┬───────┘                  │
│                                   │                           │
│                                   │ Triggers                  │
│                                   ▼                           │
│                          ┌─────────────────┐                 │
│                          │  Edge Function  │                 │
│                          │  notify-slack   │                 │
│                          └────────┬────────┘                 │
│                                   │                           │
└───────────────────────────────────┼───────────────────────────┘
                                    │
                                    │ HTTPS POST
                                    ▼
                          ┌─────────────────┐
                          │  Slack Webhook  │
                          │      API        │
                          └─────────┬───────┘
                                    │
                                    ▼
                          ┌─────────────────┐
                          │ Slack Workspace │
                          │  #anuncios      │
                          │  #mcp-servers   │
                          │  #ai-coding     │
                          └─────────────────┘
```

### Data Flow

1. **Content Publication**: Admin publishes workflow/MCP server/blog post
2. **Trigger Activation**: Database trigger detects `is_published` change
3. **Edge Function Invocation**: Trigger calls `notify-slack` with content details
4. **Configuration Lookup**: Function queries `slack_webhooks` table for webhook URL
5. **Message Formatting**: Slack Block Kit JSON is generated
6. **Webhook Delivery**: HTTP POST to Slack webhook URL
7. **Logging**: Delivery result recorded in `slack_delivery_logs`
8. **Retry (if failed)**: Exponential backoff retry up to 3 times

### Welcome Bot Flow

```
New Member Joins
      │
      ▼
Slack Event API
      │
      ▼
Webhook to Supabase Edge Function
      │
      ▼
Format Welcome Message
      │
      ▼
Send DM via Slack API
      │
      ▼
Log Delivery Result
```

## Components and Interfaces

### 1. Database Tables

#### slack_webhooks

Stores webhook configuration for different content types.

```typescript
interface SlackWebhook {
  id: string;                    // UUID primary key
  content_type: ContentType;     // 'workflow' | 'mcp_server' | 'blog_post' | 'ide_news'
  webhook_url: string;           // Encrypted Slack webhook URL
  channel_name: string;          // e.g., '#anuncios', '#mcp-servers'
  is_enabled: boolean;           // Enable/disable without deleting
  created_at: string;            // ISO timestamp
  updated_at: string;            // ISO timestamp
}

type ContentType = 'workflow' | 'mcp_server' | 'blog_post' | 'ide_news';
```

**Constraints**:
- Unique constraint on `(content_type, channel_name)`
- `webhook_url` must start with `https://hooks.slack.com/`
- Encrypted using `pgcrypto` extension

#### slack_delivery_logs

Records all webhook delivery attempts for monitoring and debugging.

```typescript
interface SlackDeliveryLog {
  id: string;                    // UUID primary key
  webhook_id: string;            // Foreign key to slack_webhooks
  content_type: ContentType;     // Type of content being notified
  content_id: string;            // ID of the workflow/MCP server/etc
  status: DeliveryStatus;        // 'success' | 'failed' | 'skipped'
  response_code: number | null;  // HTTP response code (200, 404, 500, etc)
  error_message: string | null;  // Error details if failed
  attempt_number: number;        // 1, 2, or 3 (for retries)
  payload_size: number;          // Size of JSON payload in bytes
  delivered_at: string;          // ISO timestamp
}

type DeliveryStatus = 'success' | 'failed' | 'skipped';
```

### 2. Edge Functions

#### notify-slack

Main function for sending Slack notifications.

**Location**: `supabase/functions/notify-slack/index.ts`

**Input**:
```typescript
interface NotifySlackRequest {
  content_type: ContentType;
  content_id: string;
  action: 'published' | 'updated' | 'deleted';
}
```

**Output**:
```typescript
interface NotifySlackResponse {
  success: boolean;
  status: DeliveryStatus;
  delivery_time_ms: number;
  message?: string;
  error?: string;
}
```

**Logic**:
1. Validate input parameters
2. Query `slack_webhooks` for enabled webhook matching `content_type`
3. If no webhook found, return `{status: 'skipped'}`
4. Fetch content details from appropriate table (workflows, mcp_servers, etc)
5. Format message using Slack Block Kit
6. Send HTTP POST to webhook URL
7. Handle retries with exponential backoff (1s, 2s, 4s)
8. Log delivery attempt to `slack_delivery_logs`
9. Return result

#### welcome-bot

Handles new member welcome messages.

**Location**: `supabase/functions/welcome-bot/index.ts`

**Input**: Slack Event API payload
```typescript
interface SlackTeamJoinEvent {
  type: 'team_join';
  user: {
    id: string;
    name: string;
    real_name: string;
  };
}
```

**Output**: HTTP 200 OK (Slack requires quick response)

**Logic**:
1. Verify Slack signature for security
2. Extract user ID from event
3. Format welcome message with Block Kit
4. Send DM to user via Slack API
5. Log delivery result
6. Return 200 OK immediately

### 3. React Components

#### SlackIntegrations.tsx

Admin dashboard page for managing Slack webhooks.

**Location**: `src/pages/SlackIntegrations.tsx`

**Features**:
- List all configured webhooks
- Add new webhook configuration
- Edit existing webhook
- Enable/disable webhooks
- Test webhook with sample message
- View recent delivery logs

**State Management**:
```typescript
interface SlackIntegrationsState {
  webhooks: SlackWebhook[];
  logs: SlackDeliveryLog[];
  loading: boolean;
  error: string | null;
  testingWebhookId: string | null;
}
```

**Key Functions**:
- `fetchWebhooks()`: Load all webhooks from database
- `saveWebhook(webhook)`: Create or update webhook
- `toggleWebhook(id, enabled)`: Enable/disable webhook
- `testWebhook(id)`: Send test message
- `deleteWebhook(id)`: Soft delete (set is_enabled=false)
- `fetchLogs(filters)`: Load delivery logs with filtering

#### WebhookForm.tsx

Form component for adding/editing webhook configurations.

**Location**: `src/components/slack/WebhookForm.tsx`

**Props**:
```typescript
interface WebhookFormProps {
  webhook?: SlackWebhook;  // undefined for new, populated for edit
  onSave: (webhook: Partial<SlackWebhook>) => Promise<void>;
  onCancel: () => void;
}
```

**Validation**:
- `webhook_url` must match pattern: `^https://hooks\.slack\.com/services/[A-Z0-9/]+$`
- `channel_name` must start with `#`
- `content_type` must be one of the allowed values

#### DeliveryLogsTable.tsx

Table component displaying recent webhook delivery attempts.

**Location**: `src/components/slack/DeliveryLogsTable.tsx`

**Props**:
```typescript
interface DeliveryLogsTableProps {
  logs: SlackDeliveryLog[];
  loading: boolean;
  onRefresh: () => void;
}
```

**Features**:
- Sortable columns (delivered_at, status, content_type)
- Status badges (success=green, failed=red, skipped=gray)
- Expandable rows to show error messages
- Filter by status and content_type
- Pagination (50 logs per page)

### 4. Message Formatters

#### formatWorkflowMessage

Formats workflow publication notifications.

```typescript
function formatWorkflowMessage(workflow: Workflow): SlackMessage {
  return {
    blocks: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: '🚀 Novo Workflow Publicado!',
          emoji: true
        }
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*${workflow.title}*\n${workflow.description || ''}`
        },
        accessory: workflow.image_url ? {
          type: 'image',
          image_url: workflow.image_url,
          alt_text: workflow.title
        } : undefined
      },
      {
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: {
              type: 'plain_text',
              text: 'Ver Workflow',
              emoji: true
            },
            url: `https://vibeflow.site/workflows/${workflow.slug}`,
            style: 'primary'
          }
        ]
      }
    ]
  };
}
```

#### formatMcpServerMessage

Formats MCP server publication notifications.

```typescript
function formatMcpServerMessage(server: McpServer): SlackMessage {
  const tags = server.tags?.slice(0, 5).map(tag => `\`${tag}\``).join(' ') || '';
  
  return {
    blocks: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: '🔌 Novo MCP Server Disponível!',
          emoji: true
        }
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*${server.name}*\n${server.description || ''}\n\n` +
                `📦 \`${server.npm_package}\``
        }
      },
      {
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: tags
          }
        ]
      },
      {
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: { type: 'plain_text', text: 'Ver Detalhes' },
            url: `https://vibeflow.site/mcp-servers/${server.slug}`,
            style: 'primary'
          },
          server.github_url ? {
            type: 'button',
            text: { type: 'plain_text', text: 'GitHub' },
            url: server.github_url
          } : null
        ].filter(Boolean)
      }
    ]
  };
}
```

#### formatBlogPostMessage

Formats blog post publication notifications.

```typescript
function formatBlogPostMessage(post: BlogPost): SlackMessage {
  const excerpt = post.excerpt || post.content.substring(0, 200) + '...';
  
  return {
    blocks: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: '📝 Novo Artigo Publicado!',
          emoji: true
        }
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*${post.title}*\n${excerpt}`
        },
        accessory: post.cover_image_url ? {
          type: 'image',
          image_url: post.cover_image_url,
          alt_text: post.title
        } : undefined
      },
      {
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: { type: 'plain_text', text: 'Ler Mais' },
            url: `https://vibeflow.site/blog/${post.slug}`,
            style: 'primary'
          }
        ]
      }
    ]
  };
}
```

#### formatIdeNewsMessage

Formats IDE news batch notifications.

```typescript
function formatIdeNewsMessage(newsItems: IdeNews[]): SlackMessage {
  const items = newsItems.slice(0, 10); // Max 10 items per message
  
  const newsBlocks = items.map(news => ({
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: `*${news.titulo}*\n${news.resumo || ''}\n<${news.link}|Ler mais> • ${news.fonte}`
    }
  }));
  
  return {
    blocks: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: `🤖 ${items.length} Novidades de IDEs com IA`,
          emoji: true
        }
      },
      ...newsBlocks,
      {
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: `Sincronizado automaticamente • <https://vibeflow.site/ide-news|Ver todas>`
          }
        ]
      }
    ]
  };
}
```

### 5. Database Triggers

#### trigger_notify_workflow_published

Detects when a workflow is published and invokes notify-slack.

```sql
CREATE OR REPLACE FUNCTION notify_workflow_published()
RETURNS TRIGGER AS $$
BEGIN
  -- Only trigger when is_published changes from false to true
  IF NEW.is_published = true AND (OLD.is_published = false OR OLD.is_published IS NULL) THEN
    PERFORM net.http_post(
      url := current_setting('app.supabase_url') || '/functions/v1/notify-slack',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.service_role_key')
      ),
      body := jsonb_build_object(
        'content_type', 'workflow',
        'content_id', NEW.id,
        'action', 'published'
      )
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER workflow_published_trigger
AFTER UPDATE ON workflows
FOR EACH ROW
EXECUTE FUNCTION notify_workflow_published();
```

#### trigger_notify_mcp_server_published

Similar trigger for MCP servers.

```sql
CREATE OR REPLACE FUNCTION notify_mcp_server_published()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_published = true AND (OLD.is_published = false OR OLD.is_published IS NULL) THEN
    PERFORM net.http_post(
      url := current_setting('app.supabase_url') || '/functions/v1/notify-slack',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.service_role_key')
      ),
      body := jsonb_build_object(
        'content_type', 'mcp_server',
        'content_id', NEW.id,
        'action', 'published'
      )
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER mcp_server_published_trigger
AFTER UPDATE ON mcp_servers
FOR EACH ROW
EXECUTE FUNCTION notify_mcp_server_published();
```

#### trigger_notify_blog_post_published

Trigger for blog post publications.

```sql
CREATE OR REPLACE FUNCTION notify_blog_post_published()
RETURNS TRIGGER AS $$
BEGIN
  -- Trigger on INSERT with is_published=true OR UPDATE to is_published=true
  IF NEW.status = 'published' AND (TG_OP = 'INSERT' OR OLD.status != 'published') THEN
    PERFORM net.http_post(
      url := current_setting('app.supabase_url') || '/functions/v1/notify-slack',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.service_role_key')
      ),
      body := jsonb_build_object(
        'content_type', 'blog_post',
        'content_id', NEW.id,
        'action', 'published'
      )
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER blog_post_published_trigger
AFTER INSERT OR UPDATE ON blog_posts
FOR EACH ROW
EXECUTE FUNCTION notify_blog_post_published();
```

### 6. Rate Limiter

#### RateLimiter Class

Manages message queuing to prevent exceeding Slack rate limits.

```typescript
class RateLimiter {
  private queues: Map<string, MessageQueue>;
  private readonly MAX_QUEUE_SIZE = 100;
  private readonly RATE_LIMIT_MS = 1000; // 1 message per second
  
  constructor() {
    this.queues = new Map();
  }
  
  async enqueue(webhookUrl: string, message: SlackMessage): Promise<void> {
    let queue = this.queues.get(webhookUrl);
    
    if (!queue) {
      queue = new MessageQueue(webhookUrl, this.RATE_LIMIT_MS);
      this.queues.set(webhookUrl, queue);
    }
    
    if (queue.size() >= this.MAX_QUEUE_SIZE) {
      throw new Error('Queue full: rate limit exceeded');
    }
    
    await queue.add(message);
  }
  
  async send(webhookUrl: string, message: SlackMessage): Promise<Response> {
    const queue = this.queues.get(webhookUrl);
    
    if (queue && !queue.canSend()) {
      await this.enqueue(webhookUrl, message);
      return { status: 'queued' };
    }
    
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message)
    });
    
    if (queue) {
      queue.recordSend();
    }
    
    return response;
  }
}

class MessageQueue {
  private messages: SlackMessage[];
  private lastSendTime: number;
  private rateLimitMs: number;
  
  constructor(webhookUrl: string, rateLimitMs: number) {
    this.messages = [];
    this.lastSendTime = 0;
    this.rateLimitMs = rateLimitMs;
    this.startProcessing(webhookUrl);
  }
  
  add(message: SlackMessage): void {
    this.messages.push(message);
  }
  
  size(): number {
    return this.messages.length;
  }
  
  canSend(): boolean {
    return Date.now() - this.lastSendTime >= this.rateLimitMs;
  }
  
  recordSend(): void {
    this.lastSendTime = Date.now();
  }
  
  private async startProcessing(webhookUrl: string): Promise<void> {
    while (true) {
      if (this.messages.length > 0 && this.canSend()) {
        const message = this.messages.shift()!;
        await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(message)
        });
        this.recordSend();
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
}
```

## Data Models

### TypeScript Interfaces

```typescript
// Slack webhook configuration
interface SlackWebhook {
  id: string;
  content_type: 'workflow' | 'mcp_server' | 'blog_post' | 'ide_news';
  webhook_url: string;
  channel_name: string;
  is_enabled: boolean;
  created_at: string;
  updated_at: string;
}

// Delivery log entry
interface SlackDeliveryLog {
  id: string;
  webhook_id: string;
  content_type: string;
  content_id: string;
  status: 'success' | 'failed' | 'skipped';
  response_code: number | null;
  error_message: string | null;
  attempt_number: number;
  payload_size: number;
  delivered_at: string;
}

// Slack Block Kit message structure
interface SlackMessage {
  blocks: SlackBlock[];
  text?: string; // Fallback text for notifications
}

interface SlackBlock {
  type: 'header' | 'section' | 'actions' | 'context' | 'divider';
  text?: {
    type: 'plain_text' | 'mrkdwn';
    text: string;
    emoji?: boolean;
  };
  elements?: SlackElement[];
  accessory?: SlackAccessory;
}

interface SlackElement {
  type: 'button' | 'mrkdwn' | 'image';
  text?: { type: 'plain_text'; text: string };
  url?: string;
  style?: 'primary' | 'danger';
  image_url?: string;
  alt_text?: string;
}

interface SlackAccessory {
  type: 'image';
  image_url: string;
  alt_text: string;
}

// Content models (existing)
interface Workflow {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  content: string;
  image_url: string | null;
  is_published: boolean;
  created_at: string;
}

interface McpServer {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  content: string;
  category: string | null;
  tags: string[] | null;
  npm_package: string | null;
  github_url: string | null;
  is_published: boolean;
  created_at: string;
}

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  cover_image_url: string | null;
  status: string;
  created_at: string;
}

interface IdeNews {
  id: string;
  titulo: string;
  resumo: string | null;
  link: string;
  fonte: string;
  created_at: string;
}
```

### Database Schema SQL

```sql
-- Slack webhooks configuration table
CREATE TABLE slack_webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type TEXT NOT NULL CHECK (content_type IN ('workflow', 'mcp_server', 'blog_post', 'ide_news')),
  webhook_url TEXT NOT NULL,
  channel_name TEXT NOT NULL,
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(content_type, channel_name)
);

-- Encrypt webhook URLs
ALTER TABLE slack_webhooks 
  ALTER COLUMN webhook_url TYPE TEXT 
  USING pgp_sym_encrypt(webhook_url, current_setting('app.encryption_key'));

-- Delivery logs table
CREATE TABLE slack_delivery_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id UUID REFERENCES slack_webhooks(id) ON DELETE CASCADE,
  content_type TEXT NOT NULL,
  content_id UUID NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('success', 'failed', 'skipped')),
  response_code INTEGER,
  error_message TEXT,
  attempt_number INTEGER NOT NULL DEFAULT 1,
  payload_size INTEGER NOT NULL,
  delivered_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_slack_webhooks_content_type ON slack_webhooks(content_type) WHERE is_enabled = true;
CREATE INDEX idx_slack_delivery_logs_webhook_id ON slack_delivery_logs(webhook_id);
CREATE INDEX idx_slack_delivery_logs_delivered_at ON slack_delivery_logs(delivered_at DESC);
CREATE INDEX idx_slack_delivery_logs_status ON slack_delivery_logs(status);

-- RLS policies
ALTER TABLE slack_webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE slack_delivery_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can manage webhooks
CREATE POLICY "Admins can manage slack webhooks"
  ON slack_webhooks
  FOR ALL
  USING (has_role('admin', auth.uid()));

-- Only admins can view delivery logs
CREATE POLICY "Admins can view delivery logs"
  ON slack_delivery_logs
  FOR SELECT
  USING (has_role('admin', auth.uid()));

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_slack_webhooks_updated_at
BEFORE UPDATE ON slack_webhooks
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
```



## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property Reflection

After analyzing all acceptance criteria, I identified several areas where properties can be consolidated:

**Redundancy Analysis:**
- Properties 2.3, 3.4, 4.4, 5.4 all test the same "skip when no webhook configured" behavior → Can be combined into one property
- Properties 2.5, 3.5, 4.5, 5.5, 10.1 all test logging of delivery attempts → Can be combined into one comprehensive logging property
- Properties 2.1, 3.1, 4.1, 5.1 all test publication trigger behavior → Can be combined into one property with content_type parameter
- Properties 6.4, 7.3, 7.5 test validation constraints → Can be combined into one validation property
- Properties 9.1, 9.2, 9.3 test Block Kit structure → Can be combined into one property about message format

**Consolidated Properties:**
The following properties represent the unique, non-redundant validation requirements after reflection.

### Welcome Bot Properties

**Property 1: Welcome message delivery**
*For any* new member join event, the Welcome_Bot should send a direct message to that member containing links to #regras, #geral, and #ajuda channels, formatted using Slack Block Kit.
**Validates: Requirements 1.1, 1.2, 1.3, 1.5**

**Property 2: Welcome bot error logging**
*For any* failed welcome message delivery attempt, a log entry should be created with timestamp, error details, and failure status.
**Validates: Requirements 1.4**

### Content Notification Properties

**Property 3: Publication triggers notification**
*For any* content item (workflow, MCP server, blog post, IDE news) where is_published changes from false to true (or is created with published status), a notification should be sent to the configured Slack channel for that content_type.
**Validates: Requirements 2.1, 3.1, 4.1, 5.1, 12.1, 12.2, 12.3, 12.4**

**Property 4: Skip when no webhook configured**
*For any* content_type without an enabled webhook configuration, notification attempts should result in status='skipped' and a log entry recording the skip.
**Validates: Requirements 2.3, 3.4, 4.4, 5.4**

**Property 5: Retry with exponential backoff**
*For any* failed webhook delivery, the system should retry up to 3 times with delays of 1s, 2s, and 4s between attempts.
**Validates: Requirements 2.4**

**Property 6: Delivery logging completeness**
*For any* webhook delivery attempt (success, failed, or skipped), a log entry should be created containing webhook_id, content_type, content_id, status, response_code (if applicable), attempt_number, payload_size, and timestamp.
**Validates: Requirements 2.5, 3.5, 4.5, 5.5, 10.1, 10.4**

### Message Formatting Properties

**Property 7: Workflow message content**
*For any* workflow, the formatted Slack message should include the workflow title, description, image (if present), and a "View Workflow" button with correct URL.
**Validates: Requirements 2.2**

**Property 8: MCP server message content**
*For any* MCP server, the formatted Slack message should include server name, description, npm package, GitHub URL (if present), up to 5 tags, and a "View Details" button.
**Validates: Requirements 3.2, 3.3**

**Property 9: Blog post message content**
*For any* blog post, the formatted Slack message should include title, excerpt (first 200 characters), featured image (if present), and a "Read More" button.
**Validates: Requirements 4.2, 4.3**

**Property 10: IDE news batching**
*For any* set of N IDE news items synced simultaneously, they should be batched into messages containing at most 10 items each, with each item showing title, source, and link.
**Validates: Requirements 5.2, 5.3**

**Property 11: Block Kit format compliance**
*For any* generated Slack message, it should have a "blocks" array following Slack Block Kit JSON schema, with appropriate block types (header, section, actions, context) for the content type.
**Validates: Requirements 9.1, 9.2, 9.3**

**Property 12: Character limit enforcement**
*For any* message text exceeding 3000 characters, it should be truncated with "..." appended and include a "Read More" link to the full content.
**Validates: Requirements 9.4, 9.5**

### Admin Dashboard Properties

**Property 13: Webhook configuration display**
*For any* set of configured webhooks, the Admin Dashboard should display all of them with their content_type, channel_name, and masked webhook_url (showing only last 8 characters).
**Validates: Requirements 6.2, 13.3**

**Property 14: Webhook URL validation**
*For any* webhook URL submitted through the admin form, it should be rejected if it doesn't match the pattern `^https://hooks\.slack\.com/services/[A-Z0-9/]+$`.
**Validates: Requirements 6.4**

**Property 15: Webhook toggle without deletion**
*For any* webhook configuration, toggling is_enabled should change the enabled state without removing the database record.
**Validates: Requirements 6.5**

**Property 16: Test webhook functionality**
*For any* webhook configuration, invoking the test function should send a test message to Slack and return either success with response code or failure with error message.
**Validates: Requirements 6.6**

### Database Schema Properties

**Property 17: Content type constraint**
*For any* value inserted into slack_webhooks.content_type, it should be rejected if not in the set {'workflow', 'mcp_server', 'blog_post', 'ide_news'}.
**Validates: Requirements 7.3**

**Property 18: Webhook URL encryption**
*For any* webhook URL stored in the database, the stored value should be encrypted (not equal to the plaintext URL).
**Validates: Requirements 7.4, 13.2**

**Property 19: Unique content type and channel**
*For any* two webhook configurations with the same (content_type, channel_name) pair, the second insert should be rejected with a unique constraint violation.
**Validates: Requirements 7.5**

**Property 20: Soft delete behavior**
*For any* webhook configuration deletion request, the record should remain in the database with is_enabled set to false rather than being removed.
**Validates: Requirements 7.6**

### Edge Function Properties

**Property 21: Edge function parameter acceptance**
*For any* invocation of notify-slack, it should accept and process parameters: content_type, content_id, and action.
**Validates: Requirements 8.2**

**Property 22: Webhook lookup by content type**
*For any* content_type parameter, the notify-slack function should retrieve the enabled webhook configuration matching that content_type.
**Validates: Requirements 8.3**

**Property 23: Conditional message sending**
*For any* webhook configuration where is_enabled=true, the notify-slack function should format and send the message; where is_enabled=false, it should skip sending.
**Validates: Requirements 8.4**

**Property 24: Response format**
*For any* notify-slack invocation, the response should include fields: status ('success'|'failed'|'skipped') and delivery_time_ms.
**Validates: Requirements 8.5**

**Property 25: Function timeout**
*For any* notify-slack invocation, it should complete within 10 seconds or return a timeout error.
**Validates: Requirements 8.6**

### Rate Limiting Properties

**Property 26: Rate limit enforcement**
*For any* sequence of messages sent to the same webhook URL, the time between consecutive sends should be at least 1000ms.
**Validates: Requirements 11.1**

**Property 27: Message queueing**
*For any* message that would violate the rate limit, it should be added to a queue for delayed delivery rather than being sent immediately.
**Validates: Requirements 11.2**

**Property 28: Queue size limit**
*For any* webhook URL, the message queue should reject new messages when it contains 100 messages, and log the rejection.
**Validates: Requirements 11.3, 11.4**

**Property 29: FIFO queue processing**
*For any* sequence of messages added to a queue, they should be delivered in the same order they were added (first-in, first-out).
**Validates: Requirements 11.5**

### Security Properties

**Property 30: Admin-only access**
*For any* user without admin role, attempts to access Slack integration settings should be denied with an authorization error.
**Validates: Requirements 13.1**

**Property 31: Request authentication**
*For any* request to the notify-slack Edge Function not originating from authenticated Supabase triggers or authorized service accounts, it should be rejected with an authentication error.
**Validates: Requirements 13.4**

**Property 32: Audit logging**
*For any* configuration change (create, update, delete webhook), an audit log entry should be created containing user_id, action type, and timestamp.
**Validates: Requirements 13.5**

### Alert Properties

**Property 33: Failed delivery alerts**
*For any* webhook delivery that fails after all 3 retry attempts, an alert email should be sent to administrators containing the error details.
**Validates: Requirements 10.6**

## Error Handling

### Webhook Delivery Errors

**Network Failures**:
- Retry with exponential backoff (1s, 2s, 4s)
- Log each attempt with response code and error message
- After 3 failed attempts, send alert email to admins
- Mark delivery as 'failed' in logs

**Invalid Webhook URLs**:
- Validate URL format before saving configuration
- Test webhook before enabling
- If test fails, prevent enabling and show error to admin

**Slack API Errors**:
- 429 (Rate Limited): Queue message for delayed delivery
- 404 (Webhook Not Found): Disable webhook and alert admin
- 500 (Server Error): Retry with backoff
- 400 (Bad Request): Log error, don't retry (indicates message format issue)

### Database Errors

**Connection Failures**:
- Edge Functions have built-in retry for transient failures
- Log connection errors for monitoring
- Return 500 status to caller

**Constraint Violations**:
- Unique constraint on (content_type, channel_name): Return user-friendly error message
- Foreign key violations: Prevent orphaned logs by cascading deletes
- Check constraint violations: Validate input before database insert

### Encryption Errors

**Decryption Failures**:
- Log error with webhook_id
- Alert admin that webhook needs reconfiguration
- Disable webhook to prevent repeated failures

**Missing Encryption Key**:
- Fail fast on application startup
- Log critical error
- Prevent any webhook operations until key is configured

### Rate Limiting Errors

**Queue Overflow**:
- Log rejection with webhook_id and content details
- Return error to caller
- Alert admin if queue frequently fills (indicates rate limit too low)

**Queue Processing Failures**:
- Retry failed queue items
- After 3 failures, remove from queue and log
- Don't block queue processing for one bad message

### Authentication Errors

**Unauthorized Access**:
- Return 401 Unauthorized for missing auth
- Return 403 Forbidden for insufficient permissions
- Log unauthorized access attempts for security monitoring

**Invalid Tokens**:
- Reject requests with expired or invalid JWT tokens
- Log token validation failures
- Return clear error message to client

### Message Formatting Errors

**Content Too Large**:
- Truncate to 3000 characters with "..." and "Read More" link
- Log truncation event
- Continue with truncated message

**Missing Required Fields**:
- Log error with content_id and missing field names
- Skip sending notification
- Alert admin if pattern of missing fields detected

**Invalid Block Kit JSON**:
- Validate message structure before sending
- Log validation errors
- Fall back to simple text message if Block Kit fails

## Testing Strategy

### Dual Testing Approach

This feature requires both **unit tests** and **property-based tests** for comprehensive coverage:

- **Unit tests**: Verify specific examples, edge cases, and integration points
- **Property tests**: Verify universal properties across randomized inputs

### Property-Based Testing

**Library**: Use `fast-check` for TypeScript/JavaScript property-based testing

**Configuration**: Each property test should run minimum 100 iterations

**Test Tagging**: Each property test must include a comment referencing the design property:
```typescript
// Feature: slack-community-integration, Property 7: Workflow message content
```

**Property Test Examples**:

```typescript
import fc from 'fast-check';

// Property 7: Workflow message content
test('Property 7: Workflow message content', () => {
  fc.assert(
    fc.property(
      fc.record({
        id: fc.uuid(),
        title: fc.string({ minLength: 1, maxLength: 200 }),
        slug: fc.string({ minLength: 1, maxLength: 100 }),
        description: fc.option(fc.string({ maxLength: 500 })),
        image_url: fc.option(fc.webUrl()),
      }),
      (workflow) => {
        const message = formatWorkflowMessage(workflow);
        
        // Should include title
        const messageText = JSON.stringify(message);
        expect(messageText).toContain(workflow.title);
        
        // Should include description if present
        if (workflow.description) {
          expect(messageText).toContain(workflow.description);
        }
        
        // Should have View Workflow button with correct URL
        const expectedUrl = `https://vibeflow.site/workflows/${workflow.slug}`;
        expect(messageText).toContain(expectedUrl);
        
        // Should have image if present
        if (workflow.image_url) {
          expect(messageText).toContain(workflow.image_url);
        }
      }
    ),
    { numRuns: 100 }
  );
});

// Property 12: Character limit enforcement
test('Property 12: Character limit enforcement', () => {
  fc.assert(
    fc.property(
      fc.string({ minLength: 3001, maxLength: 5000 }),
      (longText) => {
        const truncated = truncateMessageText(longText);
        
        // Should be at most 3000 characters
        expect(truncated.length).toBeLessThanOrEqual(3000);
        
        // Should end with "..."
        expect(truncated).toMatch(/\.\.\.$/);
        
        // Should preserve beginning of text
        expect(longText.startsWith(truncated.substring(0, 100))).toBe(true);
      }
    ),
    { numRuns: 100 }
  );
});

// Property 19: Unique content type and channel
test('Property 19: Unique content type and channel', async () => {
  fc.assert(
    fc.asyncProperty(
      fc.constantFrom('workflow', 'mcp_server', 'blog_post', 'ide_news'),
      fc.string({ minLength: 1, maxLength: 50 }).map(s => `#${s}`),
      fc.webUrl({ validSchemes: ['https'] }),
      async (contentType, channelName, webhookUrl) => {
        // First insert should succeed
        const first = await insertWebhook({
          content_type: contentType,
          channel_name: channelName,
          webhook_url: webhookUrl,
        });
        expect(first.error).toBeNull();
        
        // Second insert with same content_type and channel_name should fail
        const second = await insertWebhook({
          content_type: contentType,
          channel_name: channelName,
          webhook_url: webhookUrl + '/different',
        });
        expect(second.error).toBeTruthy();
        expect(second.error.code).toBe('23505'); // Unique violation
        
        // Cleanup
        await deleteWebhook(first.data.id);
      }
    ),
    { numRuns: 100 }
  );
});

// Property 26: Rate limit enforcement
test('Property 26: Rate limit enforcement', async () => {
  fc.assert(
    fc.asyncProperty(
      fc.webUrl({ validSchemes: ['https'] }),
      fc.array(fc.record({ text: fc.string() }), { minLength: 5, maxLength: 10 }),
      async (webhookUrl, messages) => {
        const rateLimiter = new RateLimiter();
        const sendTimes: number[] = [];
        
        for (const message of messages) {
          await rateLimiter.send(webhookUrl, message);
          sendTimes.push(Date.now());
        }
        
        // Check that consecutive sends are at least 1000ms apart
        for (let i = 1; i < sendTimes.length; i++) {
          const timeDiff = sendTimes[i] - sendTimes[i - 1];
          expect(timeDiff).toBeGreaterThanOrEqual(1000);
        }
      }
    ),
    { numRuns: 100 }
  );
});
```

### Unit Testing

**Focus Areas**:
- Specific examples of message formatting
- Edge cases (empty descriptions, missing images, null values)
- Error conditions (network failures, invalid URLs)
- Integration between components (triggers → Edge Functions → Slack)
- Database constraints and RLS policies
- Authentication and authorization flows

**Unit Test Examples**:

```typescript
// Example: Welcome bot with specific content
test('Welcome bot includes all required channel links', () => {
  const message = formatWelcomeMessage({ userId: 'U123', userName: 'John' });
  
  expect(message.blocks).toBeDefined();
  const messageText = JSON.stringify(message);
  
  expect(messageText).toContain('#regras');
  expect(messageText).toContain('#geral');
  expect(messageText).toContain('#ajuda');
});

// Example: Edge case - workflow with no description
test('Workflow message handles missing description', () => {
  const workflow = {
    id: '123',
    title: 'Test Workflow',
    slug: 'test-workflow',
    description: null,
    image_url: null,
  };
  
  const message = formatWorkflowMessage(workflow);
  expect(message.blocks).toBeDefined();
  expect(message.blocks.length).toBeGreaterThan(0);
});

// Example: Error condition - webhook delivery failure
test('Failed delivery creates log entry with error details', async () => {
  const mockFetch = jest.fn().mockRejectedValue(new Error('Network error'));
  global.fetch = mockFetch;
  
  const result = await notifySlack({
    content_type: 'workflow',
    content_id: '123',
    action: 'published',
  });
  
  expect(result.status).toBe('failed');
  
  const logs = await getDeliveryLogs({ content_id: '123' });
  expect(logs.length).toBeGreaterThan(0);
  expect(logs[0].status).toBe('failed');
  expect(logs[0].error_message).toContain('Network error');
});

// Example: Integration test - trigger to notification
test('Publishing workflow triggers Slack notification', async () => {
  const workflow = await createWorkflow({
    title: 'Test',
    slug: 'test',
    content: 'Content',
    is_published: false,
  });
  
  // Configure webhook
  await insertWebhook({
    content_type: 'workflow',
    channel_name: '#test',
    webhook_url: 'https://hooks.slack.com/services/TEST',
    is_enabled: true,
  });
  
  // Publish workflow
  await updateWorkflow(workflow.id, { is_published: true });
  
  // Wait for async trigger
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Check that notification was sent
  const logs = await getDeliveryLogs({ content_id: workflow.id });
  expect(logs.length).toBeGreaterThan(0);
  expect(logs[0].status).toBe('success');
});
```

### Test Coverage Goals

- **Unit Tests**: 80%+ code coverage
- **Property Tests**: All 33 correctness properties implemented
- **Integration Tests**: All trigger → notification flows
- **E2E Tests**: Admin dashboard CRUD operations

### Testing Tools

- **Jest**: Unit test runner
- **fast-check**: Property-based testing library
- **@testing-library/react**: React component testing
- **MSW (Mock Service Worker)**: HTTP mocking for webhook calls
- **Supabase Test Helpers**: Database testing utilities

### CI/CD Testing

```yaml
# .github/workflows/test.yml
name: Test Slack Integration

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm install
      
      - name: Run unit tests
        run: npm test -- --coverage
      
      - name: Run property tests
        run: npm test -- --testNamePattern="Property"
      
      - name: Check coverage threshold
        run: npm test -- --coverage --coverageThreshold='{"global":{"lines":80}}'
```
