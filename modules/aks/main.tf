###############################################################
# modules/aks/main.tf
# Creates:
#   - Resource Group
#   - VNet + Subnet
#   - AKS Cluster (with system-assigned identity)
###############################################################

# ─── Resource Group ───────────────────────────────────────────
resource "azurerm_resource_group" "this" {
  name     = var.resource_group_name
  location = var.azure_region

  tags = {
  
    managed_by  = "terraform"
  }
}

# ─── Virtual Network ─────────────────────────────────────────
resource "azurerm_virtual_network" "this" {
  name                = "${var.aks_cluster_name}-vnet"
  address_space       = [var.vnet_address_space]
  location            = azurerm_resource_group.this.location
  resource_group_name = azurerm_resource_group.this.name

  tags = {
    
    managed_by  = "terraform"
  }
}

# ─── Subnet for AKS nodes ────────────────────────────────────
resource "azurerm_subnet" "aks" {
  name                 = "${var.aks_cluster_name}-subnet"
  resource_group_name  = azurerm_resource_group.this.name
  virtual_network_name = azurerm_virtual_network.this.name
  address_prefixes     = [var.subnet_address_prefix]
}

# ─── Subnet for Private Endpoints ────────────────────────────
resource "azurerm_subnet" "pe" {
  name                 = "private-endpoint-subnet"
  resource_group_name  = azurerm_resource_group.this.name
  virtual_network_name = azurerm_virtual_network.this.name
  address_prefixes     = [cidrsubnet(var.vnet_address_space, 8, 2)]  # 10.0.2.0/24
}

# ─── Log Analytics (optional but good practice) ──────────────
resource "azurerm_log_analytics_workspace" "this" {
  name                = "${var.aks_cluster_name}-logs"
  location            = azurerm_resource_group.this.location
  resource_group_name = azurerm_resource_group.this.name
  sku                 = "PerGB2018"
  retention_in_days   = 30

  tags = {
    
    managed_by  = "terraform"
  }
}

# ─── AKS Cluster ─────────────────────────────────────────────
resource "azurerm_kubernetes_cluster" "this" {
  name                = var.aks_cluster_name
  location            = azurerm_resource_group.this.location
  resource_group_name = azurerm_resource_group.this.name
  dns_prefix          = var.dns_prefix
  kubernetes_version  = var.kubernetes_version

  default_node_pool {
    name           = "system"
    node_count     = var.node_count
    vm_size        = var.vm_size
    vnet_subnet_id = azurerm_subnet.aks.id
    os_disk_size_gb = 50

    upgrade_settings {
      max_surge = "10%"
    }
  }

  identity {
    type = "SystemAssigned"
  }

  network_profile {
    network_plugin    = "azure"
    network_policy    = "azure"
    load_balancer_sku = "standard"
  }

  oms_agent {
    log_analytics_workspace_id = azurerm_log_analytics_workspace.this.id
  }

  tags = {
    
    managed_by  = "terraform"
  }
}

# ─── Role assignment: AKS identity → VNet contributor ────────
# (Needed so AKS can manage NICs, LBs inside the VNet)
resource "azurerm_role_assignment" "aks_network" {
  scope                = azurerm_virtual_network.this.id
  role_definition_name = "Network Contributor"
  principal_id         = azurerm_kubernetes_cluster.this.identity[0].principal_id
}
