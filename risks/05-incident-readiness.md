# Domain 5: Incident Readiness & Response - Risks

### **R-IR-001: Delayed Incident Detection**
- **Attack Vectors**: Insufficient monitoring, alert fatigue, inadequate threat detection capabilities
- **Impact**: Extended attacker dwell time, increased damage, higher recovery costs
- **Likelihood**: High - Many organizations lack comprehensive monitoring capabilities
- **Addressed by Requirements**: 
  - [SP-IR-004: 24/7 Security Monitoring](../requirements/05-incident-readiness.md#sp-ir-004-247-security-monitoring)
  - [SP-IR-005: Web3-Specific Monitoring](../requirements/05-incident-readiness.md#sp-ir-005-web3-specific-monitoring)
  - [SP-IR-006: Threat Intelligence Integration](../requirements/05-incident-readiness.md#sp-ir-006-threat-intelligence-integration)

### **R-IR-002: Inadequate Response Procedures**
- **Attack Vectors**: Lack of documented procedures, untrained personnel, poor coordination
- **Impact**: Ineffective incident containment, prolonged service disruption, regulatory violations
- **Likelihood**: Medium - Response procedures often untested until needed
- **Addressed by Requirements**: 
  - [SP-IR-001: Comprehensive Incident Response Plans](../requirements/05-incident-readiness.md#sp-ir-001-comprehensive-incident-response-plans)
  - [SP-IR-002: Web3-Specific Response Procedures](../requirements/05-incident-readiness.md#sp-ir-002-web3-specific-response-procedures)
  - [SP-IR-003: Regular Plan Testing and Exercises](../requirements/05-incident-readiness.md#sp-ir-003-regular-plan-testing-and-exercises)
  - [SP-IR-008: Emergency Response Capabilities](../requirements/05-incident-readiness.md#sp-ir-008-emergency-response-capabilities)

### **R-IR-003: Security Awareness Gaps**
- **Attack Vectors**: Successful phishing, social engineering, insider threats due to lack of training
- **Impact**: Initial compromise vectors, credential theft, unauthorized access
- **Likelihood**: High - Human factors remain the primary attack vector
- **Addressed by Requirements**: 
  - [SP-IR-013: Comprehensive Security Training Program](../requirements/05-incident-readiness.md#sp-ir-013-comprehensive-security-training-program)
  - [SP-IR-014: Phishing Simulation and Testing](../requirements/05-incident-readiness.md#sp-ir-014-phishing-simulation-and-testing)
  - [SP-IR-015: Social Engineering Prevention](../requirements/05-incident-readiness.md#sp-ir-015-social-engineering-prevention)

### **R-IR-004: Communication Failures During Incidents**
- **Attack Vectors**: Compromised communication channels, unclear procedures, stakeholder confusion
- **Impact**: Delayed response, misinformation spread, stakeholder confidence loss
- **Likelihood**: Medium - Communication often breaks down under stress
- **Addressed by Requirements**: 
  - [SP-IR-009: Secure Incident Communication](../requirements/05-incident-readiness.md#sp-ir-009-secure-incident-communication)
  - [SP-IR-010: Stakeholder Notification Procedures](../requirements/05-incident-readiness.md#sp-ir-010-stakeholder-notification-procedures)

### **R-IR-005: Insufficient Backup and Recovery Capabilities**
- **Attack Vectors**: Ransomware attacks, data corruption, system failures
- **Impact**: Permanent data loss, extended downtime, business continuity failure
- **Likelihood**: Medium - Backup systems often inadequately tested
- **Addressed by Requirements**: 
  - [SP-IR-016: Business Continuity Planning](../requirements/05-incident-readiness.md#sp-ir-016-business-continuity-planning)
  - [SP-IR-017: Asset Recovery Procedures](../requirements/05-incident-readiness.md#sp-ir-017-asset-recovery-procedures)

### **R-IR-006: Web3-Specific Incident Response Gaps**
- **Attack Vectors**: Smart contract exploits, multi-sig compromises, DeFi protocol attacks
- **Impact**: Irreversible asset loss, inability to pause or recover from attacks
- **Likelihood**: High - Traditional incident response inadequate for Web3 scenarios
- **Addressed by Requirements**: 
  - [SP-IR-002: Web3-Specific Response Procedures](../requirements/05-incident-readiness.md#sp-ir-002-web3-specific-response-procedures)
  - [SP-IR-005: Web3-Specific Monitoring](../requirements/05-incident-readiness.md#sp-ir-005-web3-specific-monitoring)
  - [SP-IR-012: Web3 Forensic Capabilities](../requirements/05-incident-readiness.md#sp-ir-012-web3-forensic-capabilities)
  - [SP-IR-017: Asset Recovery Procedures](../requirements/05-incident-readiness.md#sp-ir-017-asset-recovery-procedures)

---

## Risk Matrix

| Risk ID | Risk Name | Likelihood | Impact | Priority |
|---------|-----------|------------|--------|----------|
| R-IR-001 | Delayed Incident Detection | High | High | Critical |
| R-IR-003 | Security Awareness Gaps | High | High | Critical |
| R-IR-006 | Web3-Specific Response Gaps | High | High | Critical |
| R-IR-002 | Inadequate Response Procedures | Medium | High | High |
| R-IR-004 | Communication Failures | Medium | High | High |
| R-IR-005 | Insufficient Backup/Recovery | Medium | High | High |

---

## References

- [Requirements: Domain 5 - Incident Readiness & Response](../requirements/05-incident-readiness.md)
- [Controls: Domain 5 - Incident Readiness & Response](../controls/05-incident-readiness.md)
