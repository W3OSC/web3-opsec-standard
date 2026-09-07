<!--
id: incident-response-readiness-organization-guide
type: GUIDE
scope: ORGANIZATION
-->

<div align="center">
  <h1>Incident Response Readiness Guide</h1>
  <p><em>Runbooks, damage control, and monitoring for when things go wrong</em></p>
</div>

---

## Overview

Incidents are won or lost before they happen. Attackers deliberately strike at vulnerable moments and count on panic; a prepared organization responds from a runbook while an unprepared one improvises. Readiness means three things, and this guide covers each: rehearsed procedures for the disasters you can anticipate, technical controls that contain damage fast, and monitoring that detects incidents early and cannot be silenced by the attacker.

---

## Incident Response Runbooks

Write detailed runbooks for anticipated disaster scenarios before you need them. The four below are a baseline for any Web3 organization.

### Multi-sig wallet compromise

Immediate actions:

- [ ] **Temporarily freeze the multi-sig contract**
- [ ] **Revoke compromised accounts** immediately
- [ ] **Re-provision devices for affected users** — laptops, hardware wallets, phones

Recovery:

- [ ] **Verify the integrity of the remaining signers**
- [ ] **Adjust the quorum through emergency procedures** to remove compromised accounts
- [ ] **Coordinate asset recovery** with the remaining trusted parties

### Unauthorized code deployment

Immediate actions:

- [ ] **Take the service offline** and freeze automated deployments
- [ ] **Revoke compromised accounts**
- [ ] **Roll back** to the last known authorized deployment

Recovery:

- [ ] **Audit deployment logs and access patterns**
- [ ] **Verify the integrity of the rollback version**
- [ ] **Recreate affected infrastructure instances**
- [ ] **Add deployment controls that would have prevented the abuse** — see the [Secure Deployments & Infrastructure Guide](deployments-infra-access-control.md)

### Endpoint compromise / malware infection

Immediate actions:

- [ ] **Revoke the compromised user's access to all services**
- [ ] **Quarantine the device** and create a snapshot image for forensic analysis
- [ ] **Wipe the device and re-provision account access**

Recovery:

- [ ] **Analyze the forensic image**
- [ ] **Review every action the compromised account took** — damage caused, and any spread to other devices, cloud assets, or repos
- [ ] **Strengthen endpoint monitoring and active firewalls** based on what was missed

### On-chain asset theft

Immediate actions:

- [ ] **Freeze the contract** if possible
- [ ] **Contact [SEAL 911](https://github.com/security-alliance/seal-911)** immediately
- [ ] **Identify attacker addresses** with basic forensics
- [ ] **Notify CEXs, DEX frontends, and other relevant parties** to blacklist attacker addresses

Recovery:

- [ ] **Engage blockchain forensics specialists**
- [ ] **Coordinate with law enforcement**
- [ ] **Upgrade or redeploy contracts** as needed

### Writing runbooks that work

- [ ] **Prescriptive steps** — detailed enough that any team member can execute them
- [ ] **Named roles and responsibilities** for each scenario
- [ ] **Decision trees** for the judgment calls
- [ ] **Current emergency contact lists** and escalation paths
- [ ] **Regular tabletop exercises**, with procedures updated from new threats and lessons learned
- [ ] **A trained team** — everyone knows their role before the incident, not during it

---

## Rapid Damage Control

These controls buy time during an incident: they contain the attacker and keep the business running while you execute a runbook.

### Deployment and access controls

**Fast rollbacks**

- [ ] **Accessible rollback mechanisms** for every deployment
- [ ] **Comprehensive version history** with verified clean states
- [ ] **Regularly tested rollback procedures** — a rollback that has never been rehearsed is a hope, not a control
- [ ] **Parallel deployment environments** maintained for rapid switching

**Account takeover response**

- [ ] **Access ripcords** — immediate revocation capabilities such as password manager lockouts, SSO account freezing, and consolidated access management services
- [ ] **2FA reset and re-enrollment** for affected accounts
- [ ] **Immediate permission stripping** — remove affected accounts from all critical systems at once

### Non-repudiation

- [ ] **Require signed commits** for all code changes to prevent impersonation
- [ ] **Keep tamper-proof, redundant logs** that cannot be suppressed or edited without triggering alarms
- [ ] **Keep comprehensive audit trails** for all privileged actions
- [ ] **Use cryptographic signatures for critical operations** where possible — e.g. PGP keys or wallet signatures

### Endpoint detection and response (EDR)

- [ ] **Deploy EDR agents on every organization member device** for real-time monitoring
- [ ] **Configure automated containment** for detected threats — locking down the OS, severing network and account access
- [ ] **Use proven solutions** — [CrowdStrike](https://www.crowdstrike.com/platform/endpoint-security/), [SentinelOne](https://www.sentinelone.com/surfaces/endpoint/), or [Wazuh](https://wazuh.com/) (open source) offer deep insight into system behavior, flagging and preventing compromises as they occur

### Backups and redundancy

**Database backups**

- [ ] **Multiple storage media and locations** — e.g. local plus cloud
- [ ] **Automated, verified backup procedures**
- [ ] **Regularly tested restoration**
- [ ] **Encryption with a key pair** — the public key encrypts; the private key stays locked away and is used only to restore

**Infrastructure redundancy**

- [ ] **Multiple availability zones** for all critical deployments
- [ ] **Fallback regions** maintained for disaster recovery
- [ ] **Robust load balancing and failover mechanisms**
- [ ] **Geographic distribution** of critical infrastructure

---

## Monitoring & Alerting

Detection only counts if the attacker cannot turn it off. Build logging that cannot be silently edited and alerting that cannot be silently missed.

### Immutable logging

- [ ] **Append-only log storage** — entries cannot be modified or deleted once written
- [ ] **Cryptographic integrity verification** — e.g. an HMAC attached to emitted logs when stored
- [ ] **Real-time replication** to a secure secondary location
- [ ] **Alerts on tampering** — any attempt to disable or modify logging pages someone
- [ ] **Monitored log access** — reads are logged and alerted on too
- [ ] **Retention policies** long enough for forensic analysis when needed

### Multi-channel alerting

- [ ] **At least three independent alert channels**:
  - [ ] A dedicated Telegram channel for security alerts
  - [ ] A Discord bot posting real-time notifications to a dedicated channel
  - [ ] Email alerts to multiple recipients
- [ ] **PagerDuty or equivalent** for critical alerts — consider physical pagers for emergency alarms
- [ ] **Mobile push notifications** for immediate awareness
- [ ] **Tiered severities with automatic escalation** — on-call confirms and checks in on unacknowledged alerts, or backups and managers get paged
- [ ] **Regular channel testing** so a dead webhook is found before the incident, not during it
- [ ] **Tuned false-positive rates** — alarms should trip rarely enough that every one is taken seriously

### Coverage

**Systems**

- [ ] **Infrastructure health** across all critical components
- [ ] **Application performance and availability**
- [ ] **Network traffic patterns** for anomalies
- [ ] **Resource utilization** and capacity planning

**Security**

- [ ] **Access patterns and privilege usage**
- [ ] **Failed authentication attempts** and suspicious activity
- [ ] **Data exfiltration indicators** — unusual transfer patterns
- [ ] **Real-time malware detection**
- [ ] **Frontend content changes and smart contract state anomalies** — Web3's highest-value tampering targets
