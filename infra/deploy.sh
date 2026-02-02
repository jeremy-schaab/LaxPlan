#!/bin/bash
# LaxPlan Azure Deployment Script
# Usage: ./deploy.sh [environment] [location]
# Example: ./deploy.sh prod eastus

set -e

# Configuration
ENVIRONMENT="${1:-prod}"
LOCATION="${2:-eastus}"
APP_NAME="laxplan"

echo "=========================================="
echo "LaxPlan Azure Deployment"
echo "=========================================="
echo "Environment: $ENVIRONMENT"
echo "Location: $LOCATION"
echo ""

# Check if logged in to Azure
echo "Checking Azure CLI login..."
if ! az account show &> /dev/null; then
    echo "Not logged in to Azure. Running 'az login'..."
    az login
fi

# Show current subscription
SUBSCRIPTION=$(az account show --query name -o tsv)
echo "Using subscription: $SUBSCRIPTION"
echo ""

# Deploy infrastructure using Bicep
echo "Deploying infrastructure..."
DEPLOYMENT_OUTPUT=$(az deployment sub create \
    --location "$LOCATION" \
    --template-file "$(dirname "$0")/main.bicep" \
    --parameters environment="$ENVIRONMENT" location="$LOCATION" appName="$APP_NAME" \
    --query 'properties.outputs' \
    -o json)

# Extract outputs
RESOURCE_GROUP=$(echo "$DEPLOYMENT_OUTPUT" | jq -r '.resourceGroupName.value')
WEB_APP_NAME=$(echo "$DEPLOYMENT_OUTPUT" | jq -r '.webAppName.value')
WEB_APP_URL=$(echo "$DEPLOYMENT_OUTPUT" | jq -r '.webAppUrl.value')
STORAGE_ACCOUNT=$(echo "$DEPLOYMENT_OUTPUT" | jq -r '.storageAccountName.value')

echo ""
echo "Infrastructure deployed successfully!"
echo "  Resource Group: $RESOURCE_GROUP"
echo "  Web App: $WEB_APP_NAME"
echo "  Storage Account: $STORAGE_ACCOUNT"
echo ""

# Build the Next.js app
echo "Building Next.js application..."
cd "$(dirname "$0")/.."
npm ci
npm run build

# Create deployment package
echo "Creating deployment package..."
# Create a zip with the built app
zip -r deploy.zip \
    .next \
    public \
    package.json \
    package-lock.json \
    next.config.js \
    -x "*.git*" \
    -x "node_modules/*" \
    -x "*.md"

# Deploy to Azure Web App
echo "Deploying to Azure Web App..."
az webapp deploy \
    --resource-group "$RESOURCE_GROUP" \
    --name "$WEB_APP_NAME" \
    --src-path deploy.zip \
    --type zip

# Clean up
rm deploy.zip

# Initialize the data directory with empty data file
echo "Initializing data storage..."
STORAGE_KEY=$(az storage account keys list \
    --resource-group "$RESOURCE_GROUP" \
    --account-name "$STORAGE_ACCOUNT" \
    --query '[0].value' -o tsv)

# Create initial data file if it doesn't exist
echo '{"organizations":[],"coaches":[],"teams":[],"fields":[],"scheduleDates":[],"games":[],"weeklySchedules":[],"settings":{"seasonName":"Spring 2024","seasonStartDate":"2024-01-01","seasonEndDate":"2024-06-30","defaultGameDuration":60,"avoidBackToBackGames":true,"balanceHomeAway":true,"minGamesBetweenTeams":2}}' > /tmp/laxplan-data.json

az storage file upload \
    --account-name "$STORAGE_ACCOUNT" \
    --account-key "$STORAGE_KEY" \
    --share-name "laxplan-data" \
    --source "/tmp/laxplan-data.json" \
    --path "laxplan-data.json" \
    2>/dev/null || echo "Data file already exists, skipping..."

rm /tmp/laxplan-data.json

# Restart the web app to pick up new deployment
echo "Restarting web app..."
az webapp restart --resource-group "$RESOURCE_GROUP" --name "$WEB_APP_NAME"

echo ""
echo "=========================================="
echo "Deployment Complete!"
echo "=========================================="
echo ""
echo "Your app is now available at:"
echo "  $WEB_APP_URL"
echo ""
echo "To view logs:"
echo "  az webapp log tail --resource-group $RESOURCE_GROUP --name $WEB_APP_NAME"
echo ""
echo "To redeploy after code changes:"
echo "  az webapp deploy --resource-group $RESOURCE_GROUP --name $WEB_APP_NAME --src-path deploy.zip --type zip"
echo ""
