<!--
id: aks-organization-configuration
type: CONFIGURATION
scope: ORGANIZATION
-->

<div align="center">
  <img src="../../../../images/guides/aks.svg" alt="Azure Kubernetes Service Logo" width="64" height="64">
  <h2><a href="https://learn.microsoft.com/en-us/azure/aks/concepts-security" target="_blank" rel="noopener noreferrer">AKS</a> Configuration Guide</h2>
  <p><em>Azure Kubernetes Service Hardening — Identity Escalation, IMDS Theft & Lateral Movement</em></p>
</div>

---

AKS-specific controls on top of the [Kubernetes](https://kubernetes.io/docs/concepts/security/security-checklist/) baseline. The dominant AKS attack path is **local cluster credentials or a pod-reachable managed identity → the wider subscription**. Informed by [The AKS Checklist](https://www.the-aks-checklist.com/) and Microsoft's AKS security guidance.

---

## Control Plane Access

**Attack path:** a public API server exposes the cluster to unauthenticated reach and brute force.

- [ ] Deploy a **[private cluster](https://learn.microsoft.com/en-us/azure/aks/private-clusters)** or use **API Server VNet Integration** — keep the control plane off the internet
- [ ] If public, restrict to **authorized IP ranges**; never `0.0.0.0/0`
- [ ] Stay on a **supported Kubernetes version** (N, N-1, N-2) with **cluster and node-image auto-upgrade** enabled

---

## Identity & RBAC (Privilege Escalation)

**Attack path:** the static local admin kubeconfig bypasses Entra ID entirely and cannot be revoked centrally.

- [ ] **Integrate with Microsoft Entra ID** and **disable local accounts** (`--disable-local-accounts`) — the local admin kubeconfig is an unrevocable backdoor
- [ ] Enable **Azure RBAC for Kubernetes authorization** so access is governed by Azure roles
- [ ] Restrict **`Microsoft.ContainerService/managedClusters/listClusterAdminCredential/action`** — it hands out cluster-admin
- [ ] Use **just-in-time / PIM** elevation for cluster admin rather than standing access
- [ ] Use **managed identities**, not service principals with long-lived secrets

---

## Workload Identity

**Attack path:** a broadly-scoped kubelet or workload identity turns a pod compromise into subscription access.

- [ ] Use **[Microsoft Entra Workload ID](https://learn.microsoft.com/en-us/azure/aks/workload-identity-overview)** so pods get federated, scoped tokens
- [ ] **Do not grant the kubelet identity broad subscription roles** — every pod on the node can reach it
- [ ] **Disable ServiceAccount token automount** where unused
- [ ] Never store Azure credentials in images, manifests, or env vars

---

## IMDS — Credential Theft

**Attack path:** pod SSRF/RCE queries IMDS and steals the node managed-identity token.

- [ ] **Block pod egress to `169.254.169.254`** via network policy — this is the single highest-value AKS control
- [ ] Keep node identity permissions minimal so a stolen token is low value

---

## Network Segmentation

**Attack path:** a compromised pod reaches every service and node in the VNet.

- [ ] Enable **network policy** (Azure NPM, Calico, or Cilium) with **default-deny ingress and egress**
- [ ] Use **internal ingress controllers** / internal load balancers; do not expose services publicly by default
- [ ] Restrict **egress** through **Azure Firewall** or an NVA; allow-list required destinations
- [ ] Use **Private Link / private endpoints** for Azure PaaS (Key Vault, Storage, SQL) so traffic never traverses the internet
- [ ] Separate **system and user node pools** with taints

---

## Workload Privileges

**Attack path:** a privileged or host-namespaced pod escapes to the node and its managed identity.

- [ ] Enforce **Pod Security Admission `restricted`** and back it with **Azure Policy for AKS**
- [ ] Block **privileged**, hostPath, hostNetwork, hostPID; run **non-root**, drop capabilities, `seccompProfile: RuntimeDefault`
- [ ] Use **Azure Linux** (or a hardened image) with **ephemeral OS disks**
- [ ] Set **resource quotas and limits** per namespace

---

## Secrets

**Attack path:** a read Secret or leaked token grants standing access to Azure resources.

- [ ] Store secrets in **Azure Key Vault**; inject via the **[Secrets Store CSI driver](https://learn.microsoft.com/en-us/azure/aks/csi-secrets-store-driver)**
- [ ] Restrict Key Vault access with **RBAC + private endpoint**; enable purge protection
- [ ] Mount as **files, not environment variables**; rotate on suspected exposure

---

## Images & Supply Chain

**Attack path:** a poisoned or unpinned image runs attacker code on every node.

- [ ] Use a **private Azure Container Registry** with **Private Link** — never a public registry
- [ ] Enable **vulnerability scanning** (Defender for Containers) and block critical findings
- [ ] Gate deployments with **Azure Policy** (no root, no privileged, approved registries only)
- [ ] **Pin digests**; run **ImageCleaner** to purge stale, unpatched images from nodes

---

## Detection & Response

**Attack path:** without audit logs and Defender signals, identity abuse and container escapes go unnoticed.

- [ ] Enable **Microsoft Defender for Containers** for runtime threat detection
- [ ] Send **control plane / audit logs** (`kube-audit`, `kube-apiserver`) to Log Analytics, retained outside the cluster's blast radius
- [ ] Alert on: cluster-admin bindings, `exec` into pods, Secret reads, `listClusterAdminCredential` calls, Entra role changes
- [ ] Benchmark the cluster against CIS with **kube-bench** and **kubestriker**
- [ ] Rehearse **credential revocation** — rotate managed identities, Key Vault secrets, and cluster credentials
