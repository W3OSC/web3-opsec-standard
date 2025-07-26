# Domain 2: Endpoint Security - Risks

### **R-EP-001: Malware Infection and Credential Theft**
- **Attack Vectors**: Malicious downloads, email attachments, compromised websites, supply chain attacks
- **Impact**: Theft of private keys, session hijacking, unauthorized access to Web3 assets
- **Likelihood**: High - Endpoints are primary attack vectors for sophisticated malware
- **Addressed by Requirements**: 
  - [SP-EP-005: Endpoint Detection and Response (EDR)](../requirements/02-endpoints.md#sp-ep-005-endpoint-detection-and-response-edr)
  - [SP-EP-006: Network Monitoring and Firewall](../requirements/02-endpoints.md#sp-ep-006-network-monitoring-and-firewall)
  - [SP-EP-007: Approved Software Inventory](../requirements/02-endpoints.md#sp-ep-007-approved-software-inventory)
  - [SP-EP-008: Browser Security and Isolation](../requirements/02-endpoints.md#sp-ep-008-browser-security-and-isolation)

### **R-EP-002: Physical Device Compromise**
- **Attack Vectors**: Device theft, physical access, evil maid attacks, hardware tampering
- **Impact**: Direct access to stored credentials, offline attacks on encrypted data
- **Likelihood**: Medium - Particularly high for mobile workers and remote teams
- **Addressed by Requirements**: 
  - [SP-EP-002: Full Disk Encryption](../requirements/02-endpoints.md#sp-ep-002-full-disk-encryption)
  - [SP-EP-004: Automatic Screen Locks](../requirements/02-endpoints.md#sp-ep-004-automatic-screen-locks)
  - [SP-EP-011: Physical Device Protection](../requirements/02-endpoints.md#sp-ep-011-physical-device-protection)
  - [SP-EP-012: Clean Desk Policies](../requirements/02-endpoints.md#sp-ep-012-clean-desk-policies)
  - [SP-EP-013: Device Isolation Capabilities](../requirements/02-endpoints.md#sp-ep-013-device-isolation-capabilities)

### **R-EP-003: Network-Based Attacks and Lateral Movement**
- **Attack Vectors**: Man-in-the-middle attacks, network sniffing, compromised network infrastructure
- **Impact**: Interception of sensitive communications, unauthorized network access
- **Likelihood**: Medium - Requires network access but can be highly effective
- **Addressed by Requirements**: 
  - [SP-EP-006: Network Monitoring and Firewall](../requirements/02-endpoints.md#sp-ep-006-network-monitoring-and-firewall)
  - [SP-EP-008: Browser Security and Isolation](../requirements/02-endpoints.md#sp-ep-008-browser-security-and-isolation)

### **R-EP-004: Social Engineering Targeting Device Users**
- **Attack Vectors**: Phishing emails, malicious links, fake software updates, tech support scams
- **Impact**: Installation of malware, credential disclosure, unauthorized system access
- **Likelihood**: High - Human factors remain the weakest security link
- **Addressed by Requirements**: 
  - [SP-EP-003: Multi-Factor Authentication](../requirements/02-endpoints.md#sp-ep-003-multi-factor-authentication)
  - [SP-EP-007: Approved Software Inventory](../requirements/02-endpoints.md#sp-ep-007-approved-software-inventory)
  - [SP-EP-008: Browser Security and Isolation](../requirements/02-endpoints.md#sp-ep-008-browser-security-and-isolation)

### **R-EP-005: Insider Threats and Privilege Abuse**
- **Attack Vectors**: Malicious insiders, compromised privileged accounts, unauthorized access
- **Impact**: Data exfiltration, system compromise, unauthorized transactions
- **Likelihood**: Low - But potentially high impact when successful
- **Addressed by Requirements**: 
  - [SP-EP-001: Dedicated Device Provisioning](../requirements/02-endpoints.md#sp-ep-001-dedicated-device-provisioning)
  - [SP-EP-003: Multi-Factor Authentication](../requirements/02-endpoints.md#sp-ep-003-multi-factor-authentication)
  - [SP-EP-005: Endpoint Detection and Response (EDR)](../requirements/02-endpoints.md#sp-ep-005-endpoint-detection-and-response-edr)
  - [SP-EP-012: Clean Desk Policies](../requirements/02-endpoints.md#sp-ep-012-clean-desk-policies)

### **R-EP-006: Development Environment Compromise**
- **Attack Vectors**: Compromised development tools, malicious dependencies, insecure coding practices
- **Impact**: Code injection, supply chain attacks, compromise of production systems
- **Likelihood**: Medium - Development environments often have relaxed security controls
- **Addressed by Requirements**: 
  - [SP-EP-009: Containerized Development Environments](../requirements/02-endpoints.md#sp-ep-009-containerized-development-environments)
  - [SP-EP-010: Source Code Security Scanning](../requirements/02-endpoints.md#sp-ep-010-source-code-security-scanning)

---

## Risk Matrix

| Risk ID | Risk Name | Likelihood | Impact | Priority |
|---------|-----------|------------|--------|----------|
| R-EP-001 | Malware Infection and Credential Theft | High | High | Critical |
| R-EP-004 | Social Engineering Targeting Device Users | High | High | Critical |
| R-EP-002 | Physical Device Compromise | Medium | High | High |
| R-EP-003 | Network-Based Attacks | Medium | High | High |
| R-EP-006 | Development Environment Compromise | Medium | High | High |
| R-EP-005 | Insider Threats and Privilege Abuse | Low | High | Medium |

---

## References

- [Requirements: Domain 2 - Endpoint Security](../requirements/02-endpoints.md)
- [Controls: Domain 2 - Endpoint Security](../controls/02-endpoints.md)
