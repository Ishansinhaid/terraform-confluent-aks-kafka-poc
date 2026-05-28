###############################################################
# modules/aks/outputs.tf
###############################################################

output "cluster_name" {
  value = azurerm_kubernetes_cluster.this.name
}

output "cluster_id" {
  value = azurerm_kubernetes_cluster.this.id
}

output "kube_config" {
  value     = azurerm_kubernetes_cluster.this.kube_config_raw
  sensitive = true
}

output "resource_group_name" {
  value = azurerm_resource_group.this.name
}

output "vnet_id" {
  value = azurerm_virtual_network.this.id
}

output "aks_subnet_id" {
  value = azurerm_subnet.aks.id
}

output "pe_subnet_id" {
  description = "Subnet ID reserved for Private Endpoints"
  value       = azurerm_subnet.pe.id
}

output "node_resource_group" {
  value = azurerm_kubernetes_cluster.this.node_resource_group
}
