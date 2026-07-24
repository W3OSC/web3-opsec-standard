<!--
id: eks-organization-configuration
type: CONFIGURATION
scope: ORGANIZATION
-->

<div align="center">
  <img src="../../../../images/guides/eks.svg" alt="Amazon EKS Logo" width="64" height="64">
  <h2><a href="https://docs.aws.amazon.com/eks/latest/best-practices/security.html" target="_blank" rel="noopener noreferrer">EKS</a> Configuration Guide</h2>
  <p><em>Amazon EKS Hardening — IAM Escalation, Credential Theft & Lateral Movement</em></p>
</div>

---

EKS-specific controls on top of the [Kubernetes](https://kubernetes.io/docs/concepts/security/security-checklist/) baseline. The dominant EKS attack path is **Kubernetes access → AWS IAM credentials → the rest of the account**. Based on the [EKS Security Best Practices](https://docs.aws.amazon.com/eks/latest/best-practices/security.html).

---

## Control Plane Access

**Attack path:** a public API server or an unencrypted etcd snapshot exposes the whole cluster.

- [ ] **Disable the public API endpoint** and use private access, or restrict `publicAccessCidrs` to known admin ranges — never `0.0.0.0/0`
- [ ] Reach the cluster over **VPN, Direct Connect, or a bastion** in the VPC
- [ ] Enable **envelope encryption of Secrets with a KMS CMK** so etcd contents are not readable from a snapshot
- [ ] Keep the cluster on a **supported EKS version**; upgrades are your responsibility

---

## Cluster Authentication & IAM

**Attack path:** an over-broad IAM principal or `aws-auth` entry grants instant cluster-admin.

- [ ] Migrate from **`aws-auth` ConfigMap to [Access Entries](https://docs.aws.amazon.com/eks/latest/userguide/access-entries.html)** — a single bad ConfigMap edit otherwise grants cluster-admin
- [ ] Audit who maps to **`system:masters`**; the cluster creator IAM principal has permanent admin — know who that is
- [ ] Restrict the IAM actions **`eks:AccessKubernetesApi`**, `eks:DescribeCluster`, and cluster-modifying calls
- [ ] Require **MFA** for human principals that can reach the cluster

---

## Workload Identity (IRSA / Pod Identity)

**Attack path:** pods inheriting the node role get every permission the node has.

- [ ] Use **[EKS Pod Identity](https://docs.aws.amazon.com/eks/latest/userguide/pod-identity.html)** or **IRSA** so each workload gets its own scoped role
- [ ] **Strip the node instance role to the minimum** (`AmazonEKSWorkerNodePolicy`, CNI, ECR read) — never attach app or admin policies
- [ ] Scope IRSA trust policies to a **specific namespace and ServiceAccount**, not a wildcard
- [ ] Never bake **long-lived AWS access keys** into images, env vars, or manifests

---

## Instance Metadata (IMDS) — Credential Theft

**Attack path:** any pod-level SSRF/RCE reads the node role credentials from IMDS.

- [ ] **Enforce IMDSv2** (`HttpTokens: required`) on all node groups
- [ ] Set the **hop limit to 1** (`HttpPutResponseHopLimit: 1`) so containers cannot reach IMDS
- [ ] Or **block `169.254.169.254`** egress from pods via NetworkPolicy/iptables
- [ ] Prefer **Bottlerocket** or EKS-optimized AMIs, kept patched

---

## Network Segmentation

**Attack path:** a compromised pod reaches every service and node in the VPC.

- [ ] Place nodes in **private subnets**; no public IPs on worker nodes
- [ ] Enforce **default-deny NetworkPolicy** (VPC CNI network policy, Calico, or Cilium)
- [ ] Use **security groups for pods** to isolate sensitive workloads at the ENI level
- [ ] Restrict node **security groups** to required ports only; no broad `0.0.0.0/0` ingress
- [ ] Control **egress** (NAT/firewall) so a compromised pod cannot exfiltrate freely

---

## Pod Security

**Attack path:** a privileged or host-namespaced pod escapes to the node and its IAM role.

- [ ] Enforce **Pod Security Admission `restricted`**; block privileged, hostPath, hostNetwork, hostPID
- [ ] **Disable ServiceAccount token automount** where not needed
- [ ] Run **non-root**, read-only root filesystem, all capabilities dropped, `seccompProfile: RuntimeDefault`
- [ ] Consider **Fargate** for hostile or untrusted workloads — no shared node kernel

---

## Images & Supply Chain

**Attack path:** a poisoned or unpinned image runs attacker code on every node.

- [ ] Use **private ECR** repositories; block public registries at admission
- [ ] Enable **ECR enhanced scanning** and fail deployments on critical findings
- [ ] **Pin digests**, set `imagePullPolicy: Always` for mutable tags
- [ ] Enforce **image signature verification** at admission

---

## Detection & Response

**Attack path:** without audit logs and runtime signals, IAM abuse and container escapes go unnoticed.

- [ ] Enable **EKS control plane logging** (api, audit, authenticator) to CloudWatch and ship off-account
- [ ] Enable **GuardDuty EKS Protection** (audit log monitoring **and** Runtime Monitoring)
- [ ] Alert on: `system:masters` use, new ClusterRoleBindings, `exec` into pods, `aws-auth`/access-entry changes, AssumeRole from unexpected pods
- [ ] Enable **CloudTrail** for EKS API calls; store in a separate, restricted account
- [ ] Rehearse **credential revocation** — rotate IRSA roles, node roles, and any keys reachable from the cluster
