#!/bin/bash
set -e

# Configuration
RESOURCE_GROUP="finpulse-rg"
LOCATION="eastus"
APP_NAME="finpulse-app"

echo "=== FinPulse Azure Deployment ==="
echo ""

# Step 1: Create Resource Group
echo "[1/5] Creating resource group..."
az group create --name "$RESOURCE_GROUP" --location "$LOCATION" --output none

# Step 2: Deploy Infrastructure
echo "[2/5] Deploying Azure resources (Bicep)..."
az deployment group create \
  --resource-group "$RESOURCE_GROUP" \
  --template-file infra/main.bicep \
  --parameters appName="$APP_NAME" location="$LOCATION" sku="F1" \
  --output none

# Step 3: Build Angular frontend
echo "[3/5] Building Angular frontend..."
cd src/finpulse-ui
npm ci --silent
npx ng build --configuration production
cd ../..

# Step 4: Build and publish .NET API
echo "[4/5] Building .NET API..."
dotnet publish src/FinPulse.Api/FinPulse.Api.csproj \
  -c Release \
  -o ./publish \
  --nologo

# Copy Angular dist to wwwroot
cp -r src/finpulse-ui/dist/finpulse-ui/browser/* ./publish/wwwroot/

# Step 5: Deploy to Azure
echo "[5/5] Deploying to Azure App Service..."
cd publish
zip -r ../deploy.zip . -q
cd ..

az webapp deploy \
  --resource-group "$RESOURCE_GROUP" \
  --name "$APP_NAME" \
  --src-path deploy.zip \
  --type zip \
  --output none

# Cleanup
rm -rf publish deploy.zip

# Get URL
APP_URL=$(az webapp show --resource-group "$RESOURCE_GROUP" --name "$APP_NAME" --query "defaultHostName" -o tsv)
echo ""
echo "=== Deployment Complete ==="
echo "URL: https://$APP_URL"
echo ""
