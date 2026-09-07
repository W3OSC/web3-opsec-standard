<!--
id: deployments-infra-access-control-organization-guide
type: GUIDE
scope: ORGANIZATION
-->

<div align="center">
  <h1>Secure Deployments & Infrastructure Guide</h1>
  <p><em>CI/CD pipelines, just-in-time access, and break-glass response</em></p>
</div>

---

## Overview

Deployment pipelines and cloud consoles concentrate the permissions attackers want most: the ability to ship code, change infrastructure, and reach production data. The goal of this guide is a setup where no human holds standing deployment power — routine changes flow through automation and peer-reviewed, time-boxed access grants, while a tightly controlled break-glass path preserves your ability to respond to emergencies in minutes.

For the monitoring, alerting, and runbooks that back these controls, see the [Incident Response Readiness Guide](incident-response-readiness.md).

---

## Normal Operations

Day-to-day infrastructure work should be as controlled as possible; the controls below make privileged abuse both difficult and visible.

### Access control principles

**Automation first**

- [ ] **Confine deployment permissions to automated service accounts** running on locked-down cloud compute — no human accounts hold standing deployment or infrastructure-change permissions
- [ ] **Define all infrastructure as code** (e.g. Terraform) to support hands-off infrastructure management
- [ ] **Route exceptional manual actions through peer-reviewed JIT requests or break-glass accounts** — never ad-hoc grants

**Minimum permissions**

- [ ] **Give operators read-only access by default** — enough to monitor assets and assess needed changes
- [ ] **Apply least privilege across every infrastructure component**
- [ ] **Grant elevated permissions only temporarily**, with just enough time to complete the privileged task

### Just-in-time (JIT) access

- [ ] **Require an approved work-order ticket for every state-changing operation** — via a system like Jira, Linear, or Monday
- [ ] **Require at least two approvals from reviewers other than the implementer** — reviewers scrutinize the requested permissions against the work to be done and cut them to the absolute minimum
- [ ] **Grant access for the minimum window required** and revoke it automatically when the window closes
- [ ] **Scope each grant to the specific change** — never a standing role

Platform setup: [AWS JIT node access](https://aws.amazon.com/blogs/mt/introducing-just-in-time-node-access-using-aws-systems-manager/) · [AWS temporary elevated access](https://aws.amazon.com/blogs/security/temporary-elevated-access-management-with-iam-identity-center/) · [GCP JIT Groups](https://googlecloudplatform.github.io/jit-groups/) · [Okta Privileged Access](https://www.okta.com/products/privileged-access/)

### Change management

- [ ] **Test in dev/staging first** — validate every change against security invariants before it reaches production
- [ ] **Verify after implementation** — approvers confirm the deployed state matches what was approved (e.g. on-chain contract deployment state)
- [ ] **Document every change** with enough detail to roll back quickly
- [ ] **Schedule changes into designated windows**, and alert on any change that occurs outside them

---

## Emergency Response

Ticket-based approval is too slow for an active incident. A break-glass path bypasses it — deliberately, loudly, and with consequences designed in.

### Break-glass account setup

- [ ] **One account per person** — tied to an individual identity, never shared
- [ ] **One account per service** — cloud infrastructure, GitHub, deployment runners each get their own; no SSO bundling or credential reuse, so one account's compromise cannot unlock the rest
- [ ] **Elevated but bounded privileges** — e.g. write access to existing assets without full admin
- [ ] **Credentials held in a dedicated password manager vault** behind three factors: password, TOTP code or passkey, and biometric verification

### After every use

- [ ] **Alarm the whole team automatically** the moment break-glass credentials are accessed
- [ ] **Require a post-mortem write-up** for every use, explicitly checking for abuse
- [ ] **Rotate credentials and completely re-provision the account** after each use

### Guardrails and trade-offs

- [ ] **Tie break-glass eligibility to real triggers where feasible** — an active alarm (uptime, forced deployment, ongoing attack) should normally precede its use
- [ ] **Route break-glass alerts to a dedicated, non-suppressible channel** — or at minimum a severity level that cannot be neglected
- [ ] **Require two-party authorization** when instant response is not absolutely needed and slight coordination delay can be tolerated
- [ ] **Consider a short challenge period** (15–30 minutes) during which other users can veto access; every sensitive manual operation should be well justified
- [ ] **Pre-model each account's permissions** — minimally permissive while still enabling recovery (e.g. able to roll back to a previous compute image, but not force-deploy new ones)
- [ ] **Maintain incident runbooks for common scenarios** so responders rarely need improvised privileged access — see the [Incident Response Readiness Guide](incident-response-readiness.md)
