<!--
id: kubernetes-organization-configuration
type: CONFIGURATION
scope: ORGANIZATION
-->

<div align="center">
  <img src="../../../../images/guides/kubernetes.svg" alt="Kubernetes Logo" width="64" height="64">
  <h2><a href="https://kubernetes.io/" target="_blank" rel="noopener noreferrer">Kubernetes</a> Configuration Guide</h2>
  <p><em>Cluster Hardening — Real Attack Paths, Privilege Escalation & Lateral Movement</em></p>
</div>

---

Every item below maps to something an attacker actually does: reach the control plane, escalate via RBAC, break out of a container, steal cloud credentials, or move sideways. Based on the [Kubernetes Security Checklist](https://kubernetes.io/docs/concepts/security/security-checklist/).

---

## Control Plane Exposure

**Attack path:** internet-reachable API server or etcd → direct cluster compromise.

- [ ] **API server is not exposed to the internet** — reach it via bastion, VPN, or private endpoint
- [ ] **etcd is not reachable from workloads or the internet** — restrict to control plane nodes only
- [ ] **Encrypt etcd at rest** using a KMS provider — anyone with an etcd backup otherwise reads every Secret
- [ ] Restrict the **kubelet API** (`--anonymous-auth=false`, `--authorization-mode=Webhook`) — the default config is overly permissive
- [ ] Keep the cluster on a **supported, patched version**

---

## Identity & RBAC (Privilege Escalation)

**Attack path:** over-permissive RBAC turns any compromised token into cluster-admin.

- [ ] **Treat `create`/`update`/`patch` on workloads as admin-equivalent** — anyone who can create a Pod can usually own the node ([RBAC good practices](https://kubernetes.io/docs/concepts/security/rbac-good-practices/))
- [ ] **No standing `cluster-admin`**; `system:masters` is break-glass only, never for routine or component use
- [ ] Scope Roles to **namespaces**; avoid ClusterRoles unless genuinely cluster-wide
- [ ] Restrict **escalation verbs**: `escalate`, `bind`, `impersonate`, and `pods/exec`, `pods/attach`, `pods/portforward`
- [ ] **Disable default ServiceAccount token automount** (`automountServiceAccountToken: false`) — a mounted token is free credentials for any RCE
- [ ] Review who can read `secrets` — `get`/`list`/`watch` on Secrets is equivalent to reading them all

---

## Workload Privileges (Container Escape)

**Attack path:** privileged or host-namespaced pod → host root → every workload on the node.

- [ ] **Enforce Pod Security Admission `restricted`** per namespace ([PSA](https://kubernetes.io/docs/concepts/security/pod-security-admission/)) — `enforce`, not just `warn`
- [ ] Block **`privileged: true`** and **`allowPrivilegeEscalation: true`**
- [ ] Block **hostPath** mounts, **hostNetwork**, **hostPID**, **hostIPC**
- [ ] Run as **non-root** (`runAsNonRoot: true`) with a **read-only root filesystem**
- [ ] **Drop all capabilities**, add back only what is required (never `CAP_SYS_ADMIN`)
- [ ] Apply **`seccompProfile: RuntimeDefault`** to shrink the kernel attack surface
- [ ] Use **AppArmor/SELinux** profiles where available

---

## Cloud Metadata & Credential Theft

**Attack path:** SSRF or RCE in any pod → query the metadata endpoint → steal node/cloud IAM credentials.

- [ ] **Block pod egress to `169.254.169.254`** via NetworkPolicy or host firewall
- [ ] Do **not** attach broad cloud IAM permissions to node roles — pods inherit them
- [ ] Prefer **per-workload cloud identity** over node-level credentials

---

## Network Segmentation (Lateral Movement)

**Attack path:** one compromised pod reaches every service in the cluster.

- [ ] Use a **CNI that enforces NetworkPolicy** (Calico, Cilium) — policies are silently ignored otherwise
- [ ] **Default-deny ingress AND egress** in every namespace, then allow-list explicitly
- [ ] Explicitly deny pod traffic to the **control plane and etcd**
- [ ] Restrict who can create **`LoadBalancer` / `externalIPs`** Services — enable [`DenyServiceExternalIPs`](https://kubernetes.io/docs/reference/access-authn-authz/admission-controllers/#denyserviceexternalips) (CVE-2020-8554 traffic interception)

---

## Secrets Handling

**Attack path:** a read Secret or a leaked pod token grants standing access — logs, env dumps, and etcd all leak them.

- [ ] **Mount Secrets as files, not environment variables** — env vars leak via crash dumps, logs, and `/proc`
- [ ] Prefer an **external secret store** (Vault, cloud secret manager) over raw etcd Secrets
- [ ] Scope Secret access with **`resourceNames`** so a workload reads only its own
- [ ] **Rotate** any secret exposed to a compromised namespace; assume disclosure

---

## Supply Chain & Images

**Attack path:** a poisoned or unpinned image runs attacker code on every pull.

- [ ] Pull only from **trusted/private registries**; block public registries via admission policy
- [ ] **Pin image digests** (not `:latest`) so the running image cannot change underneath you
- [ ] **Scan images** for vulnerabilities and fail builds on critical findings
- [ ] **Enforce image signatures** at admission (Sigstore/Cosign, Kyverno, or equivalent)

---

## Admission Control

**Attack path:** without enforcement at admission, a non-compliant pod slips past every policy above.

- [ ] Enforce policy at admission with **ValidatingAdmissionPolicy**, **Kyverno**, or **OPA/Gatekeeper**
- [ ] **Fail closed** — a webhook that fails open is not a control
- [ ] Restrict who can modify **admission webhooks**; editing them disables every policy at once

---

## Node Isolation & Resource Abuse

**Attack path:** a container escape lands on whatever shares the node; an unbounded pod starves it.

- [ ] **Separate sensitive workloads onto dedicated nodes** (taints/affinity) so a container escape does not land next to secrets-bearing pods
- [ ] Isolate tenants by **namespace + node pool**; use separate clusters for hostile multi-tenancy
- [ ] Set **CPU/memory limits** and enforce with **ResourceQuota**/**LimitRange** — unbounded pods are a cheap DoS
- [ ] Patch node OS and container runtime on a schedule

---

## Audit Logging & Detection

**Attack path:** an attacker with cluster-admin erases local logs and persists unseen.

- [ ] **Enable API server audit logging** and ship it **off-cluster** — an attacker with cluster-admin can erase local logs
- [ ] Alert on: `system:masters` use, new ClusterRoleBindings, `exec` into pods, Secret reads by unusual identities, failed auth spikes
- [ ] Deploy **runtime detection** (Falco or equivalent) for escape and crypto-mining behaviour
- [ ] Rehearse **credential revocation**: rotate tokens, certs, and cloud keys reachable from the cluster
