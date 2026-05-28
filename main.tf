###############################################################
# ROOT MAIN.TF
# Provisions:
#   - Confluent Cloud Environment + Kafka Cluster (private)
#   - Azure VNet + PrivateLink for Confluent
#   - AKS Cluster
#   - Kafka Topics, Service Account, API Key, ACLs
###############################################################

terraform {
  required_version = ">= 1.5.0"

  required_providers {
    confluent = {
      source  = "confluentinc/confluent"
      version = "~> 1.83.0"
    }
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.110.0"
    }
    azuread = {
      source  = "hashicorp/azuread"
      version = "~> 2.53.0"
    }
  }
}

# ─── Provider: Confluent ─────────────────────────────────────
provider "confluent" {
  cloud_api_key    = var.confluent_cloud_api_key
  cloud_api_secret = var.confluent_cloud_api_secret
}

# ─── Provider: Azure ─────────────────────────────────────────
provider "azurerm" {
  features {}
  subscription_id = var.azure_subscription_id
  tenant_id       = var.azure_tenant_id
  client_id       = var.azure_client_id
  client_secret   = var.azure_client_secret
}

provider "azuread" {
  tenant_id     = var.azure_tenant_id
  client_id     = var.azure_client_id
  client_secret = var.azure_client_secret
}

# ─── Confluent Module ─────────────────────────────────────────
module "confluent" {
  source = "./modules/confluent"

  environment_name      = var.environment_name
  cluster_name          = var.cluster_name
  confluent_region      = var.confluent_region
  azure_subscription_id = var.azure_subscription_id
  azure_vnet_id         = module.aks.vnet_id
  azure_subnet_id       = module.aks.pe_subnet_id
  azure_resource_group  = var.resource_group_name
  azure_region          = var.azure_region
  topics                = var.kafka_topics
}

# ─── AKS Module ──────────────────────────────────────────────
module "aks" {
  source = "./modules/aks"

  resource_group_name   = var.resource_group_name
  azure_region          = var.azure_region
  aks_cluster_name      = var.aks_cluster_name
  dns_prefix            = var.dns_prefix
  node_count            = var.node_count
  vm_size               = var.vm_size
  kubernetes_version    = var.kubernetes_version
  vnet_address_space    = var.vnet_address_space
  subnet_address_prefix = var.subnet_address_prefix
  service_cidr          = var.service_cidr
  dns_service_ip        = var.dns_service_ip
}
