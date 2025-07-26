# Domain 2: Endpoint Security

### **Device Management**

**SP-EP-001: Dedicated Device Provisioning**
- Web3 operations MUST be performed on dedicated organizational devices
- Personal devices MUST NOT be used for accessing organizational Web3 assets
- Device inventory MUST be maintained with security configuration details
- *Addresses risks: [R-EP-005: Insider Threats and Privilege Abuse](../risks/02-endpoints.md#r-ep-005-insider-threats-and-privilege-abuse)*
- *Implementation guidance: [C-EP-001: Organizational Device Provisioning](../controls/02-endpoints.md#c-ep-001-organizational-device-provisioning)*

**SP-EP-002: Full Disk Encryption**
- All organizational endpoints MUST implement full disk encryption using AES-256 or equivalent
- Encryption keys MUST be managed through organizational key management systems
- Recovery mechanisms MUST be established and tested regularly
- *Addresses risks: [R-EP-002: Physical Device Compromise](../risks/02-endpoints.md#r-ep-002-physical-device-compromise)*
- *Implementation guidance: [C-EP-002: Full Disk Encryption Implementation](../controls/02-endpoints.md#c-ep-002-full-disk-encryption-implementation)*

### **Access Control**

**SP-EP-003: Multi-Factor Authentication**
- All endpoints MUST require multi-factor authentication for login
- SMS-based authentication MUST NOT be used as a primary factor
- Hardware security keys SHOULD be used where available
- *Addresses risks: [R-EP-004: Social Engineering Targeting Device Users](../risks/02-endpoints.md#r-ep-004-social-engineering-targeting-device-users), [R-EP-005: Insider Threats and Privilege Abuse](../risks/02-endpoints.md#r-ep-005-insider-threats-and-privilege-abuse)*
- *Implementation guidance: [C-EP-003: Multi-Factor Authentication Setup](../controls/02-endpoints.md#c-ep-003-multi-factor-authentication-setup)*

**SP-EP-004: Automatic Screen Locks**
- Endpoints MUST implement automatic screen locks with timeout periods ≤5 minutes
- Biometric authentication SHOULD be used to prevent shoulder surfing
- Privacy screens SHOULD be used when working in public spaces
- *Addresses risks: [R-EP-002: Physical Device Compromise](../risks/02-endpoints.md#r-ep-002-physical-device-compromise)*
- *Implementation guidance: [C-EP-004: Automatic Screen Lock Configuration](../controls/02-endpoints.md#c-ep-004-automatic-screen-lock-configuration)*

### **Security Monitoring**

**SP-EP-005: Endpoint Detection and Response (EDR)**
- Organizations MUST deploy EDR solutions on all endpoints handling Web3 operations
- EDR systems MUST provide real-time threat detection and behavioral analysis
- EDR data MUST be centrally collected and analyzed
- *Addresses risks: [R-EP-001: Malware Infection and Credential Theft](../risks/02-endpoints.md#r-ep-001-malware-infection-and-credential-theft), [R-EP-005: Insider Threats and Privilege Abuse](../risks/02-endpoints.md#r-ep-005-insider-threats-and-privilege-abuse)*
- *Implementation guidance: [C-EP-005: Endpoint Detection and Response (EDR) Deployment](../controls/02-endpoints.md#c-ep-005-endpoint-detection-and-response-edr-deployment)*

**SP-EP-006: Network Monitoring and Firewall**
- All endpoints MUST have local firewall capabilities enabled
- Network monitoring tools MUST track outbound connections
- DNS filtering MUST be implemented to prevent malicious domain access
- *Addresses risks: [R-EP-001: Malware Infection and Credential Theft](../risks/02-endpoints.md#r-ep-001-malware-infection-and-credential-theft), [R-EP-003: Network-Based Attacks and Lateral Movement](../risks/02-endpoints.md#r-ep-003-network-based-attacks-and-lateral-movement)*
- *Implementation guidance: [C-EP-006: Network Monitoring and Firewall Setup](../controls/02-endpoints.md#c-ep-006-network-monitoring-and-firewall-setup)*

### **Software Management**

**SP-EP-007: Approved Software Inventory**
- Organizations MUST maintain an approved software inventory
- Automatic security updates MUST be enabled for operating systems and critical applications
- Unauthorized software MUST be detected and removed
- *Addresses risks: [R-EP-001: Malware Infection and Credential Theft](../risks/02-endpoints.md#r-ep-001-malware-infection-and-credential-theft), [R-EP-004: Social Engineering Targeting Device Users](../risks/02-endpoints.md#r-ep-004-social-engineering-targeting-device-users)*
- *Implementation guidance: [C-EP-007: Software Inventory and Management](../controls/02-endpoints.md#c-ep-007-software-inventory-and-management)*

**SP-EP-008: Browser Security and Isolation**
- Organizations MUST implement browser isolation for different trust levels
- Cryptocurrency wallet extensions MUST only be used on dedicated browsers
- Web filtering MUST block known malicious and phishing sites
- *Addresses risks: [R-EP-001: Malware Infection and Credential Theft](../risks/02-endpoints.md#r-ep-001-malware-infection-and-credential-theft), [R-EP-003: Network-Based Attacks and Lateral Movement](../risks/02-endpoints.md#r-ep-003-network-based-attacks-and-lateral-movement), [R-EP-004: Social Engineering Targeting Device Users](../risks/02-endpoints.md#r-ep-004-social-engineering-targeting-device-users)*
- *Implementation guidance: [C-EP-008: Browser Security and Isolation](../controls/02-endpoints.md#c-ep-008-browser-security-and-isolation)*

### **Development Security**

**SP-EP-009: Containerized Development Environments**
- Development activities MUST be performed in containerized environments
- Code execution MUST be isolated from the host operating system
- Development containers MUST be created from trusted base images
- *Addresses risks: [R-EP-006: Development Environment Compromise](../risks/02-endpoints.md#r-ep-006-development-environment-compromise)*
- *Implementation guidance: [C-EP-009: Containerized Development Environment Setup](../controls/02-endpoints.md#c-ep-009-containerized-development-environment-setup)*

**SP-EP-010: Source Code Security Scanning**
- Source code MUST be scanned for secrets and vulnerabilities before execution
- Development tools MUST be kept up to date with security patches
- Pre-commit hooks MUST prevent secret commits
- *Addresses risks: [R-EP-006: Development Environment Compromise](../risks/02-endpoints.md#r-ep-006-development-environment-compromise)*
- *Implementation guidance: [C-EP-010: Source Code Security Scanning](../controls/02-endpoints.md#c-ep-010-source-code-security-scanning)*

### **Physical Security**

**SP-EP-011: Physical Device Protection**
- Devices MUST be physically secured when unattended
- Travel security procedures MUST be established for mobile devices
- Cable locks or secure storage MUST be used for unattended devices
- *Addresses risks: [R-EP-002: Physical Device Compromise](../risks/02-endpoints.md#r-ep-002-physical-device-compromise)*
- *Implementation guidance: [C-EP-011: Physical Device Protection](../controls/02-endpoints.md#c-ep-011-physical-device-protection)*

**SP-EP-012: Clean Desk Policies**
- Organizations MUST implement clean desk policies and secure storage requirements
- Sensitive information MUST NOT be left visible on screens or desks
- Physical access to devices MUST be logged and monitored
- *Addresses risks: [R-EP-002: Physical Device Compromise](../risks/02-endpoints.md#r-ep-002-physical-device-compromise), [R-EP-005: Insider Threats and Privilege Abuse](../risks/02-endpoints.md#r-ep-005-insider-threats-and-privilege-abuse)*
- *Implementation guidance: [C-EP-012: Clean Desk and Workspace Security](../controls/02-endpoints.md#c-ep-012-clean-desk-and-workspace-security)*

### **Incident Response**

**SP-EP-013: Device Isolation Capabilities**
- Organizations MUST maintain device isolation capabilities for compromised endpoints
- Remote device wipe capabilities MUST be available for lost or stolen devices
- Forensic capabilities MUST be available for incident investigation
- *Addresses risks: [R-EP-002: Physical Device Compromise](../risks/02-endpoints.md#r-ep-002-physical-device-compromise)*
- *Implementation guidance: [C-EP-013: Device Isolation and Response Capabilities](../controls/02-endpoints.md#c-ep-013-device-isolation-and-response-capabilities)*

**SP-EP-014: Backup and Recovery Procedures**
- Backup and recovery procedures MUST be established and tested
- Business continuity plans MUST account for endpoint compromise scenarios
- Recovery procedures MUST be documented and regularly practiced
- *Addresses risks: [R-EP-002: Physical Device Compromise](../risks/02-endpoints.md#r-ep-002-physical-device-compromise)*
- *Implementation guidance: [C-EP-014: Backup and Recovery Implementation](../controls/02-endpoints.md#c-ep-014-backup-and-recovery-implementation)*