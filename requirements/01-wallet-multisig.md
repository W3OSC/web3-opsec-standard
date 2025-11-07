# Domain 1: Wallet & Multi-Sig Management

## Risks

- R-WM-001: Private Key and Seed Phrase Compromise
- R-WM-002: Multi-Signature Wallet Misconfiguration
- R-WM-003: Social Engineering Attacks Targeting Signers
- R-WM-004: Hardware Wallet Vulnerabilities
- R-WM-005: Transaction Blind Signing
- R-WM-006: Operational Key Loss
- R-WM-007: Malicious or Compromised Signers
- R-WM-008: Transaction Data Tampering
- R-WM-009: Malicious Transaction Proposal Detection Failure
- R-WM-010: Lack of Response Time Delay
- R-WM-011: Degraded Transaction Review Scrutiny
- R-WM-012: Lack of Transaction Review Responsibility
- R-WM-013: Mutable or Missing Monitoring and Alerting
- R-WM-014: Emergency Response Readiness
- R-WM-015: Compromised Multi-sig Coordination Platform
- R-WM-016: Malware Infection of Signer Devices
- R-WM-017: Proposer Impersonation

### **Individual Wallet Security**

**SP-WM-001: Authentic Hardware Procurement**
- Hardware wallets should be obtained through verified supply chains (direct from manufacturer is ideal)
- Device authenticity must be cryptographically verifiable upon receipt

**SP-WM-002: Hardware Wallet Features**
- Hardware wallets must support large screens capable of displaying complete transaction data
- Clear signing technology is recommended
- Devices must have secure PIN entry with randomized entry layouts
- PIN entry must have time-based lockouts to prevent brute force attacks
- Hardware wallets must support firmware integrity verification

**SP-WM-003: Mnemonic Seed Phrase Protection**
- Seed phrases must be stored on disaster-resistant, physical media
- Seed phrases must not be stored in plain text - importing them must require a passphrase, additional word, or be scrambled with a random word order; with the secret stored in a password manager
- Private keys and seed phrases must be generated on wallet devices and must never be exported
- Alternatively, seed phrases can be sharded using Shamir's Secret Sharing algorithm, with each shard recommended to be shared with a trusted guardian (3rd party custodian service, family members, password manager, personal physical media, etc.)

**SP-WM-004: Dedicated Wallet Addresses**
- Multi-sig signers must use dedicated wallet addresses for signing only
- All signing wallets should be monitored for any activity that is not directly related to multi-sig operations

**SP-WM-005: Physical Security**
- Wallets must have a PIN requirement or biometric factor required to access the wallet and approve transactions
- PINs must be at least 6 digits long
- Wallets should be physically secured in a safe or secret hiding place when not in use

### **Multi-Sig Configuration and Transaction Security**

**SP-WM-006: Multi-sig Usage**
- Smart contract ownership/administration and treasury operations must be managed by an on-chain multi-sig
- Multi-sigs must be configured such that they cannot be altered or bypassed without satisfying the signature requirements

**SP-WM-007: Quorum Selection**
- Multi-sig wallets must implement a minimum 3-of-5 signer quorum
- Multi-sigs managing high value wallets and contracts should have at least 1 additional required signer that is external to the organization (such as a security partner or trusted advisor)
- Signers should be diverse individuals to reduce risk of multiple compromised accounts - a mix of executives, developers, and operational roles is recommended

**SP-WM-008: Transaction Time Locks**
- Multi-sig wallets must include a time-lock mechanism on all transactions
- Time-locks should delay transactions a minimum of 3 days
- Organizations can establish veto quorums to bypass time-locks in case of emergency
- The standard quorum plus two additional signers should be required to bypass

**SP-WM-009: Multi-Device Verification**
- All signers must verify transaction data on at least two independent devices
- All signers must verify transaction data through at least two separate communication channels
- At least 2 signers must use transaction simulation tools to verify transaction effects will be as expected
  - All signers should verify the output of the transaction simulations before signing

**SP-WM-010: On-device Verification**
- Hardware wallet displays must be manually verified against expected transaction data before signing
- All transaction details must be human-readable on hardware wallet screens
- Entire transaction details must be fully reviewed and scrutinized - if not possible, then expected transaction hashes must be computed by multiple parties (shared via secure, redundant channels) and verified against hardware wallet displays
- Clear-signing technology can be used, but is not a substitute for manual scrutiny

**SP-WM-011: Hot Wallet Usage**
- A hot wallet must be used as an intermediary for treasury wallets
- A cold wallet must be used to store the majority of assets, with only basic transfers to the hot wallet address allowed
- Hot wallet must have a minimum 2-of-3 signer quorum

**SP-WM-012: Wallet Segregation**
- Very high value assets must be distributed amongst separate wallets to prevent potential loss of all assets
- Segregated wallets should be managed by different multi-sigs
- Seldom used wallets should have increased time-lock periods and any activity on them should trigger alerts to the entire team

**SP-WM-013: Address Whitelisting**
- Approved smart contract and wallet addresses must be added to a whitelist that is enforced at the contract-level
- Interactions with all other addresses should be denied and revert the transaction
- Updating the whitelist should require an extra signer in addition to the standard transaction approval quorum

### **Operational Security and Access Control**

**SP-WM-014: Out-of-Band Confirmation**
- Transaction proposals and verification must be coordinated through end-to-end encrypted communication channels (e.g. Signal)
- Organizations must use redundant communication channels for transaction coordination
- Links to URLs containing transaction requests or confirmation data (even those provided by trusted parties) must never be clicked - they must be navigated to by using bookmarks or typing them out manually

**SP-WM-015: Dedicated Signing Machines**
- Multi-sig operations must be performed on devices dedicated only to these transactions and verification tools
- All network access should be default blocked, with only the minimum necessary IPs to execute these transaction signatures allowed
- Signing devices must be operated on private, authenticated networks or over trusted VPNs
- Organizations must implement active network monitoring on signing devices

**SP-WM-016: Continuous Monitoring**
- All multi-sig wallet addresses must be monitored for unauthorized activity
- Authorized transactions awaiting time lock delay should be monitored, with at least 1 dedicated reviewer outside of the signing quorum
- Monitoring channels (e.g. email, Slack or Telegram chats) must be immutable (or trigger alerts when their configuration changes or logs are deleted/tampered with) and redundant such that an admin could not disable or tamper with one monitoring channel without generating an alert on the other channel

**SP-WM-017: Self-hosted Multi-sig UI**
- Multi-sig coordination UIs should be self-hosted to eliminate supply chain risk
- Hosted UI should be IP restricted to allow access only from signer machines

**SP-WM-018: Transaction Simulation**
- Multi-sig transactions must always be simulated in a mainnet-like environment to ensure expected state changes before proposing for multi-sig transacting
- At least 2 signers must perform simulation testing separately
- Simulation testing output should be shared with and reviewed by all signers before signing a proposal
- Local simulation tools are more secure, but a trusted platform such as Tenderly is acceptable

**SP-WM-019: External Party Security Monitoring**
- A third party outside of the organization should be set up to monitor time locked transactions for anomalies and unintended transaction effects
- The external monitor must perform transaction simulation of all pending transactions
- Monitor reports must be delivered at least 48 business hours before the time lock for a transaction lapses in order to provide adequate time to respond in the event of an anomaly
