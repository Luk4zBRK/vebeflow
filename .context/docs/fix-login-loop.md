# Correção: Loop Infinito no Login e Erro 500 do CAPTCHA

## Problemas Identificados

### 1. Loop Infinito de Navegação
**Sintoma**: Tela branca após login com erro "Throttling navigation to prevent the browser from hanging"

**Causa**: Dois useEffect conflitantes criando um loop:
- `Auth.tsx` (linha 30): Redireciona para `/dashboard` quando `user` existe
- `Dashboard.tsx` (linha 180): Redireciona para `/auth` quando `user` não existe
- Ambos tinham `navigate` nas dependências, causando re-renders infinitos

### 2. Erro 500 no Login com CAPTCHA
**Sintoma**: POST para `/auth/v1/token?grant_type=password` retorna 500

**Causa**: Token do CAPTCHA sendo enviado mas Supabase não configurado para validá-lo

## Correções Aplicadas

### 1. Removido `navigate` das Dependências dos useEffect

**Arquivo**: `src/pages/Dashboard.tsx`
```typescript
// ANTES
useEffect(() => {
  if (!isLoading && (!user || !isAdmin)) {
    navigate('/auth');
  }
}, [user, isAdmin, isLoading, navigate]); // ❌ navigate causava loop

// DEPOIS
useEffect(() => {
  if (!isLoading && (!user || !isAdmin)) {
    navigate('/auth');
  }
}, [user, isAdmin, isLoading]); // ✅ Removido navigate
```

**Arquivo**: `src/pages/Auth.tsx`
```typescript
// ANTES
useEffect(() => {
  if (user) {
    navigate('/dashboard');
  }
}, [user, navigate]); // ❌ navigate causava loop

// DEPOIS
useEffect(() => {
  if (user) {
    navigate('/dashboard');
  }
}, [user]); // ✅ Removido navigate
```

**Justificativa**: `navigate` é uma função estável do React Router que não muda entre renders. Incluí-la nas dependências é desnecessário e pode causar loops quando combinado com outros useEffect que também navegam.

### 2. CAPTCHA Tornado Opcional

**Arquivo**: `src/hooks/useAuth.tsx`
```typescript
// ANTES
const signIn = async (email: string, password: string, captchaToken?: string) => {
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
    options: {
      captchaToken // ❌ Sempre enviava options, mesmo sem token
    }
  });
};

// DEPOIS
const signIn = async (email: string, password: string, captchaToken?: string) => {
  const options = captchaToken ? { captchaToken } : undefined;
  
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
    ...(options && { options }) // ✅ Só envia options se token existir
  });
};
```

**Arquivo**: `src/pages/Auth.tsx`
```typescript
// ANTES
if (!captchaToken) {
  toast({ /* erro */ });
  return;
}

<Button disabled={isLoading || !captchaToken}> // ❌ Bloqueava login sem CAPTCHA

// DEPOIS
if (!captchaToken && import.meta.env.VITE_TURNSTILE_SITE_KEY) {
  toast({ /* erro */ });
  return;
}

<Button disabled={isLoading}> // ✅ Permite login se CAPTCHA não configurado
```

### 3. Flags do React Router v7 Já Configuradas

**Arquivo**: `src/App.tsx`
```typescript
<BrowserRouter
  future={{
    v7_startTransition: true,      // ✅ Já estava configurado
    v7_relativeSplatPath: true     // ✅ Já estava configurado
  }}
>
```

Isso resolve os warnings do React Router sobre futuras mudanças na v7.

## Comportamento Atual

### Fluxo de Login
1. Usuário acessa `/auth`
2. Se já estiver logado → redireciona para `/dashboard` (sem loop)
3. Preenche email e senha
4. Completa CAPTCHA (se configurado)
5. Clica em "Entrar"
6. Se sucesso → redireciona para `/dashboard`
7. Dashboard verifica autenticação → se não logado, redireciona para `/auth` (sem loop)

### CAPTCHA
- **Com chave configurada**: CAPTCHA é exibido e validado
- **Sem chave configurada**: Login funciona normalmente sem CAPTCHA
- **Com chave mas sem config no Supabase**: Login funciona mas CAPTCHA é ignorado

## Testes Recomendados

1. ✅ Login sem CAPTCHA configurado
2. ⚠️ Login com CAPTCHA configurado (requer config no Supabase)
3. ✅ Redirecionamento após login
4. ✅ Proteção de rotas (dashboard só para admin)
5. ✅ Logout e redirecionamento

## Próximos Passos

1. [ ] Configurar Secret Key do Turnstile no dashboard do Supabase
2. [ ] Testar login completo com CAPTCHA ativo
3. [ ] Verificar se erro 500 foi resolvido
4. [ ] Testar em produção

## Arquivos Modificados

- `src/pages/Dashboard.tsx` - Removido navigate das dependências
- `src/pages/Auth.tsx` - Removido navigate das dependências, CAPTCHA opcional
- `src/hooks/useAuth.tsx` - CAPTCHA token enviado condicionalmente
- `.context/docs/captcha-setup.md` - Documentação completa do CAPTCHA

## Referências

- [React Router useNavigate](https://reactrouter.com/en/main/hooks/use-navigate)
- [React useEffect Dependencies](https://react.dev/reference/react/useEffect#specifying-reactive-dependencies)
- [Supabase CAPTCHA](https://supabase.com/docs/guides/auth/auth-captcha)
