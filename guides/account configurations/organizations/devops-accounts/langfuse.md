<!--
id: langfuse-organization-configuration
type: CONFIGURATION
scope: ORGANIZATION
-->

<div align="center">
  <h2><a href="https://langfuse.com/" target="_blank" rel="noopener noreferrer">Langfuse</a> Configuration Guide</h2>
  <p><em>Access, Sharing, Masking, Retention, AI-Feature and Self-Hosting controls for Langfuse organizations</em></p>
</div>

---

## Organization & Project Settings

- [ ] **Assign Organization Roles at Least Privilege** — `curl -u <org-public-key>:<org-secret-key> -X PUT https://<langfuse-host>/api/public/organizations/memberships -H 'Content-Type: application/json' -d '{"userId":"<user-id>","role":"VIEWER"}'`; verify: `curl -u <org-public-key>:<org-secret-key> https://<langfuse-host>/api/public/organizations/memberships`
- [ ] **Set Single-Project Users to NONE Plus a Project Role (the organization role NONE is set under Organization Settings > Members; the memberships API takes OWNER, ADMIN, MEMBER or VIEWER)** — `curl -u <org-public-key>:<org-secret-key> -X PUT https://<langfuse-host>/api/public/projects/<project-id>/memberships -H 'Content-Type: application/json' -d '{"userId":"<user-id>","role":"MEMBER"}'`; verify: `curl -u <org-public-key>:<org-secret-key> https://<langfuse-host>/api/public/organizations/memberships`
- [ ] **Set a Data Retention Window** — `curl -u <org-public-key>:<org-secret-key> -X PUT https://<langfuse-host>/api/public/projects/<project-id> -H 'Content-Type: application/json' -d '{"name":"<project-name>","retention":30}'`; verify: `curl -u <public-key>:<secret-key> https://<langfuse-host>/api/public/projects`
- [ ] **Review Project API Keys and Rotate Them on a Schedule** — `curl -u <org-public-key>:<org-secret-key> -X POST https://<langfuse-host>/api/public/projects/<project-id>/apiKeys -H 'Content-Type: application/json' -d '{"note":"<service>-<environment>-<date>"}' && curl -u <org-public-key>:<org-secret-key> -X DELETE https://<langfuse-host>/api/public/projects/<project-id>/apiKeys/<old-api-key-id>`; verify: `curl -u <org-public-key>:<org-secret-key> https://<langfuse-host>/api/public/projects/<project-id>/apiKeys`
- [ ] **Revoke Organization-Scoped API Keys Not Used for Provisioning** — `Organization Settings > API Keys > **delete every key that provisioning automation does not hold**`; verify: `curl -u <org-public-key>:<org-secret-key> https://<langfuse-host>/api/public/organizations/apiKeys`
- [ ] **Restrict Stored LLM Connections to Approved Endpoints** — `curl -u <public-key>:<secret-key> -X PUT https://<langfuse-host>/api/public/llm-connections -H 'Content-Type: application/json' -d '{"provider":"<provider-name>","adapter":"openai","secretKey":"<provider-key>","baseURL":"https://<approved-gateway>/v1"}'`; verify: `curl -u <public-key>:<secret-key> https://<langfuse-host>/api/public/llm-connections`
- [ ] **Unshare Public Traces That Are Not Safe to Publish** — `Trace > public > **off**`; verify: `curl -u <public-key>:<secret-key> 'https://<langfuse-host>/api/public/traces?orderBy=public.desc&fields=core&limit=100' | grep -c '"public":true'`
- [ ] **Enforce Enterprise SSO for Your Verified Domain (Cloud)** — `Organization Settings > SSO > Verify Domain > Configure SSO > **Enforced**`; verify: `Organization Settings > SSO shows the domain as **Enforced**`
- [ ] **Review Audit Logs on a Schedule** — `Organization Settings > Audit Logs > **review on a schedule**`
- [ ] **Provision and Deprovision Users Through SCIM (point the IdP's SCIM provisioning at /api/public/scim with an organization key; the delete below is the offboarding step)** — `curl -u <org-public-key>:<org-secret-key> -X DELETE https://<langfuse-host>/api/public/scim/Users/<user-id>`; verify: `curl -u <org-public-key>:<org-secret-key> https://<langfuse-host>/api/public/scim/Users`
- [ ] **Sign Up in the Cloud Data Region Your Residency Policy Allows** — `https://<region-host>/auth/sign-up`; verify: `printenv LANGFUSE_BASE_URL`
- [ ] **Do Not Enable AI Features Until Approved** — `Organization Settings > General > AI Features > Enable AI powered features for your organization > **Off**`
- [ ] **Turn Off AI Data Use for Product Improvement** — `Organization Settings > General > AI Features > AI Data Use for Product/Service Improvement > **Off**`
- [ ] **Protect the Production Prompt Label** — `Project Settings > Protected Prompt Labels > **add production and every label an application resolves**`
- [ ] **Disconnect Any Slack Workspace You Do Not Control** — `Project Settings > Integrations > Slack > **disconnect any workspace you do not control**`
- [ ] **Review and Remove Unnecessary or Unrecognized Integrations** — `curl -u <public-key>:<secret-key> -X DELETE https://<langfuse-host>/api/public/integrations/blob-storage/<integration-id>`; verify: `curl -u <public-key>:<secret-key> https://<langfuse-host>/api/public/integrations/blob-storage`
- [ ] **Send Webhook Credentials in Headers, Never in the URL** — `Prompts > Automations > Webhook > Headers > **Authorization: Bearer <receiver-token>**, nothing in the URL`

---

## Self-Hosted: Application Secrets

- [ ] **Generate a Unique NEXTAUTH_SECRET, SALT and ENCRYPTION_KEY per Environment at Install (rotating SALT breaks every API key; rotating ENCRYPTION_KEY makes stored credentials unreadable)** — `helm install langfuse langfuse/langfuse -n <namespace> --set langfuse.salt.value=$(openssl rand -base64 32) --set langfuse.encryptionKey.value=$(openssl rand -hex 32) --set langfuse.nextauth.secret.value=$(openssl rand -base64 32)`; verify: `kubectl exec deployment/langfuse-web -n <namespace> -- printenv ENCRYPTION_KEY | tr -d '\n' | wc -c`
- [ ] **Remove the Bootstrap Secrets After First Start (the init values are applied once; afterwards they only sit in the environment as live secrets)** — `kubectl set env deployment/langfuse-web deployment/langfuse-worker -n <namespace> LANGFUSE_INIT_USER_PASSWORD- LANGFUSE_INIT_PROJECT_SECRET_KEY- LANGFUSE_INIT_PROJECT_PUBLIC_KEY-`; verify: `kubectl exec deployment/langfuse-web -n <namespace> -- printenv | grep '^LANGFUSE_INIT_'`
- [ ] **Set Data Retention at Provisioning** — `kubectl set env deployment/langfuse-web deployment/langfuse-worker -n <namespace> LANGFUSE_INIT_PROJECT_RETENTION=<days>`; verify: `kubectl exec deployment/langfuse-web -n <namespace> -- printenv LANGFUSE_INIT_PROJECT_RETENTION`

---

## Self-Hosted: Authentication

- [ ] **Disable Open Sign-Up** — `kubectl set env deployment/langfuse-web -n <namespace> AUTH_DISABLE_SIGNUP=true`; verify: `kubectl exec deployment/langfuse-web -n <namespace> -- printenv AUTH_DISABLE_SIGNUP`
- [ ] **Disable Email/Password When SSO Covers Everyone** — `kubectl set env deployment/langfuse-web -n <namespace> AUTH_DISABLE_USERNAME_PASSWORD=true`; verify: `kubectl exec deployment/langfuse-web -n <namespace> -- printenv AUTH_DISABLE_USERNAME_PASSWORD`
- [ ] **Force SSO for Corporate Domains** — `kubectl set env deployment/langfuse-web -n <namespace> AUTH_DOMAINS_WITH_SSO_ENFORCEMENT=<domain>,<domain>`; verify: `kubectl exec deployment/langfuse-web -n <namespace> -- printenv AUTH_DOMAINS_WITH_SSO_ENFORCEMENT`
- [ ] **Require Email Verification Where Password Auth Remains** — `kubectl set env deployment/langfuse-web -n <namespace> AUTH_EMAIL_VERIFICATION_REQUIRED=true`; verify: `kubectl exec deployment/langfuse-web -n <namespace> -- printenv AUTH_EMAIL_VERIFICATION_REQUIRED`
- [ ] **Shorten the Session Lifetime** — `kubectl set env deployment/langfuse-web -n <namespace> AUTH_SESSION_MAX_AGE=<minutes>`; verify: `kubectl exec deployment/langfuse-web -n <namespace> -- printenv AUTH_SESSION_MAX_AGE`
- [ ] **Do Not Enable Account Linking Unless the IdP Verifies Emails** — `kubectl set env deployment/langfuse-web -n <namespace> AUTH_<PROVIDER>_ALLOW_ACCOUNT_LINKING-`; verify: `kubectl exec deployment/langfuse-web -n <namespace> -- printenv | grep '^AUTH_.*_ALLOW_ACCOUNT_LINKING='`
- [ ] **Pin the SSO Issuer** — `kubectl set env deployment/langfuse-web -n <namespace> AUTH_<PROVIDER>_ISSUER=https://<idp-issuer>`; verify: `kubectl exec deployment/langfuse-web -n <namespace> -- printenv | grep '^AUTH_.*_ISSUER='`
- [ ] **Set Explicit OAuth Checks on Every SSO Provider** — `kubectl set env deployment/langfuse-web -n <namespace> AUTH_<PROVIDER>_CHECKS=pkce,state`; verify: `kubectl exec deployment/langfuse-web -n <namespace> -- printenv | grep '^AUTH_.*_CHECKS='`
- [ ] **Limit Google Sign-In to Corporate Domains** — `kubectl set env deployment/langfuse-web -n <namespace> AUTH_GOOGLE_ALLOWED_DOMAINS=<domain>,<domain>`; verify: `kubectl exec deployment/langfuse-web -n <namespace> -- printenv AUTH_GOOGLE_ALLOWED_DOMAINS`
- [ ] **Restrict Who Can Create Organizations** — `kubectl set env deployment/langfuse-web -n <namespace> LANGFUSE_ALLOWED_ORGANIZATION_CREATORS=<owner@domain>,<owner@domain>`; verify: `kubectl exec deployment/langfuse-web -n <namespace> -- printenv LANGFUSE_ALLOWED_ORGANIZATION_CREATORS`
- [ ] **Set the Auto-Provisioned Default Roles to VIEWER** — `kubectl set env deployment/langfuse-web -n <namespace> LANGFUSE_DEFAULT_ORG_ROLE=VIEWER LANGFUSE_DEFAULT_PROJECT_ROLE=VIEWER`; verify: `kubectl exec deployment/langfuse-web -n <namespace> -- printenv | grep '^LANGFUSE_DEFAULT_'`

---

## Self-Hosted: Ingestion Masking

- [ ] **Set a Server-Side Masking Callback** — `kubectl set env deployment/langfuse-web deployment/langfuse-worker -n <namespace> LANGFUSE_INGESTION_MASKING_CALLBACK_URL=https://<masking-service>/mask`; verify: `kubectl exec deployment/langfuse-worker -n <namespace> -- printenv LANGFUSE_INGESTION_MASKING_CALLBACK_URL`
- [ ] **Set Masking to Fail Closed** — `kubectl set env deployment/langfuse-web deployment/langfuse-worker -n <namespace> LANGFUSE_INGESTION_MASKING_CALLBACK_FAIL_CLOSED=true`; verify: `kubectl exec deployment/langfuse-worker -n <namespace> -- printenv LANGFUSE_INGESTION_MASKING_CALLBACK_FAIL_CLOSED`
- [ ] **Close the Legacy Ingestion Endpoint** — `kubectl set env deployment/langfuse-web deployment/langfuse-worker -n <namespace> LANGFUSE_MIGRATION_V4_WRITE_MODE-`; verify: `kubectl exec deployment/langfuse-web -n <namespace> -- printenv | grep '^LANGFUSE_MIGRATION_V4_WRITE_MODE='`

---

## Self-Hosted: Hardening

- [ ] **Enforce HTTPS at the CSP Layer** — `kubectl set env deployment/langfuse-web -n <namespace> LANGFUSE_CSP_ENFORCE_HTTPS=true`; verify: `kubectl exec deployment/langfuse-web -n <namespace> -- printenv LANGFUSE_CSP_ENFORCE_HTTPS`
- [ ] **Turn Off Telemetry (OSS)** — `kubectl set env deployment/langfuse-web deployment/langfuse-worker -n <namespace> TELEMETRY_ENABLED=false`; verify: `kubectl exec deployment/langfuse-web -n <namespace> -- printenv TELEMETRY_ENABLED`
- [ ] **Do Not Set SSRF Allowlists Unless an Internal Target Is Required** — `kubectl set env deployment/langfuse-web deployment/langfuse-worker -n <namespace> $(kubectl exec deployment/langfuse-web -n <namespace> -- printenv | grep -oE '^LANGFUSE_[A-Z_]*WHITELISTED[A-Z_]*' | sed 's/$/-/')`; verify: `kubectl exec deployment/langfuse-web -n <namespace> -- printenv | grep 'WHITELISTED'`
- [ ] **Never Run Code Evaluators In-Process** — `kubectl set env deployment/langfuse-web deployment/langfuse-worker -n <namespace> LANGFUSE_CODE_EVAL_DISPATCHER-`; verify: `kubectl exec deployment/langfuse-web -n <namespace> -- printenv | grep '^LANGFUSE_CODE_EVAL_DISPATCHER='`
- [ ] **Generate a High-Entropy Admin API Key and Do Not Expose the Admin API Publicly** — `kubectl create secret generic langfuse-admin -n <namespace> --from-literal=ADMIN_API_KEY=$(openssl rand -base64 48) && kubectl set env deployment/langfuse-web -n <namespace> --from=secret/langfuse-admin`; verify: `kubectl exec deployment/langfuse-web -n <namespace> -- printenv ADMIN_API_KEY | tr -d '\n' | wc -c`
- [ ] **Sandbox or Disable the Assistant's Code Tools (or set LANGFUSE_IN_APP_AGENT_ENABLED=false)** — `kubectl set env deployment/langfuse-web deployment/langfuse-worker -n <namespace> LANGFUSE_IN_APP_AGENT_SANDBOX_PROVIDER=lambda-microvm LANGFUSE_IN_APP_AGENT_SANDBOX_AWS_LAMBDA_MICROVM_IMAGE_IDENTIFIER=<image-id> LANGFUSE_IN_APP_AGENT_SANDBOX_AWS_LAMBDA_MICROVM_EXECUTION_ROLE_ARN=<execution-role-arn> LANGFUSE_IN_APP_AGENT_SANDBOX_AWS_LAMBDA_MICROVM_REGION=<region> LANGFUSE_IN_APP_AGENT_SANDBOX_AWS_LAMBDA_MICROVM_EGRESS_NETWORK_CONNECTOR_ARN=<egress-connector-arn>`; verify: `kubectl exec deployment/langfuse-web -n <namespace> -- printenv | grep '^LANGFUSE_IN_APP_AGENT_'`
- [ ] **Expose Only the Web Container** — `kubectl patch svc <service-that-is-not-langfuse-web> -n <namespace> -p '{"spec":{"type":"ClusterIP"}}'`; verify: `kubectl get svc -n <namespace>`
- [ ] **Enable Encryption at Rest on Every Store** — `aws s3api put-bucket-encryption --bucket <event-upload-bucket> --server-side-encryption-configuration '{"Rules":[{"ApplyServerSideEncryptionByDefault":{"SSEAlgorithm":"aws:kms","KMSMasterKeyID":"<kms-key-arn>"}}]}'`; verify: `aws s3api get-bucket-encryption --bucket <event-upload-bucket>`
- [ ] **Grant the Retention Job Delete Rights on Every Bucket** — `aws iam put-role-policy --role-name <langfuse-role> --policy-name LangfuseRetentionDelete --policy-document '{"Version":"2012-10-17","Statement":[{"Effect":"Allow","Action":"s3:DeleteObject","Resource":"arn:aws:s3:::<media-bucket>/*"}]}'`; verify: `aws iam simulate-principal-policy --policy-source-arn <langfuse-role-arn> --action-names s3:DeleteObject --resource-arns arn:aws:s3:::<media-bucket>/*`
- [ ] **Upgrade the Instance to the Latest Release** — `helm repo update && helm upgrade langfuse langfuse/langfuse -n <namespace> --reuse-values`; verify: `kubectl get deploy -n <namespace> -o jsonpath='{.items[*].spec.template.spec.containers[*].image}'`
