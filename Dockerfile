# Etapa 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar arquivos de dependências
COPY package.json package-lock.json ./

# Instalar dependências
RUN npm ci

# Copiar código fonte
COPY . .

# Argumentos de build (recebidos do CI/CD ou docker build --build-arg)
ARG VITE_TURNSTILE_SITE_KEY
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_PUBLISHABLE_KEY

# Definir variáveis de ambiente para o build do Vite
ENV VITE_TURNSTILE_SITE_KEY=$VITE_TURNSTILE_SITE_KEY
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_PUBLISHABLE_KEY=$VITE_SUPABASE_PUBLISHABLE_KEY

# Build da aplicação
RUN npm run build

# Etapa 2: Produção com Nginx
FROM nginx:alpine AS production

# Copiar configuração customizada do Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copiar arquivos buildados
COPY --from=builder /app/dist /usr/share/nginx/html

# Expor porta 80
EXPOSE 80

# Comando para iniciar o Nginx
CMD ["nginx", "-g", "daemon off;"]
