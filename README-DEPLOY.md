# Deploy no Google Cloud Platform

Este guia explica como fazer o deploy da aplicação no Google Cloud Platform (GCP).

## Pré-requisitos

1. **Conta Google Cloud**: Crie uma conta em [cloud.google.com](https://cloud.google.com)
2. **Projeto GCP**: Crie um novo projeto no console do Google Cloud
3. **Google Cloud CLI**: Instale o CLI do Google Cloud
4. **Billing**: Configure o billing no seu projeto (necessário para alguns serviços)

## Instalação do Google Cloud CLI

### Windows
```bash
# Baixe e execute o instalador em:
# https://cloud.google.com/sdk/docs/install-sdk#windows
```

### macOS
```bash
curl https://sdk.cloud.google.com | bash
exec -l $SHELL
```

### Linux
```bash
curl https://sdk.cloud.google.com | bash
exec -l $SHELL
```

## Configuração Inicial

1. **Login no Google Cloud**:
```bash
gcloud auth login
```

2. **Configurar projeto**:
```bash
gcloud config set project SEU_PROJECT_ID
```

3. **Habilitar APIs necessárias**:
```bash
# Para App Engine
gcloud services enable appengine.googleapis.com

# Para Cloud Run
gcloud services enable run.googleapis.com
gcloud services enable cloudbuild.googleapis.com

# Para Cloud Storage
gcloud services enable storage.googleapis.com
```

## Opções de Deploy

### 1. App Engine (Recomendado para SPAs)

O App Engine é ideal para aplicações React pois gerencia automaticamente o roteamento para SPAs.

**Deploy**:
```bash
# Usando o script automatizado
chmod +x deploy-gcp.sh
./deploy-gcp.sh

# Ou manualmente
npm run build
gcloud app deploy
```

**Características**:
- ✅ Roteamento automático para SPA
- ✅ SSL automático
- ✅ Escalabilidade automática
- ✅ Zero configuração de servidor
- 💰 Pay-per-use

### 2. Cloud Run (Para aplicações containerizadas)

Cloud Run é ideal se você quer mais controle sobre o ambiente de execução.

**Deploy**:
```bash
# Build e deploy
gcloud builds submit --tag gcr.io/SEU_PROJECT_ID/pix-to-bitfinex-flow
gcloud run deploy pix-to-bitfinex-flow \
  --image gcr.io/SEU_PROJECT_ID/pix-to-bitfinex-flow \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

**Características**:
- ✅ Container personalizado
- ✅ Escalabilidade automática
- ✅ Suporte a WebSockets
- ✅ Mais controle sobre o runtime

### 3. Cloud Storage + CDN (Sites estáticos)

Para máxima performance e menor custo para sites estáticos.

**Deploy**:
```bash
# Criar bucket
gsutil mb gs://SEU_PROJECT_ID-static-site

# Configurar para website
gsutil web set -m index.html -e index.html gs://SEU_PROJECT_ID-static-site

# Upload dos arquivos
npm run build
gsutil -m cp -r dist/* gs://SEU_PROJECT_ID-static-site/

# Tornar público
gsutil -m acl ch -r -u AllUsers:R gs://SEU_PROJECT_ID-static-site
```

## Configuração de Variáveis de Ambiente

### Para App Engine
Adicione as variáveis no `app.yaml`:
```yaml
env_variables:
  NODE_ENV: "production"
  # Adicione outras variáveis conforme necessário
```

### Para Cloud Run
```bash
gcloud run deploy pix-to-bitfinex-flow \
  --set-env-vars NODE_ENV=production \
  --set-env-vars CUSTOM_VAR=value
```

## Domínio Personalizado

1. **App Engine**:
```bash
gcloud app domain-mappings create seudominio.com
```

2. **Cloud Run**:
- Configure através do console ou gcloud CLI
- Adicione verificação de domínio no Google Search Console

3. **Cloud Storage**:
- Use Cloud CDN ou Cloud Load Balancer
- Configure SSL certificate

## Monitoramento e Logs

### Ver logs
```bash
# App Engine
gcloud app logs tail -s default

# Cloud Run
gcloud logging tail "resource.type=cloud_run_revision"
```

### Métricas
- Acesse o Cloud Console > Monitoring
- Configure alertas para uptime e performance
- Use Error Reporting para monitorar erros

## Custos Estimados

### App Engine (F1 instance)
- **Gratuito**: 28 horas/dia
- **Pago**: ~$0.05/hora após o limite gratuito

### Cloud Run
- **Gratuito**: 2 milhões de requests/mês
- **Pago**: $0.40 por milhão de requests

### Cloud Storage
- **Gratuito**: 5GB/mês
- **Pago**: $0.020/GB/mês

## Troubleshooting

### Erro de autenticação
```bash
gcloud auth application-default login
```

### Erro de billing
- Verifique se o billing está habilitado no projeto
- Certifique-se de ter uma forma de pagamento válida

### Build falha
- Verifique se todas as dependências estão no package.json
- Confirme se o comando `npm run build` funciona localmente

### SPA routing não funciona
- Para App Engine: Use o `app.yaml` fornecido
- Para Cloud Run: Configure o Dockerfile corretamente
- Para Storage: Configure redirecionamentos no load balancer

## Scripts Úteis

O arquivo `deploy-gcp.sh` automatiza todo o processo de deploy. Execute:

```bash
chmod +x deploy-gcp.sh
./deploy-gcp.sh
```

## Suporte

- [Documentação oficial do GCP](https://cloud.google.com/docs)
- [Stack Overflow - google-cloud-platform](https://stackoverflow.com/questions/tagged/google-cloud-platform)
- [Community do Google Cloud](https://cloud.google.com/community)