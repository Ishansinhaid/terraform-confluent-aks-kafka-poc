terraform {
  required_providers {
    confluent = {
      source = "confluentinc/confluent"
    }

    azurerm = {
      source = "hashicorp/azurerm"
    }
  }
}

###############################################################
# modules/confluent/main.tf
# FREE VERSION (Basic Kafka Cluster)
###############################################################

# ─── Environment ─────────────────────────────────────────────

resource "confluent_environment" "this" {
  display_name = var.environment_name

  stream_governance {
    package = "ESSENTIALS"
  }
}

# ─── Kafka Cluster (Basic / Free) ────────────────────────────

resource "confluent_kafka_cluster" "this" {
  display_name = var.cluster_name
  availability = "SINGLE_ZONE"
  cloud        = "AZURE"
  region       = var.confluent_region

  basic {}

  environment {
    id = confluent_environment.this.id
  }

  depends_on = [confluent_environment.this]
}

# ─── Service Account ─────────────────────────────────────────

resource "confluent_service_account" "app" {
  display_name = "${var.cluster_name}-sa"
  description  = "Service account for poc-kafka topic access"
}

# ─── Kafka API Key ───────────────────────────────────────────

resource "confluent_api_key" "kafka" {
  display_name = "${var.cluster_name}-kafka-api-key"
  description  = "Kafka API key for ${confluent_service_account.app.display_name}"

  owner {
    id          = confluent_service_account.app.id
    api_version = confluent_service_account.app.api_version
    kind        = confluent_service_account.app.kind
  }

  managed_resource {
    id          = confluent_kafka_cluster.this.id
    api_version = confluent_kafka_cluster.this.api_version
    kind        = confluent_kafka_cluster.this.kind

    environment {
      id = confluent_environment.this.id
    }
  }

  depends_on = [confluent_kafka_cluster.this]
}