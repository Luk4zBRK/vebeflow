# Glossary

> Termos técnicos e conceitos específicos do Vibe Flow.

## Project Terms

**Vibe Flow**
Plataforma web que combina landing page institucional com painel administrativo para consultoria tecnológica.

**Landing Page**
Página pública principal (Index.tsx) que apresenta serviços e capta leads.

**Admin Panel**
Área protegida (Dashboard, Settings) para gestão de conteúdo e configurações.

**Site Config**
Configurações globais do site armazenadas em JSONB no Supabase (company_info, social_media, etc).

## Technical Terms

**SPA (Single Page Application)**
Aplicação web que carrega uma única página HTML e atualiza dinamicamente o conteúdo.

**RLS (Row Level Security)**
Sistema de segurança do PostgreSQL que controla acesso a linhas específicas baseado em políticas.

**BaaS (Backend-as-a-Service)**
Supabase fornece backend completo (database, auth, storage) sem gerenciar servidores.

**SSR (Server-Side Rendering)**
Renderização no servidor (não usado atualmente, mas considerado para futuro).

**HMR (Hot Module Replacement)**
Atualização de módulos em tempo real durante desenvolvimento sem reload completo.

## React/TypeScript

**Component**
Função React que retorna JSX, reutilizável e composável.

**Hook**
Função React que permite usar state e lifecycle em componentes funcionais (useState, useEffect, custom hooks).

**Props**
Propriedades passadas de componente pai para filho.

**State**
Dados que mudam ao longo do tempo e causam re-render.

**Context**
Forma de passar dados através da árvore de componentes sem prop drilling (ex: AuthProvider).

**JSX**
Sintaxe que permite escrever HTML-like dentro de JavaScript/TypeScript.

## Supabase

**Supabase Client**
Instância configurada para comunicação com backend Supabase.

**Migration**
Arquivo SQL versionado que altera schema do banco de dados.

**Policy**
Regra RLS que define quem pode acessar/modificar dados.

**Storage Bucket**
Container para arquivos (imagens, documentos) no Supabase Storage.

**Edge Function**
Função serverless que roda no edge (próximo ao usuário) - futuro.

## UI/Styling

**Tailwind CSS**
Framework CSS utility-first usado para estilização.

**shadcn-ui**
Coleção de componentes React acessíveis baseados em Radix UI.

**Radix UI**
Biblioteca de primitivos UI acessíveis e não-estilizados.

**cn() utility**
Função helper para merge condicional de classes Tailwind.

**Glass Effect**
Efeito visual de vidro fosco (backdrop-blur, transparência).

## Data Management

**TanStack Query**
Biblioteca para data fetching, caching e sincronização (anteriormente React Query).

**Query Key**
Identificador único para cache de queries (ex: ['site-config']).

**Mutation**
Operação que modifica dados (POST, PUT, DELETE).

**Optimistic Update**
Atualizar UI antes de confirmar com servidor para melhor UX.

**Cache Invalidation**
Marcar dados em cache como stale para forçar refetch.

## Integrations

**n8n**
Plataforma de automação workflow-based usada para chat assistant.

**Webhook**
URL que recebe dados via HTTP POST para processar eventos.

**Google Analytics 4 (GA4)**
Plataforma de analytics para tracking de usuários e eventos.

**Lovable**
Plataforma de desenvolvimento e deploy usada para o projeto.

## Development

**Vite**
Build tool moderno e rápido para projetos frontend.

**ESLint**
Linter para identificar problemas no código JavaScript/TypeScript.

**TypeScript**
Superset de JavaScript com tipagem estática.

**Conventional Commits**
Padrão de mensagens de commit (feat, fix, docs, etc).

**Hot Reload**
Atualização automática do browser durante desenvolvimento.

## Patterns

**CRUD**
Create, Read, Update, Delete - operações básicas de dados.

**DRY (Don't Repeat Yourself)**
Princípio de evitar duplicação de código.

**Separation of Concerns**
Separar lógica de negócio, apresentação e dados.

**Composition over Inheritance**
Preferir composição de componentes a herança.

**Single Responsibility**
Cada componente/função deve ter uma única responsabilidade.

## Roles & Permissions

**User**
Role básico para usuários autenticados.

**Admin**
Role com permissões completas para gestão do site.

**Super Admin**
Admin principal (contato@vibeflow.site) com acesso total.

**Anonymous**
Usuário não autenticado (público).

## Status & States

**Loading**
Estado enquanto dados estão sendo carregados.

**Error**
Estado quando operação falha.

**Success**
Estado quando operação completa com sucesso.

**Pending**
Estado inicial antes de qualquer ação.

**Stale**
Dados em cache que podem estar desatualizados.

## Acronyms

- **API**: Application Programming Interface
- **CDN**: Content Delivery Network
- **CI/CD**: Continuous Integration/Continuous Deployment
- **CMS**: Content Management System
- **CTA**: Call To Action
- **DB**: Database
- **DX**: Developer Experience
- **FK**: Foreign Key
- **HTTP**: Hypertext Transfer Protocol
- **HTTPS**: HTTP Secure
- **JWT**: JSON Web Token
- **LLM**: Large Language Model
- **MFA**: Multi-Factor Authentication
- **ORM**: Object-Relational Mapping
- **PK**: Primary Key
- **REST**: Representational State Transfer
- **SDK**: Software Development Kit
- **SEO**: Search Engine Optimization
- **SQL**: Structured Query Language
- **UI**: User Interface
- **URL**: Uniform Resource Locator
- **UX**: User Experience
- **UUID**: Universally Unique Identifier
