<!--
id: langfuse-organization-configuration
type: CONFIGURATION
scope: ORGANIZATION
-->

<div align="center">
  <img src="../../../../images/guides/langfuse.svg" alt="Langfuse Logo" width="64" height="64">
  <h2><a href="https://langfuse.com/" target="_blank" rel="noopener noreferrer">Langfuse</a> Configuration Guide</h2>
  <p><em>Access, Sharing, Masking, Retention, AI-Feature and Self-Hosting controls for Langfuse organizations</em></p>
</div>

---

## How to Use This Guide

Each item states its **pass** condition, then gives **Console** (the Langfuse web UI) and **CLI** (`curl` against the Langfuse Public API, and `kubectl` or `helm` for self-hosted instances) steps to **Verify** and **Fix** it. Under CLI, **Expect** is the output that means it passes. Pick the channel you work in at the top of the guide; an item shows only the channels that can check or change the setting, and it passes only when every organization, project or deployment the command returns meets the condition.

#### Prerequisites

- Organization Settings is reached from the organization switcher at the top left of the app; Project Settings from the `Settings` entry in a project's sidebar.
- An organization API key (Organization Settings > API Keys) for organization-level calls, and a project API key (Project Settings > API Keys) for project-level calls. Export them once:
  - `export LANGFUSE_HOST=https://<langfuse-host> ORG_KEY=<org-public-key>:<org-secret-key> PROJECT_KEY=<public-key>:<secret-key>`
- `curl` and `jq` for the Public API checks. Run every project-level check once per project.
- Self-hosted items assume the official Helm chart in one namespace and `kubectl` access to it: `export NS=<namespace>`
- `kubectl set env` changes the live deployment and rolls the pods. Write the same value into the Helm values file so the next `helm upgrade` keeps it.

---

## Organization & Project Settings

- [ ] **Assign Organization Roles at Least Privilege** - pass: every organization member holds the lowest role their work needs, and only the named owners hold `OWNER`
  - **Console**:
    - Verify: Organization Settings > Members > Role column shows `OWNER` only for the named owners and `ADMIN`, `MEMBER` or `VIEWER` for everyone else
    - Fix: Organization Settings > Members > select the member > Role > choose the lowest role that fits > Save
  - **CLI**:
    - Verify: `curl -s -u $ORG_KEY $LANGFUSE_HOST/api/public/organizations/memberships`
    - Expect: `memberships` lists `"role":"OWNER"` only for the named owners. An extra owner can delete the organization and every project in it.
    - Fix:
      ```bash
      curl -s -u $ORG_KEY -X PUT $LANGFUSE_HOST/api/public/organizations/memberships \
        -H 'Content-Type: application/json' -d '{"userId":"<user-id>","role":"VIEWER"}'
      ```
- [ ] **Set Single-Project Users to NONE Plus a Project Role (the organization role NONE is set under Organization Settings > Members; the memberships API takes OWNER, ADMIN, MEMBER or VIEWER)** - pass: a user who works in one project holds organization role `NONE` and a role on that project only
  - **Console**:
    - Verify: Organization Settings > Members > single-project users show Organization Role `NONE` and one entry under Project Roles
    - Fix: Organization Settings > Members > select the user > Organization Role > `NONE` > Save; then Project Settings > Members > Add member > choose the user > role `MEMBER` or `VIEWER` > Add
  - **CLI**:
    - Verify: `curl -s -u $ORG_KEY $LANGFUSE_HOST/api/public/organizations/memberships`
    - Expect: every single-project user is listed with `"role":"NONE"` at the organization level. An organization-level `MEMBER` reaches every project in the organization, including ones the user was never meant to see.
    - Fix:
      ```bash
      curl -s -u $ORG_KEY -X PUT $LANGFUSE_HOST/api/public/projects/<project-id>/memberships \
        -H 'Content-Type: application/json' -d '{"userId":"<user-id>","role":"MEMBER"}'
      ```
- [ ] **Set a Data Retention Window** - pass: every project has Data Retention set to a day count no larger than your policy allows, not disabled
  - **Console**:
    - Verify: Project Settings > General > Data Retention shows a number of days within your policy, not disabled
    - Fix: Project Settings > General > Data Retention > enter the number of days > Save
  - **CLI**:
    - Verify: `curl -s -u $PROJECT_KEY $LANGFUSE_HOST/api/public/projects`
    - Expect: each project's `retentionDays` is a number within your policy, not `0` or absent. Traces kept forever hold prompts and outputs with customer data long after anyone needs them.
    - Fix:
      ```bash
      curl -s -u $ORG_KEY -X PUT $LANGFUSE_HOST/api/public/projects/<project-id> \
        -H 'Content-Type: application/json' -d '{"name":"<project-name>","retention":30}'
      ```
- [ ] **Review Project API Keys and Rotate Them on a Schedule** - pass: every project API key has a note naming its service and environment and was created inside your rotation window
  - **Console**:
    - Verify: Project Settings > API Keys > every key shows a note naming a service and environment and a Created date inside the rotation window
    - Fix: Project Settings > API Keys > Create new API key > Note `<service>-<environment>-<date>` > Create > store the secret in the service's secret manager; then Project Settings > API Keys > select the old key > Delete > confirm
  - **CLI**:
    - Verify: `curl -s -u $ORG_KEY $LANGFUSE_HOST/api/public/projects/<project-id>/apiKeys`
    - Expect: every key's `note` names a service and environment and its `createdAt` is inside the rotation window. A key nobody can attribute cannot be revoked with confidence when it leaks.
    - Fix:
      ```bash
      curl -s -u $ORG_KEY -X POST $LANGFUSE_HOST/api/public/projects/<project-id>/apiKeys \
        -H 'Content-Type: application/json' -d '{"note":"<service>-<environment>-<date>"}'
      ```
    - Fix: `curl -s -u $ORG_KEY -X DELETE $LANGFUSE_HOST/api/public/projects/<project-id>/apiKeys/<old-api-key-id>`
- [ ] **Revoke Organization-Scoped API Keys Not Used for Provisioning** - pass: the only organization API keys are the ones your provisioning automation holds
  - **Console**:
    - Verify: Organization Settings > API Keys > every key's note names a provisioning system (IdP SCIM, Terraform, CI)
    - Fix: Organization Settings > API Keys > select the key > Delete > confirm
  - **CLI**:
    - Verify: `curl -s -u $ORG_KEY $LANGFUSE_HOST/api/public/organizations/apiKeys`
    - Expect: `apiKeys` lists only keys whose `note` names a provisioning system. An organization key can create projects, members and keys across the whole organization.
- [ ] **Restrict Stored LLM Connections to Approved Endpoints** - pass: every LLM connection's base URL is an approved provider or gateway
  - **Console**:
    - Verify: Project Settings > LLM Connections > each connection's API Base URL is empty (provider default) or an approved gateway
    - Fix: Project Settings > LLM Connections > select the connection > Edit > API Base URL > enter the approved gateway URL > Save; delete any connection nobody approved
  - **CLI**:
    - Verify: `curl -s -u $PROJECT_KEY $LANGFUSE_HOST/api/public/llm-connections`
    - Expect: every entry's `baseURL` is null or an approved endpoint. A connection to an unknown host sends prompts, outputs and the provider key to a server you do not control.
    - Fix:
      ```bash
      curl -s -u $PROJECT_KEY -X PUT $LANGFUSE_HOST/api/public/llm-connections \
        -H 'Content-Type: application/json' \
        -d '{"provider":"<provider-name>","adapter":"openai","secretKey":"<provider-key>","baseURL":"https://<approved-gateway>/v1"}'
      ```
- [ ] **Unshare Public Traces That Are Not Safe to Publish** - pass: no trace is public unless it was reviewed for publication
  - **Console**:
    - Verify: Tracing > Traces > open the trace > the share control in the header shows the trace as private
    - Fix: Tracing > Traces > open the trace > share control > switch Public off
  - **CLI**:
    - Verify:
      ```bash
      curl -s -u $PROJECT_KEY "$LANGFUSE_HOST/api/public/traces?orderBy=public.desc&fields=core&limit=100" \
        | grep -c '"public":true'
      ```
    - Expect: `0`, or only the count of traces on the reviewed publication list. A public trace is readable by anyone holding the link, with no login.
- [ ] **Enforce Enterprise SSO for Your Verified Domain (Cloud)** - pass: the corporate domain is verified and its SSO connection is set to Enforced
  - **Console**:
    - Verify: Organization Settings > SSO > the domain shows Verified and the connection shows Enforced
    - Fix: Organization Settings > SSO > Verify Domain > add the DNS record shown > Verify; then Configure SSO > enter the IdP details > set Enforced > Save
- [ ] **Review Audit Logs on a Schedule** - pass: an owner reviews the organization audit log at least monthly and records the review
  - **Console**:
    - Verify: Organization Settings > Audit Logs > entries since the last recorded review have been read, and the review date is in the security runbook
    - Fix: Organization Settings > Audit Logs > read every entry since the last review > record the date and findings in the security runbook > schedule the next review
- [ ] **Provision and Deprovision Users Through SCIM (point the IdP's SCIM provisioning at /api/public/scim with an organization key; the delete below is the offboarding step)** - pass: membership is managed by the IdP's SCIM connector and no offboarded person remains in SCIM Users
  - **Console**:
    - Verify: Organization Settings > Members > every member matches an active user in the IdP and nobody who has left is listed
    - Fix: Organization Settings > API Keys > Create new API key > Note `idp-scim` > Create; then in the IdP point SCIM provisioning at `$LANGFUSE_HOST/api/public/scim` with that key and assign the Langfuse app to the right groups
  - **CLI**:
    - Verify: `curl -s -u $ORG_KEY $LANGFUSE_HOST/api/public/scim/Users`
    - Expect: `Resources` lists only active employees. A member left behind after offboarding keeps reading traces and prompts.
    - Fix: `curl -s -u $ORG_KEY -X DELETE $LANGFUSE_HOST/api/public/scim/Users/<user-id>`
- [ ] **Sign Up in the Cloud Data Region Your Residency Policy Allows** - pass: the organization lives on the region host your residency policy allows and every SDK points at that host
  - **Console**:
    - Verify: Organization Settings > General > the browser address bar shows the allowed region host (`cloud.langfuse.com` for EU, `us.cloud.langfuse.com` for US, `hipaa.cloud.langfuse.com` for HIPAA)
    - Fix: `https://<region-host>/auth/sign-up` > create the organization in the allowed region > invite members > repoint every SDK > Organization Settings > General > Delete Organization on the wrong-region organization
  - **CLI**:
    - Verify: `printenv LANGFUSE_BASE_URL`
    - Verify: `printenv LANGFUSE_HOST`
    - Expect: the printed host is the allowed region host. Traces sent to another region leave the jurisdiction your policy promised customers.
- [ ] **Do Not Enable AI Features Until Approved** - pass: `Enable AI powered features for your organization` is Off unless security approved it
  - **Console**:
    - Verify: Organization Settings > General > AI Features > `Enable AI powered features for your organization` is Off
    - Fix: Organization Settings > General > AI Features > switch `Enable AI powered features for your organization` Off > Save
- [ ] **Turn Off AI Data Use for Product Improvement** - pass: `AI Data Use for Product/Service Improvement` is Off
  - **Console**:
    - Verify: Organization Settings > General > AI Features > `AI Data Use for Product/Service Improvement` is Off
    - Fix: Organization Settings > General > AI Features > switch `AI Data Use for Product/Service Improvement` Off > Save
- [ ] **Protect the Production Prompt Label** - pass: `production` and every label an application resolves are protected labels
  - **Console**:
    - Verify: Project Settings > Protected Prompt Labels > the list contains `production` and every label applications resolve
    - Fix: Project Settings > Protected Prompt Labels > Add label > `production` > Save; repeat for every label applications resolve
- [ ] **Disconnect Any Slack Workspace You Do Not Control** - pass: the Slack integration is disconnected or connected only to your own workspace
  - **Console**:
    - Verify: Project Settings > Integrations > Slack > shows Not connected or the name of your own workspace
    - Fix: Project Settings > Integrations > Slack > Disconnect > confirm
- [ ] **Review and Remove Unnecessary or Unrecognized Integrations** - pass: every integration (Slack, PostHog, blob storage export) is one your team set up on purpose
  - **Console**:
    - Verify: Project Settings > Integrations > each integration shows Not connected or a destination your team owns
    - Fix: Project Settings > Integrations > open the integration > Disconnect or Delete > confirm
  - **CLI**:
    - Verify: `curl -s -u $PROJECT_KEY $LANGFUSE_HOST/api/public/integrations/blob-storage`
    - Expect: `data` lists only exports to buckets you own. An export to a foreign bucket copies every trace out of the project on a schedule.
    - Fix: `curl -s -u $PROJECT_KEY -X DELETE $LANGFUSE_HOST/api/public/integrations/blob-storage/<integration-id>`
- [ ] **Send Webhook Credentials in Headers, Never in the URL** - pass: every prompt automation webhook carries its token in a header and its URL has no secret in the query string
  - **Console**:
    - Verify: Prompts > Automations > open each webhook > the URL contains no token or key and Headers holds `Authorization: Bearer <receiver-token>`
    - Fix: Prompts > Automations > open the webhook > Edit > remove the secret from the URL > Headers > add `Authorization` with the bearer token > Save

---

## Self-Hosted: Application Secrets

- [ ] **Generate a Unique NEXTAUTH_SECRET, SALT and ENCRYPTION_KEY per Environment at Install (rotating SALT breaks every API key; rotating ENCRYPTION_KEY makes stored credentials unreadable)** - pass: each environment has its own random `NEXTAUTH_SECRET`, `SALT` and 64-hex-character `ENCRYPTION_KEY`
  - **CLI**:
    - Verify:
      ```bash
      kubectl exec deployment/langfuse-web -n $NS -- sh -c \
        'for v in ENCRYPTION_KEY SALT NEXTAUTH_SECRET; do printf "%s=" $v; printenv $v | tr -d "\n" | wc -c; done'
      ```
    - Expect: `ENCRYPTION_KEY=64` and at least `32` for the other two, with values that differ from every other environment. A shared or default secret lets a leak in staging forge sessions and decrypt credentials in production.
    - Fix:
      ```bash
      helm install langfuse langfuse/langfuse -n $NS \
        --set langfuse.salt.value=$(openssl rand -base64 32) \
        --set langfuse.encryptionKey.value=$(openssl rand -hex 32) \
        --set langfuse.nextauth.secret.value=$(openssl rand -base64 32)
      ```
- [ ] **Remove the Bootstrap Secrets After First Start (the init values are applied once; afterwards they only sit in the environment as live secrets)** - pass: no `LANGFUSE_INIT_USER_PASSWORD`, `LANGFUSE_INIT_PROJECT_SECRET_KEY` or `LANGFUSE_INIT_PROJECT_PUBLIC_KEY` is set on web or worker
  - **CLI**:
    - Verify:
      ```bash
      kubectl exec deployment/langfuse-web -n $NS -- printenv | grep -E '^LANGFUSE_INIT_(USER_PASSWORD|PROJECT_SECRET_KEY|PROJECT_PUBLIC_KEY)='
      ```
    - Expect: no output. The init password and project keys stay valid credentials for as long as they sit in the environment.
    - Fix:
      ```bash
      kubectl set env deployment/langfuse-web deployment/langfuse-worker -n $NS \
        LANGFUSE_INIT_USER_PASSWORD- LANGFUSE_INIT_PROJECT_SECRET_KEY- LANGFUSE_INIT_PROJECT_PUBLIC_KEY-
      ```
- [ ] **Set Data Retention at Provisioning** - pass: `LANGFUSE_INIT_PROJECT_RETENTION` is set to the day count your policy allows and the bootstrap project shows that retention
  - **Console**:
    - Verify: Project Settings > General > Data Retention shows the day count your policy allows
    - Fix: Project Settings > General > Data Retention > enter the number of days > Save
  - **CLI**:
    - Verify: `kubectl exec deployment/langfuse-web -n $NS -- printenv LANGFUSE_INIT_PROJECT_RETENTION`
    - Verify: `curl -s -u $PROJECT_KEY $LANGFUSE_HOST/api/public/projects`
    - Expect: the variable prints the allowed day count and the project's `retentionDays` matches it. A project created without retention keeps every trace until someone remembers to set it.
    - Fix: `kubectl set env deployment/langfuse-web deployment/langfuse-worker -n $NS LANGFUSE_INIT_PROJECT_RETENTION=<days>`

---

## Self-Hosted: Authentication

- [ ] **Disable Open Sign-Up** - pass: `AUTH_DISABLE_SIGNUP` is `true` on the web deployment
  - **CLI**:
    - Verify: `kubectl exec deployment/langfuse-web -n $NS -- printenv AUTH_DISABLE_SIGNUP`
    - Expect: `true`. With sign-up open, anyone who can reach the host creates an account and, if organization creation is unrestricted, an organization.
    - Fix: `kubectl set env deployment/langfuse-web -n $NS AUTH_DISABLE_SIGNUP=true`
- [ ] **Disable Email/Password When SSO Covers Everyone** - pass: `AUTH_DISABLE_USERNAME_PASSWORD` is `true` once every user signs in through SSO
  - **CLI**:
    - Verify: `kubectl exec deployment/langfuse-web -n $NS -- printenv AUTH_DISABLE_USERNAME_PASSWORD`
    - Expect: `true`. A password login left beside SSO bypasses the IdP's MFA and offboarding.
    - Fix: `kubectl set env deployment/langfuse-web -n $NS AUTH_DISABLE_USERNAME_PASSWORD=true`
- [ ] **Force SSO for Corporate Domains** - pass: `AUTH_DOMAINS_WITH_SSO_ENFORCEMENT` lists every corporate email domain
  - **CLI**:
    - Verify: `kubectl exec deployment/langfuse-web -n $NS -- printenv AUTH_DOMAINS_WITH_SSO_ENFORCEMENT`
    - Expect: a comma-separated list containing every corporate domain. A corporate address that can still log in with a password sidesteps the IdP.
    - Fix: `kubectl set env deployment/langfuse-web -n $NS AUTH_DOMAINS_WITH_SSO_ENFORCEMENT=<domain>,<domain>`
- [ ] **Require Email Verification Where Password Auth Remains** - pass: `AUTH_EMAIL_VERIFICATION_REQUIRED` is `true` wherever password login is still enabled
  - **CLI**:
    - Verify: `kubectl exec deployment/langfuse-web -n $NS -- printenv AUTH_EMAIL_VERIFICATION_REQUIRED`
    - Expect: `true`. Without verification an attacker registers with a colleague's address and receives invitations meant for them.
    - Fix: `kubectl set env deployment/langfuse-web -n $NS AUTH_EMAIL_VERIFICATION_REQUIRED=true`
- [ ] **Shorten the Session Lifetime** - pass: `AUTH_SESSION_MAX_AGE` is set to the number of minutes your policy allows
  - **CLI**:
    - Verify: `kubectl exec deployment/langfuse-web -n $NS -- printenv AUTH_SESSION_MAX_AGE`
    - Expect: the number of minutes your policy allows, not empty. The shipped default is 14 days, so a stolen cookie works for two weeks.
    - Fix: `kubectl set env deployment/langfuse-web -n $NS AUTH_SESSION_MAX_AGE=<minutes>`
- [ ] **Do Not Enable Account Linking Unless the IdP Verifies Emails** - pass: no `AUTH_<PROVIDER>_ALLOW_ACCOUNT_LINKING` is `true` for a provider that does not verify email addresses
  - **CLI**:
    - Verify:
      ```bash
      kubectl exec deployment/langfuse-web -n $NS -- printenv | grep '^AUTH_.*_ALLOW_ACCOUNT_LINKING='
      ```
    - Expect: no output, or `true` only for providers that verify email. Linking on an unverified email lets a new IdP account take over an existing user by matching their address.
    - Fix: `kubectl set env deployment/langfuse-web -n $NS AUTH_<PROVIDER>_ALLOW_ACCOUNT_LINKING-`
- [ ] **Pin the SSO Issuer** - pass: every configured SSO provider has `AUTH_<PROVIDER>_ISSUER` set to your IdP's issuer URL
  - **CLI**:
    - Verify: `kubectl exec deployment/langfuse-web -n $NS -- printenv | grep '^AUTH_.*_ISSUER='`
    - Expect: one line per provider, each ending in your own issuer URL. Without a pinned issuer a token from any tenant of the same IdP product is accepted.
    - Fix: `kubectl set env deployment/langfuse-web -n $NS AUTH_<PROVIDER>_ISSUER=https://<idp-issuer>`
- [ ] **Set Explicit OAuth Checks on Every SSO Provider** - pass: every configured SSO provider has `AUTH_<PROVIDER>_CHECKS=pkce,state`
  - **CLI**:
    - Verify: `kubectl exec deployment/langfuse-web -n $NS -- printenv | grep '^AUTH_.*_CHECKS='`
    - Expect: one line per provider, each set to `pkce,state`. Without PKCE and state the authorization code can be intercepted or replayed.
    - Fix: `kubectl set env deployment/langfuse-web -n $NS AUTH_<PROVIDER>_CHECKS=pkce,state`
- [ ] **Limit Google Sign-In to Corporate Domains** - pass: `AUTH_GOOGLE_ALLOWED_DOMAINS` lists only your corporate domains when Google sign-in is enabled
  - **CLI**:
    - Verify: `kubectl exec deployment/langfuse-web -n $NS -- printenv AUTH_GOOGLE_ALLOWED_DOMAINS`
    - Expect: a comma-separated list of your corporate domains. Without it any Google account, personal ones included, can sign in.
    - Fix: `kubectl set env deployment/langfuse-web -n $NS AUTH_GOOGLE_ALLOWED_DOMAINS=<domain>,<domain>`
- [ ] **Restrict Who Can Create Organizations** - pass: `LANGFUSE_ALLOWED_ORGANIZATION_CREATORS` lists only the owners' addresses
  - **CLI**:
    - Verify: `kubectl exec deployment/langfuse-web -n $NS -- printenv LANGFUSE_ALLOWED_ORGANIZATION_CREATORS`
    - Expect: a comma-separated list of owner addresses. Otherwise every user can create organizations and become an owner of their own.
    - Fix: `kubectl set env deployment/langfuse-web -n $NS LANGFUSE_ALLOWED_ORGANIZATION_CREATORS=<owner@domain>,<owner@domain>`
- [ ] **Set the Auto-Provisioned Default Roles to VIEWER** - pass: `LANGFUSE_DEFAULT_ORG_ROLE` and `LANGFUSE_DEFAULT_PROJECT_ROLE` are `VIEWER`
  - **CLI**:
    - Verify: `kubectl exec deployment/langfuse-web -n $NS -- printenv | grep '^LANGFUSE_DEFAULT_'`
    - Expect: both `LANGFUSE_DEFAULT_ORG_ROLE=VIEWER` and `LANGFUSE_DEFAULT_PROJECT_ROLE=VIEWER`. A higher default hands every auto-provisioned SSO user write access on day one.
    - Fix: `kubectl set env deployment/langfuse-web -n $NS LANGFUSE_DEFAULT_ORG_ROLE=VIEWER LANGFUSE_DEFAULT_PROJECT_ROLE=VIEWER`

---

## Self-Hosted: Ingestion Masking

- [ ] **Set a Server-Side Masking Callback** - pass: `LANGFUSE_INGESTION_MASKING_CALLBACK_URL` points at your masking service on both web and worker
  - **CLI**:
    - Verify: `kubectl exec deployment/langfuse-worker -n $NS -- printenv LANGFUSE_INGESTION_MASKING_CALLBACK_URL`
    - Expect: `https://<masking-service>/mask`. Without server-side masking, every SDK that forgets client-side masking writes raw PII into traces.
    - Fix:
      ```bash
      kubectl set env deployment/langfuse-web deployment/langfuse-worker -n $NS \
        LANGFUSE_INGESTION_MASKING_CALLBACK_URL=https://<masking-service>/mask
      ```
- [ ] **Set Masking to Fail Closed** - pass: `LANGFUSE_INGESTION_MASKING_CALLBACK_FAIL_CLOSED` is `true` on both web and worker
  - **CLI**:
    - Verify: `kubectl exec deployment/langfuse-worker -n $NS -- printenv LANGFUSE_INGESTION_MASKING_CALLBACK_FAIL_CLOSED`
    - Expect: `true`. Failing open stores unmasked events whenever the masking service is down.
    - Fix:
      ```bash
      kubectl set env deployment/langfuse-web deployment/langfuse-worker -n $NS \
        LANGFUSE_INGESTION_MASKING_CALLBACK_FAIL_CLOSED=true
      ```
- [ ] **Close the Legacy Ingestion Endpoint** - pass: `LANGFUSE_MIGRATION_V4_WRITE_MODE` is unset once every SDK is on the current ingestion path
  - **CLI**:
    - Verify: `kubectl exec deployment/langfuse-web -n $NS -- printenv | grep '^LANGFUSE_MIGRATION_V4_WRITE_MODE='`
    - Expect: no output. The legacy write path skips the masking callback and keeps a second, unhardened way to write traces.
    - Fix: `kubectl set env deployment/langfuse-web deployment/langfuse-worker -n $NS LANGFUSE_MIGRATION_V4_WRITE_MODE-`

---

## Self-Hosted: Hardening

- [ ] **Enforce HTTPS at the CSP Layer** - pass: `LANGFUSE_CSP_ENFORCE_HTTPS` is `true` on the web deployment
  - **CLI**:
    - Verify: `kubectl exec deployment/langfuse-web -n $NS -- printenv LANGFUSE_CSP_ENFORCE_HTTPS`
    - Expect: `true`. Without it a page loaded over plain HTTP sends session cookies in clear text.
    - Fix: `kubectl set env deployment/langfuse-web -n $NS LANGFUSE_CSP_ENFORCE_HTTPS=true`
- [ ] **Turn Off Telemetry (OSS)** - pass: `TELEMETRY_ENABLED` is `false` on web and worker
  - **CLI**:
    - Verify: `kubectl exec deployment/langfuse-web -n $NS -- printenv TELEMETRY_ENABLED`
    - Expect: `false`. Telemetry reports usage from your instance to a third party your data policy may not cover.
    - Fix: `kubectl set env deployment/langfuse-web deployment/langfuse-worker -n $NS TELEMETRY_ENABLED=false`
- [ ] **Do Not Set SSRF Allowlists Unless an Internal Target Is Required** - pass: no `LANGFUSE_*WHITELISTED*` variable is set unless a documented internal target needs it
  - **CLI**:
    - Verify: `kubectl exec deployment/langfuse-web -n $NS -- printenv | grep 'WHITELISTED'`
    - Expect: no output, or only the variables named in your documented exception. An allowlisted internal range lets a crafted webhook or LLM base URL reach services inside the cluster.
    - Fix: `kubectl set env deployment/langfuse-web deployment/langfuse-worker -n $NS <whitelist-variable>-`
- [ ] **Never Run Code Evaluators In-Process** - pass: `LANGFUSE_CODE_EVAL_DISPATCHER` is unset or set to a sandboxed dispatcher
  - **CLI**:
    - Verify: `kubectl exec deployment/langfuse-web -n $NS -- printenv | grep '^LANGFUSE_CODE_EVAL_DISPATCHER='`
    - Expect: no output, or a sandboxed dispatcher named in your runbook. An in-process evaluator runs user-authored code inside the Langfuse container with its secrets.
    - Fix: `kubectl set env deployment/langfuse-web deployment/langfuse-worker -n $NS LANGFUSE_CODE_EVAL_DISPATCHER-`
- [ ] **Generate a High-Entropy Admin API Key and Do Not Expose the Admin API Publicly** - pass: `ADMIN_API_KEY` is at least 64 random characters and `/api/admin` is blocked at the ingress
  - **CLI**:
    - Verify: `kubectl exec deployment/langfuse-web -n $NS -- printenv ADMIN_API_KEY | tr -d '\n' | wc -c`
    - Verify: `curl -s -o /dev/null -w '%{http_code}' $LANGFUSE_HOST/api/admin/organizations`
    - Expect: a length of at least `64`, and `403` or `404` from outside the network rather than `401`. A guessable or reachable admin key controls every organization on the instance.
    - Fix:
      ```bash
      kubectl create secret generic langfuse-admin -n $NS --from-literal=ADMIN_API_KEY=$(openssl rand -base64 48) && \
        kubectl set env deployment/langfuse-web -n $NS --from=secret/langfuse-admin
      ```
- [ ] **Sandbox or Disable the Assistant's Code Tools (or set LANGFUSE_IN_APP_AGENT_ENABLED=false)** - pass: the in-app agent is disabled, or its sandbox provider is `lambda-microvm` with image, role, region and egress connector set
  - **CLI**:
    - Verify: `kubectl exec deployment/langfuse-web -n $NS -- printenv | grep '^LANGFUSE_IN_APP_AGENT_'`
    - Expect: `LANGFUSE_IN_APP_AGENT_ENABLED=false`, or `LANGFUSE_IN_APP_AGENT_SANDBOX_PROVIDER=lambda-microvm` together with the image, execution role, region and egress connector variables. Unsandboxed code tools run model-written code inside the application.
    - Fix: `kubectl set env deployment/langfuse-web deployment/langfuse-worker -n $NS LANGFUSE_IN_APP_AGENT_ENABLED=false`
    - Fix:
      ```bash
      kubectl set env deployment/langfuse-web deployment/langfuse-worker -n $NS \
        LANGFUSE_IN_APP_AGENT_SANDBOX_PROVIDER=lambda-microvm \
        LANGFUSE_IN_APP_AGENT_SANDBOX_AWS_LAMBDA_MICROVM_IMAGE_IDENTIFIER=<image-id> \
        LANGFUSE_IN_APP_AGENT_SANDBOX_AWS_LAMBDA_MICROVM_EXECUTION_ROLE_ARN=<execution-role-arn> \
        LANGFUSE_IN_APP_AGENT_SANDBOX_AWS_LAMBDA_MICROVM_REGION=<region> \
        LANGFUSE_IN_APP_AGENT_SANDBOX_AWS_LAMBDA_MICROVM_EGRESS_NETWORK_CONNECTOR_ARN=<egress-connector-arn>
      ```
- [ ] **Expose Only the Web Container** - pass: `langfuse-web` is the only Service of type `LoadBalancer` or `NodePort` in the namespace
  - **CLI**:
    - Verify: `kubectl get svc -n $NS`
    - Expect: every Service except `langfuse-web` shows `ClusterIP`. An exposed worker, Postgres, ClickHouse, Redis or MinIO is reachable without any Langfuse authentication.
    - Fix: `kubectl patch svc <service-that-is-not-langfuse-web> -n $NS -p '{"spec":{"type":"ClusterIP"}}'`
- [ ] **Enable Encryption at Rest on Every Store** - pass: every bucket Langfuse writes to has default SSE-KMS encryption, and the database volumes are encrypted
  - **Console**:
    - Verify: S3 > Buckets > `<event-upload-bucket>` > Properties > Default encryption shows `SSE-KMS` with your key; repeat for the media and export buckets
    - Fix: S3 > Buckets > `<event-upload-bucket>` > Properties > Default encryption > Edit > `SSE-KMS` > choose the key > Save changes
  - **CLI**:
    - Verify: `aws s3api get-bucket-encryption --bucket <event-upload-bucket>`
    - Expect: `SSEAlgorithm` is `aws:kms` with your `KMSMasterKeyID`. Unencrypted buckets hand every raw event and media upload to whoever obtains the storage credentials.
    - Fix:
      ```bash
      aws s3api put-bucket-encryption --bucket <event-upload-bucket> --server-side-encryption-configuration \
        '{"Rules":[{"ApplyServerSideEncryptionByDefault":{"SSEAlgorithm":"aws:kms","KMSMasterKeyID":"<kms-key-arn>"}}]}'
      ```
- [ ] **Grant the Retention Job Delete Rights on Every Bucket** - pass: the Langfuse role can `s3:DeleteObject` on the event, media and export buckets
  - **Console**:
    - Verify: IAM > Roles > `<langfuse-role>` > Permissions > a policy allows `s3:DeleteObject` on every bucket Langfuse writes to
    - Fix: IAM > Roles > `<langfuse-role>` > Permissions > Add permissions > Create inline policy > JSON > allow `s3:DeleteObject` on `arn:aws:s3:::<media-bucket>/*` and the other buckets > Next > name `LangfuseRetentionDelete` > Create policy
  - **CLI**:
    - Verify:
      ```bash
      aws iam simulate-principal-policy --policy-source-arn <langfuse-role-arn> --action-names s3:DeleteObject \
        --resource-arns arn:aws:s3:::<media-bucket>/* --query 'EvaluationResults[].EvalDecision' --output text
      ```
    - Expect: `allowed`. Without delete rights the retention job silently leaves expired traces and media in the buckets.
    - Fix:
      ```bash
      aws iam put-role-policy --role-name <langfuse-role> --policy-name LangfuseRetentionDelete --policy-document \
        '{"Version":"2012-10-17","Statement":[{"Effect":"Allow","Action":"s3:DeleteObject","Resource":"arn:aws:s3:::<media-bucket>/*"}]}'
      ```
- [ ] **Upgrade the Instance to the Latest Release** - pass: web and worker run the image tag of the latest Langfuse release
  - **CLI**:
    - Verify: `kubectl get deploy -n $NS -o jsonpath='{.items[*].spec.template.spec.containers[*].image}'`
    - Verify: `helm search repo langfuse/langfuse --output json`
    - Expect: the running image tag equals the chart's current `app_version`. An old release misses security fixes that are public in the changelog.
    - Fix: `helm repo update && helm upgrade langfuse langfuse/langfuse -n $NS --reuse-values`
