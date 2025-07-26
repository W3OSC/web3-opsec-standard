# Domain 1: Wallet & Multi-Sig Management

### **Hardware Security**

**SP-WM-001: Authentic Hardware Procurement**
- Hardware wallets should be obtained through verified supply chains
- Device authenticity must be cryptographically verifiable upon receipt
- *Addresses risks: [R-WM-004: Hardware Wallet Vulnerabilities](../risks/01-wallet-multisig.md#r-wm-004-hardware-wallet-vulnerabilities)*
- *Implementation guidance: [C-WM-001: Hardware Wallet Procurement and Verification](../controls/01-wallet-multisig.md#c-wm-001-hardware-wallet-procurement-and-verification)*

**SP-WM-002: Hardware Wallet Capability Requirements**
- Hardware wallets MUST support large screens capable of displaying complete transaction data
- Devices MUST implement secure PIN entry with randomized layouts
- Hardware wallets MUST support firmware integrity verification
- *Addresses risks: [R-WM-004: Hardware Wallet Vulnerabilities](../risks/01-wallet-multisig.md#r-wm-004-hardware-wallet-vulnerabilities)*
- *Implementation guidance: [C-WM-002: Hardware Wallet Selection and Configuration](../controls/01-wallet-multisig.md#c-wm-002-hardware-wallet-selection-and-configuration)*

### **Key Generation and Storage**

**SP-WM-003: Secure Key Generation**
- Private keys MUST be generated exclusively on hardware security devices
- Key generation MUST occur in offline environments
- Organizations MUST never store private keys in digital formats
- *Addresses risks: [R-WM-001: Private Key Compromise](../risks/01-wallet-multisig.md#r-wm-001-private-key-compromise)*
- *Implementation guidance: [C-WM-003: Secure Key Generation Process](../controls/01-wallet-multisig.md#c-wm-003-secure-key-generation-process)*

**SP-WM-004: Mnemonic Phrase Protection**
- Mnemonic phrases MUST be stored on durable, offline media
- Physical storage MUST be resistant to environmental damage
- Access to mnemonic phrases MUST be restricted to authorized personnel only
- *Addresses risks: [R-WM-001: Private Key Compromise](../risks/01-wallet-multisig.md#r-wm-001-private-key-compromise), [R-WM-006: Operational Key Loss](../risks/01-wallet-multisig.md#r-wm-006-operational-key-loss)*
- *Implementation guidance: [C-WM-004: Mnemonic Phrase Backup and Storage](../controls/01-wallet-multisig.md#c-wm-004-mnemonic-phrase-backup-and-storage)*

**SP-WM-005: Key Generation Ceremony**
- Key generation processes MUST be witnessed by multiple authorized individuals
- Generation ceremonies MUST be documented with participant verification
- Organizations MUST maintain audit trails of all key generation activities
- *Addresses risks: [R-WM-001: Private Key Compromise](../risks/01-wallet-multisig.md#r-wm-001-private-key-compromise), [R-WM-006: Operational Key Loss](../risks/01-wallet-multisig.md#r-wm-006-operational-key-loss)*
- *Implementation guidance: [C-WM-003: Secure Key Generation Process](../controls/01-wallet-multisig.md#c-wm-003-secure-key-generation-process)*

### **Multi-Signature Configuration**

**SP-WM-006: Appropriate Threshold Selection**
- Treasury wallets MUST implement minimum 3-of-5 multi-signature schemes
- Operational wallets MUST implement minimum 2-of-3 multi-signature schemes
- Threshold selection MUST account for insider threat scenarios
- *Addresses risks: [R-WM-002: Multi-Signature Wallet Misconfiguration](../risks/01-wallet-multisig.md#r-wm-002-multi-signature-wallet-misconfiguration), [R-WM-006: Operational Key Loss](../risks/01-wallet-multisig.md#r-wm-006-operational-key-loss)*
- *Implementation guidance: [C-WM-005: Multi-Sig Threshold Configuration](../controls/01-wallet-multisig.md#c-wm-005-multi-sig-threshold-configuration)*

**SP-WM-007: Signer Independence**
- Multi-signature signers MUST use independent hardware devices
- Signers MUST operate from separate physical and network environments
- Organizations MUST prevent single points of failure across the signing infrastructure
- *Addresses risks: [R-WM-002: Multi-Signature Wallet Misconfiguration](../risks/01-wallet-multisig.md#r-wm-002-multi-signature-wallet-misconfiguration)*
- *Implementation guidance: [C-WM-006: Signer Independence and Isolation](../controls/01-wallet-multisig.md#c-wm-006-signer-independence-and-isolation)*

**SP-WM-008: Time-Based Controls**
- High-value transactions MUST implement time-lock mechanisms
- Organizations MUST establish veto quorums separate from approval quorums
- Emergency override procedures MUST require enhanced authorization
- *Addresses risks: [R-WM-002: Multi-Signature Wallet Misconfiguration](../risks/01-wallet-multisig.md#r-wm-002-multi-signature-wallet-misconfiguration)*
- *Implementation guidance: [C-WM-007: Time-Lock Implementation](../controls/01-wallet-multisig.md#c-wm-007-time-lock-implementation)*

### **Transaction Security**

**SP-WM-009: Multi-Device Verification**
- All transactions MUST be verified on at least two independent devices
- Transaction data MUST be confirmed through multiple communication channels
- Organizations MUST use transaction simulation tools before signing
- *Addresses risks: [R-WM-003: Social Engineering Attacks Targeting Signers](../risks/01-wallet-multisig.md#r-wm-003-social-engineering-attacks-targeting-signers), [R-WM-005: Transaction Manipulation](../risks/01-wallet-multisig.md#r-wm-005-transaction-manipulation)*
- *Implementation guidance: [C-WM-008: Multi-Device Transaction Verification](../controls/01-wallet-multisig.md#c-wm-008-multi-device-transaction-verification)*

**SP-WM-010: Display Verification**
- Hardware wallet displays MUST be manually verified against expected transaction data
- Organizations MUST implement procedures to detect display spoofing attempts
- All transaction details MUST be human-readable on hardware wallet screens
- *Addresses risks: [R-WM-003: Social Engineering Attacks Targeting Signers](../risks/01-wallet-multisig.md#r-wm-003-social-engineering-attacks-targeting-signers), [R-WM-004: Hardware Wallet Vulnerabilities](../risks/01-wallet-multisig.md#r-wm-004-hardware-wallet-vulnerabilities), [R-WM-005: Transaction Manipulation](../risks/01-wallet-multisig.md#r-wm-005-transaction-manipulation)*
- *Implementation guidance: [C-WM-009: Hardware Display Verification](../controls/01-wallet-multisig.md#c-wm-009-hardware-display-verification)*

**SP-WM-011: Out-of-Band Confirmation**
- Transaction approvals MUST be coordinated through encrypted communication channels
- Organizations MUST use separate communication methods for transaction coordination
- Confirmation processes MUST be resistant to man-in-the-middle attacks
- *Addresses risks: [R-WM-003: Social Engineering Attacks Targeting Signers](../risks/01-wallet-multisig.md#r-wm-003-social-engineering-attacks-targeting-signers), [R-WM-005: Transaction Manipulation](../risks/01-wallet-multisig.md#r-wm-005-transaction-manipulation)*
- *Implementation guidance: [C-WM-010: Out-of-Band Transaction Coordination](../controls/01-wallet-multisig.md#c-wm-010-out-of-band-transaction-coordination)*

### **Operational Security**

**SP-WM-012: Dedicated Signing Environment**
- Multi-signature operations MUST be performed on dedicated devices
- Signing devices MUST be isolated from general computing activities
- Organizations MUST implement network monitoring on signing devices
- *Addresses risks: [R-WM-001: Private Key Compromise](../risks/01-wallet-multisig.md#r-wm-001-private-key-compromise)*
- *Implementation guidance: [C-WM-011: Dedicated Signing Environment Setup](../controls/01-wallet-multisig.md#c-wm-011-dedicated-signing-environment-setup)*

**SP-WM-013: Continuous Monitoring**
- All wallet addresses MUST be monitored for unauthorized activity
- Monitoring systems MUST alert on transactions not initiated through official channels
- Organizations MUST maintain immutable logs of all wallet operations
- *Addresses risks: [R-WM-005: Transaction Manipulation](../risks/01-wallet-multisig.md#r-wm-005-transaction-manipulation)*
- *Implementation guidance: [C-WM-012: Wallet Monitoring and Alerting](../controls/01-wallet-multisig.md#c-wm-012-wallet-monitoring-and-alerting)*

**SP-WM-014: Emergency Response Capability**
- Organizations MUST maintain documented emergency response procedures for wallet incidents
- Break-glass procedures MUST be available for critical situations
- Emergency contacts MUST include specialized Web3 incident response resources
- *Addresses risks: [R-WM-006: Operational Key Loss](../risks/01-wallet-multisig.md#r-wm-006-operational-key-loss)*
- *Implementation guidance: [C-WM-013: Emergency Response Procedures](../controls/01-wallet-multisig.md#c-wm-013-emergency-response-procedures)*

### **Access Control**

**SP-WM-015: Signer Authorization**
- Only authorized individuals MUST have access to signing devices
- Signer authorization MUST be regularly reviewed and updated
- Organizations MUST implement procedures for signer onboarding and offboarding
- *Addresses risks: [R-WM-001: Private Key Compromise](../risks/01-wallet-multisig.md#r-wm-001-private-key-compromise), [R-WM-003: Social Engineering Attacks Targeting Signers](../risks/01-wallet-multisig.md#r-wm-003-social-engineering-attacks-targeting-signers)*
- *Implementation guidance: [C-WM-014: Signer Authorization Management](../controls/01-wallet-multisig.md#c-wm-014-signer-authorization-management)*

**SP-WM-016: Physical Security**
- Signing devices MUST be physically secured when not in use
- Organizations MUST implement access controls for signing environments
- Physical access to signing devices MUST be logged and monitored
- *Addresses risks: [R-WM-001: Private Key Compromise](../risks/01-wallet-multisig.md#r-wm-001-private-key-compromise)*
- *Implementation guidance: [C-WM-015: Physical Security Implementation](../controls/01-wallet-multisig.md#c-wm-015-physical-security-implementation)*