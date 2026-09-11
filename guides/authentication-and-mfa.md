<!--
id: authentication-and-mfa-individual-guide
type: GUIDE
scope: INDIVIDUAL
-->

<div align="center">
  <h1>Authentication & MFA Guide</h1>
  <p><em>Passwords, Passkeys, TOTP, and Hardware Keys</em></p>
</div>

---

## Overview

Authentication is the control that decides whether an attacker with your password gets in. This guide helps you pick the right setup for each account based on how much damage its compromise would cause, then harden the paths attackers actually use: phishable factors, recovery flows, and long-lived sessions.

The rule of thumb throughout: the more an account can move or destroy, the more it must rely on phishing-resistant factors (passkeys and hardware keys), and the harder its recovery paths must be.

---

## MFA Basics

Multi-factor authentication (MFA) combines independent factors:

- **Something you know** — password, PIN, recovery secret
- **Something you have** — phone, laptop, hardware key
- **Something you are** — biometrics (fingerprint, face)

Strong authentication requires at least two of these. For high-sensitivity accounts, require all three where practical.

Two properties matter more than the factor count:

- **Phishing resistance** — passkeys and hardware keys cryptographically verify the site they authenticate to, so they cannot be relayed through a fake login page. Passwords, TOTP codes, and SMS codes can.
- **Factor independence** — two factors stored in the same place (a password and a TOTP seed in one vault) fail together. Treat them as a single factor when assessing risk.

---

## Recommended Setup by Sensitivity

Classify each account by the damage its compromise could cause, then meet the bar for that tier.

### Low sensitivity
Throwaway accounts, low-impact services, accounts with no financial or reputational leverage.

- [ ] **Password + TOTP (2FA)**

### Medium sensitivity
SaaS tools, community accounts, anything usable for reputation damage.

- [ ] **Passkey with PIN or biometric unlock (2FA)**
- [ ] **Password + passkey (2FA/3FA)** where the service supports requiring both
- [ ] **Fallback** — password + TOTP if passkeys are not supported

### High sensitivity
Primary email, GitHub and organization admin, production infrastructure, exchange and custody-adjacent accounts.

- [ ] **Hardware key + PIN/biometric + password (3FA)** — e.g. YubiKey Bio plus a password
- [ ] **Or password + biometric-unlocked passkey (3FA)**
- [ ] **If a hardware key cannot be carried reliably** — keep it in a safe, use a phone passkey for on-the-go access, and fall back to TOTP only where nothing stronger is supported

### Critical sensitivity
Treasury, multi-sig signer accounts, domain registrar, root and admin identities — anything that can irreversibly move funds.

- [ ] **Phishing-resistant authentication everywhere** — hardware key or passkey, no phishable fallbacks
- [ ] **Two independent phishing-resistant factors** registered where supported (primary + backup)
- [ ] **Hardened recovery paths** — see [Recovery hardening](#recovery-hardening) below

---

## Decision Matrix

Choose the strongest option you can actually maintain.

| Setup | Phishing resistant | Portability | Recovery burden | Best fit |
|---|---|---|---|---|
| Hardware key + PIN/biometric + password (3FA) | ✅ | ⚠️ | ⚠️ | High → critical |
| Hardware key + PIN/biometric (2FA) | ✅ | ⚠️ | ⚠️ | High |
| Password + passkey (2FA/3FA) | ✅ | ✅ | ⚠️ | High |
| Passkey with PIN/biometric (2FA) | ✅ | ✅ | ⚠️ | Medium → high |
| Password + TOTP (2FA) | ❌ | ✅ | ✅ | Low → medium |
| Password + SMS (2FA) | ❌ | ✅ | ✅ | Last resort |
| Password only | ❌ | ✅ | ✅ | Never |

When choosing:

- Prefer passkeys or hardware keys for anything high sensitivity or above; TOTP is a fallback and remains phishable wherever it is used
- An account is only as strong as its weakest recovery path — email, SMS, or a persuadable support desk
- "Remember this device" and long-lived sessions silently downgrade strong setups

---

## Implementation Checklist

Choosing strong factors is the start; the items below close the side doors — shared blast radius, recovery flows, phone numbers, and stale sessions.

### Choosing and registering factors

- [ ] **Prefer a passkey or hardware key** wherever the service supports one
- [ ] **Register two hardware keys** (primary + backup) so losing one is an inconvenience, not a lockout
- [ ] **Keep at least two passkey-capable devices enrolled** if using passkeys
- [ ] **Buy hardware keys directly from the manufacturer** (e.g. YubiKeys from Yubico); consider shipping to a PO box if that fits your threat model
- [ ] **Never use SMS 2FA unless there is no other option** — and if forced into it, enable your carrier's SIM swap protections (below)

### Factor independence

- [ ] **Do not store TOTP seeds in your password manager** — a vault compromise would yield both factors at once; keep seeds in a dedicated authenticator on a single device
- [ ] **Keep at least one factor outside your password vault's blast radius** for every high-sensitivity account
- [ ] **Count honestly** — if the password and TOTP seed live in the same place, treat the account as 1.5FA at best when assessing risk

### Recovery hardening

Account recovery is the weakest link in most authentication setups — many real-world takeovers abuse recovery flows rather than defeating MFA.

- [ ] **Treat your primary email as a high-sensitivity account** — it can reset nearly everything else
- [ ] **Disable SMS-based account recovery everywhere** — it lets a SIM swapper bypass every stronger factor you've set up
- [ ] **Remove stale recovery emails and phone numbers** you no longer control
- [ ] **Generate recovery codes and store them securely** — printed in a safe, or in a vault separate from the password
- [ ] **Review recovery methods quarterly**, and after travel, phone changes, or device upgrades

### SIM swap protection

Your phone number is a recovery path whether you want it to be or not. Lock it down:

- [ ] **Set a SIM PIN** to mitigate physical SIM theft
- [ ] **Enable carrier port-out protection**:
  - **AT&T** — myAT&T Profile → My Linked Accounts → Manage extra security → turn on Extra security
  - **T-Mobile** — add [Account Takeover Protection](https://www.t-mobile.com/support/plans-features/account-takeover-protection)
  - **Verizon** — enable [Number Lock](https://myvpostpay.verizon.com/ui/acct/secure/profile/security/portsecurity)
  - **Google Fi** — enable [Number Lock](https://support.google.com/fi/answer/15147412?hl=en#zippy=%2Cturn-on-number-lock)
- [ ] **Register your number on Signal** even if you don't use it, so a future SIM swapper cannot impersonate you there
- [ ] **Harden the phone itself** — the device holding your codes needs its own controls; see the [Mobile Device Security Guide](mobile-device-security.md)

### Session management

Many services allow skipping MFA after the first login, which silently weakens everything above.

- [ ] **Disable "remember this device"** on high-sensitivity accounts where possible
- [ ] **Require re-authentication for sensitive actions** — password changes, API tokens, payouts, admin changes
- [ ] **Review active sessions periodically** and revoke any you don't recognize
- [ ] **Prefer short session durations** on admin accounts
- [ ] **Never stay signed in** on shared or travel devices
