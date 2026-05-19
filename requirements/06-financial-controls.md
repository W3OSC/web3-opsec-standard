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
