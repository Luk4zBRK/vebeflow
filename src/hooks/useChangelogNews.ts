import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface NewsItem {
  titulo: string;
  resumo?: string | null;
  link: string;
  fonte: string;
  cor?: string;
  logo?: string;
}

export const useChangelogNews = () => {
  const [noticias, setNoticias] = useState<NewsItem[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [atualizadoEm, setAtualizadoEm] = useState<Date | null>(null);

  const buscarNoticias = useCallback(async () => {
    setCarregando(true);
    setErro(null);

    try {
      // Buscar novidades do banco de dados
      const { data, error } = await (supabase as any)
        .from('ide_news')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(18); // Limitar a 18 itens (2 por fonte, 9 fontes)

      if (error) throw error;

      if (!data || data.length === 0) {
        setErro('Nenhuma novidade disponível no momento. Aguarde a próxima sincronização.');
        setNoticias([]);
        return;
      }

      // Mapear dados do BD para o formato esperado
      const noticiasFormatadas: NewsItem[] = data.map((item: any) => ({
        titulo: item.titulo,
        resumo: item.resumo,
        link: item.link,
        fonte: item.fonte,
        cor: item.cor,
        logo: item.logo,
      }));

      setNoticias(noticiasFormatadas);
      
      // Pegar a data de criação do item mais recente como "atualizado em"
      if (data[0]?.created_at) {
        setAtualizadoEm(new Date(data[0].created_at));
      } else {
        setAtualizadoEm(new Date());
      }
      
      setErro(null);
    } catch (erro: any) {
      setErro('Não conseguimos carregar as novidades agora. Tente novamente mais tarde.');
      console.error('Falha ao buscar novidades do banco:', erro);
    } finally {
      setCarregando(false);
    }
  }, []);

  // Função para atualizar (força sincronização das fontes)
  const atualizar = useCallback(async () => {
    setCarregando(true);
    setErro(null);

    try {
      // Chamar Edge Function para buscar dados frescos das fontes
      const { data, error } = await (supabase as any).functions.invoke('sync-ide-news', {
        body: {},
      });

      if (error) throw error;

      // Após sincronizar, buscar novamente do BD
      await buscarNoticias();
    } catch (erro: any) {
      setErro('Erro ao atualizar novidades. Tente novamente mais tarde.');
      console.error('Falha ao atualizar novidades:', erro);
      setCarregando(false);
    }
  }, [buscarNoticias]);

  useEffect(() => {
    buscarNoticias();
  }, [buscarNoticias]);

  return { 
    noticias, 
    carregando, 
    erro, 
    atualizadoEm, 
    atualizar,
  };
};
