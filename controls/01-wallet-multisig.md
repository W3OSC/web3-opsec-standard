# Controls 1: Wallet & Multi-Sig Management

## Hardware Security Controls

### **C-WM-001: Hardware Wallet Procurement and Verification**
*Implements: [SP-WM-001: Authentic Hardware Procurement](../requirements/01-wallet-multisig.md#sp-wm-001-authentic-hardware-procurement)*

**Implementation Steps:**
- Purchase hardware wallets directly from manufacturer websites only
- Verify device authenticity using manufacturer-provided tools:
  - **Ledger**: Use Ledger Live to verify device authenticity through cryptographic attestation
  - **GridPlus Lattice**: Follow [authentication guide](https://docs.gridplus.io/lattice1/lattice1-guides/how-to-verify-that-your-lattice1-is-authentic)
  - **Trezor**: Use Trezor Suite to authenticate device integrity
- Document serial numbers and verification results
- Report any failed authenticity checks to manufacturer immediately

### **C-WM-002: Hardware Wallet Selection and Configuration**
*Implements: [SP-WM-002: Hardware Wallet Capability Requirements](../requirements/01-wallet-multisig.md#sp-wm-002-hardware-wallet-capability-requirements)*

**Recommended Devices:**
- **Ledger Stax/Flex**: Large touchscreen, Clear Signing support
- **GridPlus Lattice1**: Large screen, excellent transaction display
- **Trezor Safe 5**: Secure PIN entry, good screen size

**Configuration Requirements:**
- Set PIN to minimum 6 digits (8+ recommended)
- Enable PIN shuffle/randomization if available
- Configure screen timeout to 2-5 minutes maximum
- Enable firmware auto-update notifications
- Disable any unnecessary features or integrations

---

## Key Generation and Storage Controls

### **C-WM-003: Secure Key Generation Process**
*Implements: [SP-WM-003: Secure Key Generation](../requirements/01-wallet-multisig.md#sp-wm-003-secure-key-generation)*

**Key Generation Ceremony:**
1. **Environment Preparation:**
   - Use air-gapped or network-isolated environment
   - Ensure physical security of generation location
   - Have multiple witnesses present for treasury wallets

2. **Device Initialization:**
   - Generate new seed phrase directly on hardware device
   - Never import existing seed phrases from other sources
   - Verify entropy source is hardware-based

3. **Documentation:**
   - Record device serial numbers and firmware versions
   - Document witness identities and signatures
   - Create generation timestamp and location records
   - Store documentation separately from seed phrases

### **C-WM-004: Mnemonic Phrase Backup and Storage**
*Implements: [SP-WM-004: Mnemonic Phrase Protection](../requirements/01-wallet-multisig.md#sp-wm-004-mnemonic-phrase-protection)*

**Physical Storage Options:**
- **Metal Backup Plates**: Use fireproof metal plates (Cryptosteel, Billfodl)
- **Distributed Storage**: Split across multiple secure locations
- **Safe Deposit Boxes**: Use for high-value treasury wallets

**Security Measures:**
- Never store seed phrases digitally
- Use tamper-evident storage containers
- Consider encoding with Caesar cipher for additional security
- Implement Shamir's Secret Sharing for critical wallets:
  - Use 3-of-5 or 5-of-7 schemes for treasury wallets
  - Distribute shares to trusted parties in different locations
  - Document share distribution and recovery procedures

---

## Multi-Signature Configuration Controls

### **C-WM-005: Multi-Sig Threshold Configuration**
*Implements: [SP-WM-006: Appropriate Threshold Selection](../requirements/01-wallet-multisig.md#sp-wm-006-appropriate-threshold-selection)*

**Threshold Requirements:**
- **Treasury Wallets**: Minimum 3-of-5 configuration
- **Operational Wallets**: Minimum 2-of-3 configuration
- **Emergency Wallets**: Consider 2-of-4 for faster response

**Safe Multi-Sig Setup:**
1. Use Safe (formerly Gnosis Safe) for multi-sig creation
2. Host your own Safe UI using [safe-wallet-monorepo](https://github.com/safe-global/safe-wallet-monorepo)
3. Configure appropriate gas limits and transaction limits
4. Set up transaction simulation before signing

### **C-WM-006: Signer Independence and Isolation**
*Implements: [SP-WM-007: Signer Independence](../requirements/01-wallet-multisig.md#sp-wm-007-signer-independence)*

**Device Isolation:**
- Each signer must use dedicated hardware wallet
- Signing devices must be on separate networks
- Use different hardware wallet brands across signers when possible
- Implement separate physical security for each signing location

**Network Isolation:**
- Create separate "guest" WiFi networks for signing devices
- Consider cellular data plans for critical signers
- Use VPN connections when signing from public networks
- Monitor network traffic on signing devices with tools like Little Snitch

### **C-WM-007: Time-Lock Implementation**
*Implements: [SP-WM-008: Time-Based Controls](../requirements/01-wallet-multisig.md#sp-wm-008-time-based-controls)*

**Time-Lock Configuration:**
- Use [Zodiac Delay Modifier](https://github.com/gnosisguild/zodiac-modifier-delay) for Safe wallets
- Set minimum 24-hour delay for treasury transactions >$100K
- Set minimum 1-hour delay for operational transactions >$10K
- Configure separate veto quorum (2-of-5 for treasury, 1-of-3 for operational)

**Emergency Override:**
- Establish break-glass procedures for critical situations
- Require enhanced authorization (additional signatures + time delay)
- Document all emergency override usage
- Conduct post-incident reviews for all overrides

---

## Transaction Security Controls

### **C-WM-008: Multi-Device Transaction Verification**
*Implements: [SP-WM-009: Multi-Device Verification](../requirements/01-wallet-multisig.md#sp-wm-009-multi-device-verification)*

**Verification Process:**
1. **Primary Verification**: Review transaction on Safe UI
2. **Secondary Verification**: Check transaction details on mobile device
3. **Hardware Verification**: Confirm all details on hardware wallet screen
4. **Simulation**: Use Tenderly or similar to simulate transaction effects

**Verification Tools:**
- [Safe Transaction Hash Utility](https://github.com/pcaversaccio/safe-tx-hashes-util)
- [Calldata Decoder](https://calldata.swiss-knife.xyz/decoder)
- [Tenderly Simulation](https://tenderly.co/)
- [Rabby Wallet](https://rabby.io/) for transaction insights

### **C-WM-009: Hardware Display Verification**
*Implements: [SP-WM-010: Display Verification](../requirements/01-wallet-multisig.md#sp-wm-010-display-verification)*

**Display Verification Checklist:**
- [ ] Recipient address matches expected destination
- [ ] Transaction amount matches intended value
- [ ] Gas limit and gas price are reasonable
- [ ] Contract interaction data is as expected
- [ ] No unexpected additional transactions in batch

**Anti-Spoofing Measures:**
- Compare transaction hash on hardware wallet with Safe UI
- Verify contract addresses against known good addresses
- Use multiple hardware wallets to cross-verify transaction data
- Never rely solely on Clear Signing - always verify raw data

### **C-WM-010: Out-of-Band Transaction Coordination**
*Implements: [SP-WM-011: Out-of-Band Confirmation](../requirements/01-wallet-multisig.md#sp-wm-011-out-of-band-confirmation)*

**Communication Channels:**
1. **Primary**: Signal group chat with all signers
2. **Secondary**: Encrypted email or internal ticketing system
3. **Tertiary**: Voice call for high-value transactions

**Coordination Process:**
1. Transaction proposer shares details in Signal group
2. All signers confirm transaction details independently
3. Signers verify transaction hash matches across all channels
4. Voice confirmation for transactions >$50K
5. Document all confirmations before signing

---

## Operational Security Controls

### **C-WM-011: Dedicated Signing Environment Setup**
*Implements: [SP-WM-012: Dedicated Signing Environment](../requirements/01-wallet-multisig.md#sp-wm-012-dedicated-signing-environment)*

**Hardware Requirements:**
- Dedicated laptop for signing operations only
- Minimum hardware specifications for security tools
- Hardware security key for device authentication
- Privacy screen for public use

**Software Configuration:**
- Install minimal required software only
- Enable full disk encryption (BitLocker/FileVault)
- Install network monitoring tool (Little Snitch/Lulu)
- Configure automatic security updates
- Install endpoint detection and response (EDR) if available

**Network Security:**
- Create separate WiFi network for signing devices
- Configure DNS to use Cloudflare (1.1.1.1) or Quad9
- Install local firewall with restrictive rules
- Use VPN for all public network access

### **C-WM-012: Wallet Monitoring and Alerting**
*Implements: [SP-WM-013: Continuous Monitoring](../requirements/01-wallet-multisig.md#sp-wm-013-continuous-monitoring)*

**Monitoring Services:**
- [Hexagate Real-time Prevention](https://www.hexagate.com/real-time-prevention)
- [Hypernative](https://www.hypernative.io/)
- [Tenderly Web3 Actions](https://tenderly.co/web3-actions)
- [Safe Watcher](https://github.com/Gearbox-protocol/safe-watcher) for Telegram alerts

**Alert Configuration:**
- Immediate alerts for any unauthorized transactions
- Daily balance reports for all monitored wallets
- Alerts for new signers added to multi-sig wallets
- Notifications for failed transaction attempts
- Alerts for unusual transaction patterns or amounts

**Alert Channels:**
- Primary: Telegram channel with all team members
- Secondary: Discord bot notifications
- Tertiary: Email alerts to security team
- Emergency: SMS alerts for critical events

### **C-WM-013: Emergency Response Procedures**
*Implements: [SP-WM-014: Emergency Response Capability](../requirements/01-wallet-multisig.md#sp-wm-014-emergency-response-capability)*

**Emergency Response Runbook:**

**Multi-Sig Wallet Compromise:**
1. Immediately freeze multi-sig contract if possible
2. Revoke access for compromised signers
3. Contact [SEAL 911](https://github.com/security-alliance/seal-911) for assistance
4. Notify all exchanges and relevant parties
5. Begin forensic analysis of compromise vector

**Unauthorized Transaction Detection:**
1. Verify transaction legitimacy with all signers
2. If unauthorized, attempt to front-run with higher gas
3. Contact MEV protection services if available
4. Document all evidence for forensic analysis
5. Notify relevant authorities and exchanges

**Hardware Wallet Compromise:**
1. Immediately transfer funds to new wallet
2. Revoke compromised wallet from all multi-sigs
3. Analyze compromise vector and update procedures
4. Replace compromised hardware with new device
5. Update all team members on new procedures

---

## Access Control and Physical Security Controls

### **C-WM-014: Signer Authorization Management**
*Implements: [SP-WM-015: Signer Authorization](../requirements/01-wallet-multisig.md#sp-wm-015-signer-authorization)*

**Authorization Process:**
1. **Background Verification**: Verify identity and background of new signers
2. **Training Requirements**: Complete wallet security training program
3. **Device Provisioning**: Provide dedicated hardware wallet and laptop
4. **Access Documentation**: Document all access grants and reviews
5. **Regular Reviews**: Quarterly review of all signer authorizations

**Onboarding Checklist:**
- [ ] Identity verification completed
- [ ] Security training completed and documented
- [ ] Hardware wallet configured and tested
- [ ] Signing environment set up and verified
- [ ] Emergency contact information collected
- [ ] Backup procedures tested and documented

**Offboarding Process:**
1. Remove signer from all multi-sig wallets
2. Collect all organizational hardware
3. Verify no unauthorized copies of seed phrases
4. Update emergency contact lists
5. Document offboarding completion

### **C-WM-015: Physical Security Implementation**
*Implements: [SP-WM-016: Physical Security](../requirements/01-wallet-multisig.md#sp-wm-016-physical-security)*

**Device Storage:**
- Use locking desk drawers or safes for hardware wallets
- Store devices separately from backup seed phrases
- Use cable locks for laptops when unattended
- Implement clean desk policies for signing areas

**Access Controls:**
- Badge access for signing rooms/areas
- Security cameras for high-value signing locations
- Visitor logs and escort requirements
- Physical access reviews and updates

**Travel Security:**
- Use dedicated travel devices with limited access
- Avoid carrying hardware wallets through high-risk areas
- Use privacy screens on all devices
- Implement device wipe procedures for border crossings

---

## Testing and Validation Controls

### **C-WM-016: Regular Security Testing**

**Monthly Testing:**
- Test transaction signing process with small amounts
- Verify all monitoring and alerting systems
- Test emergency communication channels
- Review and update emergency contact information

**Quarterly Testing:**
- Full emergency response drill
- Hardware wallet firmware updates
- Review and test backup recovery procedures
- Update and test break-glass procedures

**Annual Testing:**
- Complete security audit of wallet infrastructure
- Penetration testing of signing environments
- Review and update all procedures and documentation
- Training refresher for all authorized signers

---

## References and Tools

### **Security Tools:**
- [Safe Multi-Sig Wallet](https://safe.global/)
- [Safe Transaction Hash Utility](https://github.com/pcaversaccio/safe-tx-hashes-util)
- [Zodiac Delay Modifier](https://github.com/gnosisguild/zodiac-modifier-delay)
- [Little Snitch Network Monitor](https://www.obdev.at/products/littlesnitch/)
- [Lulu Free Firewall](https://objective-see.org/products/lulu.html)

### **Monitoring Services:**
- [Hexagate](https://www.hexagate.com/)
- [Hypernative](https://www.hypernative.io/)
- [Tenderly](https://tenderly.co/)
- [Safe Watcher](https://github.com/Gearbox-protocol/safe-watcher)

### **Hardware Recommendations:**
- [Ledger Stax](https://shop.ledger.com/products/ledger-stax)
- [GridPlus Lattice1](https://gridplus.io/products/grid-lattice1)
- [Trezor Safe 5](https://trezor.io/trezor-safe-5)

### **Emergency Resources:**
- [SEAL 911](https://github.com/security-alliance/seal-911)
- [Blockchain Forensics Specialists](https://chainalysis.com/)
