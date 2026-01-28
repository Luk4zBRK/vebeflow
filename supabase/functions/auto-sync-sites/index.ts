import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SiteItem {
  name: string;
  slug: string;
  description: string;
  url: string;
  category: string;
  tags: string[];
  is_free: boolean;
}

// Sites úteis para desenvolvedores
const sitesDatabase: SiteItem[] = [
  {
    name: 'Can I Use',
    slug: 'can-i-use',
    description: 'Verifique compatibilidade de features HTML, CSS e JavaScript entre navegadores',
    url: 'https://caniuse.com',
    category: 'development',
    tags: ['compatibility', 'browser', 'css', 'javascript'],
    is_free: true,
  },
  {
    name: 'MDN Web Docs',
    slug: 'mdn-web-docs',
    description: 'Documentação completa e confiável sobre tecnologias web (HTML, CSS, JavaScript)',
    url: 'https://developer.mozilla.org',
    category: 'learning',
    tags: ['documentation', 'reference', 'web', 'javascript'],
    is_free: true,
  },
  {
    name: 'DevDocs',
    slug: 'devdocs',
    description: 'Documentação de múltiplas linguagens e frameworks em um só lugar, com busca rápida',
    url: 'https://devdocs.io',
    category: 'development',
    tags: ['documentation', 'reference', 'api'],
    is_free: true,
  },
  {
    name: 'Regex101',
    slug: 'regex101',
    description: 'Testador de expressões regulares com explicações detalhadas e exemplos',
    url: 'https://regex101.com',
    category: 'tools',
    tags: ['regex', 'testing', 'validation'],
    is_free: true,
  },
  {
    name: 'JSON Formatter',
    slug: 'json-formatter',
    description: 'Formatar, validar e visualizar JSON de forma clara e organizada',
    url: 'https://jsonformatter.org',
    category: 'tools',
    tags: ['json', 'formatter', 'validator'],
    is_free: true,
  },
  {
    name: 'Excalidraw',
    slug: 'excalidraw',
    description: 'Ferramenta de desenho colaborativa para criar diagramas e wireframes',
    url: 'https://excalidraw.com',
    category: 'design',
    tags: ['diagram', 'wireframe', 'collaboration'],
    is_free: true,
  },
  {
    name: 'Ray.so',
    slug: 'ray-so',
    description: 'Crie imagens bonitas de código para compartilhar em redes sociais',
    url: 'https://ray.so',
    category: 'tools',
    tags: ['code', 'screenshot', 'sharing'],
    is_free: true,
  },
  {
    name: 'Hoppscotch',
    slug: 'hoppscotch',
    description: 'Cliente API open-source, alternativa ao Postman, rápido e leve',
    url: 'https://hoppscotch.io',
    category: 'tools',
    tags: ['api', 'testing', 'http', 'rest'],
    is_free: true,
  },
  {
    name: 'Bundlephobia',
    slug: 'bundlephobia',
    description: 'Descubra o tamanho de pacotes npm antes de instalá-los',
    url: 'https://bundlephobia.com',
    category: 'development',
    tags: ['npm', 'bundle', 'performance'],
    is_free: true,
  },
  {
    name: 'Transform Tools',
    slug: 'transform-tools',
    description: 'Converta entre JSON, YAML, XML, CSV e outros formatos instantaneamente',
    url: 'https://transform.tools',
    category: 'tools',
    tags: ['converter', 'json', 'yaml', 'xml'],
    is_free: true,
  },
  {
    name: 'Responsively',
    slug: 'responsively',
    description: 'Teste seu site em múltiplos dispositivos simultaneamente',
    url: 'https://responsively.app',
    category: 'tools',
    tags: ['responsive', 'testing', 'mobile'],
    is_free: true,
  },
  {
    name: 'Coolors',
    slug: 'coolors',
    description: 'Gerador de paletas de cores para designers e desenvolvedores',
    url: 'https://coolors.co',
    category: 'design',
    tags: ['colors', 'palette', 'design'],
    is_free: true,
  },
  {
    name: 'Roadmap.sh',
    slug: 'roadmap-sh',
    description: 'Roadmaps interativos para diferentes carreiras em tecnologia',
    url: 'https://roadmap.sh',
    category: 'learning',
    tags: ['career', 'learning', 'roadmap'],
    is_free: true,
  },
  {
    name: 'DevHints',
    slug: 'devhints',
    description: 'Cheatsheets para desenvolvedores sobre diversas tecnologias',
    url: 'https://devhints.io',
    category: 'learning',
    tags: ['cheatsheet', 'reference', 'quick-reference'],
    is_free: true,
  },
  {
    name: 'Shields.io',
    slug: 'shields-io',
    description: 'Crie badges personalizadas para seus repositórios GitHub',
    url: 'https://shields.io',
    category: 'tools',
    tags: ['badges', 'github', 'readme'],
    is_free: true,
  },
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('🚀 Iniciando sincronização de sites úteis...');

    let insertedCount = 0;
    let skippedCount = 0;

    for (const site of sitesDatabase) {
      try {
        // Verificar se já existe
        const { data: existing } = await supabase
          .from('recommended_sites')
          .select('id')
          .eq('slug', site.slug)
          .limit(1)
          .single();

        if (existing) {
          console.log(`⏭️  Pulando duplicata: ${site.name}`);
          skippedCount++;
          continue;
        }

        // Inserir novo site
        const { error: insertError } = await supabase
          .from('recommended_sites')
          .insert({
            name: site.name,
            slug: site.slug,
            description: site.description,
            url: site.url,
            category: site.category,
            tags: site.tags,
            is_free: site.is_free,
            is_published: true,
            views_count: 0,
          });

        if (insertError) {
          console.error(`❌ Erro ao inserir ${site.name}:`, insertError);
        } else {
          console.log(`✅ Inserido: ${site.name}`);
          insertedCount++;
        }
      } catch (error) {
        console.error(`❌ Erro ao processar ${site.name}:`, error);
      }
    }

    console.log(`✨ Sincronização concluída: ${insertedCount} inseridos, ${skippedCount} pulados`);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Sincronização de sites úteis concluída',
        inserted: insertedCount,
        skipped: skippedCount,
        total: sitesDatabase.length,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error('❌ Erro na sincronização:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
