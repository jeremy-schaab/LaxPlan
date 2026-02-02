// LaxPlan Azure Infrastructure
// Deploy with: az deployment sub create --location eastus --template-file main.bicep

targetScope = 'subscription'

@description('Environment name (dev, staging, prod)')
@allowed(['dev', 'staging', 'prod'])
param environment string = 'prod'

@description('Azure region for resources')
param location string = 'eastus'

@description('Base name for resources')
param appName string = 'laxplan'

// Resource Group
resource rg 'Microsoft.Resources/resourceGroups@2023-07-01' = {
  name: 'rg-${appName}-${environment}'
  location: location
}

// Deploy the app infrastructure
module appInfra 'modules/webapp.bicep' = {
  name: 'appInfraDeployment'
  scope: rg
  params: {
    appName: appName
    environment: environment
    location: location
  }
}

// Outputs
output resourceGroupName string = rg.name
output webAppName string = appInfra.outputs.webAppName
output webAppUrl string = appInfra.outputs.webAppUrl
output storageAccountName string = appInfra.outputs.storageAccountName
