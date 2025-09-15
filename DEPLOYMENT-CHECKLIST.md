# ✅ Checklist de Deploy no Google Cloud Platform

## Antes do Deploy

### 1. Preparação do Ambiente Local
- [ ] Instalar Google Cloud CLI
- [ ] Fazer login: `gcloud auth login`
- [ ] Configurar projeto: `gcloud config set project SEU_PROJECT_ID`
- [ ] Habilitar billing no projeto GCP

### 2. Habilitar APIs Necessárias
```bash
gcloud services enable appengine.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable cloudbuild.googleapis.com
gcloud services enable storage.googleapis.com
```

### 3. Testar Build Local
- [ ] `npm install`
- [ ] `npm run build`
- [ ] Verificar se pasta `dist` foi criada
- [ ] Testar com `npm run preview`

### 4. Configurar Supabase para Produção
- [ ] Verificar se as URLs do Supabase estão corretas no código
- [ ] Confirmar se as Edge Functions estão deployadas
- [ ] Testar API key do ASAAS em produção

## Durante o Deploy

### Opção A: App Engine (Recomendado)
- [ ] Executar: `chmod +x deploy-gcp.sh`
- [ ] Executar: `./deploy-gcp.sh` e escolher opção 1
- [ ] Aguardar conclusão do build e deploy
- [ ] Testar URL gerada: `https://SEU_PROJECT_ID.uc.r.appspot.com`

### Opção B: Cloud Run
- [ ] Build da imagem: `gcloud builds submit --tag gcr.io/SEU_PROJECT_ID/pix-to-bitfinex-flow`
- [ ] Deploy: `gcloud run deploy pix-to-bitfinex-flow --image gcr.io/SEU_PROJECT_ID/pix-to-bitfinex-flow --platform managed --region us-central1 --allow-unauthenticated`
- [ ] Testar URL gerada

### Opção C: Cloud Storage (Site Estático)
- [ ] Criar bucket: `gsutil mb gs://SEU_PROJECT_ID-static-site`
- [ ] Configurar: `gsutil web set -m index.html -e index.html gs://SEU_PROJECT_ID-static-site`
- [ ] Upload: `gsutil -m cp -r dist/* gs://SEU_PROJECT_ID-static-site/`
- [ ] Tornar público: `gsutil -m acl ch -r -u AllUsers:R gs://SEU_PROJECT_ID-static-site`

## Após o Deploy

### 1. Testes Funcionais
- [ ] Testar autenticação (login/signup)
- [ ] Testar geração de QR Code PIX
- [ ] Testar verificação de pagamento
- [ ] Testar responsividade em mobile
- [ ] Verificar se todas as rotas funcionam (SPA routing)

### 2. Configurações de Produção
- [ ] Configurar domínio personalizado (se aplicável)
- [ ] Configurar SSL/HTTPS
- [ ] Configurar monitoramento e alertas
- [ ] Configurar backup automático (se necessário)

### 3. Performance e SEO
- [ ] Verificar Page Speed Insights
- [ ] Configurar meta tags (já incluídas no index.html)
- [ ] Configurar sitemap.xml (se necessário)
- [ ] Testar em diferentes navegadores

### 4. Monitoramento
- [ ] Configurar Cloud Monitoring
- [ ] Configurar alertas de uptime
- [ ] Verificar logs: `gcloud app logs tail -s default`
- [ ] Configurar Error Reporting

## Comandos Úteis Pós-Deploy

### Ver logs em tempo real
```bash
# App Engine
gcloud app logs tail -s default

# Cloud Run
gcloud logging tail "resource.type=cloud_run_revision"
```

### Atualizar aplicação
```bash
# App Engine
npm run build && gcloud app deploy --quiet

# Cloud Run
gcloud builds submit --tag gcr.io/SEU_PROJECT_ID/pix-to-bitfinex-flow
gcloud run deploy pix-to-bitfinex-flow --image gcr.io/SEU_PROJECT_ID/pix-to-bitfinex-flow
```

### Rollback (se necessário)
```bash
# App Engine
gcloud app versions list
gcloud app services set-traffic default --splits=VERSAO_ANTERIOR=1

# Cloud Run
gcloud run revisions list --service=pix-to-bitfinex-flow
gcloud run services update-traffic pix-to-bitfinex-flow --to-revisions=REVISAO_ANTERIOR=100
```

## Estimativa de Custos

### App Engine (F1)
- **Gratuito**: 28 horas instance/dia
- **Custo adicional**: ~$0.05/hora

### Cloud Run
- **Gratuito**: 2M requests/mês, 400.000 GB-segundos
- **Custo adicional**: $0.40/1M requests

### Cloud Storage
- **Gratuito**: 5GB storage/mês
- **Custo adicional**: $0.020/GB/mês

## Troubleshooting

### Erro comum: "App Engine application does not exist"
```bash
gcloud app create --region=us-central
```

### Erro: "Insufficient permissions"
```bash
gcloud auth application-default login
```

### Build falha
- Verificar se `npm run build` funciona localmente
- Conferir se todas as dependências estão no package.json
- Verificar Node.js version compatibility

### SPA routing não funciona
- Verificar configuração do `app.yaml`
- Para Cloud Storage: configurar redirect rules no load balancer