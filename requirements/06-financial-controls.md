# Domain 6: Financial Controls & Banking Security

## Risks

- R-FC-001: Unauthorized Wire or ACH Transfer
- R-FC-002: Social Engineering of Financial Personnel
- R-FC-003: Fraudulent Payment Authorization
- R-FC-004: Single Point of Failure in Payment Approval
- R-FC-005: Account Takeover of Banking Portals
- R-FC-006: Insider Theft or Misappropriation of Funds
- R-FC-007: Business Email Compromise Leading to Payment Fraud
- R-FC-008: Unmonitored or Undetected Financial Anomalies
- R-FC-009: Lack of Financial Incident Response Readiness
- R-FC-010: Inadequate Segregation of Financial Duties
- R-FC-011: Overly Broad Access to Financial Accounts
- R-FC-012: Insufficient Controls on High-Value Transactions
- R-FC-013: Unvetted Payment Recipients
- R-FC-014: Treasury Overexposure to a Single Wallet, Chain, or Custodian
- R-FC-015: Undetected Treasury Balance Discrepancies
- R-FC-016: Treasury Loss From Unvetted Protocol Deployments
- R-FC-017: Inbound Payment Misdirection

### **Account Security & Access Control**

**SP-FC-001: Financial Platform Authentication**
- All banking and financial service portals must require strong multi-factor authentication
- Hardware security keys (FIDO2) are strongly recommended as the primary MFA method for financial accounts
- SMS-based MFA must not be used for banking portals due to SIM swap risk
- Password manager-generated, unique passwords must be used for all financial portal accounts
- Shared financial portal credentials must never be used - each authorized user must have their own individual login

**SP-FC-002: Principle of Least Privilege for Financial Access**
- Access to financial accounts and banking portals must be limited to the minimum personnel necessary
- View-only access should be granted to personnel who require visibility but do not initiate or approve transactions
- Full administrative access must be restricted to a small set of highly trusted individuals
- Financial portal access should be reviewed and revalidated quarterly, and immediately upon any personnel changes
- Access must be revoked immediately upon any team member departure

**SP-FC-003: Dedicated Financial Devices**
- Financial portal access and payment approvals should be performed on devices dedicated exclusively to financial operations
- Dedicated financial devices must not be used for general browsing, email, or any other purpose
- Financial operations must not be performed over public or untrusted networks
- A trusted VPN must be used when accessing financial portals remotely
- Active network monitoring tools should be installed on dedicated financial devices to detect anomalous outbound traffic
- Financial portal accounts must be accessed only through bookmarked, verified URLs and never through links in emails or messages

### **Multi-Party Authorization & Approval**

**SP-FC-004: Dual Authorization for Outbound Payments**
- All outbound payments, wire transfers, and ACH transactions must require approval from at least two authorized individuals
- A single person must never have the unilateral ability to initiate and approve a payment
- Approval authority must be enforced at the banking platform level, not solely through internal policy
- For organizations with three or fewer financial approvers, all available approvers should be required to confirm high-value transactions

**SP-FC-005: Tiered Transaction Approval Thresholds**
- Transaction approval requirements must scale with transaction value:
  - Low-value routine transactions may require single approval but must be within a pre-approved recurring payment structure
  - Mid-value transactions must require dual approval from designated financial approvers
  - High-value transactions must require three or more approvals
- Threshold values must be formally defined, documented, and enforced
- Any single transaction above the high-value threshold must require an out-of-band verbal or video confirmation between approvers before final authorization

**SP-FC-006: Separation of Financial Duties**
- The roles of payment initiator and payment approver must be held by separate individuals
- No single individual should control the full payment lifecycle from request through execution
- For small teams where strict separation is not always possible, compensating controls must be in place:
  - Mandatory post-hoc review of all transactions by a non-initiating party
  - Immutable automated transaction alerts delivered to all financial stakeholders

**SP-FC-007: Out-of-Band Payment Confirmation**
- All high-value or non-routine payment requests must be verbally confirmed through a trusted, separate communication channel (e.g. phone call or video call) before approval
- Out-of-band confirmation must independently verify: recipient identity, exact payment amount, destination account details, and stated purpose
- Confirmation must never rely solely on email, chat, or any channel through which the original payment request was made
- Approvers must be trained to independently verify the identity of anyone requesting a financial action, even if the request appears to come from a known colleague or executive

### **Recipient & Vendor Controls**

**SP-FC-008: Payment Recipient Whitelisting**
- All recurring payment recipients must be added to an approved whitelist, enforced at the platform level
- First-time payments to new recipients must require elevated approval - at minimum one additional approver beyond the standard quorum
- Changes to existing whitelisted recipient details (bank account number, routing number, address) must be treated as a new recipient and require the full new-recipient approval process
- Whitelist additions and modifications must be logged and reviewed by a party separate from the person who initiated the change

**SP-FC-009: Business Email Compromise Resistance**
- Any email-based payment request must be treated as unverified until independently confirmed through a separate channel
- Urgency-framed payment requests must trigger increased scrutiny and mandatory out-of-band confirmation regardless of the apparent sender
- Domain lookalike monitoring should be in place to detect impersonation attempts against the organization's domain

### **Account Structure & Segregation**

**SP-FC-010: Operational Account Segregation**
- Operating funds must be held separately from reserve or emergency capital
- Day-to-day operational expenses should be funded from a lower-balance operating account, with transfers in from reserves as needed
- Reserve accounts must have more restrictive transaction controls and approval requirements than operating accounts

**SP-FC-011: Third-Party Custodian Selection**
- Banking and financial services partners must be evaluated for security features prior to onboarding, including:
  - Multi-user approval workflows
  - Role-based access controls
  - FIDO2/hardware key MFA support
  - Immutable transaction audit logs
  - Real-time transaction alerting
- Preference should be given to institutions that natively support dual-control transaction authorization

### **Monitoring**

**SP-FC-012: Real-Time Transaction Monitoring**
- Real-time transaction alerts must be configured for all financial accounts
- Alerts must be delivered to at least two separate individuals through at least two separate channels (e.g. email and a team messaging platform)
- Alert delivery channels must be immutable and redundant such that disabling one channel would trigger a notification on the other
- All alerts must include: transaction amount, recipient account details, initiator identity, and timestamp

### **Incident Response & Emergency Controls**

**SP-FC-014: Financial Incident Response Runbook**
- A documented financial incident response plan must exist
- The runbook must include procedures for:
  - Immediately freezing or suspending outbound payment capabilities
  - Contacting banking partners to recall or reverse unauthorized transfers
  - Preserving evidence and audit trails for investigation

**SP-FC-015: Emergency Account Freeze Capability**
- Organizations must know and document the exact process to immediately freeze outbound transactions for every financial account they hold
- Emergency freeze contact details for all banking partners must be maintained in a secure, offline document accessible to admins

### **Crypto Treasury Operations**

**SP-FC-016: Treasury Spending Policy**
- A documented spending policy must exist for every treasury wallet, defining its purpose, authorized spenders, and spending limits
- Spending limits must be tiered, with transactions above defined thresholds requiring timelocks or additional approvals
- Per-signer and per-automation movement ceilings must be defined and enforced so that no single key or automated process can move more than its authorized limit
- The spending policy must be reviewed and reapproved whenever wallet purpose, signers, or automation changes

**SP-FC-017: Treasury Concentration Limits**
- Concentration caps must be defined for the maximum share of treasury value held in any single wallet, on any single chain, and with any single custody provider
- Exceptions to concentration caps must require documented approval from designated financial stakeholders before funds are moved
- Treasury exposure must be periodically reviewed against the defined caps, with rebalancing actions documented when caps are exceeded

**SP-FC-018: Custody Platform Configuration**
- Custody and multisig platform policies must enforce separation of duties so that transaction initiators cannot unilaterally approve their own transactions
- Platform-level value caps and destination address allowlists must be configured for treasury wallets
- Any change to custody platform policies (approvers, limits, allowlists) must require re-authentication and approval by a party separate from the requester
- IP allowlisting should be enabled for custody platform access where the provider supports it
- Custody arrangements, including platform, policy configuration, and responsible owners, must be documented for every treasury wallet

**SP-FC-019: Treasury Reconciliation**
- On-chain treasury balances must be reconciled against internal financial records at a defined frequency
- All treasury transactions must be categorized and recorded in internal records, including purpose, counterparty, and approver
- Any discrepancy between on-chain balances and internal records must be investigated as a potential security incident until explained

**SP-FC-020: Protocol Due Diligence for Treasury Deployments**
- Documented due diligence must be completed before deploying treasury funds into any protocol, covering at minimum: audit history, admin key structure, upgradeability, timelock configuration, monitoring coverage, bug bounty program, and team transparency
- Exposure limits must be defined per protocol, and treasury deployments must not exceed them without documented approval
- Deployed positions must be monitored on an ongoing basis for protocol governance changes, upgrades, and security incidents
- Due diligence must be refreshed before increasing exposure to a previously approved protocol

**SP-FC-021: Inbound Payment Controls**
- Receive addresses for significant inbound payments must be freshly generated or re-verified against the intended wallet before being shared with the sender
- A round-trip test transfer must be completed before receiving the first significant payment from a new counterparty
- Sender identity must be re-verified through an authenticated channel before providing receive addresses, and address changes must never be accepted over the same channel as the original payment discussion
