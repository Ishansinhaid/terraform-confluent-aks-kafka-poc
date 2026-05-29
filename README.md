# 🚀 Private Confluent Cloud Kafka Cluster & AKS using Terraform

![Terraform](https://img.shields.io/badge/Terraform-1.5%2B-7B42BC?style=for-the-badge&logo=terraform)
![Confluent](https://img.shields.io/badge/Confluent_Cloud-Kafka-00BCD4?style=for-the-badge&logo=apachekafka)
![Azure](https://img.shields.io/badge/Microsoft_Azure-AKS-0078D4?style=for-the-badge&logo=microsoftazure)
![IaC](https://img.shields.io/badge/Infrastructure-as_Code-00E676?style=for-the-badge)
![Status](https://img.shields.io/badge/terraform_validate-✅_passing-brightgreen?style=for-the-badge)

> **POC:** Use Terraform to provision a Confluent Cloud Kafka cluster reachable only via Azure PrivateLink, create 2 topics (`orders`, `payments`), one service account, one API key, and ACLs — plus an AKS cluster on Azure. All infrastructure as code.

---

## 📋 Table of Contents

- [Architecture Overview](#-architecture-overview)
- [What Gets Created](#-what-gets-created)
- [Project Structure](#-project-structure)
- [Prerequisites](#-prerequisites)
- [Quick Start](#-quick-start)
- [Configuration Reference](#%EF%B8%8F-configuration-reference)
- [Run Steps](#-run-steps)
- [POC Status](#-poc-status)
- [Outputs](#-outputs)
- [Verification](#-verification)
- [Security](#-security)
- [Troubleshooting](#-troubleshooting)
- [Cleanup](#-cleanup)
- [Author](#-author)

---

## 🏗 Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                          TERRAFORM (IaC)                            │
│    providers: confluent ~1.83 | azurerm ~3.110 | azuread ~2.53      │
└───────────────────────┬─────────────────────────────────────────────┘
                        │
        ┌───────────────┴──────────────────┐
        ▼                                  ▼
┌───────────────────────┐      ┌────────────────────────────┐
│    MICROSOFT AZURE    │      │      CONFLUENT CLOUD        │
│   module "aks"        │      │    module "confluent"       │
│                       │      │                            │
│  Resource Group       │      │  Environment               │
│  poc-kafka-rg         │      │  poc-environment           │
│                       │      │                            │
│  VNet 10.0.0.0/16     │      │  Kafka Cluster             │
│  ├─ AKS Subnet        │      │  poc-kafka-cluster         │
│  │  10.0.1.0/24       │      │  Dedicated | 1 CKU         │
│  └─ PE  Subnet        │      │  Private Network Only 🔒   │
│                       │      │                            │
│  AKS Cluster          │      │  Topics                    │
│  poc-aks-cluster      │◄─────►  orders | payments         │
│  2× Standard_D2s_v3   │      │  6 partitions each         │
│                       │PrivateLink                        │
│  Log Analytics        │      │  Service Account           │
│  Workspace            │      │  + API Key + ACLs          │
│                       │      │                            │
│  Private Endpoint     │      │  Confluent Network         │
│  poc-kafka-cluster-pe │      │  + PrivateLink Access      │
└───────────────────────┘      └────────────────────────────┘

🔒 Kafka bootstrap endpoint is ONLY reachable from inside the VNet
```

---

## ✅ What Gets Created

| Resource | Name | Details |
|---|---|---|
| **Confluent Environment** | `poc-environment` | Stream Governance: ESSENTIALS |
| **Confluent Network** | `poc-kafka-cluster-network` | Type: PRIVATELINK, Azure, eastus |
| **PrivateLink Access** | `poc-kafka-cluster-pl-access` | Scoped to your Azure subscription |
| **Kafka Cluster** | `poc-kafka-cluster` | Dedicated, 1 CKU, SINGLE_ZONE, Azure East US |
| **Kafka Topic** | `orders` | 6 partitions, LZ4 compression, 7-day retention |
| **Kafka Topic** | `payments` | 6 partitions, LZ4 compression, 7-day retention |
| **Service Account** | `poc-kafka-cluster-sa` | Owns the Kafka API key |
| **Kafka API Key** | `poc-kafka-cluster-kafka-api-key` | Cluster-scoped, owned by service account |
| **ACL — WRITE** | topics: `orders`, `payments` | Service account can produce to both topics |
| **ACL — READ** | topics: `orders`, `payments` | Service account can consume from both topics |
| **ACL — GROUP** | `poc-consumer-group` | Service account can use consumer group |
| **Azure Resource Group** | `poc-kafka-rg` | Region: East US |
| **Azure VNet** | `poc-aks-cluster-vnet` | CIDR: 10.0.0.0/16 |
| **AKS Subnet** | `poc-aks-cluster-subnet` | CIDR: 10.0.1.0/24 |
| **Private Endpoint Subnet** | `private-endpoint-subnet` | For Confluent PrivateLink |
| **Azure Private Endpoint** | `poc-kafka-cluster-pe` | Routes VNet traffic to Confluent PrivateLink |
| **AKS Cluster** | `poc-aks-cluster` | 2× Standard_D2s_v3, Kubernetes 1.33+ |
| **Log Analytics Workspace** | `poc-aks-cluster-logs` | Attached to AKS for monitoring |

---

## 📁 Project Structure

```
confluent-kafka-terraform/
├── main.tf                    # Root — wires modules together, defines providers
├── variables.tf               # All 21 input variables
├── outputs.tf                 # 8 outputs: env ID, cluster ID, API key, AKS details
├── terraform.tfvars           # YOUR credentials (⚠️ gitignored — never commit)
├── .gitignore                 # Excludes tfstate, tfvars, .terraform/
│
├── modules/
│   ├── confluent/             # Confluent Cloud resources
│   │   ├── main.tf            # Env, network, PrivateLink, cluster, SA, API key, topics, ACLs
│   │   ├── variables.tf       # Module input variables
│   │   └── outputs.tf         # cluster_id, bootstrap_endpoint, api_key, etc.
│   │
│   └── aks/                   # Azure resources
│       ├── main.tf            # Resource group, VNet, subnets, AKS, Log Analytics
│       ├── variables.tf       # Module input variables
│       └── outputs.tf         # cluster_name, vnet_id, subnet IDs, resource group
│
└── docs/
    └── POC_Documentation.docx
```

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

### Step A — Create Azure Service Principal

```bash
# Login to Azure
az login

# Show your subscription ID and tenant ID
az account show

# Create service principal (save the output!)
az ad sp create-for-rbac \
  --name poc-terraform-sp \
  --role Contributor \
  --scopes /subscriptions/<YOUR_SUBSCRIPTION_ID>
```

The output gives you:
```json
{
  "appId":    "...",   ← azure_client_id
  "password": "...",   ← azure_client_secret
  "tenant":   "..."    ← azure_tenant_id
}
```

### Step B — Create Confluent Cloud API Key

1. Log in to https://confluent.cloud
2. Top-right menu → **API keys** → **Cloud API keys**
3. Click **+ Add key** → **Global access**
4. **Save the Key and Secret immediately** — the secret is shown only once!

---

## ⚡ Quick Start

```bash
# 1. Clone the repo
git clone https://github.com/Ishansinhaid/terraform-confluent-aks-kafka-poc.git
cd terraform-confluent-aks-kafka-poc

# 2. Set up credentials
copy terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars with your real values

# 3. Init → Validate → Plan → Apply
terraform init
terraform validate
terraform plan -out=poc.tfplan
terraform apply poc.tfplan
```

---

## ⚙️ Configuration Reference

Create `terraform.tfvars` with the following values:

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
azure_client_id       = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
azure_client_secret   = "your-sp-secret"

resource_group_name = "poc-kafka-rg"
azure_region        = "East US"

# ── AKS ──────────────────────────────────────────────────────
aks_cluster_name   = "poc-aks-cluster"
dns_prefix         = "poc-aks"
node_count         = 2
vm_size            = "Standard_D2s_v3"
kubernetes_version = "1.33.4"   # Use: az aks get-versions --location eastus

# ── Networking ───────────────────────────────────────────────
vnet_address_space    = "10.0.0.0/16"
subnet_address_prefix = "10.0.1.0/24"
service_cidr          = "10.100.0.0/16"
dns_service_ip        = "10.100.0.10"
```

### Variables Reference

| Variable | Default | Description |
|---|---|---|
| `confluent_cloud_api_key` | *(required)* | Confluent Cloud-level API key |
| `confluent_cloud_api_secret` | *(required)* | Confluent Cloud-level API secret |
| `environment_name` | `poc-environment` | Confluent environment display name |
| `cluster_name` | `poc-kafka-cluster` | Kafka cluster display name |
| `confluent_region` | `eastus` | Azure region for Confluent (no spaces) |
| `kafka_topics` | `["orders","payments"]` | List of Kafka topic names to create |
| `azure_subscription_id` | *(required)* | Azure subscription ID |
| `azure_tenant_id` | *(required)* | Azure AD tenant ID |
| `azure_client_id` | *(required)* | Service principal app ID |
| `azure_client_secret` | *(required)* | Service principal secret |
| `resource_group_name` | `poc-kafka-rg` | Azure resource group name |
| `azure_region` | `East US` | Azure region (full display name) |
| `aks_cluster_name` | `poc-aks-cluster` | AKS cluster name |
| `dns_prefix` | `poc-aks` | DNS prefix for AKS |
| `node_count` | `2` | Number of AKS nodes |
| `vm_size` | `Standard_D2s_v3` | AKS node VM size |
| `kubernetes_version` | `1.33.4` | K8s version — verify with `az aks get-versions` |
| `vnet_address_space` | `10.0.0.0/16` | CIDR for the Azure VNet |
| `subnet_address_prefix` | `10.0.1.0/24` | CIDR for the AKS subnet |
| `service_cidr` | `10.100.0.0/16` | Kubernetes internal service CIDR |
| `dns_service_ip` | `10.100.0.10` | Kubernetes DNS service IP (must be inside service_cidr) |

---

## 🚶 Run Steps

### Step 1 — Initialize Terraform

```bash
terraform init
```

Downloads providers: `confluentinc/confluent ~1.83`, `hashicorp/azurerm ~3.110`, `hashicorp/azuread ~2.53`

Expected: `Terraform has been successfully initialized!`

---

### Step 2 — Validate Configuration

```bash
terraform validate
```

Expected: `Success! The configuration is valid.` ✅

---

### Step 3 — Preview Changes

```bash
terraform plan -out=poc.tfplan
```

Review the ~16 resources to be created. Nothing is provisioned yet.

---

### Step 4 — Apply (Create Everything)

```bash
terraform apply poc.tfplan
```

Type `yes` when prompted.

> ⏱ **Estimated time:** 25–35 minutes
> AKS cluster: ~10 min | Confluent Dedicated cluster: ~15 min

---

### Step 5 — View Outputs

```bash
# View all outputs
terraform output

# View sensitive values
terraform output -raw kafka_api_key
terraform output -raw kafka_api_secret

# Save outputs to file
terraform output -json > outputs.json
```

---

### Step 6 — Connect kubectl to AKS

```bash
az aks get-credentials --resource-group poc-kafka-rg --name poc-aks-cluster
kubectl get nodes
```

---

## 🧪 POC Status

### ✅ Successfully Completed

| Item | Status |
|---|---|
| Terraform module structure (confluent + aks) | ✅ Done |
| `terraform validate` | ✅ Passing |
| `terraform plan` — 16 resources planned | ✅ Done |
| Provider configuration (Confluent, AzureRM, AzureAD) | ✅ Done |
| All variables and outputs defined | ✅ Done |
| AKS VNet, subnets, Log Analytics provisioned | ✅ Done |
| Confluent environment and service account created | ✅ Done |
| GitHub repository and documentation | ✅ Done |

### ⚠️ Deployment Constraints Encountered

| Error | Cause | Resolution |
|---|---|---|
| `402 Payment Required` on Confluent network | Dedicated cluster + PrivateLink requires a billing-enabled Confluent Cloud account | Add credit card to Confluent billing, or switch to `basic {}` cluster type |
| `K8sVersionNotSupported` on AKS | Kubernetes `1.29` / `1.31` are no longer supported in East US without LTS tier | Use `az aks get-versions --location eastus` and pick a supported version (e.g. `1.33.4`) |

### 🔬 Validation Result

```bash
$ terraform validate
Success! The configuration is valid.
```

---

## 📤 Outputs

After `terraform apply`, these outputs are available from `outputs.tf`:

| Output | Description | Sensitive |
|---|---|---|
| `confluent_environment_id` | Confluent Cloud environment ID | No |
| `kafka_cluster_id` | Confluent Kafka cluster resource ID | No |
| `service_account_id` | Confluent service account ID | No |
| `kafka_api_key` | Kafka API key ID (use as username) | ✅ Yes |
| `kafka_api_secret` | Kafka API secret (use as password) | ✅ Yes |
| `aks_cluster_name` | AKS cluster name | No |
| `aks_kube_config_command` | Ready-to-run `az aks get-credentials` command | No |
| `resource_group_name` | Azure resource group containing all resources | No |

---

## ✔️ Verification

### Confluent Cloud Console

1. Log in → https://confluent.cloud
2. **Environments** → `poc-environment` ✅
3. Click environment → **Clusters** → `poc-kafka-cluster` → Status: **Running** ✅
4. Click cluster → **Topics** → `orders` and `payments` both exist ✅
5. **Service accounts** → `poc-kafka-cluster-sa` listed ✅
6. **API keys** → `poc-kafka-cluster-kafka-api-key` listed ✅
7. **ACLs** → 3 ACL rules for the service account ✅

### Azure Portal

1. Open https://portal.azure.com
2. **Resource Groups** → `poc-kafka-rg` exists ✅
3. Inside: `poc-aks-cluster` → Provisioning state: **Succeeded** ✅
4. Inside: `poc-kafka-cluster-pe` (Private endpoint) → Connection state: **Approved** ✅

### CLI Verification

```bash
# List all resources in the resource group
az resource list --resource-group poc-kafka-rg -o table

# Check AKS cluster status
az aks show \
  --resource-group poc-kafka-rg \
  --name poc-aks-cluster \
  --query provisioningState -o tsv
# Expected: Succeeded

# Check Private Endpoint connection status
az network private-endpoint show \
  --resource-group poc-kafka-rg \
  --name poc-kafka-cluster-pe \
  --query "privateLinkServiceConnections[0].privateLinkServiceConnectionState.status" -o tsv
# Expected: Approved

# Check AKS nodes
kubectl get nodes
# Expected: 2 nodes, STATUS = Ready
```

---

## 🔐 Security

| Control | Implementation |
|---|---|
| **No public Kafka access** | Cluster uses `PRIVATELINK` — bootstrap only resolves inside the VNet |
| **Least privilege ACLs** | Service account has WRITE+READ on specific topics only, not cluster-admin |
| **Private DNS resolution** | Azure Private DNS Zone ensures cluster hostname resolves to private IP only |
| **Secrets excluded from Git** | `terraform.tfvars`, `*.tfstate`, `outputs.json` are all in `.gitignore` |
| **AKS Managed Identity** | AKS uses `SystemAssigned` identity — no static secret needed |
| **Sensitive outputs** | `kafka_api_key` and `kafka_api_secret` marked `sensitive = true` in Terraform |

---

## 🐛 Troubleshooting

| Error | Cause | Fix |
|---|---|---|
| `402 Payment Required` (Confluent) | Dedicated cluster needs billing account | Add credit card at confluent.cloud → Billing, or use `basic {}` cluster |
| `K8sVersionNotSupported` | K8s version outdated or requires LTS tier | Run `az aks get-versions --location eastus --output table` and pick supported version |
| `403 Forbidden Access` (Confluent) | API key lacks Global Access scope | Recreate key with **Global access** in Confluent Console |
| `AuthorizationFailed` (Azure) | Service principal missing permissions | Recreate SP with `--role Contributor` and also `User Access Administrator` |
| `PE status: Pending` | Confluent not yet approved the PrivateLink request | Wait 2–5 minutes — Confluent auto-approves if subscription is authorised |
| `Invalid character backtick` | Markdown code fence (`\`\`\``) inside a `.tf` file | Open the `.tf` file, delete any `\`\`\`` lines, save and re-run |

---

## 🗑️ Cleanup

To remove **all** resources and stop all billing:

```bash
terraform destroy
```

Type `yes` when prompted. This deletes everything Terraform created.

> ⚠️ Always destroy after the POC to avoid unexpected charges on Confluent (~$1.50/hr) and Azure.

---

## 👤 Author

**Ishan Sinha**
DevOps Fresher | MCA Student
📅 May 2026
🔗 https://github.com/Ishansinhaid/terraform-confluent-aks-kafka-poc

---

## 📄 License

This project is for POC / demonstration purposes only.

---

> ⚠️ **Security Note:** Never commit `terraform.tfvars`, `*.tfstate`, or `outputs.json` to Git. The `.gitignore` in this repo already excludes them.
