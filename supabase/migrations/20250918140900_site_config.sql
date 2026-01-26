-- Criar tabela para configurações do site
CREATE TABLE public.site_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.site_config ENABLE ROW LEVEL SECURITY;

-- Apenas admins podem visualizar e editar configurações
CREATE POLICY "Admins can manage site config" 
ON public.site_config 
FOR ALL
TO authenticated 
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Trigger para atualizar timestamp
CREATE TRIGGER update_site_config_updated_at
  BEFORE UPDATE ON public.site_config
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Inserir configurações padrão
INSERT INTO public.site_config (key, value, description) VALUES 
('company_info', '{
  "name": "Vibe Flow",
  "tagline": "Tecnologia que acompanha o seu ritmo",
  "email": "contato@vibeflow.co",
  "phone": "(11) 99999‑0000"
}', 'Informações básicas da empresa'),

('social_media', '{
  "linkedin": "#",
  "github": "#",
  "instagram": "#"
}', 'Links das redes sociais'),

('footer_content', '{
  "title": "Soluções digitais sob medida para cada estágio do seu negócio.",
  "copyright": "© 2025 Vibe Flow — Todos os direitos reservados"
}', 'Conteúdo do footer');
