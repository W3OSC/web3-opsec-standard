<!--
id: teleport-organization-configuration
type: CONFIGURATION
scope: ORGANIZATION
-->

<div align="center">
  <img src="../../../../images/guides/teleport.svg" alt="Teleport Logo" width="64" height="64">
  <h2><a href="https://goteleport.com/" target="_blank" rel="noopener noreferrer">Teleport</a> Configuration Guide</h2>
  <p><em>Secure Infrastructure Access - Deployment & Security Hardening</em></p>
</div>

---

## Deployment Architecture Decisions

These decisions must be made **before** deploying Teleport. Getting them wrong and migrating later is painful.

#### Deployment Model
- [ ] **Do not use single-VM deployment in production** - a single `teleport` process running Auth + Proxy on one machine is a single point of failure and an HA anti-pattern
- [ ] **Use your cloud's managed Kubernetes service** (EKS / GKE / AKS) and deploy via the [official Teleport Helm chart](https://goteleport.com/docs/installation/self-hosted/helm-deployments/) - this handles HA, replica separation, rolling updates, and health checks
- [ ] Follow the [High Availability deployment guide](https://goteleport.com/docs/installation/self-hosted/deployments/high-availability/) for load balancer and backend setup

#### TLS Routing Decision
- [ ] Decide on **TLS Routing** (single ALPN port `443`) vs **Separate Ports** before deployment - this cannot be changed without downtime
  - Prefer TLS Routing for simplicity: single exposed port, minimal firewall rules
  - Use Separate Ports only if your network requires per-protocol L7 load balancing
- [ ] Use a **Layer 4 load balancer** (not L7/HTTP) - TLS must not be terminated at the load balancer; Teleport handles its own mTLS

#### Certificate Management
- [ ] Use **Let's Encrypt** or your internal PKI for Proxy TLS - never self-signed in production
- [ ] Set Teleport session certificate TTL to **8–12 hours** maximum - shorter is better
- [ ] Enable [session and identity locking](https://goteleport.com/docs/identity-governance/locking.md) so all active sessions can be revoked immediately during an incident

---

## Per-Cloud Environment Configuration

Follow the official Helm guide for your cloud ([AWS](https://goteleport.com/docs/installation/self-hosted/helm-deployments/aws/), [GCP](https://goteleport.com/docs/installation/self-hosted/helm-deployments/gcp/), [Azure](https://goteleport.com/docs/installation/self-hosted/helm-deployments/azure/)) - it covers deployment, cert-manager TLS, backend wiring, and IAM setup. The items below are **not** covered by the Helm guide and require additional decisions or hardening.

### AWS

#### Backend Hardening (before deploying)
- [ ] Enable **DynamoDB Point-in-Time Recovery (PITR)** on both tables (cluster state + audit events) - the Helm guide creates the tables but does not enable PITR
- [ ] Enable **DynamoDB encryption at rest** using a CMK (not just AWS-managed) if you have compliance requirements
- [ ] Enable **SSE-KMS** on the S3 session recordings bucket - the Helm guide defaults to SSE-S3
- [ ] Block **all public access** on the S3 bucket explicitly (not just relying on no bucket policy)

#### IAM
- [ ] Use **IRSA** (IAM Roles for Service Accounts) - do not mount long-lived access keys into pods; the Helm guide covers this but it's easy to skip when using existing clusters

#### Networking (additive - not in Helm guide)
- [ ] Deploy Teleport into a **private subnet** - only the Proxy NLB gets a public IP; the Auth Service NLB should be internal-only
- [ ] Restrict the Auth Service security group: port `3025` accessible only from the Proxy node group CIDR, not `0.0.0.0/0`
- [ ] Add **VPC Endpoints (PrivateLink)** for DynamoDB and S3 so Auth Service traffic stays off the public internet

---

### GCP

#### Backend Hardening (before deploying)
- [ ] Select **Firestore Native mode** (not Datastore mode) - the Helm guide specifies this but it cannot be changed after creation
- [ ] Verify **customer-managed encryption keys (CMEK)** for Firestore and GCS if you have compliance requirements - GCP default encryption is Google-managed
- [ ] Enable **uniform bucket-level access** on the GCS session recordings bucket (no per-object ACLs)
- [ ] Enable **GCS object versioning** and **Cloud Audit Logs** (DATA_READ, DATA_WRITE) on the bucket - not set by the Helm guide

#### IAM
- [ ] Use **Workload Identity** to bind the Kubernetes service account to the GCP service account - avoid downloading and mounting service account key files; the Helm guide covers this but key files are a common shortcut

#### Networking (additive - not in Helm guide)
- [ ] Use **Private Cluster** mode in GKE - the Helm guide does not configure cluster topology
- [ ] Place the Auth Service behind an **Internal Load Balancer** - only the Proxy Service should face the public internet
- [ ] Scope Proxy firewall ingress to port `443` only; keep all other Teleport ports internal

---

### Azure

#### Backend Hardening (before deploying)
- [ ] Enable **TLS enforcement** on PostgreSQL Flexible Server - reject non-TLS connections; not enforced by default
- [ ] Enable **geo-redundant backups** on PostgreSQL
- [ ] Enable **Azure Defender for PostgreSQL** on the database
- [ ] Use a **Private Endpoint** for both PostgreSQL and Blob Storage - the Helm guide deploys them without private endpoints
- [ ] Enable **Blob versioning** and **soft delete** (≥30 days) on the session recordings container
- [ ] Block **all public access** on the storage account explicitly

#### IAM
- [ ] Use **Azure Workload Identity** (not legacy pod-managed identity) - the Helm guide covers this but verify your AKS cluster has the OIDC issuer and workload identity add-on enabled before deploying

#### Networking (additive - not in Helm guide)
- [ ] Use **Private Cluster** mode in AKS - the Helm guide does not configure cluster topology
- [ ] Use **Azure Load Balancer Standard (L4)** in front of the Proxy - do not use Application Gateway (L7) as it would terminate TLS before Teleport
- [ ] Restrict the Auth Service NSG: port `3025` from the Proxy node subnet only

---

## Security Configuration

#### Authentication Hardening
- [ ] Integrate with your **SSO/IdP** (Okta, GitHub SSO, Google Workspace, Azure AD) - do not rely solely on local Teleport users for production
- [ ] Enforce **MFA for all users** at the cluster level: set `auth_service.authentication.second_factor: on` (or `webauthn` for phishing-resistant)
- [ ] Use **WebAuthn / Hardware Keys** as the required second factor for all privileged access:
  - Set `second_factor: webauthn` in `auth_service.authentication`
  - Configure `webauthn.rp_id` to your Teleport cluster domain
  - Require hardware keys (YubiKey etc.) for users with `admin` or production access roles
- [ ] Enable **Per-Session MFA**: require a fresh MFA check before opening each SSH, Kubernetes, or database session
  - Set `require_session_mfa: true` in roles that access production
- [ ] Enable **MFA for Administrative Actions** (tctl, access requests): set `require_session_mfa: hardware_key_touch` for admin roles where supported
- [ ] Enable **Passwordless authentication** only if your entire fleet uses phishing-resistant authenticators; otherwise keep password + WebAuthn

#### RBAC & Least Privilege
- [ ] Define **custom roles** - never assign the built-in `admin` role to regular engineers
- [ ] Use **node labels + role `node_labels`** to restrict which users can access which servers - enforce by environment (`env: production` vs `env: staging`)
- [ ] Use **Access Requests** for privileged access to production: engineers request elevated access, require ≥2 approvers, set short TTLs (1–4 hours)
- [ ] Restrict `tctl` access: only break-glass admin accounts should have the `admin` role; protect with hardware key MFA
- [ ] Review and rotate **bot tokens** (Machine & Workload Identity) regularly; use short-lived joined certificates instead of static tokens

#### Session Recording & Audit
- [ ] Enable **session recording** for all SSH and Kubernetes sessions: set `session_recording: node` (or `proxy` if nodes cannot reach the Auth Service)
- [ ] Enable **enhanced session recording** (BPF/eBPF) on Linux nodes for command-level audit trails
- [ ] Enable **Kubernetes audit log** export through Teleport
- [ ] Configure **audit log export** to your SIEM (Splunk, Datadog, Elastic) via the Teleport Event Handler plugin or direct S3/GCS export
- [ ] Set audit log retention to ≥1 year

#### Network & Access Controls
- [ ] Enable **IP Pinning** for high-privilege roles: set `pin_source_ip: true` - this binds the session certificate to the source IP, preventing certificate theft replay from a different IP
- [ ] Restrict Teleport cluster access by IP where feasible using `client_idle_timeout` and firewall rules
- [ ] Enable **connection limits** per user to detect credential abuse
- [ ] Disable **local users** (`auth_service.authentication.local_auth: false`) if all users come from SSO - eliminates password-based attack surface
- [ ] Regularly review **trusted clusters** and revoke any no longer in use

#### Cluster Maintenance
- [ ] Pin a specific Teleport version in your Helm values / deployment - do not use `latest`
- [ ] Enable **Automatic Agent Updates** via the Teleport update management system to keep agents patched without manual effort
- [ ] Run `tctl status` and `tctl auth verify` periodically to confirm CA health
- [ ] Rotate Teleport **Certificate Authorities** at least annually (`tctl auth rotate`)
- [ ] Keep ≥2 hardware backup tokens per admin registered - losing the only token for an admin account can cause a lockout
