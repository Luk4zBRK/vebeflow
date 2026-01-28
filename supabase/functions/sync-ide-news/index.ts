// Edge Function: sync-ide-news
// Busca novidades das IDEs e salva no banco de dados
// Executada diariamente às 00:00 UTC via pg_cron

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NewsItem {
  titulo: string;
  resumo?: string | null;
  link: string;
  fonte: string;
  cor?: string;
  logo?: string;
}

interface Fonte {
  id: string;
  nome: string;
  url: string;
  logo?: string;
  cor?: string;
}

const FONTES: Fonte[] = [
  { id: 'windsurf', nome: 'Windsurf', url: 'https://windsurf.com/changelog', logo: '🌀', cor: '#2563eb' },
  { id: 'cursor', nome: 'Cursor', url: 'https://www.cursor.com/changelog', logo: '🖥️', cor: '#111827' },
  { id: 'replit', nome: 'Replit', url: 'https://blog.replit.com', logo: '⚡', cor: '#f97316' },
  { id: 'bolt', nome: 'Bolt', url: 'https://bolt.new/changelog', logo: '🚧', cor: '#0ea5e9' },
  { id: 'bind', nome: 'Bind AI', url: 'https://bind.ai/changelog', logo: '🔗', cor: '#6d28d9' },
  { id: 'firebase', nome: 'Firebase Studio', url: 'https://firebase.google.com/updates', logo: '🔥', cor: '#f59e0b' },
  { id: 'vscode', nome: 'VS Code', url: 'https://code.visualstudio.com/updates', logo: '🧩', cor: '#2563eb' },
  { id: 'jetbrains', nome: 'JetBrains', url: 'https://blog.jetbrains.com', logo: '💡', cor: '#e11d48' },
  { id: 'antgravit', nome: 'Antgravit', url: 'https://antgravit.com/changelog', logo: '🚀', cor: '#6d28d9' },
];

const proxificar = (url: string): string => {
  const limpa = url.startsWith('http') ? url : `https://${url}`;
  return `https://r.jina.ai/${limpa}`;
};

const limparTexto = (valor?: string | null): string | null => 
  valor?.replace(/\s+/g, ' ').trim() || null;

const limparLink = (linha: string | null | undefined): string =>
  (linha || '').replace(/\[(.*?)\]\((.*?)\)/g, '$1').trim();

const extrairItensMarkdown = (conteudo: string, fonte: Fonte): NewsItem[] => {
  const trecho = conteudo.includes('Markdown Content:')
    ? conteudo.split('Markdown Content:').pop() || conteudo
    : conteudo;

  const linhas = trecho.split('\n').map(l => l.trim());
  const itens: NewsItem[] = [];

  const ehVersao = (linha: string) => /^\d+\.\d+(\.\d+)?$/.test(linha);
  const ehHeadingHash = (linha: string) => /^#+\s+/.test(linha);
  const ehUnderline = (linha: string) => /^[-=]{3,}$/.test(linha);
  const jaInserido = (titulo?: string | null) =>
    titulo && itens.some(i => i.titulo === titulo);

  for (let i = 0; i < linhas.length; i++) {
    const atual = linhas[i];
    if (!atual) continue;

    // Formato "# Título"
    if (ehHeadingHash(atual)) {
      const titulo = limparTexto(limparLink(atual.replace(/^#+\s*/, ''))) || 'Atualização do produto';
      let resumo: string | null = null;
      for (let j = i + 1; j < linhas.length; j++) {
        const prox = linhas[j];
        if (!prox) continue;
        if (ehHeadingHash(prox)) break;
        resumo = limparTexto(limparLink(prox.replace(/^[-*]\s*/, '')));
        break;
      }
      if (!jaInserido(titulo)) {
        itens.push({ 
          titulo, 
          resumo, 
          link: fonte.url, 
          fonte: fonte.nome, 
          cor: fonte.cor, 
          logo: fonte.logo 
        });
      }
      continue;
    }

    // Formato "Título" + underline "----"
    const proxima = linhas[i + 1];
    if (proxima && ehUnderline(proxima) && !ehVersao(atual)) {
      const titulo = limparTexto(limparLink(atual)) || 'Atualização do produto';
      let resumo: string | null = null;
      for (let j = i + 2; j < linhas.length; j++) {
        const prox = linhas[j];
        if (!prox) continue;
        if (ehUnderline(prox) || ehHeadingHash(prox)) break;
        resumo = limparTexto(limparLink(prox.replace(/^[-*]\s*/, '')));
        break;
      }
      if (!jaInserido(titulo)) {
        itens.push({ 
          titulo, 
          resumo, 
          link: fonte.url, 
          fonte: fonte.nome, 
          cor: fonte.cor, 
          logo: fonte.logo 
        });
      }
    }
  }

  // Fallback: se nada extraído, devolve um item padrão
  if (itens.length === 0) {
    return [{
      titulo: 'Ver changelog completo',
      resumo: 'Acesse o changelog para ver as últimas novidades.',
      link: fonte.url,
      fonte: fonte.nome,
      cor: fonte.cor,
      logo: fonte.logo,
    }];
  }

  return itens.slice(0, 2); // Limitar a 2 itens por fonte
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    // Criar cliente Supabase com service_role para bypass RLS
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Criar log de sincronização
    const { data: logData, error: logError } = await supabase
      .from('ide_news_sync_log')
      .insert({
        status: 'running',
        sync_started_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (logError) {
      console.error('Erro ao criar log:', logError);
    }

    const logId = logData?.id;

    // Buscar novidades de todas as fontes
    const resultados = await Promise.all(FONTES.map(async (fonte) => {
      try {
        const respostaProxy = await fetch(proxificar(fonte.url), {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; VibeFlow/1.0)',
          },
        });

        if (!respostaProxy.ok) {
          console.warn(`Falha ao buscar ${fonte.nome}: Status ${respostaProxy.status}`);
          return [{
            titulo: `Ver changelog do ${fonte.nome}`,
            resumo: 'Acesse o changelog para ver as últimas novidades.',
            link: fonte.url,
            fonte: fonte.nome,
            cor: fonte.cor,
            logo: fonte.logo,
          }];
        }

        const texto = await respostaProxy.text();
        const itens = extrairItensMarkdown(texto, fonte);
        return itens;
      } catch (error) {
        console.error(`Erro ao processar ${fonte.nome}:`, error);
        return [{
          titulo: `Ver changelog do ${fonte.nome}`,
          resumo: 'Acesse o changelog para ver as últimas novidades.',
          link: fonte.url,
          fonte: fonte.nome,
          cor: fonte.cor,
          logo: fonte.logo,
        }];
      }
    }));

    const todasNovidades = resultados.flat();

    // Limpar novidades antigas
    const { error: deleteError } = await supabase
      .from('ide_news')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Deleta tudo

    if (deleteError) {
      console.error('Erro ao limpar novidades antigas:', deleteError);
    }

    // Inserir novas novidades
    const { error: insertError } = await supabase
      .from('ide_news')
      .insert(todasNovidades);

    if (insertError) {
      console.error('Erro ao inserir novidades:', insertError);
      
      // Atualizar log com erro
      if (logId) {
        await supabase
          .from('ide_news_sync_log')
          .update({
            status: 'error',
            sync_completed_at: new Date().toISOString(),
            error_message: insertError.message,
            items_fetched: todasNovidades.length,
          })
          .eq('id', logId);
      }

      return new Response(
        JSON.stringify({ 
          success: false, 
          error: insertError.message,
          items_fetched: todasNovidades.length,
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Limpar novidades antigas (manter apenas últimas 100)
    await supabase.rpc('cleanup_old_ide_news');

    // Limpar logs antigos
    await supabase.rpc('cleanup_old_sync_logs');

    // Atualizar log com sucesso
    if (logId) {
      await supabase
        .from('ide_news_sync_log')
        .update({
          status: 'success',
          sync_completed_at: new Date().toISOString(),
          items_fetched: todasNovidades.length,
        })
        .eq('id', logId);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        items_synced: todasNovidades.length,
        timestamp: new Date().toISOString(),
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Erro geral na sincronização:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
