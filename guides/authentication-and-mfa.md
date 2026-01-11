<div align="center">
  <h1>Authentication & MFA Guide</h1>
  <p><em>Passwords, Passkeys, TOTP, and Hardware Keys</em></p>
</div>

---

## Overview

This guide helps you choose an authentication setup that fits your risk level and your real-world workflow. Use phishing-resistant authentication for high-sensitivity accounts when possible, while still using pragmatic fallbacks (like TOTP) where appropriate.

---

## Core concepts

Multi-factor authentication (MFA) is built from 3 core attributes:

- **Something you know** (password, PIN, recovery secret)
- **Something you have** (phone, laptop, hardware key)
- **Something you are** (biometrics: fingerprint, face)

“Strong authentication” typically means requiring **at least 2** of these.
For **high-sensitivity** accounts, you should aim for **all 3** where practical.

> Note: modern methods often *combine* factors. Example: a passkey is stored on a device you **have**, then unlocked by a biometric or PIN you **are/know**.

---

## Properties that matter (not just “is it MFA?”)

When comparing methods, prioritize:

- **Phishing resistance**: can a user be tricked into giving the attacker a working login?
- **Recoverability**: what happens if you lose/break the factor?
- **Portability**: can you use it when traveling / on the go?
- **Operational fit**: will you actually use it consistently?

Phishing resistance is a great property, but it comes with tradeoffs (especially around loss/breakage and portability).

---

## MFA options (and where they fit)

### Passwords
Passwords are not phishing-resistant, but they’re still widely used.

**Best practice:** treat the password as your baseline “something you know,” then add factors that are harder to phish and harder to steal.

### Passkeys
Passkeys are a modern replacement for passwords on many services.

In practice, passkeys are usually:
- a credential stored on a device you **have**
- unlocked by a PIN or biometric you **know/are**

Passkeys are commonly phishing-resistant and remove shared secrets from the login flow.

### Hardware security keys (ex: YubiKey)
Hardware security keys are generally a top-tier option when:
- the service supports them well
- you can manage operational tradeoffs (loss/breakage/portability)

Biometric-capable keys (ex: YubiKey Bio) help ensure a stolen key is harder to use, but you still need to consider real-world risks (loss, theft, observation of unlock behavior).

### TOTP codes (authenticator apps)
TOTP is not phishing-resistant, but it can be appropriate for lower-sensitivity accounts or when passkeys / security keys are not available.

TOTP has a major usability advantage: it typically lives on your phone — a device you’re less likely to lose because you use it constantly.

### SMS 2FA
SMS should be treated as a last resort.

---

## Recommended setups (by risk level)

Choose the strongest setup you can *reliably maintain*.

### Low sensitivity
Examples: throwaway accounts, low-impact services, accounts without financial privileges.

**Recommended:**
- **Password + TOTP (2FA)**

### Medium sensitivity
Examples: SaaS tools, community accounts, accounts that could be used for reputation damage.

**Recommended:**
- **Passkey (PIN or biometric) (2FA)**
- OR **Password + Passkey (2FA/3FA-ish depending on unlock method)** if the service supports requiring both

Fallback if passkeys aren’t supported:
- **Password + TOTP (2FA)**

### High sensitivity
Examples: primary email, GitHub/org admin, production infrastructure, exchange accounts, custody-adjacent accounts.

**Recommended:**
- **Hardware key + PIN/biometric + Password (3FA)**  
  (Example: YubiKey Bio + password)
- OR **Password + Passkey unlocked by biometric (3FA-ish)**  
  (Example: password + passkey + biometric unlock)

If you cannot operationally carry a key reliably:
- Keep the hardware key in a secure location (ex: a safe)
- Use **passkey** on your phone for “on-the-go” access
- Use **TOTP** only where stronger methods are not supported

### Critical sensitivity
Examples: treasury, multisig signer accounts, domain registrar, root/admin identities, accounts that can irreversibly move funds.

**Recommended:**
- **Phishing-resistant auth everywhere** (hardware key / passkey)
- **Two independent phishing-resistant factors** where supported (primary + backup)
- Recovery paths must be hardened (see below)

---

## Quick decision matrix (choose the strongest option you can maintain)

| Method / Setup | Phishing resistant? | Portability | Recovery burden | Best fit | Notes |
|---|---|---|---|---|---|
| **Password only** | ❌ | ✅ | ✅ | Never recommended | Baseline only; easiest to phish. |
| **Password + SMS (2FA)** | ❌ | ✅ | ✅ | Last resort | Prefer carrier protections if unavoidable. |
| **Password + TOTP (2FA)** | ❌ | ✅ | ✅ | Low → Medium sensitivity | Good fallback when passkeys/keys aren't supported. |
| **Passkey (PIN or biometric) (2FA)** | ✅ (typically) | ✅ | ⚠️ | Medium → High sensitivity | Strong default when supported; ensure multiple passkey devices. |
| **Password + Passkey (2FA/3FA-ish)** | ✅ (typically) | ✅ | ⚠️ | High sensitivity | Adds a knowledge factor on top of phishing-resistant auth when supported. |
| **Hardware key + PIN/biometric (2FA)** | ✅ | ⚠️ | ⚠️ | High sensitivity | Great security; portability/loss/breakage are the tradeoffs. |
| **Hardware key + PIN/biometric + Password (3FA)** | ✅ | ⚠️ | ⚠️ | High → Critical sensitivity | Strongest common setup when you can operationally support it. |

### Rules of thumb
- Prefer **passkeys** or **hardware keys** for **high-sensitivity** accounts.
- Use **TOTP** when stronger methods aren't supported or don't fit your workflow — but treat it as **phishable**.
- Treat your account as only as strong as its **weakest recovery path** (email/SMS/support).
- Avoid collapsing factors: if password + TOTP seed live in the same place, treat it as a **single failure domain**.
- "Remember this device" / long-lived sessions can silently downgrade security for high-sensitivity accounts.

---

## "Ideal" example configurations (copy/paste mental models)

These are common strong setups to aim for:

- **YubiKey Bio + password (3FA)**  
  Have (key) + Are (biometric) + Know (password)

- **Passkey (biometric) + password (3FA-ish)**  
  Have (device storing passkey) + Are (biometric unlock) + Know (password)

- **Password + biometric + TOTP (3FA-ish)**  
  Know (password) + Are (biometric unlock on phone) + Have (phone holding TOTP)

- **Passkey + PIN (2FA)**  
  Have (device storing passkey) + Know (PIN)

- **Passkey + biometric (2FA)**  
  Have (device storing passkey) + Are (biometric)

> Use the strongest setup that you can maintain without breaking your workflow.

---

## Recovery is often the weakest link (and it bypasses your “strong MFA”)

Many real-world account takeovers happen by abusing **recovery flows**, not by defeating your MFA method.

Common recovery bypasses:
- “Reset via email” where your email account is weaker than the target account
- “Reset via SMS” (SIM swap risk)
- Support channels that accept weak identity proof (social engineering)
- Old recovery methods left enabled “just in case”

**Rule:** your account is only as strong as its **weakest recovery path**.

### Recovery hardening checklist
- [ ] Treat your **primary email** as a **high-sensitivity** account (it resets everything)
- [ ] Remove/disable SMS recovery where possible
- [ ] Remove old recovery emails/phones you no longer control
- [ ] Generate recovery codes and store them securely (see “factor independence”)
- [ ] Review recovery methods at least quarterly (especially after travel, phone changes, or device upgrades)

---

## Factor independence (don’t accidentally collapse your factors)

MFA works best when your factors are **independent**. If one compromise gives an attacker *everything*, your “2FA” is mostly a UI decoration.

The most common way teams accidentally collapse MFA:
- **Password manager stores both your password and your TOTP seed**
- A single compromised vault gives an attacker both “factors”

This doesn’t mean password managers are “bad.” It means you must treat **co-located secrets** as a single failure domain.

### Independence rules of thumb
- If your password and your TOTP seed live in the same place, treat it like **1.5FA** at best for risk decisions.
- For high-sensitivity accounts, keep at least one factor **outside** your password vault’s blast radius.

---

## Session persistence (“remember this device” is a silent downgrade)

A lot of services let you skip MFA after the first login:
- “Remember this device”
- “Keep me signed in”
- Long-lived sessions / refresh tokens
- “Trusted devices” that rarely re-auth

This can be fine for low-risk accounts, but it’s dangerous for high-sensitivity accounts because:
- Stolen cookies/tokens can act like a full login
- Malware on a trusted device bypasses your MFA decisions
- Shared machines become permanent access paths

### Session controls checklist (high/critical accounts)
- [ ] Disable “remember this device” where possible
- [ ] Require re-auth for sensitive actions (password changes, API tokens, payouts, admin changes)
- [ ] Periodically review active sessions and revoke ones you don’t recognize
- [ ] Prefer shorter session durations on admin accounts
- [ ] Don’t stay signed in on shared or travel devices

---

## Footguns / pitfalls to avoid

- **Don’t store TOTP seeds in password managers.**  
  If the same vault holds your password *and* the TOTP seed, you’ve collapsed factor separation and expanded the blast radius of a vault compromise.

- **Never use SMS 2FA unless there is no other option.**  
  If you must use SMS, protect your SIM from being swapped (number lock / takeover protection with your carrier).

- **Always have a backup.**  
  A second hardware key, recovery codes stored securely, and/or multiple passkey devices.

- **Make sure your hardware is legit.**  
  Buy YubiKeys directly from Yubico. Consider shipping to a PO box if that better fits your threat model.

---

## Implementation checklist

Use this checklist when hardening an important account:

- [ ] Prefer **passkey** or **hardware key** if supported
- [ ] If using a hardware key, register **two keys** (primary + backup)
- [ ] If using passkeys, ensure you have **at least two passkey-capable devices**
- [ ] If forced into TOTP, keep the **TOTP seed** separate from your password vault
- [ ] Store recovery codes securely and verify you can actually use them
- [ ] Harden recovery flows (email/SMS/support paths)
- [ ] Avoid “remember this device” on high-sensitivity accounts; review and revoke sessions periodically
- [ ] Avoid SMS 2FA; if unavoidable, enable carrier protections
