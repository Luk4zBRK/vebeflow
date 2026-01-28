import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface McpServerItem {
  name: string;
  slug: string;
  description: string;
  content: string;
  category: string;
  npm_package?: string;
  github_url?: string;
  documentation_url?: string;
  author?: string;
  tags: string[];
}

// MCP Servers populares e úteis
const mcpServersDatabase: McpServerItem[] = [
  {
    name: 'Time MCP Server',
    slug: 'time-mcp-server',
    description: 'Servidor MCP para obter informações de data, hora e timezone em diferentes formatos',
    category: 'utility',
    npm_package: '@modelcontextprotocol/server-time',
    github_url: 'https://github.com/modelcontextprotocol/servers',
    documentation_url: 'https://github.com/modelcontextprotocol/servers/tree/main/src/time',
    author: 'Anthropic',
    tags: ['time', 'date', 'timezone', 'utility'],
    content: `<h2>Sobre</h2>
<p>O Time MCP Server fornece ferramentas para trabalhar com datas, horários e fusos horários. Útil para agentes que precisam de informações temporais precisas.</p>

<h2>Instalação</h2>
<pre><code>npm install @modelcontextprotocol/server-time</code></pre>

<h2>Configuração</h2>
<p>Adicione ao seu <code>mcp.json</code>:</p>
<pre><code>{
  "mcpServers": {
    "time": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-time"]
    }
  }
}</code></pre>

<h2>Ferramentas Disponíveis</h2>
<ul>
  <li><strong>get_current_time</strong>: Retorna data/hora atual em formato ISO</li>
  <li><strong>get_timezone</strong>: Obtém informações sobre timezone específico</li>
  <li><strong>convert_time</strong>: Converte horário entre timezones</li>
  <li><strong>format_time</strong>: Formata data/hora em diferentes padrões</li>
</ul>

<h2>Exemplo de Uso</h2>
<pre><code>// Obter horário atual
const time = await mcp.call('time', 'get_current_time');

// Converter timezone
const converted = await mcp.call('time', 'convert_time', {
  time: '2024-01-28T10:00:00Z',
  from: 'UTC',
  to: 'America/Sao_Paulo'
});</code></pre>

<h2>Casos de Uso</h2>
<ul>
  <li>Agendar tarefas considerando fusos horários</li>
  <li>Calcular diferenças de tempo</li>
  <li>Formatar datas para diferentes locales</li>
  <li>Validar horários de negócio</li>
</ul>`,
  },
  {
    name: 'Fetch MCP Server',
    slug: 'fetch-mcp-server',
    description: 'Servidor MCP para fazer requisições HTTP e buscar conteúdo da web de forma segura',
    category: 'web',
    npm_package: '@modelcontextprotocol/server-fetch',
    github_url: 'https://github.com/modelcontextprotocol/servers',
    documentation_url: 'https://github.com/modelcontextprotocol/servers/tree/main/src/fetch',
    author: 'Anthropic',
    tags: ['http', 'fetch', 'web', 'api'],
    content: `<h2>Sobre</h2>
<p>O Fetch MCP Server permite que agentes façam requisições HTTP de forma controlada e segura, com suporte a diferentes métodos e headers.</p>

<h2>Instalação</h2>
<pre><code>npm install @modelcontextprotocol/server-fetch</code></pre>

<h2>Configuração</h2>
<pre><code>{
  "mcpServers": {
    "fetch": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-fetch"],
      "env": {
        "ALLOWED_DOMAINS": "api.github.com,jsonplaceholder.typicode.com"
      }
    }
  }
}</code></pre>

<h2>Ferramentas Disponíveis</h2>
<ul>
  <li><strong>fetch</strong>: Faz requisição HTTP GET</li>
  <li><strong>fetch_post</strong>: Faz requisição HTTP POST</li>
  <li><strong>fetch_json</strong>: Busca e parseia JSON automaticamente</li>
  <li><strong>fetch_html</strong>: Busca HTML e extrai texto</li>
</ul>

<h2>Exemplo de Uso</h2>
<pre><code>// Buscar dados de API
const data = await mcp.call('fetch', 'fetch_json', {
  url: 'https://api.github.com/users/octocat'
});

// POST com dados
const result = await mcp.call('fetch', 'fetch_post', {
  url: 'https://api.example.com/data',
  body: JSON.stringify({ name: 'Test' }),
  headers: { 'Content-Type': 'application/json' }
});</code></pre>

<h2>Segurança</h2>
<ul>
  <li>Whitelist de domínios permitidos via <code>ALLOWED_DOMAINS</code></li>
  <li>Timeout configurável</li>
  <li>Limite de tamanho de resposta</li>
  <li>Sanitização de headers</li>
</ul>

<h2>Casos de Uso</h2>
<ul>
  <li>Integração com APIs externas</li>
  <li>Web scraping controlado</li>
  <li>Buscar documentação online</li>
  <li>Validar URLs e endpoints</li>
</ul>`,
  },
  {
    name: 'Everything MCP Server',
    slug: 'everything-mcp-server',
    description: 'Busca rápida de arquivos no Windows usando o Everything search engine',
    category: 'filesystem',
    npm_package: '@modelcontextprotocol/server-everything',
    github_url: 'https://github.com/modelcontextprotocol/servers',
    documentation_url: 'https://github.com/modelcontextprotocol/servers/tree/main/src/everything',
    author: 'Anthropic',
    tags: ['search', 'files', 'windows', 'filesystem'],
    content: `<h2>Sobre</h2>
<p>O Everything MCP Server integra com o Everything search engine do Windows para busca ultrarrápida de arquivos no sistema.</p>

<h2>Pré-requisitos</h2>
<ul>
  <li>Windows OS</li>
  <li>Everything search engine instalado</li>
  <li>Everything HTTP server habilitado</li>
</ul>

<h2>Instalação</h2>
<pre><code>npm install @modelcontextprotocol/server-everything</code></pre>

<h2>Configuração</h2>
<pre><code>{
  "mcpServers": {
    "everything": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-everything"],
      "env": {
        "EVERYTHING_URL": "http://localhost:8080"
      }
    }
  }
}</code></pre>

<h2>Ferramentas Disponíveis</h2>
<ul>
  <li><strong>search_files</strong>: Busca arquivos por nome ou padrão</li>
  <li><strong>search_by_extension</strong>: Busca por extensão de arquivo</li>
  <li><strong>search_in_path</strong>: Busca em diretório específico</li>
  <li><strong>get_file_info</strong>: Obtém metadados de arquivo</li>
</ul>

<h2>Exemplo de Uso</h2>
<pre><code>// Buscar arquivos TypeScript
const files = await mcp.call('everything', 'search_by_extension', {
  extension: 'ts',
  path: 'C:\\\\Projects'
});

// Buscar por nome
const results = await mcp.call('everything', 'search_files', {
  query: 'config.json',
  limit: 10
});</code></pre>

<h2>Casos de Uso</h2>
<ul>
  <li>Encontrar arquivos de configuração</li>
  <li>Localizar dependências</li>
  <li>Buscar logs e relatórios</li>
  <li>Análise de estrutura de projetos</li>
</ul>`,
  },
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('🚀 Iniciando sincronização de MCP servers...');

    let insertedCount = 0;
    let skippedCount = 0;

    for (const server of mcpServersDatabase) {
      try {
        // Verificar se já existe
        const { data: existing } = await supabase
          .from('mcp_servers')
          .select('id')
          .eq('slug', server.slug)
          .limit(1)
          .single();

        if (existing) {
          console.log(`⏭️  Pulando duplicata: ${server.name}`);
          skippedCount++;
          continue;
        }

        // Inserir novo MCP server
        const { error: insertError } = await supabase
          .from('mcp_servers')
          .insert({
            name: server.name,
            slug: server.slug,
            description: server.description,
            content: server.content,
            category: server.category,
            npm_package: server.npm_package,
            github_url: server.github_url,
            documentation_url: server.documentation_url,
            author: server.author,
            tags: server.tags,
            is_published: true,
            views_count: 0,
          });

        if (insertError) {
          console.error(`❌ Erro ao inserir ${server.name}:`, insertError);
        } else {
          console.log(`✅ Inserido: ${server.name}`);
          insertedCount++;
        }
      } catch (error) {
        console.error(`❌ Erro ao processar ${server.name}:`, error);
      }
    }

    console.log(`✨ Sincronização concluída: ${insertedCount} inseridos, ${skippedCount} pulados`);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Sincronização de MCP servers concluída',
        inserted: insertedCount,
        skipped: skippedCount,
        total: mcpServersDatabase.length,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error('❌ Erro na sincronização:', error);

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
