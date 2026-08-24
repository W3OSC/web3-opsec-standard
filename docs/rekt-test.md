# W3OS and the Rekt Test

The [Rekt Test](https://blog.trailofbits.com/2023/08/14/can-you-pass-the-rekt-test/) (Trail of Bits, Immunefi, Polygon Labs, Solana Foundation, Fireblocks, et al., 2023) is the industry's minimal 12-question security baseline for protocol teams. An organization compliant with W3OS answers **yes** to every question. The mapping:

| # | Rekt Test Question | W3OS Coverage |
|---|---|---|
| 1 | Do you have all actors, roles, and privileges documented? | SP-GS-020 (Asset Inventory), SP-GS-010 (Least Privilege), SP-SC-008 (Privileged Function Documentation) |
| 2 | Do you keep documentation of all external services, contracts, and oracles you rely on? | SP-GS-020 (Asset Inventory), SP-SC-016 (Oracle Configuration), SP-SC-017 (Bridge Exposure), SP-DI-007 (Dependency Management) |
| 3 | Do you have a written and tested incident response plan? | SP-GS-001/002/003 (IR Runbooks), SP-FC-014, [Incident Response Playbooks guide](../guides/incident-response-playbooks.md) |
| 4 | Do you document the best ways to attack your own system? | SP-GS-014 (Insider Threat Modeling), SP-GS-022 (Risk Register) |
| 5 | Do you perform identity verification and background checks on all employees? | SP-GS-017 (Remote Worker Identity Verification), SP-GS-023 (Onboarding Checklist), [Hiring Security guide](../guides/hiring-security.md) |
| 6 | Do you have a team member with security defined in their role? | SP-GS-007 (Security Ownership) |
| 7 | Do you require hardware security keys for production systems? | SP-GS-011 (Login Methods), SP-DI-012 (Infrastructure Access Controls), SP-FC-001 (Financial Platform Authentication) |
| 8 | Does your key management system require multiple humans and physical steps? | SP-WM-006/007 (Multisig & Quorum), SP-WM-015 (Dedicated Signing Machines), SP-WM-020 (Key Generation Procedures) |
| 9 | Do you define key invariants for your system and test them on every commit? | Partially: SP-SC-005 (deployment simulation). Code-level invariant testing is intentionally out of W3OS scope — see OWASP SCS / Building Secure Contracts |
| 10 | Do you use the best automated tools to discover security issues in your code? | Partially: SP-DI-004 (Secret Scanning), SP-DI-007 (Dependency Scanning). Code-level SAST/fuzzing is intentionally out of W3OS scope |
| 11 | Do you undergo external audits and maintain a vulnerability disclosure or bug bounty program? | SP-SC-001–004 (Audit Lifecycle), SP-SC-012 (Security Contact), SP-SC-013 (Bug Bounty Program) |
| 12 | Have you considered and mitigated avenues for abusing users of your system? | SP-CS-008 (Organization Identity), SP-SC-015 (Governance Attack Monitoring), SP-DI-019 (Frontend Compromise Response), wallet-drainer playbook in the [IR Playbooks guide](../guides/incident-response-playbooks.md) |

Questions 9 and 10 are the only two where W3OS defers to code-security frameworks — consistent with its positioning as the operational complement to code audits.
