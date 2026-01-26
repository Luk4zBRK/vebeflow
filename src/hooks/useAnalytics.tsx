import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSiteConfig } from '@/hooks/useSiteConfig';

interface AnalyticsEvent {
  event_name: string;
  event_data?: Record<string, any>;
  page_url?: string;
}

interface AnalyticsConfig {
  google_analytics_id: string;
  enable_tracking: boolean;
  enable_scroll_tracking: boolean;
  enable_click_tracking: boolean;
  enable_time_tracking: boolean;
  track_custom_events: boolean;
}

export const useAnalytics = () => {
  const { getConfig } = useSiteConfig();
  const sessionId = useRef<string>();
  const startTime = useRef<number>();
  const maxScroll = useRef<number>(0);
  const pageViews = useRef<Set<string>>(new Set());

  // Gerar session ID único
  const generateSessionId = () => {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  };

  // Obter configurações de analytics
  const getAnalyticsConfig = (): AnalyticsConfig => {
    const config = getConfig('analytics');
    return config || {
      google_analytics_id: '',
      enable_tracking: true,
      enable_scroll_tracking: true,
      enable_click_tracking: true,
      enable_time_tracking: true,
      track_custom_events: true
    };
  };

  // Inicializar Google Analytics
  const initGoogleAnalytics = (gaId: string) => {
    if (!gaId || typeof window === 'undefined') return;

    // Carregar Google Analytics
    const script1 = document.createElement('script');
    script1.async = true;
    script1.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
    document.head.appendChild(script1);

    const script2 = document.createElement('script');
    script2.innerHTML = `
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', '${gaId}', {
        page_title: document.title,
        page_location: window.location.href,
        custom_map: {
          'custom_session_id': 'session_id'
        }
      });
    `;
    document.head.appendChild(script2);

    // Disponibilizar gtag globalmente
    (window as any).gtag = (...args: any[]) => {
      (window as any).dataLayer = (window as any).dataLayer || [];
      (window as any).dataLayer.push(args);
    };
  };

  // Enviar evento para o banco de dados
  const trackEvent = useCallback(async (eventData: AnalyticsEvent) => {
    const config = getAnalyticsConfig();
    if (!config.track_custom_events) return;

    try {
      await supabase.from('analytics_events' as any).insert({
        session_id: sessionId.current,
        event_name: eventData.event_name,
        event_data: eventData.event_data || {},
        page_url: eventData.page_url || window.location.href,
        user_agent: navigator.userAgent,
        ip_address: null // Será preenchido pelo servidor
      });
    } catch (error) {
      console.error('Error tracking event:', error);
    }
  }, []);

  // Enviar evento para Google Analytics
  const sendGAEvent = (eventName: string, parameters?: Record<string, any>) => {
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', eventName, {
        session_id: sessionId.current,
        ...parameters
      });
    }
  };

  // Track page view
  const trackPageView = useCallback((path?: string) => {
    const url = path || window.location.pathname;
    
    if (!pageViews.current.has(url)) {
      pageViews.current.add(url);
      
      trackEvent({
        event_name: 'page_view',
        event_data: {
          page_path: url,
          page_title: document.title,
          referrer: document.referrer
        }
      });

      sendGAEvent('page_view', {
        page_path: url,
        page_title: document.title
      });
    }
  }, [trackEvent]);

  // Track scroll depth
  const trackScrollDepth = useCallback(() => {
    const config = getAnalyticsConfig();
    if (!config.enable_scroll_tracking) return;

    const scrollPercentage = Math.round(
      ((window.scrollY + window.innerHeight) / document.documentElement.scrollHeight) * 100
    );

    if (scrollPercentage > maxScroll.current) {
      maxScroll.current = scrollPercentage;

      // Track milestones (25%, 50%, 75%, 90%, 100%)
      const milestones = [25, 50, 75, 90, 100];
      const milestone = milestones.find(m => scrollPercentage >= m && maxScroll.current < m);

      if (milestone) {
        trackEvent({
          event_name: 'scroll_depth',
          event_data: {
            scroll_percentage: milestone,
            page_path: window.location.pathname
          }
        });

        sendGAEvent('scroll', {
          scroll_depth: milestone
        });
      }
    }
  }, [trackEvent]);

  // Track clicks
  const trackClick = useCallback((element: Element, customData?: Record<string, any>) => {
    const config = getAnalyticsConfig();
    if (!config.enable_click_tracking) return;

    const elementData = {
      tag_name: element.tagName.toLowerCase(),
      element_id: element.id || null,
      element_class: element.className || null,
      element_text: element.textContent?.substring(0, 100) || null,
      page_path: window.location.pathname,
      ...customData
    };

    trackEvent({
      event_name: 'element_click',
      event_data: elementData
    });

    sendGAEvent('click', elementData);
  }, [trackEvent]);

  // Track time on page
  const trackTimeOnPage = useCallback(() => {
    const config = getAnalyticsConfig();
    if (!config.enable_time_tracking || !startTime.current) return;

    const timeSpent = Math.round((Date.now() - startTime.current) / 1000);

    trackEvent({
      event_name: 'time_on_page',
      event_data: {
        time_seconds: timeSpent,
        page_path: window.location.pathname
      }
    });

    sendGAEvent('timing_complete', {
      name: 'page_view_time',
      value: timeSpent
    });
  }, [trackEvent]);

  // Track custom event
  const trackCustomEvent = useCallback((eventName: string, eventData?: Record<string, any>) => {
    trackEvent({
      event_name: eventName,
      event_data: eventData
    });

    sendGAEvent(eventName, eventData);
  }, [trackEvent]);

  // Inicialização
  useEffect(() => {
    const config = getAnalyticsConfig();
    if (!config.enable_tracking) return;

    // Gerar session ID
    sessionId.current = generateSessionId();
    startTime.current = Date.now();

    // Inicializar GA se tiver ID
    if (config.google_analytics_id) {
      initGoogleAnalytics(config.google_analytics_id);
    }

    // Track page view inicial
    trackPageView();

    // Configurar event listeners
    const handleScroll = () => trackScrollDepth();
    const handleClick = (e: Event) => {
      if (e.target instanceof Element) {
        trackClick(e.target);
      }
    };
    const handleBeforeUnload = () => trackTimeOnPage();

    if (config.enable_scroll_tracking) {
      window.addEventListener('scroll', handleScroll, { passive: true });
    }

    if (config.enable_click_tracking) {
      document.addEventListener('click', handleClick, true);
    }

    if (config.enable_time_tracking) {
      window.addEventListener('beforeunload', handleBeforeUnload);
    }

    return () => {
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('click', handleClick, true);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      trackTimeOnPage();
    };
  }, [trackPageView, trackScrollDepth, trackClick, trackTimeOnPage]);

  return {
    trackPageView,
    trackCustomEvent,
    trackClick,
    trackScrollDepth,
    sessionId: sessionId.current
  };
};
