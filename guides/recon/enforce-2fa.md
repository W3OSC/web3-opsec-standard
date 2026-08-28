<!--
id: enforce-2fa
type: GUIDE
scope: ORGANIZATION
-->

<div align="center">
  <h1>Enforce Multi-Factor Authentication</h1>
  <p><em>One phished password should not be enough</em></p>
</div>

---

## Overview

Multi-factor authentication is the single highest-leverage identity control an organisation can turn on. Credential phishing and breach-password reuse are the two most common ways attackers get in, and enforced MFA neutralises both: a stolen password alone no longer opens anything. This guide covers enforcing MFA across the org and using phishing-resistant factors where it matters most.

---

## Enforce MFA Organization-Wide

### Why It's Critical

If MFA is optional, the accounts that skip it are exactly the ones an attacker needs. Enforcement — not encouragement — is what closes the gap. Without it, one careless click on a phishing link is enough for a full account takeover.

### Implementation Steps

- [ ] Turn on organization-wide MFA enforcement in your identity provider / SSO.
- [ ] Set a deadline and enroll every member; remove or suspend accounts that don't comply by the cutoff.
- [ ] Cover every critical system — email, code hosting, cloud consoles, deployment, and treasury tooling.

---

## Require Phishing-Resistant Factors for High-Value Roles

### Why It's Critical

SMS and even TOTP codes can be phished in real time by a convincing fake login page. Hardware security keys and passkeys (FIDO2/WebAuthn) are bound to the real origin and cannot be relayed to an attacker.

### Implementation Steps

- [ ] Require hardware security keys or passkeys for admins, finance, and treasury/multisig signers.
- [ ] Register a backup factor per user to avoid lockouts.
- [ ] Prefer authenticator apps or security keys over SMS for everyone else.

---

## Notes

Enforced MFA turns a leaked or phished password from a breach into a non-event. Phishing-resistant factors go one step further and defeat the real-time phishing kits that beat ordinary MFA.
