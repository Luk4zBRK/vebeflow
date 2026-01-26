import { useEffect, useState, useCallback } from 'react';

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
  { id: 'antgravit', nome: 'Antgravit', url: 'https://antgravit.com/changelog', logo: '🚀', cor: '#6d28d9' }, // ajuste se a URL correta for diferente
];

const proxificar = (url: string) => {
  const limpa = url.startsWith('http') ? url : `https://${url}`;
  return `https://r.jina.ai/${limpa}`;
};

const limparTexto = (valor?: string | null) => valor?.replace(/\s+/g, ' ').trim() || null;

const obterResumoAdjacente = (elemento: Element | null) => {
  if (!elemento?.parentElement) return null;

  let ponteiro: Element | null = elemento.nextElementSibling;

  while (ponteiro) {
    const texto = limparTexto(ponteiro.textContent);
    if (texto) return texto;
    ponteiro = ponteiro.nextElementSibling;
  }

  return null;
};

const extrairItensMarkdown = (conteudo: string, fonte: Fonte): NewsItem[] => {
  // Foca apenas na parte após "Markdown Content:" quando existir
  const trecho = conteudo.includes('Markdown Content:')
    ? conteudo.split('Markdown Content:').pop() || conteudo
    : conteudo;

  const linhas = trecho.split('\n').map(l => l.trim());
  const itens: NewsItem[] = [];

  const ehVersao = (linha: string) => /^\d+\.\d+(\.\d+)?$/.test(linha);
  const ehHeadingHash = (linha: string) => /^#+\s+/.test(linha);
  const ehUnderline = (linha: string) => /^[-=]{3,}$/.test(linha);
  const limparLink = (linha: string | null | undefined) =>
    (linha || '').replace(/\[(.*?)\]\((.*?)\)/g, '$1').trim();
  const jaInserido = (titulo?: string | null) =>
    titulo && itens.some(i => i.titulo === titulo);

  for (let i = 0; i < linhas.length; i++) {
    const atual = linhas[i];
    if (!atual) continue;

    // Formato "# Título"
    if (ehHeadingHash(atual)) {
      const titulo = limparTexto(limparLink(atual.replace(/^#+\s*/, ''))) || 'Atualização do produto';
      // resumo = próxima linha não vazia que não seja heading
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

  // Fallback: se nada extraído, devolve um item padrão para não quebrar UI
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

  return itens.slice(0, 2);
};

export const useChangelogNews = () => {
  const [noticias, setNoticias] = useState<NewsItem[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [atualizadoEm, setAtualizadoEm] = useState<Date | null>(null);

  const buscarNoticias = useCallback(async () => {
    setCarregando(true);
    setErro(null);

    try {
      const resultados = await Promise.all(FONTES.map(async (fonte) => {
        try {
          const respostaProxy = await fetch(proxificar(fonte.url), { mode: 'cors' });
          if (!respostaProxy.ok) throw new Error(`Status ${respostaProxy.status}`);

          const texto = await respostaProxy.text();
          const itens = extrairItensMarkdown(texto, fonte);

          return itens;
        } catch {
          // Silencia erros de fontes externas - fallback será usado
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

      const achatado = resultados.flat().slice(0, 6); // limite global para não poluir a UI

      setNoticias(achatado);
      setAtualizadoEm(new Date());
      setErro(null);
    } catch (erro: any) {
      setErro('Não conseguimos carregar as novidades agora. Tente novamente mais tarde.');
      console.error('Falha geral ao buscar changelogs:', erro);
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    buscarNoticias();
  }, [buscarNoticias]);

  return { noticias, carregando, erro, atualizadoEm, atualizar: buscarNoticias };
};
