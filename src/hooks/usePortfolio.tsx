import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface PortfolioItem {
  id: string;
  title: string;
  description: string;
  type: 'site' | 'automation';
  technologies: string[];
  url: string | null;
  image_url: string | null;
  status: 'active' | 'inactive' | 'draft';
  featured: boolean;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export const usePortfolio = () => {
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchItems = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("portfolio_items")
        .select("*")
        .order("order_index", { ascending: true })
        .order("created_at", { ascending: false });

      if (error) {
        // Check if it's an RLS policy error (user doesn't have admin access)
        if (error.code === "42501" || error.message.includes("policy")) {
          console.log("RLS policy restriction - user doesn't have admin access");
          setItems([]);
          return;
        }
        throw error;
      }

      setItems((data || []) as PortfolioItem[]);
    } catch (error) {
      console.error("Error fetching portfolio items:", error);
      toast({
        title: "Erro ao carregar portfólio",
        description: "Não foi possível carregar os itens do portfólio.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const fetchPublicItems = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("portfolio_items")
        .select("*")
        .eq("status", "active")
        .order("order_index", { ascending: true })
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching public portfolio items:", error);
        setItems([]);
        return;
      }

      setItems((data || []) as PortfolioItem[]);
    } catch (error) {
      console.error("Error fetching public portfolio items:", error);
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const getItemsByType = (type: 'site' | 'automation') => {
    return items.filter(item => item.type === type);
  };

  const createItem = async (item: Omit<PortfolioItem, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from("portfolio_items")
        .insert([item])
        .select()
        .single();

      if (error) throw error;

      setItems(prev => [...prev, data as PortfolioItem]);
      toast({
        title: "Projeto criado",
        description: "O projeto foi criado com sucesso.",
      });

      return data;
    } catch (error) {
      console.error("Error creating portfolio item:", error);
      toast({
        title: "Erro ao criar projeto",
        description: "Não foi possível criar o projeto.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateItem = async (id: string, updates: Partial<PortfolioItem>) => {
    try {
      const { data, error } = await supabase
        .from("portfolio_items")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;

      setItems(prev => prev.map(item => item.id === id ? data as PortfolioItem : item));
      toast({
        title: "Projeto atualizado",
        description: "O projeto foi atualizado com sucesso.",
      });

      return data;
    } catch (error) {
      console.error("Error updating portfolio item:", error);
      toast({
        title: "Erro ao atualizar projeto",
        description: "Não foi possível atualizar o projeto.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const deleteItem = async (id: string) => {
    try {
      const { error } = await supabase
        .from("portfolio_items")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setItems(prev => prev.filter(item => item.id !== id));
      toast({
        title: "Projeto excluído",
        description: "O projeto foi excluído com sucesso.",
      });
    } catch (error) {
      console.error("Error deleting portfolio item:", error);
      toast({
        title: "Erro ao excluir projeto",
        description: "Não foi possível excluir o projeto.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const toggleStatus = async (id: string) => {
    const item = items.find(i => i.id === id);
    if (!item) return;

    const newStatus = item.status === 'active' ? 'inactive' : 'active';
    await updateItem(id, { status: newStatus });
  };

  useEffect(() => {
    fetchItems();
  }, []);

  return {
    items,
    isLoading,
    fetchItems,
    fetchPublicItems,
    getItemsByType,
    createItem,
    updateItem,
    deleteItem,
    toggleStatus,
  };
};
