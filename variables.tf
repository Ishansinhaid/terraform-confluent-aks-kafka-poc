###############################################################
# VARIABLES.TF  –  Root module
###############################################################

# ─── Confluent credentials ────────────────────────────────────

variable "confluent_cloud_api_key" {
  description = "Confluent Cloud API Key (Cloud-level, not Kafka-level)"
  type        = string
  sensitive   = true
}

variable "confluent_cloud_api_secret" {
  description = "Confluent Cloud API Secret"
  type        = string
  sensitive   = true
}

# ─── Confluent topology ───────────────────────────────────────

variable "environment_name" {
  description = "Name for the Confluent environment"
  type        = string
  default     = "poc-environment"
}

variable "cluster_name" {
  description = "Kafka cluster display name"
  type        = string
  default     = "poc-kafka-cluster"
}

variable "confluent_region" {
  description = "Azure region for Confluent Cloud"
  type        = string
  default     = "eastus"
}

variable "kafka_topics" {
  description = "List of Kafka topic names to create"
  type        = list(string)

  default = [
    "orders",
    "payments"
  ]
}

# ─── Azure credentials ────────────────────────────────────────

variable "azure_subscription_id" {
  description = "Azure subscription ID"
  type        = string
  sensitive   = true
}

variable "azure_tenant_id" {
  description = "Azure AD tenant ID"
  type        = string
  sensitive   = true
}

variable "azure_client_id" {
  description = "Azure service principal client ID"
  type        = string
  sensitive   = true
}

variable "azure_client_secret" {
  description = "Azure service principal client secret"
  type        = string
  sensitive   = true
}

# ─── Azure topology ───────────────────────────────────────────

variable "resource_group_name" {
  description = "Azure resource group for all resources"
  type        = string
  default     = "poc-kafka-rg"
}

variable "azure_region" {
  description = "Azure region for all resources"
  type        = string
  default     = "East US"
}

# ─── AKS ──────────────────────────────────────────────────────

variable "aks_cluster_name" {
  description = "AKS cluster name"
  type        = string
  default     = "poc-aks-cluster"
}

variable "dns_prefix" {
  description = "DNS prefix for AKS"
  type        = string
  default     = "poc-aks"
}

variable "node_count" {
  description = "Number of AKS nodes"
  type        = number
  default     = 2
}

variable "vm_size" {
  description = "VM size for AKS nodes"
  type        = string
  default     = "Standard_D2s_v3"
}

variable "kubernetes_version" {
  description = "Kubernetes version"
  type        = string
  default     = "1.29"
}

# ─── Networking ───────────────────────────────────────────────

variable "vnet_address_space" {
  description = "Address space for the VNet"
  type        = string
  default     = "10.0.0.0/16"
}

variable "subnet_address_prefix" {
  description = "Address prefix for the AKS subnet"
  type        = string
  default     = "10.0.1.0/24"
}

# IMPORTANT:
# Must NOT overlap with VNet/subnet CIDR

variable "service_cidr" {
  description = "Kubernetes service CIDR"
  type        = string
  default     = "10.100.0.0/16"
}

variable "dns_service_ip" {
  description = "Kubernetes DNS service IP"
  type        = string
  default     = "10.100.0.10"
}

