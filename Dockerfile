# Dockerfile para Cloud Run (alternativa ao App Engine)
FROM node:18-alpine

# Instalar dependências do sistema
RUN apk add --no-cache libc6-compat

# Definir diretório de trabalho
WORKDIR /app

# Copiar arquivos de dependências
COPY package*.json ./

# Instalar dependências
RUN npm ci --only=production

# Copiar código source
COPY . .

# Build da aplicação
RUN npm run build

# Instalar serve para servir arquivos estáticos
RUN npm install -g serve

# Expor porta
EXPOSE 8080

# Comando para iniciar a aplicação
CMD ["serve", "-s", "dist", "-l", "8080"]