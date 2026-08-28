<!--
id: email-dmarc
type: GUIDE
scope: ORGANIZATION
-->

<div align="center">
  <h1>Roll Out DMARC to Enforcement</h1>
  <p><em>Move from monitoring to actually blocking spoofed mail</em></p>
</div>

---

## Overview

DMARC ties SPF and DKIM together and tells receiving mail servers what to do with mail that fails authentication — and, just as importantly, sends you reports of who is sending mail as your domain. A missing DMARC record leaves spoofing unblocked and invisible; a `p=none` policy only watches without protecting. This guide takes you from no DMARC (or monitor-only DMARC) to full `p=reject` enforcement safely, without breaking legitimate mail.

---

## Publish and Enforce a DMARC Policy

### Why It's Critical

Even with SPF and DKIM in place, without DMARC there is no instruction telling receivers to reject mail that fails those checks, and no visibility into abuse. Attackers exploit this to impersonate your domain against staff, investors and community members. Moving to `p=reject` is what makes a spoofed email from your domain actually bounce.

### Implementation Steps

- [ ] Publish a DMARC record as a TXT entry at `_dmarc.yourdomain.com` starting in monitor mode: `v=DMARC1; p=none; rua=mailto:dmarc@yourdomain.com`.
- [ ] Collect and review the aggregate (`rua`) reports for 1–4 weeks — use a DMARC report analyser — until every legitimate sending source passes SPF or DKIM alignment.
- [ ] Fix any legitimate sources that are failing (add them to SPF, enable DKIM signing) before tightening the policy.
- [ ] Raise the policy to `p=quarantine` and monitor for a further week.
- [ ] Raise the policy to `p=reject` — full enforcement.
- [ ] Ensure `pct` is unset or `pct=100` so the policy applies to all mail, not a sample.
- [ ] Keep a monitored `rua` address in place permanently so you keep seeing spoofing attempts.

---

## Notes

Do not jump straight to `p=reject` — publish `p=none` first and read the reports, or you risk quarantining your own legitimate mail (newsletters, forwarders, third-party senders you forgot about). The reporting phase is what makes enforcement safe.
