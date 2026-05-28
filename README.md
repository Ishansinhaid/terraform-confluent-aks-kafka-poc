# 🚀 Private Confluent Cloud Kafka Cluster & Topics using Terraform

![Terraform](https://img.shields.io/badge/Terraform-1.5%2B-7B42BC?style=for-the-badge&logo=terraform)
![Confluent](https://img.shields.io/badge/Confluent_Cloud-Kafka-00BCD4?style=for-the-badge&logo=apachekafka)
![Azure](https://img.shields.io/badge/Microsoft_Azure-AKS-0078D4?style=for-the-badge&logo=microsoftazure)
![IaC](https://img.shields.io/badge/Infrastructure-as_Code-00E676?style=for-the-badge)

> **POC:** Provision a private Confluent Cloud Kafka cluster reachable only via Azure PrivateLink, create 2 topics (`orders`, `payments`), a service account, API key, and ACLs — all using Terraform. Also provisions an AKS cluster on Azure.

---

## 📋 Table of Contents

- [Architecture Overview](#-architecture-overview)
- [What Gets Created](#-what-gets-created)
- [Prerequisites](#-prerequisites)
- [Project Structure](#-project-structure)
- [Quick Start](#-quick-start)
- [Configuration Reference](#-configuration-reference)
- [Run Steps](#-run-steps)
- [Verification](#-verification)
- [Security Design](#-security-design)
- [Cost Estimate](#-cost-estimate)
- [Cleanup](#-cleanup)
- [Troubleshooting](#-troubleshooting)
- [Author](#-author)

---

## 🏗 Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        TERRAFORM (IaC)                          │
│              Provisions all resources below                     │
└───────────────────────────┬─────────────────────────────────────┘
                            │
          ┌─────────────────┴──────────────────┐
          ▼                                    ▼
┌─────────────────────┐            ┌───────────────────────────┐
│   MICROSOFT AZURE   │            │     CONFLUENT CLOUD        │
│                     │            │                            │
│  ┌───────────────┐  │            │  ┌──────────────────────┐  │
│  │  AKS Cluster  │  │            │  │  Dedicated Kafka      │  │
│  │  2 nodes      │  │            │  │  Cluster (1 CKU)      │  │
│  │  D2s_v3       │  │            │  │  Private Network Only │  │
│  └───────────────┘  │            │  └──────────────────────┘  │
│                     │            │                            │
│  ┌───────────────┐  │  PrivateLink  ┌──────────────────────┐  │
│  │  VNet         │◄─┼──────────────►│  Topics              │  │
│  │  10.0.0.0/16  │  │  (Private)    │  orders | payments   │  │
│  └───────────────┘  │            │  └──────────────────────┘  │
│                     │            │                            │
│  ┌───────────────┐  │            │  ┌──────────────────────┐  │
│  │  Private      │  │            │  │  Service Account     │  │
│  │  Endpoint     │  │            │  │  + API Key + ACLs    │  │
│  └───────────────┘  │            │  └──────────────────────┘  │
└─────────────────────┘            └───────────────────────────┘
         │
         └─── 🔒 No public internet exposure to Kafka
```

---

## ✅ What Gets Created

| Resource | Details |
|---|---|
| **Confluent Environment** | `poc-environment` |
| **Kafka Cluster** | Dedicated, 1 CKU, Azure East US, private network only |
| **Confluent Network** | Azure PrivateLink type |
| **PrivateLink Access** | Scoped to your Azure subscription |
| **Kafka Topic** | `orders` — 6 partitions, 7-day retention, LZ4 compression |
| **Kafka Topic** | `payments` — 6 partitions, 7-day retention, LZ4 compression |
| **Service Account** | `poc-kafka-cluster-sa` |
| **Kafka API Key** | Scoped to cluster, owned by service account |
| **ACL — WRITE** | Service account can produce to both topics |
| **ACL — READ** | Service account can consume from both topics |
| **ACL — GROUP** | Service account can use consumer group `poc-consumer-group` |
| **Azure Resource Group** | `poc-kafka-rg` |
| **Azure VNet** | `10.0.0.0/16` with AKS subnet + Private Endpoint subnet |
| **Azure Private Endpoint** | Routes to Confluent cluster via PrivateLink |
| **AKS Cluster** | `poc-aks-cluster`, 2× Standard_D2s_v3 nodes, Kubernetes 1.29 |
| **Log Analytics Workspace** | Attached to AKS for monitoring |

---

## 🔧 Prerequisites

### Tools to Install

| Tool | Version | Install Link |
|---|---|---|
| **Terraform** | >= 1.5.0 | https://developer.hashicorp.com/terraform/install |
| **Azure CLI** | Latest | https://aka.ms/installazurecliwindows |
| **kubectl** | Latest | https://kubernetes.io/docs/tasks/tools/ |
| **Git** | Latest | https://git-scm.com/downloads |

### Accounts Required

- ✅ **Confluent Cloud account** — free trial works → https://confluent.cloud
- ✅ **Azure subscription** — with Contributor + User Access Administrator role

### Create Azure Service Principal

```bash
# Login to Azure
az login

# Show your subscription and tenant IDs
az account show

# Create service principal with Contributor role
az ad sp create-for-rbac \
  --name poc-terraform-sp \
  --role Contributor \
  --scopes /subscriptions/<YOUR_SUBSCRIPTION_ID>
```

**Save the output** — you'll need `appId`, `password`, and `tenant`.

### Create Confluent Cloud API Key

1. Log in to https://confluent.cloud
2. Top-right menu → **API keys** → **Cloud API keys**
3. Click **+ Add key** → **Global access**
4. **Save the Key and Secret** — secret shown only once!

---

## 📁 Project Structure

```
confluent-kafka-terraform/
├── main.tf                    # Root — wires modules together
├── variables.tf               # All 16 input variables
├── outputs.tf                 # Outputs: bootstrap endpoint, API key, cluster IDs
├── terraform.tfvars           # YOUR credentials (⚠️ never commit to Git)
├── .gitignore                 # Excludes tfstate, tfvars, .terraform/
│
├── modules/
│   ├── confluent/             # Confluent resources
│   │   ├── main.tf            # Env, cluster, network, PrivateLink, topics, SA, ACLs
│   │   ├── variables.tf
│   │   └── outputs.tf
│   │
│   └── aks/                   # Azure resources
│       ├── main.tf            # Resource group, VNet, subnets, AKS, Log Analytics
│       ├── variables.tf
│       └── outputs.tf
│
└── docs/
    └── POC_Documentation.docx
```

---

## ⚡ Quick Start

```bash
# 1. Clone the repo
# 1. Clone the repo
git clone https://github.com/Ishansinhaid/terraform-confluent-aks-kafka-poc.git

# 2. Move into project directory
cd terraform-confluent-aks-kafka-poc

# 3. Initialize Terraform providers
terraform init

# 4. Validate Terraform configuration
terraform validate

# 5. Preview infrastructure changes
terraform plan

## ⚠️ Current POC Status

### Successfully Completed
- Terraform module structure creation
- AKS and Confluent Terraform module separation
- Terraform validation (`terraform validate`)
- Variable and output configuration
- AzureRM provider integration
- Confluent provider integration
- GitHub repository setup
- Infrastructure documentation

### Deployment Constraints Encountered
- Confluent Dedicated Kafka clusters require a billing-enabled Confluent Cloud account
- Azure AKS Kubernetes version compatibility issue encountered during provisioning

### Validation Result

```bash
terraform validate
Success! The configuration is valid.
```

---

## ⚙️ Configuration Reference

Open `terraform.tfvars` and fill in all values:

```hcl
# ── Confluent Cloud ──────────────────────────────────────────
confluent_cloud_api_key    = "YOUR_CONFLUENT_API_KEY"
confluent_cloud_api_secret = "YOUR_CONFLUENT_API_SECRET"

environment_name  = "poc-environment"
cluster_name      = "poc-kafka-cluster"
confluent_region  = "eastus"
kafka_topics      = ["orders", "payments"]

# ── Azure ────────────────────────────────────────────────────
azure_subscription_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
azure_tenant_id       = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
azure_client_id       = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"   # appId from SP
azure_client_secret   = "your-sp-secret"                         # password from SP

resource_group_name = "poc-kafka-rg"
azure_region        = "East US"

# ── AKS ──────────────────────────────────────────────────────
aks_cluster_name   = "poc-aks-cluster"
dns_prefix         = "poc-aks"
node_count         = 2
vm_size            = "Standard_D2s_v3"
kubernetes_version = "1.29"

# ── Networking ───────────────────────────────────────────────
vnet_address_space    = "10.0.0.0/16"
subnet_address_prefix = "10.0.1.0/24"
```

### Variables Reference

| Variable | Description | Default |
|---|---|---|
| `confluent_cloud_api_key` | Confluent Cloud-level API key | — |
| `confluent_cloud_api_secret` | Confluent Cloud-level API secret | — |
| `environment_name` | Confluent environment name | `poc-environment` |
| `cluster_name` | Kafka cluster display name | `poc-kafka-cluster` |
| `confluent_region` | Azure region for Confluent (no spaces) | `eastus` |
| `kafka_topics` | List of topic names to create | `["orders","payments"]` |
| `azure_subscription_id` | Azure subscription ID | — |
| `azure_tenant_id` | Azure AD tenant ID | — |
| `azure_client_id` | Service principal app ID | — |
| `azure_client_secret` | Service principal secret | — |
| `resource_group_name` | Azure resource group name | `poc-kafka-rg` |
| `azure_region` | Azure region (full name) | `East US` |
| `aks_cluster_name` | AKS cluster name | `poc-aks-cluster` |
| `node_count` | Number of AKS nodes | `2` |
| `vm_size` | AKS node VM size | `Standard_D2s_v3` |
| `kubernetes_version` | Kubernetes version | `1.29` |

---

## 🚶 Run Steps

### Step 1 — Initialize

```bash
terraform init
```

Downloads the Confluent (~1.83) and AzureRM (~3.110) providers.  
Expected: `Terraform has been successfully initialized!`

### Step 2 — Plan

```bash
terraform plan -out=poc.tfplan
```

Review the list of ~27 resources. Nothing is created yet.

### Step 3 — Apply

```bash
terraform apply poc.tfplan
```

Type `yes` when prompted.

> ⏱ **Estimated time:** 25–35 minutes  
> AKS provisioning: ~10 min | Dedicated Kafka cluster: ~15 min

### Step 4 — Save Outputs

```bash
# View all outputs
terraform output

# Save to file (contains sensitive API keys)
terraform output -json > outputs.json

# Get specific values
terraform output kafka_bootstrap_endpoint
terraform output -raw kafka_api_key
terraform output -raw kafka_api_secret
```

### Step 5 — Configure kubectl

```bash
az aks get-credentials --resource-group poc-kafka-rg --name poc-aks-cluster
kubectl get nodes
```

---

## ✔️ Verification

### Confluent Cloud Console

1. Log in to https://confluent.cloud
2. **Environments** → `poc-environment` ✅
3. Click environment → **Clusters** → `poc-kafka-cluster` → Status: **Running** ✅
4. Click cluster → **Topics** → `orders` and `payments` exist ✅
5. **Service accounts** → `poc-kafka-cluster-sa` listed ✅
6. **API keys** → `poc-kafka-cluster-kafka-api-key` listed ✅
7. **ACLs** → 3 rules for the service account ✅

### Azure Portal

1. Open https://portal.azure.com
2. **Resource Groups** → `poc-kafka-rg` exists ✅
3. Inside: `poc-aks-cluster` → Provisioning state: **Succeeded** ✅
4. Inside: `poc-kafka-cluster-pe` (Private endpoint) → Connection state: **Approved** ✅

### CLI Verification

```bash
# AKS nodes
kubectl get nodes
# Expected: 2 nodes, STATUS = Ready

# AKS status
az aks show \
  --resource-group poc-kafka-rg \
  --name poc-aks-cluster \
  --query provisioningState
# Expected: "Succeeded"

## 🗑️ Cleanup

To remove **all** resources and stop billing:



## 🐛 Troubleshooting

| Issue | Fix |
|---|---|
| `402 Payment Required` | Confluent Dedicated Kafka clusters require billing-enabled Confluent Cloud accounts |
| `K8sVersionNotSupported` | Use a supported AKS version from `az aks get-versions --location eastus` |
---

## 📤 Outputs

After `terraform apply`, the following outputs are available:

| Output | Description |
|---|---|
| `confluent_environment_id` | Confluent environment ID |
| `kafka_cluster_id` | Kafka cluster ID |
| `kafka_bootstrap_endpoint` | Private bootstrap endpoint (use from inside VNet) |
| `kafka_topics` | List of created topic names |
| `service_account_id` | Confluent service account ID |
| `kafka_api_key` | API key (sensitive) |
| `kafka_api_secret` | API secret (sensitive) |
| `privatelink_endpoint_id` | Azure Private Endpoint resource ID |
| `aks_cluster_name` | AKS cluster name |
| `aks_kube_config_command` | Ready-to-run kubectl config command |
| `resource_group_name` | Azure resource group name |

---

## 👤 Author

**Ishan Sinha**  
DevOps Fresher | MCA Student  
📅 May 2026

---

## 📄 License

This project is for POC / demonstration purposes.

---

> ⚠️ **Security Note:** Never commit `terraform.tfvars`, `*.tfstate`, or `outputs.json` to Git. The `.gitignore` file in this repo already excludes them.
