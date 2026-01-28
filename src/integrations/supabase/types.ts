export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      blog_posts: {
        Row: {
          author_id: string | null
          author_name: string | null
          category: string | null
          content: string
          cover_image_url: string | null
          created_at: string | null
          excerpt: string | null
          id: string
          published_at: string | null
          slug: string
          status: string
          tags: string[] | null
          title: string
          updated_at: string | null
          views_count: number | null
        }
        Insert: {
          author_id?: string | null
          author_name?: string | null
          category?: string | null
          content: string
          cover_image_url?: string | null
          created_at?: string | null
          excerpt?: string | null
          id?: string
          published_at?: string | null
          slug: string
          status?: string
          tags?: string[] | null
          title: string
          updated_at?: string | null
          views_count?: number | null
        }
        Update: {
          author_id?: string | null
          author_name?: string | null
          category?: string | null
          content?: string
          cover_image_url?: string | null
          created_at?: string | null
          excerpt?: string | null
          id?: string
          published_at?: string | null
          slug?: string
          status?: string
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          views_count?: number | null
        }
        Relationships: []
      }
      contact_messages: {
        Row: {
          created_at: string
          email: string
          id: string
          message: string
          name: string
          status: string | null
          subject: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
          status?: string | null
          subject?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
          status?: string | null
          subject?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      portfolio_items: {
        Row: {
          created_at: string | null
          description: string
          featured: boolean | null
          id: string
          image_url: string | null
          order_index: number | null
          status: string | null
          technologies: string[] | null
          title: string
          type: string
          updated_at: string | null
          url: string | null
        }
        Insert: {
          created_at?: string | null
          description: string
          featured?: boolean | null
          id?: string
          image_url?: string | null
          order_index?: number | null
          status?: string | null
          technologies?: string[] | null
          title: string
          type: string
          updated_at?: string | null
          url?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string
          featured?: boolean | null
          id?: string
          image_url?: string | null
          order_index?: number | null
          status?: string | null
          technologies?: string[] | null
          title?: string
          type?: string
          updated_at?: string | null
          url?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      workflows: {
        Row: {
          author_id: string | null
          author_name: string | null
          content: string
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_published: boolean
          slug: string
          title: string
          updated_at: string
          views_count: number
        }
        Insert: {
          author_id?: string | null
          author_name?: string | null
          content: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_published?: boolean
          slug: string
          title: string
          updated_at?: string
          views_count?: number
        }
        Update: {
          author_id?: string | null
          author_name?: string | null
          content?: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_published?: boolean
          slug?: string
          title?: string
          updated_at?: string
          views_count?: number
        }
        Relationships: []
      }
      ide_news: {
        Row: {
          id: string
          titulo: string
          resumo: string | null
          link: string
          fonte: string
          cor: string | null
          logo: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          titulo: string
          resumo?: string | null
          link: string
          fonte: string
          cor?: string | null
          logo?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          titulo?: string
          resumo?: string | null
          link?: string
          fonte?: string
          cor?: string | null
          logo?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      ide_news_sync_log: {
        Row: {
          id: string
          sync_started_at: string
          sync_completed_at: string | null
          status: string
          items_fetched: number
          error_message: string | null
          created_at: string
        }
        Insert: {
          id?: string
          sync_started_at?: string
          sync_completed_at?: string | null
          status: string
          items_fetched?: number
          error_message?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          sync_started_at?: string
          sync_completed_at?: string | null
          status?: string
          items_fetched?: number
          error_message?: string | null
          created_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_workflow_views: {
        Args: { workflow_id: string }
        Returns: undefined
      }
      cleanup_old_ide_news: {
        Args: Record<string, never>
        Returns: undefined
      }
      cleanup_old_sync_logs: {
        Args: Record<string, never>
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

      mcp_servers: {
        Row: {
          id: string
          title: string
          slug: string
          description: string | null
          content: string
          image_url: string | null
          author_id: string | null
          author_name: string | null
          category: string | null
          tags: string[] | null
          npm_package: string | null
          github_url: string | null
          install_command: string | null
          is_published: boolean
          views_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          slug: string
          description?: string | null
          content: string
          image_url?: string | null
          author_id?: string | null
          author_name?: string | null
          category?: string | null
          tags?: string[] | null
          npm_package?: string | null
          github_url?: string | null
          install_command?: string | null
          is_published?: boolean
          views_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          slug?: string
          description?: string | null
          content?: string
          image_url?: string | null
          author_id?: string | null
          author_name?: string | null
          category?: string | null
          tags?: string[] | null
          npm_package?: string | null
          github_url?: string | null
          install_command?: string | null
          is_published?: boolean
          views_count?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }

      recommended_sites: {
        Row: {
          id: string
          title: string
          slug: string
          description: string | null
          url: string
          image_url: string | null
          favicon_url: string | null
          author_id: string | null
          author_name: string | null
          category: string | null
          tags: string[] | null
          is_published: boolean
          views_count: number
          clicks_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          slug: string
          description?: string | null
          url: string
          image_url?: string | null
          favicon_url?: string | null
          author_id?: string | null
          author_name?: string | null
          category?: string | null
          tags?: string[] | null
          is_published?: boolean
          views_count?: number
          clicks_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          slug?: string
          description?: string | null
          url?: string
          image_url?: string | null
          favicon_url?: string | null
          author_id?: string | null
          author_name?: string | null
          category?: string | null
          tags?: string[] | null
          is_published?: boolean
          views_count?: number
          clicks_count?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
