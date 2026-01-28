-- Criar tabela de Sites Recomendados
CREATE TABLE IF NOT EXISTS public.recommended_sites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  url TEXT NOT NULL,
  image_url TEXT,
  favicon_url TEXT,
  author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  author_name TEXT,
  category TEXT, -- 'development', 'design', 'ai', 'learning', 'tools', etc.
  tags TEXT[] DEFAULT '{}',
  is_published BOOLEAN DEFAULT false,
  views_count INTEGER DEFAULT 0,
  clicks_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_recommended_sites_slug ON public.recommended_sites(slug);
CREATE INDEX IF NOT EXISTS idx_recommended_sites_published ON public.recommended_sites(is_published);
CREATE INDEX IF NOT EXISTS idx_recommended_sites_category ON public.recommended_sites(category);
CREATE INDEX IF NOT EXISTS idx_recommended_sites_created_at ON public.recommended_sites(created_at DESC);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_recommended_sites_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_recommended_sites_updated_at
  BEFORE UPDATE ON public.recommended_sites
  FOR EACH ROW
  EXECUTE FUNCTION update_recommended_sites_updated_at();

-- Função para incrementar views
CREATE OR REPLACE FUNCTION increment_site_views(site_slug TEXT)
RETURNS void AS $$
BEGIN
  UPDATE public.recommended_sites
  SET views_count = views_count + 1
  WHERE slug = site_slug AND is_published = true;
END;
$$ LANGUAGE plpgsql;

-- Função para incrementar clicks
CREATE OR REPLACE FUNCTION increment_site_clicks(site_slug TEXT)
RETURNS void AS $$
BEGIN
  UPDATE public.recommended_sites
  SET clicks_count = clicks_count + 1
  WHERE slug = site_slug AND is_published = true;
END;
$$ LANGUAGE plpgsql;

-- RLS Policies
ALTER TABLE public.recommended_sites ENABLE ROW LEVEL SECURITY;

-- Política: Qualquer pessoa pode ler sites publicados
CREATE POLICY "Sites recomendados publicados são visíveis para todos"
  ON public.recommended_sites
  FOR SELECT
  USING (is_published = true);

-- Política: Usuários autenticados podem ver seus próprios sites (publicados ou não)
CREATE POLICY "Usuários podem ver seus próprios sites recomendados"
  ON public.recommended_sites
  FOR SELECT
  USING (auth.uid() = author_id);

-- Política: Usuários autenticados podem criar sites
CREATE POLICY "Usuários autenticados podem criar sites recomendados"
  ON public.recommended_sites
  FOR INSERT
  WITH CHECK (auth.uid() = author_id);

-- Política: Usuários podem atualizar seus próprios sites
CREATE POLICY "Usuários podem atualizar seus próprios sites recomendados"
  ON public.recommended_sites
  FOR UPDATE
  USING (auth.uid() = author_id)
  WITH CHECK (auth.uid() = author_id);

-- Política: Usuários podem deletar seus próprios sites
CREATE POLICY "Usuários podem deletar seus próprios sites recomendados"
  ON public.recommended_sites
  FOR DELETE
  USING (auth.uid() = author_id);

-- Inserir sites recomendados da lista fornecida
INSERT INTO public.recommended_sites (
  title,
  slug,
  description,
  url,
  category,
  tags,
  is_published,
  author_name
) VALUES
(
  'LMArena - Benchmark & Compare AI Models',
  'lmarena',
  'Plataforma para comparar e fazer benchmark dos melhores modelos de IA do mercado.',
  'https://lmarena.ai',
  'ai',
  ARRAY['ai', 'benchmark', 'comparison', 'llm'],
  true,
  'Vibe Flow'
),
(
  'HTML Mailto - Guia Rápido',
  'html-mailto',
  'Guia completo e rápido sobre como usar mailto em HTML para criar links de email.',
  'https://devmedia.com.br/html-mailto',
  'development',
  ARRAY['html', 'email', 'mailto', 'tutorial'],
  true,
  'Vibe Flow'
),
(
  'Sails.js - Framework MVC para Node.js',
  'sailsjs',
  'Framework MVC em tempo real para Node.js, ideal para construir aplicações escaláveis.',
  'https://sailsjs.com',
  'development',
  ARRAY['nodejs', 'mvc', 'framework', 'backend'],
  true,
  'Vibe Flow'
),
(
  'Dev Samurai - Cursos e Tutoriais',
  'devsamurai',
  'Plataforma brasileira com cursos e tutoriais de desenvolvimento web e mobile.',
  'https://class.devsamurai.com.br',
  'learning',
  ARRAY['cursos', 'tutoriais', 'desenvolvimento', 'brasil'],
  true,
  'Vibe Flow'
),
(
  'React Bits - Animated UI Components',
  'react-bits',
  'Coleção de componentes de UI animados para React, prontos para usar.',
  'https://reactbits.dev',
  'development',
  ARRAY['react', 'components', 'ui', 'animation'],
  true,
  'Vibe Flow'
),
(
  'Apify Console',
  'apify-console',
  'Plataforma de web scraping e automação de dados com APIs poderosas.',
  'https://console.apify.com',
  'tools',
  ARRAY['scraping', 'automation', 'api', 'data'],
  true,
  'Vibe Flow'
),
(
  'Generative Session - Runway',
  'runway-generative',
  'Ferramentas de IA generativa para criação de vídeos e conteúdo visual.',
  'https://runwayml.com',
  'ai',
  ARRAY['ai', 'generative', 'video', 'creative'],
  true,
  'Vibe Flow'
),
(
  'Brevo (ex-Sendinblue)',
  'brevo',
  'Plataforma completa de marketing digital: email, SMS, CRM e automação.',
  'https://www.brevo.com',
  'tools',
  ARRAY['email', 'marketing', 'automation', 'crm'],
  true,
  'Vibe Flow'
),
(
  'VS Code Extension - Code with AI',
  'vscode-ai-extension',
  'Extensão do VS Code para programar com IA e editar com precisão.',
  'https://marketplace.visualstudio.com/vscode',
  'development',
  ARRAY['vscode', 'ai', 'extension', 'coding'],
  true,
  'Vibe Flow'
),
(
  'Aceternity UI - Components',
  'aceternity-ui',
  'Biblioteca moderna de componentes UI com designs elegantes e animações.',
  'https://ui.aceternity.com',
  'design',
  ARRAY['ui', 'components', 'design', 'library'],
  true,
  'Vibe Flow'
),
(
  'Prompt Vibe Coding v2.0',
  'prompt-vibe-coding',
  'Plataforma de cursos online focada em prompts e coding com IA.',
  'https://promptvibecoding.com',
  'learning',
  ARRAY['prompts', 'ai', 'cursos', 'coding'],
  true,
  'Vibe Flow'
),
(
  'Google Cloud APIs Console',
  'google-cloud-apis',
  'Console do Google Cloud para gerenciar APIs e serviços.',
  'https://console.cloud.google.com',
  'tools',
  ARRAY['google', 'cloud', 'api', 'console'],
  true,
  'Vibe Flow'
),
(
  'Lovart - Design Agent',
  'lovart',
  'O primeiro agente de design do mundo com IA para criar interfaces.',
  'https://lovart.io',
  'ai',
  ARRAY['design', 'ai', 'agent', 'ui'],
  true,
  'Vibe Flow'
),
(
  'Adobe Speech Enhancer',
  'adobe-speech-enhancer',
  'Filtro de IA gratuito da Adobe para limpar e melhorar áudio de fala.',
  'https://podcast.adobe.com/enhance',
  'tools',
  ARRAY['audio', 'ai', 'enhancement', 'adobe'],
  true,
  'Vibe Flow'
),
(
  'Mocha - Testing Framework',
  'mocha',
  'Framework de testes JavaScript flexível e rico em recursos.',
  'https://mochajs.org',
  'development',
  ARRAY['testing', 'javascript', 'framework', 'mocha'],
  true,
  'Vibe Flow'
),
(
  'Artisanal Sweets Ordering UI',
  'artisanal-sweets-ui',
  'Editor de UI para criar interfaces de pedidos personalizadas (Aura Editor).',
  'https://auraeditor.com',
  'design',
  ARRAY['ui', 'editor', 'design', 'ordering'],
  true,
  'Vibe Flow'
),
(
  'Google Gemini',
  'google-gemini',
  'Modelo de IA multimodal do Google para texto, imagem e código.',
  'https://gemini.google.com',
  'ai',
  ARRAY['ai', 'google', 'gemini', 'multimodal'],
  true,
  'Vibe Flow'
),
(
  'ReUI - React UI Library',
  'reui',
  'Biblioteca de componentes React moderna e acessível.',
  'https://reui.dev',
  'development',
  ARRAY['react', 'ui', 'components', 'library'],
  true,
  'Vibe Flow'
),
(
  'Lordicon - 37,200+ Animated Icons',
  'lordicon',
  'Biblioteca massiva de ícones animados para web e apps.',
  'https://lordicon.com',
  'design',
  ARRAY['icons', 'animation', 'design', 'assets'],
  true,
  'Vibe Flow'
),
(
  'DesignCourse - YouTube',
  'designcourse-youtube',
  'Canal do YouTube com 818 vídeos sobre design, UI/UX e desenvolvimento.',
  'https://www.youtube.com/@DesignCourse',
  'learning',
  ARRAY['youtube', 'design', 'tutorial', 'ui-ux'],
  true,
  'Vibe Flow'
),
(
  'Altura - Cursos de Tecnologia',
  'altura-cursos',
  'Plataforma de imersões e cursos online de tecnologia.',
  'https://altura.com.br',
  'learning',
  ARRAY['cursos', 'tecnologia', 'brasil', 'online'],
  true,
  'Vibe Flow'
),
(
  'PSIE - Consulta de Instrumentos',
  'psie-instrumentos',
  'Plataforma para consulta de instrumentos e ferramentas técnicas.',
  'https://psie.com.br',
  'tools',
  ARRAY['instrumentos', 'consulta', 'ferramentas'],
  true,
  'Vibe Flow'
),
(
  'Coss.co - Navbar Components',
  'coss-navbar',
  'Componentes de navbar construídos com React e Tailwind CSS.',
  'https://coss.co',
  'development',
  ARRAY['react', 'tailwind', 'navbar', 'components'],
  true,
  'Vibe Flow'
),
(
  'Lightswind UI - 100+ Animated Components',
  'lightswind-ui',
  'Mais de 100 componentes React animados para interfaces modernas.',
  'https://lightswind.com',
  'development',
  ARRAY['react', 'animation', 'components', 'ui'],
  true,
  'Vibe Flow'
),
(
  'HTTP Cats',
  'http-cats',
  'Códigos de status HTTP explicados com fotos de gatos (divertido e educativo).',
  'https://http.cat',
  'learning',
  ARRAY['http', 'status-codes', 'fun', 'learning'],
  true,
  'Vibe Flow'
);
