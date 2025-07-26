# Domain 3: Communications & Social Media - Risks

### **R-CS-001: Account Takeover and Impersonation Attacks**
- **Attack Vectors**: Credential stuffing, SIM swapping, social engineering, weak authentication
- **Impact**: Brand damage, community manipulation, financial fraud through impersonation
- **Likelihood**: High - Communication accounts are high-value targets for attackers
- **Addressed by Requirements**: 
  - [SP-CS-001: Multi-Factor Authentication for All Accounts](../requirements/03-communications-socials.md#sp-cs-001-multi-factor-authentication-for-all-accounts)
  - [SP-CS-002: Account Recovery Protection](../requirements/03-communications-socials.md#sp-cs-002-account-recovery-protection)
  - [SP-CS-003: Regular Authentication Audits](../requirements/03-communications-socials.md#sp-cs-003-regular-authentication-audits)
  - [SP-CS-006: Social Media Account Verification](../requirements/03-communications-socials.md#sp-cs-006-social-media-account-verification)

### **R-CS-002: Social Engineering Targeting Team Members**
- **Attack Vectors**: Spear phishing, pretexting, baiting, quid pro quo attacks on staff
- **Impact**: Credential compromise, unauthorized access, information disclosure
- **Likelihood**: High - Human factors are consistently exploited by attackers
- **Addressed by Requirements**: 
  - [SP-CS-007: Principle of Least Privilege](../requirements/03-communications-socials.md#sp-cs-007-principle-of-least-privilege)
  - [SP-CS-009: End-to-End Encrypted Channels](../requirements/03-communications-socials.md#sp-cs-009-end-to-end-encrypted-channels)
  - [SP-CS-013: Email Authentication and Anti-Phishing](../requirements/03-communications-socials.md#sp-cs-013-email-authentication-and-anti-phishing)

### **R-CS-003: Community Scams and Phishing Campaigns**
- **Attack Vectors**: Fake support accounts, malicious links, fraudulent announcements
- **Impact**: Community member financial losses, reputational damage, legal liability
- **Likelihood**: High - Crypto communities are frequent targets for scams
- **Addressed by Requirements**: 
  - [SP-CS-006: Social Media Account Verification](../requirements/03-communications-socials.md#sp-cs-006-social-media-account-verification)
  - [SP-CS-011: Scam Prevention Measures](../requirements/03-communications-socials.md#sp-cs-011-scam-prevention-measures)
  - [SP-CS-012: Content Monitoring and Moderation](../requirements/03-communications-socials.md#sp-cs-012-content-monitoring-and-moderation)
  - [SP-CS-016: Brand Protection and Monitoring](../requirements/03-communications-socials.md#sp-cs-016-brand-protection-and-monitoring)

### **R-CS-004: Information Disclosure Through Insecure Communications**
- **Attack Vectors**: Unencrypted channels, public discussions of sensitive topics, data leaks
- **Impact**: Competitive disadvantage, regulatory violations, operational security compromise
- **Likelihood**: Medium - Often occurs through human error or inadequate procedures
- **Addressed by Requirements**: 
  - [SP-CS-009: End-to-End Encrypted Channels](../requirements/03-communications-socials.md#sp-cs-009-end-to-end-encrypted-channels)
  - [SP-CS-010: Communication Channel Segregation](../requirements/03-communications-socials.md#sp-cs-010-communication-channel-segregation)

### **R-CS-005: Coordinated Attacks on Multiple Platforms**
- **Attack Vectors**: Simultaneous account compromises, cross-platform manipulation campaigns
- **Impact**: Amplified damage, difficulty in containment, widespread community confusion
- **Likelihood**: Medium - Requires sophisticated coordination but high impact when successful
- **Addressed by Requirements**: 
  - [SP-CS-001: Multi-Factor Authentication for All Accounts](../requirements/03-communications-socials.md#sp-cs-001-multi-factor-authentication-for-all-accounts)
  - [SP-CS-015: Communication Incident Procedures](../requirements/03-communications-socials.md#sp-cs-015-communication-incident-procedures)
  - [SP-CS-016: Brand Protection and Monitoring](../requirements/03-communications-socials.md#sp-cs-016-brand-protection-and-monitoring)

### **R-CS-006: Platform-Specific Vulnerabilities**
- **Attack Vectors**: Discord raids, Telegram bot exploits, Twitter API abuse, platform bugs
- **Impact**: Service disruption, data exposure, unauthorized access to private channels
- **Likelihood**: Medium - Platform vulnerabilities are regularly discovered and exploited
- **Addressed by Requirements**: 
  - [SP-CS-004: Discord Server Security Configuration](../requirements/03-communications-socials.md#sp-cs-004-discord-server-security-configuration)
  - [SP-CS-005: Telegram Channel and Group Security](../requirements/03-communications-socials.md#sp-cs-005-telegram-channel-and-group-security)
  - [SP-CS-008: Third-Party Integration Controls](../requirements/03-communications-socials.md#sp-cs-008-third-party-integration-controls)
  - [SP-CS-012: Content Monitoring and Moderation](../requirements/03-communications-socials.md#sp-cs-012-content-monitoring-and-moderation)

---

## Risk Matrix

| Risk ID | Risk Name | Likelihood | Impact | Priority |
|---------|-----------|------------|--------|----------|
| R-CS-001 | Account Takeover and Impersonation | High | High | Critical |
| R-CS-002 | Social Engineering Targeting Team | High | High | Critical |
| R-CS-003 | Community Scams and Phishing | High | High | Critical |
| R-CS-004 | Information Disclosure | Medium | High | High |
| R-CS-005 | Coordinated Multi-Platform Attacks | Medium | High | High |
| R-CS-006 | Platform-Specific Vulnerabilities | Medium | Medium | Medium |

---

## References

- [Requirements: Domain 3 - Communications & Social Media](../requirements/03-communications-socials.md)
- [Controls: Domain 3 - Communications & Social Media](../controls/03-communications-socials.md)
