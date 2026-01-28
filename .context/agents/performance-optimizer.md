---
name: Performance Optimizer
description: Identify performance bottlenecks
status: unfilled
generated: 2026-01-28
---

# Performance Optimizer Agent Playbook

## Mission
Describe how the performance optimizer agent supports the team and when to engage it.

## Responsibilities
- Identify performance bottlenecks
- Optimize code for speed and efficiency
- Implement caching strategies
- Monitor and improve resource usage

## Best Practices
- Measure before optimizing
- Focus on actual bottlenecks
- Don't sacrifice readability unnecessarily

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
- *No relevant symbols detected.*

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
