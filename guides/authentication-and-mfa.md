---
id: authentication-and-mfa-individual-guide
type: GUIDE
scope: INDIVIDUAL
---

<div align="center">
  <h1>Authentication & MFA Guide</h1>
  <p><em>Passwords, Passkeys, TOTP, and Hardware Keys</em></p>
</div>

---

## Overview

Authentication and multi-factor authentication (MFA) are critical security controls that protect access to accounts and systems. This guide provides recommendations for implementing strong authentication methods based on account sensitivity levels. Phishing-resistant authentication methods should be used for high-sensitivity accounts whenever possible.

---

## MFA Basics

Multi-factor authentication requires authentication from multiple independent factors:

- **Something you know** (password, PIN, recovery secret)
- **Something you have** (phone, laptop, hardware key)
- **Something you are** (biometrics: fingerprint, face)

Strong authentication requires **at least 2** of these factors. For **high-sensitivity** accounts, **all 3** factors should be required where practical.

---

## Recommended Setups by Risk Level

### Low Sensitivity
Examples: throwaway accounts, low-impact services, accounts without financial privileges.

- [ ] **Password + TOTP (2FA)**

### Medium Sensitivity
Examples: SaaS tools, community accounts, accounts that could be used for reputation damage.

- [ ] **Passkey (PIN or biometric) (2FA)**
- [ ] OR **Password + Passkey (2FA/3FA depending on unlock method)** if the service supports requiring both
- [ ] **Fallback:** Password + TOTP (2FA) if passkeys are not supported

### High Sensitivity
Examples: primary email, GitHub/org admin, production infrastructure, exchange accounts, custody-adjacent accounts.

- [ ] **Hardware key + PIN/biometric + Password (3FA)** (Example: YubiKey Bio + password)
- [ ] OR **Password + Passkey unlocked by biometric (3FA)** (Example: password + passkey + biometric unlock)
- [ ] **If hardware keys cannot be operationally carried reliably:**
  - [ ] Keep the hardware key in a secure location (e.g. a safe)
  - [ ] Use **passkey** on your phone for on-the-go access
  - [ ] Use **TOTP** only where stronger methods are not supported

### Critical Sensitivity
Examples: treasury, multisig signer accounts, domain registrar, root/admin identities, accounts that can irreversibly move funds.

- [ ] **Phishing-resistant authentication everywhere** (hardware key / passkey)
- [ ] **Two independent phishing-resistant factors** where supported (primary + backup)
- [ ] Recovery paths must be hardened (see Recovery Hardening section below)

---

## Quick Decision Matrix

Choose the strongest authentication option that can be maintained.

| Method / Setup | Phishing Resistant? | Portability | Recovery Burden | Best Fit | Notes |
|---|---|---|---|---|---|
| **Hardware key + PIN/biometric + Password (3FA)** | ✅ | ⚠️ | ⚠️ | High → Critical sensitivity | Strongest common setup when operationally supportable |
| **Hardware key + PIN/biometric (2FA)** | ✅ | ⚠️ | ⚠️ | High sensitivity | Strong security; portability, loss, and breakage are the tradeoffs |
| **Password + Passkey (2FA/3FA)** | ✅ | ✅ | ⚠️ | High sensitivity | Adds a knowledge factor on top of phishing-resistant auth when supported |
| **Passkey (PIN or biometric) (2FA)** | ✅ | ✅ | ⚠️ | Medium → High sensitivity | Strong default when supported; ensure multiple passkey devices |
| **Password + TOTP (2FA)** | ❌ | ✅ | ✅ | Low → Medium sensitivity | Good fallback when passkeys/keys are not supported |
| **Password + SMS (2FA)** | ❌ | ✅ | ✅ | Last resort | Prefer carrier protections if unavoidable |
| **Password only** | ❌ | ✅ | ✅ | Never recommended | Baseline only; easiest to phish |

### Decision Guidelines
- Prefer **passkeys** or **hardware keys** for **high-sensitivity** accounts
- Use **TOTP** when stronger methods are not supported or do not fit your workflow, but treat it as **phishable**
- Treat your account as only as strong as its **weakest recovery path** (email/SMS/support)
- Avoid collapsing factors: if password + TOTP seed live in the same place, treat it as a **single failure domain**
- "Remember this device" and long-lived sessions can silently downgrade security for high-sensitivity accounts

---

## Implementation Checklist

### Authentication Method Selection
- [ ] Prefer **passkey** or **hardware key** if supported
- [ ] If using a hardware key, register **two keys** (primary + backup)
- [ ] If using passkeys, ensure you have **at least two passkey-capable devices**
- [ ] If forced into TOTP, keep the **TOTP seed** separate from your password vault
- [ ] Never use SMS 2FA unless there is no other option
- [ ] If SMS must be used, protect your SIM from being swapped (number lock / takeover protection with your carrier)

### Factor Independence
- [ ] Do not store TOTP seeds in password managers
- [ ] If your password and your TOTP seed live in the same place, treat it as **1.5FA** at best for risk decisions
- [ ] For high-sensitivity accounts, keep at least one factor **outside** your password vault's blast radius

### Recovery Hardening

💡 **Account recovery flows are often the weakest link and can bypass strong MFA. Many real-world account takeovers occur by abusing recovery flows rather than defeating MFA methods.**

- [ ] Treat your **primary email** as a **high-sensitivity** account (it resets everything)
- [ ] Remove/disable SMS recovery where possible
- [ ] Remove old recovery emails/phones you no longer control
- [ ] Generate recovery codes and store them securely
- [ ] Review recovery methods at least quarterly (especially after travel, phone changes, or device upgrades)
- [ ] SMS-based account recovery must never be enabled

### Session Management

💡 **Many services allow skipping MFA after the first login, which can silently downgrade security for high-sensitivity accounts.**

- [ ] Disable "remember this device" where possible on high-sensitivity accounts
- [ ] Require re-authentication for sensitive actions (password changes, API tokens, payouts, admin changes)
- [ ] Periodically review active sessions and revoke unrecognized sessions
- [ ] Prefer shorter session durations on admin accounts
- [ ] Do not stay signed in on shared or travel devices

### Hardware Security
- [ ] Purchase hardware keys directly from the manufacturer (e.g. YubiKeys from Yubico)
- [ ] Consider shipping to a PO box if that better fits your threat model
- [ ] Always have a backup: second hardware key, recovery codes stored securely, and/or multiple passkey devices

---

## Common Pitfalls

- [ ] **Do not store TOTP seeds in password managers** - collapses factor separation and expands blast radius of vault compromise
- [ ] **Never use SMS 2FA unless there is no other option** - if SMS must be used, protect your SIM from being swapped
- [ ] **Always have a backup** - maintain a second hardware key, recovery codes stored securely, and/or multiple passkey devices
- [ ] **Ensure hardware is legitimate** - purchase directly from manufacturer, consider PO box shipping
