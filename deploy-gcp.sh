#!/bin/bash

# Script para deploy no Google Cloud Platform
# Execute este script após configurar o gcloud CLI

set -e

echo "🚀 Iniciando deploy para Google Cloud Platform..."

# Verificar se gcloud está configurado
if ! command -v gcloud &> /dev/null; then
    echo "❌ Google Cloud CLI não está instalado. Instale em: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Verificar se está logado no gcloud
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
    echo "❌ Não está autenticado no Google Cloud. Execute: gcloud auth login"
    exit 1
fi

# Verificar se o projeto está configurado
PROJECT_ID=$(gcloud config get-value project)
if [ -z "$PROJECT_ID" ]; then
    echo "❌ Projeto não configurado. Execute: gcloud config set project SEU_PROJECT_ID"
    exit 1
fi

echo "📋 Projeto atual: $PROJECT_ID"

# Instalar dependências
echo "📦 Instalando dependências..."
npm install

# Build da aplicação
echo "🔧 Fazendo build da aplicação..."
npm run build

# Verificar se o build foi criado
if [ ! -d "dist" ]; then
    echo "❌ Diretório dist não foi criado. Verifique o processo de build."
    exit 1
fi

echo "✅ Build concluído com sucesso!"

# Escolher método de deploy
echo "Escolha o método de deploy:"
echo "1) App Engine (recomendado para apps estáticos)"
echo "2) Cloud Run (para aplicações containerizadas)"
echo "3) Cloud Storage + Cloud CDN (para sites estáticos)"
read -p "Digite sua escolha (1-3): " choice

case $choice in
    1)
        echo "🚀 Fazendo deploy para App Engine..."
        gcloud app deploy --quiet
        echo "✅ Deploy concluído! Acesse em: https://$PROJECT_ID.uc.r.appspot.com"
        ;;
    2)
        echo "🚀 Fazendo deploy para Cloud Run..."
        # Build da imagem Docker
        gcloud builds submit --tag gcr.io/$PROJECT_ID/pix-to-bitfinex-flow
        
        # Deploy no Cloud Run
        gcloud run deploy pix-to-bitfinex-flow \
            --image gcr.io/$PROJECT_ID/pix-to-bitfinex-flow \
            --platform managed \
            --region us-central1 \
            --allow-unauthenticated \
            --port 8080
        
        URL=$(gcloud run services describe pix-to-bitfinex-flow --platform managed --region us-central1 --format 'value(status.url)')
        echo "✅ Deploy concluído! Acesse em: $URL"
        ;;
    3)
        echo "🚀 Fazendo deploy para Cloud Storage..."
        BUCKET_NAME="$PROJECT_ID-static-site"
        
        # Criar bucket se não existir
        gsutil mb gs://$BUCKET_NAME 2>/dev/null || true
        
        # Configurar bucket para website estático
        gsutil web set -m index.html -e index.html gs://$BUCKET_NAME
        
        # Upload dos arquivos
        gsutil -m cp -r dist/* gs://$BUCKET_NAME/
        
        # Tornar arquivos públicos
        gsutil -m acl ch -r -u AllUsers:R gs://$BUCKET_NAME
        
        echo "✅ Deploy concluído! Acesse em: https://storage.googleapis.com/$BUCKET_NAME/index.html"
        echo "💡 Para usar domínio personalizado, configure o Cloud CDN"
        ;;
    *)
        echo "❌ Opção inválida"
        exit 1
        ;;
esac

echo "🎉 Deploy finalizado com sucesso!"