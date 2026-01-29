import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { useAnalytics } from "@/hooks/useAnalytics";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Settings from "./pages/Settings";
import Analytics from "./pages/Analytics";
import ContactForms from "./pages/ContactForms";
import PortfolioManager from "./pages/PortfolioManager";
import VpsSchemaGenerator from "./pages/VpsSchemaGenerator";
import Blog from "./pages/Blog";
import BlogPost from "./pages/BlogPost";
import BlogManager from "./pages/BlogManager";
import Workflows from "./pages/Workflows";
import WorkflowPost from "./pages/WorkflowPost";
import WorkflowManager from "./pages/WorkflowManager";
import McpServers from "./pages/McpServers";
import McpServerPost from "./pages/McpServerPost";
import McpManager from "./pages/McpManager";
import RecommendedSites from "./pages/RecommendedSites";
import SitesManager from "./pages/SitesManager";
import NotFound from "./pages/NotFound";
import TermsOfUse from "./pages/TermsOfUse";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import React from "react";

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean, error: Error | null }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-lg font-bold text-red-800 mb-2">Algo deu errado</h2>
            <p className="text-sm text-red-600 mb-4">
              Ocorreu um erro inesperado na aplicação.
            </p>
            <pre className="text-xs bg-white p-2 rounded overflow-auto max-h-40 border">
              {this.state.error?.message}
            </pre>
            <button
              onClick={() => window.location.href = '/'}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
            >
              Recarregar Página
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const AnalyticsProvider = ({ children }: { children: React.ReactNode }) => {
  useAnalytics(); // Inicializa o tracking
  return <>{children}</>;
};

const queryClient = new QueryClient();

// Verificação de Variáveis de Ambiente Críticas
const checkEnvVars = () => {
  const missing = [];
  if (!import.meta.env.VITE_SUPABASE_URL) missing.push("VITE_SUPABASE_URL");
  if (!import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY) missing.push("VITE_SUPABASE_PUBLISHABLE_KEY");

  if (missing.length > 0) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-yellow-50">
        <div className="max-w-md w-full bg-white border border-yellow-200 rounded-lg p-6 shadow-lg">
          <h2 className="text-xl font-bold text-yellow-800 mb-2">Configuração Incompleta</h2>
          <p className="text-gray-600 mb-4">
            As seguintes variáveis de ambiente não foram detectadas:
          </p>
          <ul className="list-disc pl-5 mb-4 text-sm text-red-600 font-mono">
            {missing.map(v => <li key={v}>{v}</li>)}
          </ul>
          <div className="text-sm text-gray-500 bg-gray-50 p-3 rounded">
            <strong>Dica:</strong> Verifique se você configurou as Environment Variables no painel de deploy (EasyPanel/Coolify) e fez o Redeploy.
          </div>
        </div>
      </div>
    );
  }
  return null;
};

const App = () => {
  const envError = checkEnvVars();
  if (envError) return envError;

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter
              future={{
                v7_startTransition: true,
                v7_relativeSplatPath: true
              }}
            >
              <AnalyticsProvider>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/analytics" element={<Analytics />} />
                  <Route path="/contact-forms" element={<ContactForms />} />
                  <Route path="/portfolio-manager" element={<PortfolioManager />} />
                  <Route path="/vps-generator" element={<VpsSchemaGenerator />} />
                  <Route path="/blog" element={<Blog />} />
                  <Route path="/blog/:slug" element={<BlogPost />} />
                  <Route path="/blog-manager" element={<BlogManager />} />
                  <Route path="/workflows" element={<Workflows />} />
                  <Route path="/workflows/:slug" element={<WorkflowPost />} />
                  <Route path="/workflow-manager" element={<WorkflowManager />} />
                  <Route path="/mcp-servers" element={<McpServers />} />
                  <Route path="/mcp-servers/:slug" element={<McpServerPost />} />
                  <Route path="/mcp-manager" element={<McpManager />} />
                  <Route path="/recommended-sites" element={<RecommendedSites />} />
                  <Route path="/sites-manager" element={<SitesManager />} />
                  <Route path="/termos-de-uso" element={<TermsOfUse />} />
                  <Route path="/politica-de-privacidade" element={<PrivacyPolicy />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </AnalyticsProvider>
            </BrowserRouter>
          </TooltipProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
