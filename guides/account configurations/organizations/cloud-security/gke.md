<!--
id: gke-organization-configuration
type: CONFIGURATION
scope: ORGANIZATION
-->

<div align="center">
  <img src="../../../../images/guides/gke.svg" alt="Google Kubernetes Engine Logo" width="64" height="64">
  <h2><a href="https://cloud.google.com/kubernetes-engine/docs/concepts/security-overview" target="_blank" rel="noopener noreferrer">GKE</a> Configuration Guide</h2>
  <p><em>Google Kubernetes Engine Hardening — IAM Escalation, Metadata Theft & Lateral Movement</em></p>
</div>

---

GKE-specific controls on top of the [Kubernetes](https://kubernetes.io/docs/concepts/security/security-checklist/) baseline. The dominant GKE attack path is **pod compromise → node service account → the rest of the project**. Based on [GKE security best practices](https://cloud.google.com/kubernetes-engine/docs/best-practices/hardening-your-cluster).

---

## Control Plane Access

- [ ] Run a **[private cluster](https://cloud.google.com/kubernetes-engine/docs/concepts/private-cluster-concept)** — nodes get no public IPs
- [ ] Restrict the control plane with **authorized networks**; never expose it to `0.0.0.0/0`
- [ ] **Disable the kubelet read-only port (10255)** — it leaks pod and node data unauthenticated
- [ ] Enable **[Shielded GKE Nodes](https://cloud.google.com/kubernetes-engine/docs/how-to/shielded-gke-nodes)** (secure boot + integrity monitoring)
- [ ] Keep clusters on a **release channel** for automatic security patching

---

## Identity & IAM (Privilege Escalation)

**Attack path:** the default Compute Engine service account is broadly privileged and reachable from every pod.

- [ ] Use **[Workload Identity Federation](https://cloud.google.com/kubernetes-engine/docs/how-to/workload-identity)** — bind Kubernetes SAs to Google SAs, no static keys
- [ ] **Do not use the default Compute Engine service account** for nodes; create a minimal custom SA (logging, monitoring, Artifact Registry read)
- [ ] Never grant nodes **`roles/editor`** or broad project roles — every pod inherits them
- [ ] Manage cluster RBAC with **Google Groups**, not individual bindings
- [ ] Enforce org policies: **disable service account key creation** (`iam.disableServiceAccountKeyCreation`)

---

## Metadata Server — Credential Theft

**Attack path:** pod SSRF/RCE queries the metadata server and steals the node SA token.

- [ ] **Workload Identity blocks legacy metadata access** — enable it cluster-wide
- [ ] Ensure **legacy metadata endpoints are disabled** (`disable-legacy-endpoints=true`)
- [ ] Additionally **block egress to `169.254.169.254`** via NetworkPolicy for defence in depth

---

## Network Segmentation

- [ ] Enable **[network policy enforcement](https://cloud.google.com/kubernetes-engine/docs/how-to/network-policy)** (Dataplane V2 / Cilium) and apply **default-deny ingress and egress**
- [ ] Use **private nodes** with Cloud NAT for controlled egress
- [ ] Restrict **VPC firewall rules** to required ports; no broad internal allow-all
- [ ] Prefer **internal load balancers**; do not expose services publicly by default

---

## Workload Privileges

- [ ] Enforce **Pod Security Admission `restricted`** (or Policy Controller equivalents)
- [ ] Block **privileged**, hostPath, hostNetwork, hostPID; run **non-root** with dropped capabilities
- [ ] Enable **[GKE Sandbox (gVisor)](https://cloud.google.com/kubernetes-engine/docs/concepts/sandbox-pods)** for untrusted or multi-tenant workloads
- [ ] Use **Container-Optimized OS with containerd** — smaller, read-only, hardened node image
- [ ] **Restrict workloads from self-modifying** (no patching their own Deployments/RBAC)

---

## Secrets

- [ ] Store credentials in **Secret Manager**, not raw Kubernetes Secrets
- [ ] Enable **[application-layer secrets encryption](https://cloud.google.com/kubernetes-engine/docs/how-to/encrypting-secrets)** with Cloud KMS
- [ ] Mount secrets as **files, not environment variables**; rotate on suspected exposure

---

## Images & Supply Chain

- [ ] Use **Artifact Registry** (private); block external registries at admission
- [ ] Enforce **[Binary Authorization](https://cloud.google.com/binary-authorization/docs)** so only signed, attested images run
- [ ] Enable **vulnerability scanning**; fail deploys on critical findings
- [ ] **Pin image digests** rather than mutable tags

---

## Detection & Response

- [ ] Enable **Cloud Audit Logs** (admin + data access) and export to a **separate, restricted project**
- [ ] Enable **VPC Flow Logs** and firewall rule logging for lateral-movement analysis
- [ ] Alert on: cluster-admin bindings, `exec` into pods, Secret reads, service account key creation, IAM policy changes
- [ ] Use **Security Command Center** / Container Threat Detection for runtime signals
- [ ] Rehearse **credential revocation** for node SAs and Workload Identity bindings
