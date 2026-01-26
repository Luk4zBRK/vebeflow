-- Política para permitir leitura pública das configurações do site
-- Execute este SQL no Dashboard do Supabase para permitir que usuários deslogados vejam as informações

-- Primeiro, habilitar RLS na tabela site_config (se não estiver habilitado)
ALTER TABLE site_config ENABLE ROW LEVEL SECURITY;

-- Criar política para permitir leitura pública das configurações
CREATE POLICY "Permitir leitura pública das configurações do site"
ON site_config FOR SELECT
TO public
USING (true);

-- Manter a política existente para admins editarem
-- (Esta deve já existir, mas criamos como backup)
CREATE POLICY "Permitir admins gerenciar configurações"
ON site_config 
FOR ALL 
TO authenticated 
USING (auth.jwt() ->> 'role' = 'admin'::text);

-- Verificar as políticas criadas
SELECT schemaname, tablename, policyname, roles, cmd, qual
FROM pg_policies 
WHERE tablename = 'site_config';
