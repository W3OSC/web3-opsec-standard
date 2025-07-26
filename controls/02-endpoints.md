# Controls 2: Endpoint Security

## Device Management Controls

### **C-EP-001: Organizational Device Provisioning**
*Implements: [SP-EP-001: Dedicated Device Provisioning](../requirements/02-endpoints.md#sp-ep-001-dedicated-device-provisioning)*

**Device Procurement:**
- Purchase devices directly from manufacturers or authorized resellers
- Maintain device inventory with serial numbers and security configurations
- Use business-grade devices with enterprise security features
- Implement device lifecycle management procedures

**Device Configuration:**
- Install organizational image with security baselines
- Configure device management (MDM/EPP) enrollment
- Set up organizational accounts and access controls
- Document device assignment and user responsibilities

**BYOD Restrictions:**
- Prohibit personal devices for Web3 operations
- Implement clear acceptable use policies
- Provide organizational devices for all team members
- Regular audits to ensure compliance with device policies

### **C-EP-002: Full Disk Encryption Implementation**
*Implements: [SP-EP-002: Full Disk Encryption](../requirements/02-endpoints.md#sp-ep-002-full-disk-encryption)*

**Windows Configuration:**
- Enable BitLocker with TPM + PIN authentication
- Use AES-256 encryption algorithm
- Store recovery keys in organizational key management system
- Configure automatic encryption for new drives

**macOS Configuration:**
- Enable FileVault with institutional recovery key
- Use secure token authentication
- Store recovery keys in password manager or key management system
- Configure automatic encryption for external drives

**Linux Configuration:**
- Use LUKS (Linux Unified Key Setup) for full disk encryption
- Configure encrypted swap partitions
- Implement secure boot with signed kernels
- Use strong passphrases with key derivation functions

**Recovery Procedures:**
- Document recovery key storage locations
- Test recovery procedures quarterly
- Maintain offline backup of recovery keys
- Implement secure key escrow for organizational access

---

## Access Control Controls

### **C-EP-003: Multi-Factor Authentication Setup**
*Implements: [SP-EP-003: Multi-Factor Authentication](../requirements/02-endpoints.md#sp-ep-003-multi-factor-authentication)*

**Hardware Security Keys (Recommended):**
- Deploy FIDO2/WebAuthn compatible security keys
- Use YubiKey 5 series or equivalent devices
- Configure backup keys for each user
- Implement key management and replacement procedures

**Authenticator Apps (Alternative):**
- Use TOTP-based authenticator apps (Authy, 1Password, Bitwarden)
- Avoid SMS-based authentication for primary factor
- Configure backup codes and store securely
- Regular review and rotation of authentication secrets

**Platform-Specific Configuration:**
- **Windows**: Configure Windows Hello with PIN + biometric
- **macOS**: Enable Touch ID/Face ID with secure enclave
- **Linux**: Configure PAM modules for MFA integration

### **C-EP-004: Automatic Screen Lock Configuration**
*Implements: [SP-EP-004: Automatic Screen Locks](../requirements/02-endpoints.md#sp-ep-004-automatic-screen-locks)*

**Screen Lock Settings:**
- Set automatic lock timeout to 5 minutes maximum
- Require password/PIN re-entry after lock
- Disable lock screen notifications for sensitive information
- Configure immediate lock on lid close for laptops

**Biometric Authentication:**
- Enable fingerprint authentication where available
- Configure facial recognition with liveness detection
- Use biometric authentication to prevent shoulder surfing
- Maintain password/PIN backup for biometric failures

**Privacy Screens:**
- Deploy privacy screens for laptops used in public spaces
- Train users on proper privacy screen usage
- Include privacy screens in device provisioning
- Regular replacement of damaged privacy screens

---

## Security Monitoring Controls

### **C-EP-005: Endpoint Detection and Response (EDR) Deployment**
*Implements: [SP-EP-005: Endpoint Detection and Response (EDR)](../requirements/02-endpoints.md#sp-ep-005-endpoint-detection-and-response-edr)*

**EDR Solution Selection:**
- **Enterprise**: CrowdStrike Falcon, SentinelOne, Microsoft Defender
- **SMB**: Bitdefender GravityZone, Sophos Intercept X
- **Open Source**: Wazuh, OSSEC for budget-conscious organizations

**Deployment Configuration:**
- Install EDR agents on all organizational endpoints
- Configure real-time monitoring and behavioral analysis
- Set up automated threat response and containment
- Integrate with SIEM/SOAR platforms for centralized management

**Monitoring Capabilities:**
- File integrity monitoring for critical system files
- Process monitoring and anomaly detection
- Network connection monitoring and analysis
- Memory analysis for fileless malware detection
- Registry monitoring for persistence mechanisms

**Alert Configuration:**
- Configure alerts for suspicious process execution
- Monitor for credential dumping and lateral movement
- Alert on unusual network connections and data exfiltration
- Set up automated response for known malware signatures

### **C-EP-006: Network Monitoring and Firewall Setup**
*Implements: [SP-EP-006: Network Monitoring and Firewall](../requirements/02-endpoints.md#sp-ep-006-network-monitoring-and-firewall)*

**Local Firewall Configuration:**
- **Windows**: Configure Windows Defender Firewall with advanced security
- **macOS**: Use built-in firewall or third-party solutions like Little Snitch
- **Linux**: Configure iptables/ufw with restrictive default policies

**Network Monitoring Tools:**
- **Little Snitch** (macOS): Monitor and control outbound connections
- **Lulu** (macOS): Free alternative to Little Snitch
- **GlassWire** (Windows): Network monitoring and firewall
- **Wireshark**: Deep packet inspection for security analysis

**DNS Security:**
- Configure DNS to use secure resolvers (Cloudflare 1.1.1.1, Quad9)
- Implement DNS filtering to block malicious domains
- Use DNS over HTTPS (DoH) or DNS over TLS (DoT)
- Monitor DNS queries for suspicious activity

**Firewall Rules:**
- Block all inbound connections by default
- Allow only necessary outbound connections
- Log all blocked connection attempts
- Regular review and update of firewall rules

---

## Software Management Controls

### **C-EP-007: Software Inventory and Management**
*Implements: [SP-EP-007: Approved Software Inventory](../requirements/02-endpoints.md#sp-ep-007-approved-software-inventory)*

**Software Inventory Management:**
- Maintain approved software whitelist
- Use software asset management tools
- Regular audits of installed software
- Automated detection and removal of unauthorized software

**Update Management:**
- Enable automatic security updates for operating systems
- Configure automatic updates for critical applications
- Use patch management systems for enterprise environments
- Test updates in staging environment before production deployment

**Software Installation Controls:**
- Require administrative approval for new software installations
- Use application whitelisting where possible
- Implement software signing verification
- Regular vulnerability scanning of installed software

### **C-EP-008: Browser Security and Isolation**
*Implements: [SP-EP-008: Browser Security and Isolation](../requirements/02-endpoints.md#sp-ep-008-browser-security-and-isolation)*

**Browser Isolation Strategy:**
- **Ephemeral Browser**: Use for untrusted browsing (private/incognito mode default)
- **Session Browser**: Use for trusted, authenticated sessions
- **Crypto Browser**: Dedicated browser for Web3 operations only

**Browser Security Configuration:**
- Enable automatic security updates
- Disable unnecessary plugins and extensions
- Configure strict content security policies
- Enable safe browsing and phishing protection

**Web3 Browser Setup:**
- Use dedicated browser profile for cryptocurrency operations
- Install only essential Web3 extensions (MetaMask, Rabby)
- Configure extension security settings
- Regular review and audit of installed extensions

**Web Filtering:**
- Deploy DNS-based web filtering (OpenDNS, Cloudflare for Teams)
- Block known malicious and phishing domains
- Implement category-based filtering for inappropriate content
- Monitor and log web access for security analysis

---

## Development Security Controls

### **C-EP-009: Containerized Development Environment Setup**
*Implements: [SP-EP-009: Containerized Development Environments](../requirements/02-endpoints.md#sp-ep-009-containerized-development-environments)*

**Development Container Configuration:**
- Use Docker Desktop or Podman for container runtime
- Create project-specific containers from trusted base images
- Implement resource limits and security constraints
- Use read-only file systems where possible

**IDE Integration:**
- **VS Code**: Use Dev Containers extension
- **JetBrains**: Configure remote development with containers
- **Cursor**: Leverage built-in container support

**Container Security:**
- Scan base images for vulnerabilities before use
- Use minimal base images (Alpine, Distroless)
- Implement container security scanning in CI/CD
- Regular updates of base images and dependencies

**Development Workflow:**
- Create new container for each project
- Avoid downloading code outside of containers
- Use appropriate base images for project requirements
- Implement secrets management for development credentials

### **C-EP-010: Source Code Security Scanning**
*Implements: [SP-EP-010: Source Code Security Scanning](../requirements/02-endpoints.md#sp-ep-010-source-code-security-scanning)*

**Pre-commit Hook Setup:**
- Install git-secrets or similar tools
- Configure hooks to scan for API keys, passwords, and tokens
- Use tools like TruffleHog for comprehensive secret detection
- Implement commit signing with GPG keys

**Secret Scanning Tools:**
- **git-secrets**: AWS-developed tool for preventing secret commits
- **TruffleHog**: Comprehensive secret scanning
- **GitLeaks**: Fast and configurable secret detection
- **detect-secrets**: Yelp's secret detection tool

**Development Tool Security:**
- Keep development tools updated with latest security patches
- Use package managers with vulnerability scanning (npm audit, pip-audit)
- Implement dependency vulnerability scanning
- Regular security updates for IDEs and development tools

**1Password Git Integration:**
- Configure 1Password for SSH key management
- Use 1Password for Git commit signing
- Follow [1Password Git setup guide](https://vinialbano.com/how-to-sign-git-commits-with-1password/)

---

## Physical Security Controls

### **C-EP-011: Physical Device Protection**
*Implements: [SP-EP-011: Physical Device Protection](../requirements/02-endpoints.md#sp-ep-011-physical-device-protection)*

**Device Security Measures:**
- Use cable locks for laptops in office environments
- Implement secure storage (locking drawers, safes) for unattended devices
- Configure automatic screen locks with short timeouts
- Use privacy screens to prevent visual eavesdropping

**Travel Security Procedures:**
- Use dedicated travel devices with limited organizational access
- Implement device encryption and remote wipe capabilities
- Avoid carrying devices through high-risk areas
- Use VPN for all network connections while traveling

**Physical Access Controls:**
- Implement badge access for work areas
- Use security cameras in high-value areas
- Maintain visitor logs and escort requirements
- Regular physical security assessments

### **C-EP-012: Clean Desk and Workspace Security**
*Implements: [SP-EP-012: Clean Desk Policies](../requirements/02-endpoints.md#sp-ep-012-clean-desk-policies)*

**Clean Desk Implementation:**
- Clear all sensitive information from desks at end of day
- Use locking storage for sensitive documents and devices
- Implement secure disposal procedures for sensitive materials
- Regular audits of workspace compliance

**Screen Security:**
- Configure automatic screen locks with short timeouts
- Use privacy screens for laptops and monitors
- Position screens away from public view
- Implement screen sharing security policies

**Access Logging:**
- Log physical access to secure areas
- Monitor and review access logs regularly
- Implement access controls for sensitive areas
- Maintain audit trails for compliance requirements

---

## Incident Response Controls

### **C-EP-013: Device Isolation and Response Capabilities**
*Implements: [SP-EP-013: Device Isolation Capabilities](../requirements/02-endpoints.md#sp-ep-013-device-isolation-capabilities)*

**Device Isolation Procedures:**
- Implement network isolation capabilities for compromised devices
- Use EDR solutions for remote device isolation
- Maintain offline forensic capabilities
- Document isolation procedures and decision criteria

**Remote Device Management:**
- Deploy mobile device management (MDM) solutions
- Configure remote wipe capabilities for lost/stolen devices
- Implement geofencing and device tracking where appropriate
- Maintain device inventory with remote management capabilities

**Forensic Capabilities:**
- Maintain forensic imaging tools and procedures
- Train security team on digital forensics
- Establish relationships with external forensic specialists
- Implement evidence preservation procedures

### **C-EP-014: Backup and Recovery Implementation**
*Implements: [SP-EP-014: Backup and Recovery Procedures](../requirements/02-endpoints.md#sp-ep-014-backup-and-recovery-procedures)*

**Backup Strategy:**
- Implement automated backup solutions for critical data
- Use cloud-based backup services with encryption
- Maintain offline backup copies for critical systems
- Regular testing of backup and recovery procedures

**Recovery Procedures:**
- Document step-by-step recovery procedures
- Maintain recovery media and tools
- Test recovery procedures quarterly
- Train IT staff on recovery procedures

**Business Continuity:**
- Develop business continuity plans for endpoint compromise scenarios
- Identify critical systems and prioritize recovery
- Maintain alternative work procedures during outages
- Regular testing and updating of continuity plans

---

## Specific Implementation Guides

### **Home WiFi Security Configuration**

**Router Security:**
- Update router firmware to latest version
- Change default administrator credentials
- Use WPA3 encryption (WPA2 if WPA3 unavailable)
- Disable WPS (WiFi Protected Setup)
- Disable remote management features
- Create separate guest network for visitors

**Network Configuration:**
- Use strong WiFi passwords (20+ characters)
- Configure DNS to use Cloudflare (1.1.1.1) or Quad9 (9.9.9.9)
- Enable firewall on router
- Disable unnecessary services (UPnP, Telnet, SSH if not needed)
- Regular monitoring of connected devices

### **VPN Configuration for Remote Work**

**VPN Selection:**
- Use organizational VPN or reputable commercial VPN
- Prefer WireGuard or OpenVPN protocols
- Ensure no-logs policy and strong encryption
- Consider self-hosted VPN for maximum control

**VPN Configuration:**
- Configure kill switch to prevent data leaks
- Use VPN for all Web3 operations on public networks
- Configure DNS leak protection
- Regular testing of VPN connectivity and security

### **Endpoint Detection and Response (EDR) Setup**

**CrowdStrike Falcon Configuration:**
- Deploy Falcon sensor on all endpoints
- Configure real-time protection and behavioral analysis
- Set up automated threat response
- Integrate with SIEM for centralized monitoring

**Microsoft Defender Configuration:**
- Enable Microsoft Defender for Endpoint
- Configure attack surface reduction rules
- Set up automated investigation and response
- Integrate with Microsoft 365 security stack

**Open Source EDR (Wazuh):**
- Deploy Wazuh agents on all endpoints
- Configure log collection and analysis rules
- Set up alerting and notification systems
- Integrate with threat intelligence feeds

---

## Testing and Validation

### **Monthly Security Testing:**
- Test EDR detection capabilities with safe malware samples
- Verify backup and recovery procedures
- Review and update software inventory
- Test incident response communication channels

### **Quarterly Security Reviews:**
- Comprehensive security configuration review
- Penetration testing of endpoint security controls
- Update security baselines and configurations
- Review and update incident response procedures

### **Annual Security Assessments:**
- Third-party security assessment of endpoint infrastructure
- Review and update security policies and procedures
- Comprehensive training refresh for all users
- Update threat model and risk assessments

---

## References and Tools

### **Security Tools:**
- [Little Snitch](https://www.obdev.at/products/littlesnitch/) - macOS network monitor
- [Lulu](https://objective-see.org/products/lulu.html) - Free macOS firewall
- [GlassWire](https://www.glasswire.com/) - Windows network monitor
- [git-secrets](https://github.com/awslabs/git-secrets) - Prevent secret commits
- [TruffleHog](https://github.com/trufflesecurity/trufflehog) - Secret scanning

### **EDR Solutions:**
- [CrowdStrike Falcon](https://www.crowdstrike.com/platform/endpoint-security/)
- [SentinelOne](https://www.sentinelone.com/)
- [Microsoft Defender for Endpoint](https://docs.microsoft.com/en-us/microsoft-365/security/defender-endpoint/)
- [Wazuh](https://wazuh.com/) - Open source SIEM/EDR

### **Development Security:**
- [VS Code Dev Containers](https://code.visualstudio.com/docs/devcontainers/containers)
- [JetBrains Remote Development](https://www.jetbrains.com/help/idea/start-dev-container-from-welcome-screen.html)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- [Podman](https://podman.io/) - Alternative container runtime

### **DNS Security:**
- [Cloudflare 1.1.1.1](https://1.1.1.1/)
- [Quad9](https://quad9.net/)
- [NextDNS](https://nextdns.io/)
- [OpenDNS](https://www.opendns.com/)
