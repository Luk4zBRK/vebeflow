import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const useNewsletter = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const subscribe = async (email: string, name?: string) => {
    if (!email.trim()) return { success: false };
    setLoading(true);
    try {
      const { error } = await (supabase as any)
        .from("newsletter_subscribers")
        .insert({ email: email.trim().toLowerCase(), name: name?.trim() || null });

      if (error) {
        if (error.code === "23505") {
          toast({
            title: "Já inscrito",
            description: "Este e-mail já está cadastrado na nossa newsletter.",
          });
          return { success: true, alreadySubscribed: true };
        }
        throw error;
      }

      toast({
        title: "Inscrição confirmada!",
        description: "Você receberá nossas novidades por e-mail.",
      });
      return { success: true };
    } catch (error: any) {
      console.error("Erro ao inscrever na newsletter", error);
      toast({
        title: "Erro",
        description: "Não foi possível realizar a inscrição. Tente novamente.",
        variant: "destructive",
      });
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  return {
    subscribe,
    loading,
  };
};
