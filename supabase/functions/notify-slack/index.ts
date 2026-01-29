import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';
import {
  formatWorkflowMessage,
  formatMcpServerMessage,
  formatBlogPostMessage,
  formatIdeNewsMessage,
} from './formatters.ts';

// CORS headers for preflight requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Type definitions
type ContentType = 'workflow' | 'mcp_server' | 'blog_post' | 'ide_news';
type DeliveryStatus = 'success' | 'failed' | 'skipped';

interface NotifySlackRequest {
  content_type: ContentType;
  content_id: string;
  action: 'published' | 'updated' | 'deleted';
}

interface NotifySlackResponse {
  success: boolean;
  status: DeliveryStatus;
  delivery_time_ms: number;
  message?: string;
  error?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const startTime = Date.now();
  const TIMEOUT_MS = 10000; // 10 seconds

  // Create a timeout promise
  const timeoutPromise = new Promise<Response>((_, reject) => {
    setTimeout(() => {
      reject(new Error('Function execution timeout after 10 seconds'));
    }, TIMEOUT_MS);
  });

  // Create the main execution promise
  const executionPromise = (async (): Promise<Response> => {
    try {
    // Validate authentication - check for service role key or valid JWT
    const authHeader = req.headers.get('authorization');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!authHeader) {
      return new Response(
        JSON.stringify({
          success: false,
          status: 'failed',
          delivery_time_ms: Date.now() - startTime,
          error: 'Missing authorization header',
        } as NotifySlackResponse),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Check if request is from service role (internal trigger)
    const token = authHeader.replace('Bearer ', '');
    const isServiceRole = token === serviceRoleKey;
    
    if (!isServiceRole) {
      // For non-service-role requests, validate JWT token
      // This allows authenticated Supabase triggers to call the function
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabase = createClient(supabaseUrl, token);
      
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        return new Response(
          JSON.stringify({
            success: false,
            status: 'failed',
            delivery_time_ms: Date.now() - startTime,
            error: 'Invalid or expired authentication token',
          } as NotifySlackResponse),
          {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
    }

    // Parse request body
    const body: NotifySlackRequest = await req.json();
    const { content_type, content_id, action } = body;

    // Validate input parameters
    if (!content_type || !content_id || !action) {
      return new Response(
        JSON.stringify({
          success: false,
          status: 'failed',
          delivery_time_ms: Date.now() - startTime,
          error: 'Missing required parameters: content_type, content_id, action',
        } as NotifySlackResponse),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Validate content_type
    const validContentTypes: ContentType[] = ['workflow', 'mcp_server', 'blog_post', 'ide_news'];
    if (!validContentTypes.includes(content_type)) {
      return new Response(
        JSON.stringify({
          success: false,
          status: 'failed',
          delivery_time_ms: Date.now() - startTime,
          error: `Invalid content_type. Must be one of: ${validContentTypes.join(', ')}`,
        } as NotifySlackResponse),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Lookup webhook configuration
    const { data: webhook, error: webhookError } = await supabase
      .from('slack_webhooks')
      .select('*')
      .eq('content_type', content_type)
      .eq('is_enabled', true)
      .single();

    if (webhookError || !webhook) {
      // No webhook configured - skip sending
      console.log(`No enabled webhook found for content_type: ${content_type}`);
      
      // Log skip event
      const { error: logError } = await supabase
        .from('slack_delivery_logs')
        .insert({
          webhook_id: null,
          content_type: content_type,
          content_id: content_id,
          status: 'skipped',
          response_code: null,
          error_message: null,
          attempt_number: 0,
          payload_size: 0,
          delivered_at: new Date().toISOString(),
        });

      if (logError) {
        console.error('Failed to log skip event:', logError);
      }
      
      const deliveryTimeMs = Date.now() - startTime;
      return new Response(
        JSON.stringify({
          success: true,
          status: 'skipped',
          delivery_time_ms: deliveryTimeMs,
          message: `No webhook configured for ${content_type}`,
        } as NotifySlackResponse),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Fetch content based on content_type
    let content: any = null;
    let tableName: string;
    
    switch (content_type) {
      case 'workflow':
        tableName = 'workflows';
        break;
      case 'mcp_server':
        tableName = 'mcp_servers';
        break;
      case 'blog_post':
        tableName = 'blog_posts';
        break;
      case 'ide_news':
        tableName = 'ide_news';
        break;
      default:
        throw new Error(`Unknown content_type: ${content_type}`);
    }

    const { data: contentData, error: contentError } = await supabase
      .from(tableName)
      .select('*')
      .eq('id', content_id)
      .single();

    if (contentError || !contentData) {
      console.error(`Content not found: ${content_type} ${content_id}`, contentError);
      
      const deliveryTimeMs = Date.now() - startTime;
      return new Response(
        JSON.stringify({
          success: false,
          status: 'failed',
          delivery_time_ms: deliveryTimeMs,
          error: `Content not found: ${content_type} ${content_id}`,
        } as NotifySlackResponse),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    content = contentData;

    // Format message based on content_type
    let slackMessage: any;
    
    switch (content_type) {
      case 'workflow':
        slackMessage = formatWorkflowMessage(content);
        break;
      case 'mcp_server':
        slackMessage = formatMcpServerMessage(content);
        break;
      case 'blog_post':
        slackMessage = formatBlogPostMessage(content);
        break;
      case 'ide_news':
        // For IDE news, we expect content to be an array or single item
        // If single item, wrap in array for batching
        const newsItems = Array.isArray(content) ? content : [content];
        slackMessage = formatIdeNewsMessage(newsItems);
        break;
      default:
        throw new Error(`Unknown content_type: ${content_type}`);
    }

    // Webhook delivery with retry logic (exponential backoff: 1s, 2s, 4s)
    let deliveryStatus: DeliveryStatus = 'failed';
    let responseCode: number | null = null;
    let errorMessage: string | null = null;
    let attemptNumber = 0;
    const maxAttempts = 3;
    const retryDelays = [1000, 2000, 4000]; // milliseconds

    for (attemptNumber = 1; attemptNumber <= maxAttempts; attemptNumber++) {
      try {
        console.log(`Attempt ${attemptNumber} to send webhook to ${webhook.channel_name}`);
        
        const response = await fetch(webhook.webhook_url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(slackMessage),
        });

        responseCode = response.status;

        if (response.ok) {
          // Success!
          deliveryStatus = 'success';
          errorMessage = null;
          console.log(`Webhook delivered successfully on attempt ${attemptNumber}`);
          break;
        } else {
          // Failed but got a response
          const responseText = await response.text();
          errorMessage = `HTTP ${response.status}: ${responseText}`;
          console.error(`Webhook delivery failed on attempt ${attemptNumber}:`, errorMessage);
          
          // If this isn't the last attempt, wait before retrying
          if (attemptNumber < maxAttempts) {
            const delay = retryDelays[attemptNumber - 1];
            console.log(`Waiting ${delay}ms before retry...`);
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        }
      } catch (error) {
        // Network error or other exception
        errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error(`Webhook delivery failed on attempt ${attemptNumber}:`, errorMessage);
        
        // If this isn't the last attempt, wait before retrying
        if (attemptNumber < maxAttempts) {
          const delay = retryDelays[attemptNumber - 1];
          console.log(`Waiting ${delay}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    // Log delivery attempt to database
    const payloadSize = JSON.stringify(slackMessage).length;
    
    const { error: logError } = await supabase
      .from('slack_delivery_logs')
      .insert({
        webhook_id: webhook.id,
        content_type: content_type,
        content_id: content_id,
        status: deliveryStatus,
        response_code: responseCode,
        error_message: errorMessage,
        attempt_number: attemptNumber,
        payload_size: payloadSize,
        delivered_at: new Date().toISOString(),
      });

    if (logError) {
      console.error('Failed to log delivery attempt:', logError);
      // Don't fail the function if logging fails
    }

    const deliveryTimeMs = Date.now() - startTime;

    return new Response(
      JSON.stringify({
        success: deliveryStatus === 'success',
        status: deliveryStatus,
        delivery_time_ms: deliveryTimeMs,
        message: deliveryStatus === 'success' 
          ? 'Notification sent successfully' 
          : `Failed after ${attemptNumber} attempts`,
        error: errorMessage,
      } as NotifySlackResponse),
      {
        status: deliveryStatus === 'success' ? 200 : 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in notify-slack function:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        status: 'failed',
        delivery_time_ms: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      } as NotifySlackResponse),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
  })();

  // Race between execution and timeout
  try {
    return await Promise.race([executionPromise, timeoutPromise]);
  } catch (error) {
    console.error('Function timeout or error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        status: 'failed',
        delivery_time_ms: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      } as NotifySlackResponse),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
