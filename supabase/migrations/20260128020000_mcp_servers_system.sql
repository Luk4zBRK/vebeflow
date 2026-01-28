-- Criar tabela de MCP Servers
CREATE TABLE IF NOT EXISTS public.mcp_servers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  content TEXT NOT NULL, -- HTML ou Markdown com instruções de instalação
  image_url TEXT,
  author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  author_name TEXT,
  category TEXT, -- 'productivity', 'development', 'data', 'ai', etc.
  tags TEXT[] DEFAULT '{}',
  npm_package TEXT, -- Nome do pacote npm se aplicável
  github_url TEXT, -- URL do repositório GitHub
  install_command TEXT, -- Comando de instalação (ex: "npx -y @modelcontextprotocol/server-filesystem")
  is_published BOOLEAN DEFAULT false,
  views_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_mcp_servers_slug ON public.mcp_servers(slug);
CREATE INDEX IF NOT EXISTS idx_mcp_servers_published ON public.mcp_servers(is_published);
CREATE INDEX IF NOT EXISTS idx_mcp_servers_category ON public.mcp_servers(category);
CREATE INDEX IF NOT EXISTS idx_mcp_servers_created_at ON public.mcp_servers(created_at DESC);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_mcp_servers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_mcp_servers_updated_at
  BEFORE UPDATE ON public.mcp_servers
  FOR EACH ROW
  EXECUTE FUNCTION update_mcp_servers_updated_at();

-- Função para incrementar views
CREATE OR REPLACE FUNCTION increment_mcp_server_views(server_slug TEXT)
RETURNS void AS $$
BEGIN
  UPDATE public.mcp_servers
  SET views_count = views_count + 1
  WHERE slug = server_slug AND is_published = true;
END;
$$ LANGUAGE plpgsql;

-- RLS Policies
ALTER TABLE public.mcp_servers ENABLE ROW LEVEL SECURITY;

-- Política: Qualquer pessoa pode ler servidores publicados
CREATE POLICY "Servidores MCP publicados são visíveis para todos"
  ON public.mcp_servers
  FOR SELECT
  USING (is_published = true);

-- Política: Usuários autenticados podem ver seus próprios servidores (publicados ou não)
CREATE POLICY "Usuários podem ver seus próprios servidores MCP"
  ON public.mcp_servers
  FOR SELECT
  USING (auth.uid() = author_id);

-- Política: Usuários autenticados podem criar servidores
CREATE POLICY "Usuários autenticados podem criar servidores MCP"
  ON public.mcp_servers
  FOR INSERT
  WITH CHECK (auth.uid() = author_id);

-- Política: Usuários podem atualizar seus próprios servidores
CREATE POLICY "Usuários podem atualizar seus próprios servidores MCP"
  ON public.mcp_servers
  FOR UPDATE
  USING (auth.uid() = author_id)
  WITH CHECK (auth.uid() = author_id);

-- Política: Usuários podem deletar seus próprios servidores
CREATE POLICY "Usuários podem deletar seus próprios servidores MCP"
  ON public.mcp_servers
  FOR DELETE
  USING (auth.uid() = author_id);

-- Inserir alguns servidores MCP de exemplo (populares da comunidade)
INSERT INTO public.mcp_servers (
  title,
  slug,
  description,
  content,
  category,
  tags,
  npm_package,
  github_url,
  install_command,
  is_published,
  author_name
) VALUES
(
  'Filesystem MCP Server',
  'filesystem',
  'Permite que LLMs leiam e escrevam arquivos no sistema de arquivos local com segurança.',
  '<h2>Sobre</h2><p>O Filesystem MCP Server fornece acesso controlado ao sistema de arquivos, permitindo que modelos de linguagem leiam, escrevam e gerenciem arquivos de forma segura.</p><h2>Instalação</h2><pre><code>npx -y @modelcontextprotocol/server-filesystem /path/to/allowed/directory</code></pre><h2>Configuração no mcp.json</h2><pre><code>{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/Users/username/Documents"]
    }
  }
}</code></pre><h2>Recursos</h2><ul><li>Leitura de arquivos</li><li>Escrita de arquivos</li><li>Listagem de diretórios</li><li>Criação de diretórios</li><li>Busca de arquivos</li></ul>',
  'development',
  ARRAY['filesystem', 'files', 'local'],
  '@modelcontextprotocol/server-filesystem',
  'https://github.com/modelcontextprotocol/servers',
  'npx -y @modelcontextprotocol/server-filesystem',
  true,
  'MCP Team'
),
(
  'GitHub MCP Server',
  'github',
  'Integração completa com GitHub: repositórios, issues, pull requests e muito mais.',
  '<h2>Sobre</h2><p>O GitHub MCP Server permite que LLMs interajam com a API do GitHub, facilitando automação de tarefas de desenvolvimento.</p><h2>Instalação</h2><pre><code>npx -y @modelcontextprotocol/server-github</code></pre><h2>Configuração</h2><p>Você precisará de um Personal Access Token do GitHub.</p><pre><code>{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "seu_token_aqui"
      }
    }
  }
}</code></pre><h2>Recursos</h2><ul><li>Criar e gerenciar issues</li><li>Criar e revisar pull requests</li><li>Buscar repositórios</li><li>Gerenciar branches</li><li>Ler e comentar em discussões</li></ul>',
  'development',
  ARRAY['github', 'git', 'vcs', 'api'],
  '@modelcontextprotocol/server-github',
  'https://github.com/modelcontextprotocol/servers',
  'npx -y @modelcontextprotocol/server-github',
  true,
  'MCP Team'
),
(
  'PostgreSQL MCP Server',
  'postgresql',
  'Execute queries SQL e gerencie bancos de dados PostgreSQL diretamente.',
  '<h2>Sobre</h2><p>Conecte-se a bancos de dados PostgreSQL e execute queries, gerencie schemas e analise dados.</p><h2>Instalação</h2><pre><code>npx -y @modelcontextprotocol/server-postgres</code></pre><h2>Configuração</h2><pre><code>{
  "mcpServers": {
    "postgres": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-postgres", "postgresql://user:password@localhost:5432/dbname"]
    }
  }
}</code></pre><h2>Recursos</h2><ul><li>Executar queries SQL</li><li>Listar tabelas e schemas</li><li>Descrever estrutura de tabelas</li><li>Análise de dados</li><li>Gerenciamento de índices</li></ul>',
  'data',
  ARRAY['postgresql', 'database', 'sql'],
  '@modelcontextprotocol/server-postgres',
  'https://github.com/modelcontextprotocol/servers',
  'npx -y @modelcontextprotocol/server-postgres',
  true,
  'MCP Team'
),
(
  'Brave Search MCP Server',
  'brave-search',
  'Busca na web usando a API do Brave Search para obter informações atualizadas.',
  '<h2>Sobre</h2><p>Integre busca na web em tempo real usando o Brave Search, ideal para obter informações atualizadas.</p><h2>Instalação</h2><pre><code>npx -y @modelcontextprotocol/server-brave-search</code></pre><h2>Configuração</h2><p>Obtenha uma API key gratuita em <a href="https://brave.com/search/api/" target="_blank">brave.com/search/api</a></p><pre><code>{
  "mcpServers": {
    "brave-search": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-brave-search"],
      "env": {
        "BRAVE_API_KEY": "sua_api_key_aqui"
      }
    }
  }
}</code></pre><h2>Recursos</h2><ul><li>Busca web em tempo real</li><li>Resultados sem rastreamento</li><li>Suporte a múltiplos idiomas</li><li>Filtros de busca avançados</li></ul>',
  'ai',
  ARRAY['search', 'web', 'brave', 'api'],
  '@modelcontextprotocol/server-brave-search',
  'https://github.com/modelcontextprotocol/servers',
  'npx -y @modelcontextprotocol/server-brave-search',
  true,
  'MCP Team'
);
