# Controls 3: Communications & Social Media

## Account Security Controls

### **C-CS-001: Multi-Factor Authentication Implementation**
*Implements: [SP-CS-001: Multi-Factor Authentication for All Accounts](../requirements/03-communications-socials.md#sp-cs-001-multi-factor-authentication-for-all-accounts)*

**Discord Account Security:**
- Navigate to User Settings > My Account
- Enable 2FA using authenticator app (not SMS)
- Save backup codes in password manager
- Disable SMS Backup Authentication in Privacy & Safety

**Telegram Account Security:**
- Go to Settings > Privacy and Security > Security
- Enable Two-Step Verification with strong password
- Do not set password hint
- Add recovery email (organizational email)
- Disable SMS-based recovery options

**X/Twitter Account Security:**
- Settings > Security and account access > Security > Two-factor authentication
- Disable Text message authentication
- Enable authenticator app or security key
- Save backup codes securely
- Enable Password reset protect

**Signal Account Security:**
- Settings > Account > Registration Lock > Enable
- Use strong PIN (6+ digits)
- Review linked devices regularly
- Enable Screen Lock with short timeout

### **C-CS-002: Account Recovery Protection Setup**
*Implements: [SP-CS-002: Account Recovery Protection](../requirements/03-communications-socials.md#sp-cs-002-account-recovery-protection)*

**Phone Number Protection:**
- **AT&T**: Enable Extra security in myAT&T Profile
- **T-Mobile**: Add Account Takeover Protection
- **Verizon**: Enable Number Lock feature
- **Google Fi**: Enable Number Lock
- Set SIM PIN on all devices
- Register Signal account to prevent SIM swap impersonation

**Email Security:**
- Use dedicated organizational email addresses for account recovery
- Implement email suffix randomization (e.g., user+random@domain.com)
- Enable 2FA on all recovery email accounts
- Use separate recovery emails for different service categories

**Recovery Key Management:**
- Store recovery codes in organizational password manager
- Use separate vault sections for different team members
- Regular backup and testing of recovery procedures
- Document recovery procedures for each platform

### **C-CS-003: Authentication Audit Procedures**
*Implements: [SP-CS-003: Regular Authentication Audits](../requirements/03-communications-socials.md#sp-cs-003-regular-authentication-audits)*

**Monthly Authentication Reviews:**
- Review active sessions on all platforms
- Verify 2FA status for all organizational accounts
- Check for unauthorized login attempts
- Update authentication methods as needed

**Quarterly Security Audits:**
- Complete authentication configuration review
- Test backup authentication methods
- Review and update recovery procedures
- Document any security configuration changes

**Authentication Documentation:**
- Maintain inventory of all organizational accounts
- Document authentication methods for each platform
- Track authentication configuration changes
- Regular backup of authentication settings

---

## Platform Configuration Controls

### **C-CS-004: Discord Server Security Configuration**
*Implements: [SP-CS-004: Discord Server Security Configuration](../requirements/03-communications-socials.md#sp-cs-004-discord-server-security-configuration)*

**Server Safety Setup:**
- **Verification Level**: Set to Medium or higher
- **Raid Protection**: Enable Activity Alerts and CAPTCHA for suspicious accounts
- **DM Protection**: Enable "Hide DMs from suspicious users" and "Filter DMs from unknown users"
- **AutoMod**: Configure content filtering and explicit image filter for all members
- **2FA Requirement**: Enable "Require 2FA for moderator actions"

**Role and Permission Management:**
- Limit Administrator permissions to 2-3 essential personnel
- Review bot permissions and ensure they're verified
- Remove risky permissions from @everyone role
- Regular audit of role assignments and permissions
- Document all permission changes

**Integration Security:**
- Review all integrations and remove unnecessary ones
- Verify all bots are officially verified by Discord
- Restrict integration permissions to minimum required
- Regular audit of webhooks and remove unused ones
- Monitor integration activity through audit logs

**Channel Security:**
- Review private channel permissions for overrides
- Implement channel-specific permission restrictions
- Use slow mode (10+ seconds) in public channels
- Configure appropriate content filters per channel

### **C-CS-005: Telegram Security Configuration**
*Implements: [SP-CS-005: Telegram Channel and Group Security](../requirements/03-communications-socials.md#sp-cs-005-telegram-channel-and-group-security)*

**Channel Configuration:**
- Enable message signing for non-repudiation
- Set channels to Private if public discovery not needed
- Enable Content protection for confidential channels
- Hide chat history for new members
- Review and minimize administrator list

**Group Security Settings:**
- Restrict "Add members" permission to administrators only
- Disable "Pin messages" for regular members
- Disable "Change group info" for regular members
- Enable Aggressive Anti-Spam
- Set Slow mode to at least 10 seconds

**Permission Management:**
- Minimize administrator permissions
- Use exceptions for team members instead of admin roles
- Remove "Add new admins" permission from most admins
- Regular review of member list for confidential groups
- Time-limit and usage-restrict invite links

**Content Security:**
- Disable "Send media" permissions for Files and Embed links
- Review and remove unnecessary invite links
- Monitor for suspicious member additions
- Implement content moderation policies

### **C-CS-006: Social Media Verification and Branding**
*Implements: [SP-CS-006: Social Media Account Verification](../requirements/03-communications-socials.md#sp-cs-006-social-media-account-verification)*

**Account Verification:**
- Apply for official verification badges on all major platforms
- Maintain consistent usernames across platforms
- Use official organization branding and logos
- Monitor verification status and renew as needed

**Profile Security:**
- Use consistent profile information across platforms
- Include official website links in profiles
- Add clear contact information for verification
- Regular monitoring of profile changes

**Brand Protection:**
- Monitor for impersonation accounts across platforms
- Register similar usernames to prevent squatting
- Implement brand monitoring tools
- Establish takedown procedures for impersonation

---

## Permission Management Controls

### **C-CS-007: Least Privilege Implementation**
*Implements: [SP-CS-007: Principle of Least Privilege](../requirements/03-communications-socials.md#sp-cs-007-principle-of-least-privilege)*

**Administrative Access Control:**
- Limit admin privileges to essential personnel (2-3 maximum)
- Use individual accounts for all access (no shared accounts)
- Implement role-based access control where available
- Regular review and audit of administrative permissions

**Permission Review Process:**
- Monthly review of all user permissions
- Quarterly comprehensive permission audit
- Document all permission changes with justification
- Implement approval process for permission escalations

**Access Logging:**
- Enable audit logging on all platforms where available
- Monitor administrative actions through platform logs
- Set up alerts for sensitive permission changes
- Regular review of access logs for anomalies

### **C-CS-008: Third-Party Integration Management**
*Implements: [SP-CS-008: Third-Party Integration Controls](../requirements/03-communications-socials.md#sp-cs-008-third-party-integration-controls)*

**Integration Approval Process:**
- Require security review before approving new integrations
- Document business justification for each integration
- Assess integration permissions and minimize scope
- Regular review of integration necessity and security

**Integration Security Assessment:**
- Review integration developer verification status
- Assess integration permissions and data access
- Evaluate integration security practices and policies
- Monitor integration activity and usage patterns

**Integration Maintenance:**
- Regular audit of all active integrations
- Remove unused or unnecessary integrations promptly
- Update integration permissions when requirements change
- Monitor for integration security vulnerabilities

---

## Secure Communications Controls

### **C-CS-009: End-to-End Encrypted Communications**
*Implements: [SP-CS-009: End-to-End Encrypted Channels](../requirements/03-communications-socials.md#sp-cs-009-end-to-end-encrypted-channels)*

**Signal Setup for Sensitive Communications:**
- Install Signal on all team member devices
- Create organizational Signal groups for different security levels
- Enable disappearing messages (1 week recommended)
- Configure screen lock and hide screen in app switcher
- Enable "Always relay calls" to protect IP addresses

**Signal Security Configuration:**
- Settings > Privacy > Who can see my number > Nobody
- Settings > Privacy > Who can find me by number > Nobody
- Settings > Privacy > Disappearing Messages > Enabled (1 week)
- Settings > Privacy > Screen Lock > Enabled (1 minute timeout)
- Settings > Calls > Always relay calls > Enabled

**Communication Channel Segregation:**
- **Public Communications**: Discord, Telegram public channels
- **Internal Operations**: Private Discord channels, Slack
- **Sensitive Discussions**: Signal groups
- **Confidential Communications**: Signal with disappearing messages

**Message Retention Policies:**
- Configure appropriate message retention for each channel type
- Use disappearing messages for sensitive communications
- Regular cleanup of old messages in operational channels
- Document retention policies and ensure compliance

### **C-CS-010: Communication Channel Segregation**
*Implements: [SP-CS-010: Communication Channel Segregation](../requirements/03-communications-socials.md#sp-cs-010-communication-channel-segregation)*

**Channel Classification:**
- **Public**: Community discussions, announcements, support
- **Internal**: Team coordination, project discussions
- **Sensitive**: Financial discussions, strategic planning
- **Confidential**: Security incidents, personnel matters

**Access Control by Classification:**
- Public channels: Community members with moderation
- Internal channels: Team members only with role-based access
- Sensitive channels: Leadership and relevant team members
- Confidential channels: End-to-end encrypted with minimal access

**Channel Security Measures:**
- Clear labeling of channel security levels
- Regular review of channel membership
- Audit of message content for appropriate classification
- Training on proper channel usage and security

---

## Community Protection Controls

### **C-CS-011: Scam Prevention Implementation**
*Implements: [SP-CS-011: Scam Prevention Measures](../requirements/03-communications-socials.md#sp-cs-011-scam-prevention-measures)*

**Community Education:**
- Post clear disclaimers about official communication policies
- Create pinned messages stating "We will NEVER DM you first"
- Educate community about common scam tactics
- Provide clear reporting mechanisms for suspicious activity

**Official Communication Policies:**
- Establish clear policies for how official support is provided
- Use consistent branding and verification for official accounts
- Implement username suffixes like "| will never DM you"
- Create official support channels and promote their use

**Scam Detection and Response:**
- Monitor for impersonation accounts across platforms
- Set up automated detection for common scam patterns
- Implement rapid response procedures for reported scams
- Maintain blacklists of known scam accounts and content

**Community Protection Measures:**
- Regular community education about security best practices
- Clear escalation procedures for security concerns
- Coordination with platform support for takedown requests
- Documentation of scam attempts for pattern analysis

### **C-CS-012: Content Monitoring and Moderation**
*Implements: [SP-CS-012: Content Monitoring and Moderation](../requirements/03-communications-socials.md#sp-cs-012-content-monitoring-and-moderation)*

**Automated Monitoring:**
- Configure platform AutoMod features where available
- Set up keyword filtering for common scam terms
- Implement link filtering and verification
- Use bot-based moderation tools for pattern detection

**Moderation Policies:**
- Document clear community guidelines and rules
- Establish consistent enforcement procedures
- Train moderators on policy application
- Regular review and update of moderation policies

**Moderation Tools:**
- **Discord**: Use Carl-bot, Dyno, or MEE6 for automated moderation
- **Telegram**: Configure built-in anti-spam features
- **Twitter/X**: Use platform reporting and blocking features
- Implement escalation procedures for complex cases

**Audit and Logging:**
- Log all moderation actions with justification
- Regular review of moderation decisions for consistency
- Track moderation metrics and effectiveness
- Provide appeals process for moderation decisions

---

## Email Security Controls

### **C-CS-013: Email Authentication and Anti-Phishing**
*Implements: [SP-CS-013: Email Authentication and Anti-Phishing](../requirements/03-communications-socials.md#sp-cs-013-email-authentication-and-anti-phishing)*

**Email Authentication Setup:**
- **SPF Records**: Configure Sender Policy Framework
- **DKIM**: Set up DomainKeys Identified Mail signing
- **DMARC**: Implement Domain-based Message Authentication
- Regular monitoring of authentication status and failures

**Google Workspace Email Security:**
- Enable Enhanced Safe Browsing
- Configure attachment protection and quarantine
- Set up link and external image protection
- Enable spoofing and authentication protection
- Configure IMAP view time protections

**Anti-Phishing Measures:**
- Deploy email filtering solutions (Microsoft Defender, Proofpoint)
- Configure phishing simulation training programs
- Implement user reporting mechanisms for suspicious emails
- Regular analysis of phishing attempts and trends

**Email Security Monitoring:**
- Monitor DMARC reports for authentication failures
- Track email security incidents and responses
- Analyze email threat intelligence and indicators
- Regular testing of email security controls

### **C-CS-014: Email Security Monitoring and Incident Response**
*Implements: [SP-CS-014: Email Security Monitoring](../requirements/03-communications-socials.md#sp-cs-014-email-security-monitoring)*

**Monitoring Configuration:**
- Set up alerts for DMARC policy failures
- Monitor for suspicious email patterns and volumes
- Track email authentication bypass attempts
- Implement threat intelligence integration

**Incident Response Procedures:**
- Document email security incident response procedures
- Establish escalation paths for email threats
- Coordinate with IT security team for email incidents
- Maintain communication templates for email security incidents

**Threat Intelligence:**
- Subscribe to email threat intelligence feeds
- Share threat indicators with security community
- Analyze email attack patterns and techniques
- Update security controls based on threat intelligence

---

## Incident Response Controls

### **C-CS-015: Communication Incident Procedures**
*Implements: [SP-CS-015: Communication Incident Procedures](../requirements/03-communications-socials.md#sp-cs-015-communication-incident-procedures)*

**Incident Communication Channels:**
- **Primary**: Signal group for security team
- **Secondary**: Private Discord channel for broader team
- **Emergency**: Phone tree for critical incidents
- **Public**: Pre-approved communication templates

**Communication Templates:**
- Account compromise notifications
- Service disruption announcements
- Security incident updates
- Community safety alerts
- Post-incident summaries

**Stakeholder Notification:**
- Internal team notification procedures
- Community notification guidelines
- Regulatory notification requirements where applicable
- Media communication protocols

### **C-CS-016: Brand Protection and Monitoring**
*Implements: [SP-CS-016: Brand Protection and Monitoring](../requirements/03-communications-socials.md#sp-cs-016-brand-protection-and-monitoring)*

**Social Media Monitoring:**
- Use tools like Hootsuite, Sprout Social for brand monitoring
- Set up Google Alerts for organization name and key terms
- Monitor major social platforms for impersonation accounts
- Track brand mentions and sentiment analysis

**Impersonation Response:**
- Document procedures for reporting impersonation accounts
- Maintain contacts at major platforms for expedited takedowns
- Create evidence collection procedures for impersonation cases
- Track and analyze impersonation attempts

**Brand Protection Tools:**
- **Social Media**: Native platform reporting tools
- **Domain Monitoring**: DomainTools, MarkMonitor
- **Brand Monitoring**: BrandWatch, Mention
- **Threat Intelligence**: Recorded Future, ThreatConnect

---

## Platform-Specific Implementation Guides

### **Discord Server Hardening Checklist**

**Server Settings > Safety Setup:**
- [ ] Verification Level: Medium or High
- [ ] Explicit Media Content Filter: Scan media from all members
- [ ] Activity Alerts: Enabled
- [ ] CAPTCHA suspicious accounts: Enabled
- [ ] Hide DMs from suspicious users: Enabled
- [ ] Filter DMs from unknown users: Enabled
- [ ] Warn before visiting outbound links: Enabled
- [ ] AutoMod: Enabled with content filtering
- [ ] Require 2FA for moderator actions: Enabled

**Role Management:**
- [ ] Administrator role limited to 2-3 essential personnel
- [ ] Bot roles have minimal required permissions
- [ ] @everyone role has risky permissions removed
- [ ] Regular audit of role assignments

**Integration Security:**
- [ ] All bots are verified by Discord
- [ ] Unnecessary integrations removed
- [ ] Webhook permissions minimized
- [ ] Regular integration audit scheduled

### **Telegram Channel/Group Security Checklist**

**Channel Settings:**
- [ ] Sign messages: Enabled
- [ ] Channel type: Private (if public discovery not needed)
- [ ] Content protection: Enabled
- [ ] Administrator list minimized

**Group Settings:**
- [ ] Add members: Restricted to admins
- [ ] Pin messages: Disabled for members
- [ ] Change group info: Disabled for members
- [ ] Slow mode: 10+ seconds
- [ ] Aggressive Anti-Spam: Enabled
- [ ] Chat history for new members: Hidden

**Permission Management:**
- [ ] Admin permissions minimized
- [ ] "Add new admins" permission removed from most admins
- [ ] Team members use exceptions instead of admin roles
- [ ] Invite links are time-limited and usage-restricted

### **Google Workspace Email Security Configuration**

**Gmail Security Settings:**
- [ ] Enhanced Safe Browsing: Enabled
- [ ] Attachment protection: Enabled (quarantine)
- [ ] Link protection: Enabled
- [ ] External image protection: Enabled
- [ ] Spoofing protection: Enabled (quarantine)
- [ ] IMAP view time protections: Enabled

**DNS Configuration:**
- [ ] SPF record configured and published
- [ ] DKIM signing enabled and keys published
- [ ] DMARC policy configured (start with p=none, progress to p=quarantine/reject)
- [ ] Regular monitoring of DMARC reports

---

## Testing and Validation

### **Monthly Security Testing:**
- Test 2FA on all organizational accounts
- Verify backup authentication methods
- Review active sessions and connected apps
- Test incident communication channels

### **Quarterly Security Reviews:**
- Comprehensive platform security configuration review
- Social engineering simulation exercises
- Brand monitoring and impersonation detection testing
- Review and update communication security policies

### **Annual Security Assessments:**
- Third-party assessment of communication security posture
- Comprehensive phishing simulation campaigns
- Review and update incident response procedures
- Update threat model for communication platforms

---

## References and Tools

### **Security Tools:**
- [Signal](https://signal.org/) - Secure messaging
- [1Password](https://1password.com/) - Password management
- [Authy](https://authy.com/) - 2FA authentication
- [YubiKey](https://www.yubico.com/) - Hardware security keys

### **Monitoring and Brand Protection:**
- [Hootsuite](https://hootsuite.com/) - Social media management
- [Google Alerts](https://www.google.com/alerts) - Brand monitoring
- [BrandWatch](https://www.brandwatch.com/) - Social listening
- [DomainTools](https://www.domaintools.com/) - Domain monitoring

### **Email Security:**
- [MXToolbox](https://mxtoolbox.com/) - Email authentication testing
- [DMARC Analyzer](https://www.dmarcanalyzer.com/) - DMARC reporting
- [Microsoft Defender for Office 365](https://docs.microsoft.com/en-us/microsoft-365/security/office-365-security/)
- [Proofpoint](https://www.proofpoint.com/) - Email security

### **Platform Documentation:**
- [Discord Safety Center](https://discord.com/safety)
- [Telegram Security Guidelines](https://core.telegram.org/techfaq)
- [Twitter Security Best Practices](https://help.twitter.com/en/safety-and-security)
- [Signal Security Documentation](https://signal.org/docs/)
