const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  HeadingLevel, AlignmentType, BorderStyle, WidthType, ShadingType,
  UnderlineType
} = require('docx');
const fs = require('fs');

// ── Helpers ──────────────────────────────────────────────────
const BLUE   = "1F4E79";
const LBLUE  = "2E75B6";
const GRAY   = "F2F2F2";
const GREEN  = "375623";
const WHITE  = "FFFFFF";

const h1 = (text) => new Paragraph({
  heading: HeadingLevel.HEADING_1,
  children: [new TextRun({ text, bold: true, color: WHITE, size: 36, font: "Arial" })],
  shading: { type: ShadingType.SOLID, color: BLUE },
  spacing: { before: 360, after: 240 }
});

const h2 = (text) => new Paragraph({
  heading: HeadingLevel.HEADING_2,
  children: [new TextRun({ text, bold: true, color: WHITE, size: 28, font: "Arial" })],
  shading: { type: ShadingType.SOLID, color: LBLUE },
  spacing: { before: 300, after: 180 }
});

const h3 = (text) => new Paragraph({
  children: [new TextRun({ text, bold: true, size: 24, font: "Arial", color: BLUE })],
  spacing: { before: 200, after: 100 }
});

const p = (text) => new Paragraph({
  children: [new TextRun({ text, size: 22, font: "Arial" })],
  spacing: { before: 80, after: 80 }
});

const code = (text) => new Paragraph({
  children: [new TextRun({ text, font: "Courier New", size: 18, color: "1a1a1a" })],
  shading: { type: ShadingType.SOLID, color: "E8E8E8" },
  spacing: { before: 40, after: 40 },
  indent: { left: 360 }
});

const bullet = (text) => new Paragraph({
  children: [new TextRun({ text, size: 22, font: "Arial" })],
  bullet: { level: 0 },
  spacing: { before: 60, after: 60 }
});

const blank = () => new Paragraph({ children: [new TextRun("")], spacing: { after: 120 } });

// ── Two-column table helper ───────────────────────────────────
const kvTable = (rows) => new Table({
  width: { size: 100, type: WidthType.PERCENTAGE },
  rows: rows.map(([k, v]) => new TableRow({
    children: [
      new TableCell({
        children: [new Paragraph({ children: [new TextRun({ text: k, bold: true, size: 20, font: "Arial" })] })],
        shading: { type: ShadingType.SOLID, color: GRAY },
        width: { size: 30, type: WidthType.PERCENTAGE }
      }),
      new TableCell({
        children: [new Paragraph({ children: [new TextRun({ text: v, size: 20, font: "Courier New" })] })],
        width: { size: 70, type: WidthType.PERCENTAGE }
      })
    ]
  }))
});

// ═══════════════════════════════════════════════════════════════
// DOCUMENT CONTENT
// ═══════════════════════════════════════════════════════════════
const doc = new Document({
  styles: {
    default: { document: { run: { font: "Arial", size: 22 } } },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 36, bold: true, font: "Arial" },
        paragraph: { spacing: { before: 360, after: 240 }, outlineLevel: 0 } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 28, bold: true, font: "Arial" },
        paragraph: { spacing: { before: 300, after: 180 }, outlineLevel: 1 } },
    ]
  },
  sections: [{
    properties: {
      page: {
        size: { width: 12240, height: 15840 },
        margin: { top: 1080, right: 1080, bottom: 1080, left: 1080 }
      }
    },
    children: [

      // ── TITLE PAGE ──────────────────────────────────────────
      new Paragraph({
        children: [new TextRun({ text: "POC: Private Confluent Cloud Kafka", bold: true, size: 52, font: "Arial", color: BLUE })],
        alignment: AlignmentType.CENTER, spacing: { before: 1440, after: 120 }
      }),
      new Paragraph({
        children: [new TextRun({ text: "Cluster & Topics using Terraform", bold: true, size: 52, font: "Arial", color: BLUE })],
        alignment: AlignmentType.CENTER, spacing: { after: 360 }
      }),
      new Paragraph({
        children: [new TextRun({ text: "Complete Setup Guide · Run Steps · Verification", size: 24, font: "Arial", color: "555555" })],
        alignment: AlignmentType.CENTER, spacing: { after: 240 }
      }),
      new Paragraph({
        children: [new TextRun({ text: `Prepared: ${new Date().toLocaleDateString('en-IN', { day:'2-digit', month:'long', year:'numeric' })}`, size: 22, font: "Arial", color: "888888" })],
        alignment: AlignmentType.CENTER, spacing: { after: 1440 }
      }),

      // ── ARCHITECTURE OVERVIEW ────────────────────────────────
      h1("1. Architecture Overview"),
      p("This POC provisions a production-like private Kafka infrastructure on Azure using Terraform. All components are managed as code and can be torn down with a single command."),
      blank(),
      kvTable([
        ["Cloud Provider",       "Microsoft Azure"],
        ["Kafka Platform",       "Confluent Cloud (Dedicated cluster)"],
        ["Connectivity",         "Azure PrivateLink (no public internet exposure)"],
        ["Container Platform",   "Azure Kubernetes Service (AKS)"],
        ["IaC Tool",             "Terraform >= 1.5.0"],
        ["Topics",               "orders, payments"],
        ["Auth",                 "Service Account + Kafka API Key + ACLs"],
      ]),
      blank(),

      // ── PREREQUISITES ────────────────────────────────────────
      h1("2. Prerequisites"),

      h2("2.1 Tools to Install"),
      kvTable([
        ["Terraform",   "https://developer.hashicorp.com/terraform/install  (>= 1.5.0)"],
        ["Azure CLI",   "https://learn.microsoft.com/en-us/cli/azure/install-azure-cli"],
        ["kubectl",     "https://kubernetes.io/docs/tasks/tools/"],
        ["Git",         "https://git-scm.com/downloads"],
      ]),
      blank(),

      h2("2.2 Accounts & Credentials Needed"),
      bullet("Confluent Cloud account (free trial works) → https://confluent.cloud"),
      bullet("Azure subscription with Owner or Contributor + User Access Administrator role"),
      bullet("Azure Service Principal with the above permissions"),
      blank(),

      h2("2.3 Create Azure Service Principal"),
      p("Run the following in Azure CLI to create a service principal and note the output values:"),
      code("az login"),
      code("az account show   # note the subscriptionId and tenantId"),
      code("az ad sp create-for-rbac --name poc-terraform-sp \\"),
      code("  --role Contributor \\"),
      code("  --scopes /subscriptions/<YOUR_SUBSCRIPTION_ID>"),
      p("The output gives you: appId (→ client_id), password (→ client_secret), tenant (→ tenant_id)."),
      blank(),

      h2("2.4 Create Confluent Cloud API Key"),
      bullet("Log in to https://confluent.cloud"),
      bullet("Go to: Top-right menu → Cloud API keys"),
      bullet("Click + Add key → Granular access → Global access"),
      bullet("Save the Key and Secret — you only see the secret once"),
      blank(),

      // ── PROJECT STRUCTURE ────────────────────────────────────
      h1("3. Project Structure"),
      code("confluent-kafka-terraform/"),
      code("├── main.tf                    # Root – wires modules together"),
      code("├── variables.tf               # All input variables"),
      code("├── outputs.tf                 # Useful outputs after apply"),
      code("├── terraform.tfvars           # YOUR values (never commit to Git)"),
      code("├── .gitignore"),
      code("├── modules/"),
      code("│   ├── confluent/             # Confluent Env, Cluster, Topics, ACLs"),
      code("│   │   ├── main.tf"),
      code("│   │   ├── variables.tf"),
      code("│   │   └── outputs.tf"),
      code("│   └── aks/                   # Azure VNet + AKS Cluster"),
      code("│       ├── main.tf"),
      code("│       ├── variables.tf"),
      code("│       └── outputs.tf"),
      code("└── docs/"),
      code("    └── POC_Documentation.docx (this file)"),
      blank(),

      // ── RUN STEPS ────────────────────────────────────────────
      h1("4. Run Steps (Step-by-Step)"),

      h2("Step 1: Download & Extract Project"),
      p("Download the ZIP from the GitHub repo (or extract from wherever you received this). Open a terminal in the root folder confluent-kafka-terraform/."),
      blank(),

      h2("Step 2: Fill in Your Credentials"),
      p("Open terraform.tfvars and replace all REPLACE_WITH_... placeholders:"),
      code('confluent_cloud_api_key    = "YOUR_CONFLUENT_KEY"'),
      code('confluent_cloud_api_secret = "YOUR_CONFLUENT_SECRET"'),
      code('azure_subscription_id      = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"'),
      code('azure_tenant_id            = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"'),
      code('azure_client_id            = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"'),
      code('azure_client_secret        = "your-sp-secret"'),
      blank(),

      h2("Step 3: Initialize Terraform"),
      p("This downloads all required providers (Confluent, AzureRM, AzureAD):"),
      code("terraform init"),
      p("Expected output: Terraform has been successfully initialized!"),
      blank(),

      h2("Step 4: Review Plan"),
      p("See exactly what Terraform will create before applying:"),
      code("terraform plan -out=poc.tfplan"),
      p("Expected: ~25-30 resources to create. Review and confirm the list looks correct."),
      blank(),

      h2("Step 5: Apply (Provision Everything)"),
      p("This creates all cloud resources. Estimated time: 20-35 minutes (AKS + Dedicated Kafka cluster take the longest)."),
      code("terraform apply poc.tfplan"),
      p("Type yes when prompted, or use -auto-approve to skip confirmation."),
      blank(),
      p("IMPORTANT: At the end, Terraform prints output values. Save the kafka_api_key and kafka_api_secret by running:"),
      code("terraform output -json > outputs.json"),
      blank(),

      h2("Step 6: Configure kubectl for AKS"),
      code("az aks get-credentials --resource-group poc-kafka-rg --name poc-aks-cluster"),
      code("kubectl get nodes   # should show 2 nodes in Ready state"),
      blank(),

      // ── VERIFICATION STEPS ────────────────────────────────────
      h1("5. Verification Steps"),

      h2("5.1 Verify Confluent Resources (Cloud Console)"),
      bullet("Log in to https://confluent.cloud"),
      bullet("Go to Environments → poc-environment — it should exist"),
      bullet("Click on the environment → Clusters → poc-kafka-cluster — Status: Running"),
      bullet("Click on cluster → Topics → you should see 'orders' and 'payments'"),
      bullet("Go to cluster → Service accounts → poc-kafka-cluster-sa should be listed"),
      bullet("Go to cluster → API keys → poc-kafka-cluster-kafka-api-key should be listed"),
      bullet("Go to cluster → ACLs → 3 rules for the service account (WRITE + READ on topics, READ on group)"),
      blank(),

      h2("5.2 Verify PrivateLink (Azure Portal)"),
      bullet("Open Azure Portal → Resource Group: poc-kafka-rg"),
      bullet("Find resource: poc-kafka-cluster-pe (type: Private endpoint)"),
      bullet("Click it → Connection state should show Approved"),
      bullet("Under DNS configuration, the Confluent bootstrap DNS should resolve to a private IP"),
      blank(),

      h2("5.3 Verify AKS (CLI)"),
      code("kubectl get nodes"),
      p("Expected output: 2 nodes with STATUS = Ready"),
      code("kubectl get namespaces"),
      p("Expected: default, kube-system, kube-public"),
      code("az aks show --resource-group poc-kafka-rg --name poc-aks-cluster --query provisioningState"),
      p("Expected output: \"Succeeded\""),
      blank(),

      h2("5.4 Verify Kafka Connectivity from AKS (Optional Advanced Check)"),
      p("Deploy a test Kafka producer pod to verify end-to-end private connectivity:"),
      code("# Get bootstrap endpoint"),
      code("terraform output kafka_bootstrap_endpoint"),
      code(""),
      code("# Get API credentials"),
      code("terraform output -raw kafka_api_key     # save this"),
      code("terraform output -raw kafka_api_secret  # save this"),
      code(""),
      code("# Deploy test pod"),
      code("kubectl run kafka-test --image=confluentinc/cp-kafka:7.6.0 --restart=Never -- sleep 3600"),
      code("kubectl exec -it kafka-test -- bash"),
      code(""),
      code("# Inside the pod - produce a test message"),
      code("kafka-console-producer --broker-list <BOOTSTRAP_ENDPOINT> \\"),
      code("  --producer-property security.protocol=SASL_SSL \\"),
      code("  --producer-property sasl.mechanism=PLAIN \\"),
      code("  --producer-property sasl.jaas.config='org.apache.kafka.common.security.plain.PlainLoginModule required username=\"<API_KEY>\" password=\"<API_SECRET>\";' \\"),
      code("  --topic orders"),
      code("# Type: Hello from POC  then press Ctrl+C"),
      code(""),
      code("# Consume the message back"),
      code("kafka-console-consumer --bootstrap-server <BOOTSTRAP_ENDPOINT> \\"),
      code("  --consumer-property security.protocol=SASL_SSL \\"),
      code("  --consumer-property sasl.mechanism=PLAIN \\"),
      code("  --consumer-property sasl.jaas.config='org.apache.kafka.common.security.plain.PlainLoginModule required username=\"<API_KEY>\" password=\"<API_SECRET>\";' \\"),
      code("  --topic orders --from-beginning"),
      p("You should see 'Hello from POC' printed — confirming full end-to-end private Kafka connectivity."),
      blank(),

      // ── CLEANUP ──────────────────────────────────────────────
      h1("6. Cleanup (Destroy All Resources)"),
      p("To tear down everything and avoid cloud costs:"),
      code("terraform destroy"),
      p("Type yes to confirm. This removes all Azure and Confluent resources created by this project."),
      blank(),

      // ── TROUBLESHOOTING ──────────────────────────────────────
      h1("7. Common Issues & Fixes"),
      kvTable([
        ["Private endpoint stuck in Pending",   "Wait 5-10 mins; Confluent must approve the connection. Run terraform apply again if it times out."],
        ["Kafka topic creation fails",           "The Dedicated cluster takes ~15 mins to be RUNNING. terraform apply will retry automatically."],
        ["AKS credentials not found",            "Run: az aks get-credentials --resource-group poc-kafka-rg --name poc-aks-cluster"],
        ["Provider version conflict",            "Run: terraform init -upgrade to update provider lock file."],
        ["Confluent API 401 error",              "Double-check confluent_cloud_api_key and secret in terraform.tfvars; ensure they are Cloud-level keys (not Kafka-level)."],
        ["az login required",                    "Run az login and re-run terraform apply."],
      ]),
      blank(),

      // ── COST ESTIMATE ────────────────────────────────────────
      h1("8. Approximate Cost (POC Only)"),
      p("Note: These are estimates for a short-lived POC. Destroy resources immediately after demo."),
      kvTable([
        ["Confluent Dedicated Cluster (1 CKU)", "~$1.50/hour"],
        ["AKS (2x Standard_D2s_v3 nodes)",     "~$0.20/hour"],
        ["Azure VNet + Private Endpoint",       "~$0.01/hour"],
        ["Total (running 4 hours)",             "~$7-8 USD"],
      ]),
      blank(),

      // ── SUMMARY ──────────────────────────────────────────────
      h1("9. Summary of What Was Built"),
      bullet("Confluent Cloud Environment: poc-environment"),
      bullet("Dedicated Kafka Cluster: poc-kafka-cluster (Azure East US, private network only)"),
      bullet("Azure VNet + dedicated subnet for private endpoints"),
      bullet("Azure Private Endpoint (PrivateLink) → Confluent cluster (no public internet traffic)"),
      bullet("Azure Kubernetes Service (AKS): poc-aks-cluster, 2 nodes"),
      bullet("Kafka Topics: orders (6 partitions), payments (6 partitions)"),
      bullet("Service Account: poc-kafka-cluster-sa"),
      bullet("Kafka API Key + Secret scoped to the service account"),
      bullet("ACLs: WRITE + READ on both topics; READ on consumer group"),
      blank(),
      p("All infrastructure is managed by Terraform and can be reproduced or destroyed with a single command."),

    ]
  }]
});

Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync("/home/claude/confluent-kafka-terraform/docs/POC_Documentation.docx", buffer);
  console.log("Documentation created successfully.");
});
