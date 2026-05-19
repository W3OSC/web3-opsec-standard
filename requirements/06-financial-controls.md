# Domain 6: Financial Controls & Banking Security

## Risks

- R-FC-001: Unauthorized Wire or ACH Transfer
- R-FC-002: Social Engineering of Financial Personnel
- R-FC-003: Fraudulent Payment Authorization
- R-FC-004: Single Point of Failure in Payment Approval
- R-FC-005: Account Takeover of Banking Portals
- R-FC-006: Insider Theft or Misappropriation of Funds
- R-FC-007: Vendor or Invoice Fraud
- R-FC-008: Business Email Compromise Leading to Payment Fraud
- R-FC-009: Unmonitored or Undetected Financial Anomalies
- R-FC-010: Lack of Financial Incident Response Readiness
- R-FC-011: Inadequate Segregation of Financial Duties
- R-FC-012: Overly Broad Access to Financial Accounts
- R-FC-013: Compromised Banking Portal Session
- R-FC-014: Insufficient Controls on High-Value Transactions
- R-FC-015: Unvetted Payment Recipients
- R-FC-016: Operational Account Compromise Leading to Total Fund Loss

### **Account Security & Access Control**

**SP-FC-001: Banking Portal Authentication**
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

**SP-FC-004: Session and Access Hygiene**
- Banking portal sessions must be terminated immediately after use - auto-logout must be enabled at the shortest acceptable timeout
- Financial portal accounts must be accessed only through bookmarked, verified URLs and never through links in emails or messages
- Browser extensions should be minimized on financial devices and must be individually vetted before installation
- Saving passwords or autofill credentials in browser-native storage must be disabled on financial devices

### **Multi-Party Authorization & Approval**

**SP-FC-005: Dual Authorization for Outbound Payments**
- All outbound payments, wire transfers, and ACH transactions must require approval from at least two authorized individuals
- A single person must never have the unilateral ability to initiate and approve a payment
- Approval authority must be enforced at the banking platform level, not solely through internal policy
- For organizations with three or fewer financial approvers, all available approvers should be required to confirm high-value transactions

**SP-FC-006: Tiered Transaction Approval Thresholds**
- Transaction approval requirements must scale with transaction value:
  - Low-value routine transactions may require single approval but must be within a pre-approved recurring payment structure
  - Mid-value transactions must require dual approval from designated financial approvers
  - High-value transactions must require a minimum 3-of-5 approval quorum mirroring on-chain multi-sig practices, or the maximum feasible quorum size for the team
- Threshold values must be formally defined and documented, and reviewed at least annually
- Any single transaction above the high-value threshold must require an out-of-band verbal or video confirmation between approvers before final authorization

**SP-FC-007: Separation of Financial Duties**
- The roles of payment initiator and payment approver must be held by separate individuals
- No single individual should control the full payment lifecycle from request through execution
- For small teams where strict separation is not always possible, compensating controls must be in place:
  - Mandatory post-hoc review of all transactions by a non-initiating party
  - Immutable automated transaction alerts delivered to all financial stakeholders
  - Regular reconciliation reviews involving at least two people

**SP-FC-008: Out-of-Band Payment Confirmation**
- All high-value or non-routine payment requests must be verbally confirmed through a trusted, separate communication channel (e.g. phone call or video call) before approval
- Out-of-band confirmation must independently verify: recipient identity, exact payment amount, destination account details, and stated purpose
- Confirmation must never rely solely on email, chat, or any channel through which the original payment request was made
- Approvers must be trained to independently verify the identity of anyone requesting a financial action, even if the request appears to come from a known colleague or executive

### **Recipient & Vendor Controls**

**SP-FC-009: Payment Recipient Whitelisting**
- All recurring payment recipients must be added to an approved whitelist at the banking platform level
- First-time payments to new recipients must require elevated approval - at minimum one additional approver beyond the standard quorum
- Changes to existing whitelisted recipient details (bank account number, routing number, address) must be treated as a new recipient and require the full new-recipient approval process
- Whitelist additions and modifications must be logged and reviewed by a party separate from the person who initiated the change

**SP-FC-010: Vendor and Invoice Verification**
- All invoices must be verified against a pre-existing vendor record before payment is initiated
- Invoice details must be cross-referenced with the original contract or agreement to confirm accuracy
- Any last-minute change to payment instructions from a vendor must trigger an immediate out-of-band verification call to a known, pre-existing contact at the vendor using independently sourced contact information
- Banking and routing details on vendor invoices must be verified against the organization's own whitelist, not the invoice itself

**SP-FC-011: Business Email Compromise Resistance**
- Personnel with financial authority must receive training on Business Email Compromise (BEC) and executive impersonation attacks
- Any email-based payment request must be treated as unverified until independently confirmed through a separate channel
- Urgency-framed payment requests must trigger increased scrutiny and mandatory out-of-band confirmation regardless of the apparent sender
- Domain lookalike monitoring should be in place to detect impersonation attempts against the organization's domain

### **Account Structure & Segregation**

**SP-FC-012: Operational Account Segregation**
- Operating funds must be held separately from reserve or emergency capital
- Day-to-day operational expenses should be funded from a lower-balance operating account, with transfers in from reserves as needed
- Reserve accounts must have more restrictive transaction controls and approval requirements than operating accounts
- At minimum, three distinct account categories should exist: operating, reserve, and payroll (where applicable)

**SP-FC-013: Exposure Limitation**
- The operating account balance should be kept at the minimum level needed to meet anticipated short-term obligations
- Excess capital must be moved to reserve accounts with higher transaction approval requirements
- No single account should hold funds whose total loss would be unrecoverable for the organization
- Large fund movements between internal accounts must also require multi-party approval

**SP-FC-014: Third-Party Custodian Selection**
- Banking and financial services partners must be evaluated for security features prior to onboarding, including:
  - Multi-user approval workflows
  - Role-based access controls
  - FIDO2/hardware key MFA support
  - Immutable transaction audit logs
  - Real-time transaction alerting
- Preference should be given to institutions that natively support dual-control transaction authorization
- Custodian and banking relationships should be reviewed at least annually for continued fit and risk posture

### **Monitoring & Reconciliation**

**SP-FC-015: Real-Time Transaction Monitoring**
- Real-time transaction alerts must be configured for all financial accounts
- Alerts must be delivered to at least two separate individuals through at least two separate channels (e.g. email and a team messaging platform)
- Alert delivery channels must be immutable and redundant such that disabling one channel would trigger a notification on the other
- All alerts must include: transaction amount, recipient account details, initiator identity, and timestamp

**SP-FC-016: Regular Reconciliation**
- All financial accounts must be fully reconciled on at least a monthly basis
- Reconciliation must be performed by someone other than the individual who initiated or approved the transactions being reviewed
- Discrepancies identified during reconciliation must be escalated immediately and investigated before the next reconciliation cycle
- Reconciliation records must be retained with immutable audit trail integrity

**SP-FC-017: Anomaly Detection and Behavioral Baselines**
- A financial baseline of normal transaction patterns must be established and documented
- Any transaction that deviates significantly from baseline in terms of amount, recipient, frequency, or timing must be flagged for review
- Banking platforms with built-in anomaly detection or fraud scoring should be preferred
- Unusual activity flags must not be dismissible by the same individual who initiated the flagged transaction

### **Incident Response & Emergency Controls**

**SP-FC-018: Financial Incident Response Runbook**
- A documented financial incident response plan must exist and be reviewed at least annually
- The runbook must include procedures for:
  - Immediately freezing or suspending outbound payment capabilities
  - Contacting banking partners to recall or reverse unauthorized transfers
  - Notifying relevant internal stakeholders and external parties (regulators, auditors)
  - Preserving evidence and audit trails for investigation
- Recovery time and communication procedures must be pre-defined and tested

**SP-FC-019: Emergency Account Freeze Capability**
- Organizations must know and document the exact process to immediately freeze outbound transactions for every financial account they hold
- Emergency freeze contact details for all banking partners must be maintained in a secure, offline document accessible to authorized personnel without requiring network access
- A designated responder must be assigned for financial incident response at all times, with a clearly defined backup
- The emergency response process must be tested at least once per year through a tabletop exercise
