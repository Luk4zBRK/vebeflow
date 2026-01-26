# Product Definition Report (PDR) — Vibe Flow

| Versão | Data | Autor | Status |
| --- | --- | --- | --- |
| 1.0 | 2025-09-24 | Equipe Vibe Flow | Rascunho inicial |

## Visão Geral

O Vibe Flow é uma plataforma que combina uma landing page institucional com um painel administrativo seguro para gestão de conteúdo, integrações e analytics. O objetivo é apresentar os serviços da consultoria tecnológica, captar leads e oferecer automações inteligentes de atendimento via chat com IA, mantendo governança dos dados pelo time interno.

## Contexto e Oportunidade

- **Necessidade do negócio**: Empresas precisam acelerar projetos digitais e automações com uma equipe especializada. A Vibe Flow atua como parceira estratégica entregando soluções sob medida.
- **Proposta de valor**: Landing page com forte apelo visual, vitrine de serviços e cases, além de suporte integrado de IA para captação e qualificação de leads.
- **Motivadores**: Crescimento da demanda por automações (n8n), IA generativa e integrações multicanal. Diferenciação via atendimento humanizado e agilidade.

## Objetivos do Produto

1. **Divulgação**: comunicar identidade, serviços e diferenciais da Vibe Flow de forma clara e responsiva.
2. **Conversão**: estimular visitantes a solicitar orçamento ou iniciar conversa com o assistente de IA.
3. **Gestão interna**: permitir que administradores configurem conteúdos, depoimentos e integrações de forma autônoma.
4. **Monitoramento**: oferecer visibilidade sobre métricas de desempenho e engajamento.

## Escopo

### Incluído

- **Landing page SPA** (`src/pages/Index.tsx`) com seções de hero, sobre, serviços, benefícios, parceiros, chat assistente e formulário de contato.
- **Componentes UI** desenvolvidos com React, Tailwind CSS e shadcn-ui (`src/components/`).
- **Assistente de IA** integrado via webhook n8n configurável (`Settings.tsx` > aba Assistente IA).
- **Painel administrativo** com proteção de rota e controle de acesso (`Settings.tsx`, `useAuth`, roles Supabase) para gestão de conteúdos configuráveis (`site_config`).
- **Integração Supabase** para autenticação, armazenamento de configurações e políticas RLS.
- **Gestão de mensagens de contato e estatísticas** via dashboard para usuários com papel `admin` (incluindo super admin `contato@vibeflow.site`).

### Fora do Escopo Inicial

- Publicação automática em múltiplos idiomas.
- Sistema de CRM completo com automações pós-lead.
- Aplicativos mobile nativos.
- Monitoramento em tempo real via dashboards avançados externos.

## Stakeholders

- **Lukas / Equipe Vibe Flow** — Product Owner.
- **Time de desenvolvimento interno** — implementação frontend, backend e automações.
- **Equipe Comercial** — usa o admin para analisar leads e atualizar conteúdo.
- **Leads e clientes potenciais** — usuários finais da landing page e chat.

## Personas

- **Head de Operações/Marketing**: busca parceiro tecnológico ágil.
- **CTO de startup**: precisa de squad especializado para integrações.
- **Analista de Growth**: busca automatizar jornadas com IA.

## Requisitos Funcionais

- **Landing Page**
  - Exibir hero interativo com CTA para contato (`Hero.tsx`).
  - Sessões modulares com conteúdos configuráveis via Supabase (`About`, `Services`, `Benefits`).
  - Carrossel de parceiros com logos animados (`Partners.tsx`).
  - Formulário de contato integrado à base Supabase e painel de mensagens.
  - Chat de IA com placeholder configurável e webhook dinâmico (`ChatAssistant`).

- **Painel Administrativo**
  - Autenticação via Supabase; somente usuários `admin` podem acessar `/dashboard` e `/settings`.
  - Gestão de informações da empresa, redes sociais, conteúdo do footer e depoimentos (`Settings.tsx`, `useSiteConfig.tsx`).
  - Atualização otimista das configurações com feedback ao usuário.
  - Visualização e mudança de status das mensagens de contato.
  - Estatísticas básicas de engajamento e tráfego.

- **Integrações**
  - Supabase para autenticação, armazenamento (`site_config`) e políticas RLS.
  - n8n para processamento do chat (webhook configurável, `DEFAULT_CHAT_WEBHOOK`).
  - Google Analytics 4 (ID configurável na aba Analytics).

## Requisitos Não Funcionais

- **Performance**: carregamento inicial rápido (Vite + lazy loading de imagens, `loading="lazy"`).
- **Segurança**: RLS ativo no Supabase; roles `user` e `admin` com controle fino.
- **Escalabilidade**: arquitetura SPA modular com componentes reutilizáveis.
- **Observabilidade**: logs no console para debugging (`useSiteConfig` fetchers) e métricas via GA4.
- **UX/UI**: design responsivo, efeitos visuais (glass effect, gradients) e acessibilidade básica (role `list`, `aria-live="off"`).

## Arquitetura e Tecnologias

- **Frontend**: React + TypeScript (`vite.config.ts`), Tailwind, shadcn-ui.
- **Estado**: hooks locais, `useSiteConfig` para dados remotos.
- **Backend-as-a-Service**: Supabase (auth, database, storage, RLS policies em `supabase_public_site_config_policy.sql`).
- **Infraestrutura**: Deploy via Lovable, com automações n8n externas.
- **Ferramentas**: Node.js, npm/bun, ESLint, PostCSS.

```mermaid
flowchart TD
    Visitor([Visitante]) -->|CTA| Landing[Landing Page]
    Landing -->|Mensagem| Chat[Assistente IA (n8n webhook)]
    Landing -->|Contato| Supabase[(Supabase DB)]
    Admin[Admin Vibe Flow] -->|Login| Supabase
    Admin -->|Gerencia Configurações| Painel[/Dashboard & Settings/]
    Painel --> Supabase
    Supabase --> Analytics[Google Analytics 4]
```

## Fluxos Principais

1. **Visitante acessa a landing**, consome conteúdo e interage com animações.
2. **CTA direciona para formulário de contato** ou inicia chat com IA (n8n).
3. **Lead é armazenado** com status inicial e fica disponível para admins.
4. **Admin autentica** (Super admin configurado: `contato@vibeflow.site`, roles `user`, `admin`).
5. **Admin atualiza conteúdos** e integrações pelo painel (`Settings.tsx`).
6. **Analytics registra** eventos de navegação e engajamento conforme configurações.

## Métricas

- Conversões por CTA (solicitar orçamento, abrir chat).
- Número de leads por período e status.
- Taxa de scroll e cliques em componentes-chave.
- Engajamento no chat (mensagens enviadas x respondidas).

## Riscos e Mitigações

- **Dependência de Supabase**: monitorar limites de plano. Mitigação: fallback local mínimo e alertas.
- **Disponibilidade do n8n**: manter monitoramento e fallback de mensagem de indisponibilidade.
- **Escalabilidade da landing**: otimizar imagens e CDN; revisar build Vite.
- **Segurança**: manter políticas RLS atualizadas, forçar MFA para admins.

## Roadmap Sugerido

- Iteração 1: Refinar conteúdo e depoimentos reais, integrar analytics.
- Iteração 2: Painel de mensagens com filtros avançados e tags.
- Iteração 3: Multi-idioma e novos templates de landing.
- Iteração 4: Integração com CRM externo (HubSpot/Pipedrive) e relatórios.

## Referências

- `src/pages/Index.tsx`, `Settings.tsx`, `useSiteConfig.tsx`, `Header.tsx`, `Partners.tsx`.
- `supabase/` policies e client.
- Documentação Supabase e n8n para integrações.
