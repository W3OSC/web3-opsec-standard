<!--
id: hiring-security-organization-guide
type: GUIDE
scope: ORGANIZATION
-->

# Hiring & Contributor Vetting Guide

*Defense against DPRK IT workers and remote-worker identity fraud*

Supports requirements **SP-GS-017** (Enhanced Identity Verification for Remote Workers) and **SP-GS-018** (Leaked Credential Monitoring). Addresses risks **R-GS-018** (Nation-State Operative Infiltration Via Hiring) and **R-GS-019** (Remote Worker Identity Fraud and Impersonation). Benchmark: [SEAL's](https://frameworks.securityalliance.org/) DPRK IT Workers framework.

---

## Overview

Nation-state operatives - most prominently North Korean (DPRK) IT workers - systematically infiltrate web3 organizations through remote hiring. They apply with fabricated or stolen identities, purchased developer accounts, and plagiarized portfolios, then use legitimate employment to earn sanctioned revenue, exfiltrate code and secrets, and position themselves for theft. This is not hypothetical: the March 2024 [Munchables](https://rekt.news/munchables-rekt) incident saw ~$62.5M drained by a developer the team had hired remotely, later linked to DPRK operatives, and multiple firms have unknowingly employed several DPRK workers at once - sometimes vouching for each other. Hiring is a security boundary. Treat identity verification, staged access, and payment controls as seriously as you treat key management.

---

## Red Flags

💡 **No single indicator is proof - but multiple indicators together warrant pausing the process and escalating to your security owner before any offer or access is granted.**

**Identity & Documents**
- [ ] Inconsistent identity documents (name spellings, dates, or photos that don't match across documents and profiles)
- [ ] Reused or template-like resumes, or profile photos that appear AI-generated or belong to other people (reverse-image search them)
- [ ] Contact details that don't hold up: VoIP-only phone numbers, freshly registered email domains, no verifiable footprint under the claimed name

**Interview Behavior**
- [ ] Refusal to appear on camera, or a camera that is perpetually "not working" or "broken"
- [ ] Answers that appear scripted, read from a second screen, or coached by an off-camera third party
- [ ] Long response delays inconsistent with a live conversation (relayed answers)

**Location & Accounts**
- [ ] IP addresses, VPN exit points, or device timezones that don't match the claimed location
- [ ] Working hours consistently inconsistent with the claimed timezone
- [ ] Freshly created, purchased, or rented developer accounts (GitHub/LinkedIn accounts with sudden activity spikes, renamed histories, or contribution patterns that don't match the claimed career)
- [ ] Portfolio plagiarism - projects copied from other developers or claimed contributions that don't appear in commit history

**Payment**
- [ ] Requests to route salary to third parties, money service businesses, or exchange deposit addresses
- [ ] Frequent changes of payment details, especially soon after onboarding
- [ ] Preference for payment in crypto to fresh addresses when fiat payroll to a verified account is offered

---

## Interview Verification Procedures

💡 **Verify the human, not just the skills. Every step below should be completed before an offer is extended.**

- [ ] **Live Video Requirement**: Conduct all interviews on live video with the camera on - a candidate who cannot ever appear on camera is disqualifying for privileged roles
- [ ] **Document Check on Camera**: Have the candidate hold their government-issued identity document to the camera and confirm the photo, name, and details match the person and application
- [ ] **Unscripted Segments**: Include unscripted conversational segments (background, opinions, follow-up questions on their own resume) to defeat coached or relayed answers
- [ ] **Multiple Interviewers**: Require video interviews with multiple team members across separate sessions (per SP-GS-017) and compare notes on appearance, voice, and story consistency
- [ ] **Background Checks**: Perform background checks proportional to the access the role will have; for high-privilege roles, require in-person meetings or trusted third-party verification
- [ ] **Independent Reference Verification**: Verify claimed employers and references independently - find the company's official channels yourself and confirm the reference actually works there; never rely solely on contact details the candidate provides
- [ ] **GitHub History Authenticity**: Cross-check the candidate's GitHub/GitLab history - account age, commit email addresses, contribution timezones, whether "their" projects were actually authored by them or forked/copied
- [ ] **Consistency Cross-Check**: Confirm the candidate's stated location matches interview IP/timezone data and their claimed working hours

---

## Onboarding Controls

💡 **Assume vetting can fail. Structure onboarding so a fraudulent hire cannot reach anything catastrophic before trust is earned.**

- [ ] **Staged Access**: Grant access in stages - no access to signing keys, treasury/funds, production infrastructure, or customer data during an initial probation window (e.g. first 90 days), regardless of role
- [ ] **Organization-Procured Devices**: Ship an organization-procured and managed device before granting repository or internal-system access; never allow unmanaged personal devices for new hires (see the Personal Security Checklist for device standards)
- [ ] **Verified Payment Destination**: Pay salary only to a verified bank account in the verified legal name of the hire - refuse third-party payees, money mules, and exchange deposit addresses
- [ ] **Re-Verification on Payment Changes**: Treat any payment-detail change request as high risk - re-verify identity on live video via a known-good channel before changing payroll details
- [ ] **Least-Privilege Defaults**: Provision accounts with minimum necessary permissions and expand only with documented approval as the probation window passes
- [ ] **Onboarding Monitoring**: Flag anomalies during the probation window - logins from unexpected countries, VPN-only access, mass cloning of repositories, or interest in systems outside the role's scope

---

## Pseudonymous Contributors

💡 **Web3 has a legitimate pseudonymity culture - but pseudonymity and privileged access are mutually exclusive.**

Pseudonymous open-source contributions are acceptable **only** under enhanced code review (per SP-DI-008): additional approvers on every contribution, contribution tracking that flags unexpected changes such as commit rewrites or unprompted edits, and privileges restricted to the minimum necessary.

- [ ] Pseudonymous contributors must **never** receive access to signing keys, funds, production infrastructure, deployment pipelines, or secrets
- [ ] All pseudonymous contributions must pass enhanced code review with additional approvers before merge (per SP-DI-008)
- [ ] Pseudonymous contributors must not be able to trigger deployments or approve other contributors' changes
- [ ] Promotion from pseudonymous contributor to trusted (identified) team member must require the full verification procedures in this guide - prior code contributions are not a substitute for identity verification

---

## Ongoing Monitoring

💡 **Vetting is not a one-time event. DPRK operatives are patient, and a clean hire can be a compromised or coerced one later.**

- [ ] **Periodic Re-Verification**: Periodically re-verify identity for privileged roles (live video with camera on, ideally recurring in-person contact) and re-run background checks when access levels increase
- [ ] **Credential Monitoring**: Monitor for leaked credentials belonging to team members (per SP-GS-018) and force resets plus access review on any hit
- [ ] **Behavioral Anomalies**: Watch for behavioral anomalies - shifted working hours, sudden access-pattern changes, laundered or overlapping identities across contractors, one worker's voice or style varying between calls, or multiple "employees" who appear to be the same operator
- [ ] **Cross-Worker Correlation**: Correlate indicators across your contractor pool - shared devices, IPs, payment destinations, or referrals between suspicious workers (DPRK operatives frequently vouch for each other)

**Exit Procedures on Suspicion**
- [ ] Coordinate with legal counsel **before** acting - sanctions implications (e.g. OFAC) mean paying or continuing to pay a confirmed DPRK worker carries its own legal risk
- [ ] Do **not** tip off the suspect - avoid confrontation, sudden access questions, or hints of investigation while evidence is being gathered
- [ ] Quietly restrict or shadow-limit access to critical systems while investigating, and prepare simultaneous revocation of all accounts, sessions, and tokens for the moment of termination
- [ ] Preserve evidence - devices, logs, communications, payment records, and identity documents - for law enforcement; do not wipe or return equipment prematurely
- [ ] Review everything the account touched (code, secrets, infrastructure) and rotate any credentials or keys the worker could have accessed
- [ ] Report to the [FBI IC3](https://www.ic3.gov/) and other relevant authorities, and notify [SEAL 911](https://github.com/security-alliance/seal-911) if organization funds or keys may be at risk
