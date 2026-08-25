# W3OS Crosswalk to Other Security Frameworks

**Status:** Domain-level crosswalk, v1. Control-level mappings are provided where the correspondence is direct; a full control-by-control matrix is roadmap.

This crosswalk positions W3OS relative to the other major web3 security frameworks so that:
- **Auditors** can reuse evidence gathered for one framework when assessing another.
- **Organizations** already following SEAL guidance or pursuing DARC/CCSS certification can see what W3OS adds (and vice versa).
- **Contributors** can check coverage claims against the source frameworks.

Frameworks referenced:
- **SEAL** — Security Alliance Frameworks (frameworks.securityalliance.org), CC BY-SA 4.0 reference library
- **DARC** — Digital Asset Risk & Compliance Standard v1.0 (darcstandard.org), 244 controls / 12 domains / 2 tiers
- **CCSS** — CryptoCurrency Security Standard v9 (C4), 41 aspects / 3 levels
- **Digibastion** — digibastion.com checklist, 263 items / 11 categories

## Domain-Level Crosswalk

| W3OS Domain | SEAL Framework(s) | DARC Domain(s) | CCSS | Digibastion |
|---|---|---|---|---|
| 1. Wallet & Multi-Sig Management | Wallet Security; Multisig for Protocols | KM (Key Management); MS (Multisig Governance) | Key generation, storage, usage; keyholder procedures (core overlap) | Crypto Wallet Security; parts of OpSec |
| 2. Endpoint Security | OpSec (Endpoint Security, Secure Operating Systems); Physical Security (partial) | AC (device controls AC-1.08–1.15, AC-2.12–2.15) | — | OS Hardening; Mobile Security; Browsing Security |
| 3. Communications & Social Media | Community Management; Encryption (comms); Infrastructure → Domain & DNS (email auth) | CM-2.03 (account monitoring); FD-1.04 (email auth) | — | Social Media Security; Email Security |
| 4. DevOps & Infrastructure | DevSecOps; Supply Chain; Infrastructure; Monitoring | SD (Secure Development); SY (Supply Chain); FD (Frontend & DNS) | — | Developer Security |
| 5. General Security | Incident Management; Awareness; User & Team Security; DPRK IT Workers; Governance | GV (Governance); IM (Incident Management); AC (access/lifecycle) | Keyholder grant/revoke; audit logs; data sanitization | Authentication; parts of OpSec |
| 6. Financial Controls & Banking + Crypto Treasury | Treasury Operations | TM (Treasury Management) | Proof of reserve (custodial) | — (unique W3OS fiat coverage) |
| 7. AI Agent Operational Security | AI Security | — | — | — |
| 8. Smart Contract & Protocol Operations | External Security Reviews; Vulnerability Disclosure; Governance (proposal security); Security Testing (ops side) | SC (Smart Contract Ops); SY-2.02–2.05 (oracles/RPC); CM (on-chain monitoring) | — | DeFi Security (due-diligence rubric) |

## Notable Control-Level Correspondences

| W3OS | DARC | CCSS / Other | Notes |
|---|---|---|---|
| SP-WM-006/007 (multisig usage, quorum) | MS-1.01, MS-1.02, MS-1.08 | Rekt Test Q8 | DARC adds "no key reuse across multisigs" (our SP-WM-012) |
| SP-WM-009/010 (multi-device / on-device verification) | MS-1.07, MS-2.05 | — | The Bybit control |
| SP-WM-022 (key compromise protocol) | KM-1.08, KM-2.05 | CCSS key compromise policy | CCSS treats this as a core certifiable aspect |
| SP-WM-020 (key generation) | KM-2.01 | CCSS key/seed generation | |
| SP-WM-021 (backup + recovery testing) | KM-1.02–1.04, KM-2.02–2.03 | CCSS key storage | |
| SP-WM-023 (signer lifecycle) | KM-2.06, MS-2.12 | CCSS keyholder grant/revoke | |
| SP-GS-020 (asset inventory) | GV-1.03/1.04, KM-1.07, AC-2.06, AC-2.22, FD-1.01 | — | DARC spreads inventory across 6 controls |
| SP-GS-023/024 (on/offboarding) | AC-1.05, AC-2.16–2.18 | CCSS keyholder procedures | |
| SP-GS-017 (remote worker identity) | SY-2.09 | SEAL DPRK IT Workers framework | |
| SP-GS-025 (media sanitization) | — | CCSS data sanitization | Absent from DARC |
| SP-DI-017/018 (frontend integrity) | FD-2.10/2.11, SY-2.14 | — | |
| SP-DI-020–022 (registrar/DNS) | FD-2.01–2.09 | SEAL Domain & DNS Security | |
| SP-SC-001–004 (audit lifecycle) | SC-1.01–1.03, SC-2.01, SC-2.06, SC-2.09 | Rekt Test Q11 | |
| SP-SC-009/010 (timelocks, upgrades) | SC-2.02–2.04 | DeFiSafety Admin Controls | |
| SP-SC-012/013 (security contact, bounty) | SC-2.08 | Rekt Test Q11 | |
| SP-SC-016–018 (oracles, bridges, RPC) | SY-2.02–2.05, SY-2.11 | — | |
| SP-FC-016–021 (crypto treasury) | TM-1.01–2.18 | — | DARC's largest domain after AC |
| SP-EP-006 (EDR) | AC-2.12 | — | The Radiant Capital control |
| SP-CS-001 (MFA, no SMS) | AC-1.01, AC-2.01/2.02 | — | |

## What W3OS Covers That Peers Do Not

- **Fiat financial controls** (SP-FC-001–015): wire/ACH fraud, banking portals, BEC — no peer framework covers this.
- **AI agent operational security** (Domain 7): only SEAL's newer AI Security framework is comparable; DARC, CCSS, and Digibastion have nothing.
- **Per-service configuration guides at admin and user scope** across cloud platforms, business tools, DevOps accounts, communication platforms, wallet platforms, and security tools.

## What Peers Cover That W3OS Intentionally Defers

- **Smart contract code security** — OWASP SCS, EEA EthTrust, Trail of Bits Building Secure Contracts. W3OS complements audits; it does not replace them.
- **Whitehat legal frameworks** — SEAL Safe Harbor. Organizations should evaluate adopting it directly.
- **Certification mechanics** — DARC and CCSS operate certification programs; W3OS is a self-assessable open standard (see the interactive tracker).
