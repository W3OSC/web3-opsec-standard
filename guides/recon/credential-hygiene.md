<!--
id: credential-hygiene
type: GUIDE
scope: ORGANIZATION
-->

<div align="center">
  <h1>Contain Breached Credentials</h1>
  <p><em>Kill password reuse before it becomes account takeover</em></p>
</div>

---

## Overview

Corporate email addresses turn up in third-party breaches and infostealer logs constantly. The real danger is reuse: if a password exposed in some unrelated breach is also used on a corporate system, an attacker can log straight in — credential stuffing is the single most common initial-access technique. This guide covers responding when a team member's credentials are found exposed, and making the whole class of attack ineffective.

---

## Respond to an Exposed Account

### Why It's Critical

An exposed password is only dangerous if it still works somewhere. The response is to invalidate it everywhere and confirm it isn't reused.

### Implementation Steps

- [ ] Force a password reset for the exposed account.
- [ ] Confirm the password is not reused on any other corporate system (SSO, email, cloud consoles, internal tools).
- [ ] Require phishing-resistant MFA on the account (security key or passkey), so an exposed password alone is not enough to log in.
- [ ] Review recent sign-in activity for that account for signs it was already used.

---

## Make Reuse Impossible

### Why It's Critical

You cannot stop your addresses from appearing in other companies' breaches — you can make sure those leaked passwords are useless against you.

### Implementation Steps

- [ ] Roll out a password manager across the organisation so every account has a unique, strong, generated password.
- [ ] Enforce MFA org-wide (see the enforce-2FA guide).
- [ ] Monitor breach and stealer-log sources for your domains so new exposures are caught quickly.

---

## Notes

A password manager plus enforced MFA turns a breached-credential finding from an incident into a non-event — the leaked password no longer opens anything.
