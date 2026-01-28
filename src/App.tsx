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

const AnalyticsProvider = ({ children }: { children: React.ReactNode }) => {
  useAnalytics(); // Inicializa o tracking
  return <>{children}</>;
};

const queryClient = new QueryClient();

const App = () => (
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
);

export default App;
