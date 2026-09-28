<!--
id: azure-openai-cloud-security
type: CONFIGURATION
scope: ORGANIZATION
-->

<div align="center">
  <img src="../../../../images/guides/azure-openai.svg" alt="Azure OpenAI Logo" width="64" height="64">
  <h2><a href="https://azure.microsoft.com/products/ai-foundry/models/openai/" target="_blank" rel="noopener noreferrer">Azure OpenAI in Microsoft Foundry</a> Configuration Guide</h2>
  <p><em>Identity, Network, Encryption, Guardrail, Logging and Deployment controls for Azure OpenAI and Foundry resources</em></p>
</div>

---

## How to Use This Guide

Each item states its **pass** condition, then gives **Console** (the Azure portal, the Foundry portal at ai.azure.com or the Entra admin center) and **CLI** (the Azure CLI, with `az rest` against Azure Resource Manager where no command exists) steps to **Verify** and **Fix** it. Under CLI, **Expect** is the output that means it passes. Pick the channel you work in at the top of the guide; an item shows only the channels that can check or change the setting, and it passes only when every resource the command returns meets the condition.

#### Prerequisites

- Azure CLI 2.86 or newer - check with `az version`. The perimeter item installs the `nsp` extension on first use. A few **Fix** commands rebuild a guardrail from its current state with `jq`; install it before you start.
- Sign in and pin the subscription you are auditing:
  - `az login`
  - `az account list --query "[].{name:name, id:id, tenant:tenantId}" -o table`
  - `az account set --subscription <subscription-id>`
- Export the values every item uses, once per resource you audit:
  - `export SUB=$(az account show --query id -o tsv)`
  - `export AOAI_API=2025-12-01`
  - `export RES="/subscriptions/$SUB/resourceGroups/<rg>/providers/Microsoft.CognitiveServices/accounts/<resource>"`
- `AOAI_API` pins the Azure Resource Manager contract every `az rest` call below reads and writes.
  - A newer api-version adds properties this guide's **Fix** bodies do not know about, and a `PUT` replaces the resource at the version it names, so raise the pin only after re-checking each **Fix** body against that version's schema.
- List every Azure OpenAI resource (kind `OpenAI`) and Foundry resource (kind `AIServices`) and repeat the resource items for each one:
  - `az cognitiveservices account list --query "[?kind=='OpenAI' || kind=='AIServices'].{name:name, rg:resourceGroup, kind:kind}" -o table`
  - Repeat the whole guide **once per subscription**; the Policy Guardrails and Defender items are assigned at the subscription, and the alert rules are created per resource, in that resource's resource group, as you work through each subscription.
- The **Reader** role on the subscription is enough for every **Verify**, including the Azure Policy compliance reads; the reads of Microsoft Entra objects (`az ad ...`) need an ordinary member account.
- The **Fix** commands need:
  - **Cognitive Services Contributor** on the resource for guardrails and deployments
  - **Contributor** for network, encryption and diagnostic settings
  - **User Access Administrator** for role assignments
  - **Resource Policy Contributor** for policy assignments - plus **User Access Administrator** for an assignment whose effect deploys a resource, because that assignment's managed identity has to be granted its own permissions
  - **Owner** or **User Access Administrator** for resource locks
  - **Network Contributor** on the perimeter's resource group plus **Cognitive Services Contributor** on the Foundry resource for the perimeter association (it needs `joinPerimeter` on the resource) and **Monitoring Contributor** on the perimeter for its diagnostic setting
  - **Foundry Account Owner** on the resource for the Purview toggle
  - **Contributor** or **Tag Contributor** for tags
  - **Cognitive Services Contributor** or a **Contributor** assignment at the subscription to purge a deleted resource
  - **Owner or Contributor** on the subscription for the Defender plan
- A Foundry resource (kind `AIServices`) shows the same Resource Management blades as an Azure OpenAI resource; where the guide writes `Azure portal > Azure OpenAI`, open `Azure portal > Foundry` instead. The Foundry portal paths assume the **New Foundry** toggle is on.

---

## Identity & Authentication

- [ ] **Disable Key-Based Authentication** - pass: `disableLocalAuth` = `true` on every Azure OpenAI and Foundry resource
  - **Console**:
    - Verify: Azure portal > Azure OpenAI > <resource> > Overview > JSON View > `properties.disableLocalAuth` reads `true` (Resource Management > Keys and Endpoint shows both keys greyed out)
    - Fix: Azure portal > Cloud Shell (top bar) > run `az resource update --ids <resource-id> --set properties.disableLocalAuth=true`; then Azure portal > Azure OpenAI > <resource> > Overview > JSON View > confirm `properties.disableLocalAuth` reads `true`
  - **CLI**:
    - Verify:
      ```bash
      az cognitiveservices account list \
        --query "[?kind=='OpenAI' || kind=='AIServices'].{name:name, rg:resourceGroup, keyAuthDisabled:properties.disableLocalAuth}" -o table
      ```
    - Expect: `keyAuthDisabled` = `True` on every row. A blank or `False` value means anyone who copies a key from a config file, a log or a screen share has full inference and fine-tuning access with nothing to attribute it to.
    - Fix: `az resource update --ids $RES --set properties.disableLocalAuth=true`

- [ ] **Set a Custom Subdomain on Every Resource** - pass: `customSubDomainName` is set and the endpoint is `https://<resource>.openai.azure.com/` or `https://<resource>.services.ai.azure.com/`
  - **Console**:
    - Verify: Azure portal > Azure OpenAI > <resource> > Overview > `Endpoint` reads `https://<resource>.openai.azure.com/` (or `https://<resource>.services.ai.azure.com/`), not `https://<region>.api.cognitive.microsoft.com/`
    - Fix: Azure portal > Azure OpenAI > <resource> > Overview > Generate Custom Domain Name > enter the subdomain > Save
  - **CLI**:
    - Verify:
      ```bash
      az cognitiveservices account list \
        --query "[?kind=='OpenAI' || kind=='AIServices'].{name:name, rg:resourceGroup, subdomain:properties.customSubDomainName, endpoint:properties.endpoint}" -o table
      ```
    - Expect: `subdomain` is filled in and `endpoint` starts with `https://<subdomain>.` on every row. A blank subdomain means the resource answers only on the shared regional endpoint, where the only credential it can accept is a key.
    - Fix: `az cognitiveservices account update -g <rg> -n <resource> --custom-domain <resource>`

- [ ] **Grant Workload Identities the Inference Role Only** - pass: no service principal other than the deployment pipeline identity holds `Owner`, `Contributor`, `Cognitive Services Contributor` or a Foundry owner role on the resource; workloads on a kind `OpenAI` resource hold `Cognitive Services OpenAI User`, workloads on a kind `AIServices` resource hold `Foundry User`, `Foundry Agent Consumer` or the `Azure OpenAI Inference Only` custom role
  - **Console**:
    - Verify: Azure portal > Azure OpenAI > <resource> > Access control (IAM) > Role assignments tab > every service principal and managed identity row, including rows marked (Inherited), has Role `Cognitive Services OpenAI User` on a kind `OpenAI` resource, or `Foundry User`, `Foundry Agent Consumer` or `Azure OpenAI Inference Only` on a kind `AIServices` resource; the deployment pipeline identity and the diagnostic-settings policy identity are the only other rows
    - Fix: Azure portal > Azure OpenAI > <resource> > Access control (IAM) > Role assignments tab > select the over-privileged row > Remove > Yes (for a row marked (Inherited), open the link in its Scope column and remove it there); then Add > Add role assignment > Role tab > `Cognitive Services OpenAI User` (on a kind `AIServices` resource assign `Foundry User` at the project instead) > Members tab > select the managed identity or service principal > Review + assign
  - **CLI**:
    - Verify:
      ```bash
      az role assignment list --scope $RES --include-inherited \
        --query "[?principalType=='ServicePrincipal' && roleDefinitionName!='Cognitive Services OpenAI User' && roleDefinitionName!='Foundry User' && roleDefinitionName!='Azure AI User' && roleDefinitionName!='Foundry Agent Consumer' && roleDefinitionName!='Azure OpenAI Inference Only'].{principal:principalName, role:roleDefinitionName, scope:scope}" -o table
      ```
    - Expect: no rows beyond the deployment pipeline identity and, where the diagnostic-settings policy is assigned, its identity (`Log Analytics Contributor` at the subscription scope). Any other row is a workload identity with more than inference rights: with a Contributor or Cognitive Services role it can list or regenerate keys, replace the guardrail or deploy an unapproved model the moment its host is compromised.
    - Fix: `az role assignment delete --assignee <principal-id> --role <role> --scope <scope>`
    - Fix:
      ```bash
      az role assignment create --assignee-object-id <principal-id> --assignee-principal-type ServicePrincipal \
        --role "Cognitive Services OpenAI User" --scope $RES
      ```
    - Fix:
      ```bash
      az role assignment create --assignee-object-id <principal-id> --assignee-principal-type ServicePrincipal \
        --role 53ca6127-db72-4b80-b1b0-d745d6d5456d --scope "$RES/projects/<project>"
      ```

- [ ] **Authenticate Azure-Hosted Callers with a Managed Identity** - pass: every service principal with a role on the resource that runs in Azure has `servicePrincipalType` = `ManagedIdentity`; no app registration used by an Azure host carries a client secret
  - **Console**:
    - Verify: Azure portal > Azure OpenAI > <resource> > Access control (IAM) > Role assignments tab > every Azure-hosted caller's row, including rows marked (Inherited), shows a managed identity (the name of the VM, web app, function or container app), and for any app registration listed Entra admin center > Entra ID > App registrations > <app> > Certificates & secrets > Client secrets is empty
    - Fix: Azure portal > Azure OpenAI > <resource> > Access control (IAM) > Add > Add role assignment > Role tab > `Cognitive Services OpenAI User` (on a kind `AIServices` resource `Foundry User`) > Members tab > Assign access to `Managed identity` > Select members > pick the host's identity > Review + assign; then Entra admin center > Entra ID > App registrations > <app> > Certificates & secrets > Client secrets > Delete the secret the host used
  - **CLI**:
    - Verify:
      ```bash
      az role assignment list --scope $RES --include-inherited \
        --query "[?principalType=='ServicePrincipal'].{principal:principalName, id:principalId, role:roleDefinitionName}" -o table
      ```
    - Verify: `az ad sp show --id <principal-id> --query "{name:displayName, type:servicePrincipalType}" -o tsv`
    - Verify: `az ad app credential list --id <app-id> --query "[].{keyId:keyId, end:endDateTime}" -o table`
    - Expect: `type` = `ManagedIdentity` for every principal that runs on an Azure host, and an empty credential table for every app registration an Azure host uses. `Application` means the host authenticates with a client secret or certificate that lives in its configuration and outlives any single deployment.
    - Fix:
      ```bash
      az role assignment create --assignee-object-id <managed-identity-principal-id> --assignee-principal-type ServicePrincipal \
        --role "Cognitive Services OpenAI User" --scope $RES
      ```
    - Fix:
      ```bash
      az role assignment create --assignee-object-id <managed-identity-principal-id> --assignee-principal-type ServicePrincipal \
        --role 53ca6127-db72-4b80-b1b0-d745d6d5456d --scope "$RES/projects/<project>"
      ```
    - Fix: `az ad app credential delete --id <app-id> --key-id <key-id>`

- [ ] **Restrict Key, Guardrail and Deployment Rights to Named Administrators** - pass: `Owner`, `Contributor`, `Cognitive Services Contributor`, `Cognitive Services OpenAI Contributor` and the Foundry owner and project-manager roles on the resource are held only by named administrators and one deployment pipeline identity
  - **Console**:
    - Verify: Azure portal > Azure OpenAI > <resource> > Access control (IAM) > Role assignments tab > filter Role to `Owner`, `Contributor`, `Cognitive Services Contributor`, `Cognitive Services OpenAI Contributor`, `Foundry Owner`, `Foundry Account Owner` and `Foundry Project Manager` > every row (including inherited rows) is a named administrator or the deployment pipeline identity
    - Fix: Azure portal > Azure OpenAI > <resource> > Access control (IAM) > Role assignments tab > select the broad group or unexpected principal > Remove > Yes (for a row marked (Inherited), open the link in its Scope column and remove it there); then Add > Add role assignment > Role tab > `Cognitive Services OpenAI User` (or `Foundry User`) > Members tab > the same principal > Review + assign
  - **CLI**:
    - Verify:
      ```bash
      az role assignment list --scope $RES --include-inherited \
        --query "[?roleDefinitionName=='Owner' || roleDefinitionName=='Contributor' || roleDefinitionName=='Cognitive Services Contributor' || roleDefinitionName=='Cognitive Services OpenAI Contributor' || roleDefinitionName=='Foundry Owner' || roleDefinitionName=='Foundry Account Owner' || roleDefinitionName=='Foundry Project Manager' || roleDefinitionName=='Azure AI Owner' || roleDefinitionName=='Azure AI Account Owner' || roleDefinitionName=='Azure AI Project Manager'].{principal:principalName, type:principalType, role:roleDefinitionName, scope:scope}" -o table
      ```
    - Expect: only named administrators and the deployment pipeline identity are listed. A broad group or an application in this list can regenerate the keys, swap the guardrail for `Microsoft.Nill`, deploy a model nobody approved or grant key access to others.
    - Fix: `az role assignment delete --assignee <principal-id> --role <role> --scope <scope>`
    - Fix:
      ```bash
      az role assignment create --assignee-object-id <principal-id> --assignee-principal-type <User-or-Group-or-ServicePrincipal> \
        --role "Cognitive Services OpenAI User" --scope $RES
      ```

- [ ] **Rotate Both API Keys Where Key Access Must Stay Enabled (leaked keys never expire)** - pass: a `Microsoft.CognitiveServices/accounts/regenerateKey/action` event exists in the last 90 days for each key, or `disableLocalAuth` = `true`
  - **Console**:
    - Verify: Azure portal > Azure OpenAI > <resource> > Activity log > filter Operation to `Regenerate Key` and Timespan to `Last 3 months` > at least one event per key is listed, or Resource Management > Keys and Endpoint shows the keys greyed out
    - Fix: Azure portal > Azure OpenAI > <resource> > Resource Management > Keys and Endpoint > Regenerate Key 2 > move every client to the new Key 2 > Regenerate Key 1 > move clients back to Key 1
  - **CLI**:
    - Verify:
      ```bash
      az monitor activity-log list --resource-id $RES --offset 90d --max-events 10000 \
        --query "[?operationName.value=='Microsoft.CognitiveServices/accounts/regenerateKey/action'].{when:eventTimestamp, who:caller}" -o table
      ```
    - Expect: at least two rows (one per key) dated within the last 90 days, or `keyAuthDisabled` = `True` from the first item. No rows means every key ever copied out of this resource is still valid.
    - Fix:
      ```bash
      az cognitiveservices account keys regenerate -g <rg> -n <resource> --key-name Key2 \
        && read -rp "Move every client to the new Key 2, then press Enter to regenerate Key 1 " \
        && az cognitiveservices account keys regenerate -g <rg> -n <resource> --key-name Key1
      ```

- [ ] **Block Fine-Tuning and File Upload Data Actions for Callers That Only Infer** - pass: callers on a Foundry resource hold a custom role whose `notDataActions` lists `Microsoft.CognitiveServices/accounts/OpenAI/fine-tunes/*`, `files/*`, `uploads/*`, `stored-completions/*`, `evals/*` and `models/*`
  - **Console**:
    - Verify: Azure portal > Subscriptions > <subscription> > Access control (IAM) > Roles tab > filter Type to `CustomRole` > `Azure OpenAI Inference Only` > ellipsis (...) > Edit > JSON tab > `notDataActions` lists the fine-tunes, files, uploads, stored-completions, evals and models paths (leave the editor without Update); then Azure portal > Azure OpenAI > <resource> > Access control (IAM) > Role assignments tab > inference-only callers hold that role, not `Cognitive Services User`
    - Fix: Azure portal > Subscriptions > <subscription> > Access control (IAM) > Add > Add custom role > Basics > Custom role name `Azure OpenAI Inference Only` > JSON tab > Edit > under `properties.permissions[0]` set `actions` to `Microsoft.CognitiveServices/*/read`, `dataActions` to `Microsoft.CognitiveServices/accounts/OpenAI/*` and `notDataActions` to `Microsoft.CognitiveServices/accounts/OpenAI/fine-tunes/*`, `files/*`, `uploads/*`, `stored-completions/*`, `evals/*` and `models/*` > Save > Review + create > Create; then Azure portal > Azure OpenAI > <resource> > Access control (IAM) > Add > Add role assignment > `Azure OpenAI Inference Only` > the caller > Review + assign, and Remove its `Cognitive Services User` assignment
  - **CLI**:
    - Verify:
      ```bash
      az role definition list --custom-role-only true \
        --query "[?roleName=='Azure OpenAI Inference Only'].permissions[0].notDataActions" -o json
      ```
    - Verify:
      ```bash
      az role assignment list --scope $RES --include-inherited \
        --query "[?roleDefinitionName=='Cognitive Services User' || roleDefinitionName=='Foundry User' || roleDefinitionName=='Azure AI User'].{principal:principalName, type:principalType}" -o table
      ```
    - Expect: the role exists with the six `OpenAI/...` paths in `notDataActions`, and the second list holds only principals that genuinely fine-tune, upload files or build agents. Every other caller left on `Cognitive Services User` can upload training data and persist prompts into the resource.
    - Fix:
      ```bash
      az role definition create --role-definition '{
        "Name": "Azure OpenAI Inference Only",
        "IsCustom": true,
        "Description": "Model inference without fine-tuning, file upload, stored completions or evaluations",
        "Actions": ["Microsoft.CognitiveServices/*/read"],
        "NotActions": [],
        "DataActions": ["Microsoft.CognitiveServices/accounts/OpenAI/*"],
        "NotDataActions": [
          "Microsoft.CognitiveServices/accounts/OpenAI/fine-tunes/*",
          "Microsoft.CognitiveServices/accounts/OpenAI/files/*",
          "Microsoft.CognitiveServices/accounts/OpenAI/uploads/*",
          "Microsoft.CognitiveServices/accounts/OpenAI/stored-completions/*",
          "Microsoft.CognitiveServices/accounts/OpenAI/evals/*",
          "Microsoft.CognitiveServices/accounts/OpenAI/models/*"
        ],
        "AssignableScopes": ["/subscriptions/<subscription-id>"]
      }'
      ```
    - Fix:
      ```bash
      az role assignment create --assignee-object-id <principal-id> --assignee-principal-type ServicePrincipal \
        --role "Azure OpenAI Inference Only" --scope $RES
      ```
    - Fix: `az role assignment delete --assignee <principal-id> --role "Cognitive Services User" --scope $RES`

- [ ] **Scope Developer Access to the Foundry Project, Not the Resource** - pass: no user principal holds `Foundry User` (`Azure AI User`) at the Foundry resource scope; developers are assigned at `<resource>/projects/<project>` and agent callers hold `Foundry Agent Consumer`
  - **Console**:
    - Verify: Azure portal > Foundry > <resource> > Access control (IAM) > Role assignments tab > filter Role to `Foundry User` > the only rows at the resource scope are managed identities; Foundry portal > Manage > Project details > Users tab lists the developers of that project
    - Fix: Azure portal > Foundry > <resource> > Access control (IAM) > Role assignments tab > select the developer's `Foundry User` row > Remove > Yes; then Foundry portal > Manage > Project details > Users tab > Add user > pick the developer > `Foundry User` > Add
  - **CLI**:
    - Verify:
      ```bash
      az role assignment list --scope $RES \
        --query "[?principalType=='User' && (roleDefinitionName=='Foundry User' || roleDefinitionName=='Azure AI User')].{user:principalName, scope:scope}" -o table
      ```
    - Verify:
      ```bash
      az role assignment list --all --role eed3b665-ab3a-47b6-8f48-c9382fb1dad6 \
        --query "[?scope=='$RES' || starts_with(scope, '$RES/')].{who:principalName, type:principalType, scope:scope}" -o table
      ```
    - Expect: no rows from the first command, and the second lists every agent caller with the scope it holds the role at (the resource, a project or an agent). A developer with `Foundry User` at the resource scope can read and run every project's agents, files and stored completions, not just their own.
    - Fix:
      ```bash
      az role assignment delete --assignee <user-principal-name> --role 53ca6127-db72-4b80-b1b0-d745d6d5456d --scope $RES
      ```
    - Fix:
      ```bash
      az role assignment create --assignee <user-principal-name> --role 53ca6127-db72-4b80-b1b0-d745d6d5456d \
        --scope "$RES/projects/<project>"
      ```
    - Fix:
      ```bash
      az role assignment create --assignee-object-id <principal-id> --assignee-principal-type ServicePrincipal \
        --role eed3b665-ab3a-47b6-8f48-c9382fb1dad6 --scope "$RES/projects/<project>"
      ```

---

## Network & Private Access

- [ ] **Disable Public Network Access** - pass: `publicNetworkAccess` = `Disabled` on every resource, or `Enabled` only with `networkAcls.defaultAction` = `Deny` and the allow list of the next item
  - **Console**:
    - Verify: Azure portal > Azure OpenAI > <resource> > Resource Management > Networking > Firewalls and virtual networks tab > `Allow access from` reads `Disabled` (or `Selected Networks and Private Endpoints` with only your networks listed)
    - Fix: Azure portal > Azure OpenAI > <resource> > Resource Management > Networking > Firewalls and virtual networks tab > Allow access from > select `Disabled` > Save; then add a private endpoint under the Private endpoint connections tab (next items)
  - **CLI**:
    - Verify:
      ```bash
      az cognitiveservices account list \
        --query "[?kind=='OpenAI' || kind=='AIServices'].{name:name, rg:resourceGroup, publicAccess:properties.publicNetworkAccess, defaultAction:properties.networkAcls.defaultAction}" -o table
      ```
    - Expect: `publicAccess` = `Disabled` on every row (or `Enabled` paired with `defaultAction` = `Deny`). `Enabled` with `Allow` means every key or token that leaks can be redeemed from any IP address on the internet.
    - Fix: `az resource update --ids $RES --set properties.publicNetworkAccess=Disabled`

- [ ] **Allow Only Named Subnets and Egress Addresses Where Public Access Stays On** - pass: `networkAcls.defaultAction` = `Deny`, `ipRules` lists only your egress ranges and `virtualNetworkRules` only your subnets
  - **Console**:
    - Verify: Azure portal > Azure OpenAI > <resource> > Resource Management > Networking > Firewalls and virtual networks tab > `Selected Networks and Private Endpoints` is selected, the Virtual networks list holds only your subnets and the Firewall `Address range` list only your egress ranges
    - Fix: Azure portal > Azure OpenAI > <resource> > Resource Management > Networking > Firewalls and virtual networks tab > select `Selected Networks and Private Endpoints` > Add existing virtual network > pick the Virtual networks and Subnets > Enable > remove any virtual network you do not own with ... (More options) > Remove > under Firewall enter each egress `Address range` > remove any range you do not own with the trash can icon > Save
  - **CLI**:
    - Verify:
      ```bash
      az cognitiveservices account show -g <rg> -n <resource> \
        --query "{defaultAction:properties.networkAcls.defaultAction, ips:properties.networkAcls.ipRules[].value, subnets:properties.networkAcls.virtualNetworkRules[].id}"
      ```
    - Expect: `defaultAction` = `Deny` and every entry in `ips` and `subnets` is one you own. `Allow` means the lists are decorative and the endpoint is open to every network.
    - Fix: `az resource update --ids $RES --set properties.networkAcls.defaultAction=Deny`
    - Fix: `az cognitiveservices account network-rule add -g <rg> -n <resource> --ip-address <egress-cidr>`
    - Fix:
      ```bash
      az network vnet subnet update --ids <subnet-id> \
        --service-endpoints $(az network vnet subnet show --ids <subnet-id> --query "serviceEndpoints[?service!='Microsoft.CognitiveServices'].service" -o tsv) Microsoft.CognitiveServices
      ```
    - Fix: `az cognitiveservices account network-rule add -g <rg> -n <resource> --subnet <subnet-id>`
    - Fix: `az cognitiveservices account network-rule remove -g <rg> -n <resource> --ip-address <unknown-cidr>`
    - Fix: `az cognitiveservices account network-rule remove -g <rg> -n <resource> --subnet <unknown-subnet-id>`

- [ ] **Connect Through a Private Endpoint with the Three Private DNS Zones** - pass: at least one private endpoint connection is `Approved` and `privatelink.openai.azure.com`, `privatelink.cognitiveservices.azure.com` and `privatelink.services.ai.azure.com` are linked to the workload virtual network
  - **Console**:
    - Verify: Azure portal > Azure OpenAI > <resource> > Resource Management > Networking > Private endpoint connections tab > at least one connection shows `Connection state` = Approved; Azure portal > Private DNS zones > each of the three `privatelink` zones > DNS Management > Virtual Network Links lists the workload virtual network
    - Fix: Azure portal > Azure OpenAI > <resource> > Resource Management > Networking > Private endpoint connections tab > + Private endpoint > Basics > the same Region as the virtual network > Virtual Network > pick the virtual network and subnet > DNS > leave the default private DNS zone integration > Review + create > Create
  - **CLI**:
    - Verify:
      ```bash
      az cognitiveservices account show -g <rg> -n <resource> \
        --query "properties.privateEndpointConnections[].{endpoint:properties.privateEndpoint.id, status:properties.privateLinkServiceConnectionState.status}" -o table
      ```
    - Verify:
      ```bash
      az network private-dns zone list \
        --query "[?name=='privatelink.openai.azure.com' || name=='privatelink.cognitiveservices.azure.com' || name=='privatelink.services.ai.azure.com'].{zone:name, rg:resourceGroup, links:numberOfVirtualNetworkLinks}" -o table
      ```
    - Verify:
      ```bash
      for z in privatelink.openai.azure.com privatelink.cognitiveservices.azure.com privatelink.services.ai.azure.com; do
        az network private-dns link vnet list -g <dns-rg> -z "$z" \
          --query "[].{zone:'$z', vnet:virtualNetwork.id}" -o tsv
      done
      ```
    - Expect: at least one connection with `status` = `Approved`, three zones each with `links` of 1 or more, and each zone listing a link whose `vnet` is the workload virtual network. An empty first table means every call to this resource crosses the public internet, whatever the firewall says.
    - Fix:
      ```bash
      az network private-endpoint create --name <pe-name> -g <rg> --vnet-name <vnet> --subnet <subnet> \
        --private-connection-resource-id $RES --group-id account --connection-name <conn-name>
      ```
    - Fix:
      ```bash
      for z in privatelink.openai.azure.com privatelink.cognitiveservices.azure.com privatelink.services.ai.azure.com; do
        az network private-dns zone create -g <rg> -n "$z"
        az network private-dns link vnet create -g <rg> -n "link-$z" -z "$z" -v <vnet> --registration-enabled false
      done
      ```
    - Fix:
      ```bash
      az network private-endpoint dns-zone-group create -g <rg> --endpoint-name <pe-name> -n default \
        --private-dns-zone privatelink.openai.azure.com --zone-name openai
      ```
    - Fix:
      ```bash
      az network private-endpoint dns-zone-group add -g <rg> --endpoint-name <pe-name> -n default \
        --private-dns-zone privatelink.cognitiveservices.azure.com --zone-name cognitiveservices
      ```
    - Fix:
      ```bash
      az network private-endpoint dns-zone-group add -g <rg> --endpoint-name <pe-name> -n default \
        --private-dns-zone privatelink.services.ai.azure.com --zone-name services-ai
      ```

- [ ] **Reject Private Endpoint Connections You Did Not Create** - pass: every connection's `privateEndpoint.id` is in a subscription you own and none is `Pending`
  - **Console**:
    - Verify: Azure portal > Azure OpenAI > <resource> > Resource Management > Networking > Private endpoint connections tab > every row shows `Connection state` = Approved and a `Private endpoint` in your own subscription; no row is Pending
    - Fix: Azure portal > Azure OpenAI > <resource> > Resource Management > Networking > Private endpoint connections tab > select the unknown or Pending connection > Reject > Yes; then select it again > Remove > Yes
  - **CLI**:
    - Verify:
      ```bash
      az network private-endpoint-connection list --id $RES \
        --query "[].{name:name, status:properties.privateLinkServiceConnectionState.status, endpoint:properties.privateEndpoint.id}" -o table
      ```
    - Expect: every `status` is `Approved` and every `endpoint` starts with `/subscriptions/<one of your subscription ids>/`. A `Pending` row or a foreign subscription id is someone else's virtual network asking for a private path to your models.
    - Fix:
      ```bash
      az network private-endpoint-connection reject --id <connection-id> --description "Not requested by us"
      ```
    - Fix: `az network private-endpoint-connection delete --id <connection-id> --yes`

- [ ] **Do Not Enable the Trusted Services Bypass Without a Named Consumer** - pass: `networkAcls.bypass` = `None`, or `AzureServices` only where a named Azure AI Search, Machine Learning or Foundry Tools identity holds a role on the resource
  - **Console**:
    - Verify: Azure portal > Azure OpenAI > <resource> > Resource Management > Networking > Firewalls and virtual networks tab > under Exceptions, `Allow Azure services on the trusted services list to access this cognitive services account.` is unticked, or ticked with the consuming service recorded
    - Fix: Azure portal > Azure OpenAI > <resource> > Resource Management > Networking > Firewalls and virtual networks tab > Exceptions > untick `Allow Azure services on the trusted services list to access this cognitive services account.` > Save
  - **CLI**:
    - Verify:
      ```bash
      az cognitiveservices account list \
        --query "[?kind=='OpenAI' || kind=='AIServices'].{name:name, rg:resourceGroup, bypass:properties.networkAcls.bypass}" -o table
      ```
    - Expect: `bypass` = `None` or blank on every row, unless a named Search, Machine Learning or Foundry Tools identity needs it. `AzureServices` lets any such resource in the tenant that gains a role on this resource through the firewall.
    - Fix:
      ```bash
      az rest --method PATCH --uri "https://management.azure.com$RES?api-version=$AOAI_API" \
        --body '{"properties": {"networkAcls": {"bypass": "None"}}}'
      ```

- [ ] **Restrict Outbound Access to an Allow List of Data Sources** - pass: `restrictOutboundNetworkAccess` = `true` and `allowedFqdnList` names only your data sources
  - **Console**:
    - Verify: Azure portal > Azure OpenAI > <resource> > Overview > JSON View > `properties.restrictOutboundNetworkAccess` reads `true` and `properties.allowedFqdnList` lists only your data sources
    - Fix: Azure portal > Cloud Shell (top bar) > Bash > run the `az account set` line and the three `export` lines from Prerequisites, then `az rest --method PATCH --uri "https://management.azure.com$RES?api-version=$AOAI_API" --body '{"properties": {"restrictOutboundNetworkAccess": true, "allowedFqdnList": ["<data-source-fqdn>"]}}'`; then Azure portal > Azure OpenAI > <resource> > Overview > JSON View > confirm both properties
  - **CLI**:
    - Verify:
      ```bash
      az cognitiveservices account show -g <rg> -n <resource> \
        --query "{restrictOutbound:properties.restrictOutboundNetworkAccess, allowed:properties.allowedFqdnList}"
      ```
    - Expect: `restrictOutbound` = `true` and `allowed` holds only the FQDNs of your own data sources. `false` means the resource will open a connection to any host a prompt, a tool definition or a connection points it at.
    - Fix:
      ```bash
      az rest --method PATCH --uri "https://management.azure.com$RES?api-version=$AOAI_API" \
        --body '{"properties": {"restrictOutboundNetworkAccess": true, "allowedFqdnList": ["<data-source-fqdn>"]}}'
      ```

- [ ] **Inject Agent Traffic into Your Own or a Managed Virtual Network** - pass: `networkInjections[0].scenario` = `agent` with either your delegated subnet or `useMicrosoftManagedNetwork` = `true` on every Foundry resource that runs agents
  - **Console**:
    - Verify: Azure portal > Foundry > <resource> > Overview > JSON View > `properties.networkInjections` lists `scenario` = `agent` with either the `subnetArmId` of your delegated subnet or `useMicrosoftManagedNetwork` = `true`
    - Fix: Azure portal > Foundry > Create a resource > Basics > Storage tab > Select resources under Agent service > Network tab > `Disabled` > + Add private endpoint > Virtual network injection > pick the virtual network and the subnet delegated to `Microsoft.App/environments` > Review + create > Create; then move projects and agents to the new resource (injection cannot be added to an existing resource)
  - **CLI**:
    - Verify:
      ```bash
      az cognitiveservices account show -g <rg> -n <resource> \
        --query "properties.networkInjections[].{scenario:scenario, subnet:subnetArmId, managed:useMicrosoftManagedNetwork}" -o table
      ```
    - Expect: one row with `scenario` = `agent` and either your delegated subnet or `Managed` = `True` on every Foundry resource that hosts agents (with `Managed` = `True`, the resource must also pass Isolate Agent Egress with a Managed Virtual Network in Approved-Outbound Mode). An empty table means agent egress and tool traffic leave over Microsoft-managed public networking that no firewall of yours sees.

- [ ] **Associate Foundry Resources with a Network Security Perimeter in Enforced Mode** - pass: every Foundry resource (kind `AIServices`) has a perimeter association whose `accessMode` = `Enforced`, and the perimeter's diagnostic setting sends `allLogs` to a Log Analytics workspace
  - **Console**:
    - Verify: Azure portal > Network security perimeters > <perimeter> > Settings > Associated resources > the row for the Foundry resource shows Access mode `Enforced`; then Azure portal > Network security perimeters > <perimeter> > Monitoring > Diagnostic settings > a setting whose Edit setting shows `allLogs` checked and a Log Analytics workspace destination
    - Fix: Azure portal > Network security perimeters > <perimeter> > Settings > Associated resources > Add > Associate resources with an existing profile > select the profile > Add > select the Foundry resource > Select > Associate; then Monitoring > Diagnostic settings > Add diagnostic setting > enter a name > Logs > `allLogs` > Send to Log Analytics workspace > select the workspace > Save; then Settings > Associated resources > the resource's row > ... > Change access mode > `Enforced` > Apply
  - **CLI**:
    - Verify:
      ```bash
      az rest --method GET --url "https://management.azure.com$RES/networkSecurityPerimeterConfigurations?api-version=$AOAI_API" \
        --query "value[].{perimeter:properties.networkSecurityPerimeter.id, mode:properties.resourceAssociation.accessMode, logs:properties.profile.enabledLogCategories}" -o json
      ```
    - Verify:
      ```bash
      az monitor diagnostic-settings list --resource "<perimeter-resource-id>" \
        --query "[].{name:name, groups:logs[?enabled].categoryGroup, workspace:workspaceId}" -o json
      ```
    - Expect: the first command returns an entry with `mode` = `Enforced` and a `perimeter` id; the second lists a setting whose `groups` contain `allLogs` and whose `workspace` is set. An empty list from the first command means the resource is outside every perimeter, and `Learning` (Transition in the portal) means the perimeter only logs what it would have denied while a compromised token can still push data to any public host.
    - Fix: `az extension add --name nsp --upgrade`
    - Fix:
      ```bash
      az network perimeter association create --name <association> --perimeter-name <perimeter> -g <perimeter-rg> \
        --access-mode Learning --private-link-resource "{id:$RES}" --profile "{id:<profile-id>}"
      ```
    - Fix:
      ```bash
      az monitor diagnostic-settings create --name nsp-logs --resource "<perimeter-resource-id>" \
        --workspace "<workspace-resource-id>" --logs '[{"categoryGroup": "allLogs", "enabled": true}]'
      ```
    - Fix:
      ```bash
      az network perimeter association update --name <association> --perimeter-name <perimeter> -g <perimeter-rg> \
        --access-mode Enforced
      ```

- [ ] **Isolate Agent Egress with a Managed Virtual Network in Approved-Outbound Mode** - pass: `properties.managedNetwork.isolationMode` = `AllowOnlyApprovedOutbound` on every Foundry resource that runs agents without a subnet of its own, and every outbound rule, whatever its `category`, names a destination you own or a Microsoft endpoint a feature you use requires
  - **CLI**:
    - Verify:
      ```bash
      az rest --method GET --url "https://management.azure.com$RES/managedNetworks/default?api-version=$AOAI_API" \
        --query "{mode:properties.managedNetwork.isolationMode, status:properties.managedNetwork.status.status, firewall:properties.managedNetwork.firewallSku}" -o json
      ```
    - Verify:
      ```bash
      az rest --method GET --url "https://management.azure.com$RES/managedNetworks/default/outboundRules?api-version=$AOAI_API" \
        --query "value[].{name:name, type:properties.type, category:properties.category, status:properties.status, destination:properties.destination}" -o json
      ```
    - Expect: `mode` = `AllowOnlyApprovedOutbound` (and `status` = `Active` once provisioning has finished), and every outbound rule, whatever its `category`, has a `destination` you own or a Microsoft endpoint a feature you use requires (the service's own `Required` rules point at your Cosmos DB, Storage and AI Search and the `AzureActiveDirectory` tag, `category` is whatever the rule's author wrote, and on a `ServiceTag` rule any `addressPrefixes` replace its `serviceTag` as the destination; each poll in the Fix is a read: repeat it until it prints `Succeeded` before the next step). A not-found error, or `mode` = `Disabled` or `AllowInternetOutbound`, means agents can reach any internet host, so a prompt-injected tool call can post your data to a host you never approved.
    - Fix:
      ```bash
      # Only for an account created without useMicrosoftManagedNetwork = true; for one created with it, run: export NEW_RES="$RES"
      # afterwards move projects and agents to the new account and purge the old one (Purge Soft-Deleted Resources After Decommissioning)
      export NEW_RES="/subscriptions/$SUB/resourceGroups/<rg>/providers/Microsoft.CognitiveServices/accounts/<new-resource>"
      az rest --method PUT --url "https://management.azure.com$NEW_RES?api-version=$AOAI_API" \
        --headers "Content-Type=application/json" \
        --body '{"location": "<region>", "kind": "AIServices", "sku": {"name": "S0"}, "identity": {"type": "SystemAssigned"}, "properties": {"allowProjectManagement": true, "customSubDomainName": "<new-resource>", "disableLocalAuth": true, "networkInjections": [{"scenario": "agent", "subnetArmId": "", "useMicrosoftManagedNetwork": true}]}}'
      ```
    - Fix:
      ```bash
      az rest --method GET --url "https://management.azure.com$NEW_RES?api-version=$AOAI_API" \
        --query properties.provisioningState -o tsv
      ```
    - Fix:
      ```bash
      az role assignment create --assignee-object-id "$(az rest --method GET --url "https://management.azure.com$NEW_RES?api-version=$AOAI_API" --query identity.principalId -o tsv)" \
        --assignee-principal-type ServicePrincipal --role b556d68e-0be0-4f35-a333-ad7ee1ce17ea --scope "/subscriptions/$SUB/resourceGroups/<rg>"
      ```
    - Fix:
      ```bash
      az rest --method PUT --url "https://management.azure.com$NEW_RES/managedNetworks/default?api-version=$AOAI_API" \
        --headers "Content-Type=application/json" \
        --body '{"properties": {"managedNetwork": {"isolationMode": "AllowOnlyApprovedOutbound", "firewallSku": "Standard"}}}'
      ```
    - Fix:
      ```bash
      # In place (NEW_RES is RES) and Verify 1 printed a mode: run this PATCH instead of the PUT above; drop firewallSku if a firewall already exists (its SKU cannot change)
      az rest --method PATCH --url "https://management.azure.com$NEW_RES/managedNetworks/default?api-version=$AOAI_API" \
        --headers "Content-Type=application/json" \
        --body '{"properties": {"managedNetwork": {"isolationMode": "AllowOnlyApprovedOutbound", "firewallSku": "Standard"}}}'
      ```
    - Fix:
      ```bash
      az rest --method GET --url "https://management.azure.com$NEW_RES/managedNetworks/default?api-version=$AOAI_API" \
        --query properties.provisioningState -o tsv
      ```
    - Fix:
      ```bash
      az rest --method POST --url "https://management.azure.com$NEW_RES/managedNetworks/default/provision?api-version=$AOAI_API" \
        --headers "Content-Type=application/json" --body '{}'
      ```
    - Fix:
      ```bash
      az rest --method GET --url "https://management.azure.com$NEW_RES/managedNetworks/default?api-version=$AOAI_API" \
        --query "{provisioning:properties.provisioningState, status:properties.managedNetwork.status.status}" -o json
      ```
    - Fix:
      ```bash
      az rest --method PUT --url "https://management.azure.com$NEW_RES/managedNetworks/default/outboundRules/<rule-name>?api-version=$AOAI_API" \
        --headers "Content-Type=application/json" \
        --body '{"properties": {"type": "FQDN", "category": "UserDefined", "destination": "<fqdn>"}}'
      ```
    - Fix:
      ```bash
      # For each rule Verify 2 printed, whatever its category, whose destination is neither yours nor a Microsoft endpoint a feature you use requires
      az rest --method DELETE --url "https://management.azure.com$RES/managedNetworks/default/outboundRules/<unapproved-rule-name>?api-version=$AOAI_API"
      ```

---

## Encryption & Data Residency

- [ ] **Enable a Managed Identity on the Resource** - pass: `identity.type` contains `SystemAssigned` or `UserAssigned` on every resource that uses customer-managed keys, On Your Data or the trusted-services exception
  - **Console**:
    - Verify: Azure portal > Azure OpenAI > <resource> > Resource Management > Identity > System assigned tab > `Status` reads On (or the User assigned tab lists an identity)
    - Fix: Azure portal > Azure OpenAI > <resource> > Resource Management > Identity > System assigned tab > Status > On > Save > Yes
  - **CLI**:
    - Verify:
      ```bash
      az cognitiveservices account list \
        --query "[?kind=='OpenAI' || kind=='AIServices'].{name:name, rg:resourceGroup, identity:identity.type}" -o table
      ```
    - Expect: `identity` contains `SystemAssigned` or `UserAssigned` on every row that uses CMK, On Your Data or trusted services. `None` means those integrations are authenticating with a stored key or connection string.
    - Fix: `az cognitiveservices account identity assign -g <rg> -n <resource>`

- [ ] **Encrypt Stored Data with a Customer-Managed Key** - pass: `encryption.keySource` = `Microsoft.KeyVault` with your vault URI on every resource that stores fine-tuning data, files, stored completions or agent state
  - **Console**:
    - Verify: Azure portal > Azure OpenAI > <resource> > Resource Management > Encryption > `Encryption type` reads `Customer Managed Keys` and the Key URI points at your vault
    - Fix: Azure portal > Azure OpenAI > <resource> > Resource Management > Identity > System assigned > Status On > Save; then Azure portal > Key vaults > <vault> > Access control (IAM) > Add > Add role assignment > `Key Vault Crypto Service Encryption User` > Managed identity > the resource's identity > Review + assign; then Azure portal > Azure OpenAI > <resource> > Resource Management > Encryption > Encryption type > `Customer Managed Keys` > Encryption key > `Select from Key Vault` > pick the vault, key and version > Save
  - **CLI**:
    - Verify:
      ```bash
      az cognitiveservices account list \
        --query "[?kind=='OpenAI' || kind=='AIServices'].{name:name, rg:resourceGroup, keySource:properties.encryption.keySource, vault:properties.encryption.keyVaultProperties.keyVaultUri}" -o table
      ```
    - Expect: `keySource` = `Microsoft.KeyVault` and `vault` is your Key Vault URI on every resource that stores data. Blank or `Microsoft.CognitiveServices` means the key protecting your training data and stored prompts is one Microsoft holds and you cannot revoke.
    - Fix:
      ```bash
      az role assignment create --assignee-object-id "$(az cognitiveservices account identity show -g <rg> -n <resource> --query principalId -o tsv)" \
        --assignee-principal-type ServicePrincipal --role "Key Vault Crypto Service Encryption User" \
        --scope "$(az keyvault show --name <vault> --query id -o tsv)"
      ```
    - Fix:
      ```bash
      az cognitiveservices account update -g <rg> -n <resource> \
        --encryption '{"keySource": "Microsoft.KeyVault", "keyVaultProperties": {"keyName": "<key>", "keyVersion": "<key-version>", "keyVaultUri": "https://<vault>.vault.azure.net/"}}'
      ```

- [ ] **Deploy with Data Zone or Regional Types Where Data Residency Is Required** - pass: on resources with a residency requirement no deployment uses `GlobalStandard`, `GlobalProvisionedManaged`, `GlobalBatch` or `DeveloperTier`, and no spillover target does either
  - **Console**:
    - Verify: Foundry portal > Build > Models > each deployment's details show a Deployment type of `Standard`, `Data Zone Standard`, `Regional Provisioned`, `Data Zone Provisioned` or `Data Zone Batch`, never `Global Standard`, `Global Provisioned`, `Global Batch` or `Developer`
    - Fix: Foundry portal > Discover > Models > <model> > Deploy > Custom settings > Deployment type > `Data Zone Standard` > Deploy; then Build > Models > <old Global deployment> > Delete
  - **CLI**:
    - Verify:
      ```bash
      az cognitiveservices account deployment list -g <rg> -n <resource> \
        --query "[].{name:name, type:sku.name, model:properties.model.name, spillover:properties.spilloverDeploymentName}" -o table
      ```
    - Expect: every `type` is `Standard`, `DataZoneStandard`, `ProvisionedManaged`, `DataZoneProvisionedManaged` or `DataZoneBatch`, and `spillover` is blank or names one of those. A `GlobalStandard`, `GlobalProvisionedManaged`, `GlobalBatch` or `DeveloperTier` row sends prompts to whichever region has capacity.
    - Fix:
      ```bash
      az cognitiveservices account deployment create -g <rg> -n <resource> --deployment-name <deployment>-dz \
        --model-name <model> --model-version <version> --model-format OpenAI \
        --sku-name DataZoneStandard --sku-capacity <capacity-units>
      ```
    - Fix: `az cognitiveservices account deployment delete -g <rg> -n <resource> --deployment-name <deployment>`

- [ ] **Disable Stored Completions at the Resource (any caller can persist full prompts and completions)** - pass: `storedCompletionsDisabled` = `true`
  - **Console**:
    - Verify: Azure portal > Azure OpenAI > <resource> > Resource Management > Stored Completions > the toggle reads `Disabled`
    - Fix: Azure portal > Azure OpenAI > <resource> > Resource Management > Stored Completions > select `Disabled` > Save (on a Foundry resource, open a support case to disable stored completions for the subscription)
  - **CLI**:
    - Verify: `az cognitiveservices account show -g <rg> -n <resource> --query properties.storedCompletionsDisabled`
    - Expect: `true`. Blank or `false` means any caller with inference rights can persist full prompts and completions into a store on the resource, kept for 30 days and readable by every principal with the stored-completions read action.
    - Fix:
      ```bash
      az rest --method PATCH --uri "https://management.azure.com$RES?api-version=$AOAI_API" \
        --body '{"properties": {"storedCompletionsDisabled": true}}'
      ```

---

## Guardrails (Content Filtering)

- [ ] **Assign Your Custom Guardrail to Every Deployment** - pass: `properties.raiPolicyName` on every deployment is your custom guardrail, not `Microsoft.Default` or `Microsoft.DefaultV2`
  - **Console**:
    - Verify: Foundry portal > Build > Models > <deployment> > the Guardrails section of the playground names your custom guardrail, not `Default.V2`
    - Fix: Foundry portal > Build > Models > <deployment> > Guardrails > Manage > Assign a new guardrail > select your guardrail > Assign
  - **CLI**:
    - Verify:
      ```bash
      az cognitiveservices account deployment list -g <rg> -n <resource> \
        --query "[].{name:name, model:properties.model.name, guardrail:properties.raiPolicyName}" -o table
      ```
    - Expect: `guardrail` is your custom guardrail's name on every row. `Microsoft.DefaultV2` or `Microsoft.Default` means that deployment never scans retrieved documents for injected instructions.
    - Fix:
      ```bash
      az rest --method PUT --uri "https://management.azure.com$RES/deployments/<deployment>?api-version=$AOAI_API" \
        --body "$(az rest --method GET --uri "https://management.azure.com$RES/deployments/<deployment>?api-version=$AOAI_API" \
          | jq '. as $d | ({sku: $d.sku, tags: $d.tags} | with_entries(select(.value != null)))
            + {properties: ($d.properties
                | del(.provisioningState, .capabilities, .callRateLimit, .rateLimits, .dynamicThrottlingEnabled)
                | with_entries(select(.value != null))
                | (if .model then .model |= del(.callRateLimit) else . end)
                | .raiPolicyName = "<guardrail>")}')"
      ```

- [ ] **Create a Guardrail That Blocks Indirect Prompt Attacks in Documents** - pass: a guardrail exists whose `contentFilters` has `Indirect Attack` with `source` = `Prompt`, `enabled` = `true` and `blocking` = `true`
  - **Console**:
    - Verify: Foundry portal > Build > Guardrails > <guardrail> > the controls table lists `Indirect attacks` with action `Annotate and block`
    - Fix: Foundry portal > Build > Guardrails > Create Guardrail > Select a risk > `Indirect attacks` > select the `User input` intervention point and the `Annotate and block` action > Add control > Next > Add models > select every deployment > Save > Next > name the guardrail > Create
  - **CLI**:
    - Verify:
      ```bash
      az rest --method GET --uri "https://management.azure.com$RES/raiPolicies/<guardrail>?api-version=$AOAI_API" \
        --query "properties.contentFilters[?name=='Indirect Attack'].{source:source, enabled:enabled, blocking:blocking}" -o table
      ```
    - Expect: one row with `source` = `Prompt`, `enabled` = `True` and `blocking` = `True`. An empty table means a poisoned document in the retrieval set can instruct the model to exfiltrate data or call tools on the attacker's behalf.
    - Fix:
      ```bash
      az rest --method PUT --uri "https://management.azure.com$RES/raiPolicies/<guardrail>?api-version=$AOAI_API" \
        --body '{
          "properties": {
            "basePolicyName": "Microsoft.DefaultV2",
            "mode": "Default",
            "contentFilters": [
              {"name": "Hate", "source": "Prompt", "enabled": true, "blocking": true, "severityThreshold": "Medium"},
              {"name": "Hate", "source": "Completion", "enabled": true, "blocking": true, "severityThreshold": "Medium"},
              {"name": "Sexual", "source": "Prompt", "enabled": true, "blocking": true, "severityThreshold": "Medium"},
              {"name": "Sexual", "source": "Completion", "enabled": true, "blocking": true, "severityThreshold": "Medium"},
              {"name": "Selfharm", "source": "Prompt", "enabled": true, "blocking": true, "severityThreshold": "Medium"},
              {"name": "Selfharm", "source": "Completion", "enabled": true, "blocking": true, "severityThreshold": "Medium"},
              {"name": "Violence", "source": "Prompt", "enabled": true, "blocking": true, "severityThreshold": "Medium"},
              {"name": "Violence", "source": "Completion", "enabled": true, "blocking": true, "severityThreshold": "Medium"},
              {"name": "Jailbreak", "source": "Prompt", "enabled": true, "blocking": true},
              {"name": "Indirect Attack", "source": "Prompt", "enabled": true, "blocking": true},
              {"name": "Protected Material Text", "source": "Completion", "enabled": true, "blocking": true},
              {"name": "Protected Material Code", "source": "Completion", "enabled": true, "blocking": true}
            ]
          }
        }'
      ```

- [ ] **Block User Prompt Attacks on Every Guardrail** - pass: every guardrail assigned to a deployment has `Jailbreak` with `source` = `Prompt`, `enabled` = `true` and `blocking` = `true`
  - **Console**:
    - Verify: Foundry portal > Build > Guardrails > <guardrail> > the controls table lists `User prompt attacks` with action `Annotate and block`
    - Fix: Foundry portal > Build > Guardrails > <guardrail> > Edit > Select a risk > `User prompt attacks` > action `Annotate and block` > Add control > Confirm the override > Next > Next > Create
  - **CLI**:
    - Verify:
      ```bash
      az rest --method GET --uri "https://management.azure.com$RES/raiPolicies/<guardrail>?api-version=$AOAI_API" \
        --query "properties.contentFilters[?name=='Jailbreak'].{source:source, enabled:enabled, blocking:blocking}" -o table
      ```
    - Expect: one row with `source` = `Prompt`, `enabled` = `True` and `blocking` = `True`. `blocking` = `False` is annotate-only: the jailbreak is logged and the model answers it anyway.
    - Fix:
      ```bash
      az rest --method PUT --uri "https://management.azure.com$RES/raiPolicies/<guardrail>?api-version=$AOAI_API" \
        --body "$(az rest --method GET --uri "https://management.azure.com$RES/raiPolicies/<guardrail>?api-version=$AOAI_API" \
          | jq '({tags} | with_entries(select(.value != null)))
            + {properties: (.properties | del(.type) | with_entries(select(.value != null))
            | .contentFilters |= ((. // [])
                | map(if .name == "Jailbreak" and .source == "Prompt" then (.enabled = true | .blocking = true) else . end)
                | . as $f
                | . + ([{name: "Jailbreak", source: "Prompt", enabled: true, blocking: true}]
                       | map(select($f | any(.name == "Jailbreak" and .source == "Prompt") | not)))))}')"
      ```

- [ ] **Do Not Enable the Asynchronous Filter on Production Guardrails** - pass: `properties.mode` is `Default` or `Blocking` on every guardrail assigned to a production deployment
  - **CLI**:
    - Verify:
      ```bash
      az rest --method GET --uri "https://management.azure.com$RES/raiPolicies?api-version=$AOAI_API" \
        --query "value[].{name:name, mode:properties.mode}" -o table
      ```
    - Expect: `mode` = `Default` or `Blocking` on every guardrail a production deployment uses; the built-in policy that audits this fleet-wide accepts only `Default`. `Asynchronous_filter` (or the legacy `Deferred`) streams the text first and filters afterwards.
    - Fix:
      ```bash
      az rest --method PUT --uri "https://management.azure.com$RES/raiPolicies/<guardrail>?api-version=$AOAI_API" \
        --body "$(az rest --method GET --uri "https://management.azure.com$RES/raiPolicies/<guardrail>?api-version=$AOAI_API" \
          | jq '({tags} | with_entries(select(.value != null)))
            + {properties: (.properties | del(.type) | with_entries(select(.value != null)) | .mode = "Default")}')"
      ```

- [ ] **Set Harm-Category Filters to Medium or Stricter on Prompts and Completions** - pass: `Hate`, `Sexual`, `Selfharm` and `Violence` are `enabled` and `blocking` with `severityThreshold` `Medium` or `Low` for both `Prompt` and `Completion` on every guardrail in use
  - **Console**:
    - Verify: Foundry portal > Build > Guardrails > <guardrail> > the controls table shows `Hate`, `Sexual`, `Violence` and `Self-harm` at the `User input` and `Output` intervention points with action `Annotate and block` at severity level `Medium` or `Low`
    - Fix: Foundry portal > Build > Guardrails > <guardrail> > Edit > Select a risk > `Violence` (repeat for `Hate`, `Sexual`, `Self-harm`) > select the `User input` and `Output` intervention points > severity level `Medium` > action `Annotate and block` > Add control > Confirm > Next > Next > Create
  - **CLI**:
    - Verify:
      ```bash
      az rest --method GET --uri "https://management.azure.com$RES/raiPolicies/<guardrail>?api-version=$AOAI_API" \
        --query "properties.contentFilters[?name=='Hate' || name=='Sexual' || name=='Selfharm' || name=='Violence'].{name:name, source:source, threshold:severityThreshold, enabled:enabled, blocking:blocking}" -o table
      ```
    - Expect: eight rows (four categories x `Prompt` and `Completion`), each `enabled` = `True`, `blocking` = `True`, `threshold` = `Medium` or `Low`. A `High` threshold lets low- and medium-severity content through, and `blocking` = `False` only annotates what it flags.
    - Fix:
      ```bash
      az rest --method PUT --uri "https://management.azure.com$RES/raiPolicies/<guardrail>?api-version=$AOAI_API" \
        --body "$(az rest --method GET --uri "https://management.azure.com$RES/raiPolicies/<guardrail>?api-version=$AOAI_API" \
          | jq '({tags} | with_entries(select(.value != null)))
            + {properties: (.properties | del(.type) | with_entries(select(.value != null))
            | .contentFilters |= ((. // [])
                | map(if (.name == "Hate" or .name == "Sexual" or .name == "Selfharm" or .name == "Violence")
                      then (.enabled = true | .blocking = true | .severityThreshold = (if .severityThreshold == "Low" then "Low" else "Medium" end)) else . end)))}')"
      ```

- [ ] **Block Protected Material Text and Code in Completions** - pass: `Protected Material Text` and `Protected Material Code` are `enabled` and `blocking` with `source` = `Completion` on every guardrail in use
  - **Console**:
    - Verify: Foundry portal > Build > Guardrails > <guardrail> > the controls table lists `Protected material for text` and `Protected material for code` at the `Output` intervention point with action `Annotate and block`
    - Fix: Foundry portal > Build > Guardrails > <guardrail> > Edit > Select a risk > `Protected material for text` > `Output` intervention point > action `Annotate and block` > Add control > Confirm > repeat for `Protected material for code` > Next > Next > Create
  - **CLI**:
    - Verify:
      ```bash
      az rest --method GET --uri "https://management.azure.com$RES/raiPolicies/<guardrail>?api-version=$AOAI_API" \
        --query "properties.contentFilters[?name=='Protected Material Text' || name=='Protected Material Code'].{name:name, source:source, enabled:enabled, blocking:blocking}" -o table
      ```
    - Expect: two rows, both `source` = `Completion`, `enabled` = `True`, `blocking` = `True`. A missing or non-blocking row means the model can return song lyrics, articles or licensed source code verbatim, outside the Customer Copyright Commitment.
    - Fix:
      ```bash
      az rest --method PUT --uri "https://management.azure.com$RES/raiPolicies/<guardrail>?api-version=$AOAI_API" \
        --body "$(az rest --method GET --uri "https://management.azure.com$RES/raiPolicies/<guardrail>?api-version=$AOAI_API" \
          | jq '({tags} | with_entries(select(.value != null)))
            + {properties: (.properties | del(.type) | with_entries(select(.value != null))
            | .contentFilters |= ((. // [])
                | map(if (.name == "Protected Material Text" or .name == "Protected Material Code")
                        and .source == "Completion" then (.enabled = true | .blocking = true) else . end)
                | . as $f
                | . + ([{name: "Protected Material Text", source: "Completion", enabled: true, blocking: true},
                        {name: "Protected Material Code", source: "Completion", enabled: true, blocking: true}]
                       | map(select(.name as $n | ($f | any(.name == $n and .source == "Completion")) | not)))))}')"
      ```

- [ ] **Delete Guardrails Weaker Than Your Standard (any caller can select them per request with x-policy-id)** - pass: every custom guardrail on the resource blocks `Jailbreak` and `Indirect Attack` on prompts, or has been deleted
  - **Console**:
    - Verify: Foundry portal > Build > Guardrails > every guardrail in the list, opened in turn, shows `User prompt attacks` and `Indirect attacks` on `User input` with action `Annotate and block`
    - Fix: Foundry portal > Build > Guardrails > select the weaker guardrail's row > Delete (reassign its models and agents to your standard guardrail first)
  - **CLI**:
    - Verify:
      ```bash
      az rest --method GET --uri "https://management.azure.com$RES/raiPolicies?api-version=$AOAI_API" \
        --query "value[?properties.type=='UserManaged'].{name:name, jailbreak:properties.contentFilters[?name=='Jailbreak' && source=='Prompt' && enabled].blocking | [0], indirect:properties.contentFilters[?name=='Indirect Attack' && source=='Prompt' && enabled].blocking | [0]}" -o table
      ```
    - Expect: every row shows `jailbreak` = `True` and `indirect` = `True`. Any other row is a guardrail a caller can select with `x-policy-id` to bypass the one you assigned.
    - Fix:
      ```bash
      az rest --method DELETE --uri "https://management.azure.com$RES/raiPolicies/<weak-guardrail>?api-version=$AOAI_API"
      ```

---

## Abuse Monitoring & Stored Data

- [ ] **Apply for Modified Abuse Monitoring on Resources That Process Sensitive Prompts** - pass: `properties.capabilities` contains `ContentLogging` = `false` on every resource whose prompts carry regulated or privileged data
  - **CLI**:
    - Verify:
      ```bash
      az cognitiveservices account show -g <rg> -n <resource> --query "properties.capabilities[?name=='ContentLogging'].value" -o tsv
      ```
    - Expect: `false` on every resource that handles sensitive prompts. Empty output means the capability is absent and flagged prompts and completions can still be stored in Microsoft's abuse monitoring data store for human review.

---

## Logging & Threat Detection

- [ ] **Send Resource Logs to a Log Analytics Workspace** - pass: a diagnostic setting on every resource enables `allLogs` (or `Audit`, `RequestResponse`, `Trace` and `AzureOpenAIRequestUsage`) and `AllMetrics` with a workspace destination outside the audited subscription
  - **Console**:
    - Verify: Azure portal > Azure OpenAI > <resource> > Monitoring > Diagnostic settings > at least one setting is listed whose Edit setting shows `allLogs` (or every category) and `AllMetrics` checked and a Log Analytics workspace destination in the logging subscription
    - Fix: Azure portal > Azure OpenAI > <resource> > Monitoring > Diagnostic settings > Add diagnostic setting > enter a name for the setting > Logs > check `allLogs` > Metrics > check `AllMetrics` > Destination details > check the Log Analytics workspace destination > pick the logging subscription and workspace > Save
  - **CLI**:
    - Verify:
      ```bash
      az monitor diagnostic-settings list --resource $RES \
        --query "[].{name:name, groups:logs[?enabled].categoryGroup, categories:logs[?enabled].category, metrics:metrics[?enabled].category, workspace:workspaceId}" -o json
      ```
    - Expect: at least one setting with `groups` containing `allLogs` (or `categories` containing `Audit`, `RequestResponse`, `Trace` and `AzureOpenAIRequestUsage`), `metrics` containing `AllMetrics` and a `workspace` in the logging subscription. An empty list means the resource keeps no record of its own calls.
    - Fix:
      ```bash
      az monitor diagnostic-settings create --name aoai-logs --resource $RES \
        --workspace <workspace-resource-id> \
        --logs '[{"categoryGroup": "allLogs", "enabled": true}]' \
        --metrics '[{"category": "AllMetrics", "enabled": true}]'
      ```

- [ ] **Enable Defender for Cloud Threat Protection for AI Services** - pass: `az security pricing show -n AI` returns `pricingTier` = `Standard` on every subscription that hosts a resource
  - **Console**:
    - Verify: Azure portal > Microsoft Defender for Cloud > Environment settings > <subscription> > Defender plans > the `AI services` plan reads On
    - Fix: Azure portal > Microsoft Defender for Cloud > Environment settings > <subscription> > Defender plans > toggle `AI services` to On > Save
  - **CLI**:
    - Verify: `az security pricing show -n AI --query "{plan:name, tier:pricingTier}" -o table`
    - Expect: `tier` = `Standard`. `Free` means jailbreak, data-leak and credential-theft attempts against your models raise no alert anywhere.
    - Fix: `az security pricing create -n AI --tier standard`

- [ ] **Enable User Prompt Evidence on the AI Services Plan** - pass: the `AI` pricing lists extension `AIPromptEvidence` with `isEnabled` = `True`
  - **Console**:
    - Verify: Azure portal > Microsoft Defender for Cloud > Environment settings > <subscription> > Defender plans > AI services > Settings > `Enable user prompt evidence` reads On
    - Fix: Azure portal > Microsoft Defender for Cloud > Environment settings > <subscription> > Defender plans > AI services > Settings > toggle `Enable user prompt evidence` to On > Continue > Save
  - **CLI**:
    - Verify: `az security pricing show -n AI --query "extensions[?name=='AIPromptEvidence'].isEnabled" -o tsv`
    - Expect: `True`. Empty or `False` means every AI alert reaches the SOC with the suspicious prompt masked and cannot be triaged.
    - Fix: `az security pricing create -n AI --tier standard --extensions name=AIPromptEvidence isEnabled=True`

- [ ] **Alert on Key Regeneration, Guardrail Changes and Resource Updates** - pass: activity-log alert rules exist for `Microsoft.CognitiveServices/accounts/regenerateKey/action`, `Microsoft.CognitiveServices/accounts/raiPolicies/write` and `Microsoft.CognitiveServices/accounts/write` on the resource, each with an action group
  - **Console**:
    - Verify: Azure portal > Monitor > Alerts > Alert rules > filter Signal type to `Activity Log` > rules scoped to the resource exist for the Regenerate Key, RAI policy write and account write operations, each with an action group
    - Fix: Azure portal > Azure OpenAI > <resource> > Monitoring > Alerts > + Create > Alert rule > Condition > See all signals > Signal type `Activity Log` > search `Regenerate Key` > select the Cognitive Services accounts signal > Apply > Actions > select an action group > Details > Alert rule name > Review + create > Create; repeat for the RAI policies write and account write signals
  - **CLI**:
    - Verify:
      ```bash
      az monitor activity-log alert list -g <rg> \
        --query "[?contains(to_string(scopes), '<resource>')].{name:name, ops:condition.allOf[?field=='operationName'].equals | [0], actions:length(actions.actionGroups)}" -o table
      ```
    - Expect: three rows whose `ops` are `Microsoft.CognitiveServices/accounts/regenerateKey/action`, `Microsoft.CognitiveServices/accounts/raiPolicies/write` and `Microsoft.CognitiveServices/accounts/write`, each with `actions` of 1 or more. A missing row is a change that happens in silence.
    - Fix:
      ```bash
      az monitor activity-log alert create -n aoai-key-regenerated -g <rg> --scope $RES \
        --condition "category=Administrative and operationName=Microsoft.CognitiveServices/accounts/regenerateKey/action" \
        -a <action-group-resource-id>
      ```
    - Fix:
      ```bash
      az monitor activity-log alert create -n aoai-guardrail-changed -g <rg> --scope $RES \
        --condition "category=Administrative and operationName=Microsoft.CognitiveServices/accounts/raiPolicies/write" \
        -a <action-group-resource-id>
      ```
    - Fix:
      ```bash
      az monitor activity-log alert create -n aoai-resource-updated -g <rg> --scope $RES \
        --condition "category=Administrative and operationName=Microsoft.CognitiveServices/accounts/write" \
        -a <action-group-resource-id>
      ```

- [ ] **Alert on Blocked Prompts and Authentication Failures** - pass: metric alert rules on the resource cover `RAIRejectedRequests` and `AzureOpenAIRequests` where `StatusCode` includes `401`, each with an action group
  - **Console**:
    - Verify: Azure portal > Monitor > Alerts > Alert rules > filter Signal type to `Metrics` > rules scoped to the resource exist for `Blocked Volume` and for `Azure OpenAI Requests` split on `StatusCode` = 401, each with an action group
    - Fix: Azure portal > Azure OpenAI > <resource> > Monitoring > Alerts > + Create > Alert rule > Condition > Signal name `Blocked Volume` > Threshold `Static` > Aggregation type `Total` > Threshold value > Actions > select an action group > Details > Alert rule name > Review + create > Create; repeat with Signal name `Azure OpenAI Requests` > Dimension name `StatusCode` > Dimension values `401`
  - **CLI**:
    - Verify:
      ```bash
      az monitor metrics alert list -g <rg> \
        --query "[?contains(to_string(scopes), '<resource>')].{name:name, metrics:criteria.allOf[].metricName, dims:criteria.allOf[].dimensions[].values | [], actions:length(actions)}" -o json
      ```
    - Expect: one rule whose `metrics` contains `RAIRejectedRequests` and one whose `metrics` contains `AzureOpenAIRequests` with `dims` containing `401`, each with `actions` of 1 or more. Without them a jailbreak campaign or a replayed key is only visible in a dashboard nobody opens.
    - Fix:
      ```bash
      az monitor metrics alert create -n aoai-blocked-prompts -g <rg> --scopes $RES \
        --condition "total RAIRejectedRequests > <baseline>" --window-size 15m --evaluation-frequency 5m \
        --action <action-group-resource-id> --description "Guardrail blocked-volume spike"
      ```
    - Fix:
      ```bash
      az monitor metrics alert create -n aoai-auth-failures -g <rg> --scopes $RES \
        --condition "total AzureOpenAIRequests > <baseline> where StatusCode includes 401" --window-size 15m --evaluation-frequency 5m \
        --action <action-group-resource-id> --description "Authentication failure spike"
      ```

---

## Model Deployments & Quota

- [ ] **Do Not Auto-Upgrade Production Deployments to New Default Model Versions** - pass: `properties.versionUpgradeOption` is `OnceCurrentVersionExpired` or `NoAutoUpgrade` on every production deployment
  - **Console**:
    - Verify: Foundry portal > Build > Models > <deployment> > the deployment details show Version update policy `Once the current version expires` or `Opt out of automatic model version upgrades` (or no policy shown, which behaves as the first); `Upgrade once new default version becomes available` and `Auto-update to default` fail
    - Fix: Foundry portal > Build > Models > <deployment> > Edit > Version update policy > `Once the current version expires` > Save
  - **CLI**:
    - Verify:
      ```bash
      az cognitiveservices account deployment list -g <rg> -n <resource> \
        --query "[].{name:name, version:properties.model.version, upgrade:properties.versionUpgradeOption}" -o table
      ```
    - Expect: `upgrade` = `OnceCurrentVersionExpired` or `NoAutoUpgrade` on every production row (blank means `OnceCurrentVersionExpired`). `OnceNewDefaultVersionAvailable` means the model behind a production endpoint changes on Microsoft's schedule, not yours.
    - Fix:
      ```bash
      az rest --method PUT --uri "https://management.azure.com$RES/deployments/<deployment>?api-version=$AOAI_API" \
        --body "$(az rest --method GET --uri "https://management.azure.com$RES/deployments/<deployment>?api-version=$AOAI_API" \
          | jq '. as $d | ({sku: $d.sku, tags: $d.tags} | with_entries(select(.value != null)))
            + {properties: ($d.properties
                | del(.provisioningState, .capabilities, .callRateLimit, .rateLimits, .dynamicThrottlingEnabled)
                | with_entries(select(.value != null))
                | (if .model then .model |= del(.callRateLimit) else . end)
                | .versionUpgradeOption = "OnceCurrentVersionExpired")}')"
      ```

- [ ] **Set a Tokens-per-Minute Ceiling on Every Deployment** - pass: `sku.capacity` on every Standard deployment equals the value in your capacity plan, not the regional maximum
  - **Console**:
    - Verify: Foundry portal > Manage > Quota > Token per minute tab > select each deployment > the details pane shows the allocation you planned, not the model's full regional quota
    - Fix: Foundry portal > Manage > Quota > Token per minute tab > select the deployment > Affiliated deployments using shared quota > pencil icon in the Actions column > enter the planned allocation > Save
  - **CLI**:
    - Verify:
      ```bash
      az cognitiveservices account deployment list -g <rg> -n <resource> \
        --query "[].{name:name, model:properties.model.name, type:sku.name, capacity:sku.capacity}" -o table
      ```
    - Expect: `capacity` matches your capacity plan for every row, in the model's capacity units (1,000 TPM per unit for most models, more for some). A deployment holding the whole regional allocation lets one leaked credential spend it all before the first 429.
    - Fix:
      ```bash
      az rest --method PATCH --uri "https://management.azure.com$RES/deployments/<deployment>?api-version=$AOAI_API" \
        --body '{"sku": {"name": "<deployment-type>", "capacity": <capacity-units>}}'
      ```

- [ ] **Delete Deployments With No Traffic (every deployment is a callable endpoint)** - pass: no deployment on the resource shows zero `AzureOpenAIRequests` over the last 30 days
  - **Console**:
    - Verify: Azure portal > Azure OpenAI > <resource> > Monitoring > Metrics > Metric `Azure OpenAI Requests` > Apply splitting > `ModelDeploymentName` > limit `50` > time range Last 30 days > every deployment listed under Foundry portal > Build > Models appears with a non-zero series
    - Fix: Foundry portal > Build > Models > <unused deployment> > confirm with its owner that it is not a standby, batch or seasonal deployment > Delete > confirm
  - **CLI**:
    - Verify:
      ```bash
      az monitor metrics list --resource $RES --metric AzureOpenAIRequests --aggregation Total \
        --offset 30d --interval P1D --dimension ModelDeploymentName --top 100 \
        --query "value[0].timeseries[].{deployment:metadatavalues[0].value, requests:sum(data[?total != null].total)}" -o table
      ```
    - Expect: every deployment from `az cognitiveservices account deployment list` appears with `requests` above zero, apart from standby, batch or seasonal deployments their owners have confirmed. A deployment missing from the table has served nothing for 30 days and is an endpoint nobody is watching.
    - Fix: `az cognitiveservices account deployment delete -g <rg> -n <resource> --deployment-name <deployment>`

---

## Policy Guardrails (Azure Policy)

- [ ] **Deny Resources with Key Access Enabled Through Azure Policy** - pass: policy `71ef260a-8f18-47b7-abcb-62d0673d94dc` is assigned at the subscription or management group with `effect` = `Deny`, `enforcementMode` = `Default` and no `overrides` or `resourceSelectors`
  - **Console**:
    - Verify: Azure portal > Policy > Assignments > the assignment of `Azure AI Services resources should have key access disabled (disable local authentication)` > ellipsis (...) > Edit assignment > Basics > Scope the subscription or a management group, Policy enforcement `Enabled`, expand Resource Selectors and Overrides, both empty > Parameters > clear `Only show parameters that need input or review` > Effect `Deny`; close without saving
    - Fix: Azure portal > Policy > Authoring > Definitions > search `Azure AI Services resources should have key access disabled (disable local authentication)` > Assign > Basics > Scope > the subscription > Parameters > clear `Only show parameters that need input or review` > Effect `Deny` > Review + create > Create
  - **CLI**:
    - Verify:
      ```bash
      az policy assignment list --disable-scope-strict-match \
        --query "[?ends_with(policyDefinitionId, '/71ef260a-8f18-47b7-abcb-62d0673d94dc')].{name:name, scope:scope, effect:parameters.effect.value, mode:enforcementMode, overrides:length(not_null(overrides, '')), selectors:length(not_null(resourceSelectors, ''))}" -o table
      ```
    - Expect: one row with `effect` = `Deny`, `mode` = `Default`, `overrides` = `0` and `selectors` = `0` at the subscription or a parent management group. An override replaces the effect and a resource selector narrows the evaluation to a few resources while the row still reads `Deny`. No row, `Audit` or `mode` = `DoNotEnforce` means the next resource anyone creates ships with keys enabled.
    - Fix:
      ```bash
      az policy assignment create --name aoai-deny-key-access \
        --display-name "Azure AI Services resources should have key access disabled" \
        --policy 71ef260a-8f18-47b7-abcb-62d0673d94dc --scope "/subscriptions/$SUB" \
        --params '{"effect": {"value": "Deny"}}'
      ```

- [ ] **Deny Resources Open to All Networks Through Azure Policy** - pass: policy `037eea7a-bd0a-46c5-9a66-03aea78705d3` is assigned with `effect` = `Deny`, `enforcementMode` = `Default` and no `overrides` or `resourceSelectors`
  - **Console**:
    - Verify: Azure portal > Policy > Assignments > the assignment of `Azure AI Services resources should restrict network access` > ellipsis (...) > Edit assignment > Basics > Policy enforcement `Enabled`, expand Resource Selectors and Overrides, both empty > Parameters > clear `Only show parameters that need input or review` > Effect `Deny`; close without saving
    - Fix: Azure portal > Policy > Authoring > Definitions > search `Azure AI Services resources should restrict network access` > Assign > Basics > Scope > the subscription > Parameters > clear `Only show parameters that need input or review` > Effect `Deny` > Review + create > Create
  - **CLI**:
    - Verify:
      ```bash
      az policy assignment list --disable-scope-strict-match \
        --query "[?ends_with(policyDefinitionId, '/037eea7a-bd0a-46c5-9a66-03aea78705d3')].{name:name, scope:scope, mode:enforcementMode, effect:parameters.effect.value, overrides:length(not_null(overrides, '')), selectors:length(not_null(resourceSelectors, ''))}" -o table
      ```
    - Expect: one row with `effect` = `Deny`, `mode` = `Default`, `overrides` = `0` and `selectors` = `0`. An override replaces the effect and a resource selector narrows the evaluation to a few resources while the row still reads `Deny`. Without it, or with `mode` = `DoNotEnforce`, every new resource is reachable from the whole internet until someone remembers the Networking blade.
    - Fix:
      ```bash
      az policy assignment create --name aoai-deny-public-network \
        --display-name "Azure AI Services resources should restrict network access" \
        --policy 037eea7a-bd0a-46c5-9a66-03aea78705d3 --scope "/subscriptions/$SUB" \
        --params '{"effect": {"value": "Deny"}}'
      ```

- [ ] **Audit Resources Without a Private Endpoint Through Azure Policy** - pass: policy `d6759c02-b87f-42b7-892e-71b3f471d782` is assigned with `effect` = `Audit` and no `overrides` or `resourceSelectors`, and its compliance list is empty
  - **Console**:
    - Verify: Azure portal > Policy > Assignments > the assignment of `Azure AI Services resources should use Azure Private Link` > ellipsis (...) > Edit assignment > Basics > expand Resource Selectors and Overrides, both empty > Parameters > clear `Only show parameters that need input or review` > Effect `Audit`; close without saving; then Azure portal > Policy > Compliance > the assignment shows Compliance state `Compliant` with no non-compliant resources
    - Fix: Azure portal > Policy > Authoring > Definitions > search `Azure AI Services resources should use Azure Private Link` > Assign > Basics > Scope > the subscription > Parameters > clear `Only show parameters that need input or review` > Effect `Audit` > Review + create > Create; then add a private endpoint to each non-compliant resource
  - **CLI**:
    - Verify:
      ```bash
      az policy assignment list --disable-scope-strict-match \
        --query "[?ends_with(policyDefinitionId, '/d6759c02-b87f-42b7-892e-71b3f471d782')].{name:name, scope:scope, effect:parameters.effect.value, overrides:length(not_null(overrides, '')), selectors:length(not_null(resourceSelectors, ''))}" -o table
      ```
    - Verify:
      ```bash
      az policy state list --filter "PolicyDefinitionId eq '/providers/Microsoft.Authorization/policyDefinitions/d6759c02-b87f-42b7-892e-71b3f471d782' and ComplianceState eq 'NonCompliant'" \
        --query "[].resourceId" -o tsv
      ```
    - Expect: one assignment row with `effect` = `Audit`, `overrides` = `0` and `selectors` = `0`, and an empty second list. An override replaces the effect and a resource selector narrows the evaluation, and either empties the second list without a single private endpoint. Every id in the second list is an Azure AI Services or AI Search resource with no approved private endpoint, reachable only over its public endpoint.
    - Fix:
      ```bash
      az policy assignment create --name aoai-audit-private-link \
        --display-name "Azure AI Services resources should use Azure Private Link" \
        --policy d6759c02-b87f-42b7-892e-71b3f471d782 --scope "/subscriptions/$SUB" \
        --params '{"effect": {"value": "Audit"}}'
      ```

- [ ] **Audit or Deny Resources Without Customer-Managed Keys Through Azure Policy** - pass: policy `67121cc7-ff39-4ab8-b7e3-95b84dab487d` is assigned with `effect` `Audit` or `Deny` and an `excludedKinds` value that does not contain `AIServices` or `OpenAI`, and no `overrides` or `resourceSelectors`
  - **Console**:
    - Verify: Azure portal > Policy > Assignments > the assignment of `Azure AI Services resources should encrypt data at rest with a customer-managed key (CMK)` > ellipsis (...) > Edit assignment > Basics > expand Resource Selectors and Overrides, both empty > Parameters > clear `Only show parameters that need input or review` > Effect `Audit` or `Deny` and Excluded Kinds without `AIServices` or `OpenAI`; close without saving
    - Fix: Azure portal > Policy > Authoring > Definitions > search `Azure AI Services resources should encrypt data at rest with a customer-managed key (CMK)` > Assign > Basics > Scope > the subscription > Parameters > clear `Only show parameters that need input or review` > Effect `Audit` > Excluded Kinds > remove `AIServices` from the list > Review + create > Create
  - **CLI**:
    - Verify:
      ```bash
      az policy assignment list --disable-scope-strict-match \
        --query "[?ends_with(policyDefinitionId, '/67121cc7-ff39-4ab8-b7e3-95b84dab487d')].{name:name, effect:parameters.effect.value, excluded:parameters.excludedKinds.value, overrides:length(not_null(overrides, '')), selectors:length(not_null(resourceSelectors, ''))}" -o json
      ```
    - Expect: one row whose `effect` is `Audit` or `Deny`, whose `excluded` list does not contain `AIServices` or `OpenAI`, with `overrides` = `0` and `selectors` = `0`. An override replaces the effect and a resource selector narrows the evaluation while the row still reads its effect. A missing `excluded` value means the definition default applies and every Foundry resource is skipped.
    - Fix:
      ```bash
      az policy assignment create --name aoai-cmk \
        --display-name "Azure AI Services resources should encrypt data at rest with a customer-managed key" \
        --policy 67121cc7-ff39-4ab8-b7e3-95b84dab487d --scope "/subscriptions/$SUB" \
        --params '{"effect": {"value": "Audit"}, "excludedKinds": {"value": ["ContentSafety", "ImmersiveReader", "HealthInsights", "LUIS.Authoring", "LUIS", "QnAMaker", "QnAMaker.V2", "MetricsAdvisor", "SpeechTranslation", "Internal.AllInOne", "ConversationalLanguageUnderstanding", "knowledge", "TranscriptionIntelligence", "HealthDecisionSupport"]}}'
      ```

- [ ] **Deploy Diagnostic Settings to Every Resource Through Azure Policy** - pass: policy `55d1f543-d1b0-4811-9663-d6d0dbc6326d` is assigned with `effect` = `DeployIfNotExists`, `enforcementMode` = `Default`, `categoryGroup` = `allLogs`, `resourceLocationList` = `*`, no `overrides` or `resourceSelectors`, a managed identity and a remediation task
  - **Console**:
    - Verify: Azure portal > Policy > Assignments > the assignment of `Enable logging by category group for Cognitive Services (microsoft.cognitiveservices/accounts) to Log Analytics` > ellipsis (...) > Edit assignment > Basics > Policy enforcement `Enabled`, expand Resource Selectors and Overrides, both empty > Parameters > clear `Only show parameters that need input or review` > Effect `DeployIfNotExists`, Category Group `allLogs` and Resource Location List `*` > Remediation > Types of Managed Identity set; close without saving; then Azure portal > Policy > Compliance > the assignment shows Compliance state `Compliant`; Azure portal > Policy > Remediation > Remediation tasks lists a completed task for it
    - Fix: Azure portal > Policy > Authoring > Definitions > search `Enable logging by category group for Cognitive Services (microsoft.cognitiveservices/accounts) to Log Analytics` > Assign > Basics > Scope > the subscription > Parameters > clear `Only show parameters that need input or review` > Effect `DeployIfNotExists` > Category Group `allLogs` > Log Analytics Workspace > pick the logging workspace > Remediation > check `Create a remediation task` > System assigned managed identity > Review + create > Create
  - **CLI**:
    - Verify:
      ```bash
      az policy assignment list --disable-scope-strict-match \
        --query "[?ends_with(policyDefinitionId, '/55d1f543-d1b0-4811-9663-d6d0dbc6326d')].{name:name, id:id, mode:enforcementMode, effect:parameters.effect.value, group:parameters.categoryGroup.value, identity:identity.type, locations:parameters.resourceLocationList.value, overrides:length(not_null(overrides, '')), selectors:length(not_null(resourceSelectors, ''))}" -o json
      ```
    - Verify:
      ```bash
      az policy remediation list --query "[].{assignment:policyAssignmentId, state:provisioningState}" -o table
      ```
    - Expect: one assignment with `mode` = `Default`, `overrides` = `0`, `selectors` = `0`, `effect` = `DeployIfNotExists` (`null` means the definition default, `DeployIfNotExists`), `group` = `allLogs`, `locations` = `null` or `["*"]` and `identity` = `SystemAssigned` or `UserAssigned`, plus a remediation whose `assignment` is that assignment's `id` (compare case-insensitively; the two may be printed in different cases) in state `Succeeded`. Without the remediation task the policy only covers resources created after it, with `mode` = `DoNotEnforce` it covers none of them, and an override or a resource selector switches it off or narrows it while the row still reads `DeployIfNotExists`. A `locations` list that names regions covers only those regions.
    - Fix:
      ```bash
      az policy assignment create --name aoai-diag-logs \
        --display-name "Enable logging by category group for Cognitive Services to Log Analytics" \
        --policy 55d1f543-d1b0-4811-9663-d6d0dbc6326d --scope "/subscriptions/$SUB" \
        --mi-system-assigned --location <region> --identity-scope "/subscriptions/$SUB" --role "Log Analytics Contributor" \
        --params '{"effect": {"value": "DeployIfNotExists"}, "categoryGroup": {"value": "allLogs"}, "logAnalytics": {"value": "<workspace-resource-id>"}}'
      ```
    - Fix:
      ```bash
      az policy remediation create --name aoai-diag-logs --policy-assignment aoai-diag-logs \
        --resource-discovery-mode ReEvaluateCompliance
      ```

- [ ] **Deny Deployments of Unapproved Models Through Azure Policy** - pass: policy `aafe3651-cb78-4f68-9f81-e7e41509110f` is assigned with `effect` = `Deny`, `enforcementMode` = `Default`, no `overrides` or `resourceSelectors`, `allowedPublishers` naming only publishers whose every model is approved (empty for model-by-model approval) and `allowedAssetIds` listing only approved models, every asset id written in full from `azureml://registries/` and ending in `/` or `/versions/<n>`
  - **Console**:
    - Verify: Azure portal > Policy > Assignments > the assignment of `Foundry model deployments should only use approved models` > ellipsis (...) > Edit assignment > Basics > Policy enforcement `Enabled`, expand Resource Selectors and Overrides, both empty > Parameters > clear `Only show parameters that need input or review` > Effect `Deny`, Allowed Model Publishers holds only publishers whose every model you approve (or nothing), and Allowed Asset Ids lists only your approved models, each asset id written in full from `azureml://registries/` and ending in `/` or `/versions/<n>`; close without saving
    - Fix: Azure portal > Policy > Authoring > Definitions > search `Foundry model deployments should only use approved models` > Assign > Basics > Scope > the subscription > Parameters > clear `Only show parameters that need input or review` > Effect `Deny` > Allowed Model Publishers > only publishers whose every model you approve, or leave it empty > Allowed Asset Ids > the approved model ids, each in full from `azureml://registries/` (a trailing `/` limits the match to one model) > Review + create > Create
  - **CLI**:
    - Verify:
      ```bash
      az policy assignment list --disable-scope-strict-match \
        --query "[?ends_with(policyDefinitionId, '/aafe3651-cb78-4f68-9f81-e7e41509110f')].{name:name, mode:enforcementMode, effect:parameters.effect.value, publishers:parameters.allowedPublishers.value, assets:parameters.allowedAssetIds.value, overrides:length(not_null(overrides, '')), selectors:length(not_null(resourceSelectors, ''))}" -o json
      ```
    - Expect: one row with `effect` = `Deny`, `mode` = `Default`, `overrides` = `0`, `selectors` = `0`, non-empty `publishers` or `assets`, `publishers` naming only publishers whose every model you approve, and `assets` naming only models you approve, each asset id written in full from `azureml://registries/` and ending in `/` or `/versions/<n>` (the rule allows a deployment whose publisher is listed or whose `model.assetId` contains a listed id, so a listed publisher allows all of its models whatever `assets` says; `.../models/gpt-5` also allows `gpt-5.2` and `gpt-5.4`, `/versions/1` also allows `/versions/10`, and an id that does not start with `azureml://registries/<registry>/` matches that name in every registry). An override replaces the effect and a resource selector narrows the evaluation to a few resources while the row still reads `Deny`. No row, or `mode` = `DoNotEnforce`, means any model in the catalogue, from any publisher, can be deployed by anyone with deployment rights.
    - Fix:
      ```bash
      az policy assignment create --name aoai-approved-models \
        --display-name "Foundry model deployments should only use approved models" \
        --policy aafe3651-cb78-4f68-9f81-e7e41509110f --scope "/subscriptions/$SUB" \
        --params '{"effect": {"value": "Deny"}, "allowedPublishers": {"value": []}, "allowedAssetIds": {"value": ["azureml://registries/<registry>/models/<model>/"]}}'
      ```

- [ ] **Deny Preview and Non-Azure-Direct Model Deployments in Production Through Azure Policy** - pass: policy `8791d062-ba96-4c34-b604-8538f7e30ca0` is assigned on production scopes with `effect` = `Deny`, `enforcementMode` = `Default`, no `overrides` or `resourceSelectors`, `denyPreviewModels` = `true` and `onlyAllowDirectFromAzure` = `true`
  - **Console**:
    - Verify: Azure portal > Policy > Assignments > the assignment of `[Preview]: Foundry model deployments should meet eligibility requirements` > ellipsis (...) > Edit assignment > Basics > Policy enforcement `Enabled`, expand Resource Selectors and Overrides, both empty > Parameters > clear `Only show parameters that need input or review` > Effect `Deny`, Deny Preview Models `true` and Only Allow Direct From Azure `true`; close without saving
    - Fix: Azure portal > Policy > Authoring > Definitions > search `Foundry model deployments should meet eligibility requirements` > Assign > Basics > Scope > the production subscription > Parameters > clear `Only show parameters that need input or review` > Effect `Deny` > Deny Preview Models `true` > Only Allow Direct From Azure `true` > Review + create > Create
  - **CLI**:
    - Verify:
      ```bash
      az policy assignment list --disable-scope-strict-match \
        --query "[?ends_with(policyDefinitionId, '/8791d062-ba96-4c34-b604-8538f7e30ca0')].{name:name, mode:enforcementMode, effect:parameters.effect.value, denyPreview:parameters.denyPreviewModels.value, azureOnly:parameters.onlyAllowDirectFromAzure.value, overrides:length(not_null(overrides, '')), selectors:length(not_null(resourceSelectors, ''))}" -o table
      ```
    - Expect: one row with `effect` = `Deny`, `mode` = `Default`, `overrides` = `0`, `selectors` = `0`, `denyPreview` = `True` and `azureOnly` = `True` on production scopes. An override replaces the effect and a resource selector narrows the evaluation to a few resources while the row still reads `Deny`. Without it, or with `mode` = `DoNotEnforce`, a preview model with different data-handling terms can back a production endpoint.
    - Fix:
      ```bash
      az policy assignment create --name aoai-model-eligibility \
        --display-name "Foundry model deployments should meet eligibility requirements" \
        --policy 8791d062-ba96-4c34-b604-8538f7e30ca0 --scope "/subscriptions/$SUB" \
        --params '{"effect": {"value": "Deny"}, "denyPreviewModels": {"value": true}, "onlyAllowDirectFromAzure": {"value": true}}'
      ```

- [ ] **Audit Deployments Whose Guardrail Uses the Asynchronous Filter Through Azure Policy** - pass: policy `c1ad46c6-37f8-4af0-9c71-c208375c87dd` is assigned with `effect` = `Audit`, `raiPolicyMode` = `["Default"]` and no `overrides` or `resourceSelectors`, and its compliance list is empty
  - **Console**:
    - Verify: Azure portal > Policy > Assignments > the assignment of `[Preview]: Cognitive Services Deployments Should Only Use Allowed Control Mode` > ellipsis (...) > Edit assignment > Basics > expand Resource Selectors and Overrides, both empty > Parameters > clear `Only show parameters that need input or review` > Effect `Audit` and Streaming Mode lists only `Default`; close without saving; then Azure portal > Policy > Compliance > the assignment shows Compliance state `Compliant`
    - Fix: Azure portal > Policy > Authoring > Definitions > search `Cognitive Services Deployments Should Only Use Allowed Control Mode` > Assign > Basics > Scope > the subscription > Parameters > clear `Only show parameters that need input or review` > Effect `Audit` > Streaming Mode > keep only `Default` > Review + create > Create
  - **CLI**:
    - Verify:
      ```bash
      az policy assignment list --disable-scope-strict-match \
        --query "[?ends_with(policyDefinitionId, '/c1ad46c6-37f8-4af0-9c71-c208375c87dd')].{name:name, effect:parameters.effect.value, modes:parameters.raiPolicyMode.value, overrides:length(not_null(overrides, '')), selectors:length(not_null(resourceSelectors, ''))}" -o json
      ```
    - Verify:
      ```bash
      az policy state list --filter "PolicyDefinitionId eq '/providers/Microsoft.Authorization/policyDefinitions/c1ad46c6-37f8-4af0-9c71-c208375c87dd' and ComplianceState eq 'NonCompliant'" \
        --query "[].resourceId" -o tsv
      ```
    - Expect: one row with `effect` = `Audit` (`null` means the definition default, `Audit`), `modes` = `["Default"]`, `overrides` = `0` and `selectors` = `0`, and an empty second list. An override replaces the effect and a resource selector narrows the evaluation, and either empties the second list while a deployment still streams before it filters. A missing row, `effect` = `Disabled` or a list that still contains `Asynchronous_filter` audits nothing, and every resource id in the second list is a deployment whose guardrail streams before it filters.
    - Fix:
      ```bash
      az policy assignment create --name aoai-guardrail-mode \
        --display-name "Cognitive Services Deployments Should Only Use Allowed Control Mode" \
        --policy c1ad46c6-37f8-4af0-9c71-c208375c87dd --scope "/subscriptions/$SUB" \
        --params '{"effect": {"value": "Audit"}, "raiPolicyMode": {"value": ["Default"]}}'
      ```

- [ ] **Audit Deployments Without Blocking Prompt Shields Through Azure Policy** - pass: policy `f3a9c2e0-7b4d-4d8f-9c3a-2e1f6b9a8d4e` is assigned once with `filterName` = `Indirect Attack` and once with `filterName` = `Jailbreak`, both with `effect` = `Audit`, no `overrides` or `resourceSelectors` and requiring `enabled` and `blocking` = `true`, with empty compliance lists
  - **Console**:
    - Verify: Azure portal > Policy > Assignments > `Deployments must block indirect prompt attacks` and `Deployments must block user prompt attacks` > on each, ellipsis (...) > Edit assignment > Basics > expand Resource Selectors and Overrides, both empty > Parameters > clear `Only show parameters that need input or review` > Effect `Audit`, Content Filter `Indirect Attack` or `Jailbreak`, Allowed Enabled Configuration for Prompt `true` and Allowed Blocking Configuration for Prompt `true`; close without saving; then Azure portal > Policy > Compliance > both assignments show Compliance state `Compliant`
    - Fix: Azure portal > Policy > Authoring > Definitions > search `Cognitive Services Deployments should only use allowed prompt content filtering` > Assign > Basics > Scope > the subscription > Assignment name `Deployments must block indirect prompt attacks` > Parameters > clear `Only show parameters that need input or review` > Effect `Audit` > Content Filter `Indirect Attack` > Allowed Enabled Configuration for Prompt `true` > Allowed Blocking Configuration for Prompt `true` > Review + create > Create; repeat with Assignment name `Deployments must block user prompt attacks` and Content Filter `Jailbreak`
  - **CLI**:
    - Verify:
      ```bash
      az policy assignment list --disable-scope-strict-match \
        --query "[?ends_with(policyDefinitionId, '/f3a9c2e0-7b4d-4d8f-9c3a-2e1f6b9a8d4e')].{name:name, effect:parameters.effect.value, filter:parameters.filterName.value, enabled:parameters.allowedEnabledForPrompt.value, blocking:parameters.allowedBlockingForPrompt.value, overrides:length(not_null(overrides, '')), selectors:length(not_null(resourceSelectors, ''))}" -o json
      ```
    - Verify:
      ```bash
      az policy state list --filter "PolicyDefinitionId eq '/providers/Microsoft.Authorization/policyDefinitions/f3a9c2e0-7b4d-4d8f-9c3a-2e1f6b9a8d4e' and ComplianceState eq 'NonCompliant'" \
        --query "[].resourceId" -o tsv
      ```
    - Expect: two rows, `filter` = `Indirect Attack` and `filter` = `Jailbreak`, each with `effect` = `Audit` (`null` means the definition default, `Audit`), `enabled` = `["true"]`, `blocking` = `["true"]`, `overrides` = `0` and `selectors` = `0`, and an empty second list. An override replaces the effect and a resource selector narrows the evaluation, and either empties the second list while a guardrail still leaves that shield off. A missing row or `effect` = `Disabled` means a guardrail that switched that shield to annotate-only is found only by reading its JSON, and every resource id in the second list is a deployment whose guardrail does not enable and block that shield on the prompt.
    - Fix:
      ```bash
      az policy assignment create --name aoai-prompt-shield-indirect \
        --display-name "Deployments must block indirect prompt attacks" \
        --policy f3a9c2e0-7b4d-4d8f-9c3a-2e1f6b9a8d4e --scope "/subscriptions/$SUB" \
        --params '{"effect": {"value": "Audit"}, "filterName": {"value": "Indirect Attack"}, "allowedEnabledForPrompt": {"value": ["true"]}, "allowedBlockingForPrompt": {"value": ["true"]}}'
      ```
    - Fix:
      ```bash
      az policy assignment create --name aoai-prompt-shield-jailbreak \
        --display-name "Deployments must block user prompt attacks" \
        --policy f3a9c2e0-7b4d-4d8f-9c3a-2e1f6b9a8d4e --scope "/subscriptions/$SUB" \
        --params '{"effect": {"value": "Audit"}, "filterName": {"value": "Jailbreak"}, "allowedEnabledForPrompt": {"value": ["true"]}, "allowedBlockingForPrompt": {"value": ["true"]}}'
      ```

- [ ] **Deny Global Deployment Types on Residency-Bound Subscriptions Through a Custom Policy** - pass: a custom policy definition denies `Microsoft.CognitiveServices/accounts/deployments` with `sku.name` = `GlobalStandard` (and the other Global and Developer types) and is assigned on every residency-bound scope with `enforcementMode` = `Default` and no `overrides` or `resourceSelectors`
  - **Console**:
    - Verify: Azure portal > Policy > Authoring > Definitions > filter Type to `Custom` > `Deny global model deployments` > its rule lists `GlobalStandard`, `GlobalProvisionedManaged`, `GlobalBatch` and `DeveloperTier` with effect `Deny`; then Azure portal > Policy > Assignments > its assignment on the residency-bound subscription > ellipsis (...) > Edit assignment > Basics > Policy enforcement `Enabled`, expand Resource Selectors and Overrides, both empty; close without saving
    - Fix: Azure portal > Policy > Authoring > Definitions > + Policy definition > Definition location > the subscription > Name `Deny global model deployments` > Policy rule > paste a rule with "mode": "All" and a "policyRule" whose "if" requires "type" equals `Microsoft.CognitiveServices/accounts/deployments` and `Microsoft.CognitiveServices/accounts/deployments/sku.name` in `GlobalStandard`, `GlobalProvisionedManaged`, `GlobalBatch`, `DeveloperTier`, and whose "then" sets "effect": "Deny" > Save; then select the definition > Assign > Basics > Scope > the subscription > Review + create > Create
  - **CLI**:
    - Verify:
      ```bash
      az policy definition show --name deny-global-model-deployments \
        --query "{defMode:mode, skus:policyRule.if.allOf[1].in, effect:policyRule.then.effect}" -o json
      ```
    - Verify:
      ```bash
      az policy assignment list --disable-scope-strict-match \
        --query "[?ends_with(policyDefinitionId, '/deny-global-model-deployments')].{name:name, scope:scope, mode:enforcementMode, overrides:length(not_null(overrides, '')), selectors:length(not_null(resourceSelectors, ''))}" -o table
      ```
    - Expect: the first command returns `defMode` = `All`, `skus` listing `GlobalStandard`, `GlobalProvisionedManaged`, `GlobalBatch` and `DeveloperTier`, and `effect` = `Deny`; the second returns one row on every residency-bound subscription with `mode` = `Default`, `overrides` = `0` and `selectors` = `0`. An override replaces the effect and a resource selector narrows the evaluation to a few resources while the definition still reads `Deny`. Without both, a new deployment can use a Global or Developer type and process prompts in any Azure region.
    - Fix:
      ```bash
      az policy definition create --name deny-global-model-deployments \
        --display-name "Deny global model deployments" --mode All \
        --rules '{
          "if": {
            "allOf": [
              {"field": "type", "equals": "Microsoft.CognitiveServices/accounts/deployments"},
              {"field": "Microsoft.CognitiveServices/accounts/deployments/sku.name", "in": ["GlobalStandard", "GlobalProvisionedManaged", "GlobalBatch", "DeveloperTier"]}
            ]
          },
          "then": {"effect": "Deny"}
        }'
      ```
    - Fix:
      ```bash
      az policy assignment create --name aoai-deny-global-deployments \
        --display-name "Deny global model deployments" \
        --policy deny-global-model-deployments --scope "/subscriptions/$SUB"
      ```

---

## Foundry Resource & Project Hygiene

- [ ] **Use Entra ID or Managed Identity Authentication on Project Connections** - pass: every connection on the resource and its projects has an identity-based `authType` (`AAD`, `ManagedIdentity`, `ProjectManagedIdentity`, `AccountManagedIdentity`, `UserEntraToken` or `AgenticIdentityToken`) or `None`
  - **Console**:
    - Verify: Foundry portal > Manage > Project details > Connected resources tab > each connection's Authentication reads Microsoft Entra ID (or managed identity), not API key; repeat in each project of the resource and on Manage > Resource details > Connected resources tab and Admin-connected models tab
    - Fix: Foundry portal > Manage > Project details > Connected resources tab > Add connection > select the service > Authentication > `Microsoft Entra ID` > Add connection, then delete the keyed connection from the tab that lists it (Project details or Resource details > Connected resources, or Resource details > Admin-connected models); a keyed API Management model connection is re-added on Resource details > Admin-connected models tab > Add > Connection Type Azure API Management > Authentication > Managed Identity > Add, while an Other source connection offers only API key or OAuth 2.0 and stays keyed
  - **CLI**:
    - Verify:
      ```bash
      az rest --method GET --uri "https://management.azure.com$RES/connections?api-version=$AOAI_API" \
        --query "value[?properties.authType!='AAD' && properties.authType!='ManagedIdentity' && properties.authType!='ProjectManagedIdentity' && properties.authType!='AccountManagedIdentity' && properties.authType!='UserEntraToken' && properties.authType!='AgenticIdentityToken' && properties.authType!='None'].{name:name, category:properties.category, auth:properties.authType, target:properties.target}" -o table
      ```
    - Verify:
      ```bash
      for p in $(az rest --method GET --uri "https://management.azure.com$RES/projects?api-version=$AOAI_API" --query "value[].id" -o tsv); do
        az rest --method GET --uri "https://management.azure.com$p/connections?api-version=$AOAI_API" \
          --query "value[?properties.authType!='AAD' && properties.authType!='ManagedIdentity' && properties.authType!='ProjectManagedIdentity' && properties.authType!='AccountManagedIdentity' && properties.authType!='UserEntraToken' && properties.authType!='AgenticIdentityToken' && properties.authType!='None'].{connection:id, category:properties.category, auth:properties.authType, target:properties.target}" -o table
      done
      ```
    - Expect: no rows from either command; a row from the loop prints the connection id, which names the project and the connection the third Fix deletes. Every row is a stored credential that any project member can use through the platform and that the connection's `listsecrets` action reads back in clear.
    - Fix:
      ```bash
      az rest --method PUT --uri "https://management.azure.com$RES/connections/<connection>?api-version=$AOAI_API" \
        --body '{"properties": {"authType": "AAD", "category": "<category>", "target": "<target-endpoint>"}}'
      ```
    - Fix:
      ```bash
      az rest --method DELETE --uri "https://management.azure.com$RES/connections/<keyed-connection>?api-version=$AOAI_API"
      ```
    - Fix:
      ```bash
      az rest --method DELETE --uri "https://management.azure.com$RES/projects/<project>/connections/<keyed-connection>?api-version=$AOAI_API"
      ```

- [ ] **Hide Preview Features on Production Resources with the Suppression Tag** - pass: tag `AZML_DISABLE_PREVIEW_FEATURE` = `true` is present on the resource or on its resource group or subscription
  - **Console**:
    - Verify: Azure portal > Azure OpenAI > <resource> > Tags > a tag with Key `AZML_DISABLE_PREVIEW_FEATURE` and Value `true` is listed (or the same tag on the resource group or subscription)
    - Fix: Azure portal > Azure OpenAI > <resource> > Tags > Key `AZML_DISABLE_PREVIEW_FEATURE` > Value `true` > Apply
  - **CLI**:
    - Verify: `az tag list --resource-id $RES --query "properties.tags.AZML_DISABLE_PREVIEW_FEATURE" -o tsv`
    - Verify:
      ```bash
      az tag list --resource-id /subscriptions/$SUB --query "properties.tags.AZML_DISABLE_PREVIEW_FEATURE" -o tsv
      ```
    - Verify:
      ```bash
      az tag list --resource-id "/subscriptions/$SUB/resourceGroups/<rg>" --query "properties.tags.AZML_DISABLE_PREVIEW_FEATURE" -o tsv
      ```
    - Expect: `true` from at least one of the three commands (the value is case-sensitive). Empty output means preview models and tools are one click away for every developer, under preview terms.
    - Fix: `az tag update --resource-id $RES --operation merge --tags AZML_DISABLE_PREVIEW_FEATURE=true`

- [ ] **Add a Delete Lock to Production Resources** - pass: `az lock list` on the resource returns a lock with `level` = `CanNotDelete`
  - **Console**:
    - Verify: Azure portal > Azure OpenAI > <resource> > Settings > Locks > a lock with Lock type `Delete` is listed (own or inherited)
    - Fix: Azure portal > Azure OpenAI > <resource> > Settings > Locks > Add > Lock name > Lock type `Delete` > OK
  - **CLI**:
    - Verify: `az lock list --resource $RES --query "[?level=='CanNotDelete'].{name:name, level:level}" -o table`
    - Expect: at least one row. No row means one `az cognitiveservices account delete` from any Contributor removes every deployment, model and stored prompt on the resource.
    - Fix: `az lock create --name aoai-no-delete --lock-type CanNotDelete --resource $RES`

- [ ] **Purge Soft-Deleted Resources After Decommissioning (keys and data stay recoverable for 48 hours)** - pass: `az cognitiveservices account list-deleted` returns no resource that held sensitive data or provisioned deployments
  - **Console**:
    - Verify: Azure portal > Azure OpenAI > Manage deleted resources > select the subscription > the list holds no decommissioned resource that held sensitive data or provisioned deployments
    - Fix: Azure portal > Azure OpenAI > Manage deleted resources > select the subscription > select the resource > Purge
  - **CLI**:
    - Verify:
      ```bash
      az cognitiveservices account list-deleted --query "[].{name:name, location:location, purgeOn:properties.scheduledPurgeDate}" -o table
      ```
    - Expect: no rows for decommissioned resources that held sensitive data. A listed resource can be recovered with its keys and stored data until `purgeOn`.
    - Fix: `az cognitiveservices account purge -g <rg> -n <resource> -l <location>`

- [ ] **Send AI Interactions to Microsoft Purview from Every Production Subscription** - pass: `Powered by Microsoft Purview` reads `On` for every subscription that hosts a production resource and is not on your network-isolation exception list
  - **Console**:
    - Verify: Foundry portal > Operate > Compliance > Data security and governance > subscription dropdown > select the subscription > the `Powered by Microsoft Purview` toggle reads `On`
    - Fix: Foundry portal > Operate > Compliance > Data security and governance > subscription dropdown > select the subscription > turn on `Powered by Microsoft Purview`; repeat for every other subscription that hosts a production resource
