import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { createHmac } from 'https://deno.land/std@0.168.0/node/crypto.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-slack-signature, x-slack-request-timestamp',
};

/**
 * Slack team_join event payload
 * Sent when a new member joins the workspace
 */
interface SlackTeamJoinEvent {
  type: 'team_join';
  user: {
    id: string;
    name: string;
    real_name: string;
    profile?: {
      email?: string;
      display_name?: string;
    };
  };
  event_ts: string;
}

/**
 * Slack Event API wrapper
 */
interface SlackEventPayload {
  token: string;
  team_id: string;
  api_app_id: string;
  event: SlackTeamJoinEvent;
  type: 'event_callback';
  event_id: string;
  event_time: number;
}

/**
 * Slack URL verification challenge
 * Sent when configuring the Event API endpoint
 */
interface SlackUrlVerification {
  type: 'url_verification';
  challenge: string;
  token: string;
}

/**
 * Verify Slack request signature
 * Ensures the request actually came from Slack
 * 
 * Implementation follows Slack's official specification:
 * https://api.slack.com/authentication/verifying-requests-from-slack
 * 
 * Security features:
 * - Replay attack prevention (5-minute timestamp window)
 * - HMAC-SHA256 signature verification
 * - Timing-safe comparison to prevent timing attacks
 */
function verifySlackSignature(
  body: string,
  timestamp: string,
  signature: string,
  signingSecret: string
): boolean {
  // Validate inputs
  if (!body || !timestamp || !signature || !signingSecret) {
    console.error('Missing required parameters for signature verification');
    return false;
  }

  // Reject old requests (replay attack prevention)
  // Slack recommends rejecting requests older than 5 minutes
  const requestTime = parseInt(timestamp);
  if (isNaN(requestTime)) {
    console.error('Invalid timestamp format');
    return false;
  }

  const currentTime = Math.floor(Date.now() / 1000);
  const timeDiff = Math.abs(currentTime - requestTime);
  
  if (timeDiff > 60 * 5) {
    console.error(`Request timestamp too old: ${timeDiff} seconds (max: 300)`);
    return false;
  }

  // Compute expected signature using HMAC-SHA256
  // Format: v0:timestamp:body
  const sigBasestring = `v0:${timestamp}:${body}`;
  const hmac = createHmac('sha256', signingSecret);
  hmac.update(sigBasestring);
  const expectedSignature = `v0=${hmac.digest('hex')}`;

  // Timing-safe comparison to prevent timing attacks
  // Compare byte-by-byte to ensure constant-time comparison
  if (signature.length !== expectedSignature.length) {
    console.error('Signature length mismatch');
    return false;
  }

  let isValid = true;
  for (let i = 0; i < signature.length; i++) {
    if (signature.charCodeAt(i) !== expectedSignature.charCodeAt(i)) {
      isValid = false;
    }
  }

  if (!isValid) {
    console.error('Signature verification failed');
    console.debug('Expected signature format: v0=<hex_digest>');
  }

  return isValid;
}

/**
 * Format welcome message using Slack Block Kit
 * Includes links to key channels and navigation guide
 */
function formatWelcomeMessage(userName: string) {
  return {
    blocks: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: '👋 Bem-vindo ao Vibe Flow!',
          emoji: true,
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `Olá *${userName}*! É ótimo ter você aqui. 🎉\n\nEsta é a comunidade Vibe Flow, onde compartilhamos workflows, MCP servers, e novidades sobre IDEs com IA.`,
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: '*📚 Canais importantes:*\n• <#regras|#regras> - Regras da comunidade\n• <#geral|#geral> - Conversas gerais\n• <#ajuda|#ajuda> - Tire suas dúvidas',
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: '*🧭 Guia de navegação:*\n• Use `/help` para ver comandos disponíveis\n• Explore os canais no menu lateral\n• Apresente-se em <#geral|#geral>!',
        },
      },
      {
        type: 'divider',
      },
      {
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: '💡 *Dica:* Você pode editar suas notificações nas configurações do Slack.',
          },
        ],
      },
    ],
  };
}

/**
 * Send direct message to user via Slack API
 */
async function sendWelcomeMessage(userId: string, userName: string, botToken: string): Promise<void> {
  const message = formatWelcomeMessage(userName);

  // Open DM channel with user
  const openResponse = await fetch('https://slack.com/api/conversations.open', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${botToken}`,
    },
    body: JSON.stringify({
      users: userId,
    }),
  });

  const openData = await openResponse.json();
  if (!openData.ok) {
    throw new Error(`Failed to open DM channel: ${openData.error}`);
  }

  const channelId = openData.channel.id;

  // Send message to DM channel
  const messageResponse = await fetch('https://slack.com/api/chat.postMessage', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${botToken}`,
    },
    body: JSON.stringify({
      channel: channelId,
      ...message,
    }),
  });

  const messageData = await messageResponse.json();
  if (!messageData.ok) {
    throw new Error(`Failed to send message: ${messageData.error}`);
  }

  console.log(`✅ Welcome message sent to ${userName} (${userId})`);
}

/**
 * Log delivery attempt to database
 * Uses slack_delivery_logs table for consistency with other Slack integrations
 */
async function logDelivery(
  supabase: any,
  userId: string,
  userName: string,
  status: 'success' | 'failed',
  errorMessage?: string,
  payloadSize: number = 0
): Promise<void> {
  try {
    // For welcome bot, we don't have a webhook_id since we use bot token
    // We'll create a special "welcome-bot" webhook entry or log without webhook_id
    // For now, we'll use a simple approach and log to a dedicated table
    // Note: This could be enhanced to use slack_delivery_logs with a special webhook_id
    
    await supabase.from('welcome_bot_logs').insert({
      user_id: userId,
      user_name: userName,
      status,
      error_message: errorMessage || null,
      payload_size: payloadSize,
      delivered_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Failed to log delivery:', error);
    // Don't throw - logging failure shouldn't break the main flow
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get environment variables
    const slackSigningSecret = Deno.env.get('SLACK_SIGNING_SECRET');
    const slackBotToken = Deno.env.get('SLACK_BOT_TOKEN');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    if (!slackSigningSecret || !slackBotToken) {
      console.error('Missing Slack credentials');
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        }
      );
    }

    // Get request body and headers
    const body = await req.text();
    const timestamp = req.headers.get('x-slack-request-timestamp') || '';
    const signature = req.headers.get('x-slack-signature') || '';

    // Verify Slack signature
    console.log('🔐 Verifying Slack signature...');
    if (!verifySlackSignature(body, timestamp, signature, slackSigningSecret)) {
      console.error('❌ Slack signature verification failed');
      console.debug('Request details:', {
        hasTimestamp: !!timestamp,
        hasSignature: !!signature,
        bodyLength: body.length,
      });
      return new Response(
        JSON.stringify({ error: 'Invalid signature' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401,
        }
      );
    }
    console.log('✅ Slack signature verified successfully');

    const payload = JSON.parse(body);

    // Handle URL verification challenge
    if (payload.type === 'url_verification') {
      const challenge = (payload as SlackUrlVerification).challenge;
      return new Response(
        JSON.stringify({ challenge }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    // Handle team_join event
    if (payload.type === 'event_callback') {
      const eventPayload = payload as SlackEventPayload;
      
      if (eventPayload.event.type === 'team_join') {
        const user = eventPayload.event.user;
        const userId = user.id;
        const userName = user.real_name || user.name;

        console.log(`👤 New member joined: ${userName} (${userId})`);

        // Return 200 OK immediately (Slack requires quick response)
        // Process message sending asynchronously
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // Send welcome message asynchronously
        sendWelcomeMessage(userId, userName, slackBotToken)
          .then(() => {
            const message = formatWelcomeMessage(userName);
            const payloadSize = JSON.stringify(message).length;
            logDelivery(supabase, userId, userName, 'success', undefined, payloadSize);
          })
          .catch((error) => {
            console.error('Failed to send welcome message:', error);
            const message = formatWelcomeMessage(userName);
            const payloadSize = JSON.stringify(message).length;
            logDelivery(supabase, userId, userName, 'failed', error.message, payloadSize);
          });

        return new Response(
          JSON.stringify({ ok: true }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          }
        );
      }
    }

    // Unknown event type
    console.log('Received unknown event type:', payload.type);
    return new Response(
      JSON.stringify({ ok: true }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error('❌ Error in welcome-bot:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
