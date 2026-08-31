<!--
id: phishing-resistance
type: GUIDE
scope: ORGANIZATION
-->

<div align="center">
  <h1>Build Phishing Resistance</h1>
  <p><em>Defend the people an attacker will target by name</em></p>
</div>

---

## Overview

Before touching infrastructure, an attacker builds a target list: who works here and what their email addresses are. Corporate email formats are predictable, so given a name, an attacker can derive the address — you cannot hide the pattern, so you defend the people behind it. This guide covers the human-side controls that make a targeted phishing campaign fail.

---

## Harden Your People Against Targeted Phishing

### Why It's Critical

Predictable email formats let an attacker enumerate your whole staff without any special access. High-value roles — finance, treasury signers, admins — are singled out deliberately. Technical controls plus aware humans are what stop the campaign.

### Implementation Steps

- [ ] Enforce phishing-resistant MFA (security keys / passkeys) so a phished password is useless (see the enforce-2FA guide).
- [ ] Run periodic phishing simulations and share the results as training, not punishment.
- [ ] Make sure high-value-role holders know they are named targets and how to report a suspicious message quickly.
- [ ] Establish out-of-band verification for sensitive requests (fund transfers, key operations, access changes) — a second channel confirms the request is real.
- [ ] Give everyone a fast, blameless way to report a suspected phish.

---

## Notes

The email pattern itself is not a vulnerability to fix — it is inherent. The finding is a prompt to make sure the humans on that target list are protected by MFA and know the playbook.
