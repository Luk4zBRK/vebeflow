import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NewsItem {
  ide_name: string;
  title: string;
  description: string;
  url: string;
  published_at: string;
  version?: string;
}

// Função para buscar novidades do VS Code
async function fetchVSCodeNews(): Promise<NewsItem[]> {
  try {
    const response = await fetch('https://code.visualstudio.com/feed.xml');
    const xml = await response.text();
    
    // Parse XML simples (pega os primeiros 3 itens)
    const items: NewsItem[] = [];
    const itemMatches = xml.matchAll(/<item>([\s\S]*?)<\/item>/g);
    
    let count = 0;
    for (const match of itemMatches) {
      if (count >= 3) break;
      
      const itemXml = match[1];
      const title = itemXml.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/)?.[1] || 
                   itemXml.match(/<title>(.*?)<\/title>/)?.[1] || '';
      const link = itemXml.match(/<link>(.*?)<\/link>/)?.[1] || '';
      const description = itemXml.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/)?.[1] ||
                         itemXml.match(/<description>(.*?)<\/description>/)?.[1] || '';
      const pubDate = itemXml.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] || new Date().toISOString();
      
      if (title && link) {
        items.push({
          ide_name: 'VS Code',
          title: title.trim(),
          description: description.trim().substring(0, 500),
          url: link.trim(),
          published_at: new Date(pubDate).toISOString(),
        });
        count++;
      }
    }
    
    return items;
  } catch (error) {
    console.error('Erro ao buscar VS Code news:', error);
    return [];
  }
}

// Função para buscar novidades do Cursor
async function fetchCursorNews(): Promise<NewsItem[]> {
  try {
    // Cursor changelog via GitHub releases
    const response = await fetch('https://api.github.com/repos/getcursor/cursor/releases?per_page=3');
    const releases = await response.json();
    
    return releases.map((release: any) => ({
      ide_name: 'Cursor',
      title: release.name || release.tag_name,
      description: (release.body || 'Nova versão disponível').substring(0, 500),
      url: release.html_url,
      published_at: release.published_at,
      version: release.tag_name,
    }));
  } catch (error) {
    console.error('Erro ao buscar Cursor news:', error);
    return [];
  }
}

// Função para buscar novidades do Windsurf
async function fetchWindsurfNews(): Promise<NewsItem[]> {
  try {
    // Windsurf changelog via Codeium blog
    const response = await fetch('https://codeium.com/blog/feed.xml');
    const xml = await response.text();
    
    const items: NewsItem[] = [];
    const itemMatches = xml.matchAll(/<item>([\s\S]*?)<\/item>/g);
    
    let count = 0;
    for (const match of itemMatches) {
      if (count >= 2) break;
      
      const itemXml = match[1];
      const title = itemXml.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/)?.[1] || 
                   itemXml.match(/<title>(.*?)<\/title>/)?.[1] || '';
      const link = itemXml.match(/<link>(.*?)<\/link>/)?.[1] || '';
      const description = itemXml.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/)?.[1] ||
                         itemXml.match(/<description>(.*?)<\/description>/)?.[1] || '';
      const pubDate = itemXml.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] || new Date().toISOString();
      
      // Filtrar apenas posts relacionados ao Windsurf
      if (title && link && (title.toLowerCase().includes('windsurf') || title.toLowerCase().includes('codeium'))) {
        items.push({
          ide_name: 'Windsurf',
          title: title.trim(),
          description: description.trim().substring(0, 500),
          url: link.trim(),
          published_at: new Date(pubDate).toISOString(),
        });
        count++;
      }
    }
    
    return items;
  } catch (error) {
    console.error('Erro ao buscar Windsurf news:', error);
    return [];
  }
}

// Função para buscar novidades do JetBrains
async function fetchJetBrainsNews(): Promise<NewsItem[]> {
  try {
    const response = await fetch('https://blog.jetbrains.com/feed/');
    const xml = await response.text();
    
    const items: NewsItem[] = [];
    const itemMatches = xml.matchAll(/<item>([\s\S]*?)<\/item>/g);
    
    let count = 0;
    for (const match of itemMatches) {
      if (count >= 2) break;
      
      const itemXml = match[1];
      const title = itemXml.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/)?.[1] || 
                   itemXml.match(/<title>(.*?)<\/title>/)?.[1] || '';
      const link = itemXml.match(/<link>(.*?)<\/link>/)?.[1] || '';
      const description = itemXml.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/)?.[1] ||
                         itemXml.match(/<description>(.*?)<\/description>/)?.[1] || '';
      const pubDate = itemXml.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] || new Date().toISOString();
      
      if (title && link) {
        items.push({
          ide_name: 'JetBrains',
          title: title.trim(),
          description: description.trim().substring(0, 500),
          url: link.trim(),
          published_at: new Date(pubDate).toISOString(),
        });
        count++;
      }
    }
    
    return items;
  } catch (error) {
    console.error('Erro ao buscar JetBrains news:', error);
    return [];
  }
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('🚀 Iniciando sincronização automática de IDE news...');

    // Buscar novidades de todas as IDEs em paralelo
    const [vsCodeNews, cursorNews, windsurfNews, jetbrainsNews] = await Promise.all([
      fetchVSCodeNews(),
      fetchCursorNews(),
      fetchWindsurfNews(),
      fetchJetBrainsNews(),
    ]);

    const allNews = [...vsCodeNews, ...cursorNews, ...windsurfNews, ...jetbrainsNews];
    console.log(`📰 Total de ${allNews.length} novidades encontradas`);

    let insertedCount = 0;
    let skippedCount = 0;

    // Inserir cada notícia, verificando duplicatas
    for (const news of allNews) {
      try {
        // Verificar se já existe (por URL ou título + IDE)
        const { data: existing } = await supabase
          .from('ide_news')
          .select('id')
          .or(`url.eq.${news.url},and(title.eq.${news.title},ide_name.eq.${news.ide_name})`)
          .limit(1)
          .single();

        if (existing) {
          console.log(`⏭️  Pulando duplicata: ${news.title}`);
          skippedCount++;
          continue;
        }

        // Inserir nova notícia
        const { error: insertError } = await supabase
          .from('ide_news')
          .insert({
            ide_name: news.ide_name,
            title: news.title,
            description: news.description,
            url: news.url,
            published_at: news.published_at,
            version: news.version,
          });

        if (insertError) {
          console.error(`❌ Erro ao inserir ${news.title}:`, insertError);
        } else {
          console.log(`✅ Inserido: ${news.title}`);
          insertedCount++;
        }
      } catch (error) {
        console.error(`❌ Erro ao processar ${news.title}:`, error);
      }
    }

    // Registrar log de sincronização
    await supabase.from('ide_news_sync_log').insert({
      status: 'success',
      items_synced: insertedCount,
      error_message: null,
    });

    console.log(`✨ Sincronização concluída: ${insertedCount} inseridos, ${skippedCount} pulados`);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Sincronização automática concluída',
        inserted: insertedCount,
        skipped: skippedCount,
        total: allNews.length,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error('❌ Erro na sincronização:', error);

    // Registrar erro no log
    try {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      await supabase.from('ide_news_sync_log').insert({
        status: 'error',
        items_synced: 0,
        error_message: error.message,
      });
    } catch (logError) {
      console.error('Erro ao registrar log:', logError);
    }

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
