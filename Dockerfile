# Estágio 1: Build da aplicação (builder)
# Usamos uma imagem Node.js mais completa para garantir que todas as ferramentas de build estejam disponíveis.
FROM node:18-alpine AS builder

# Instalar dependências do sistema necessárias para o build em Alpine
RUN apk add --no-cache libc6-compat

# Definir diretório de trabalho
WORKDIR /app

# Copiar apenas os arquivos de dependência primeiro para aproveitar o cache do Docker
COPY package.json package-lock.json ./

# Instalar TODAS as dependências (incluindo devDependencies) para que o 'vite' esteja disponível para o build.
# Usamos 'npm ci' para builds mais consistentes se você tiver um package-lock.json.
RUN npm ci

# Copiar o restante do código da aplicação
COPY . .

# Executar o comando de build que usará 'vite'
RUN npm run build

# Estágio 2: Serviço da aplicação (runner)
# Usamos uma imagem Node.js Alpine mais leve para a imagem final de produção.
FROM node:18-alpine

# Instalar dependências do sistema
RUN apk add --no-cache libc6-compat

# Definir diretório de trabalho
WORKDIR /app

# Instalar o pacote 'serve' globalmente nesta imagem final
RUN npm install -g serve

# Copiar APENAS os arquivos de saída do build (produção) do estágio 'builder'
# Presumimos que o 'npm run build' gera os arquivos estáticos na pasta 'dist'.
COPY --from=builder /app/dist /app/dist

# Expor a porta que o 'serve' irá ouvir
EXPOSE 8080

# Comando para iniciar o servidor de arquivos estáticos
# Cloud Run espera que o aplicativo ouça na porta especificada pela variável de ambiente PORT.
# O valor padrão é 8080 caso a variável não esteja definida.
CMD ["sh", "-c", "serve -s dist -l ${PORT:-8080}"]
