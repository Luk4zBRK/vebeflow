# Configuração do CAPTCHA Cloudflare Turnstile

## Visão Geral

O sistema de autenticação do Vibe Flow usa Cloudflare Turnstile para proteção contra bots no formulário de login. Este documento explica como configurar o CAPTCHA corretamente.

## Status Atual

- **Frontend**: ✅ Implementado com componente `TurnstileCaptcha.tsx`
- **Backend**: ⚠️ Requer configuração no Dashboard do Supabase
- **Chave do Site**: `0x4AAAAAACVBvLEKX7wIwl5z` (configurada no `.env`)

## Configuração Necessária

### 1. Configurar no Dashboard do Supabase

Para que o CAPTCHA funcione, você precisa configurá-lo no dashboard do Supabase:

1. Acesse: https://supabase.com/dashboard/project/zarigqmtaexgcayzfqpt/auth/protection
2. Navegue até: **Authentication > Bot and Abuse Protection**
3. Ative: **Enable CAPTCHA protection**
4. Selecione: **Cloudflare Turnstile** no dropdown
5. Insira a **Secret Key** do Cloudflare Turnstile
6. Clique em **Save**

### 2. Obter as Chaves do Cloudflare

Se você ainda não tem as chaves:

1. Acesse: https://dash.cloudflare.com/
2. Vá para: **Turnstile**
3. Crie um novo site ou use um existente
4. Copie:
   - **Site Key** (já configurada: `0x4AAAAAACVBvLEKX7wIwl5z`)
   - **Secret Key** (precisa ser configurada no Supabase)

### 3. Configuração de Domínios

No Cloudflare Turnstile, adicione os domínios permitidos:
- `localhost` (para desenvolvimento)
- `vibeflow.site` (produção)
- Qualquer outro domínio onde o site será hospedado

## Implementação Atual

### Frontend (`src/pages/Auth.tsx`)

```typescript
// CAPTCHA é opcional - se não estiver configurado no Supabase, permite login sem ele
if (!captchaToken && import.meta.env.VITE_TURNSTILE_SITE_KEY) {
  toast({
    title: "Verificação necessária",
    description: "Por favor, complete a verificação CAPTCHA",
    variant: "destructive"
  });
  return;
}

const { error } = await signIn(email, password, captchaToken || undefined);
```

### Hook de Autenticação (`src/hooks/useAuth.tsx`)

```typescript
const signIn = async (email: string, password: string, captchaToken?: string) => {
  // Preparar options apenas se captchaToken existir
  const options = captchaToken ? { captchaToken } : undefined;
  
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
    ...(options && { options })
  });
  // ...
};
```

## Comportamento Atual

### Com CAPTCHA Configurado no Supabase
- ✅ Usuário precisa completar o CAPTCHA para fazer login
- ✅ Token é enviado para o Supabase validar
- ✅ Login só é permitido se o CAPTCHA for válido

### Sem CAPTCHA Configurado no Supabase
- ⚠️ CAPTCHA é exibido no frontend mas não é obrigatório
- ⚠️ Login funciona mesmo sem completar o CAPTCHA
- ⚠️ Supabase pode retornar erro 500 se receber token sem configuração

## Solução de Problemas

### Erro 500 no Login

**Causa**: Token do CAPTCHA está sendo enviado mas o Supabase não está configurado para validá-lo.

**Solução**:
1. Configure o CAPTCHA no dashboard do Supabase (veja seção "Configuração Necessária")
2. OU remova a chave `VITE_TURNSTILE_SITE_KEY` do `.env` para desabilitar o CAPTCHA

### CAPTCHA Não Aparece

**Causa**: Chave do site não está configurada ou é inválida.

**Solução**:
1. Verifique se `VITE_TURNSTILE_SITE_KEY` está no `.env`
2. Confirme que a chave é válida no Cloudflare
3. Verifique o console do navegador para erros de carregamento

### Warnings de CSP (Content Security Policy)

**Status**: ⚠️ Normal e esperado

Os warnings de CSP relacionados ao Turnstile são normais e não afetam o funcionamento:
```
Executing inline script violates the following Content Security Policy directive
```

Isso acontece porque o Turnstile injeta scripts inline para funcionar. Não é um erro crítico.

## Modo de Desenvolvimento

Para testar localmente:

1. Adicione `localhost` aos domínios permitidos no Cloudflare Turnstile
2. Configure o CAPTCHA no Supabase (mesmo para desenvolvimento)
3. Use a chave de teste do Cloudflare se necessário

## Modo de Produção

Para produção:

1. ✅ Configure o CAPTCHA no dashboard do Supabase
2. ✅ Use chaves de produção do Cloudflare
3. ✅ Adicione o domínio de produção aos domínios permitidos
4. ✅ Teste o fluxo completo de login

## Referências

- [Supabase CAPTCHA Docs](https://supabase.com/docs/guides/auth/auth-captcha)
- [Cloudflare Turnstile Docs](https://developers.cloudflare.com/turnstile/)
- [Componente TurnstileCaptcha](../src/components/TurnstileCaptcha.tsx)

## Próximos Passos

1. [ ] Configurar Secret Key no dashboard do Supabase
2. [ ] Testar login com CAPTCHA ativo
3. [ ] Verificar se erro 500 foi resolvido
4. [ ] Documentar chaves em local seguro (não no repositório)
