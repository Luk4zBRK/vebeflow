import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Key, Rocket, Copy, Download, Package, Settings, ChevronDown, Zap, Info, BookOpen, MessageCircle, Star, Send, Lightbulb, Bug, ThumbsUp, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FormData {
  defaultDomain: string;
  projectName: string;
  n8nKey: string;
  postgresKey: string;
  redisKey: string;
  minioUser: string;
  minioPass: string;
  rabbitmqVhost: string;
  rabbitmqUser: string;
  rabbitmqPass: string;
  wahaApiKey: string;
  wahaDashboardUser: string;
  wahaDashboardPass: string;
  wahaDockerUser: string;
  wahaDockerPass: string;
  evolutionApiKey: string;
  evolutionServerUrl: string;
  evolutionAdvanced: boolean;
  evolutionVolume: string;
  n8nDbName: string;
  wahaDbName: string;
  evolutionDbName: string;
}

interface Services {
  n8n: boolean;
  minio: boolean;
  rabbitmq: boolean;
  waha: boolean;
  evolution: boolean;
}

const VpsSchemaGenerator = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [keysGenerated, setKeysGenerated] = useState(false);
  const [schemaGenerated, setSchemaGenerated] = useState(false);
  const [generateSql, setGenerateSql] = useState(false);

  const [services, setServices] = useState<Services>({
    n8n: true,
    minio: false,
    rabbitmq: false,
    waha: false,
    evolution: false,
  });

  const [formData, setFormData] = useState<FormData>({
    defaultDomain: '',
    projectName: '',
    n8nKey: '',
    postgresKey: '',
    redisKey: '',
    minioUser: 'admin',
    minioPass: '',
    rabbitmqVhost: 'default',
    rabbitmqUser: 'admin',
    rabbitmqPass: '',
    wahaApiKey: '',
    wahaDashboardUser: 'admin',
    wahaDashboardPass: '',
    wahaDockerUser: 'devlikeapro',
    wahaDockerPass: 'docker-token',
    evolutionApiKey: '',
    evolutionServerUrl: '',
    evolutionAdvanced: true,
    evolutionVolume: '',
    n8nDbName: 'n8n',
    wahaDbName: 'wahadb',
    evolutionDbName: 'evolution',
  });

  const [outputs, setOutputs] = useState({
    schema: '',
    envEvolution: '',
    sql: '',
  });

  // Estado do Feedback
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackType, setFeedbackType] = useState<'sugestao' | 'bug' | 'elogio' | 'duvida'>('sugestao');
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [feedbackEmail, setFeedbackEmail] = useState('');
  const [sendingFeedback, setSendingFeedback] = useState(false);

  const feedbackTypes = [
    { value: 'sugestao', label: 'Sugestão', icon: Lightbulb, color: 'text-yellow-500' },
    { value: 'bug', label: 'Bug/Problema', icon: Bug, color: 'text-red-500' },
    { value: 'elogio', label: 'Elogio', icon: ThumbsUp, color: 'text-green-500' },
    { value: 'duvida', label: 'Dúvida', icon: HelpCircle, color: 'text-blue-500' },
  ];

  const handleSendFeedback = async () => {
    if (!feedbackMessage.trim()) {
      toast({
        title: "Mensagem obrigatória",
        description: "Por favor, escreva sua mensagem antes de enviar.",
        variant: "destructive",
      });
      return;
    }

    setSendingFeedback(true);
    try {
      const { error } = await (supabase as any)
        .from('feedbacks')
        .insert({
          tool_name: 'vps-generator',
          feedback_type: feedbackType,
          message: feedbackMessage,
          rating: feedbackRating > 0 ? feedbackRating : null,
          user_email: feedbackEmail || null,
          session_id: sessionStorage.getItem('session_id') || null,
        });

      if (error) throw error;

      toast({
        title: "Feedback enviado!",
        description: "Obrigado por compartilhar sua opinião. Ela é muito importante para nós!",
      });

      // Limpar formulário
      setFeedbackMessage('');
      setFeedbackRating(0);
      setFeedbackEmail('');
      setFeedbackOpen(false);
    } catch (error) {
      toast({
        title: "Erro ao enviar",
        description: "Não foi possível enviar o feedback. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setSendingFeedback(false);
    }
  };

  const generateSecureKey = () => {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  };

  const handleGenerateKeys = () => {
    const newKeys = {
      n8nKey: generateSecureKey(),
      postgresKey: generateSecureKey(),
      redisKey: generateSecureKey(),
      wahaApiKey: generateSecureKey(),
      evolutionApiKey: generateSecureKey(),
      minioPass: services.minio && formData.minioPass.length < 8 ? generateSecureKey().slice(0, 16) : formData.minioPass,
      rabbitmqPass: services.rabbitmq && formData.rabbitmqPass.length < 8 ? generateSecureKey().slice(0, 16) : formData.rabbitmqPass,
      wahaDashboardPass: services.waha && formData.wahaDashboardPass.length < 8 ? generateSecureKey().slice(0, 16) : formData.wahaDashboardPass,
    };

    setFormData(prev => ({ ...prev, ...newKeys }));
    setKeysGenerated(true);

    toast({
      title: "Chaves geradas!",
      description: "Todas as chaves de segurança foram geradas com sucesso.",
    });
  };

  const updateFormData = (field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const normalizeKebab = (s: string) => s.toLowerCase().replace(/\s+/g, '-');
  const normalizeDb = (s: string) => s.toLowerCase().replace(/\s+/g, '_');

  const createPostgresService = () => ({
    type: "postgres",
    data: {
      projectName: "__PROJECT_NAME__",
      serviceName: "postgres",
      image: "pgvector/pgvector:pg17",
      password: "__POSTGRES_KEY__"
    }
  });

  const createRedisService = () => ({
    type: "redis",
    data: {
      projectName: "__PROJECT_NAME__",
      serviceName: "redis",
      image: "redis:7",
      password: "__REDIS_KEY__"
    }
  });

  const createN8nServices = () => {
    const baseEnv = `# === CONFIGURAÇÃO DO BANCO DE DADOS ===
DB_TYPE=postgresdb
DB_POSTGRESDB_PORT=5432
DB_POSTGRESDB_HOST=postgres
DB_POSTGRESDB_DATABASE=__N8N_DB__
DB_POSTGRESDB_USER=postgres
DB_POSTGRESDB_PASSWORD=__POSTGRES_KEY__

# === SEGURANÇA E CRIPTOGRAFIA ===
N8N_ENCRYPTION_KEY=__N8N_KEY__

# === URLS E HOSTS DE ACESSO ===
N8N_HOST=__PROJECT_NAME__-n8n-editor.__DEFAULT_DOMAIN__
N8N_EDITOR_BASE_URL=https://__PROJECT_NAME__-n8n-editor.__DEFAULT_DOMAIN__
N8N_PROTOCOL=https
WEBHOOK_URL=https://__PROJECT_NAME__-n8n-webhook.__DEFAULT_DOMAIN__

# === MODO DE EXECUÇÃO E FILA ===
NODE_ENV=production
EXECUTIONS_MODE=queue
QUEUE_BULL_REDIS_HOST=redis
QUEUE_BULL_REDIS_PASSWORD=__REDIS_KEY__
QUEUE_BULL_REDIS_PORT=6379
QUEUE_BULL_REDIS_DB=2

# === PERMISSÕES DE SEGURANÇA ===
NODE_FUNCTION_ALLOW_BUILTIN=*
NODE_FUNCTION_ALLOW_EXTERNAL=moment,lodash,crypto-js

# === PACOTES DA COMUNIDADE ===
N8N_COMMUNITY_PACKAGES_ENABLED=true
N8N_REINSTALL_MISSING_PACKAGES=true

# === LIMPEZA E MANUTENÇÃO ===
EXECUTIONS_DATA_PRUNE=true
EXECUTIONS_DATA_MAX_AGE=336

# === CONFIGURAÇÕES REGIONAIS ===
GENERIC_TIMEZONE=America/Sao_Paulo
OFFLOAD_MANUAL_EXECUTIONS_TO_WORKERS=true`;

    return [
      {
        type: "app",
        data: {
          projectName: "__PROJECT_NAME__",
          serviceName: "n8n_editor",
          source: { type: "image", image: "n8nio/n8n:latest" },
          env: baseEnv,
          deploy: { replicas: 1, command: "n8n start", zeroDowntime: true },
          domains: [{
            host: "__PROJECT_NAME__-n8n-editor.__DEFAULT_DOMAIN__",
            https: true, port: 5678, path: "/", wildcard: false, internalProtocol: "http"
          }]
        }
      },
      {
        type: "app",
        data: {
          projectName: "__PROJECT_NAME__",
          serviceName: "n8n_webhook",
          source: { type: "image", image: "n8nio/n8n:latest" },
          env: baseEnv,
          deploy: { replicas: 2, command: "n8n webhook", zeroDowntime: true },
          domains: [{
            host: "__PROJECT_NAME__-n8n-webhook.__DEFAULT_DOMAIN__",
            https: true, port: 5678, path: "/", wildcard: false, internalProtocol: "http"
          }]
        }
      },
      {
        type: "app",
        data: {
          projectName: "__PROJECT_NAME__",
          serviceName: "n8n_worker",
          source: { type: "image", image: "n8nio/n8n:latest" },
          env: baseEnv + "\nN8N_DISABLE_UI=true",
          deploy: { replicas: 1, command: "n8n worker --concurrency=10", zeroDowntime: true },
          domains: []
        }
      },
      {
        type: "app",
        data: {
          projectName: "__PROJECT_NAME__",
          serviceName: "n8n_webhook_2",
          source: { type: "image", image: "n8nio/n8n:latest" },
          env: baseEnv + "\nN8N_DISABLE_UI=true",
          deploy: { replicas: 1, command: "n8n webhook", zeroDowntime: true },
          domains: [{
            host: "__PROJECT_NAME__-n8n-webhook.__DEFAULT_DOMAIN__",
            https: true, port: 5678, path: "/mcp", wildcard: false, internalProtocol: "http"
          }]
        }
      }
    ];
  };

  const createMinioService = () => ({
    type: "app",
    data: {
      projectName: "__PROJECT_NAME__",
      serviceName: "minio",
      source: { type: "image", image: "minio/minio:RELEASE.2024-11-07T00-52-20Z" },
      env: `MINIO_SERVER_URL=https://s3.__PROJECT_NAME__-minio.__DEFAULT_DOMAIN__/
MINIO_BROWSER_REDIRECT_URL=https://console-__PROJECT_NAME__-minio.__DEFAULT_DOMAIN__/
MINIO_ROOT_USER=__MINIO_USER__
MINIO_ROOT_PASSWORD=__MINIO_PASS__`,
      deploy: { replicas: 1, command: "minio server /data --console-address \":9001\"", zeroDowntime: true },
      domains: [
        { host: "console-__PROJECT_NAME__-minio.__DEFAULT_DOMAIN__", https: true, port: 9001, path: "/", wildcard: false, internalProtocol: "http" },
        { host: "s3.__PROJECT_NAME__-minio.__DEFAULT_DOMAIN__", https: true, port: 9000, path: "/", wildcard: false, internalProtocol: "http" }
      ],
      mounts: [{ type: "volume", name: "__PROJECT_NAME___minio_data", mountPath: "/data" }]
    }
  });

  const createRabbitmqService = () => ({
    type: "app",
    data: {
      projectName: "__PROJECT_NAME__",
      serviceName: "rabbitmq",
      source: { type: "image", image: "rabbitmq:3-management" },
      env: `RABBITMQ_DEFAULT_VHOST=__RABBITMQ_VHOST__
RABBITMQ_DEFAULT_USER=__RABBITMQ_USER__
RABBITMQ_DEFAULT_PASS=__RABBITMQ_PASS__`,
      deploy: { replicas: 1, command: null, zeroDowntime: true },
      domains: [{ host: "__PROJECT_NAME__-rabbitmq.__DEFAULT_DOMAIN__", https: true, port: 15672, path: "/", wildcard: false, internalProtocol: "http" }]
    }
  });

  const createWahaService = () => ({
    type: "app",
    data: {
      projectName: "__PROJECT_NAME__",
      serviceName: "waha",
      source: {
        type: "image",
        image: "devlikeapro/waha-plus:gows",
        username: "__WAHA_DOCKER_USER__",
        password: "__WAHA_DOCKER_PASS__"
      },
      env: `PORT=3000
WHATSAPP_API_HOSTNAME=__PROJECT_NAME__-waha.__DEFAULT_DOMAIN__
WHATSAPP_API_SCHEMA=https
WAHA_BASE_URL=https://__PROJECT_NAME__-waha.__DEFAULT_DOMAIN__
TZ=America/Sao_Paulo
WAHA_API_KEY=__WAHA_API_KEY__
WAHA_API_KEY_PLAIN=__WAHA_API_KEY__
WHATSAPP_SESSIONS_POSTGRESQL_URL=postgres://postgres:__POSTGRES_KEY__@postgres:5432/__WAHA_DB__?sslmode=disable
WAHA_DASHBOARD_USERNAME=__WAHA_DASHBOARD_USER__
WAHA_DASHBOARD_PASSWORD=__WAHA_DASHBOARD_PASS__
WHATSAPP_SWAGGER_ENABLED=false
WHATSAPP_SWAGGER_USERNAME=__WAHA_DASHBOARD_USER__
WHATSAPP_SWAGGER_PASSWORD=__WAHA_DASHBOARD_PASS__
WAHA_RESTART_ALL_SESSIONS=true
WAHA_AUTO_START_DELAY_SECONDS=5
WHATSAPP_DEFAULT_ENGINE=GOWS
WAHA_APPS_ENABLED=true
REDIS_URL=redis://:__REDIS_KEY__@redis:6379
WAHA_APPS_JOBS_CONCURRENCY=5
WAHA_APPS_JOBS_REMOVE_ON_COMPLETE_AGE=259200
WAHA_APPS_JOBS_REMOVE_ON_COMPLETE_COUNT=1000
WAHA_APPS_JOBS_REMOVE_ON_FAIL_AGE=2678400
WAHA_APPS_JOBS_REMOVE_ON_FAIL_COUNT=1000`,
      deploy: { replicas: 1, command: null, zeroDowntime: true },
      domains: [{ host: "__PROJECT_NAME__-waha.__DEFAULT_DOMAIN__", https: true, port: 3000, path: "/", wildcard: false, internalProtocol: "http" }]
    }
  });

  const createEvolutionService = (data: FormData, projectName: string) => {
    const serverUrl = data.evolutionServerUrl || `https://${projectName}-evolution.__DEFAULT_DOMAIN__`;

    let envTemplate = '';

    if (data.evolutionAdvanced) {
      const rabbitEnabled = services.rabbitmq ? 'true' : 'false';
      const rabbitUri = services.rabbitmq
        ? 'amqp://__RABBITMQ_USER__:__RABBITMQ_PASS__@rabbitmq:5672/__RABBITMQ_VHOST__'
        : 'amqp://localhost';

      const s3Enabled = services.minio ? 'true' : 'false';
      const s3Endpoint = services.minio ? 'minio' : 's3.amazonaws.com';
      const s3Port = services.minio ? '9000' : '443';
      const s3UseSsl = services.minio ? 'false' : 'true';
      const s3Access = services.minio ? '__MINIO_USER__' : '';
      const s3Secret = services.minio ? '__MINIO_PASS__' : '';

      envTemplate = `SERVER_TYPE=http
SERVER_PORT=8080
SERVER_URL=${serverUrl}

TELEMETRY=false

DATABASE_ENABLED=true
DATABASE_PROVIDER=postgresql
DATABASE_CONNECTION_URI=postgresql://postgres:__POSTGRES_KEY__@postgres:5432/__EVOLUTION_DB__
DATABASE_CONNECTION_CLIENT_NAME=evolution
DATABASE_SAVE_DATA_INSTANCE=true
DATABASE_SAVE_DATA_NEW_MESSAGE=true
DATABASE_SAVE_MESSAGE_UPDATE=true
DATABASE_SAVE_DATA_CONTACTS=true
DATABASE_SAVE_DATA_CHATS=true
DATABASE_SAVE_DATA_LABELS=true
DATABASE_SAVE_DATA_HISTORIC=true

CACHE_REDIS_ENABLED=true
CACHE_REDIS_URI=redis://:__REDIS_KEY__@redis:6379/6
CACHE_REDIS_PREFIX_KEY=evolution
CACHE_REDIS_SAVE_INSTANCES=false
CACHE_LOCAL_ENABLED=false

RABBITMQ_ENABLED=${rabbitEnabled}
RABBITMQ_URI=${rabbitUri}

S3_ENABLED=${s3Enabled}
S3_ACCESS_KEY=${s3Access}
S3_SECRET_KEY=${s3Secret}
S3_BUCKET=evolution
S3_PORT=${s3Port}
S3_ENDPOINT=${s3Endpoint}
S3_USE_SSL=${s3UseSsl}

AUTHENTICATION_API_KEY=__EVOLUTION_API_KEY__
AUTHENTICATION_EXPOSE_IN_FETCH_INSTANCES=false

LANGUAGE=pt_BR
LOG_LEVEL=ERROR,WARN,INFO,LOG`;
    } else {
      envTemplate = `SERVER_TYPE=http
SERVER_PORT=8080
SERVER_URL=${serverUrl}
AUTHENTICATION_API_KEY=__EVOLUTION_API_KEY__`;
    }

    const volumeName = data.evolutionVolume || `${projectName}_evolution_instances`;

    const service = {
      type: "app",
      data: {
        projectName: "__PROJECT_NAME__",
        serviceName: "evolution_api",
        source: { type: "image", image: "evoapicloud/evolution-api:latest" },
        env: envTemplate,
        deploy: { replicas: 1, command: null, zeroDowntime: true },
        domains: [{
          host: "__PROJECT_NAME__-evolution.__DEFAULT_DOMAIN__",
          https: true,
          port: 8080,
          path: "/",
          wildcard: false,
          internalProtocol: "http"
        }],
        mounts: [
          { type: "volume", name: volumeName, mountPath: "/evolution/instances" }
        ]
      }
    };

    return { service, envTemplate };
  };

  const replacePlaceholders = (text: string, data: FormData, projectName: string) => {
    const replacements: Record<string, string> = {
      '__PROJECT_NAME__': projectName,
      '__DEFAULT_DOMAIN__': data.defaultDomain,
      '__POSTGRES_KEY__': data.postgresKey,
      '__REDIS_KEY__': data.redisKey,
      '__N8N_KEY__': data.n8nKey,
      '__MINIO_USER__': data.minioUser,
      '__MINIO_PASS__': data.minioPass,
      '__RABBITMQ_VHOST__': data.rabbitmqVhost,
      '__RABBITMQ_USER__': data.rabbitmqUser,
      '__RABBITMQ_PASS__': data.rabbitmqPass,
      '__WAHA_API_KEY__': data.wahaApiKey,
      '__WAHA_DASHBOARD_USER__': data.wahaDashboardUser,
      '__WAHA_DASHBOARD_PASS__': data.wahaDashboardPass,
      '__WAHA_DOCKER_USER__': data.wahaDockerUser,
      '__WAHA_DOCKER_PASS__': data.wahaDockerPass,
      '__EVOLUTION_API_KEY__': data.evolutionApiKey,
      '__N8N_DB__': normalizeDb(data.n8nDbName),
      '__WAHA_DB__': normalizeDb(data.wahaDbName),
      '__EVOLUTION_DB__': normalizeDb(data.evolutionDbName),
    };

    let result = text;
    for (const [placeholder, value] of Object.entries(replacements)) {
      result = result.split(placeholder).join(value);
    }
    return result;
  };

  const generateSqlScripts = (data: FormData) => {
    const sections = [];

    if (services.n8n) {
      sections.push(`-- Banco de dados do n8n
CREATE DATABASE ${normalizeDb(data.n8nDbName)};`);
    }

    if (services.waha) {
      sections.push(`-- Banco de dados do WAHA
CREATE DATABASE ${normalizeDb(data.wahaDbName)};`);
    }

    if (services.evolution) {
      sections.push(`-- Banco de dados da Evolution API v2
CREATE DATABASE ${normalizeDb(data.evolutionDbName)};`);
    }

    if (!sections.length) return '';

    const header = `-- Scripts SQL básicos para PostgreSQL
-- Estes comandos criam apenas os bancos. As tabelas serão criadas
-- pelas próprias aplicações (migrations / ORM) ao subir os serviços.

`;
    return header + sections.join('\n\n') + '\n';
  };

  const handleGenerateSchema = () => {
    if (!formData.defaultDomain.trim() || !formData.projectName.trim()) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha o domínio principal e o nome do projeto.",
        variant: "destructive",
      });
      return;
    }

    // Prepare data with keys (generate if missing)
    let currentData = { ...formData };

    if (!keysGenerated) {
      const newKeys = {
        n8nKey: generateSecureKey(),
        postgresKey: generateSecureKey(),
        redisKey: generateSecureKey(),
        wahaApiKey: generateSecureKey(),
        evolutionApiKey: generateSecureKey(),
        minioPass: services.minio && formData.minioPass.length < 8 ? generateSecureKey().slice(0, 16) : formData.minioPass,
        rabbitmqPass: services.rabbitmq && formData.rabbitmqPass.length < 8 ? generateSecureKey().slice(0, 16) : formData.rabbitmqPass,
        wahaDashboardPass: services.waha && formData.wahaDashboardPass.length < 8 ? generateSecureKey().slice(0, 16) : formData.wahaDashboardPass,
      };

      currentData = { ...currentData, ...newKeys };
      setFormData(currentData);
      setKeysGenerated(true);

      toast({
        title: "Chaves geradas!",
        description: "Todas as chaves de segurança foram geradas automaticamente.",
      });
    }

    setIsLoading(true);

    setTimeout(() => {
      try {
        const projectName = normalizeKebab(currentData.projectName);
        const servicesList = [];
        let evolutionEnvTemplate = null;

        // Use currentData instead of formData to ensure we have the latest keys
        const dataToUse = currentData;

        // Pass dataToUse to service creators
        // Note: We need to update the service creator functions to accept data as argument
        // OR rely on replacePlaceholders using dataToUse.
        // Looking at the code:
        // createPostgresService uses: plain object return with placeholders
        // createN8nServices uses: plain object return with placeholders
        // createEvolutionService uses: (data: FormData, projectName: string) -> This one works if we pass dataToUse

        servicesList.push(createPostgresService());
        servicesList.push(createRedisService());

        if (services.n8n) {
          servicesList.push(...createN8nServices());
        }

        if (services.minio) {
          servicesList.push(createMinioService());
        }

        if (services.rabbitmq) {
          servicesList.push(createRabbitmqService());
        }

        if (services.waha) {
          servicesList.push(createWahaService());
        }

        if (services.evolution) {
          const evo = createEvolutionService(dataToUse, projectName);
          servicesList.push(evo.service);
          evolutionEnvTemplate = evo.envTemplate;
        }

        const schema = { services: servicesList };
        let schemaString = JSON.stringify(schema, null, 2);
        // CRITICAL: Use dataToUse (local variable with new keys) for replacement
        schemaString = replacePlaceholders(schemaString, dataToUse, projectName);

        let envEvolution = '';
        if (evolutionEnvTemplate) {
          envEvolution = replacePlaceholders(evolutionEnvTemplate, dataToUse, projectName);
        }

        let sql = '';
        if (generateSql) {
          sql = generateSqlScripts(dataToUse);
        }

        setOutputs({ schema: schemaString, envEvolution, sql });
        setSchemaGenerated(true);
        setIsLoading(false);

        toast({
          title: "Esquema gerado!",
          description: "O esquema foi gerado com sucesso. Copie e cole no EasyPanel.",
        });
      } catch (error) {
        console.error(error);
        setIsLoading(false);
        toast({
          title: "Erro",
          description: "Ocorreu um erro ao gerar o esquema.",
          variant: "destructive",
        });
      }
    }, 1200);
  };

  const copyToClipboard = async (text: string, label: string) => {
    if (!text) {
      toast({
        title: "Nada para copiar",
        description: "O conteúdo está vazio.",
        variant: "destructive",
      });
      return;
    }

    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copiado!",
        description: `${label} copiado para a área de transferência.`,
      });
    } catch (err) {
      // Fallback para navegadores mais antigos
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-9999px';
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        toast({
          title: "Copiado!",
          description: `${label} copiado para a área de transferência.`,
        });
      } catch (e) {
        toast({
          title: "Erro ao copiar",
          description: "Não foi possível copiar. Tente selecionar e copiar manualmente.",
          variant: "destructive",
        });
      }
      document.body.removeChild(textArea);
    }
  };

  const downloadFile = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const buildKeysText = () => {
    const projectName = normalizeKebab(formData.projectName);
    const lines = [];

    lines.push('=== Dados do projeto ===');
    lines.push(`Domínio principal: ${formData.defaultDomain}`);
    lines.push(`Nome do projeto: ${projectName}`);
    lines.push('');

    lines.push('=== Postgres ===');
    lines.push(`Host: postgres`);
    lines.push(`Usuário: postgres`);
    lines.push(`Senha: ${formData.postgresKey || '(não gerada)'}`);
    lines.push(`DB n8n: ${normalizeDb(formData.n8nDbName)}`);
    lines.push(`DB WAHA: ${normalizeDb(formData.wahaDbName)}`);
    lines.push(`DB Evolution: ${normalizeDb(formData.evolutionDbName)}`);
    lines.push('');

    lines.push('=== Redis ===');
    lines.push(`Host: redis`);
    lines.push(`Senha: ${formData.redisKey || '(não gerada)'}`);
    lines.push('');

    lines.push('=== n8n ===');
    lines.push(`N8N_ENCRYPTION_KEY: ${formData.n8nKey || '(não gerada)'}`);
    lines.push('');

    if (services.minio) {
      lines.push('=== Minio ===');
      lines.push(`Usuário: ${formData.minioUser}`);
      lines.push(`Senha: ${formData.minioPass}`);
      lines.push('');
    }

    if (services.rabbitmq) {
      lines.push('=== RabbitMQ ===');
      lines.push(`VHOST: ${formData.rabbitmqVhost}`);
      lines.push(`Usuário: ${formData.rabbitmqUser}`);
      lines.push(`Senha: ${formData.rabbitmqPass}`);
      lines.push('');
    }

    if (services.waha) {
      lines.push('=== WAHA ===');
      lines.push(`API Key: ${formData.wahaApiKey}`);
      lines.push(`Dashboard usuário: ${formData.wahaDashboardUser}`);
      lines.push(`Dashboard senha: ${formData.wahaDashboardPass}`);
      lines.push(`Docker usuário: ${formData.wahaDockerUser}`);
      lines.push(`Docker senha: ${formData.wahaDockerPass}`);
      lines.push('');
    }

    if (services.evolution) {
      lines.push('=== Evolution API v2 ===');
      lines.push(`API Key: ${formData.evolutionApiKey}`);
      lines.push(`Banco: ${normalizeDb(formData.evolutionDbName)}`);
      lines.push('');
    }

    return lines.join('\n');
  };

  const downloadZip = async () => {
    const projectSlug = normalizeKebab(formData.projectName) || 'vps';

    // Simples download individual já que JSZip não está disponível
    if (outputs.schema) downloadFile(outputs.schema, `schema-${projectSlug}.json`);
    if (outputs.envEvolution) downloadFile(outputs.envEvolution, `evolution-${projectSlug}.env`);
    if (outputs.sql) downloadFile(outputs.sql, `databases-${projectSlug}.sql`);
    downloadFile(buildKeysText(), `keys-${projectSlug}.txt`);

    toast({
      title: "Arquivos baixados!",
      description: "Todos os arquivos foram baixados individualmente.",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Background gradients */}
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_10%_15%,rgba(168,85,247,0.10)_0%,transparent_45%),radial-gradient(circle_at_90%_10%,rgba(37,99,235,0.10)_0%,transparent_45%),radial-gradient(circle_at_85%_90%,rgba(168,85,247,0.08)_0%,transparent_50%)]" />

      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="mb-8">
          <Button
            variant="outline"
            onClick={() => navigate('/')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar ao site
          </Button>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Zap className="h-4 w-4" />
              <span>Tecnologia que flui com o seu negócio</span>
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-purple-500 to-blue-600 bg-clip-text text-transparent">
              Vibe Flow
            </h1>
            <p className="text-xl font-semibold text-foreground">
              Transformando ideias em soluções digitais.
            </p>
            <p className="text-muted-foreground">
              Configure os serviços e gere o esquema para sua VPS com rapidez e segurança.
            </p>
          </div>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Gerador de Esquema VPS
            </CardTitle>
            <CardDescription>
              Configure os serviços e gere o esquema para EasyPanel
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Passo a passo EasyPanel */}
            <Card className="bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2 text-blue-700 dark:text-blue-300">
                  <BookOpen className="h-5 w-5" />
                  Passo a passo no EasyPanel
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-3 text-blue-900 dark:text-blue-100">
                <div className="grid gap-3 sm:grid-cols-2 mb-3 p-3 rounded-lg bg-blue-100/50 dark:bg-blue-900/30">
                  <div>
                    <p className="text-xs font-medium opacity-70 mb-1">📍 Onde encontrar o domínio:</p>
                    <p className="text-xs">URL que você acessa o EasyPanel (ex: meuvps.easypanel.host → use seu domínio próprio)</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium opacity-70 mb-1">📍 Onde encontrar o nome do projeto:</p>
                    <p className="text-xs">Na tela de Projetos, é o nome exibido (ex: "assistente_automotivo", "cashflow")</p>
                  </div>
                </div>
                <p className="font-medium">Siga estes passos após gerar o esquema:</p>
                <ol className="list-decimal list-inside space-y-2 ml-2">
                  <li>Acesse seu <strong>EasyPanel</strong> (ex: seuprojeto.easypanel.host)</li>
                  <li>Na tela de <span className="font-mono bg-blue-100 dark:bg-blue-900 px-1 rounded">Projetos</span>, clique no seu projeto ou crie um novo</li>
                  <li>Dentro do projeto, clique no botão <span className="font-mono bg-blue-100 dark:bg-blue-900 px-1 rounded">+ Serviço</span></li>
                  <li>Vá na aba <span className="font-mono bg-blue-100 dark:bg-blue-900 px-1 rounded">Personalizado</span></li>
                  <li>Clique em <span className="font-mono bg-blue-100 dark:bg-blue-900 px-1 rounded">Criar a partir do Esquema</span></li>
                  <li>Cole o JSON gerado e confirme</li>
                  <li>Aguarde todos os serviços iniciarem</li>
                </ol>
                <div className="mt-3 pt-3 border-t border-blue-200 dark:border-blue-800">
                  <p className="text-xs opacity-80">
                    <strong>Dica:</strong> Para alterar credenciais do painel, clique no ícone de <span className="font-mono bg-blue-100 dark:bg-blue-900 px-1 rounded">⚙️ Configurações</span> no menu lateral esquerdo e acesse <span className="font-mono bg-blue-100 dark:bg-blue-900 px-1 rounded">Autenticação</span>.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Campos principais */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="defaultDomain">Domínio principal *</Label>
                <Input
                  id="defaultDomain"
                  placeholder="exemplo.com.br"
                  value={formData.defaultDomain}
                  onChange={(e) => updateFormData('defaultDomain', e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  💡 Seu domínio onde os serviços serão acessados (ex: n8n.exemplo.com.br)
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="projectName">Nome do projeto *</Label>
                <Input
                  id="projectName"
                  placeholder="meu-projeto"
                  value={formData.projectName}
                  onChange={(e) => updateFormData('projectName', e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  💡 Mesmo nome do projeto no EasyPanel (visível na tela de Projetos)
                </p>
              </div>
            </div>

            {/* Serviços */}
            <Card className="bg-muted/30">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Selecione os serviços</CardTitle>
                <CardDescription>Cada serviço será criado automaticamente no EasyPanel</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-3 rounded-lg bg-background hover:bg-muted/50 transition-colors">
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id="service-n8n"
                      checked={services.n8n}
                      onCheckedChange={(checked) => setServices(prev => ({ ...prev, n8n: checked as boolean }))}
                    />
                    <Label htmlFor="service-n8n" className="font-semibold cursor-pointer">
                      Stack n8n completa
                    </Label>
                  </div>
                  {services.n8n && (
                    <div className="mt-2 ml-7 text-xs text-muted-foreground bg-muted/50 p-2 rounded">
                      <Info className="h-3 w-3 inline mr-1" />
                      <strong>No EasyPanel:</strong> Cria Editor, Webhook, Worker e Webhook MCP. Acesse em
                      <span className="font-mono"> [projeto]-n8n-editor.[domínio]</span>
                    </div>
                  )}
                </div>

                <div className="p-3 rounded-lg bg-background hover:bg-muted/50 transition-colors">
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id="service-minio"
                      checked={services.minio}
                      onCheckedChange={(checked) => setServices(prev => ({ ...prev, minio: checked as boolean }))}
                    />
                    <Label htmlFor="service-minio" className="font-semibold cursor-pointer">
                      Minio (armazenamento S3)
                    </Label>
                  </div>
                  {services.minio && (
                    <div className="mt-2 ml-7 text-xs text-muted-foreground bg-muted/50 p-2 rounded">
                      <Info className="h-3 w-3 inline mr-1" />
                      <strong>No EasyPanel:</strong> Console em <span className="font-mono">console-[projeto]-minio.[domínio]</span>.
                      Crie um bucket chamado <span className="font-mono">evolution</span> para a Evolution API.
                    </div>
                  )}
                </div>

                <div className="p-3 rounded-lg bg-background hover:bg-muted/50 transition-colors">
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id="service-rabbitmq"
                      checked={services.rabbitmq}
                      onCheckedChange={(checked) => setServices(prev => ({ ...prev, rabbitmq: checked as boolean }))}
                    />
                    <Label htmlFor="service-rabbitmq" className="font-semibold cursor-pointer">
                      RabbitMQ
                    </Label>
                  </div>
                  {services.rabbitmq && (
                    <div className="mt-2 ml-7 text-xs text-muted-foreground bg-muted/50 p-2 rounded">
                      <Info className="h-3 w-3 inline mr-1" />
                      <strong>No EasyPanel:</strong> Painel de gerenciamento em
                      <span className="font-mono"> [projeto]-rabbitmq.[domínio]</span>. Use para filas de mensagens entre serviços.
                    </div>
                  )}
                </div>

                <div className="p-3 rounded-lg bg-background hover:bg-muted/50 transition-colors">
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id="service-waha"
                      checked={services.waha}
                      onCheckedChange={(checked) => setServices(prev => ({ ...prev, waha: checked as boolean }))}
                    />
                    <Label htmlFor="service-waha" className="font-semibold cursor-pointer">
                      WAHA (WhatsApp API)
                    </Label>
                  </div>
                  {services.waha && (
                    <div className="mt-2 ml-7 text-xs text-muted-foreground bg-muted/50 p-2 rounded">
                      <Info className="h-3 w-3 inline mr-1" />
                      <strong>No EasyPanel:</strong> API em <span className="font-mono">[projeto]-waha.[domínio]</span>.
                      Dashboard com usuário/senha configurados. Requer licença WAHA Pro.
                    </div>
                  )}
                </div>

                <div className="p-3 rounded-lg bg-background hover:bg-muted/50 transition-colors">
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id="service-evolution"
                      checked={services.evolution}
                      onCheckedChange={(checked) => setServices(prev => ({ ...prev, evolution: checked as boolean }))}
                    />
                    <Label htmlFor="service-evolution" className="font-semibold cursor-pointer">
                      Evolution API v2 (WhatsApp)
                    </Label>
                  </div>
                  {services.evolution && (
                    <div className="mt-2 ml-7 text-xs text-muted-foreground bg-muted/50 p-2 rounded">
                      <Info className="h-3 w-3 inline mr-1" />
                      <strong>No EasyPanel:</strong> API em <span className="font-mono">[projeto]-evolution.[domínio]</span>.
                      Configure o .env após o deploy. Use a API Key gerada para autenticação.
                    </div>
                  )}
                </div>

                {/* Configurações avançadas */}
                <Collapsible open={isAdvancedOpen} onOpenChange={setIsAdvancedOpen}>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" className="w-full justify-start text-blue-600 hover:text-blue-700">
                      <ChevronDown className={`h-4 w-4 mr-2 transition-transform ${isAdvancedOpen ? 'rotate-180' : ''}`} />
                      ⚙️ Configurações avançadas (opcional)
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-4 mt-4">
                    {/* Minio Credentials */}
                    {services.minio && (
                      <Card className="border-dashed border-purple-300">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">Credenciais Minio</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="space-y-2">
                            <Label htmlFor="minioUser">Usuário admin Minio</Label>
                            <Input
                              id="minioUser"
                              placeholder="admin"
                              value={formData.minioUser}
                              onChange={(e) => updateFormData('minioUser', e.target.value)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="minioPass">Senha Minio (mín. 8 caracteres)</Label>
                            <Input
                              id="minioPass"
                              placeholder="senha123"
                              value={formData.minioPass}
                              onChange={(e) => updateFormData('minioPass', e.target.value)}
                            />
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* RabbitMQ Credentials */}
                    {services.rabbitmq && (
                      <Card className="border-dashed border-purple-300">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">Credenciais RabbitMQ</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="space-y-2">
                            <Label htmlFor="rabbitmqVhost">VHOST</Label>
                            <Input
                              id="rabbitmqVhost"
                              placeholder="default"
                              value={formData.rabbitmqVhost}
                              onChange={(e) => updateFormData('rabbitmqVhost', e.target.value)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="rabbitmqUser">Usuário</Label>
                            <Input
                              id="rabbitmqUser"
                              placeholder="admin"
                              value={formData.rabbitmqUser}
                              onChange={(e) => updateFormData('rabbitmqUser', e.target.value)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="rabbitmqPass">Senha</Label>
                            <Input
                              id="rabbitmqPass"
                              placeholder="senha123"
                              value={formData.rabbitmqPass}
                              onChange={(e) => updateFormData('rabbitmqPass', e.target.value)}
                            />
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* WAHA Credentials */}
                    {services.waha && (
                      <Card className="border-dashed border-purple-300">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">Credenciais WAHA</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="space-y-2">
                            <Label htmlFor="wahaDashboardUser">Usuário do dashboard</Label>
                            <Input
                              id="wahaDashboardUser"
                              placeholder="admin"
                              value={formData.wahaDashboardUser}
                              onChange={(e) => updateFormData('wahaDashboardUser', e.target.value)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="wahaDashboardPass">Senha do dashboard</Label>
                            <Input
                              id="wahaDashboardPass"
                              placeholder="senha123"
                              value={formData.wahaDashboardPass}
                              onChange={(e) => updateFormData('wahaDashboardPass', e.target.value)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="wahaDockerUser">Docker username</Label>
                            <Input
                              id="wahaDockerUser"
                              placeholder="devlikeapro"
                              value={formData.wahaDockerUser}
                              onChange={(e) => updateFormData('wahaDockerUser', e.target.value)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="wahaDockerPass">Docker password</Label>
                            <Input
                              id="wahaDockerPass"
                              placeholder="docker-token"
                              value={formData.wahaDockerPass}
                              onChange={(e) => updateFormData('wahaDockerPass', e.target.value)}
                            />
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Evolution Credentials */}
                    {services.evolution && (
                      <Card className="border-dashed border-purple-300">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">Configurações Evolution</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="flex items-center space-x-3 p-2 rounded-lg bg-muted/50">
                            <Checkbox
                              id="evolutionAdvanced"
                              checked={formData.evolutionAdvanced}
                              onCheckedChange={(checked) => updateFormData('evolutionAdvanced', checked as boolean)}
                            />
                            <Label htmlFor="evolutionAdvanced" className="cursor-pointer text-sm">
                              Modo avançado (usar Redis, banco, S3, RabbitMQ)
                            </Label>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="evolutionServerUrl">URL pública da Evolution API (opcional)</Label>
                            <Input
                              id="evolutionServerUrl"
                              placeholder="https://api.meudominio.com"
                              value={formData.evolutionServerUrl}
                              onChange={(e) => updateFormData('evolutionServerUrl', e.target.value)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="evolutionVolume">Volume da Evolution API (instâncias)</Label>
                            <Input
                              id="evolutionVolume"
                              placeholder="ex: meu-projeto_evolution_instances"
                              value={formData.evolutionVolume}
                              onChange={(e) => updateFormData('evolutionVolume', e.target.value)}
                            />
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Bancos de dados */}
                    <Card className="bg-muted/30">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Bancos de dados (opcional)</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="space-y-2">
                          <Label htmlFor="n8nDbName">Nome do banco do n8n</Label>
                          <Input
                            id="n8nDbName"
                            placeholder="n8n"
                            value={formData.n8nDbName}
                            onChange={(e) => updateFormData('n8nDbName', e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="wahaDbName">Nome do banco do WAHA</Label>
                          <Input
                            id="wahaDbName"
                            placeholder="wahadb"
                            value={formData.wahaDbName}
                            onChange={(e) => updateFormData('wahaDbName', e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="evolutionDbName">Nome do banco da Evolution</Label>
                          <Input
                            id="evolutionDbName"
                            placeholder="evolution"
                            value={formData.evolutionDbName}
                            onChange={(e) => updateFormData('evolutionDbName', e.target.value)}
                          />
                        </div>
                      </CardContent>
                    </Card>

                    {/* Gerar SQL */}
                    <div className="flex items-center space-x-3 p-3 rounded-lg bg-background hover:bg-muted/50 transition-colors">
                      <Checkbox
                        id="generateSql"
                        checked={generateSql}
                        onCheckedChange={(checked) => setGenerateSql(checked as boolean)}
                      />
                      <Label htmlFor="generateSql" className="font-semibold cursor-pointer">
                        Gerar scripts SQL dos bancos (PostgreSQL)
                      </Label>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </CardContent>
            </Card>

            {/* Botões de ação */}
            <div className="space-y-3">
              <Button
                variant="outline"
                className="w-full"
                onClick={handleGenerateKeys}
              >
                <Key className="h-4 w-4 mr-2" />
                Gerar keys aleatórias
              </Button>

              {/* Keys geradas */}
              {keysGenerated && (
                <Card className="bg-background">
                  <CardContent className="pt-4 space-y-3">
                    <div className="space-y-2">
                      <Label className="text-muted-foreground text-xs">N8N Encryption Key</Label>
                      <Input value={formData.n8nKey} readOnly className="font-mono text-xs" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-muted-foreground text-xs">Postgres Password</Label>
                      <Input value={formData.postgresKey} readOnly className="font-mono text-xs" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-muted-foreground text-xs">Redis Password</Label>
                      <Input value={formData.redisKey} readOnly className="font-mono text-xs" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-muted-foreground text-xs">WAHA API Key</Label>
                      <Input value={formData.wahaApiKey} readOnly className="font-mono text-xs" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-muted-foreground text-xs">Evolution API – Authentication Key</Label>
                      <Input value={formData.evolutionApiKey} readOnly className="font-mono text-xs" />
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full text-green-600 border-green-300 hover:bg-green-50"
                      onClick={() => downloadFile(buildKeysText(), `keys-${normalizeKebab(formData.projectName) || 'vps'}.txt`)}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Baixar keys (.txt)
                    </Button>
                  </CardContent>
                </Card>
              )}

              <Button
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-lg"
                onClick={handleGenerateSchema}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Gerando esquema...
                  </>
                ) : (
                  <>
                    <Rocket className="h-4 w-4 mr-2" />
                    Gerar esquema
                  </>
                )}
              </Button>
            </div>

            {/* Outputs */}
            {schemaGenerated && (
              <div className="space-y-6">

                {/* Deployment Guide - NEW */}
                <Card className="border-l-4 border-l-blue-500 bg-blue-50/50">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-blue-700 text-lg">
                      <Lightbulb className="h-5 w-5" />
                      Guia de Deploy Passo a Passo (LEIA ISTO!)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex gap-3">
                      <div className="flex-none flex items-center justify-center w-8 h-8 rounded-full bg-blue-200 text-blue-800 font-bold">1</div>
                      <div>
                        <h4 className="font-bold text-base text-blue-900">Crie os Bancos de Dados (Manual e Obrigatório)</h4>
                        <p className="text-sm text-blue-800/80 mt-1">
                          O serviço Postgres do EasyPanel inicia vazio. Você <strong>PRECISA</strong> criar os bancos manualmente ou as aplicações vão falhar com erro <code>database does not exist</code>.
                        </p>
                        <div className="mt-2 bg-white/50 p-2 rounded border border-blue-200 text-xs font-mono text-blue-900">
                          CREATE DATABASE {normalizeDb(formData.n8nDbName || 'n8n')};<br />
                          CREATE DATABASE {normalizeDb(formData.wahaDbName || 'wahadb')};<br />
                          CREATE DATABASE {normalizeDb(formData.evolutionDbName || 'evolution')};
                        </div>
                        <p className="text-xs text-blue-800/80 mt-1">
                          👆 Rode isso no <strong>PgWeb</strong> ou <strong>DbGate</strong> dentro do serviço Postgres.
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <div className="flex-none flex items-center justify-center w-8 h-8 rounded-full bg-blue-200 text-blue-800 font-bold">2</div>
                      <div>
                        <h4 className="font-bold text-base text-blue-900">Gere e Instale o Schema</h4>
                        <p className="text-sm text-blue-800/80 mt-1">
                          Copie o JSON abaixo e use em <strong>Templates → + Create Template → Schema</strong> no EasyPanel.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="space-y-4">
                  {/* Schema */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Esquema gerado • Copie e cole no EasyPanel</CardTitle>
                      <CardDescription className="text-sm mt-2">
                        <strong>Como usar:</strong> No EasyPanel, vá em <span className="font-mono bg-muted px-1 rounded">Templates</span> →
                        clique em <span className="font-mono bg-muted px-1 rounded">+ Create Template</span> →
                        selecione <span className="font-mono bg-muted px-1 rounded">Schema</span> →
                        cole o JSON abaixo e clique em <span className="font-mono bg-muted px-1 rounded">Create</span>.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <pre className="bg-muted/50 p-4 rounded-lg overflow-auto max-h-80 text-xs font-mono">
                        {outputs.schema}
                      </pre>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => copyToClipboard(outputs.schema, 'Esquema')}
                        >
                          <Copy className="h-4 w-4 mr-2" />
                          Copiar esquema
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-green-600 border-green-300"
                          onClick={() => downloadFile(outputs.schema, `schema-${normalizeKebab(formData.projectName)}.json`)}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Baixar schema
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* .env Evolution */}
                  {outputs.envEvolution && (
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">.env da Evolution API (sugestão)</CardTitle>
                        <CardDescription className="text-sm mt-2">
                          <strong>Como usar:</strong> No EasyPanel, após criar o template, acesse o serviço
                          <span className="font-mono bg-muted px-1 rounded">evolution_api</span> →
                          clique na aba <span className="font-mono bg-muted px-1 rounded">Environment</span> →
                          substitua as variáveis de ambiente pelo conteúdo abaixo.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <pre className="bg-muted/50 p-4 rounded-lg overflow-auto max-h-80 text-xs font-mono">
                          {outputs.envEvolution}
                        </pre>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => copyToClipboard(outputs.envEvolution, '.env da Evolution')}
                          >
                            <Copy className="h-4 w-4 mr-2" />
                            Copiar .env
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-green-600 border-green-300"
                            onClick={() => downloadFile(outputs.envEvolution, `evolution-${normalizeKebab(formData.projectName)}.env`)}
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Baixar .env
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* SQL Scripts */}
                  {outputs.sql && (
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">Scripts SQL sugeridos (PostgreSQL)</CardTitle>
                        <CardDescription className="text-sm mt-2">
                          <strong>Como usar:</strong> No EasyPanel, acesse o serviço
                          <span className="font-mono bg-muted px-1 rounded">postgres</span> →
                          clique em <span className="font-mono bg-muted px-1 rounded">Terminal</span> →
                          digite <span className="font-mono bg-muted px-1 rounded">psql -U postgres</span> →
                          cole os comandos SQL abaixo para criar os bancos de dados.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <pre className="bg-muted/50 p-4 rounded-lg overflow-auto max-h-80 text-xs font-mono">
                          {outputs.sql}
                        </pre>
                        <div className="flex gap-2 flex-wrap">
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => copyToClipboard(outputs.sql, 'Scripts SQL')}
                          >
                            <Copy className="h-4 w-4 mr-2" />
                            Copiar SQL
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-green-600 border-green-300"
                            onClick={() => downloadFile(outputs.sql, `databases-${normalizeKebab(formData.projectName)}.sql`)}
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Baixar SQL
                          </Button>
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700"
                            onClick={downloadZip}
                          >
                            <Package className="h-4 w-4 mr-2" />
                            Baixar todos os arquivos
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Botão Flutuante de Feedback */}
      <Dialog open={feedbackOpen} onOpenChange={setFeedbackOpen}>
        <DialogTrigger asChild>
          <Button
            className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 p-0"
            size="icon"
          >
            <MessageCircle className="h-6 w-6" />
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-primary" />
              Deixe seu Feedback
            </DialogTitle>
            <DialogDescription>
              Sua opinião nos ajuda a melhorar! Compartilhe sugestões, reporte bugs ou deixe um elogio.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Tipo de Feedback */}
            <div className="space-y-2">
              <Label>Tipo de feedback</Label>
              <div className="grid grid-cols-2 gap-2">
                {feedbackTypes.map((type) => {
                  const Icon = type.icon;
                  return (
                    <Button
                      key={type.value}
                      variant={feedbackType === type.value ? "default" : "outline"}
                      className={cn(
                        "justify-start gap-2",
                        feedbackType === type.value && "bg-primary"
                      )}
                      onClick={() => setFeedbackType(type.value as any)}
                    >
                      <Icon className={cn("h-4 w-4", feedbackType !== type.value && type.color)} />
                      {type.label}
                    </Button>
                  );
                })}
              </div>
            </div>

            {/* Avaliação por Estrelas */}
            <div className="space-y-2">
              <Label>Avaliação (opcional)</Label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setFeedbackRating(star === feedbackRating ? 0 : star)}
                    className="p-1 hover:scale-110 transition-transform"
                  >
                    <Star
                      className={cn(
                        "h-6 w-6 transition-colors",
                        star <= feedbackRating
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-muted-foreground"
                      )}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Mensagem */}
            <div className="space-y-2">
              <Label htmlFor="feedback-message">Sua mensagem *</Label>
              <Textarea
                id="feedback-message"
                placeholder="Conte-nos o que você pensa..."
                value={feedbackMessage}
                onChange={(e) => setFeedbackMessage(e.target.value)}
                rows={4}
              />
            </div>

            {/* E-mail (opcional) */}
            <div className="space-y-2">
              <Label htmlFor="feedback-email">E-mail (opcional)</Label>
              <Input
                id="feedback-email"
                type="email"
                placeholder="seu@email.com"
                value={feedbackEmail}
                onChange={(e) => setFeedbackEmail(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Informe seu e-mail se desejar receber uma resposta.
              </p>
            </div>
          </div>

          {/* Botão Enviar */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setFeedbackOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSendFeedback} disabled={sendingFeedback}>
              {sendingFeedback ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Enviar Feedback
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VpsSchemaGenerator;
