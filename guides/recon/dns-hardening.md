<!--
id: dns-hardening
type: GUIDE
scope: ORGANIZATION
-->

<div align="center">
  <h1>Harden Your DNS</h1>
  <p><em>Protect name resolution and certificate issuance</em></p>
</div>

---

## Overview

DNS is the foundation everything else trusts: if an attacker can forge DNS answers or obtain a certificate for your domain, they can redirect and impersonate you. Two records close those doors — DNSSEC signs your DNS responses so they cannot be forged in transit, and CAA restricts which certificate authorities are allowed to issue certificates for your domain. This guide covers enabling both.

---

## Enable DNSSEC

### Why It's Critical

Without DNSSEC, a resolver that an attacker can poison will happily hand your users forged DNS answers, pointing your domain at infrastructure the attacker controls. DNSSEC cryptographically signs your zone so tampered answers are rejected.

### Implementation Steps

- [ ] Enable DNSSEC at your DNS host / provider for the zone.
- [ ] Publish the resulting DS (Delegation Signer) record at your domain registrar to complete the chain of trust.
- [ ] Verify the chain validates (use a DNSSEC analyser); a broken chain can take your domain offline, so confirm it before considering the change done.
- [ ] Document the key-rollover process your provider uses so future rotations don't break resolution.

---

## Publish CAA Records

### Why It's Critical

By default any certificate authority in the world can issue a certificate for your domain. A single mis-issued or fraudulently obtained certificate enables a convincing man-in-the-middle attack. CAA records name the only CAs you actually use.

### Implementation Steps

- [ ] Publish CAA records naming only your CA(s), e.g. `yourdomain.com. CAA 0 issue "letsencrypt.org"`.
- [ ] Add an `iodef` record so you're notified of issuance attempts, e.g. `0 iodef "mailto:security@yourdomain.com"`.
- [ ] Include `issuewild` restrictions if you use wildcard certificates.
- [ ] Re-check CAA whenever you change certificate providers.

---

## Notes

DNSSEC and CAA are both "set once, benefit forever" controls. The only real risk is a misconfigured DNSSEC chain, so validate it immediately after enabling.
