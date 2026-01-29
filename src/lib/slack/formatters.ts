/**
 * Slack Message Formatters
 * 
 * Functions that format content into Slack Block Kit messages for the
 * Slack Community Integration feature.
 * 
 * Feature: slack-community-integration
 * Tasks: 2.2 Implement formatWorkflowMessage function
 *        2.4 Implement formatMcpServerMessage function
 *        2.6 Implement formatBlogPostMessage function
 * 
 * @see https://api.slack.com/block-kit
 */

import type { SlackMessage } from '../../types/slack';

/**
 * Workflow data structure from the database
 */
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

/**
 * MCP Server data structure from the database
 */
interface McpServer {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  content: string;
  image_url: string | null;
  author_id: string | null;
  author_name: string | null;
  category: string | null;
  tags: string[] | null;
  npm_package: string | null;
  github_url: string | null;
  install_command: string | null;
  is_published: boolean;
  views_count: number;
  created_at: string;
  updated_at: string;
}

/**
 * Blog Post data structure from the database
 */
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

/**
 * IDE News data structure from the database
 */
interface IdeNews {
  id: string;
  titulo: string;
  resumo: string | null;
  link: string;
  fonte: string;
  cor: string | null;
  logo: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Formats a workflow publication notification for Slack
 * 
 * Creates a rich Block Kit message with:
 * - Header block with emoji
 * - Section block with title and description
 * - Image accessory (if image_url present)
 * - Actions block with "View Workflow" button
 * 
 * @param workflow - The workflow to format
 * @returns SlackMessage - Formatted Slack Block Kit message
 * 
 * @example
 * ```typescript
 * const workflow = {
 *   id: '123',
 *   title: 'My Workflow',
 *   slug: 'my-workflow',
 *   description: 'A great workflow',
 *   image_url: 'https://example.com/image.jpg',
 *   // ... other fields
 * };
 * const message = formatWorkflowMessage(workflow);
 * // Send message to Slack webhook
 * ```
 */
export function formatWorkflowMessage(workflow: Workflow): SlackMessage {
  // Build the section block with title and description
  const sectionText = workflow.description
    ? `*${workflow.title}*\n${workflow.description}`
    : `*${workflow.title}*`;

  // Build the blocks array
  const blocks: SlackMessage['blocks'] = [
    // Header block with emoji
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: '🚀 Novo Workflow Publicado!',
        emoji: true,
      },
    },
    // Section block with title, description, and optional image
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: sectionText,
      },
      // Add image accessory if image_url is present
      ...(workflow.image_url && {
        accessory: {
          type: 'image',
          image_url: workflow.image_url,
          alt_text: workflow.title,
        },
      }),
    },
    // Actions block with "View Workflow" button
    {
      type: 'actions',
      elements: [
        {
          type: 'button',
          text: {
            type: 'plain_text',
            text: 'Ver Workflow',
            emoji: true,
          },
          url: `https://vibeflow.site/workflows/${workflow.slug}`,
          style: 'primary',
        },
      ],
    },
  ];

  return {
    blocks,
    // Fallback text for notifications
    text: `Novo Workflow Publicado: ${workflow.title}`,
  };
}

/**
 * Formats an MCP server publication notification for Slack
 * 
 * Creates a rich Block Kit message with:
 * - Header block with emoji
 * - Section block with name (title), description, and npm package
 * - Context block with up to 5 tags
 * - Actions block with "View Details" and "GitHub" buttons
 * 
 * @param server - The MCP server to format
 * @returns SlackMessage - Formatted Slack Block Kit message
 * 
 * @example
 * ```typescript
 * const server = {
 *   id: '123',
 *   title: 'My MCP Server',
 *   slug: 'my-mcp-server',
 *   description: 'A great MCP server',
 *   npm_package: '@example/mcp-server',
 *   github_url: 'https://github.com/example/mcp-server',
 *   tags: ['ai', 'automation', 'tools'],
 *   // ... other fields
 * };
 * const message = formatMcpServerMessage(server);
 * // Send message to Slack webhook
 * ```
 */
export function formatMcpServerMessage(server: McpServer): SlackMessage {
  // Build the section text with name, description, and npm package
  const descriptionText = server.description ? `${server.description}\n\n` : '';
  const npmPackageText = server.npm_package ? `📦 \`${server.npm_package}\`` : '';
  const sectionText = `*${server.title}*\n${descriptionText}${npmPackageText}`;

  // Build the blocks array
  const blocks: SlackMessage['blocks'] = [
    // Header block with emoji
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: '🔌 Novo MCP Server Disponível!',
        emoji: true,
      },
    },
    // Section block with name, description, and npm package
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: sectionText,
      },
    },
  ];

  // Add context block with tags if tags exist
  if (server.tags && server.tags.length > 0) {
    // Take up to 5 tags and format them
    const tagsText = server.tags
      .slice(0, 5)
      .map(tag => `\`${tag}\``)
      .join(' ');

    blocks.push({
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: tagsText,
        },
      ],
    });
  }

  // Build actions block with buttons
  const actionElements: SlackMessage['blocks'][0]['elements'] = [
    // "View Details" button (always present)
    {
      type: 'button',
      text: {
        type: 'plain_text',
        text: 'Ver Detalhes',
        emoji: true,
      },
      url: `https://vibeflow.site/mcp-servers/${server.slug}`,
      style: 'primary',
    },
  ];

  // Add "GitHub" button if github_url is present
  if (server.github_url) {
    actionElements.push({
      type: 'button',
      text: {
        type: 'plain_text',
        text: 'GitHub',
        emoji: true,
      },
      url: server.github_url,
    });
  }

  // Add actions block
  blocks.push({
    type: 'actions',
    elements: actionElements,
  });

  return {
    blocks,
    // Fallback text for notifications
    text: `Novo MCP Server Disponível: ${server.title}`,
  };
}

/**
 * Formats a blog post publication notification for Slack
 * 
 * Creates a rich Block Kit message with:
 * - Header block with emoji
 * - Section block with title and excerpt (first 200 chars)
 * - Image accessory (if cover_image_url present)
 * - Actions block with "Read More" button
 * 
 * @param post - The blog post to format
 * @returns SlackMessage - Formatted Slack Block Kit message
 * 
 * @example
 * ```typescript
 * const post = {
 *   id: '123',
 *   title: 'My Blog Post',
 *   slug: 'my-blog-post',
 *   excerpt: 'This is a great blog post about...',
 *   content: 'Full content here...',
 *   cover_image_url: 'https://example.com/image.jpg',
 *   status: 'published',
 *   created_at: '2024-01-01T00:00:00Z',
 * };
 * const message = formatBlogPostMessage(post);
 * // Send message to Slack webhook
 * ```
 */
export function formatBlogPostMessage(post: BlogPost): SlackMessage {
  // Generate excerpt: use provided excerpt or first 200 chars of content
  let excerpt: string;
  if (post.excerpt !== null && post.excerpt !== undefined) {
    // Use the provided excerpt (even if empty string)
    excerpt = post.excerpt;
  } else {
    // Take first 200 characters from content
    excerpt = post.content.substring(0, 200);
    // Add ellipsis if content was truncated
    if (post.content.length > 200) {
      excerpt += '...';
    }
  }

  // Build the section text with title and excerpt
  const sectionText = `*${post.title}*\n${excerpt}`;

  // Build the blocks array
  const blocks: SlackMessage['blocks'] = [
    // Header block with emoji
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: '📝 Novo Artigo Publicado!',
        emoji: true,
      },
    },
    // Section block with title, excerpt, and optional image
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: sectionText,
      },
      // Add image accessory if cover_image_url is present
      ...(post.cover_image_url && {
        accessory: {
          type: 'image',
          image_url: post.cover_image_url,
          alt_text: post.title,
        },
      }),
    },
    // Actions block with "Read More" button
    {
      type: 'actions',
      elements: [
        {
          type: 'button',
          text: {
            type: 'plain_text',
            text: 'Ler Mais',
            emoji: true,
          },
          url: `https://vibeflow.site/blog/${post.slug}`,
          style: 'primary',
        },
      ],
    },
  ];

  return {
    blocks,
    // Fallback text for notifications
    text: `Novo Artigo Publicado: ${post.title}`,
  };
}

/**
 * Formats IDE news batch notifications for Slack
 * 
 * Creates a rich Block Kit message with:
 * - Header block with count and emoji
 * - Section blocks for each news item (max 10 items)
 * - Context block with "View all" link
 * 
 * @param newsItems - Array of IDE news items to format (will be limited to first 10)
 * @returns SlackMessage - Formatted Slack Block Kit message
 * 
 * @example
 * ```typescript
 * const newsItems = [
 *   {
 *     id: '123',
 *     titulo: 'New AI Feature',
 *     resumo: 'Amazing new feature...',
 *     link: 'https://example.com/news',
 *     fonte: 'Cursor',
 *     cor: '#0066cc',
 *     logo: 'https://example.com/logo.png',
 *     created_at: '2024-01-01T00:00:00Z',
 *     updated_at: '2024-01-01T00:00:00Z',
 *   },
 *   // ... more items
 * ];
 * const message = formatIdeNewsMessage(newsItems);
 * // Send message to Slack webhook
 * ```
 */
export function formatIdeNewsMessage(newsItems: IdeNews[]): SlackMessage {
  // Batch maximum 10 items per message
  const items = newsItems.slice(0, 10);
  
  // Build the blocks array
  const blocks: SlackMessage['blocks'] = [
    // Header block with count
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: `🤖 ${items.length} Novidades de IDEs com IA`,
        emoji: true,
      },
    },
  ];
  
  // Add section blocks for each news item
  items.forEach((news) => {
    const resumoText = news.resumo ? `${news.resumo}\n` : '';
    const sectionText = `*${news.titulo}*\n${resumoText}<${news.link}|Ler mais> • ${news.fonte}`;
    
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: sectionText,
      },
    });
  });
  
  // Add context block with "View all" link
  blocks.push({
    type: 'context',
    elements: [
      {
        type: 'mrkdwn',
        text: 'Sincronizado automaticamente • <https://vibeflow.site/ide-news|Ver todas>',
      },
    ],
  });
  
  return {
    blocks,
    // Fallback text for notifications
    text: `${items.length} Novidades de IDEs com IA`,
  };
}

/**
 * Formats a welcome message for new Slack workspace members
 * 
 * Creates a rich Block Kit message with:
 * - Header block with welcome emoji
 * - Section blocks with welcome text and navigation guide
 * - Links to #regras, #geral, and #ajuda channels
 * 
 * @returns SlackMessage - Formatted Slack Block Kit message
 * 
 * @example
 * ```typescript
 * const message = formatWelcomeMessage();
 * // Send message to new member via Slack API
 * ```
 */
export function formatWelcomeMessage(): SlackMessage {
  // Build the blocks array
  const blocks: SlackMessage['blocks'] = [
    // Header block with welcome emoji
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: '👋 Bem-vindo ao Vibe Flow!',
        emoji: true,
      },
    },
    // Section block with welcome text
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: 'Olá! É ótimo ter você aqui. Este é o espaço da comunidade Vibe Flow, onde compartilhamos conhecimento sobre automação, IA e ferramentas de produtividade.',
      },
    },
    // Section block with navigation guide
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: '*Canais importantes para você começar:*\n\n' +
              '• <#regras|#regras> - Conheça as regras da comunidade\n' +
              '• <#geral|#geral> - Conversas gerais e networking\n' +
              '• <#ajuda|#ajuda> - Precisa de ajuda? Pergunte aqui!\n\n' +
              'Sinta-se à vontade para explorar os outros canais e participar das discussões. Estamos aqui para ajudar! 🚀',
      },
    },
  ];

  return {
    blocks,
    // Fallback text for notifications
    text: 'Bem-vindo ao Vibe Flow! Confira os canais #regras, #geral e #ajuda para começar.',
  };
}

/**
 * Truncates message text to Slack's 3000 character limit
 * 
 * Ensures that message text does not exceed Slack's maximum character limit
 * by truncating at word boundaries when possible and appending "..." to
 * indicate truncation.
 * 
 * @param text - The text to truncate
 * @param maxLength - Maximum length (default: 3000 characters)
 * @returns Truncated text with "..." appended if truncated
 * 
 * @example
 * ```typescript
 * const longText = 'A'.repeat(3500);
 * const truncated = truncateMessageText(longText);
 * console.log(truncated.length); // 3000
 * console.log(truncated.endsWith('...')); // true
 * ```
 */
export function truncateMessageText(text: string, maxLength: number = 3000): string {
  // If text is within limit, return as-is
  if (text.length <= maxLength) {
    return text;
  }
  
  // Reserve 3 characters for "..."
  const truncateAt = maxLength - 3;
  
  // Try to truncate at word boundary
  const truncated = text.substring(0, truncateAt);
  const lastSpaceIndex = truncated.lastIndexOf(' ');
  
  // If we found a space and it's not too far back (within 50 chars),
  // truncate at the word boundary
  if (lastSpaceIndex > truncateAt - 50 && lastSpaceIndex > 0) {
    return truncated.substring(0, lastSpaceIndex) + '...';
  }
  
  // Otherwise, truncate at the character limit
  return truncated + '...';
}
