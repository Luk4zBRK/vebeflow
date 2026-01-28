# Sistema de Servidores MCP

## Visão Geral

Sistema completo para compartilhar e descobrir servidores Model Context Protocol (MCP). Permite que usuários publiquem configurações, tutoriais e exemplos de servidores MCP para potencializar IDEs com IA.

## Motivação

O Model Context Protocol é um padrão emergente para conectar LLMs a ferramentas e dados externos. Este sistema facilita o compartilhamento de servidores MCP úteis, incluindo:
- Instruções de instalação
- Exemplos de configuração
- Links para documentação oficial
- Casos de uso práticos

## Arquitetura

### 1. Tabela do Banco de Dados

#### `mcp_servers`
Armazena informações sobre servidores MCP.

```sql
CREATE TABLE public.mcp_servers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  content TEXT NOT NULL,
  image_url TEXT,
  author_id UUID REFERENCES auth.users(id),
  author_name TEXT,
  category TEXT,
  tags TEXT[],
  npm_package TEXT,
  github_url TEXT,
  install_command TEXT,
  is_published BOOLEAN DEFAULT false,
  views_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Campos principais:**
- `title`: Nome do servidor MCP
- `slug`: URL-friendly identifier
- `description`: Descrição breve
- `content`: Conteúdo HTML com instruções detalhadas
- `category`: Categoria (development, data, ai, productivity)
- `tags`: Array de tags para busca
- `npm_package`: Nome do pacote npm (se aplicável)
- `github_url`: Link para repositório
- `install_command`: Comando de instalação rápida

**Políticas RLS:**
- Leitura pública para servidores publicados
- Usuários autenticados podem criar/editar/deletar seus próprios servidores

### 2. Páginas

#### `/mcp-servers` - Listagem Pública
- Grid de cards com servidores MCP publicados
- Busca por título/descrição
- Filtros por categoria
- Badges para npm, GitHub, CLI
- Contador de visualizações

#### `/mcp-servers/:slug` - Visualização Individual
- Título e descrição
- Badges de categoria e tags
- Links para GitHub e npm
- Comando de instalação com botão copiar
- Conteúdo HTML renderizado
- Incrementa contador de visualizações

#### `/mcp-manager` - Gerenciamento Admin
- CRUD completo de servidores MCP
- Upload de imagem (drag & drop ou URL)
- Editor de conteúdo HTML
- Toggle de publicação
- Preview antes de publicar

### 3. Integração no Blog

Nova aba "MCP Servers" no sistema de abas do Blog:
- Acesso via `/blog` → aba "MCP Servers"
- Grid de cards similar a Workflows
- Navegação para página individual ao clicar

## Fluxo de Dados

### Criação de Servidor MCP
```
Admin acessa /mcp-manager
  ↓
Clica em "Novo Servidor"
  ↓
Preenche formulário:
  - Título, slug, descrição
  - Conteúdo HTML
  - Categoria, tags
  - npm package, GitHub URL
  - Comando de instalação
  - Upload de imagem (opcional)
  ↓
Toggle "Publicar servidor"
  ↓
Salva no banco de dados
  ↓
Servidor aparece em /mcp-servers
```

### Visualização por Usuário
```
Usuário acessa /blog
  ↓
Clica na aba "MCP Servers"
  ↓
Vê grid de servidores publicados
  ↓
Clica em um servidor
  ↓
Navega para /mcp-servers/:slug
  ↓
Lê instruções e copia comando
  ↓
Contador de visualizações incrementado
```

## Categorias Sugeridas

- **development**: Ferramentas de desenvolvimento (GitHub, filesystem, etc.)
- **data**: Bancos de dados e análise de dados (PostgreSQL, MongoDB, etc.)
- **ai**: Serviços de IA e busca (Brave Search, OpenAI, etc.)
- **productivity**: Produtividade e automação (calendário, email, etc.)

## Exemplos de Servidores MCP

### 1. Filesystem MCP Server
```json
{
  "title": "Filesystem MCP Server",
  "category": "development",
  "npm_package": "@modelcontextprotocol/server-filesystem",
  "install_command": "npx -y @modelcontextprotocol/server-filesystem",
  "github_url": "https://github.com/modelcontextprotocol/servers"
}
```

### 2. GitHub MCP Server
```json
{
  "title": "GitHub MCP Server",
  "category": "development",
  "npm_package": "@modelcontextprotocol/server-github",
  "install_command": "npx -y @modelcontextprotocol/server-github",
  "github_url": "https://github.com/modelcontextprotocol/servers"
}
```

### 3. PostgreSQL MCP Server
```json
{
  "title": "PostgreSQL MCP Server",
  "category": "data",
  "npm_package": "@modelcontextprotocol/server-postgres",
  "install_command": "npx -y @modelcontextprotocol/server-postgres",
  "github_url": "https://github.com/modelcontextprotocol/servers"
}
```

## Formato do Conteúdo HTML

Exemplo de estrutura recomendada:

```html
<h2>Sobre</h2>
<p>Descrição detalhada do servidor MCP...</p>

<h2>Instalação</h2>
<pre><code>npx -y @modelcontextprotocol/server-filesystem /path/to/directory</code></pre>

<h2>Configuração no mcp.json</h2>
<pre><code>{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/Users/username/Documents"]
    }
  }
}</code></pre>

<h2>Recursos</h2>
<ul>
  <li>Leitura de arquivos</li>
  <li>Escrita de arquivos</li>
  <li>Listagem de diretórios</li>
</ul>

<h2>Exemplos de Uso</h2>
<p>Casos de uso práticos...</p>
```

## Recursos Implementados

### 1. Sistema de Busca e Filtros
- Busca por título e descrição
- Filtros por categoria
- Tags para organização

### 2. Upload de Imagens
- Drag & drop ou seleção de arquivo
- URL externa de imagem
- Preview antes de salvar
- Validação de tipo e tamanho (máx 5MB)
- Armazenamento em `images/mcp-servers/`

### 3. Comando de Instalação
- Campo dedicado para comando CLI
- Botão "Copiar" com feedback visual
- Exibição destacada na página individual

### 4. Links Externos
- Badge para npm package
- Badge para repositório GitHub
- Links abrem em nova aba

### 5. Sistema de Visualizações
- Contador automático ao acessar página individual
- Exibido em cards e página individual
- Função `increment_mcp_server_views()`

## Configuração Necessária

### 1. Aplicar Migração
```bash
# Via MCP Supabase
mcp_supabase_mcp_server_apply_migration(
  project_id="zarigqmtaexgcayzfqpt",
  name="mcp_servers_system",
  query="[conteúdo da migração]"
)

# Ou via Supabase CLI
supabase db push
```

### 2. Criar Bucket de Imagens
Se ainda não existir:
```sql
INSERT INTO storage.buckets (id, name, public)
VALUES ('images', 'images', true);
```

### 3. Configurar RLS no Storage
```sql
CREATE POLICY "Imagens públicas são visíveis para todos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'images');

CREATE POLICY "Usuários autenticados podem fazer upload"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'images' AND auth.role() = 'authenticated');
```

## Rotas Implementadas

```typescript
// Públicas
<Route path="/mcp-servers" element={<McpServers />} />
<Route path="/mcp-servers/:slug" element={<McpServerPost />} />

// Admin (requer autenticação)
<Route path="/mcp-manager" element={<McpManager />} />
```

## Integração no Dashboard

Adicionar link no Dashboard admin:

```typescript
<Button onClick={() => navigate('/mcp-manager')}>
  <Plug className="h-4 w-4 mr-2" />
  Gerenciar Servidores MCP
</Button>
```

## Melhorias Futuras

- [ ] Sistema de votação/likes
- [ ] Comentários nos servidores
- [ ] Verificação de servidores oficiais (badge "Verified")
- [ ] Estatísticas de uso (downloads, instalações)
- [ ] Integração com npm API para buscar info automaticamente
- [ ] Sistema de versões (changelog do servidor)
- [ ] Categorias customizáveis
- [ ] Busca avançada com múltiplos filtros
- [ ] Export de configuração mcp.json completa
- [ ] Testes automatizados de servidores

## Arquivos Relacionados

- `supabase/migrations/20260128020000_mcp_servers_system.sql` - Migração do BD
- `src/pages/McpServers.tsx` - Listagem pública
- `src/pages/McpServerPost.tsx` - Visualização individual
- `src/pages/McpManager.tsx` - Gerenciamento admin
- `src/pages/Blog.tsx` - Integração na aba
- `src/App.tsx` - Rotas
- `src/integrations/supabase/types.ts` - Tipos TypeScript
- `.context/docs/mcp-servers-system.md` - Esta documentação

## Referências

- [Model Context Protocol](https://modelcontextprotocol.io/)
- [MCP Servers Repository](https://github.com/modelcontextprotocol/servers)
- [MCP Specification](https://spec.modelcontextprotocol.io/)
