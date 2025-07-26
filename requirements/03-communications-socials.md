# Domain 3: Communications & Social Media

### **Account Security**

**SP-CS-001: Multi-Factor Authentication for All Accounts**
- All organizational communication accounts MUST implement multi-factor authentication
- SMS-based authentication MUST NOT be used as a primary or backup factor
- Hardware security keys SHOULD be used where supported by platforms
- *Addresses risks: [R-CS-001: Account Takeover and Impersonation Attacks](../risks/03-communications-socials.md#r-cs-001-account-takeover-and-impersonation-attacks), [R-CS-005: Coordinated Attacks on Multiple Platforms](../risks/03-communications-socials.md#r-cs-005-coordinated-attacks-on-multiple-platforms)*
- *Implementation guidance: [C-CS-001: Multi-Factor Authentication Implementation](../controls/03-communications-socials.md#c-cs-001-multi-factor-authentication-implementation)*

**SP-CS-002: Account Recovery Protection**
- Account recovery options MUST be secured and regularly reviewed
- Phone numbers used for recovery MUST be protected against SIM swapping
- Recovery email addresses MUST be dedicated organizational accounts with strong security
- *Addresses risks: [R-CS-001: Account Takeover and Impersonation Attacks](../risks/03-communications-socials.md#r-cs-001-account-takeover-and-impersonation-attacks)*
- *Implementation guidance: [C-CS-002: Account Recovery Security](../controls/03-communications-socials.md#c-cs-002-account-recovery-security)*

**SP-CS-003: Regular Authentication Audits**
- Authentication status MUST be regularly audited and verified
- Backup authentication methods MUST be securely stored and managed
- Authentication configurations MUST be documented and maintained
- *Addresses risks: [R-CS-001: Account Takeover and Impersonation Attacks](../risks/03-communications-socials.md#r-cs-001-account-takeover-and-impersonation-attacks)*
- *Implementation guidance: [C-CS-003: Authentication Audit Procedures](../controls/03-communications-socials.md#c-cs-003-authentication-audit-procedures)*

### **Platform Configuration**

**SP-CS-004: Discord Server Security Configuration**
- Server verification levels MUST be set to Medium or higher
- CAPTCHA verification MUST be enabled for new members
- AutoMod MUST be configured to prevent spam and malicious content
- Raid protection MUST be enabled with appropriate thresholds
- *Addresses risks: [R-CS-006: Platform-Specific Vulnerabilities](../risks/03-communications-socials.md#r-cs-006-platform-specific-vulnerabilities)*
- *Implementation guidance: [C-CS-004: Discord Security Setup](../controls/03-communications-socials.md#c-cs-004-discord-security-setup)*

**SP-CS-005: Telegram Channel and Group Security**
- Channel and group settings MUST restrict member addition to administrators
- Aggressive anti-spam MUST be enabled
- Invite links MUST be time-limited and usage-restricted
- Administrator permissions MUST be minimized and regularly reviewed
- *Addresses risks: [R-CS-006: Platform-Specific Vulnerabilities](../risks/03-communications-socials.md#r-cs-006-platform-specific-vulnerabilities)*
- *Implementation guidance: [C-CS-005: Telegram Security Configuration](../controls/03-communications-socials.md#c-cs-005-telegram-security-configuration)*

**SP-CS-006: Social Media Account Verification**
- Organizations MUST obtain official verification badges where available
- Account usernames MUST be consistent across platforms
- Profile information MUST clearly identify the organization
- Verification status MUST be monitored and maintained
- *Addresses risks: [R-CS-001: Account Takeover and Impersonation Attacks](../risks/03-communications-socials.md#r-cs-001-account-takeover-and-impersonation-attacks), [R-CS-003: Community Scams and Phishing Campaigns](../risks/03-communications-socials.md#r-cs-003-community-scams-and-phishing-campaigns)*
- *Implementation guidance: [C-CS-006: Social Media Verification](../controls/03-communications-socials.md#c-cs-006-social-media-verification)*

### **Permission Management**

**SP-CS-007: Principle of Least Privilege**
- Administrative privileges MUST be limited to essential personnel only
- User roles and permissions MUST be regularly reviewed and updated
- Shared accounts MUST NOT be used for individual access
- Permission changes MUST be logged and monitored
- *Addresses risks: [R-CS-002: Social Engineering Targeting Team Members](../risks/03-communications-socials.md#r-cs-002-social-engineering-targeting-team-members)*
- *Implementation guidance: [C-CS-007: Permission Management](../controls/03-communications-socials.md#c-cs-007-permission-management)*

**SP-CS-008: Third-Party Integration Controls**
- Third-party integrations MUST be approved and regularly audited
- Integration permissions MUST be minimized to required functionality
- Unused integrations MUST be removed promptly
- Integration security MUST be assessed before approval
- *Addresses risks: [R-CS-006: Platform-Specific Vulnerabilities](../risks/03-communications-socials.md#r-cs-006-platform-specific-vulnerabilities)*
- *Implementation guidance: [C-CS-008: Third-Party Integration Security](../controls/03-communications-socials.md#c-cs-008-third-party-integration-security)*

### **Secure Communications**

**SP-CS-009: End-to-End Encrypted Channels**
- End-to-end encrypted communication MUST be used for sensitive discussions
- Signal or equivalent secure messaging platforms MUST be used for confidential communications
- Organizational communications MUST be separated from personal communications
- Message retention policies MUST be established and enforced
- *Addresses risks: [R-CS-002: Social Engineering Targeting Team Members](../risks/03-communications-socials.md#r-cs-002-social-engineering-targeting-team-members), [R-CS-004: Information Disclosure Through Insecure Communications](../risks/03-communications-socials.md#r-cs-004-information-disclosure-through-insecure-communications)*
- *Implementation guidance: [C-CS-009: Encrypted Communication Setup](../controls/03-communications-socials.md#c-cs-009-encrypted-communication-setup)*

**SP-CS-010: Communication Channel Segregation**
- Different security levels MUST have separate communication channels
- Public and private communications MUST be clearly distinguished
- Sensitive information MUST NOT be discussed in public channels
- Channel access MUST be regularly reviewed and updated
- *Addresses risks: [R-CS-004: Information Disclosure Through Insecure Communications](../risks/03-communications-socials.md#r-cs-004-information-disclosure-through-insecure-communications)*
- *Implementation guidance: [C-CS-010: Channel Segregation Implementation](../controls/03-communications-socials.md#c-cs-010-channel-segregation-implementation)*

### **Community Protection**

**SP-CS-011: Scam Prevention Measures**
- Clear disclaimers MUST be posted stating official communication policies
- Community members MUST be educated about common scam tactics
- Suspicious accounts and messages MUST be promptly removed
- Official support channels MUST be clearly identified and promoted
- *Addresses risks: [R-CS-003: Community Scams and Phishing Campaigns](../risks/03-communications-socials.md#r-cs-003-community-scams-and-phishing-campaigns)*
- *Implementation guidance: [C-CS-011: Scam Prevention Implementation](../controls/03-communications-socials.md#c-cs-011-scam-prevention-implementation)*

**SP-CS-012: Content Monitoring and Moderation**
- Automated content monitoring MUST be implemented where possible
- Moderation policies MUST be documented and consistently enforced
- Suspicious content MUST be flagged and reviewed promptly
- Moderation actions MUST be logged and auditable
- *Addresses risks: [R-CS-003: Community Scams and Phishing Campaigns](../risks/03-communications-socials.md#r-cs-003-community-scams-and-phishing-campaigns), [R-CS-006: Platform-Specific Vulnerabilities](../risks/03-communications-socials.md#r-cs-006-platform-specific-vulnerabilities)*
- *Implementation guidance: [C-CS-012: Content Monitoring and Moderation](../controls/03-communications-socials.md#c-cs-012-content-monitoring-and-moderation)*

### **Email Security**

**SP-CS-013: Email Authentication and Anti-Phishing**
- SPF, DKIM, and DMARC records MUST be properly configured
- Email filtering MUST be enabled to block malicious content
- Phishing simulation training MUST be conducted regularly
- Suspicious emails MUST be reported and analyzed
- *Addresses risks: [R-CS-002: Social Engineering Targeting Team Members](../risks/03-communications-socials.md#r-cs-002-social-engineering-targeting-team-members)*
- *Implementation guidance: [C-CS-013: Email Security Implementation](../controls/03-communications-socials.md#c-cs-013-email-security-implementation)*

**SP-CS-014: Email Security Monitoring**
- Email authentication status MUST be monitored and maintained
- Email security incidents MUST be tracked and analyzed
- Email-based threats MUST be shared with relevant teams
- Email security controls MUST be regularly tested and updated
- *Addresses risks: [R-CS-002: Social Engineering Targeting Team Members](../risks/03-communications-socials.md#r-cs-002-social-engineering-targeting-team-members)*
- *Implementation guidance: [C-CS-014: Email Security Monitoring](../controls/03-communications-socials.md#c-cs-014-email-security-monitoring)*

### **Incident Response**

**SP-CS-015: Communication Incident Procedures**
- Incident communication channels MUST be pre-established and tested
- Communication templates MUST be prepared for common incident types
- Stakeholder notification procedures MUST be documented and practiced
- Public communication MUST be coordinated and approved
- *Addresses risks: [R-CS-005: Coordinated Attacks on Multiple Platforms](../risks/03-communications-socials.md#r-cs-005-coordinated-attacks-on-multiple-platforms)*
- *Implementation guidance: [C-CS-015: Incident Communication Procedures](../controls/03-communications-socials.md#c-cs-015-incident-communication-procedures)*

**SP-CS-016: Brand Protection and Monitoring**
- Social media monitoring MUST be implemented across relevant platforms
- Impersonation accounts MUST be identified and reported promptly
- Brand mentions and discussions MUST be monitored for threats
- Takedown procedures MUST be established for malicious content
- *Addresses risks: [R-CS-003: Community Scams and Phishing Campaigns](../risks/03-communications-socials.md#r-cs-003-community-scams-and-phishing-campaigns), [R-CS-005: Coordinated Attacks on Multiple Platforms](../risks/03-communications-socials.md#r-cs-005-coordinated-attacks-on-multiple-platforms)*
- *Implementation guidance: [C-CS-016: Brand Protection and Monitoring](../controls/03-communications-socials.md#c-cs-016-brand-protection-and-monitoring)*