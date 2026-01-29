# Contexto ativo

- Sessão 2026-01-16: inicialização. Não havia arquivo anterior.
- Objetivo: criar dashboard para consumir dados da API Kommo.
- Próximos passos imediatos: entender stack do projeto, definir plano de trabalho, mapear autenticação/escopos da Kommo.

- Sessão 2026-01-29: Correção de erro de Captcha em produção.
- Problema: `VITE_TURNSTILE_SITE_KEY` não configurado em produção.
- Causa: Variáveis de ambiente VITE não passadas para o build no Dockerfile.
- Resolução: Adicionados ARG e ENV no Dockerfile para `VITE_TURNSTILE_SITE_KEY`, `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY`.
- Próximos passos: Usuário deve redeployar a aplicação passando as variáveis de ambiente necessárias.
