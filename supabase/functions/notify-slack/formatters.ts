/**
 * Slack Message Formatters for Edge Function
 * 
 * Copied from src/lib/slack/formatters.ts for use in Deno Edge Function
 */

interface SlackBlock {
  type: string;
  text?: {
    type: string;
    text: string;
    emoji?: boolean;
  };
  elements?: any[];
  accessory?: any;
}

interface SlackMessage {
  blocks: SlackBlock[];
  text?: string;
}

interface Workflow {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  image_url: string | null;
}

interface McpServer {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  tags: string[] | null;
  npm_package: string | null;
  github_url: string | null;
}

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  cover_image_url: string | null;
}

interface IdeNews {
  id: string;
  titulo: string;
  resumo: string | null;
  link: string;
  fonte: string;
}

export function formatWorkflowMessage(workflow: Workflow): SlackMessage {
  const sectionText = workflow.description
    ? `*${workflow.title}*\n${workflow.description}`
    : `*${workflow.title}*`;

  const blocks: SlackBlock[] = [
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: '🚀 Novo Workflow Publicado!',
        emoji: true,
      },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: sectionText,
      },
      ...(workflow.image_url && {
        accessory: {
          type: 'image',
          image_url: workflow.image_url,
          alt_text: workflow.title,
        },
      }),
    },
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
    text: `Novo Workflow Publicado: ${workflow.title}`,
  };
}

export function formatMcpServerMessage(server: McpServer): SlackMessage {
  const descriptionText = server.description ? `${server.description}\n\n` : '';
  const npmPackageText = server.npm_package ? `📦 \`${server.npm_package}\`` : '';
  const sectionText = `*${server.title}*\n${descriptionText}${npmPackageText}`;

  const blocks: SlackBlock[] = [
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: '🔌 Novo MCP Server Disponível!',
        emoji: true,
      },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: sectionText,
      },
    },
  ];

  if (server.tags && server.tags.length > 0) {
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

  const actionElements: any[] = [
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

  blocks.push({
    type: 'actions',
    elements: actionElements,
  });

  return {
    blocks,
    text: `Novo MCP Server Disponível: ${server.title}`,
  };
}

export function formatBlogPostMessage(post: BlogPost): SlackMessage {
  let excerpt: string;
  if (post.excerpt !== null && post.excerpt !== undefined) {
    excerpt = post.excerpt;
  } else {
    excerpt = post.content.substring(0, 200);
    if (post.content.length > 200) {
      excerpt += '...';
    }
  }

  const sectionText = `*${post.title}*\n${excerpt}`;

  const blocks: SlackBlock[] = [
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: '📝 Novo Artigo Publicado!',
        emoji: true,
      },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: sectionText,
      },
      ...(post.cover_image_url && {
        accessory: {
          type: 'image',
          image_url: post.cover_image_url,
          alt_text: post.title,
        },
      }),
    },
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
    text: `Novo Artigo Publicado: ${post.title}`,
  };
}

export function formatIdeNewsMessage(newsItems: IdeNews[]): SlackMessage {
  const items = newsItems.slice(0, 10);
  
  const blocks: SlackBlock[] = [
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: `🤖 ${items.length} Novidades de IDEs com IA`,
        emoji: true,
      },
    },
  ];
  
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
    text: `${items.length} Novidades de IDEs com IA`,
  };
}
