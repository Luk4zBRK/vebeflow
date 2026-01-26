-- Create portfolio_items table
CREATE TABLE public.portfolio_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('site', 'automation')),
    technologies TEXT[] DEFAULT '{}',
    url TEXT,
    image_url TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'draft')),
    featured BOOLEAN DEFAULT false,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.portfolio_items ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies
-- Anyone can view active portfolio items
CREATE POLICY "Anyone can view active portfolio items" ON public.portfolio_items
    FOR SELECT USING (status = 'active');

-- Admins can view all portfolio items
CREATE POLICY "Admins can view all portfolio items" ON public.portfolio_items
    FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- Admins can insert portfolio items
CREATE POLICY "Admins can insert portfolio items" ON public.portfolio_items
    FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Admins can update portfolio items
CREATE POLICY "Admins can update portfolio items" ON public.portfolio_items
    FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

-- Admins can delete portfolio items
CREATE POLICY "Admins can delete portfolio items" ON public.portfolio_items
    FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- Create trigger to automatically update updated_at timestamp
CREATE TRIGGER update_portfolio_items_updated_at
    BEFORE UPDATE ON public.portfolio_items
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample data
INSERT INTO public.portfolio_items (title, description, type, technologies, url, image_url, status, featured, order_index) VALUES
(
    'E-commerce Moderno',
    'Plataforma de e-commerce completa com sistema de pagamentos integrado, gestão de estoque e painel administrativo. Desenvolvida com as mais modernas tecnologias para garantir performance e escalabilidade.',
    'site',
    ARRAY['React', 'Node.js', 'PostgreSQL', 'Stripe', 'Tailwind CSS'],
    'https://exemplo-ecommerce.com',
    'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&h=600&fit=crop',
    'active',
    true,
    1
),
(
    'Sistema de Gestão Empresarial',
    'ERP completo para pequenas e médias empresas, incluindo módulos de vendas, estoque, financeiro e recursos humanos. Interface intuitiva e relatórios avançados.',
    'site',
    ARRAY['Vue.js', 'Laravel', 'MySQL', 'Docker', 'Bootstrap'],
    'https://exemplo-erp.com',
    'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=600&fit=crop',
    'active',
    true,
    2
),
(
    'Automação de Marketing Digital',
    'Bot inteligente que automatiza campanhas de marketing, gerencia leads, envia e-mails personalizados e gera relatórios de performance. Integração com principais plataformas de marketing.',
    'automation',
    ARRAY['Python', 'Selenium', 'API Integration', 'Machine Learning', 'PostgreSQL'],
    null,
    'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&h=600&fit=crop',
    'active',
    false,
    3
),
(
    'Automação de Processos Financeiros',
    'Sistema que automatiza conciliação bancária, geração de relatórios financeiros, controle de fluxo de caixa e integração com sistemas contábeis. Reduz tempo de processamento em 80%.',
    'automation',
    ARRAY['Python', 'Pandas', 'API Banking', 'Excel Automation', 'SQLite'],
    null,
    'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&h=600&fit=crop',
    'active',
    false,
    4
);
