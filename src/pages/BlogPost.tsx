import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  Calendar, 
  Clock, 
  Eye, 
  ArrowLeft, 
  Share2,
  Facebook,
  Twitter,
  Linkedin,
  Copy,
  User,
  MessageCircle,
  Trash2,
  Send,
  LogIn,
  Mail
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useComments } from '@/hooks/useComments';
import { useNewsletter } from '@/hooks/useNewsletter';
import { Input } from '@/components/ui/input';

interface BlogPostData {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  cover_image_url: string | null;
  author_name: string | null;
  category: string | null;
  tags: string[];
  views_count: number;
  published_at: string;
  created_at: string;
}

const BlogPost = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, isAdmin } = useAuth();
  const [post, setPost] = useState<BlogPostData | null>(null);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');

  const {
    comments,
    loading: loadingComments,
    submitting,
    hasMore,
    addComment,
    deleteComment,
    loadMore,
  } = useComments(post?.id, user?.id);

  const handleSubmitComment = async () => {
    if (!newComment.trim()) return;
    await addComment(newComment);
    setNewComment('');
  };

  const canDeleteComment = (commentUserId: string) => {
    return user?.id === commentUserId || isAdmin;
  };

  // Newsletter
  const { subscribe: subscribeNewsletter, loading: loadingNewsletter } = useNewsletter();
  const [newsletterEmail, setNewsletterEmail] = useState('');

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await subscribeNewsletter(newsletterEmail);
    if (result.success) {
      setNewsletterEmail('');
    }
  };

  const normalizeTags = (tags: any) => {
    if (Array.isArray(tags)) return tags.filter(Boolean);
    if (typeof tags === 'string') {
      return tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);
    }
    return [];
  };

  const formatContent = (content: string) => {
    const trimmed = (content || '').trim();
    if (!trimmed) return '';

    // Se já tem HTML estruturado, retorna como está
    const hasStructuredHtml = /<(div|p|h[1-6]|ul|ol|li|blockquote)[\s>]/i.test(trimmed);
    if (hasStructuredHtml) return trimmed;

    let formatted = trimmed;

    // Converter **texto** para <strong>texto</strong>
    formatted = formatted.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

    // Converter URLs em links clicáveis
    formatted = formatted.replace(
      /(https?:\/\/[^\s<>"'\]]+)/g,
      (match) => `<a href="${match}" target="_blank" rel="noreferrer" class="text-primary hover:underline">${match}</a>`
    );

    // Converter linhas que começam com - em itens de lista
    const lines = formatted.split('\n');
    let inList = false;
    const processedLines: string[] = [];

    lines.forEach((line, index) => {
      const isListItem = /^[-•]\s/.test(line.trim());
      const nextIsListItem = lines[index + 1] && /^[-•]\s/.test(lines[index + 1].trim());

      if (isListItem) {
        if (!inList) {
          processedLines.push('<ul class="list-disc pl-6 my-2 space-y-1">');
          inList = true;
        }
        processedLines.push(`<li>${line.trim().replace(/^[-•]\s/, '')}</li>`);
        if (!nextIsListItem) {
          processedLines.push('</ul>');
          inList = false;
        }
      } else if (line.trim() === '') {
        // Linha vazia = novo parágrafo
        processedLines.push('<br class="my-2" />');
      } else {
        processedLines.push(`<p class="mb-3">${line}</p>`);
      }
    });

    return processedLines.join('');
  };

  const extractFirstVideo = (content: string) => {
    const videoRegex = /<video[^>]*src=["']([^"']+)["'][^>]*>(?:<\/video>)?/i;
    const match = content?.match(videoRegex);
    const videoUrl = match?.[1] || null;
    const cleanedContent = videoUrl ? content.replace(videoRegex, '') : content;
    return { videoUrl, cleanedContent };
  };

  useEffect(() => {
    if (slug) {
      fetchPost();
    }
  }, [slug]);

  useEffect(() => {
    if (!post) return;

    const setMeta = (name: string, content: string) => {
      if (!content) return;
      let tag = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null;
      if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute('name', name);
        document.head.appendChild(tag);
      }
      tag.setAttribute('content', content);
    };

    const setOg = (property: string, content: string) => {
      if (!content) return;
      let tag = document.querySelector(`meta[property="${property}"]`) as HTMLMetaElement | null;
      if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute('property', property);
        document.head.appendChild(tag);
      }
      tag.setAttribute('content', content);
    };

    const canonicalUrl = window.location.href;
    const description = post.excerpt || post.content.slice(0, 150);
    const image = resolveCoverUrl(post.cover_image_url) || '';

    document.title = `${post.title} | Vibe Flow`;
    setMeta('description', description);
    setOg('og:title', post.title);
    setOg('og:description', description);
    setOg('og:type', 'article');
    setOg('og:url', canonicalUrl);
    if (image) setOg('og:image', image);
    setMeta('twitter:card', image ? 'summary_large_image' : 'summary');
    setMeta('twitter:title', post.title);
    setMeta('twitter:description', description);
    if (image) setMeta('twitter:image', image);

    let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement('link');
      link.setAttribute('rel', 'canonical');
      document.head.appendChild(link);
    }
    link.setAttribute('href', canonicalUrl);
  }, [post]);

  const fetchPost = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('blog_posts')
        .select('*')
        .eq('slug', slug)
        .eq('status', 'published')
        .single();

      if (error) throw error;
      
      if (data) {
        const updatedViews = (data.views_count || 0) + 1;
        setPost({ ...data, views_count: updatedViews, tags: normalizeTags(data.tags) });
        // Incrementar views
        await (supabase as any)
          .from('blog_posts')
          .update({ views_count: updatedViews })
          .eq('id', data.id);
      }
    } catch (error) {
      console.error('Erro ao carregar post:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  const estimateReadTime = (content: string) => {
    const wordsPerMinute = 200;
    const words = content.split(/\s+/).length;
    const minutes = Math.ceil(words / wordsPerMinute);
    return `${minutes} min de leitura`;
  };

  const resolveCoverUrl = (coverImage?: string | null) => {
    if (!coverImage) return null;
    if (coverImage.startsWith('http')) return coverImage;
    const { data } = supabase.storage.from('images').getPublicUrl(coverImage);
    return data?.publicUrl || null;
  };

  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';

  const handleShare = (platform: string) => {
    const title = post?.title || '';
    let url = '';

    switch (platform) {
      case 'facebook':
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
        break;
      case 'twitter':
        url = `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(title)}`;
        break;
      case 'linkedin':
        url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
        break;
      case 'copy':
        navigator.clipboard.writeText(shareUrl);
        toast({
          title: "Link copiado!",
          description: "O link do artigo foi copiado para a área de transferência.",
        });
        return;
    }

    if (url) {
      window.open(url, '_blank', 'width=600,height=400');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-24 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando artigo...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-24 text-center">
          <h1 className="text-3xl font-bold mb-4">Artigo não encontrado</h1>
          <p className="text-muted-foreground mb-8">
            O artigo que você está procurando não existe ou foi removido.
          </p>
          <Button onClick={() => navigate('/blog')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar ao Blog
          </Button>
        </div>
        <Footer />
      </div>
    );
  }

  const { videoUrl, cleanedContent } = extractFirstVideo(post.content || '');

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero/Capa */}
      <section className="pt-24">
        {resolveCoverUrl(post.cover_image_url) ? (
          <div className="w-full h-64 md:h-96 overflow-hidden">
            <img
              src={resolveCoverUrl(post.cover_image_url) || ''}
              alt={post.title}
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className="w-full h-32 bg-gradient-to-r from-primary/20 to-primary/5" />
        )}
      </section>

      {/* Conteúdo */}
      <article className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Título Principal */}
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight mb-4">
          {post.title}
        </h1>

        {/* Excerpt/Subtítulo */}
        {post.excerpt && (
          <p className="text-lg md:text-xl text-muted-foreground mb-6">
            {post.excerpt}
          </p>
        )}

        {/* Autor e Data */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-8 pb-8 border-b">
          {post.author_name && (
            <>
              <span>Por</span>
              <span className="font-medium text-foreground">@{post.author_name.replace(/\s+/g, '')}</span>
              <span>•</span>
            </>
          )}
          <span>{formatDate(post.published_at)}</span>
        </div>

        {videoUrl && (
          <div className="my-6">
            <video
              controls
              src={videoUrl}
              className="w-full rounded-lg shadow-sm"
            />
          </div>
        )}

        {/* Conteúdo do Artigo */}
        <div 
          className="prose prose-lg dark:prose-invert max-w-none mb-8"
          dangerouslySetInnerHTML={{ __html: formatContent(cleanedContent) }}
        />

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-8 pb-8 border-b">
            {post.tags.map((tag, index) => (
              <Badge key={index} variant="outline">
                #{tag}
              </Badge>
            ))}
          </div>
        )}

        {/* Compartilhar */}
        <div className="bg-muted/50 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <Share2 className="h-5 w-5" />
            <span className="font-semibold">Compartilhe este artigo</span>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => handleShare('facebook')}
            >
              <Facebook className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => handleShare('twitter')}
            >
              <Twitter className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => handleShare('linkedin')}
            >
              <Linkedin className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => handleShare('copy')}
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Newsletter */}
        <div className="mt-8 p-6 bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg border border-primary/20">
          <div className="flex items-center gap-2 mb-3">
            <Mail className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Receba novidades por e-mail</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Inscreva-se na nossa newsletter e fique por dentro de novos artigos e atualizações.
          </p>
          <form onSubmit={handleNewsletterSubmit} className="flex gap-2">
            <Input
              type="email"
              placeholder="Seu melhor e-mail"
              value={newsletterEmail}
              onChange={(e) => setNewsletterEmail(e.target.value)}
              required
              className="flex-1"
            />
            <Button type="submit" disabled={loadingNewsletter}>
              {loadingNewsletter ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Inscrever
                </>
              )}
            </Button>
          </form>
        </div>

        {/* Seção de Comentários */}
        <div className="mt-12 pt-8 border-t">
          <div className="flex items-center gap-2 mb-6">
            <MessageCircle className="h-5 w-5" />
            <h2 className="text-xl font-semibold">Comentários ({comments.length})</h2>
          </div>

          {/* Formulário de Comentário */}
          {user ? (
            <div className="mb-8 p-4 bg-muted/30 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                  <User className="h-4 w-4 text-primary" />
                </div>
                <span className="text-sm font-medium">
                  {user.user_metadata?.full_name || user.email}
                </span>
              </div>
              <Textarea
                placeholder="Escreva seu comentário..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                rows={3}
                className="mb-3"
              />
              <Button
                onClick={handleSubmitComment}
                disabled={submitting || !newComment.trim()}
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Enviar Comentário
                  </>
                )}
              </Button>
            </div>
          ) : (
            <div className="mb-8 p-6 bg-muted/30 rounded-lg text-center">
              <LogIn className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-muted-foreground mb-3">
                Faça login para deixar um comentário
              </p>
              <Button asChild>
                <Link to="/auth">Entrar / Cadastrar</Link>
              </Button>
            </div>
          )}

          {/* Lista de Comentários */}
          {loadingComments ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2" />
              <p className="text-muted-foreground">Carregando comentários...</p>
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MessageCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Nenhum comentário ainda. Seja o primeiro a comentar!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {comments.map((comment) => (
                <div
                  key={comment.id}
                  className="p-4 border rounded-lg bg-background"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <span className="font-medium text-sm">
                          {comment.user_name || 'Usuário'}
                        </span>
                        <span className="text-xs text-muted-foreground ml-2">
                          {new Date(comment.created_at).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                    </div>
                    {canDeleteComment(comment.user_id) && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive h-8 w-8"
                        onClick={() => deleteComment(comment.id)}
                        title="Excluir comentário"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <p className="text-sm pl-10 whitespace-pre-wrap">
                    {comment.content}
                  </p>
                </div>
              ))}

              {hasMore && (
                <div className="text-center pt-4">
                  <Button
                    variant="outline"
                    onClick={loadMore}
                    disabled={loadingComments}
                  >
                    Carregar mais comentários
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </article>

      <Footer />
    </div>
  );
};

export default BlogPost;
