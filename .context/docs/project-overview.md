# Project Overview

> Vibe Flow é uma plataforma web que combina landing page institucional com painel administrativo para gestão de conteúdo e analytics.

## Purpose

O Vibe Flow serve como vitrine digital para uma consultoria tecnológica especializada em automações, IA e integrações. O projeto oferece:

- **Landing page responsiva** para apresentar serviços e captar leads
- **Assistente de IA integrado** via webhook n8n para atendimento automatizado
- **Painel administrativo** com controle de acesso para gestão de conteúdo
- **Sistema de analytics** para monitoramento de engajamento

O objetivo é acelerar a conversão de visitantes em leads qualificados através de uma experiência visual moderna e interativa.

## Quick Facts

- **Root path**: `c:\Users\lukas\Desktop\Desktop\Projetos diversos\Vibeflow\stream-solutions-hub-main\stream-solutions-hub-main`
- **Primary languages**: TypeScript/TSX (92 arquivos), SQL (5 migrações), JSON (configs)
- **Entry point**: `src/main.tsx` → `App.tsx` → React Router
- **Build tool**: Vite 5.4 com React SWC
- **Deployment**: Lovable platform

## Features

### Landing Page (Público)
- Hero section com animações e CTAs estratégicos
- Seções modulares: Sobre, Serviços, Portfólio, Benefícios, Parceiros
- Chat assistente com IA (integração n8n configurável)
- Formulário de contato com validação
- Design responsivo com glass effects e gradientes

### Painel Administrativo (Protegido)
- Autenticação via Supabase com roles (user/admin)
- Gestão de configurações do site (empresa, redes sociais, footer)
- Gerenciamento de depoimentos e conteúdo dinâmico
- Visualização e gestão de mensagens de contato
- Configuração de integrações (Google Analytics, webhook n8n)
- Dashboard com estatísticas básicas

### Integrações
- Supabase (auth, database, storage, RLS)
- n8n (webhook para processamento de chat)
- Google Analytics 4 (tracking configurável)

## Target Audience

### Usuários Finais (Landing Page)
- Heads de Operações/Marketing buscando parceiro tecnológico
- CTOs de startups precisando de squad especializado
- Analistas de Growth buscando automações com IA

### Administradores (Painel)
- Equipe Vibe Flow (super admin: contato@vibeflow.site)
- Time comercial para análise de leads
- Gestores de conteúdo para atualizações

## Key Exports

### Interfaces Públicas
- `BlogComment` - Estrutura de comentários do blog
- `PortfolioItem` - Item do portfólio com imagem, título, descrição
- `TextareaProps`, `ButtonProps`, `BadgeProps` - Props de componentes UI
- `Database`, `Tables`, `Enums` - Tipos gerados do Supabase

### Hooks Principais
- `useAuth()` - Autenticação e controle de acesso
- `useSiteConfig()` - Configurações dinâmicas do site
- `usePortfolio()` - Gestão de itens do portfólio
- `useAnalytics()` - Tracking de eventos
- `useToast()` - Notificações toast

## File Structure & Code Organization

- `src/` — Código-fonte TypeScript/React
  - `components/` — Componentes React (Header, Hero, Services, etc)
  - `components/ui/` — Componentes shadcn-ui (Button, Dialog, Form, etc)
  - `pages/` — Páginas/rotas (Index, Dashboard, Settings, Blog)
  - `hooks/` — Custom hooks (useAuth, useSiteConfig, usePortfolio)
  - `integrations/supabase/` — Cliente e tipos Supabase
  - `lib/` — Utilitários (cn para class merging)
- `supabase/` — Configuração e migrações do banco
  - `migrations/` — Migrações SQL versionadas
  - `config.toml` — Configuração do projeto Supabase
- `public/` — Assets estáticos (imagens, robots.txt, .htaccess)
- `documents/` — Documentação de produto (PDR-Vibe-Flow.md)
- `Dockerfile` + `nginx.conf` — Containerização e deploy
- `components.json` — Configuração shadcn-ui
- `tailwind.config.ts` — Configuração Tailwind CSS
- `vite.config.ts` — Configuração Vite build
- `tsconfig.*.json` — Configurações TypeScript

## Technology Stack Summary

### Core Framework Stack
- **React 18.3** + **TypeScript 5.8** - UI framework com tipagem estática
- **Vite 5.4** - Build tool ultra-rápido com HMR
- **React Router 6.30** - Roteamento client-side SPA

### UI & Interaction Libraries
- **Tailwind CSS 3.4** - Utility-first CSS framework
- **shadcn-ui** - Componentes React acessíveis (Radix UI)
- **Lucide React** - Biblioteca de ícones
- **Sonner** + **Radix Toast** - Sistema de notificações
- **Recharts 2.15** - Gráficos e visualizações
- **Embla Carousel** - Carrosséis responsivos

### Backend & Data
- **Supabase 2.57** - Backend-as-a-Service (PostgreSQL, Auth, Storage)
- **TanStack Query 5.83** - Data fetching, caching e sincronização
- **React Hook Form 7.61** - Gerenciamento de formulários
- **Zod 3.25** - Validação de schemas TypeScript-first

### Development Tools
- **ESLint 9** + **typescript-eslint** - Linting
- **PostCSS** + **Autoprefixer** - Processamento CSS
- **Lovable Tagger** - Integração com plataforma Lovable

## Getting Started Checklist

1. **Instale dependências**
   ```bash
   npm install
   ```

2. **Configure variáveis de ambiente**
   - Supabase URL e chave já estão em `src/integrations/supabase/client.ts`
   - Para produção, use variáveis de ambiente

3. **Inicie o servidor de desenvolvimento**
   ```bash
   npm run dev
   ```
   Acesse http://localhost:5173

4. **Explore a estrutura**
   - Landing page: `src/pages/Index.tsx`
   - Componentes: `src/components/`
   - Admin: `src/pages/Dashboard.tsx`, `Settings.tsx`

5. **Revise a documentação**
   - [Arquitetura](./architecture.md) - Estrutura e padrões
   - [Data Flow](./data-flow.md) - Fluxo de dados e APIs
   - [Development Workflow](./development-workflow.md) - Processo de desenvolvimento

## Next Steps

- Consulte o [PDR (Product Definition Report)](../documents/PDR-Vibe-Flow.md) para contexto de produto
- Veja [Architecture](./architecture.md) para entender a estrutura técnica
- Leia [Development Workflow](./development-workflow.md) para processo de desenvolvimento
- Acesse o [Lovable Project](https://lovable.dev/projects/a9188d44-cc13-4d27-b071-ef479fff36e4) para edição visual
