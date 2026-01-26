import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface BlogComment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  user_name?: string | null;
}

const PAGE_SIZE = 20;

export const useComments = (postId: string | undefined, currentUserId?: string | null) => {
  const { toast } = useToast();
  const [comments, setComments] = useState<BlogComment[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [cursor, setCursor] = useState<string | null>(null);

  useEffect(() => {
    if (postId) {
      resetAndFetch();
    }
  }, [postId]);

  const resetAndFetch = async () => {
    setCursor(null);
    setComments([]);
    setHasMore(true);
    await fetchComments(null);
  };

  const fetchComments = async (fromCursor: string | null) => {
    if (!postId) return;
    setLoading(true);
    try {
      let query = (supabase as any)
        .from("blog_comments")
        .select("*")
        .eq("post_id", postId)
        .order("created_at", { ascending: false })
        .limit(PAGE_SIZE);

      if (fromCursor) {
        query = query.lt("created_at", fromCursor);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Buscar nomes dos usuários via profiles
      const userIds = [...new Set((data || []).map((c: any) => c.user_id))];
      let userMap: Record<string, string> = {};
      if (userIds.length > 0) {
        const { data: profiles } = await (supabase as any)
          .from("profiles")
          .select("id, full_name")
          .in("id", userIds);
        if (profiles) {
          profiles.forEach((p: any) => {
            userMap[p.id] = p.full_name || "Usuário";
          });
        }
      }

      const enriched = (data || []).map((c: any) => ({
        ...c,
        user_name: userMap[c.user_id] || "Usuário",
      }));

      setComments((prev) => [...prev, ...enriched]);
      if (!data || data.length < PAGE_SIZE) {
        setHasMore(false);
      }
      if (data && data.length > 0) {
        setCursor(data[data.length - 1].created_at);
      }
    } catch (error: any) {
      console.error("Erro ao carregar comentários", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os comentários.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addComment = async (content: string) => {
    if (!postId || !currentUserId) return;
    const trimmed = content.trim();
    if (!trimmed) return;
    setSubmitting(true);
    try {
      const { error } = await (supabase as any).from("blog_comments").insert({
        post_id: postId,
        user_id: currentUserId,
        content: trimmed,
      });
      if (error) throw error;
      toast({ title: "Comentário enviado" });
      await resetAndFetch();
    } catch (error: any) {
      console.error("Erro ao enviar comentário", error);
      toast({
        title: "Erro ao comentar",
        description: error.message || "Tente novamente em alguns segundos.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const deleteComment = async (commentId: string) => {
    try {
      const { error } = await (supabase as any)
        .from("blog_comments")
        .delete()
        .eq("id", commentId);
      if (error) throw error;
      setComments((prev) => prev.filter((c) => c.id !== commentId));
      toast({ title: "Comentário removido" });
    } catch (error: any) {
      console.error("Erro ao deletar comentário", error);
      toast({
        title: "Erro ao deletar",
        description: error.message || "Não foi possível deletar o comentário.",
        variant: "destructive",
      });
    }
  };

  const loadMore = async () => {
    if (hasMore && !loading) {
      await fetchComments(cursor);
    }
  };

  return {
    comments,
    loading,
    submitting,
    hasMore,
    addComment,
    deleteComment,
    loadMore,
    refetch: resetAndFetch,
  };
};
