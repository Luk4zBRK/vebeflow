# Sistema de Abas do Blog

## Visão Geral

O Blog do Vibe Flow possui um sistema de abas/filtros que permite navegar entre diferentes tipos de conteúdo sem recarregar a página. Todos os conteúdos são acessíveis através da rota `/blog`, com navegação interna via abas.

## Estrutura de Navegação

### Header (Navegação Principal)
O Header mantém 3 links principais que levam para páginas dedicadas:
- **Blog** → `/blog` (página com sistema de abas)
- **Workflows** → `/workflows` (página dedicada)
- **Gerador VPS** → `/vps-generator` (página dedicada)

### Abas Internas do Blog
Dentro da página `/blog`, existem 5 abas que mudam o conteúdo dinamicamente:

1. **Todos** (`selectedView: 'blog'`, `category: null`)
   - Mostra todos os posts do blog
   - Permite busca por termo
   - Exibe cards com imagem, título, excerpt, meta info e tags

2. **Tecnologia** (`selectedView: 'blog'`, `category: 'Tecnologia'`)
   - Filtra posts da categoria "Tecnologia"
   - Mesmo layout dos posts normais
   - Ícone: `<Tag />`

3. **Novidades IDEs** (`selectedView: 'news'`)
   - Exibe changelog/news de IDEs populares
   - Fontes: Windsurf, Cursor, Replit, Bolt, Bind AI, Firebase Studio, VS Code, JetBrains, Antgravit
   - Usa hook `useChangelogNews` para buscar dados via proxy Jina.ai
   - Botão de atualizar manual
   - Ícone: `<Sparkles />` (laranja)

4. **Workflows** (`selectedView: 'workflows'`)
   - Lista workflows publicados da tabela `workflows`
   - Cards com imagem, título, descrição, data e views
   - Clique leva para `/workflows/:slug`
   - Ícone: `<Workflow />` (verde)

5. **Gerador VPS** (`selectedView: 'vps'`)
   - Card único promocional da ferramenta
   - Descrição dos recursos
   - Botão "Acessar Gerador" → `/vps-generator`
   - Ícone: `<Server />` (roxo)

## Implementação Técnica

### Estado
```typescript
const [selectedView, setSelectedView] = useState<'blog' | 'news' | 'workflows' | 'vps'>('blog');
const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
const [workflows, setWorkflows] = useState<any[]>([]);
```

### Botões de Filtro
- Botões com `variant="default"` quando ativo, `variant="outline"` quando inativo
- Cores customizadas para cada tipo:
  - News: laranja (`border-orange-200`, `text-orange-700`)
  - Workflows: verde (`border-green-200`, `text-green-700`)
  - VPS: roxo (`border-purple-200`, `text-purple-700`)

### Renderização Condicional
```typescript
{selectedView === 'blog' && (/* Posts do blog */)}
{selectedView === 'news' && (/* Novidades IDEs */)}
{selectedView === 'workflows' && (/* Grid de workflows */)}
{selectedView === 'vps' && (/* Card do Gerador VPS */)}
```

### Fetch de Dados
- **Posts**: Carregados no `useEffect` inicial
- **Workflows**: Carregados quando `selectedView === 'workflows'`
- **News**: Gerenciado pelo hook `useChangelogNews`

## Fluxo de Usuário

1. Usuário acessa `/blog`
2. Por padrão, vê aba "Todos" com posts do blog
3. Pode clicar em qualquer aba para mudar o conteúdo
4. Busca por termo funciona apenas na view 'blog'
5. Cada view tem seu próprio estado de loading
6. Navegação entre abas é instantânea (sem reload)

## Arquivos Relacionados

- `src/pages/Blog.tsx` - Componente principal com sistema de abas
- `src/components/Header.tsx` - Navegação principal
- `src/hooks/useChangelogNews.ts` - Hook para buscar novidades de IDEs
- `src/pages/Workflows.tsx` - Página dedicada de workflows (referência)

## Melhorias Futuras

- [ ] Adicionar query params na URL para compartilhar abas específicas (`/blog?view=workflows`)
- [ ] Implementar paginação para posts e workflows
- [ ] Cache de workflows para evitar refetch desnecessário
- [ ] Animações de transição entre abas
- [ ] Filtros adicionais (data, autor, tags)
