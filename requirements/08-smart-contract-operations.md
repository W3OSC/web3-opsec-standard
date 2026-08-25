# Domain 8: Smart Contract & Protocol Operations

## Risks

- R-SC-001: Unaudited Code Deployment
- R-SC-002: Deployed Bytecode Mismatch With Audited Source
- R-SC-003: Deployer Key Compromise
- R-SC-004: Unprotected Privileged Functions
- R-SC-005: Malicious or Rushed Upgrades
- R-SC-006: Missing Emergency Pause Capability
- R-SC-007: Undisclosed Vulnerability With No Intake Channel
- R-SC-008: Governance Takeover via Flash-Loan Voting
- R-SC-009: Malicious Governance Proposal Payloads
- R-SC-010: Oracle Manipulation or Staleness
- R-SC-011: Bridge Compromise Exposure
- R-SC-012: RPC Provider Failure or Censorship
- R-SC-013: Upgrade Without Re-Audit
- R-SC-014: Unresolved Audit Findings in Production

### **Audit Lifecycle**

**SP-SC-001: Pre-Deployment Audit Coverage**
- All smart contracts must undergo at least one independent external security audit before mainnet deployment
- Audit scope must cover every contract that will be deployed, including libraries, proxies, and initialization/migration scripts
- Final audit reports must be retained internally and should be published publicly to support user due diligence
- Audit firms should be selected based on demonstrated expertise with the protocol's specific stack (language, chain, and contract patterns)

**SP-SC-002: Audit Finding Resolution**
- All critical and high severity audit findings must be resolved before mainnet deployment
- Every audit finding must be tracked in a findings register through to resolution or a documented, risk-accepted rationale
- Fixes for critical and high severity findings must be verified by the original auditor (or another qualified external reviewer) before deployment
- Medium and lower severity findings that are accepted rather than fixed must have a documented justification approved by security leadership

**SP-SC-003: Re-Audit Triggers**
- Any major contract upgrade must trigger a re-audit of the changed code and its interactions before deployment
- Deployment of new core contracts must require a new audit engagement covering the new code
- Changes to trust assumptions (e.g. new privileged roles, new external dependencies, modified access control) must trigger a re-audit even if code changes are small
- Re-audit trigger criteria must be documented so that the decision is not left to ad-hoc judgment under deadline pressure

**SP-SC-004: Audit Coverage Tracking**
- An audit applicability matrix must be maintained mapping every deployed contract (by address and commit hash) to the audit report(s) that cover it
- The matrix must be updated as part of every deployment and upgrade process
- Any deployed code not covered by an audit must be explicitly flagged in the matrix with a remediation plan
- The audit coverage matrix should be reviewed at least quarterly to catch drift between audited code and production deployments

### **Deployment Operations**

**SP-SC-005: Documented Deployment Procedures**
- A written deployment procedure must exist covering the full progression from testnet to staging/canary to mainnet
- All deployments must be simulated in a mainnet-fork environment before execution, with expected state changes verified against the simulation output
- Every deployment plan must include a documented rollback or mitigation plan for deployment failure scenarios
- Deployment steps should be scripted and repeatable rather than performed manually, with scripts version-controlled and peer reviewed

**SP-SC-006: Deployment Verification**
- Contract source code must be published and verified on relevant block explorers immediately after deployment
- Deployed bytecode must be verified to match a build of the exact audited commit before the contract is put into production use
- Verification of the bytecode-to-audited-commit match must be performed by at least one person who did not execute the deployment
- Official contract addresses must be published through the organization's authenticated channels (docs site, verified social accounts) to prevent address-spoofing attacks

**SP-SC-007: Deployment Key Security**
- Deployments must use dedicated deployer keys that hold no privileged roles and are never reused as admin, upgrade, or treasury keys
- Deployer keys must be rotated or permanently retired after the deployment they were created for is complete
- Deployer keys must be generated and stored on hardware wallets or equivalent secure key management, never in plaintext in CI systems or developer machines
- Deployments of critical contracts should be executed as a multi-party ceremony, with at least two people independently verifying each transaction before broadcast
- Any privileged roles temporarily assigned to a deployer address during setup must be transferred to the proper multi-sig or governance contract before the deployment is declared complete

### **Privileged Function Governance**

**SP-SC-008: Privileged Function Documentation**
- Every privileged function across all deployed contracts must be documented in a central register, including the function signature, the contract it lives on, and its potential impact
- The register must record which address or role holds each privilege and the access control mechanism enforcing it (multi-sig, timelock, governance, EOA)
- No privileged function should be controlled by a single externally-owned account
- The privileged function register must be reviewed after every deployment or upgrade and at least quarterly

**SP-SC-009: Timelocks and Pause Mechanisms**
- Privileged operations that can affect user funds or protocol behavior must execute behind a timelock to provide reaction time for users and monitors
- Critical contracts must implement a pause or circuit-breaker mechanism, and the pause path must be tested on a fork or testnet at least annually
- Emergency functions (pause, guardian actions) must require multi-sig authorization, and every emergency execution must undergo a documented post-execution review
- Timelock and pause configurations (delays, authorized addresses) must be monitored for changes, with alerts on any modification

**SP-SC-010: Upgrade Governance**
- A documented upgrade policy must define who may propose upgrades, who approves them, and the required approval quorum
- All upgrades must pass through the standard timelock, with the delay duration formally documented and long enough for meaningful external review
- Users must be given advance notice of upgrades through official channels, including a description of what is changing and when it takes effect
- Upgrade proposals must reference the exact commit hash and audit report covering the new implementation
- Emergency expedited upgrade paths, if they exist, must be documented, require a higher approval quorum, and trigger mandatory post-hoc review

**SP-SC-011: Emergency On-Chain Authority**
- A designated emergency authority (guardian multi-sig or security council) must exist with documented power to execute emergency on-chain actions
- Emergency authority members must be reachable 24/7 through documented, redundant contact channels with a defined escalation order
- Emergency response procedures must be rehearsed at least annually through drills that exercise the actual signing path end-to-end
- The scope of emergency powers must be explicitly documented and limited to defensive actions (e.g. pause), not arbitrary state changes

### **Vulnerability Disclosure**

**SP-SC-012: Security Contact**
- A security contact must be published via security.txt on the organization's domain and a SECURITY.md file in public code repositories
- The security intake channel must be actively monitored, with a documented internal owner responsible for triage
- A response SLA must be defined and published, acknowledging incoming vulnerability reports within a stated timeframe (48 hours or less is recommended)
- An encrypted reporting option (PGP key or a platform with encrypted submission) should be provided for sensitive reports

**SP-SC-013: Bug Bounty Program**
- A public bug bounty program must be maintained with tiered rewards proportional to severity and funds at risk
- The bounty program must define its scope explicitly, listing in-scope contract addresses and out-of-scope issues
- Patch SLAs must be defined per severity level, with critical vulnerabilities patched or mitigated on an emergency timeline
- Bounty payout decisions should follow a published severity rubric to keep reward outcomes predictable and credible to researchers
- The program scope and reward tiers must be reviewed and updated after every major deployment

### **On-Chain Governance Security**

**SP-SC-014: Governance Proposal Security**
- All governance proposals must have a minimum review period between submission and voting to allow community and internal scrutiny
- Proposal payloads (calldata) must be decoded, verified, and simulated against a mainnet fork before votes are cast, with results published for voters
- Quorum requirements must be set high enough that proposals cannot pass with trivially acquirable voting power
- Proposals whose executed payload differs from the described intent must be treated as malicious and vetoed or cancelled through documented mechanisms
- Internal signers or delegates must never vote on a proposal whose payload they have not independently verified

**SP-SC-015: Governance Attack Monitoring**
- Token delegation patterns must be monitored, with alerts on large or rapid shifts in delegated voting power
- Monitoring must detect flash-loan-style voting patterns, such as large token acquisitions immediately before proposal snapshots
- Abnormal proposal activity (unusual submission timing, unknown proposers, near-quorum proposals with low visibility) must trigger alerts to the security team
- Alerts should be delivered through at least two redundant channels, and a documented response procedure must exist for suspected governance attacks

### **Protocol Dependencies**

**SP-SC-016: Oracle Configuration**
- All oracle dependencies must be documented, including provider, update frequency, deviation thresholds, and heartbeat intervals
- Contracts consuming oracle data must handle staleness explicitly, rejecting or safely degrading on prices older than a defined threshold
- Redundant or fallback oracle sources should be configured for price feeds critical to protocol solvency
- Oracle feed health (update cadence, deviation from reference markets) must be continuously monitored with alerting on anomalies
- Oracle configuration changes must go through the same review and approval process as contract upgrades

**SP-SC-017: Bridge Exposure Management**
- Total value exposed to each bridge must be tracked, with documented exposure limits per bridge
- Bridge dependencies must be monitored for security incidents, governance changes, and abnormal flows affecting the bridged assets
- A documented emergency exit plan must exist for each bridge dependency, describing how to withdraw or freeze exposure if the bridge is compromised
- New bridge integrations must undergo a documented risk assessment (audit history, validator/relayer trust model, incident record) before adoption

**SP-SC-018: RPC Provider Redundancy**
- Protocol operations and monitoring infrastructure must use at least two independent RPC providers
- Automatic failover between RPC providers must be configured and tested at least annually
- Critical operations (deployments, emergency actions) should have a documented fallback path, including self-hosted node access, in case commercial providers fail or censor transactions
- RPC provider responses for critical reads should be cross-checked across providers to detect inconsistent or manipulated data
