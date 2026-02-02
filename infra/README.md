# LaxPlan Azure Deployment

This directory contains Azure infrastructure-as-code using Bicep and deployment scripts.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Azure Subscription                    │
│  ┌───────────────────────────────────────────────────┐  │
│  │            Resource Group (rg-laxplan-prod)       │  │
│  │                                                   │  │
│  │  ┌─────────────────┐    ┌─────────────────────┐  │  │
│  │  │  App Service    │    │  Storage Account    │  │  │
│  │  │  (Node.js 20)   │◄──►│  (Azure Files)      │  │  │
│  │  │                 │    │                     │  │  │
│  │  │  - Next.js App  │    │  /laxplan-data      │  │  │
│  │  │  - API Routes   │    │  └─ laxplan-data.json│  │  │
│  │  └─────────────────┘    └─────────────────────┘  │  │
│  │         │                                         │  │
│  │  ┌──────┴──────┐                                 │  │
│  │  │ App Service │                                 │  │
│  │  │    Plan     │                                 │  │
│  │  │   (B1)      │                                 │  │
│  │  └─────────────┘                                 │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

## Prerequisites

- Azure CLI installed (`az --version`)
- Node.js 20+ installed
- Azure subscription with Contributor access
- `jq` installed (for deploy script)

## Quick Start (Manual Deployment)

### 1. Login to Azure

```bash
az login
az account set --subscription "Your Subscription Name"
```

### 2. Run the deployment script

```bash
cd infra
./deploy.sh prod eastus
```

This will:
- Create a resource group `rg-laxplan-prod`
- Deploy App Service Plan (Basic B1 tier)
- Deploy Web App with Node.js 20
- Create Storage Account with Azure Files
- Mount storage to `/home/data` for persistent JSON storage
- Build and deploy the Next.js application

### 3. Access your app

After deployment, your app will be available at:
```
https://laxplan-prod-<unique-id>.azurewebsites.net
```

## GitHub Actions (CI/CD)

### Setup

1. Create an Azure Service Principal:
```bash
az ad sp create-for-rbac --name "laxplan-github" --role contributor \
    --scopes /subscriptions/{subscription-id} \
    --sdk-auth
```

2. Add GitHub Secrets:
   - `AZURE_CREDENTIALS`: Full JSON output from above command
   - `AZURE_SUBSCRIPTION_ID`: Your subscription ID

3. Push to `main` branch to trigger deployment

### Manual Trigger

You can also trigger deployments manually from the Actions tab, selecting the environment (dev/staging/prod).

## Resource Costs (Estimated)

| Resource | SKU | Est. Monthly Cost |
|----------|-----|-------------------|
| App Service Plan | B1 (Basic) | ~$13/month |
| Storage Account | Standard LRS | ~$0.05/month |
| **Total** | | **~$13/month** |

*For lower costs, use F1 (Free) tier but note:*
- No custom domain
- Limited to 60 CPU minutes/day
- No always-on capability

## Scaling Up

To change the App Service Plan tier:

```bash
az appservice plan update \
    --name asp-laxplan-prod \
    --resource-group rg-laxplan-prod \
    --sku S1  # Standard tier
```

## Viewing Logs

```bash
# Stream live logs
az webapp log tail \
    --resource-group rg-laxplan-prod \
    --name laxplan-prod-<unique-id>

# Download logs
az webapp log download \
    --resource-group rg-laxplan-prod \
    --name laxplan-prod-<unique-id>
```

## Cleanup

To delete all resources:

```bash
az group delete --name rg-laxplan-prod --yes --no-wait
```

## Files

| File | Description |
|------|-------------|
| `main.bicep` | Main Bicep template (subscription scope) |
| `modules/webapp.bicep` | Web App module with App Service + Storage |
| `deploy.sh` | Bash deployment script |
| `../github/workflows/azure-deploy.yml` | GitHub Actions workflow |

## Troubleshooting

### App not starting
```bash
az webapp log tail --resource-group rg-laxplan-prod --name <webapp-name>
```

### Data not persisting
Check if Azure Files is mounted:
```bash
az webapp config storage-account list \
    --resource-group rg-laxplan-prod \
    --name <webapp-name>
```

### Deployment failed
Check deployment logs:
```bash
az webapp deployment list-publishing-profiles \
    --resource-group rg-laxplan-prod \
    --name <webapp-name>
```
