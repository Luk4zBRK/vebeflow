import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, User, Eye, ArrowLeft, Share2, Copy, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Workflow {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  content: string;
  image_url: string | null;
  author_name: string | null;
  views_count: number;
  created_at: string;
}

const WorkflowPost = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (slug) {
      fetchWorkflow();
    }
  }, [slug]);

  const fetchWorkflow = async () => {
    try {
      const { data, error } = await supabase
        .from('workflows')
        .select('*')
        .eq('slug', slug)
        .eq('is_published', true)
        .single();

      if (error) throw error;

      if (data) {
        setWorkflow(data);
        // Incrementar views
        await supabase.rpc('increment_workflow_views', { workflow_id: data.id });
      }
    } catch (error) {
      console.error('Erro ao carregar workflow:', error);
      toast({
        title: 'Erro',
        description: 'Workflow não encontrado',
        variant: 'destructive',
      });
      navigate('/workflows');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  const handleShare = async () => {
    const url = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({
          title: workflow?.title,
          text: workflow?.description || '',
          url: url,
        });
      } catch (error) {
        console.log('Compartilhamento cancelado');
      }
    } else {
      handleCopyLink();
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      toast({
        title: 'Link copiado!',
        description: 'O link foi copiado para a área de transferência',
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível copiar o link',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <div className="flex-1 py-16 px-4">
          <div className="container mx-auto max-w-4xl">
            <Skeleton className="h-8 w-32 mb-8" />
            <Skeleton className="h-12 w-3/4 mb-4" />
            <Skeleton className="h-6 w-1/2 mb-8" />
            <Skeleton className="h-96 w-full mb-8" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!workflow) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <article className="flex-1 py-16 px-4">
        <div className="container mx-auto max-w-4xl">
          {/* Back Button */}
          <Button
            variant="ghost"
            onClick={() => navigate('/workflows')}
            className="mb-8"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para workflows
          </Button>

          {/* Header */}
          <div className="mb-8">
            <Badge className="mb-4">Workflow</Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">{workflow.title}</h1>
            {workflow.description && (
              <p className="text-xl text-muted-foreground">{workflow.description}</p>
            )}
          </div>

          {/* Meta Info */}
          <div className="flex flex-wrap gap-6 text-sm text-muted-foreground mb-8 pb-8 border-b">
            {workflow.author_name && (
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span>{workflow.author_name}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>{formatDate(workflow.created_at)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              <span>{workflow.views_count} visualizações</span>
            </div>
            <div className="ml-auto flex gap-2">
              <Button variant="outline" size="sm" onClick={handleShare}>
                <Share2 className="h-4 w-4 mr-2" />
                Compartilhar
              </Button>
              <Button variant="outline" size="sm" onClick={handleCopyLink}>
                {copied ? (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Copiado
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-2" />
                    Copiar link
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Featured Image */}
          {workflow.image_url && (
            <div className="mb-12 rounded-lg overflow-hidden">
              <img
                src={workflow.image_url}
                alt={workflow.title}
                className="w-full h-auto"
              />
            </div>
          )}

          {/* Content */}
          <div
            className="prose prose-lg dark:prose-invert max-w-none mb-12"
            dangerouslySetInnerHTML={{ __html: workflow.content }}
          />

          {/* Footer Actions */}
          <div className="pt-8 border-t flex justify-between items-center">
            <Button variant="outline" onClick={() => navigate('/workflows')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Ver mais workflows
            </Button>
            <Button variant="default" onClick={handleShare}>
              <Share2 className="mr-2 h-4 w-4" />
              Compartilhar workflow
            </Button>
          </div>
        </div>
      </article>

      <Footer />
    </div>
  );
};

export default WorkflowPost;
