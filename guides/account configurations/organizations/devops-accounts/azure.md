<!--
id: azure-cloud-security
type: CONFIGURATION
scope: ORGANIZATION
-->

<div align="center">
  <img src="../../../../images/guides/azure.svg" alt="Azure Logo" width="64" height="64">
  <h2><a href="https://azure.microsoft.com/" target="_blank" rel="noopener noreferrer">Azure</a> Security Configuration Guide</h2>
  <p><em>Identity, Network, Data, and Detection controls for Microsoft Azure accounts</em></p>
</div>

---

## Identity (Entra ID / Active Directory)

- [ ] **Enable Multi-Factor Authentication for Privileged Users** — `az ad user list \`
- [ ] **Enable Multi-Factor Authentication for Non-Privileged Users** — `az ad user list \`
- [ ] **Enable Security Defaults** — `az login`
- [ ] **Require Multi-Factor Auth To Join Devices** — `az rest --method GET --uri "https://graph.microsoft.com/v1.0/policies/deviceRegistrationPolicy"`
- [ ] **Restrict Access To Microsoft Entra ID Administration Portal** — `az rest --method GET --uri "https://graph.microsoft.com/v1.0/policies/authorizationPolicy" --query defaultUserRolePermissions`
- [ ] **Guests Can Invite** — `az rest --method GET --uri "https://graph.microsoft.com/v1.0/policies/authorizationPolicy" --query allowInvitesFrom`
- [ ] **Members Can Invite** — `az rest --method GET --uri "https://graph.microsoft.com/v1.0/policies/authorizationPolicy" --query allowInvitesFrom`
- [ ] **Check for Microsoft Entra ID Guest Users** — `az ad user list`
- [ ] **Disable Tenant Creation for Non-Admin Users** — `az rest --method GET --uri "https://graph.microsoft.com/v1.0/policies/authorizationPolicy" --query defaultUserRolePermissions.allowedToCreateTenants`
- [ ] **Users Can Register Applications** — `az rest --method GET --uri "https://graph.microsoft.com/v1.0/policies/authorizationPolicy" --query defaultUserRolePermissions.allowedToCreateApps`
- [ ] **Users Can Consent To Apps Accessing Company Data On Their Behalf** — `az rest --method GET --uri "https://graph.microsoft.com/v1.0/policies/authorizationPolicy"`
- [ ] **Multi-factor Authentication On Devices** — `az rest --method GET --uri "https://graph.microsoft.com/v1.0/policies/authenticationMethodsPolicy"`

---

## Virtual Machines

- [ ] **Disable Public Network Access to Virtual Machine Disks** — `az account list`
- [ ] **Disable Public IP Address Assignment for VMSS Instances** — `az account list`
- [ ] **Check for SSH Authentication Type** — `az vm list --query '[*].[name,osProfile.linuxConfiguration.disablePasswordAuthentication]'`
- [ ] **Enable Just-In-Time Access for Virtual Machines** — `az vm list`
- [ ] **Enable System-Assigned Managed Identities** — `az vm list`
- [ ] **Enable Virtual Machine Access using Microsoft Entra ID Authentication** — `az vm list`
- [ ] **Install Approved Extensions Only** — `az vm list`

---

## Key Vault

- [ ] **Restrict Default Network Access for Azure Key Vaults** — `az keyvault list`
- [ ] **Use Private Endpoints for Key Vaults** — `az account list`
- [ ] **Enable Role-Based Access Control (RBAC) Authorization** — `az account list`
- [ ] **Check for Key Vault Full Administrator Permissions** — `az keyvault list`
- [ ] **Ensure Purge Protection is Enabled for Key Vaults** — `az account list \`
- [ ] **Enable Key Vault Recoverability** — `az keyvault list`
- [ ] **Azure Key Vault Cross-Subscription Access** — `az account list`

---

## Kubernetes (AKS)

- [ ] **Disable Public FQDN for Private AKS Clusters** — `az account list`
- [ ] **Enable Kubernetes Role-Based Access Control** — `az aks list`
- [ ] **Enable Azure Role-Based Access Control (RBAC) for Kubernetes Authorization** — `az account list`
- [ ] **Use Microsoft Entra ID Integration with Kubernetes RBAC** — `az account list`
- [ ] **Enable Support for Network Policies** — `aws eks list-clusters`
- [ ] **Kubernetes Clusters with Private Nodes** — `az account list`
- [ ] **Private Kubernetes Clusters** — `az account list`
- [ ] **Secure Access to Kubernetes API Server Using Authorized IP Address Ranges** — `az aks list`
- [ ] **Use Private Key Vaults for Encryption at Rest in Azure Kubernetes Service** — `az aks list`

---

## Monitoring & Activity Logs

- [ ] **Activity Log All Activities** — `az monitor log-profiles list`
- [ ] **Check for Publicly Accessible Activity Log Storage Container** — `az monitor diagnostic-settings subscription list`
- [ ] **Enable Subscription Activity Log Diagnostic Settings** — `az account list to list your available subscriptions and retrieve the chosen subscription id`

---

## App Service

- [ ] **Enable HTTPS-Only Traffic** — `az webapp list`
- [ ] **Disable Plain FTP Deployment** — `az webapp list`
- [ ] **Disable Remote Debugging** — `az webapp list`
- [ ] **Enable App Service Authentication** — `az webapp list`
- [ ] **Use Key Vaults to Store App Service Application Secrets** — `az webapp list --query '[*].[name,resourceGroup]' --output tsv | xargs -I{} sh -c 'az webapp config appsettings list -n $(echo {} | cut -f1) -g $(echo {} | cut -f2) --query "[?contains(value, '@Microsoft.KeyVault')]"'`
