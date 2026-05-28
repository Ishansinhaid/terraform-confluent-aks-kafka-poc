###############################################################
# OUTPUTS.TF  –  Root module
###############################################################

output "confluent_environment_id" {
  description = "Confluent environment ID"
  value       = module.confluent.environment_id
}

output "kafka_cluster_id" {
  description = "Confluent Kafka cluster ID"
  value       = module.confluent.cluster_id
}



output "service_account_id" {
  description = "Confluent service account ID"
  value       = module.confluent.service_account_id
}

output "kafka_api_key" {
  description = "Kafka API key"
  value       = module.confluent.kafka_api_key
  sensitive   = true
}

output "kafka_api_secret" {
  description = "Kafka API secret"
  value       = module.confluent.kafka_api_secret
  sensitive   = true
}

output "aks_cluster_name" {
  description = "AKS cluster name"
  value       = module.aks.cluster_name
}

output "aks_kube_config_command" {
  description = "Command to configure kubectl"

  value = "az aks get-credentials --resource-group ${var.resource_group_name} --name ${var.aks_cluster_name}"
}

output "resource_group_name" {
  description = "Azure resource group containing all resources"
  value       = module.aks.resource_group_name
}

