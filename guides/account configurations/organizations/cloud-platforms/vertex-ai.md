<!--
id: vertex-ai-cloud-security
type: CONFIGURATION
scope: ORGANIZATION
-->

<div align="center">
  <img src="../../../../images/guides/vertex-ai.svg" alt="Vertex AI Logo" width="64" height="64">
  <h2><a href="https://cloud.google.com/products/gemini-enterprise-agent-platform" target="_blank" rel="noopener noreferrer">Vertex AI (Gemini Enterprise Agent Platform)</a> Configuration Guide</h2>
  <p><em>Identity, Model Access, Network, Encryption, Logging, Guardrail, Agent and Notebook controls for Vertex AI organizations</em></p>
</div>

---

## How to Use This Guide

Each item states its **pass** condition, then gives **Console** (the Google Cloud console) and **CLI** (`gcloud`, plus `curl` against the Vertex AI REST API where `gcloud` has no command) steps to **Verify** and **Fix** it. Under CLI, **Expect** is the output that means it passes. Pick the channel you work in at the top of the guide; an item shows only the channels that can check or change the setting, and it passes only when every resource the command returns meets the condition.

#### Prerequisites

- Google Cloud CLI - check with `gcloud version`. Install `jq`; the `curl` items pipe JSON through it.
- Google renamed Vertex AI to Gemini Enterprise Agent Platform:
  - The console section is now `Agent Platform`, while the API (`aiplatform.googleapis.com`), the `gcloud ai` commands, the `roles/aiplatform.*` roles and the `constraints/vertexai.*` policies keep the Vertex AI names.
  - Role display names in the console read `Agent Platform User`, `Agent Platform Administrator` and `Agent Platform Viewer`.
- Sign in and confirm your context:
  - `gcloud auth login`
  - `gcloud organizations list` and `gcloud projects list --format="table(projectId, name, lifecycleState)"`
  - `gcloud config set project <project-id>`
- **Most checks are per-project and per-region.** Endpoints, jobs, indexes, agents and corpora live in a region; run the region-scoped commands once for every region where the project has Vertex AI resources. To sweep every project you can see, wrap the command:
  - `for p in $(gcloud projects list --format="value(projectId)"); do echo "== $p"; <command> --project="$p"; done`
- Organization-level items need the organization ID:
  - `export ORG_ID=$(gcloud organizations list --format="value(name.segment(1))" | head -1)`
  - Export it in the shell you run the Fixes in, not just the Verifies: the organization-policy and custom-constraint Fixes expand `$ORG_ID` into the YAML file they write, so with it unset they write `organizations//...` and the `gcloud` call that follows is rejected.
  - The one JSON body that expands it, the agent deny policy, puts it in a trust domain rather than a resource name: unset, it writes `agents.global.org-.system.id.goog/*`, which matches no agent.
- The `curl` items call the REST API with `$(gcloud auth print-access-token)`; a Fix that sends a request body either writes it as `request.json` first or passes it inline with `-d`.
- A read-only principal is enough for every CLI **Verify** command. Grant these at the organization level:
  - `roles/viewer`
  - `roles/iam.securityReviewer`
  - `roles/orgpolicy.policyViewer`
  - `roles/modelarmor.viewer`
- The Fixes need, by what they change:
  - `roles/orgpolicy.policyAdmin` (organization policies and custom constraints)
  - `roles/accesscontextmanager.policyAdmin` (VPC Service Controls)
  - `roles/aiplatform.admin` (Vertex AI resources and the caching setting)
  - `roles/modelarmor.floorSettingsAdmin` (Model Armor)
  - `roles/iam.denyAdmin` (deny policies)
  - `roles/cloudkms.admin` (keys)
  - `roles/resourcemanager.projectIamAdmin` and, for the organization-level binding, `roles/resourcemanager.organizationAdmin` (IAM bindings and audit logging)
  - `roles/iam.roleAdmin` (custom roles)
  - `roles/iam.serviceAccountAdmin` and `roles/iam.serviceAccountUser` (service accounts)
  - `roles/notebooks.admin` (Workbench)
  - `roles/logging.configWriter` and `roles/monitoring.alertPolicyEditor` (the governance alert)
  - `roles/compute.networkAdmin` and `roles/dns.admin` (Private Service Connect)
  - `roles/secretmanager.admin` (secret grants)
  - `roles/serviceusage.apiKeysAdmin` (API keys)
  - `roles/bigquery.dataOwner` (the log dataset)
  - `roles/securitycenter.admin` with `roles/dlp.admin` (AI Protection)
- Paid tiers:
  - Model Armor is billed per token screened and is sold standalone or inside Security Command Center.
  - AI Protection detections need Security Command Center Premium.
  - CMEK on RAG Engine corpora needs the Spanner deployment mode, which is billed per tier.
- No other control needs a paid tier, but some items add resources that are billed by use:
  - Cloud KMS keys
  - Private Service Connect endpoints and interfaces
  - a Cloud DNS zone
  - extra Cloud Logging volume
  - the BigQuery tables that receive request-response logs
  - Sensitive Data Protection discovery, unless Security Command Center Premium or Enterprise is active at the organization level

---

## Identity & Access (IAM)

- [ ] **Grant Workloads the Agent Platform User Role Only** - pass: no workload service account holds `roles/aiplatform.admin`, `roles/aiplatform.editor`, `roles/iam.mlEngineer`, `roles/admin`, `roles/writer`, `roles/owner` or `roles/editor` on a project that runs Vertex AI; model callers hold `roles/aiplatform.user` or a narrower custom role
  - **Console**:
    - Verify: Google Cloud console > IAM & Admin > IAM > select the project in the resource picker > Role column shows no `Agent Platform Administrator`, `Aiplatform Editor`, `ML Engineer`, `Admin`, `Writer`, `Owner` or `Editor` on any service-account row
    - Fix: Google Cloud console > IAM & Admin > IAM > select the project in the resource picker > Edit principal on the service account's row > Delete on the `Agent Platform Administrator`, `Aiplatform Editor`, `ML Engineer`, `Admin`, `Writer`, `Owner` or `Editor` role > Add another role > `Agent Platform User` > Save
  - **CLI**:
    - Verify:
      ```bash
      for p in $(gcloud projects list --format="value(projectId)"); do
        gcloud projects get-iam-policy "$p" --flatten="bindings[].members" --format="value(bindings.role, bindings.members)" --filter="bindings.members:serviceAccount AND (bindings.role:roles/aiplatform.admin OR bindings.role:roles/aiplatform.editor OR bindings.role:roles/iam.mlEngineer OR bindings.role:roles/admin OR bindings.role:roles/writer OR bindings.role:roles/owner OR bindings.role:roles/editor)" | sed "s|^|$p |"
      done
      ```
    - Expect: no output. A service account holding Agent Platform Administrator can accept model terms, turn off the caching control and grant itself more with one leaked credential.
    - Fix: `gcloud projects remove-iam-policy-binding <project-id> --member=serviceAccount:<sa> --role=<role>`
    - Fix:
      ```bash
      gcloud projects add-iam-policy-binding <project-id> --member=serviceAccount:<sa> --role=roles/aiplatform.user
      ```

- [ ] **Grant Inference Callers a Custom Role Limited to endpoints.predict** - pass: every principal that only calls online inference holds a custom role whose permissions are `aiplatform.endpoints.predict` (plus `aiplatform.endpoints.get` if it must resolve endpoints) and nothing that deploys, tunes or creates jobs
  - **Console**:
    - Verify: Google Cloud console > IAM & Admin > Roles > Custom tab > <role> > the permission list shows `aiplatform.endpoints.predict` and no `aiplatform.endpoints.deploy`, `aiplatform.customJobs.create` or `aiplatform.models.upload`, and Google Cloud console > IAM & Admin > IAM > select the project > the calling service account's row lists that custom role and no `Agent Platform User`
    - Fix: Google Cloud console > IAM & Admin > Roles > Create custom role > Title `Vertex AI invoker` > Add Permissions > filter `aiplatform.endpoints.predict` > select it > Add Permissions > create the role, then Google Cloud console > IAM & Admin > IAM > Grant access > New principals: the calling service account > Select a role: `Vertex AI invoker` > Save
  - **CLI**:
    - Verify: `gcloud iam roles describe vertexInvoker --project=<project-id> --format="value(includedPermissions)"`
    - Verify:
      ```bash
      gcloud projects get-iam-policy <project-id> --flatten="bindings[].members" --format="value(bindings.members)" --filter="bindings.role:projects/<project-id>/roles/vertexInvoker"
      ```
    - Expect: `aiplatform.endpoints.predict` (with at most `aiplatform.endpoints.get`) from the first command, then the calling service account from the second, which reads project-level bindings; grant the role at project level, or grant it on the endpoint and read that endpoint's own permissions panel instead. A caller holding Agent Platform User can also deploy, tune and open a shell into training jobs.
    - Fix:
      ```bash
      gcloud iam roles create vertexInvoker --project=<project-id> --title="Vertex AI invoker" --permissions=aiplatform.endpoints.predict --stage=GA
      ```
    - Fix:
      ```bash
      gcloud projects add-iam-policy-binding <project-id> --member=serviceAccount:<sa> --role=projects/<project-id>/roles/vertexInvoker
      ```

- [ ] **Deny Model-Terms Consent and Cache-Setting Changes to Everyone but the AI Governance Group** - pass: a deny policy on the folder or project denies `aiplatform.googleapis.com/consents.update` and `aiplatform.googleapis.com/cacheConfigs.update` to `principalSet://goog/public:all`, with only the governance group in `exceptionPrincipals`
  - **Console**:
    - Verify: Google Cloud console > IAM & Admin > IAM > Deny > select the project in the resource picker > <policy> > the rule lists `aiplatform.googleapis.com/consents.update` and `aiplatform.googleapis.com/cacheConfigs.update` under Denied permissions, `All principals` under Denied principals and the governance group under Exception principals
    - Fix: Google Cloud console > IAM & Admin > IAM > Deny > Create deny policy > ID `deny-vertex-governance` > Denied principals: `All principals` > Exception principals: <governance group> > Denied permissions: `aiplatform.googleapis.com/consents.update`, `aiplatform.googleapis.com/cacheConfigs.update` > Create
  - **CLI**:
    - Verify:
      ```bash
      for p in $(gcloud iam policies list --attachment-point=cloudresourcemanager.googleapis.com/projects/<project-id> --kind=denypolicies --format="value(name.basename())"); do
        gcloud iam policies get "$p" --attachment-point=cloudresourcemanager.googleapis.com/projects/<project-id> --kind=denypolicies --format=json | jq -r '.rules[].denyRule | [(.deniedPermissions|join(",")), (.deniedPrincipals|join(",")), ((.exceptionPrincipals // [])|join(","))] | @tsv'
      done
      ```
    - Expect: one line naming both permissions, `principalSet://goog/public:all` and only the governance group. Without it any administrator can accept the Advanced AI Safety Addendum for the project, which logs every prompt and response for up to 30 days, or flip the caching setting.
    - Fix:
      ```bash
      cat > policy.json <<'JSON'
      {
        "displayName": "Deny Vertex AI governance changes",
        "rules": [{
          "denyRule": {
            "deniedPrincipals": ["principalSet://goog/public:all"],
            "exceptionPrincipals": ["principalSet://goog/group/<governance-group>@<domain>"],
            "deniedPermissions": [
              "aiplatform.googleapis.com/consents.update",
              "aiplatform.googleapis.com/cacheConfigs.update"
            ]
          }
        }]
      }
      JSON
      gcloud iam policies create deny-vertex-governance --attachment-point=cloudresourcemanager.googleapis.com/projects/<project-id> --kind=denypolicies --policy-file=policy.json
      ```

- [ ] **Deploy Custom-Trained Models With a Dedicated Service Account** - pass: every deployed model on a production endpoint reports a `serviceAccount`
  - **Console**:
    - Verify: Google Cloud console > Agent Platform > Online prediction > <endpoint> > the deployed model's details show a Service account you created, not blank
    - Fix: Google Cloud console > Agent Platform > Model Registry > <model> > Deploy & Test > Deploy to endpoint > Add to existing endpoint: <endpoint> > Continue > Model settings > Service account: <dedicated account> > Deploy, then undeploy the model that ran without one
  - **CLI**:
    - Verify:
      ```bash
      gcloud ai endpoints list --region=<region> --format="table(name.basename(), deployedModels[].serviceAccount)"
      ```
    - Expect: an account email for every deployed model and no `None` in the list. A `None` means the container runs as a Vertex-managed identity you cannot inspect or restrict.
    - Fix:
      ```bash
      gcloud ai endpoints deploy-model <endpoint-id> --region=<region> --model=<model-id> --display-name=<name> --service-account=<sa> --traffic-split=0=100
      ```
    - Fix:
      ```bash
      gcloud ai endpoints undeploy-model <endpoint-id> --region=<region> --deployed-model-id=<old-deployed-model-id>
      ```

- [ ] **Block Service-Account-Bound API Keys for the Vertex AI API (an authorization key is a long-lived bearer token for the service account it is bound to)** - pass: `constraints/iam.managed.disableServiceAccountApiKeyCreation` is enforced without `aiplatform.googleapis.com` in `allowedServices`, and no API key in a Vertex AI project reports a `serviceAccountEmail`
  - **Console**:
    - Verify: Google Cloud console > IAM & Admin > Organization Policies > select the organization in the resource picker > `Block service account API key bindings` > Policy details > Effective policy reads Enforced with no `aiplatform.googleapis.com` value, and Google Cloud console > APIs & Services > Credentials > API keys > no key row shows a bound service account
    - Fix: Google Cloud console > IAM & Admin > Organization Policies > select the organization in the resource picker > `Block service account API key bindings` > Manage policy > Policy source: Override parent's policy > Add a rule > Enforcement: On > remove any `aiplatform.googleapis.com` value > Set policy, then Google Cloud console > APIs & Services > Credentials > API keys > delete each key whose details show a bound service account
  - **CLI**:
    - Verify:
      ```bash
      gcloud org-policies describe iam.managed.disableServiceAccountApiKeyCreation --organization=$ORG_ID --effective --format=yaml
      ```
    - Verify:
      ```bash
      gcloud services api-keys list --project=<project-id> --filter="serviceAccountEmail:*" --format="table(name.basename(), displayName, serviceAccountEmail, restrictions.apiTargets[].service)"
      ```
    - Expect: `enforce: true` with no `allowedServices` entry for `aiplatform.googleapis.com`, and no key rows. A key bound to a service account is a bearer credential that calls models as that account and leaves no trace in its usage metrics.
    - Fix: `gcloud services api-keys delete <key-id> --project=<project-id>`
    - Fix:
      ```bash
      cat > spec.yaml <<YAML
      name: organizations/$ORG_ID/policies/iam.managed.disableServiceAccountApiKeyCreation
      spec:
        rules:
        - enforce: true
      YAML
      gcloud org-policies set-policy spec.yaml --update-mask=spec
      ```

---

## Model Access & Organization Policy

- [ ] **Allow Only Approved Models and Actions in Model Garden** - pass: `constraints/vertexai.allowedModels` is enforced with an `allowedValues` list of `publishers/<publisher>/models/<model>:<action>` entries and no lower policy overrides it
  - **Console**:
    - Verify: Google Cloud console > IAM & Admin > Organization Policies > select the organization in the resource picker > `Define access to models on Vertex AI` > Policy details > Effective policy lists only approved `publishers/.../models/...:predict`, `:deploy` or `:tune` values
    - Fix: Google Cloud console > IAM & Admin > Organization Policies > select the organization in the resource picker > `Define access to models on Vertex AI` > Manage policy > Override parent's policy > Add a rule > Policy values: Custom > Policy type: Allow > Custom value: one `publishers/<publisher>/models/<model>:<action>` entry per approved model and action (Add value for each) > Set policy
  - **CLI**:
    - Verify: `gcloud org-policies describe vertexai.allowedModels --organization=$ORG_ID --effective --format=yaml`
    - Expect: `spec.rules[].values.allowedValues` naming only approved model:action entries. Without a policy every model in Model Garden, including ones flagged as able to execute remote code, is callable, deployable and tunable by any Vertex user.
    - Fix:
      ```bash
      cat > allowed-models.yaml <<YAML
      name: organizations/$ORG_ID/policies/vertexai.allowedModels
      spec:
        rules:
        - values:
            allowedValues:
            - publishers/google/models/<model>:predict
            - publishers/anthropic/models/<model>:predict
      YAML
      gcloud org-policies set-policy allowed-models.yaml
      ```

- [ ] **Allow Partner Model Web Search and Structured Outputs Only for Named Models** - pass: `constraints/vertexai.allowedPartnerModelFeatures` is unset or its `allowedValues` are `publishers/<publisher>/models/<model>:<feature>` entries only, never `allowAll`, `deniedValues`, a bare `publishers/<publisher>` or `publishers/<publisher>/models/<model>`
  - **Console**:
    - Verify: Google Cloud console > IAM & Admin > Organization Policies > select the organization in the resource picker > `Define the managed partner model's advanced features that can be used on Vertex AI` > Policy details > Effective policy is not set, or allows only values ending in `:web_search` or `:structured_outputs` and denies none
    - Fix: Google Cloud console > IAM & Admin > Organization Policies > select the organization in the resource picker > `Define the managed partner model's advanced features that can be used on Vertex AI` > Manage policy > Override parent's policy > delete any rule with Policy values: Allow all or Policy type: Deny, and any `publishers/<publisher>` or `publishers/<publisher>/models/<model>` value > Add a rule > Policy values: Custom > Policy type: Allow > Custom value: `publishers/<publisher>/models/<model>:web_search` > Set policy
  - **CLI**:
    - Verify:
      ```bash
      gcloud org-policies describe vertexai.allowedPartnerModelFeatures --organization=$ORG_ID --effective --flatten="spec.rules[]" --format="value(spec.rules.allowAll, spec.rules.values.deniedValues, spec.rules.values.allowedValues)"
      ```
    - Expect: on every line, no `True` in the first column, nothing in the second, and the third empty or listing only values that end in `:web_search` or `:structured_outputs`. An allow-all or deny-list rule, or a publisher-wide value, lets partner models you never named fetch web content on your behalf.
    - Fix:
      ```bash
      cat > partner-features.yaml <<YAML
      name: organizations/$ORG_ID/policies/vertexai.allowedPartnerModelFeatures
      spec:
        rules:
        - values:
            allowedValues:
            - publishers/anthropic/models/<model>:web_search
      YAML
      gcloud org-policies set-policy partner-features.yaml
      ```

- [ ] **Disable Grounding with Google Search (Google keeps the grounding queries for three days and offers no opt-out)** - pass: `constraints/vertexai.disableGenAIGoogleSearchGrounding` is enforced wherever zero data retention applies
  - **Console**:
    - Verify: Google Cloud console > IAM & Admin > Organization Policies > select the organization in the resource picker > `Disable Grounding with Google Search in generative AI APIs` > Policy details > Effective policy reads Enforced
    - Fix: Google Cloud console > IAM & Admin > Organization Policies > select the organization in the resource picker > `Disable Grounding with Google Search in generative AI APIs` > Manage policy > Override parent's policy > Add a rule > Enforcement: On > Set policy
  - **CLI**:
    - Verify:
      ```bash
      gcloud org-policies describe vertexai.disableGenAIGoogleSearchGrounding --organization=$ORG_ID --effective --format=yaml
      ```
    - Expect: `rules: - enforce: true`. Otherwise any application can turn on a tool whose query logs Google keeps for three days with no way to disable the storage.
    - Fix:
      ```bash
      gcloud resource-manager org-policies enable-enforce constraints/vertexai.disableGenAIGoogleSearchGrounding --organization=$ORG_ID
      ```

- [ ] **Restrict Generative AI Grounding Sources to Reviewed Ones** - pass: `constraints/vertexai.genAIGroundingSources` is enforced with an `allowedValues` list, `UrlContext`, `ExternalApiSimpleSearch`, `ExternalApiElasticSearch` and `ParallelAiSearch` appear only where an application was designed for them, and `GoogleMaps` is absent wherever zero data retention is required
  - **Console**:
    - Verify: Google Cloud console > IAM & Admin > Organization Policies > select the organization in the resource picker > `Control Grounding Sources in Vertex AI Generative APIs` > Policy details > Effective policy lists only the reviewed sources
    - Fix: Google Cloud console > IAM & Admin > Organization Policies > select the organization in the resource picker > `Control Grounding Sources in Vertex AI Generative APIs` > Manage policy > Override parent's policy > Add a rule > Policy values: Custom > Policy type: Allow > Custom value: `VertexRagStore` and each other reviewed source (Add value for each) > Set policy
  - **CLI**:
    - Verify:
      ```bash
      gcloud org-policies describe vertexai.genAIGroundingSources --organization=$ORG_ID --effective --format="value(spec.rules.values.allowedValues)"
      ```
    - Expect: a non-empty list naming only reviewed sources, and no `GoogleMaps` in a project that needs zero data retention (Google keeps Maps grounding prompts and output for 30 days with no opt-out); an empty line means no allow list is set. With every source allowed, a prompt injection can make the model fetch and return content from any URL or external API the application can reach.
    - Fix:
      ```bash
      cat > grounding-sources.yaml <<YAML
      name: organizations/$ORG_ID/policies/vertexai.genAIGroundingSources
      spec:
        rules:
        - values:
            allowedValues:
            - VertexRagStore
            - VertexAiSearch
      YAML
      gcloud org-policies set-policy grounding-sources.yaml
      ```

- [ ] **Restrict the Vertex AI API to Approved Folders and Projects** - pass: `constraints/gcp.restrictServiceUsage` denies `aiplatform.googleapis.com` on every folder that is not approved for AI workloads
  - **Console**:
    - Verify: Google Cloud console > IAM & Admin > Organization Policies > select the non-AI folder in the resource picker > `Restrict Resource Service Usage` > Policy details > Effective policy lists `aiplatform.googleapis.com` under Denied
    - Fix: Google Cloud console > IAM & Admin > Organization Policies > select the folder in the resource picker > `Restrict Resource Service Usage` > Manage policy > Override parent's policy > Add a rule > Policy values: Custom > Policy type: Deny > Custom value: `aiplatform.googleapis.com` > Set policy
  - **CLI**:
    - Verify:
      ```bash
      gcloud resource-manager org-policies describe constraints/gcp.restrictServiceUsage --folder=<folder-id> --effective
      ```
    - Expect: a `listPolicy` whose `deniedValues` includes `aiplatform.googleapis.com` on every folder outside the AI landing zone. Otherwise any project owner can enable the API and start sending data to models outside your perimeter and logging.
    - Fix:
      ```bash
      gcloud resource-manager org-policies deny constraints/gcp.restrictServiceUsage aiplatform.googleapis.com --folder=<folder-id>
      ```

---

## Network & Private Connectivity

- [ ] **Protect the Vertex AI and Notebooks APIs With a VPC Service Controls Perimeter** - pass: an enforced perimeter lists `aiplatform.googleapis.com` and `notebooks.googleapis.com` in restricted services for every project that runs Vertex AI, and those projects joined the perimeter before their endpoints, agents and sandboxes were created
  - **Console**:
    - Verify: Google Cloud console > Security > VPC Service Controls > select the organization in the resource picker > Enforced mode > <perimeter> > Restricted services lists `Agent Platform API` and `Notebooks API`, and the perimeter's projects include every Vertex AI project
    - Fix: Google Cloud console > Security > VPC Service Controls > select the organization in the resource picker > Dry run mode > New perimeter > Title > Perimeter type: Regular > Add projects: every Vertex AI project > Restricted services > Add services > `Agent Platform API`, `Notebooks API` > Create, add an access level for your corporate CIDRs, review the dry-run violation logs, then <perimeter> > Enforce config
  - **CLI**:
    - Verify:
      ```bash
      gcloud access-context-manager perimeters list --policy=<policy-id> --format="table(title, status.resources, status.restrictedServices)"
      ```
    - Expect: a perimeter whose `restrictedServices` include `aiplatform.googleapis.com` and `notebooks.googleapis.com` and whose resources list every Vertex AI project. Without it a stolen credential works from anywhere and prompts, models and training data can be copied out through the API.
    - Fix:
      ```bash
      gcloud access-context-manager perimeters update <perimeter> --policy=<policy-id> --add-restricted-services=aiplatform.googleapis.com,notebooks.googleapis.com
      ```
    - Fix:
      ```bash
      gcloud access-context-manager perimeters dry-run create <name> --policy=<policy-id> --perimeter-title=<title> --perimeter-type=regular \
        --perimeter-resources=projects/<project-number> --perimeter-restricted-services=aiplatform.googleapis.com,notebooks.googleapis.com
      ```
    - Fix: `gcloud access-context-manager perimeters dry-run enforce <name> --policy=<policy-id>`

- [ ] **Serve Custom Models Through Private Service Connect Endpoints** - pass: every production online-inference endpoint reports `privateServiceConnectConfig.enablePrivateServiceConnect` = `true` with a `projectAllowlist` naming only your consumer projects (or `network` set for private services access); no shared public endpoint serves a production model
  - **Console**:
    - Verify: Google Cloud console > Agent Platform > Online prediction > <endpoint> > the endpoint's details show access type `Private Service Connect` (or a peered network), never `Standard`
    - Fix: Google Cloud console > Agent Platform > Online prediction > Create > display name > `Private` > `Private Service Connect` > Select project IDs > add the consumer projects > Continue > choose the model > Create, then undeploy the model from the public endpoint
  - **CLI**:
    - Verify:
      ```bash
      gcloud ai endpoints list --region=<region> --format="table(name.basename(), privateServiceConnectConfig.enablePrivateServiceConnect, privateServiceConnectConfig.projectAllowlist, network, dedicatedEndpointEnabled)"
      ```
    - Expect: `True` and an allowlist (or a network) on every production row. A public endpoint answers any caller on the internet who obtains a credential, and it cannot be made private later.
    - Fix:
      ```bash
      cat > request.json <<'JSON'
      {
        "displayName": "<endpoint-name>",
        "privateServiceConnectConfig": {
          "enablePrivateServiceConnect": true,
          "projectAllowlist": ["<project-id>", "<consumer-project-id>"]
        }
      }
      JSON
      curl -X POST -H "Authorization: Bearer $(gcloud auth print-access-token)" -H "Content-Type: application/json; charset=utf-8" -d @request.json "https://<region>-aiplatform.googleapis.com/v1/projects/<project-id>/locations/<region>/endpoints"
      ```

- [ ] **Reach the Vertex AI API Through a Private Service Connect Endpoint for Google APIs** - pass: every VPC that calls `*-aiplatform.googleapis.com` has a global forwarding rule targeting the `all-apis` or `vpc-sc` bundle, and a private Cloud DNS zone for `googleapis.com.` holds an `A` record on `googleapis.com.` pointing at that rule's address and a `CNAME` on `*.googleapis.com.` pointing at `googleapis.com.`
  - **Console**:
    - Verify: Google Cloud console > Private Service Connect > Connected endpoints > a row whose Target is `All Google APIs` or `VPC-SC` exists for each network that calls the Vertex AI API
    - Fix: Google Cloud console > Private Service Connect > Connected endpoints > Connect endpoint > Target: `All Google APIs` (or `VPC-SC` inside a perimeter) > Endpoint name > Network > IP Address: Create IP address > Add endpoint, then create a private Cloud DNS zone for `googleapis.com.` holding an `A` record on `googleapis.com.` that points at that address and a `CNAME` on `*.googleapis.com.` that points at `googleapis.com.`
  - **CLI**:
    - Verify:
      ```bash
      gcloud compute forwarding-rules list --global --filter='target=(all-apis OR vpc-sc)' --format="table(name, IPAddress, target, network)"
      ```
    - Verify:
      ```bash
      gcloud dns managed-zones list --filter="dnsName=googleapis.com. AND visibility=private" --format="table(name, dnsName, privateVisibilityConfig.networks[].networkUrl)"
      ```
    - Verify: `gcloud dns record-sets list --zone=<dns-zone> --format="table(name, type, rrdatas[])"`
    - Expect: one rule per Vertex-calling VPC from the first command, a private `googleapis.com.` zone bound to that network from the second, then an `A` row on `googleapis.com.` carrying the rule's address and a `CNAME` row on `*.googleapis.com.` pointing at `googleapis.com.` from the third. Without them API calls, and the prompts in them, leave the VPC for the public addresses of `*-aiplatform.googleapis.com`.
    - Fix:
      ```bash
      gcloud compute addresses create psc-googleapi-ip --global --purpose=PRIVATE_SERVICE_CONNECT --addresses=<internal-ip> --network=<network>
      ```
    - Fix:
      ```bash
      gcloud compute forwarding-rules create pscvertex --global --network=<network> --address=psc-googleapi-ip --target-google-apis-bundle=all-apis
      ```
    - Fix:
      ```bash
      gcloud dns managed-zones create <dns-zone> --dns-name=googleapis.com. --visibility=private --networks=<network> --description="Private Service Connect for Google APIs"
      ```
    - Fix:
      ```bash
      gcloud dns record-sets create googleapis.com. --type=A --ttl=300 --zone=<dns-zone> --rrdatas=<internal-ip>
      ```
    - Fix:
      ```bash
      gcloud dns record-sets create "*.googleapis.com." --type=CNAME --ttl=300 --zone=<dns-zone> --rrdatas=googleapis.com.
      ```

- [ ] **Deploy Agent Runtime Agents With a Private Service Connect Interface** - pass: every reasoning engine reports `spec.deploymentSpec.pscInterfaceConfig.networkAttachment`, and the project is inside the VPC Service Controls perimeter so the agent's only egress is through your VPC
  - **CLI**:
    - Verify:
      ```bash
      curl -s -H "Authorization: Bearer $(gcloud auth print-access-token)" "https://<region>-aiplatform.googleapis.com/v1/projects/<project-id>/locations/<region>/reasoningEngines" \
        | jq -r '.reasoningEngines[]? | [.name, (.spec.deploymentSpec.pscInterfaceConfig.networkAttachment // "NO-PSC-INTERFACE")] | @tsv'
      ```
    - Expect: a network attachment on every agent, never `NO-PSC-INTERFACE`. Unless an Agent Gateway routes its egress through your VPC, an agent without one talks to the internet straight from Google's tenant when outside a perimeter.
    - Fix:
      ```bash
      cat > request.json <<'JSON'
      {
        "displayName": "<agent-name>",
        "spec": {
          "deploymentSpec": {
            "pscInterfaceConfig": {
              "networkAttachment": "projects/<project-id>/regions/<region>/networkAttachments/<attachment>",
              "dnsPeeringConfigs": [{"domain": "<private-zone-domain>", "targetProject": "<vpc-project-id>", "targetNetwork": "<network>"}]
            }
          },
          "<the rest of your agent spec>": "<packageSpec, sourceCodeSpec or containerSpec as the SDK sends it>"
        }
      }
      JSON
      curl -X POST -H "Authorization: Bearer $(gcloud auth print-access-token)" -H "Content-Type: application/json; charset=utf-8" -d @request.json "https://<region>-aiplatform.googleapis.com/v1/projects/<project-id>/locations/<region>/reasoningEngines"
      ```

---

## Encryption & Data Residency

- [ ] **Require CMEK for New Vertex AI Resources Organization-Wide** - pass: `constraints/gcp.restrictNonCmekServices` denies `aiplatform.googleapis.com` on the folders that hold AI workloads
  - **Console**:
    - Verify: Google Cloud console > IAM & Admin > Organization Policies > select the AI folder in the resource picker > `Restrict which services may create resources without CMEK` > Policy details > Effective policy lists `aiplatform.googleapis.com` under Denied
    - Fix: Google Cloud console > IAM & Admin > Organization Policies > select the AI folder in the resource picker > `Restrict which services may create resources without CMEK` > Manage policy > Override parent's policy > Add a rule > Policy values: Custom > Policy type: Deny > Custom value: `aiplatform.googleapis.com` > Set policy
  - **CLI**:
    - Verify:
      ```bash
      gcloud resource-manager org-policies describe constraints/gcp.restrictNonCmekServices --folder=<folder-id> --effective
      ```
    - Expect: a `listPolicy` whose `deniedValues` include `aiplatform.googleapis.com`. Otherwise every new model, endpoint, job and corpus is created under keys you cannot revoke.
    - Fix:
      ```bash
      gcloud resource-manager org-policies deny constraints/gcp.restrictNonCmekServices aiplatform.googleapis.com --folder=<folder-id>
      ```

- [ ] **Restrict CMEK Keys for Vertex AI to Your Key-Management Project** - pass: `constraints/gcp.restrictCmekCryptoKeyProjects` allows only `projects/<kms-project-id>` (or the security folder) on the folders that hold AI workloads
  - **Console**:
    - Verify: Google Cloud console > IAM & Admin > Organization Policies > select the AI folder in the resource picker > `Restrict which projects may supply KMS CryptoKeys for CMEK` > Policy details > Effective policy lists only `projects/<kms-project-id>` under Allowed
    - Fix: Google Cloud console > IAM & Admin > Organization Policies > select the AI folder in the resource picker > `Restrict which projects may supply KMS CryptoKeys for CMEK` > Manage policy > Override parent's policy > Add a rule > Policy values: Custom > Policy type: Allow > Custom value: `projects/<kms-project-id>` > Set policy
  - **CLI**:
    - Verify:
      ```bash
      gcloud resource-manager org-policies describe constraints/gcp.restrictCmekCryptoKeyProjects --folder=<folder-id> --effective
      ```
    - Expect: a `listPolicy` whose `allowedValues` name only your KMS project or security folder. Otherwise a key in any project, including one an attacker controls, can be used to encrypt your models and data.
    - Fix:
      ```bash
      gcloud resource-manager org-policies allow constraints/gcp.restrictCmekCryptoKeyProjects projects/<kms-project-id> --folder=<folder-id>
      ```

- [ ] **Encrypt Online-Inference Endpoints With CMEK** - pass: every endpoint reports `encryptionSpec.kmsKeyName`, and the custom constraint `custom.restrictKmsKey` denies new endpoints without a key
  - **CLI**:
    - Verify:
      ```bash
      gcloud ai endpoints list --region=<region> --format="table(name.basename(), encryptionSpec.kmsKeyName)"
      ```
    - Verify: `gcloud org-policies describe custom.restrictKmsKey --folder=<folder-id> --effective --format=yaml`
    - Expect: a key resource name on every row, then `rules: - enforce: true`. Without CMEK you cannot revoke every deployed copy of a model by disabling one key, or audit its decrypts in Cloud KMS.
    - Fix:
      ```bash
      gcloud kms keys add-iam-policy-binding <key> --keyring=<keyring> --location=<region> --project=<kms-project-id> --member=serviceAccount:service-<project-number>@gcp-sa-aiplatform.iam.gserviceaccount.com --role=roles/cloudkms.cryptoKeyEncrypterDecrypter
      ```
    - Fix:
      ```bash
      gcloud ai endpoints create --region=<region> --display-name=<name> --encryption-kms-key-name=projects/<kms-project-id>/locations/<region>/keyRings/<keyring>/cryptoKeys/<key>
      ```
    - Fix:
      ```bash
      cat > restrict-kms-key.yaml <<YAML
      name: organizations/$ORG_ID/customConstraints/custom.restrictKmsKey
      resourceTypes:
      - aiplatform.googleapis.com/Endpoint
      methodTypes:
      - CREATE
      condition: "resource.encryptionSpec.kmsKeyName == \"\""
      actionType: DENY
      displayName: Deny endpoint without a kms key
      description: All new endpoints must have a KMS key.
      YAML
      gcloud org-policies set-custom-constraint restrict-kms-key.yaml
      ```
    - Fix:
      ```bash
      cat > enforce-restrict-kms-key.yaml <<'YAML'
      name: folders/<folder-id>/policies/custom.restrictKmsKey
      spec:
        rules:
        - enforce: true
      YAML
      gcloud org-policies set-policy enforce-restrict-kms-key.yaml
      ```

- [ ] **Encrypt Custom Training Jobs With CMEK** - pass: every custom job and hyperparameter tuning job reports `encryptionSpec.kmsKeyName`
  - **CLI**:
    - Verify:
      ```bash
      gcloud ai custom-jobs list --region=<region> --format="table(name.basename(), state, encryptionSpec.kmsKeyName)" --filter="NOT encryptionSpec.kmsKeyName:*"
      ```
    - Verify:
      ```bash
      gcloud ai hp-tuning-jobs list --region=<region> --format="table(name.basename(), state, encryptionSpec.kmsKeyName)" --filter="NOT encryptionSpec.kmsKeyName:*"
      ```
    - Expect: no rows from either command. A job without CMEK leaves your code, the loaded training data and every temporary file on VM disks under keys you cannot revoke or audit.
    - Fix:
      ```bash
      gcloud ai custom-jobs create --region=<region> --display-name=<name> --service-account=<sa> --kms-key=<key> --kms-keyring=<keyring> --kms-location=<region> --kms-project=<kms-project-id> --worker-pool-spec=machine-type=<machine-type>,replica-count=1,container-image-uri=<image>
      ```
    - Fix:
      ```bash
      gcloud ai hp-tuning-jobs create --region=<region> --display-name=<name> --config=<config-file> --service-account=<sa> --kms-key=<key> --kms-keyring=<keyring> --kms-location=<region> --kms-project=<kms-project-id>
      ```

- [ ] **Encrypt Model Registry Models With CMEK** - pass: every model reports `encryptionSpec.kmsKeyName`
  - **Console**:
    - Verify: Google Cloud console > Agent Platform > Model Registry > <model> > the model's details show Encryption `Customer-managed encryption key` with your key name
    - Fix: Google Cloud console > Agent Platform > Model Registry > Import > Import as new model > Name and region > Continue > Advanced options > add a customer-managed encryption key > select the key > Import, then delete the model version that was stored without a key
  - **CLI**:
    - Verify:
      ```bash
      gcloud ai models list --region=<region> --format="table(name.basename(), displayName, encryptionSpec.kmsKeyName)"
      ```
    - Expect: a key resource name on every row. Without CMEK you cannot cut off every stored copy of a model by disabling one key, or audit its decrypts in Cloud KMS.
    - Fix:
      ```bash
      cat > request.json <<'JSON'
      {
        "model": {
          "displayName": "<model-name>",
          "artifactUri": "gs://<bucket>/<model-dir>",
          "containerSpec": {"imageUri": "<serving-image>"},
          "encryptionSpec": {"kmsKeyName": "projects/<kms-project-id>/locations/<region>/keyRings/<keyring>/cryptoKeys/<key>"}
        }
      }
      JSON
      curl -X POST -H "Authorization: Bearer $(gcloud auth print-access-token)" -H "Content-Type: application/json; charset=utf-8" -d @request.json "https://<region>-aiplatform.googleapis.com/v1/projects/<project-id>/locations/<region>/models:upload"
      ```

- [ ] **Encrypt Vector Search Indexes and Index Endpoints With the Same CMEK** - pass: every index and index endpoint reports the same `encryptionSpec.kmsKeyName`, and `custom.disableUnencryptedIndexes` denies new unencrypted indexes
  - **CLI**:
    - Verify:
      ```bash
      gcloud ai indexes list --region=<region> --format="table(name.basename(), encryptionSpec.kmsKeyName)"
      ```
    - Verify:
      ```bash
      gcloud ai index-endpoints list --region=<region> --format="table(name.basename(), encryptionSpec.kmsKeyName, publicEndpointEnabled)"
      ```
    - Verify:
      ```bash
      gcloud org-policies describe custom.disableUnencryptedIndexes --folder=<folder-id> --effective --format=yaml
      ```
    - Expect: the same key resource name on every index and index endpoint, then `rules: - enforce: true`. Embeddings can be inverted to the text they came from; without CMEK you cannot cut off a stored index by disabling one key.
    - Fix:
      ```bash
      gcloud ai indexes create --region=<region> --display-name=<name> --metadata-file=<metadata.json> --encryption-kms-key-name=projects/<kms-project-id>/locations/<region>/keyRings/<keyring>/cryptoKeys/<key>
      ```
    - Fix:
      ```bash
      gcloud ai index-endpoints create --region=<region> --display-name=<name> --enable-private-service-connect --project-allowlist=<project-id> --encryption-kms-key-name=projects/<kms-project-id>/locations/<region>/keyRings/<keyring>/cryptoKeys/<key>
      ```
    - Fix:
      ```bash
      cat > disable-unencrypted-indexes.yaml <<YAML
      name: organizations/$ORG_ID/customConstraints/custom.disableUnencryptedIndexes
      resourceTypes:
      - aiplatform.googleapis.com/Index
      methodTypes:
      - CREATE
      condition: "has(resource.encryptionSpec) == false"
      actionType: DENY
      displayName: Block creation of unencrypted Indexes
      description: Vector Search indexes must be created with a customer-managed key.
      YAML
      gcloud org-policies set-custom-constraint disable-unencrypted-indexes.yaml
      ```
    - Fix:
      ```bash
      cat > enforce-encrypted-indexes.yaml <<'YAML'
      name: folders/<folder-id>/policies/custom.disableUnencryptedIndexes
      spec:
        rules:
        - enforce: true
      YAML
      gcloud org-policies set-policy enforce-encrypted-indexes.yaml
      ```

- [ ] **Encrypt RAG Engine Corpora With CMEK** - pass: RAG Engine runs in Spanner mode and every RAG corpus that uses `RagManagedDb` reports `encryptionSpec.kmsKeyName`
  - **CLI**:
    - Verify:
      ```bash
      curl -s -H "Authorization: Bearer $(gcloud auth print-access-token)" "https://<region>-aiplatform.googleapis.com/v1/projects/<project-id>/locations/<region>/ragEngineConfig" \
        | jq -r '(.ragManagedDbConfig // {}) | keys[]'
      ```
    - Verify:
      ```bash
      curl -s -H "Authorization: Bearer $(gcloud auth print-access-token)" "https://<region>-aiplatform.googleapis.com/v1/projects/<project-id>/locations/<region>/ragCorpora" \
        | jq -r '.ragCorpora[]? | select((.vertexAiSearchConfig // .vectorDbConfig.pinecone // .vectorDbConfig.vertexVectorSearch) == null) | [.name, (.encryptionSpec.kmsKeyName // "NO-CMEK")] | @tsv'
      ```
    - Expect: no `serverless` from the first command (Serverless mode cannot use your key), then a key resource name on every row, never `NO-CMEK` (corpora on Pinecone, Vector Search or Vertex AI Search are filtered out). The corpus is a searchable copy of the documents you ingested, and its key cannot be added later.
    - Fix:
      ```bash
      curl -X PATCH -H "Authorization: Bearer $(gcloud auth print-access-token)" -H "Content-Type: application/json; charset=utf-8" -d '{"ragManagedDbConfig": {"spanner": {}}}' "https://<region>-aiplatform.googleapis.com/v1/projects/<project-id>/locations/<region>/ragEngineConfig"
      ```
    - Fix:
      ```bash
      gcloud kms keys add-iam-policy-binding <key> --keyring=<keyring> --location=<region> --project=<kms-project-id> --member=serviceAccount:service-<project-number>@gcp-sa-vertex-rag.iam.gserviceaccount.com --role=roles/cloudkms.cryptoKeyEncrypterDecrypter
      ```
    - Fix:
      ```bash
      cat > request.json <<'JSON'
      {
        "displayName": "<corpus-name>",
        "vectorDbConfig": {"ragManagedDb": {}},
        "encryptionSpec": {"kmsKeyName": "projects/<kms-project-id>/locations/<region>/keyRings/<keyring>/cryptoKeys/<key>"}
      }
      JSON
      curl -X POST -H "Authorization: Bearer $(gcloud auth print-access-token)" -H "Content-Type: application/json; charset=utf-8" -d @request.json "https://<region>-aiplatform.googleapis.com/v1/projects/<project-id>/locations/<region>/ragCorpora"
      ```

- [ ] **Encrypt Agent Runtime Agents With CMEK** - pass: every reasoning engine reports `encryptionSpec.kmsKeyName`
  - **CLI**:
    - Verify:
      ```bash
      curl -s -H "Authorization: Bearer $(gcloud auth print-access-token)" "https://<region>-aiplatform.googleapis.com/v1/projects/<project-id>/locations/<region>/reasoningEngines" \
        | jq -r '.reasoningEngines[]? | [.name, (.encryptionSpec.kmsKeyName // "NO-CMEK")] | @tsv'
      ```
    - Expect: a key resource name on every agent, never `NO-CMEK`. Agent source, container images and running instances otherwise sit under keys you cannot revoke.
    - Fix:
      ```bash
      cat > request.json <<'JSON'
      {
        "displayName": "<agent-name>",
        "encryptionSpec": {"kmsKeyName": "projects/<kms-project-id>/locations/<region>/keyRings/<keyring>/cryptoKeys/<key>"},
        "spec": {"<the rest of your agent spec>": "<packageSpec, sourceCodeSpec or containerSpec as the SDK sends it>"}
      }
      JSON
      curl -X POST -H "Authorization: Bearer $(gcloud auth print-access-token)" -H "Content-Type: application/json; charset=utf-8" -d @request.json "https://<region>-aiplatform.googleapis.com/v1/projects/<project-id>/locations/<region>/reasoningEngines"
      ```

- [ ] **Encrypt Workbench Instance Disks With CMEK** - pass: every Workbench instance reports `diskEncryption` = `CMEK` with your key on its boot disk and data disks
  - **Console**:
    - Verify: Google Cloud console > Agent Platform > Workbench > Instances > <instance> > the instance's details show Encryption `Customer-managed encryption key (CMEK)` with your key
    - Fix: Google Cloud console > Agent Platform > Workbench > Instances > Create new > Advanced options > Disks > Encryption: `Customer-managed encryption key (CMEK)` > select the key > Create, move the notebooks over, then delete the old instance
  - **CLI**:
    - Verify:
      ```bash
      gcloud workbench instances list --location=<zone> --format="table(name.basename(), gceSetup.bootDisk.diskEncryption, gceSetup.bootDisk.kmsKey, gceSetup.dataDisks[].diskEncryption, gceSetup.dataDisks[].kmsKey)"
      ```
    - Expect: `CMEK` and your key in both the boot-disk and the data-disk columns on every instance. A notebook disk holds downloaded datasets, cached credentials and saved outputs under keys you cannot revoke.
    - Fix:
      ```bash
      gcloud kms keys add-iam-policy-binding <key> --keyring=<keyring> --location=<region> --project=<kms-project-id> --member=serviceAccount:service-<project-number>@gcp-sa-notebooks.iam.gserviceaccount.com --role=roles/cloudkms.cryptoKeyEncrypterDecrypter
      gcloud kms keys add-iam-policy-binding <key> --keyring=<keyring> --location=<region> --project=<kms-project-id> --member=serviceAccount:service-<project-number>@compute-system.iam.gserviceaccount.com --role=roles/cloudkms.cryptoKeyEncrypterDecrypter
      ```
    - Fix:
      ```bash
      gcloud workbench instances create <instance> --location=<zone> --machine-type=<machine-type> --disable-public-ip --service-account-email=<sa> \
        --boot-disk-encryption=CMEK --boot-disk-kms-key=projects/<kms-project-id>/locations/<region>/keyRings/<keyring>/cryptoKeys/<key> \
        --data-disk-encryption=CMEK --data-disk-kms-key=projects/<kms-project-id>/locations/<region>/keyRings/<keyring>/cryptoKeys/<key>
      ```

- [ ] **Block the Global Endpoint Where Data Residency Applies (it processes prompts in any region and voids the residency commitment)** - pass: `constraints/gcp.restrictEndpointUsage` denies `aiplatform.googleapis.com` on every folder with residency requirements, leaving `<region>-aiplatform.googleapis.com` and the `us` / `eu` multi-region endpoints allowed
  - **Console**:
    - Verify: Google Cloud console > IAM & Admin > Organization Policies > select the folder in the resource picker > `Restrict endpoint usage` > Policy details > Effective policy lists `aiplatform.googleapis.com` under Denied
    - Fix: Google Cloud console > IAM & Admin > Organization Policies > select the folder in the resource picker > `Restrict endpoint usage` > Manage policy > Override parent's policy > Add a rule > Policy values: Custom > Policy type: Deny > Custom value: `aiplatform.googleapis.com` > Set policy
  - **CLI**:
    - Verify:
      ```bash
      gcloud resource-manager org-policies describe constraints/gcp.restrictEndpointUsage --folder=<folder-id> --effective
      ```
    - Expect: a `listPolicy` whose `deniedValues` include `aiplatform.googleapis.com`. Otherwise one line of client configuration sends prompts to whichever region has capacity, with no residency guarantee.
    - Fix:
      ```bash
      cat > deny-global-endpoint.yaml <<'YAML'
      constraint: constraints/gcp.restrictEndpointUsage
      listPolicy:
        deniedValues:
        - aiplatform.googleapis.com
      YAML
      gcloud resource-manager org-policies set-policy --folder=<folder-id> deny-global-endpoint.yaml
      ```

---

## Logging & Audit

- [ ] **Enable Data Access Audit Logs for the Vertex AI API** - pass: the effective audit configuration for `aiplatform.googleapis.com` (or `allServices`) enables `DATA_READ`, `DATA_WRITE` and `ADMIN_READ` with no exempted principals
  - **Console**:
    - Verify: Google Cloud console > IAM & Admin > Audit Logs > select the project in the resource picker > Data Access audit logs configuration table > `Agent Platform API` > Permission types tab shows Admin Read, Data Read and Data Write selected, and the Exempted Principals tab lists no principal
    - Fix: Google Cloud console > IAM & Admin > Audit Logs > select the project in the resource picker > Data Access audit logs configuration table > `Agent Platform API` > Permission types > select Admin Read, Data Read and Data Write > Save
  - **CLI**:
    - Verify:
      ```bash
      gcloud projects get-ancestors-iam-policy <project-id> --format=json \
        | jq -r '.[] | .type as $t | .id as $i | .policy.auditConfigs[]? | select(.service=="aiplatform.googleapis.com" or .service=="allServices") | [$t, $i, .service, ([.auditLogConfigs[].logType]|join(",")), ([.auditLogConfigs[].exemptedMembers[]?]|join(","))] | @tsv'
      ```
    - Expect: rows for `aiplatform.googleapis.com` or `allServices`, on the project or any ancestor, that together list `DATA_READ`, `DATA_WRITE` and `ADMIN_READ`, and an empty exemptions column on every row. Without it a prediction, a vector query or a RAG import leaves no record of who made it.
    - Fix:
      ```bash
      gcloud projects get-iam-policy <project-id> --format=json > policy.json
      jq '.auditConfigs = ((.auditConfigs // []) | map(select(.service != "aiplatform.googleapis.com"))) + [{"service":"aiplatform.googleapis.com","auditLogConfigs":[{"logType":"DATA_READ"},{"logType":"DATA_WRITE"},{"logType":"ADMIN_READ"}]}]' policy.json > policy-audit.json
      gcloud projects set-iam-policy <project-id> policy-audit.json
      ```

- [ ] **Enable Request-Response Logging for Gemini Models Where AI Use Must Be Evidenced** - pass: `fetchPublisherModelConfig` returns `loggingConfig.enabled` = `true` with a `bigqueryDestination` in the security project for every Gemini and Claude model in use outside a VPC Service Controls perimeter, or the project documents zero data retention and the setting is `false` everywhere
  - **CLI**:
    - Verify:
      ```bash
      curl -s -H "Authorization: Bearer $(gcloud auth print-access-token)" "https://<region>-aiplatform.googleapis.com/v1beta1/projects/<project-id>/locations/<region>/publishers/<publisher>/models/<model>:fetchPublisherModelConfig"
      ```
    - Expect: `loggingConfig.enabled` is `true` with your BigQuery table for every model, with `<publisher>` `google` for Gemini and `anthropic` for Claude (or `false` under a documented zero-data-retention decision). Without a log, a prompt-injection or data-leak incident cannot be reconstructed after the fact.
    - Fix:
      ```bash
      cat > request.json <<'JSON'
      {
        "updateMask": "loggingConfig",
        "publisherModelConfig": {
          "loggingConfig": {
            "enabled": true,
            "samplingRate": 1.0,
            "bigqueryDestination": {"outputUri": "bq://<security-project-id>.<dataset>.<table>"},
            "enableOtelLogging": true
          }
        }
      }
      JSON
      curl -X POST -H "Authorization: Bearer $(gcloud auth print-access-token)" -H "Content-Type: application/json; charset=utf-8" -d @request.json "https://<region>-aiplatform.googleapis.com/v1beta1/projects/<project-id>/locations/<region>/publishers/<publisher>/models/<model>:setPublisherModelConfig"
      ```

- [ ] **Enable Request-Response Logging on Online-Inference Endpoints** - pass: every production endpoint outside a VPC Service Controls perimeter reports `predictRequestResponseLoggingConfig.enabled` = `true` with a BigQuery table in the security project
  - **CLI**:
    - Verify:
      ```bash
      gcloud ai endpoints list --region=<region> --format="table(name.basename(), predictRequestResponseLoggingConfig.enabled, predictRequestResponseLoggingConfig.samplingRate, predictRequestResponseLoggingConfig.bigqueryDestination.outputUri)"
      ```
    - Expect: `True`, a sampling rate and a `bq://` table on every production row. Without it there is no record of what a custom model was asked or answered.
    - Fix:
      ```bash
      gcloud ai endpoints update <endpoint-id> --region=<region> --request-response-logging-table=bq://<security-project-id>.<dataset>.<table> --request-response-logging-rate=1.0
      ```

- [ ] **Enable Access Logging on Deployed Models** - pass: every deployed model on a production endpoint reports `enableAccessLogging` = `true`
  - **Console**:
    - Verify: Google Cloud console > Agent Platform > Online prediction > <endpoint> > the deployed model's details show Access logging enabled
    - Fix: Google Cloud console > Agent Platform > Model Registry > <model> > Deploy & Test > Deploy to endpoint > Add to existing endpoint: <endpoint> > Continue > Logging > check `Access logging` > Deploy, then undeploy the copy that was deployed without it
  - **CLI**:
    - Verify:
      ```bash
      gcloud ai endpoints list --region=<region> --format="table(name.basename(), deployedModels[].id, deployedModels[].enableAccessLogging)"
      ```
    - Expect: `True` for every deployed model. Without access logs no request's timestamp or latency is recorded, so you cannot reconstruct when a stolen credential hammered the endpoint.
    - Fix:
      ```bash
      gcloud ai endpoints deploy-model <endpoint-id> --region=<region> --model=<model-id> --display-name=<name> --service-account=<sa> --enable-access-logging --traffic-split=0=100
      ```
    - Fix:
      ```bash
      gcloud ai endpoints undeploy-model <endpoint-id> --region=<region> --deployed-model-id=<old-deployed-model-id>
      ```

- [ ] **Restrict Access to the Request-Response Log Dataset** - pass: the BigQuery dataset that receives request-response logs lists only the security group and the log writer in its access list, with no project-wide `Viewer` or `Editor` entry
  - **Console**:
    - Verify: Google Cloud console > BigQuery > Explorer > <security project> > Datasets > <dataset> > Sharing > Permissions > the Dataset Permissions pane lists only the security group and the log writer
    - Fix: Google Cloud console > BigQuery > Explorer > <security project> > Datasets > <dataset> > Sharing > Permissions > expand each `projectViewer`, `projectEditor` or unrelated principal > Remove principal > Remove > Add principal > New principals: the security group > Select a role: `BigQuery Data Viewer` > Save
  - **CLI**:
    - Verify:
      ```bash
      bq show --format=prettyjson <security-project-id>:<dataset> | jq -r '.access[] | [.role, (.userByEmail // .groupByEmail // .domain // .specialGroup // .iamMember // (.view // .dataset // .routine | tojson))] | @tsv'
      ```
    - Expect: only the security group, the owner group and the log writer; no `projectReaders`, `projectWriters`, `allAuthenticatedUsers` or domain row. Every reader of this dataset sees raw prompts and completions.
    - Fix:
      ```bash
      cat > dataset-access.json <<'JSON'
      {
        "access": [
          {"role": "OWNER", "groupByEmail": "<security-owners-group>@<domain>"},
          {"role": "READER", "groupByEmail": "<security-readers-group>@<domain>"},
          {"role": "WRITER", "userByEmail": "service-<project-number>@gcp-sa-vertex-logging.iam.gserviceaccount.com"}
        ]
      }
      JSON
      bq update --source dataset-access.json <security-project-id>:<dataset>
      ```

- [ ] **Alert on Changes to Vertex AI Logging, Data-Sharing and Caching Settings** - pass: an enabled log-based metric matches `aiplatform.googleapis.com` calls to `SetPublisherModelConfig` and `UpdateCacheConfig`, and an enabled alert policy on that metric notifies the security channel
  - **Console**:
    - Verify: Google Cloud console > Logging > Log-based metrics > User-defined metrics > a metric whose Filter contains `protoPayload.serviceName="aiplatform.googleapis.com"`, `SetPublisherModelConfig` and `UpdateCacheConfig` exists and is not disabled, and Google Cloud console > Monitoring > Alerting > the policy on that metric shows Enabled and names the security team's notification channel
    - Fix: Google Cloud console > Logging > Log-based metrics > Create metric > Metric type: Counter > Log metric name: `vertex-governance-changes` > Filter selection: `protoPayload.serviceName="aiplatform.googleapis.com" AND (protoPayload.methodName=~"SetPublisherModelConfig" OR protoPayload.methodName=~"UpdateCacheConfig")` > Create metric, then More on that metric > Create alert from metric > Next > Threshold > Threshold value: `0` > Next > Notification channels: a channel that reaches the security team > Name the alert policy > Create policy; if a matching metric already exists but is disabled, re-enable it from that metric's More menu instead of creating it
  - **CLI**:
    - Verify: `gcloud logging metrics list --filter="name~vertex" --format="table(name, disabled, filter)"`
    - Verify:
      ```bash
      gcloud monitoring policies list --format="table(displayName, enabled, notificationChannels.list(), conditions[].conditionThreshold.filter)"
      ```
    - Expect: a metric whose filter names `aiplatform.googleapis.com` with `SetPublisherModelConfig` and `UpdateCacheConfig` and whose `DISABLED` cell is not `True`, and an alert policy on it with `enabled` = `True` and the security team's channel under `NOTIFICATION_CHANNELS`. Otherwise logging can be switched off, or prompts shared with a partner, without anyone being told.
    - Fix:
      ```bash
      gcloud logging metrics create vertex-governance-changes --description="Vertex AI logging, data-sharing and caching changes" --log-filter='protoPayload.serviceName="aiplatform.googleapis.com" AND (protoPayload.methodName=~"SetPublisherModelConfig" OR protoPayload.methodName=~"UpdateCacheConfig")'
      ```
    - Fix:
      ```bash
      gcloud monitoring policies create --display-name="Vertex AI governance changes" --condition-display-name="vertex-governance-changes above 0" --condition-filter='metric.type="logging.googleapis.com/user/vertex-governance-changes" AND resource.type="audited_resource"' --if="> 0" --duration=0s --notification-channels=<channel-id>
      ```
    - Fix:
      ```bash
      cat > metric-enable.yaml <<YAML
      disabled: false
      YAML
      gcloud logging metrics update <metric-name> --config-from-file=metric-enable.yaml
      ```

---

## Data Protection (Zero Data Retention)

- [ ] **Disable Gemini In-Memory Data Caching Where Zero Data Retention Applies (inputs, outputs and derived data are otherwise cached for 24 hours)** - pass: `GET projects/<project-id>/cacheConfig` returns `"disableCache": true` on every project bound by a zero-data-retention commitment
  - **CLI**:
    - Verify:
      ```bash
      curl -s -H "Authorization: Bearer $(gcloud auth print-access-token)" "https://us-central1-aiplatform.googleapis.com/v1/projects/<project-id>/cacheConfig"
      ```
    - Expect: `"disableCache": true`; a response with only `name` means caching is on. With caching on, prompts and answers stay resident in Google's serving memory for a day after the call.
    - Fix:
      ```bash
      curl -X PATCH -H "Authorization: Bearer $(gcloud auth print-access-token)" -H "Content-Type: application/json" "https://us-central1-aiplatform.googleapis.com/v1/projects/<project-id>/cacheConfig" \
        -d '{"name": "projects/<project-id>/cacheConfig", "disableCache": true}'
      ```

- [ ] **Deny Request-Response Log Sharing With Model Partners by Custom Constraint** - pass: `custom.denyPartnerModelDataSharing` on `aiplatform.googleapis.com/Endpoint` is enforced at the organization, denying any `dataSharingEnabledProvider` value
  - **Console**:
    - Verify: Google Cloud console > IAM & Admin > Organization Policies > select the organization in the resource picker > `Prevent partner model data sharing` > Policy details > Effective policy reads Enforced
    - Fix: Google Cloud console > IAM & Admin > Organization Policies > select the organization in the resource picker > Custom constraint > Display name `Prevent partner model data sharing` > Constraint ID `denyPartnerModelDataSharing` > Resource type `aiplatform.googleapis.com/Endpoint` > Enforcement method: `CREATE` and `UPDATE` > Edit condition: `has(resource.publisherModelConfig.dataSharingEnabledProvider)` > Action: Deny > Create constraint, then the new constraint > Manage policy > Override parent's policy > Add a rule > Enforcement: On > Set policy
  - **CLI**:
    - Verify:
      ```bash
      gcloud org-policies describe custom.denyPartnerModelDataSharing --organization=$ORG_ID --effective --format=yaml
      ```
    - Expect: `rules: - enforce: true`. Without it one API call routes every logged prompt and response to the partner's trust-and-safety team in real time.
    - Fix:
      ```bash
      cat > prevent_data_sharing.yaml <<YAML
      name: organizations/$ORG_ID/customConstraints/custom.denyPartnerModelDataSharing
      resourceTypes:
      - aiplatform.googleapis.com/Endpoint
      methodTypes:
      - CREATE
      - UPDATE
      condition: "has(resource.publisherModelConfig.dataSharingEnabledProvider)"
      actionType: DENY
      displayName: Prevent partner model data sharing
      description: Prohibits enabling request and response log sharing with any partner model provider.
      YAML
      gcloud org-policies set-custom-constraint prevent_data_sharing.yaml
      ```
    - Fix:
      ```bash
      cat > enforce_policy.yaml <<YAML
      name: organizations/$ORG_ID/policies/custom.denyPartnerModelDataSharing
      spec:
        rules:
        - enforce: true
      YAML
      gcloud org-policies set-policy enforce_policy.yaml
      ```

---

## Safety & Guardrails (Model Armor)

- [ ] **Enable Model Armor Floor Settings for Agent Platform in Every Project That Calls Gemini** - pass: the project floor setting reports `enableFloorSettingEnforcement` = `true` and `integratedServices` containing `AI_PLATFORM`, and the Vertex AI service agent holds `roles/modelarmor.user`
  - **Console**:
    - Verify: Google Cloud console > Model Armor > Floor settings > the configuration reads `Custom` (or inherited and enforced) and the Services section shows `Agent Platform` selected, and Google Cloud console > IAM & Admin > IAM > select `Include Google-provided role grants` > `service-<project-number>@gcp-sa-aiplatform.iam.gserviceaccount.com` holds `Model Armor User`
    - Fix: Google Cloud console > Model Armor > Floor settings > Configure floor settings > `Custom` > Detections: select the detections you require > Services: check `Agent Platform` > Save floor settings, then Google Cloud console > IAM & Admin > IAM > Grant access > New principals: `service-<project-number>@gcp-sa-aiplatform.iam.gserviceaccount.com` > Select a role: `Model Armor User` > Save
  - **CLI**:
    - Verify:
      ```bash
      gcloud model-armor floorsettings describe --full-uri=projects/<project-id>/locations/global/floorSetting --format="yaml(enableFloorSettingEnforcement, integratedServices, aiPlatformFloorSetting)"
      ```
    - Verify:
      ```bash
      gcloud projects get-iam-policy <project-id> --flatten="bindings[].members" --filter="bindings.role=roles/modelarmor.user" --format="value(bindings.members)"
      ```
    - Expect: `enableFloorSettingEnforcement: true`, `integratedServices` listing `AI_PLATFORM`, and `serviceAccount:service-<project-number>@gcp-sa-aiplatform.iam.gserviceaccount.com` among the `roles/modelarmor.user` members. Without it every prompt injection and jailbreak reaches Gemini unscreened, because the model's own safety thresholds default to OFF.
    - Fix:
      ```bash
      gcloud projects add-iam-policy-binding <project-id> --member=serviceAccount:service-<project-number>@gcp-sa-aiplatform.iam.gserviceaccount.com --role=roles/modelarmor.user
      ```
    - Fix:
      ```bash
      gcloud model-armor floorsettings update --full-uri=projects/<project-id>/locations/global/floorSetting --add-integrated-services=VERTEX_AI --enable-floor-setting-enforcement=TRUE
      ```

- [ ] **Set Model Armor Enforcement for Agent Platform to Inspect and Block** - pass: the project floor setting reports `aiPlatformFloorSetting.inspectAndBlock` = `true`
  - **Console**:
    - Verify: Google Cloud console > Model Armor > Floor settings > the Agent Platform section reads `Inspect and block violations`
    - Fix: Google Cloud console > Model Armor > Floor settings > Configure floor settings > Services > `Agent Platform` > select `Inspect and block violations` > Save floor settings
  - **CLI**:
    - Verify:
      ```bash
      gcloud model-armor floorsettings describe --full-uri=projects/<project-id>/locations/global/floorSetting --format="value(aiPlatformFloorSetting.inspectAndBlock, aiPlatformFloorSetting.inspectOnly)"
      ```
    - Expect: `True` in the first column. In inspect-only mode a detected jailbreak or credential leak is logged and then delivered anyway.
    - Fix:
      ```bash
      gcloud model-armor floorsettings update --full-uri=projects/<project-id>/locations/global/floorSetting --vertex-ai-enforcement-type=INSPECT_AND_BLOCK
      ```

- [ ] **Enable Prompt Injection and Jailbreak Detection in Floor Settings** - pass: the effective floor setting reports `filterConfig.piAndJailbreakFilterSettings.filterEnforcement` = `ENABLED` with a confidence level of `MEDIUM_AND_ABOVE` or stricter
  - **Console**:
    - Verify: Google Cloud console > Model Armor > Floor settings > Detections shows `Prompt injection and jailbreak detection` enabled with confidence `Medium and above` or `Low and above`
    - Fix: Google Cloud console > Model Armor > Floor settings > Configure floor settings > Detections > check `Prompt injection and jailbreak detection` > confidence level: `Medium and above` > Save floor settings
  - **CLI**:
    - Verify:
      ```bash
      gcloud model-armor floorsettings describe --full-uri=projects/<project-id>/locations/global/floorSetting --format="yaml(filterConfig.piAndJailbreakFilterSettings)"
      ```
    - Expect: `filterEnforcement: ENABLED` and a `confidenceLevel` of `MEDIUM_AND_ABOVE` or `LOW_AND_ABOVE`. Without it a crafted prompt can override the system instructions and turn the model against its own application.
    - Fix:
      ```bash
      gcloud model-armor floorsettings update --full-uri=projects/<project-id>/locations/global/floorSetting --pi-and-jailbreak-filter-settings-enforcement=ENABLED --pi-and-jailbreak-filter-settings-confidence-level=MEDIUM_AND_ABOVE --enable-floor-setting-enforcement=TRUE
      ```

- [ ] **Enable Sensitive Data Protection Filters in Floor Settings** - pass: the effective floor setting reports `filterConfig.sdpSettings` with the basic configuration `filterEnforcement` = `ENABLED` (or an advanced inspect template)
  - **Console**:
    - Verify: Google Cloud console > Model Armor > Floor settings > Detections shows `Sensitive Data Protection detection` enabled
    - Fix: Google Cloud console > Model Armor > Floor settings > Configure floor settings > Detections > check `Sensitive Data Protection detection` > Sensitive Data Protection settings: Basic > Save floor settings
  - **CLI**:
    - Verify:
      ```bash
      gcloud model-armor floorsettings describe --full-uri=projects/<project-id>/locations/global/floorSetting --format="yaml(filterConfig.sdpSettings)"
      ```
    - Expect: `basicConfig: filterEnforcement: ENABLED` (or an `advancedConfig` naming your inspect template). Without it a Google Cloud credential pasted into a prompt or echoed from a retrieved document passes straight through.
    - Fix:
      ```bash
      gcloud model-armor floorsettings update --full-uri=projects/<project-id>/locations/global/floorSetting --basic-config-filter-enforcement=ENABLED --enable-floor-setting-enforcement=TRUE
      ```

- [ ] **Enable Malicious URL Detection in Floor Settings** - pass: the effective floor setting reports `filterConfig.maliciousUriFilterSettings.filterEnforcement` = `ENABLED`
  - **Console**:
    - Verify: Google Cloud console > Model Armor > Floor settings > Detections shows `Malicious URL detection` enabled
    - Fix: Google Cloud console > Model Armor > Floor settings > Configure floor settings > Detections > check `Malicious URL detection` > Save floor settings
  - **CLI**:
    - Verify:
      ```bash
      gcloud model-armor floorsettings describe --full-uri=projects/<project-id>/locations/global/floorSetting --format="value(filterConfig.maliciousUriFilterSettings.filterEnforcement)"
      ```
    - Expect: `ENABLED`. Otherwise a phishing link injected through a retrieved document is returned to the user as the model's answer.
    - Fix:
      ```bash
      gcloud model-armor floorsettings update --full-uri=projects/<project-id>/locations/global/floorSetting --malicious-uri-filter-settings-enforcement=ENABLED --enable-floor-setting-enforcement=TRUE
      ```

- [ ] **Set Responsible AI Content Filters in Floor Settings** - pass: the effective floor setting reports `filterConfig.raiSettings.raiFilters` for `HATE_SPEECH`, `HARASSMENT`, `SEXUALLY_EXPLICIT` and `DANGEROUS` at `MEDIUM_AND_ABOVE` or `HIGH`
  - **Console**:
    - Verify: Google Cloud console > Model Armor > Floor settings > the Responsible AI section shows a confidence level of `Medium and above` or `High` for each content filter
    - Fix: Google Cloud console > Model Armor > Floor settings > Configure floor settings > Responsible AI > set each content filter to `Medium and above` > Save floor settings
  - **CLI**:
    - Verify:
      ```bash
      gcloud model-armor floorsettings describe --full-uri=projects/<project-id>/locations/global/floorSetting --format="yaml(filterConfig.raiSettings)"
      ```
    - Expect: four `raiFilters` entries at `MEDIUM_AND_ABOVE` or `HIGH`, the two levels the vendor recommends starting from; `HIGH` flags the least content of the three levels and `LOW_AND_ABOVE` the most. With the model's own thresholds OFF by default, nothing else screens harmful content.
    - Fix:
      ```bash
      gcloud model-armor floorsettings update --full-uri=projects/<project-id>/locations/global/floorSetting --enable-floor-setting-enforcement=TRUE \
        --rai-settings-filters='[{"confidenceLevel": "medium_and_above", "filterType": "HATE_SPEECH"}, {"confidenceLevel": "medium_and_above", "filterType": "HARASSMENT"}, {"confidenceLevel": "medium_and_above", "filterType": "SEXUALLY_EXPLICIT"}, {"confidenceLevel": "medium_and_above", "filterType": "DANGEROUS"}]'
      ```

- [ ] **Enable Cloud Logging for Model Armor Sanitization Results** - pass: the project floor setting reports `aiPlatformFloorSetting.enableCloudLogging` = `true`
  - **Console**:
    - Verify: Google Cloud console > Model Armor > Floor settings > the Logs section shows `Enable Cloud Logging` selected
    - Fix: Google Cloud console > Model Armor > Floor settings > Configure floor settings > Logs > check `Enable Cloud Logging` > Save floor settings
  - **CLI**:
    - Verify:
      ```bash
      gcloud model-armor floorsettings describe --full-uri=projects/<project-id>/locations/global/floorSetting --format="value(aiPlatformFloorSetting.enableCloudLogging)"
      ```
    - Expect: `True`. Without it a blocked injection or a detected credential leak leaves no record to investigate or tune against.
    - Fix:
      ```bash
      gcloud model-armor floorsettings update --full-uri=projects/<project-id>/locations/global/floorSetting --enable-vertex-ai-cloud-logging
      ```

- [ ] **Enforce Organization-Level Floor Settings for Model Armor Templates** - pass: `organizations/<org-id>/locations/global/floorSetting` reports `enableFloorSettingEnforcement` = `true` with the prompt-injection, sensitive-data and malicious-URL filters `ENABLED`
  - **CLI**:
    - Verify:
      ```bash
      gcloud model-armor floorsettings describe --full-uri=organizations/$ORG_ID/locations/global/floorSetting --format="yaml(enableFloorSettingEnforcement, filterConfig)"
      ```
    - Expect: `enableFloorSettingEnforcement: true`, and `filterEnforcement: ENABLED` under `piAndJailbreakFilterSettings`, `sdpSettings.basicConfig` and `maliciousUriFilterSettings`. Without an organization floor, any project can create a template that screens nothing.
    - Fix:
      ```bash
      gcloud model-armor floorsettings update --full-uri=organizations/$ORG_ID/locations/global/floorSetting --enable-floor-setting-enforcement=TRUE \
        --pi-and-jailbreak-filter-settings-enforcement=ENABLED --pi-and-jailbreak-filter-settings-confidence-level=MEDIUM_AND_ABOVE \
        --basic-config-filter-enforcement=ENABLED --malicious-uri-filter-settings-enforcement=ENABLED
      ```

- [ ] **Restrict Model Armor Floor-Setting Administration to the Security Team** - pass: `roles/modelarmor.floorSettingsAdmin` and `roles/securitycenter.admin` are held only by the security group, on the organization and on every project, and no service account holds either
  - **Console**:
    - Verify: Google Cloud console > IAM & Admin > IAM > select the organization, then each project, in the resource picker > rows whose Role is `Model Armor Floor Setting Admin` or `Security Center Admin` list only the security group as Principal
    - Fix: Google Cloud console > IAM & Admin > IAM > select the organization or the project in the resource picker > Edit principal on the principal's row > Delete on the `Model Armor Floor Setting Admin` or `Security Center Admin` role > for an application account Add another role > `Model Armor User` > Save
  - **CLI**:
    - Verify:
      ```bash
      gcloud organizations get-iam-policy $ORG_ID --flatten="bindings[].members" --format="value(bindings.role, bindings.members)" --filter="bindings.role=(roles/modelarmor.floorSettingsAdmin, roles/securitycenter.admin)"
      ```
    - Verify:
      ```bash
      for p in $(gcloud projects list --format="value(projectId)"); do
        gcloud projects get-iam-policy "$p" --flatten="bindings[].members" --format="value(bindings.role, bindings.members)" --filter="bindings.role=(roles/modelarmor.floorSettingsAdmin, roles/securitycenter.admin)" | sed "s|^|$p |"
      done
      ```
    - Expect: only the security group, on the organization and on every project. Anyone else on the list can set the floor to `Disable` and remove every guardrail from every Gemini call.
    - Fix: `gcloud organizations remove-iam-policy-binding $ORG_ID --member=<member> --role=<role>`
    - Fix: `gcloud projects remove-iam-policy-binding <project-id> --member=<member> --role=<role>`
    - Fix:
      ```bash
      gcloud projects add-iam-policy-binding <project-id> --member=serviceAccount:<sa> --role=roles/modelarmor.user
      ```

---

## Agents, RAG & Vector Search

- [ ] **Deploy Each Agent With Its Own Agent Identity or a Dedicated Service Account** - pass: every reasoning engine reports `spec.effectiveIdentity` as an agent principal or `spec.serviceAccount` set to a dedicated account; none runs as the AI Platform Reasoning Engine Service Agent
  - **CLI**:
    - Verify:
      ```bash
      curl -s -H "Authorization: Bearer $(gcloud auth print-access-token)" "https://<region>-aiplatform.googleapis.com/v1/projects/<project-id>/locations/<region>/reasoningEngines" \
        | jq -r '.reasoningEngines[]? | [.name, (.spec.identityType // "-"), (.spec.effectiveIdentity // "-"), (.spec.serviceAccount // "DEFAULT-SERVICE-AGENT")] | @tsv'
      ```
    - Expect: `AGENT_IDENTITY` in the second column or a dedicated service account in the fourth on every row; `DEFAULT-SERVICE-AGENT` on a row without `AGENT_IDENTITY` fails. A shared service agent gives a prompt-injected agent every permission any agent in the project holds.
    - Fix:
      ```bash
      curl -X PATCH -H "Authorization: Bearer $(gcloud auth print-access-token)" -H "Content-Type: application/json; charset=utf-8" \
        -d '{"spec": {"serviceAccount": "<agent-sa>@<project-id>.iam.gserviceaccount.com"}}' \
        "https://<region>-aiplatform.googleapis.com/v1/projects/<project-id>/locations/<region>/reasoningEngines/<engine-id>?updateMask=spec.service_account"
      ```
    - Fix:
      ```bash
      cat > request.json <<'JSON'
      {
        "displayName": "<agent-name>",
        "spec": {
          "serviceAccount": "<agent-sa>@<project-id>.iam.gserviceaccount.com",
          "<the rest of your agent spec>": "<packageSpec, sourceCodeSpec or containerSpec as the SDK sends it>"
        }
      }
      JSON
      curl -X POST -H "Authorization: Bearer $(gcloud auth print-access-token)" -H "Content-Type: application/json; charset=utf-8" -d @request.json "https://<region>-aiplatform.googleapis.com/v1/projects/<project-id>/locations/<region>/reasoningEngines"
      ```
    - Fix:
      ```bash
      gcloud projects add-iam-policy-binding <project-id> --member=serviceAccount:<agent-sa>@<project-id>.iam.gserviceaccount.com --role=roles/aiplatform.user
      ```

- [ ] **Reference Agent Secrets From Secret Manager Instead of Plain Environment Variables** - pass: every reasoning engine keeps credentials in `spec.deploymentSpec.secretEnv` and its `spec.deploymentSpec.env` holds no literal under a name like `*KEY*`, `*SECRET*`, `*TOKEN*`, `*PASSWORD*` or `*CREDENTIAL*`
  - **CLI**:
    - Verify:
      ```bash
      curl -s -H "Authorization: Bearer $(gcloud auth print-access-token)" "https://<region>-aiplatform.googleapis.com/v1/projects/<project-id>/locations/<region>/reasoningEngines" \
        | jq -r '.reasoningEngines[]? | .name as $n | (.spec.deploymentSpec.env // [])[] | select(.name | test("KEY|SECRET|TOKEN|PASSWORD|CREDENTIAL"; "i")) | [$n, .name] | @tsv'
      ```
    - Expect: no output. A plain environment variable is readable by everyone with `aiplatform.reasoningEngines.get` and is copied into deployment logs and state files.
    - Fix:
      ```bash
      gcloud secrets add-iam-policy-binding <secret> --member=<agent-principal> --role=roles/secretmanager.secretAccessor
      ```
    - Fix:
      ```bash
      gcloud secrets add-iam-policy-binding <secret> --member=serviceAccount:service-<project-number>@gcp-sa-aiplatform.iam.gserviceaccount.com --role=roles/secretmanager.secretAccessor
      ```
    - Fix:
      ```bash
      cat > request.json <<'JSON'
      {
        "displayName": "<agent-name>",
        "spec": {
          "deploymentSpec": {
            "secretEnv": [{"name": "<ENV_VAR>", "secretRef": {"secret": "<secret>", "version": "latest"}}]
          },
          "<the rest of your agent spec>": "<packageSpec, sourceCodeSpec or containerSpec as the SDK sends it>"
        }
      }
      JSON
      curl -X POST -H "Authorization: Bearer $(gcloud auth print-access-token)" -H "Content-Type: application/json; charset=utf-8" -d @request.json "https://<region>-aiplatform.googleapis.com/v1/projects/<project-id>/locations/<region>/reasoningEngines"
      ```
    - Fix:
      ```bash
      curl -X DELETE -H "Authorization: Bearer $(gcloud auth print-access-token)" "https://<region>-aiplatform.googleapis.com/v1/projects/<project-id>/locations/<region>/reasoningEngines/<engine-id>"
      ```

- [ ] **Deny Privilege-Escalation Permissions to Every Agent Identity** - pass: an organization deny policy denies `iam.googleapis.com/roles.create`, `iam.googleapis.com/serviceAccountKeys.create` and `cloudresourcemanager.googleapis.com/projects.setIamPolicy` to `principalSet://agents.global.org-<org-id>.system.id.goog/*`
  - **Console**:
    - Verify: Google Cloud console > IAM & Admin > IAM > Deny > select the organization in the resource picker > <policy> > the rule lists the three permissions under Denied permissions and `principalSet://agents.global.org-<org-id>.system.id.goog/*` under Denied principals
    - Fix: Google Cloud console > IAM & Admin > IAM > Deny > select the organization in the resource picker > Create deny policy > ID `deny-agent-escalation` > Denied principals: `principalSet://agents.global.org-<org-id>.system.id.goog/*` > Denied permissions: `iam.googleapis.com/roles.create`, `iam.googleapis.com/serviceAccountKeys.create`, `cloudresourcemanager.googleapis.com/projects.setIamPolicy` > Create
  - **CLI**:
    - Verify:
      ```bash
      for p in $(gcloud iam policies list --attachment-point=cloudresourcemanager.googleapis.com/organizations/$ORG_ID --kind=denypolicies --format="value(name.basename())"); do
        gcloud iam policies get "$p" --attachment-point=cloudresourcemanager.googleapis.com/organizations/$ORG_ID --kind=denypolicies --format=json | jq -r '.rules[].denyRule | select(.deniedPrincipals[] | test("system.id.goog")) | (.deniedPermissions|join(","))'
      done
      ```
    - Expect: a line naming the three permissions. Without it a prompt-injected agent that was ever granted an admin role can mint keys and rewrite project IAM.
    - Fix:
      ```bash
      cat > agent-deny.json <<JSON
      {
        "displayName": "Deny privilege escalation to all agent identities",
        "rules": [{
          "denyRule": {
            "deniedPrincipals": ["principalSet://agents.global.org-$ORG_ID.system.id.goog/*"],
            "deniedPermissions": [
              "iam.googleapis.com/roles.create",
              "iam.googleapis.com/serviceAccountKeys.create",
              "cloudresourcemanager.googleapis.com/projects.setIamPolicy"
            ]
          }
        }]
      }
      JSON
      gcloud iam policies create deny-agent-escalation --attachment-point=cloudresourcemanager.googleapis.com/organizations/$ORG_ID --kind=denypolicies --policy-file=agent-deny.json
      ```

- [ ] **Deploy Vector Search Index Endpoints With Private Service Connect** - pass: every index endpoint reports `privateServiceConnectConfig.enablePrivateServiceConnect` = `true` with a `projectAllowlist`, or a peered `network`, and none reports `publicEndpointEnabled` = `true`
  - **Console**:
    - Verify: Google Cloud console > Agent Platform > Vector Search > Index endpoints > <index endpoint> > Access reads `Private Service Connect` with your VPC projects listed (or `Private` with a peered network), not `Standard`
    - Fix: Google Cloud console > Agent Platform > Vector Search > Index endpoints > Create new endpoint > Display name > Region > Access: `Private Service Connect (Preview)` > add the VPC project IDs > Create, then redeploy the index there and delete the `Standard` endpoint
  - **CLI**:
    - Verify:
      ```bash
      gcloud ai index-endpoints list --region=<region> --format="table(name.basename(), privateServiceConnectConfig.enablePrivateServiceConnect, privateServiceConnectConfig.projectAllowlist, network, publicEndpointEnabled)"
      ```
    - Expect: `True` with an allowlist, or a network, on every row, and never `True` in the public column (an unset flag prints empty). A public index endpoint answers similarity queries over your embeddings from the whole internet.
    - Fix:
      ```bash
      gcloud ai index-endpoints create --region=<region> --display-name=<name> --enable-private-service-connect --project-allowlist=<project-id>,<consumer-project-id>
      ```
    - Fix:
      ```bash
      gcloud ai index-endpoints deploy-index <new-index-endpoint-id> --region=<region> --index=<index-id> --deployed-index-id=<deployed-index-id> --display-name=<name>
      ```
    - Fix: `gcloud ai index-endpoints delete <public-index-endpoint-id> --region=<region>`

- [ ] **Deny Public Vector Search Index Endpoints With a Custom Constraint** - pass: `custom.denyPublicIndexEndpoint` on `aiplatform.googleapis.com/IndexEndpoint` is enforced, denying `CREATE` and `UPDATE` when `publicEndpointEnabled` is true
  - **Console**:
    - Verify: Google Cloud console > IAM & Admin > Organization Policies > select the AI folder in the resource picker > `Deny public IndexEndpoint` > Policy details > Effective policy reads Enforced
    - Fix: Google Cloud console > IAM & Admin > Organization Policies > select the organization in the resource picker > Custom constraint > Display name `Deny public IndexEndpoint` > Constraint ID `denyPublicIndexEndpoint` > Resource type `aiplatform.googleapis.com/IndexEndpoint` > Enforcement method: `CREATE` and `UPDATE` > Edit condition: `resource.publicEndpointEnabled == true` > Action: Deny > Create constraint, then the new constraint > Manage policy > Override parent's policy > Add a rule > Enforcement: On > Set policy
  - **CLI**:
    - Verify:
      ```bash
      gcloud org-policies describe custom.denyPublicIndexEndpoint --folder=<folder-id> --effective --format=yaml
      ```
    - Expect: `rules: - enforce: true`. Without it the next index endpoint can be created, or later switched, to a public address.
    - Fix:
      ```bash
      cat > deny-public-index-endpoint.yaml <<YAML
      name: organizations/$ORG_ID/customConstraints/custom.denyPublicIndexEndpoint
      resourceTypes:
      - aiplatform.googleapis.com/IndexEndpoint
      methodTypes:
      - CREATE
      - UPDATE
      condition: "resource.publicEndpointEnabled == true"
      actionType: DENY
      displayName: Deny public IndexEndpoint
      description: IndexEndpoint shouldn't be public
      YAML
      gcloud org-policies set-custom-constraint deny-public-index-endpoint.yaml
      ```
    - Fix:
      ```bash
      cat > enforce-deny-public-index-endpoint.yaml <<'YAML'
      name: folders/<folder-id>/policies/custom.denyPublicIndexEndpoint
      spec:
        rules:
        - enforce: true
      YAML
      gcloud org-policies set-policy enforce-deny-public-index-endpoint.yaml
      ```

- [ ] **Route Sandbox Egress Through a Private Service Connect Interface** - pass: every sandbox environment template reports `egressControlConfig.networkAttachment`, `egressControlConfig.internetAccess` = `false` unless the workload is designed for the internet, and `ingressControlConfig.enablePrivateServiceConnect` = `true` where the sandbox data plane must be private
  - **CLI**:
    - Verify:
      ```bash
      for e in $(curl -s -H "Authorization: Bearer $(gcloud auth print-access-token)" "https://<region>-aiplatform.googleapis.com/v1/projects/<project-id>/locations/<region>/reasoningEngines" | jq -r '.reasoningEngines[]?.name'); do
        curl -s -H "Authorization: Bearer $(gcloud auth print-access-token)" "https://<region>-aiplatform.googleapis.com/v1/$e/sandboxEnvironmentTemplates" \
          | jq -r '.sandboxEnvironmentTemplates[]? | [.name, (.egressControlConfig.networkAttachment // "NO-PSC-INTERFACE"), (.egressControlConfig.internetAccess // false), (.ingressControlConfig.enablePrivateServiceConnect // false)] | @tsv'
      done
      ```
    - Expect: a network attachment on every template, `false` for internet access unless designed, and `true` for private ingress where required. Otherwise untrusted code and browser sessions reach the internet straight from Google's tenant, outside your logging and egress filters.
    - Fix:
      ```bash
      gcloud compute networks subnets create sandbox-psc-subnet --network=<network> --region=<region> --range=<cidr>
      ```
    - Fix:
      ```bash
      gcloud compute network-attachments create sandbox-psc-attachment --region=<region> --subnets=sandbox-psc-subnet --connection-preference=ACCEPT_AUTOMATIC
      ```
    - Fix:
      ```bash
      cat > request.json <<'JSON'
      {
        "displayName": "<template-name>",
        "defaultContainerEnvironment": {"defaultContainerCategory": "DEFAULT_CONTAINER_CATEGORY_SHELL_SANDBOX"},
        "egressControlConfig": {
          "networkAttachment": "projects/<project-id>/regions/<region>/networkAttachments/sandbox-psc-attachment",
          "internetAccess": false
        },
        "ingressControlConfig": {"enablePrivateServiceConnect": true, "projectAllowlist": ["<project-id>"]}
      }
      JSON
      curl -X POST -H "Authorization: Bearer $(gcloud auth print-access-token)" -H "Content-Type: application/json; charset=utf-8" -d @request.json "https://<region>-aiplatform.googleapis.com/v1/projects/<project-id>/locations/<region>/reasoningEngines/<reasoning-engine-id>/sandboxEnvironmentTemplates"
      ```
    - Fix:
      ```bash
      curl -X DELETE -H "Authorization: Bearer $(gcloud auth print-access-token)" "https://<region>-aiplatform.googleapis.com/v1/projects/<project-id>/locations/<region>/reasoningEngines/<reasoning-engine-id>/sandboxEnvironmentTemplates/<template-id>"
      ```

---

## Training & Pipelines

- [ ] **Attach Custom Training Jobs to Your VPC** - pass: every production custom job reports `jobSpec.network` or `jobSpec.pscInterfaceConfig.networkAttachment`
  - **CLI**:
    - Verify:
      ```bash
      gcloud ai custom-jobs list --region=<region> --format="table(name.basename(), state, jobSpec.network, jobSpec.pscInterfaceConfig.networkAttachment)" --filter="NOT jobSpec.network:* AND NOT jobSpec.pscInterfaceConfig.networkAttachment:*"
      ```
    - Expect: no rows. A job with neither runs its traffic through a Google-managed gateway that none of your firewall rules, NAT or flow logs can see.
    - Fix:
      ```bash
      gcloud ai custom-jobs create --region=<region> --display-name=<name> --service-account=<sa> --network=projects/<project-number>/global/networks/<network> --worker-pool-spec=machine-type=<machine-type>,replica-count=1,container-image-uri=<image>
      ```
    - Fix:
      ```bash
      cat > request.json <<'JSON'
      {
        "displayName": "<name>",
        "jobSpec": {
          "serviceAccount": "<sa>",
          "pscInterfaceConfig": {"networkAttachment": "projects/<project-id>/regions/<region>/networkAttachments/<attachment>"},
          "workerPoolSpecs": [{"machineSpec": {"machineType": "<machine-type>"}, "replicaCount": 1, "containerSpec": {"imageUri": "<image>"}}]
        }
      }
      JSON
      curl -X POST -H "Authorization: Bearer $(gcloud auth print-access-token)" -H "Content-Type: application/json; charset=utf-8" -d @request.json "https://<region>-aiplatform.googleapis.com/v1/projects/<project-id>/locations/<region>/customJobs"
      ```

- [ ] **Attach Pipeline Runs to Your VPC** - pass: every production pipeline job reports `network` or `pscInterfaceConfig.networkAttachment`
  - **Console**:
    - Verify: Google Cloud console > Agent Platform > Pipelines > Region: <region> > <run> > Pipeline run analysis > the run summary shows a peered VPC network or a network attachment
    - Fix: Google Cloud console > Agent Platform > Pipelines > Region: <region> > Create run > Run details: select the pipeline and enter a Run name (Run schedule: Recurring for a scheduled pipeline) > Advanced options > Peered VPC network: <network> > Continue > Runtime configuration > Cloud storage location: Browse > <bucket> > Select > Submit
  - **CLI**:
    - Verify:
      ```bash
      curl -s -H "Authorization: Bearer $(gcloud auth print-access-token)" "https://<region>-aiplatform.googleapis.com/v1/projects/<project-id>/locations/<region>/pipelineJobs" \
        | jq -r '.pipelineJobs[]? | select((.network // "") == "" and (.pscInterfaceConfig.networkAttachment // "") == "") | .name'
      ```
    - Expect: no output. A run with neither field has no path into your VPC, so no perimeter can force its egress through your firewall and Cloud NAT.
    - Fix:
      ```bash
      cat > request.json <<'JSON'
      {
        "displayName": "<run-name>",
        "templateUri": "<pipeline-template-uri>",
        "serviceAccount": "<pipeline-sa>@<project-id>.iam.gserviceaccount.com",
        "pscInterfaceConfig": {"networkAttachment": "projects/<project-id>/regions/<region>/networkAttachments/<attachment>"},
        "runtimeConfig": {"gcsOutputDirectory": "gs://<bucket>/<prefix>"}
      }
      JSON
      curl -X POST -H "Authorization: Bearer $(gcloud auth print-access-token)" -H "Content-Type: application/json; charset=utf-8" -d @request.json "https://<region>-aiplatform.googleapis.com/v1/projects/<project-id>/locations/<region>/pipelineJobs"
      ```

---

## Workbench (Notebooks)

- [ ] **Restrict Workbench Instances to Internal IP Addresses** - pass: `constraints/ainotebooks.restrictPublicIp` is enforced and every existing instance reports `gceSetup.disablePublicIp` = `true`
  - **Console**:
    - Verify: Google Cloud console > IAM & Admin > Organization Policies > select the organization in the resource picker > `Restrict public IP access on new Vertex AI Workbench notebooks and instances` > Policy details > Effective policy reads Enforced, and Google Cloud console > Agent Platform > Workbench > Instances > <instance> > the instance's details show no external IP address
    - Fix: Google Cloud console > IAM & Admin > Organization Policies > select the organization in the resource picker > `Restrict public IP access on new Vertex AI Workbench notebooks and instances` > Manage policy > Override parent's policy > Add a rule > Enforcement: On > Set policy, then Google Cloud console > Agent Platform > Workbench > Instances > Create new > Advanced options > Networking > clear `Assign external IP address` > Create, move the notebooks over and delete the public instance
  - **CLI**:
    - Verify:
      ```bash
      gcloud org-policies describe ainotebooks.restrictPublicIp --organization=$ORG_ID --effective --format=yaml
      ```
    - Verify:
      ```bash
      gcloud workbench instances list --location=<zone> --format="table(name.basename(), gceSetup.disablePublicIp)"
      ```
    - Expect: `rules: - enforce: true` and `True` on every instance. A public notebook VM is an internet-facing host that holds the analyst's credentials and data.
    - Fix:
      ```bash
      gcloud resource-manager org-policies enable-enforce constraints/ainotebooks.restrictPublicIp --organization=$ORG_ID
      ```
    - Fix:
      ```bash
      curl -X PATCH -H "Authorization: Bearer $(gcloud auth print-access-token)" -H "Content-Type: application/json; charset=utf-8" \
        -d '{"gceSetup": {"disablePublicIp": true}}' \
        "https://notebooks.googleapis.com/v2/projects/<project-id>/locations/<zone>/instances/<instance>?updateMask=gce_setup.disable_public_ip"
      ```
    - Fix:
      ```bash
      gcloud workbench instances create <instance> --location=<zone> --machine-type=<machine-type> --disable-public-ip --service-account-email=<sa> --network=projects/<project-id>/global/networks/<network> --subnet=projects/<project-id>/regions/<region>/subnetworks/<subnet>
      ```

- [ ] **Disable File Downloads on Workbench Instances (the browser download is the exfiltration path out of a private VPC)** - pass: `constraints/ainotebooks.disableFileDownloads` is enforced and every existing instance carries metadata `notebook-disable-downloads` = `true` and `notebook-disable-nbconvert` = `true`
  - **Console**:
    - Verify: Google Cloud console > IAM & Admin > Organization Policies > select the organization in the resource picker > `Disable file downloads on new Vertex AI Workbench instances` > Policy details > Effective policy reads Enforced, and Google Cloud console > Agent Platform > Workbench > Instances > <instance> > Software and security > Metadata shows `notebook-disable-downloads` = `true` and `notebook-disable-nbconvert` = `true`
    - Fix: Google Cloud console > IAM & Admin > Organization Policies > select the organization in the resource picker > `Disable file downloads on new Vertex AI Workbench instances` > Manage policy > Override parent's policy > Add a rule > Enforcement: On > Set policy, then Google Cloud console > Agent Platform > Workbench > Instances > <instance> > Software and security > Metadata > set `notebook-disable-downloads` and `notebook-disable-nbconvert` to `true` > Submit on every existing instance
  - **CLI**:
    - Verify:
      ```bash
      gcloud org-policies describe ainotebooks.disableFileDownloads --organization=$ORG_ID --effective --format=yaml
      ```
    - Verify:
      ```bash
      gcloud workbench instances list --location=<zone> --format="table(name.basename(), gceSetup.metadata.notebook-disable-downloads, gceSetup.metadata.notebook-disable-nbconvert)"
      ```
    - Expect: `rules: - enforce: true` and `true` in both metadata columns for every instance. With downloads on, anything the notebook can read leaves through the browser.
    - Fix:
      ```bash
      gcloud resource-manager org-policies enable-enforce constraints/ainotebooks.disableFileDownloads --organization=$ORG_ID
      ```
    - Fix:
      ```bash
      gcloud workbench instances update <instance> --location=<zone> --metadata=notebook-disable-downloads=true,notebook-disable-nbconvert=true
      ```

- [ ] **Disable Root Access on Workbench Instances (root reads every credential the VM holds and can switch the other safeguards off)** - pass: `constraints/ainotebooks.disableRootAccess` is enforced and every existing instance carries metadata `notebook-disable-root` = `true`
  - **Console**:
    - Verify: Google Cloud console > IAM & Admin > Organization Policies > select the organization in the resource picker > `Disable root access on new Vertex AI Workbench user-managed notebooks and instances` > Policy details > Effective policy reads Enforced, and Google Cloud console > Agent Platform > Workbench > Instances > <instance> > Software and security > Metadata shows `notebook-disable-root` = `true`
    - Fix: Google Cloud console > IAM & Admin > Organization Policies > select the organization in the resource picker > `Disable root access on new Vertex AI Workbench user-managed notebooks and instances` > Manage policy > Override parent's policy > Add a rule > Enforcement: On > Set policy, then Google Cloud console > Agent Platform > Workbench > Instances > <instance> > Software and security > Metadata > set `notebook-disable-root` to `true` > Submit on every existing instance
  - **CLI**:
    - Verify:
      ```bash
      gcloud org-policies describe ainotebooks.disableRootAccess --organization=$ORG_ID --effective --format=yaml
      ```
    - Verify:
      ```bash
      gcloud workbench instances list --location=<zone> --format="table(name.basename(), gceSetup.metadata.notebook-disable-root)"
      ```
    - Expect: `rules: - enforce: true` and `true` on every instance. Root on the VM reads every credential it holds and can switch the other notebook safeguards off.
    - Fix:
      ```bash
      gcloud resource-manager org-policies enable-enforce constraints/ainotebooks.disableRootAccess --organization=$ORG_ID
      ```
    - Fix: `gcloud workbench instances update <instance> --location=<zone> --metadata=notebook-disable-root=true`

- [ ] **Disable the Terminal on Workbench Instances (an unlogged shell with the instance's service-account credentials)** - pass: `constraints/ainotebooks.disableTerminal` is enforced and every existing instance carries metadata `notebook-disable-terminal` = `true`
  - **Console**:
    - Verify: Google Cloud console > IAM & Admin > Organization Policies > select the organization in the resource picker > `Disable terminal on new Vertex AI Workbench instances` > Policy details > Effective policy reads Enforced, and Google Cloud console > Agent Platform > Workbench > Instances > <instance> > Software and security > Metadata shows `notebook-disable-terminal` = `true`
    - Fix: Google Cloud console > IAM & Admin > Organization Policies > select the organization in the resource picker > `Disable terminal on new Vertex AI Workbench instances` > Manage policy > Override parent's policy > Add a rule > Enforcement: On > Set policy, then Google Cloud console > Agent Platform > Workbench > Instances > <instance> > Software and security > Metadata > set `notebook-disable-terminal` to `true` > Submit on every existing instance
  - **CLI**:
    - Verify:
      ```bash
      gcloud org-policies describe ainotebooks.disableTerminal --organization=$ORG_ID --effective --format=yaml
      ```
    - Verify:
      ```bash
      gcloud workbench instances list --location=<zone> --format="table(name.basename(), gceSetup.metadata.notebook-disable-terminal)"
      ```
    - Expect: `rules: - enforce: true` and `true` on every instance. The terminal is an unlogged shell with the instance's service-account credentials.
    - Fix:
      ```bash
      gcloud resource-manager org-policies enable-enforce constraints/ainotebooks.disableTerminal --organization=$ORG_ID
      ```
    - Fix:
      ```bash
      gcloud workbench instances update <instance> --location=<zone> --metadata=notebook-disable-terminal=true
      ```

- [ ] **Require Automatic Upgrade Schedules on Workbench Instances** - pass: `constraints/ainotebooks.requireAutoUpgradeSchedule` is enforced and every existing instance carries metadata `notebook-upgrade-schedule` with a cron expression
  - **Console**:
    - Verify: Google Cloud console > IAM & Admin > Organization Policies > select the organization in the resource picker > `Require automatic scheduled upgrades on new Vertex AI Workbench user-managed notebooks and instances` > Policy details > Effective policy reads Enforced, and Google Cloud console > Agent Platform > Workbench > Instances > <instance> > Environment auto-upgrade shows a schedule
    - Fix: Google Cloud console > IAM & Admin > Organization Policies > select the organization in the resource picker > `Require automatic scheduled upgrades on new Vertex AI Workbench user-managed notebooks and instances` > Manage policy > Override parent's policy > Add a rule > Enforcement: On > Set policy, then Google Cloud console > Agent Platform > Workbench > Instances > <instance> > Environment auto-upgrade > set a Weekly or Monthly schedule > Submit on every existing instance
  - **CLI**:
    - Verify:
      ```bash
      gcloud org-policies describe ainotebooks.requireAutoUpgradeSchedule --organization=$ORG_ID --effective --format=yaml
      ```
    - Verify:
      ```bash
      gcloud workbench instances list --location=<zone> --format="table(name.basename(), gceSetup.metadata.notebook-upgrade-schedule)"
      ```
    - Expect: `rules: - enforce: true` and a cron expression on every instance. An instance without a schedule keeps its original image and every vulnerability patched since.
    - Fix:
      ```bash
      gcloud resource-manager org-policies enable-enforce constraints/ainotebooks.requireAutoUpgradeSchedule --organization=$ORG_ID
      ```
    - Fix:
      ```bash
      gcloud workbench instances update <instance> --location=<zone> --metadata=notebook-upgrade-schedule="00 19 * * MON"
      ```

- [ ] **Restrict Workbench Instances to Approved VPC Networks** - pass: `constraints/ainotebooks.restrictVpcNetworks` allows only `projects/<project-id>/global/networks/<network>` values (or `under:folders/<folder-id>`), and every instance reports one of those networks
  - **Console**:
    - Verify: Google Cloud console > IAM & Admin > Organization Policies > select the organization in the resource picker > `Restrict VPC networks on new Vertex AI Workbench instances` > Policy details > Effective policy lists only approved networks under Allowed, and Google Cloud console > Agent Platform > Workbench > Instances > <instance> > the instance's details show an approved network
    - Fix: Google Cloud console > IAM & Admin > Organization Policies > select the organization in the resource picker > `Restrict VPC networks on new Vertex AI Workbench instances` > Manage policy > Override parent's policy > Add a rule > Policy values: Custom > Policy type: Allow > Custom value: `projects/<project-id>/global/networks/<network>` > Set policy, then Google Cloud console > Agent Platform > Workbench > Instances > Create new > Advanced options > Networking > Network: <approved network> > Subnetwork: <subnet> > Create, move the notebooks over and delete the old instance
  - **CLI**:
    - Verify:
      ```bash
      gcloud org-policies describe ainotebooks.restrictVpcNetworks --organization=$ORG_ID --effective --format="value(spec.rules.allowAll, spec.rules.values.allowedValues)"
      ```
    - Verify:
      ```bash
      gcloud workbench instances list --location=<zone> --format="table(name.basename(), gceSetup.networkInterfaces[].network)"
      ```
    - Expect: no `True` in the first column and only approved networks in the second (an empty line means any network is allowed), and only those networks in the instance list. An instance in the default network is behind allow-all-internal firewall rules and outside your perimeter's private path to Google APIs.
    - Fix:
      ```bash
      gcloud resource-manager org-policies allow constraints/ainotebooks.restrictVpcNetworks projects/<project-id>/global/networks/<network> --organization=$ORG_ID
      ```
    - Fix:
      ```bash
      gcloud workbench instances create <instance> --location=<zone> --machine-type=<machine-type> --disable-public-ip --service-account-email=<notebook-sa>@<project-id>.iam.gserviceaccount.com --network=projects/<project-id>/global/networks/<network> --subnet=projects/<project-id>/regions/<region>/subnetworks/<subnet>
      ```

- [ ] **Restrict Workbench Instances to Single-User Access** - pass: `constraints/ainotebooks.accessMode` allows only `single-user`, and every instance carries metadata `proxy-mode` = `mail`
  - **Console**:
    - Verify: Google Cloud console > IAM & Admin > Organization Policies > select the organization in the resource picker > `Define access mode for Vertex AI Workbench notebooks and instances` > Policy details > Effective policy lists only `single-user` under Allowed, and Google Cloud console > Agent Platform > Workbench > Instances > <instance> > Software and security > Metadata shows `proxy-mode` = `mail`
    - Fix: Google Cloud console > IAM & Admin > Organization Policies > select the organization in the resource picker > `Define access mode for Vertex AI Workbench notebooks and instances` > Manage policy > Override parent's policy > delete every existing rule > Add a rule > Policy values: Custom > Policy type: Allow > Custom value: `single-user` > Set policy, then Google Cloud console > Agent Platform > Workbench > Instances > Create new > Advanced options > IAM and security > `Single user` > User email > Create for each shared instance to replace
  - **CLI**:
    - Verify:
      ```bash
      gcloud org-policies describe ainotebooks.accessMode --organization=$ORG_ID --effective --format="value(spec.rules.values.allowedValues)"
      ```
    - Verify:
      ```bash
      gcloud workbench instances list --location=<zone> --format="table(name.basename(), gceSetup.metadata.proxy-mode, gceSetup.metadata.proxy-user-mail)"
      ```
    - Expect: `single-user` only, and `mail` with an owner email on every instance. A shared service-account instance makes every download and shell command unattributable.
    - Fix:
      ```bash
      cat > access-mode.yaml <<YAML
      name: organizations/$ORG_ID/policies/ainotebooks.accessMode
      spec:
        rules:
        - values:
            allowedValues:
            - single-user
      YAML
      gcloud org-policies set-policy access-mode.yaml
      ```
    - Fix:
      ```bash
      gcloud workbench instances create <instance> --location=<zone> --machine-type=<machine-type> --disable-public-ip --instance-owners=<user>@<domain> --service-account-email=<sa>
      ```

- [ ] **Run Workbench Instances as a Dedicated Service Account (the default is the Compute Engine default service account)** - pass: no instance reports `<project-number>-compute@developer.gserviceaccount.com` under `gceSetup.serviceAccounts`
  - **Console**:
    - Verify: Google Cloud console > Agent Platform > Workbench > Instances > <instance> > the instance's details show a service account you created, not `Compute Engine default service account`
    - Fix: Google Cloud console > Agent Platform > Workbench > Instances > Create new > Advanced options > IAM and security > clear `Use default Compute Engine service account` > Service account email: <dedicated account> > Create, move the notebooks over and delete the old instance
  - **CLI**:
    - Verify:
      ```bash
      gcloud workbench instances list --location=<zone> --format="table(name.basename(), gceSetup.serviceAccounts[].email)" --filter="gceSetup.serviceAccounts.email~compute@developer.gserviceaccount.com"
      ```
    - Expect: no rows. The default account carries project-wide Editor unless your organization blocks the automatic grant, and every user of the instance can act as it.
    - Fix: `gcloud iam service-accounts create <notebook-sa> --display-name="Workbench <instance>"`
    - Fix:
      ```bash
      gcloud workbench instances create <instance> --location=<zone> --machine-type=<machine-type> --disable-public-ip --service-account-email=<notebook-sa>@<project-id>.iam.gserviceaccount.com
      ```

---

## Security Command Center

- [ ] **Enable AI Protection in Security Command Center** - pass: AI Protection is enabled for the organization and the AI Security dashboard shows your Agent Platform assets (Premium for the detections and for Gemini models; Standard shows custom models and Security Essentials findings only)
  - **Console**:
    - Verify: Google Cloud console > Security Command Center > select the organization in the resource picker > Risk Overview > AI Security > the dashboard lists your AI assets and no critical service is reported as disabled
    - Fix: Google Cloud console > Security Command Center > select the organization in the resource picker > Settings > AI Protection card > Manage Settings > Enable, then Google Cloud console > Sensitive Data Protection > Enable discovery > select the organization in the resource picker > Service agent container: <project-id> > Enable for each discovery type
