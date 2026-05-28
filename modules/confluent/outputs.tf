###############################################################
# modules/confluent/outputs.tf
###############################################################

output "environment_id" {
  value = confluent_environment.this.id
}

output "cluster_id" {
  value = confluent_kafka_cluster.this.id
}

output "bootstrap_endpoint" {
  description = "Kafka bootstrap endpoint"
  value       = confluent_kafka_cluster.this.bootstrap_endpoint
}

output "rest_endpoint" {
  value = confluent_kafka_cluster.this.rest_endpoint
}

output "service_account_id" {
  value = confluent_service_account.app.id
}

output "kafka_api_key" {
  value     = confluent_api_key.kafka.id
  sensitive = true
}

output "kafka_api_secret" {
  value     = confluent_api_key.kafka.secret
  sensitive = true
}