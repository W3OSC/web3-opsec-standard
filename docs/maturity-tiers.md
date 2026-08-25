# W3OS Maturity Tiers

**Status:** Draft v1 — tier assignments proposed for review. Once agreed, tiers can be tagged inline in the requirement files and surfaced as a filter in the interactive tracker.

Every peer framework levels its content (DARC: 2 tiers; CCSS: 3 levels; Digibastion: 4 levels). W3OS tiers let organizations adopt the standard progressively instead of facing all 136 controls at once.

## Tier Definitions

- **Baseline** — the minimum for any organization holding digital assets. These controls prevent the catastrophic, well-precedented failure modes (key theft, blind signing, account takeover, no incident plan). A small team should be able to reach full Baseline in weeks.
- **Standard** — the expected posture for a funded, operating web3 organization. Adds process depth: monitoring, lifecycle management, change control, verification procedures.
- **Advanced** — for organizations with large treasuries, high public profile, or elevated threat models (exchanges, bridges, major protocols). Adds defense-in-depth that carries real operational cost.

Tiers are cumulative: Standard includes Baseline; Advanced includes both.

## Tier Assignments

### Domain 1: Wallet & Multi-Sig Management

| Control | Title | Tier |
|---|---|---|
| SP-WM-001 | Authentic Hardware Procurement | Baseline |
| SP-WM-002 | Hardware Wallet Features | Baseline |
| SP-WM-003 | Mnemonic Seed Phrase Protection | Baseline |
| SP-WM-004 | Dedicated Wallet Addresses | Standard |
| SP-WM-005 | Physical Security | Baseline |
| SP-WM-006 | Multi-sig Usage | Baseline |
| SP-WM-007 | Quorum Selection | Baseline |
| SP-WM-008 | Transaction Time Locks | Standard |
| SP-WM-009 | Multi-Device Verification | Standard |
| SP-WM-010 | On-device Verification | Baseline |
| SP-WM-011 | Hot Wallet Usage | Baseline |
| SP-WM-012 | Wallet Segregation | Standard |
| SP-WM-013 | Address Whitelisting | Standard |
| SP-WM-014 | Out-of-Band Confirmation | Standard |
| SP-WM-015 | Dedicated Signing Machines | Advanced |
| SP-WM-016 | Continuous Monitoring | Standard |
| SP-WM-017 | Self-hosted Multi-sig UI | Advanced |
| SP-WM-018 | Transaction Simulation | Standard |
| SP-WM-019 | External Party Security Monitoring | Advanced |
| SP-WM-020 | Key Generation Procedures | Standard |
| SP-WM-021 | Backup Distribution and Recovery Testing | Standard |
| SP-WM-022 | Key Compromise Protocol | Baseline |
| SP-WM-023 | Signer Lifecycle Management | Standard |

### Domain 2: Endpoint Security

| Control | Title | Tier |
|---|---|---|
| SP-EP-001 | Dedicated Devices | Baseline |
| SP-EP-002 | Device Supply Chain Security | Standard |
| SP-EP-003 | Device Configuration | Baseline |
| SP-EP-004 | Secure Device Usage | Baseline |
| SP-EP-005 | Home Network Security | Standard |
| SP-EP-006 | Endpoint Detection and Response (EDR) | Standard |
| SP-EP-007 | Network Monitoring and Firewall | Advanced |
| SP-EP-008 | Malware Detection | Baseline |
| SP-EP-009 | Browser Security and Isolation | Baseline |
| SP-EP-010 | Secure External File Interaction | Standard |
| SP-EP-011 | Browser Extension and Plugin Vetting | Standard |
| SP-EP-012 | Secure Workspace Requirements | Standard |
| SP-EP-013 | Remote Work Physical Security | Standard |

### Domain 3: Communications & Social Media

| Control | Title | Tier |
|---|---|---|
| SP-CS-001 | Multi-Factor Authentication for All Accounts | Baseline |
| SP-CS-002 | Account Recovery Protection | Baseline |
| SP-CS-003 | End-to-End Encrypted Channels | Baseline |
| SP-CS-004 | Email Authentication | Standard |
| SP-CS-005 | External Party Verification | Baseline |
| SP-CS-006 | Secure File Sharing and Viewing | Standard |
| SP-CS-007 | Critical Operations Confirmations | Baseline |
| SP-CS-008 | Organization Identity | Standard |

### Domain 4: DevOps & Infrastructure

| Control | Title | Tier |
|---|---|---|
| SP-DI-001 | Isolated Development Environments | Standard |
| SP-DI-002 | IDE Plugin Security | Standard |
| SP-DI-003 | Repository Security Controls | Baseline |
| SP-DI-004 | Source Code Secret Scanning | Baseline |
| SP-DI-005 | Package Verification and Integrity | Standard |
| SP-DI-006 | Typosquatting Detection and Prevention | Advanced |
| SP-DI-007 | Dependency Management and Scanning | Standard |
| SP-DI-008 | Enhanced Code Review for External Contributors | Standard |
| SP-DI-009 | Secure Secrets Storage | Baseline |
| SP-DI-010 | Pipeline Access Controls | Standard |
| SP-DI-011 | Infrastructure as Code (IaC) | Advanced |
| SP-DI-012 | Infrastructure Access Controls | Baseline |
| SP-DI-013 | Break-Glass Accounts | Standard |
| SP-DI-014 | Backup and Disaster Recovery | Standard |
| SP-DI-015 | Cloud Service Provider Security | Standard |
| SP-DI-016 | Contract State Monitoring | Standard |
| SP-DI-017 | Frontend Content Protection | Standard |
| SP-DI-018 | Frontend Build Integrity | Advanced |
| SP-DI-019 | Frontend Compromise Response | Standard |
| SP-DI-020 | Registrar Account Security | Baseline |
| SP-DI-021 | DNS Change Control | Standard |
| SP-DI-022 | Certificate and DNS Monitoring | Standard |

### Domain 5: General Security

| Control | Title | Tier |
|---|---|---|
| SP-GS-001 | Comprehensive Incident Response Runbook | Baseline |
| SP-GS-002 | Web3-Specific Response Procedures | Baseline |
| SP-GS-003 | Incident Response Controls | Standard |
| SP-GS-004 | Immutable Incident Monitoring and Alerting | Advanced |
| SP-GS-005 | Phishing Simulation and Testing | Standard |
| SP-GS-006 | Social Engineering Prevention | Baseline |
| SP-GS-007 | Security Ownership | Baseline |
| SP-GS-008 | Password Management | Baseline |
| SP-GS-009 | Account Sharing | Baseline |
| SP-GS-010 | Principle of Least Privilege | Baseline |
| SP-GS-011 | Login Methods | Standard |
| SP-GS-012 | Superadmin Break Glass Accounts | Standard |
| SP-GS-013 | SIM Swap Mitigation | Baseline |
| SP-GS-014 | Malicious Insider Threat Modeling | Advanced |
| SP-GS-015 | Insider Access Minimization | Standard |
| SP-GS-016 | Third Party Access Management | Standard |
| SP-GS-017 | Enhanced Identity Verification for Remote Workers | Standard |
| SP-GS-018 | Leaked Credential Monitoring | Standard |
| SP-GS-019 | Compromised Accounts Monitoring | Standard |
| SP-GS-020 | Asset Inventory | Baseline |
| SP-GS-021 | Written Security Policy | Baseline |
| SP-GS-022 | Risk Register | Advanced |
| SP-GS-023 | Onboarding Security Checklist | Standard |
| SP-GS-024 | Offboarding and Termination | Baseline |
| SP-GS-025 | Media Sanitization and Disposal | Standard |

### Domain 6: Financial Controls & Banking Security

| Control | Title | Tier |
|---|---|---|
| SP-FC-001 | Financial Platform Authentication | Baseline |
| SP-FC-002 | Principle of Least Privilege for Financial Access | Baseline |
| SP-FC-003 | Dedicated Financial Devices | Advanced |
| SP-FC-004 | Dual Authorization for Outbound Payments | Baseline |
| SP-FC-005 | Tiered Transaction Approval Thresholds | Standard |
| SP-FC-006 | Separation of Financial Duties | Standard |
| SP-FC-007 | Out-of-Band Payment Confirmation | Baseline |
| SP-FC-008 | Payment Recipient Whitelisting | Standard |
| SP-FC-009 | Business Email Compromise Resistance | Baseline |
| SP-FC-010 | Operational Account Segregation | Standard |
| SP-FC-011 | Third-Party Custodian Selection | Standard |
| SP-FC-012 | Real-Time Transaction Monitoring | Standard |
| SP-FC-014 | Financial Incident Response Runbook | Standard |
| SP-FC-015 | Emergency Account Freeze Capability | Standard |
| SP-FC-016 | Treasury Spending Policy | Standard |
| SP-FC-017 | Treasury Concentration Limits | Advanced |
| SP-FC-018 | Custody Platform Configuration | Standard |
| SP-FC-019 | Treasury Reconciliation | Standard |
| SP-FC-020 | Protocol Due Diligence for Treasury Deployments | Standard |
| SP-FC-021 | Inbound Payment Controls | Standard |

### Domain 7: AI Agent Operational Security

| Control | Title | Tier |
|---|---|---|
| SP-AI-001 | Approved Agent Tooling | Baseline |
| SP-AI-002 | Agent Extension Vetting | Baseline |
| SP-AI-003 | Agent Session Profiles | Standard |
| SP-AI-004 | Agent Credential Handling | Baseline |
| SP-AI-005 | Pipeline Configuration Approval | Standard |
| SP-AI-006 | Agent Production Reachability | Standard |
| SP-AI-007 | Published Sandbox Baseline | Advanced |

### Domain 8: Smart Contract & Protocol Operations

| Control | Title | Tier |
|---|---|---|
| SP-SC-001 | Pre-Deployment Audit Coverage | Baseline |
| SP-SC-002 | Audit Finding Resolution | Baseline |
| SP-SC-003 | Re-Audit Triggers | Standard |
| SP-SC-004 | Audit Coverage Tracking | Standard |
| SP-SC-005 | Documented Deployment Procedures | Standard |
| SP-SC-006 | Deployment Verification | Baseline |
| SP-SC-007 | Deployment Key Security | Standard |
| SP-SC-008 | Privileged Function Documentation | Baseline |
| SP-SC-009 | Timelocks and Pause Mechanisms | Standard |
| SP-SC-010 | Upgrade Governance | Standard |
| SP-SC-011 | Emergency On-Chain Authority | Standard |
| SP-SC-012 | Security Contact | Baseline |
| SP-SC-013 | Bug Bounty Program | Standard |
| SP-SC-014 | Governance Proposal Security | Standard |
| SP-SC-015 | Governance Attack Monitoring | Advanced |
| SP-SC-016 | Oracle Configuration | Standard |
| SP-SC-017 | Bridge Exposure Management | Advanced |
| SP-SC-018 | RPC Provider Redundancy | Standard |

## Summary

| Tier | Controls |
|---|---|
| Baseline | 47 |
| Standard | 71 |
| Advanced | 18 |
| **Total** | **136** |
