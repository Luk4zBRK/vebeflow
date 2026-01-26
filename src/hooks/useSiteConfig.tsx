import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SiteConfig {
  id: string;
  key: string;
  value: any;
  description?: string;
  created_at: string;
  updated_at: string;
}

interface CompanyInfo {
  name: string;
  tagline: string;
  email: string;
  phone: string;
}

interface SocialMedia {
  linkedin: string;
  github: string;
  instagram: string;
}

interface FooterContent {
  title: string;
  copyright: string;
}

interface ChatAssistantConfig {
  webhook_url: string;
  welcome_message?: string;
}

interface Testimonial {
  id: number;
  name: string;
  role: string;
  avatar: string;
  content: string;
  rating: number;
}

interface AnalyticsConfig {
  google_analytics_id: string;
  enable_tracking: boolean;
  enable_scroll_tracking: boolean;
  enable_click_tracking: boolean;
  enable_time_tracking: boolean;
  track_custom_events: boolean;
}

export const useSiteConfig = () => {
  const [configs, setConfigs] = useState<SiteConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Fetch all configurations
  const fetchConfigs = async () => {
    try {
      setIsLoading(true);
      console.log('Fetching site configs...');
      const { data, error } = await supabase
        .from('site_config' as any)
        .select('*')
        .order('key');

      if (error) {
        // Se for erro de RLS (políticas), não mostrar toast pois pode ser usuário deslogado
        if (error.message?.includes('policy') || error.message?.includes('RLS')) {
          console.log('RLS/Policy error - usando dados fallback:', error);
        } else {
          throw error;
        }
      } else {
        console.log('Fetched configs:', data);
        setConfigs((data as unknown as SiteConfig[]) || []);
      }
    } catch (error) {
      console.error('Error fetching site config:', error);
      // Só mostrar toast se não for erro de política/RLS
      const errorMsg = error instanceof Error ? error.message : String(error);
      if (!errorMsg.includes('policy') && !errorMsg.includes('RLS')) {
        toast({
          title: "Erro",
          description: "Não foi possível carregar as configurações",
          variant: "destructive"
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Update a configuration
  const updateConfig = async (key: string, value: any) => {
    try {
      const { error } = await supabase
        .from('site_config' as any)
        .upsert({ key, value }, { onConflict: 'key' });

      if (error) throw error;

      setConfigs(prevConfigs => {
        const exists = prevConfigs.some(config => config.key === key);
        if (exists) {
          return prevConfigs.map(config =>
            config.key === key ? { ...config, value } : config
          );
        }
        return [...prevConfigs, {
          id: key,
          key,
          value,
          description: '',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        } as SiteConfig];
      });

      toast({
        title: "Configuração atualizada",
        description: "As alterações foram salvas com sucesso"
      });

      return true;
    } catch (error) {
      console.error('Error updating config:', error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar as configurações",
        variant: "destructive"
      });
      return false;
    }
  };

  // Get configuration by key
  const getConfig = (key: string) => {
    const result = configs.find(config => config.key === key)?.value;
    console.log(`getConfig(${key}):`, result);
    return result;
  };

  // Specific getters for typed access
  const getCompanyInfo = (): CompanyInfo | null => getConfig('company_info');
  const getSocialMedia = (): SocialMedia | null => getConfig('social_media');
  const getFooterContent = (): FooterContent | null => getConfig('footer_content');
  const getTestimonials = (): Testimonial[] | null => getConfig('testimonials');
  const getAnalyticsConfig = (): AnalyticsConfig | null => getConfig('analytics');
  const getChatAssistantConfig = (): ChatAssistantConfig | null => getConfig('chat_assistant');

  useEffect(() => {
    fetchConfigs();
  }, []);

  return {
    configs,
    isLoading,
    updateConfig,
    getConfig,
    getCompanyInfo,
    getSocialMedia,
    getFooterContent,
    getTestimonials,
    getAnalyticsConfig,
    getChatAssistantConfig,
    refetch: fetchConfigs
  };
};
