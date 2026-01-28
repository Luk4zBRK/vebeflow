import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WorkflowItem {
  title: string;
  slug: string;
  description: string;
  content: string;
  image_url?: string;
}

// Workflows úteis para desenvolvedores
const workflowsDatabase: WorkflowItem[] = [
  {
    title: 'Configurar Tailwind CSS em Projeto React',
    slug: 'setup-tailwind-react',
    description: 'Guia completo para instalar e configurar Tailwind CSS em projetos React com Vite',
    content: `<h2>Objetivo</h2>
<p>Configurar Tailwind CSS em um projeto React com Vite para estilização rápida e eficiente.</p>

<h2>Pré-requisitos</h2>
<ul>
  <li>Projeto React com Vite criado</li>
  <li>Node.js 18+ instalado</li>
</ul>

<h2>Passo 1: Instalar Dependências</h2>
<pre><code>npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p</code></pre>

<h2>Passo 2: Configurar tailwind.config.js</h2>
<pre><code>export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}</code></pre>

<h2>Passo 3: Adicionar Diretivas CSS</h2>
<p>No arquivo <code>src/index.css</code>:</p>
<pre><code>@tailwind base;
@tailwind components;
@tailwind utilities;</code></pre>

<h2>Passo 4: Testar</h2>
<pre><code>function App() {
  return (
    &lt;div className="min-h-screen bg-gray-100 flex items-center justify-center"&gt;
      &lt;h1 className="text-4xl font-bold text-blue-600"&gt;
        Tailwind CSS funcionando!
      &lt;/h1&gt;
    &lt;/div&gt;
  )
}</code></pre>

<h2>Plugins Úteis</h2>
<pre><code>npm install -D @tailwindcss/forms @tailwindcss/typography

// tailwind.config.js
plugins: [
  require('@tailwindcss/forms'),
  require('@tailwindcss/typography'),
]</code></pre>`,
  },
  {
    title: 'Implementar Dark Mode em React',
    slug: 'dark-mode-react',
    description: 'Como adicionar tema escuro/claro em aplicações React com persistência no localStorage',
    content: `<h2>Objetivo</h2>
<p>Implementar sistema de dark mode com toggle e persistência de preferência do usuário.</p>

<h2>Passo 1: Criar Hook useTheme</h2>
<pre><code>import { useState, useEffect } from 'react';

export const useTheme = () => {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'light';
  });

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  return { theme, toggleTheme };
};</code></pre>

<h2>Passo 2: Configurar Tailwind</h2>
<pre><code>// tailwind.config.js
export default {
  darkMode: 'class',
  // ... resto da config
}</code></pre>

<h2>Passo 3: Criar Componente Toggle</h2>
<pre><code>import { Moon, Sun } from 'lucide-react';
import { useTheme } from './hooks/useTheme';

export const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    &lt;button
      onClick={toggleTheme}
      className="p-2 rounded-lg bg-gray-200 dark:bg-gray-800"
    &gt;
      {theme === 'light' ? &lt;Moon /&gt; : &lt;Sun /&gt;}
    &lt;/button&gt;
  );
};</code></pre>

<h2>Passo 4: Usar Classes Dark</h2>
<pre><code>&lt;div className="bg-white dark:bg-gray-900 text-black dark:text-white"&gt;
  &lt;h1 className="text-gray-900 dark:text-gray-100"&gt;Título&lt;/h1&gt;
&lt;/div&gt;</code></pre>`,
  },
  {
    title: 'Configurar React Query (TanStack Query)',
    slug: 'setup-react-query',
    description: 'Setup e uso do React Query para gerenciamento de estado assíncrono e cache de dados',
    content: `<h2>Objetivo</h2>
<p>Configurar React Query para gerenciar requisições HTTP com cache automático e sincronização.</p>

<h2>Passo 1: Instalar</h2>
<pre><code>npm install @tanstack/react-query
npm install -D @tanstack/react-query-devtools</code></pre>

<h2>Passo 2: Configurar Provider</h2>
<pre><code>import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutos
      cacheTime: 1000 * 60 * 10, // 10 minutos
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    &lt;QueryClientProvider client={queryClient}&gt;
      &lt;YourApp /&gt;
      &lt;ReactQueryDevtools initialIsOpen={false} /&gt;
    &lt;/QueryClientProvider&gt;
  );
}</code></pre>

<h2>Passo 3: Criar Hook de Query</h2>
<pre><code>import { useQuery } from '@tanstack/react-query';

export const useUsers = () => {
  return useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const response = await fetch('/api/users');
      if (!response.ok) throw new Error('Erro ao buscar usuários');
      return response.json();
    },
  });
};</code></pre>

<h2>Passo 4: Usar no Componente</h2>
<pre><code>function UserList() {
  const { data, isLoading, error } = useUsers();

  if (isLoading) return &lt;div&gt;Carregando...&lt;/div&gt;;
  if (error) return &lt;div&gt;Erro: {error.message}&lt;/div&gt;;

  return (
    &lt;ul&gt;
      {data.map(user =&gt; (
        &lt;li key={user.id}&gt;{user.name}&lt;/li&gt;
      ))}
    &lt;/ul&gt;
  );
}</code></pre>

<h2>Passo 5: Mutations</h2>
<pre><code>import { useMutation, useQueryClient } from '@tanstack/react-query';

export const useCreateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newUser) => {
      const response = await fetch('/api/users', {
        method: 'POST',
        body: JSON.stringify(newUser),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
};</code></pre>`,
  },
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('🚀 Iniciando sincronização de workflows...');

    let insertedCount = 0;
    let skippedCount = 0;

    // Buscar admin user
    const { data: adminUser } = await supabase
      .from('profiles')
      .select('id')
      .limit(1)
      .single();

    const authorId = adminUser?.id || null;

    for (const workflow of workflowsDatabase) {
      try {
        // Verificar se já existe
        const { data: existing } = await supabase
          .from('workflows')
          .select('id')
          .eq('slug', workflow.slug)
          .limit(1)
          .single();

        if (existing) {
          console.log(`⏭️  Pulando duplicata: ${workflow.title}`);
          skippedCount++;
          continue;
        }

        // Inserir novo workflow
        const { error: insertError } = await supabase
          .from('workflows')
          .insert({
            title: workflow.title,
            slug: workflow.slug,
            description: workflow.description,
            content: workflow.content,
            image_url: workflow.image_url,
            author_id: authorId,
            author_name: 'Vibe Flow',
            is_published: true,
            views_count: 0,
          });

        if (insertError) {
          console.error(`❌ Erro ao inserir ${workflow.title}:`, insertError);
        } else {
          console.log(`✅ Inserido: ${workflow.title}`);
          insertedCount++;
        }
      } catch (error) {
        console.error(`❌ Erro ao processar ${workflow.title}:`, error);
      }
    }

    console.log(`✨ Sincronização concluída: ${insertedCount} inseridos, ${skippedCount} pulados`);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Sincronização de workflows concluída',
        inserted: insertedCount,
        skipped: skippedCount,
        total: workflowsDatabase.length,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error('❌ Erro na sincronização:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
