###############################################################
# modules/confluent/variables.tf
###############################################################

variable "environment_name" {
  type = string
}

variable "cluster_name" {
  type = string
}

variable "confluent_region" {
  description = "Azure region string used by Confluent (e.g. eastus)"
  type        = string
}

variable "azure_subscription_id" {
  type      = string
  sensitive = true
}

variable "azure_vnet_id" {
  description = "ID of the Azure VNet created by the AKS module"
  type        = string
}

variable "azure_subnet_id" {
  description = "ID of the subnet where the private endpoint will be placed"
  type        = string
}

variable "azure_resource_group" {
  type = string
}

variable "azure_region" {
  description = "Full Azure region name (e.g. East US)"
  type        = string
}

variable "topics" {
  description = "List of topic names"
  type        = list(string)
}
