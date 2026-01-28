---
name: Devops Specialist
description: Design and maintain CI/CD pipelines
status: unfilled
generated: 2026-01-28
---

# Devops Specialist Agent Playbook

## Mission
Describe how the devops specialist agent supports the team and when to engage it.

## Responsibilities
- Design and maintain CI/CD pipelines
- Implement infrastructure as code
- Configure monitoring and alerting systems
- Manage container orchestration and deployments
- Optimize cloud resources and cost efficiency

## Best Practices
- Automate everything that can be automated
- Implement infrastructure as code for reproducibility
- Monitor system health proactively
- Design for failure and implement proper fallbacks
- Keep security and compliance in every deployment

## Key Project Resources
- Documentation index: [docs/README.md](../docs/README.md)
- Agent handbook: [agents/README.md](./README.md)
- Agent knowledge base: [AGENTS.md](../../AGENTS.md)
- Contributor guide: [CONTRIBUTING.md](../../CONTRIBUTING.md)

## Repository Starting Points
- `documents/` — TODO: Describe the purpose of this directory.
- `public/` — TODO: Describe the purpose of this directory.
- `src/` — TODO: Describe the purpose of this directory.
- `supabase/` — TODO: Describe the purpose of this directory.

## Key Files
**Entry Points:**
- [`src\main.tsx`](src\main.tsx)

## Architecture Context

### Config
Configuration and constants
- **Directories**: `.`, `src\hooks`
- **Symbols**: 7 total

### Utils
Shared utilities and helpers
- **Directories**: `src\lib`
- **Symbols**: 1 total
- **Key exports**: [`cn`](src\lib\utils.ts#L4)

### Components
UI components and views
- **Directories**: `src\components\ui`, `src\pages`, `src\components`
- **Symbols**: 32 total
- **Key exports**: [`Toaster`](src\components\ui\toaster.tsx#L4), [`TextareaProps`](src\components\ui\textarea.tsx#L5), [`ChartConfig`](src\components\ui\chart.tsx#L9), [`CalendarProps`](src\components\ui\calendar.tsx#L8), [`ButtonProps`](src\components\ui\button.tsx#L35), [`BadgeProps`](src\components\ui\badge.tsx#L23)
## Key Symbols for This Agent
- [`BlogComment`](src\hooks\useComments.ts#L5) (interface)
- [`PortfolioItem`](src\hooks\usePortfolio.tsx#L5) (interface)
- [`TextareaProps`](src\components\ui\textarea.tsx#L5) (interface)
- [`ButtonProps`](src\components\ui\button.tsx#L35) (interface)
- [`BadgeProps`](src\components\ui\badge.tsx#L23) (interface)

## Documentation Touchpoints
- [Documentation Index](../docs/README.md)
- [Project Overview](../docs/project-overview.md)
- [Architecture Notes](../docs/architecture.md)
- [Development Workflow](../docs/development-workflow.md)
- [Testing Strategy](../docs/testing-strategy.md)
- [Glossary & Domain Concepts](../docs/glossary.md)
- [Data Flow & Integrations](../docs/data-flow.md)
- [Security & Compliance Notes](../docs/security.md)
- [Tooling & Productivity Guide](../docs/tooling.md)

## Collaboration Checklist

1. Confirm assumptions with issue reporters or maintainers.
2. Review open pull requests affecting this area.
3. Update the relevant doc section listed above.
4. Capture learnings back in [docs/README.md](../docs/README.md).

## Hand-off Notes

Summarize outcomes, remaining risks, and suggested follow-up actions after the agent completes its work.
