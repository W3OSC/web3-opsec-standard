<!--
id: brand-impersonation-response
type: GUIDE
scope: ORGANIZATION
-->

<div align="center">
  <h1>Respond to Brand Impersonation</h1>
  <p><em>Take down look-alike domains and phishing infrastructure</em></p>
</div>

---

## Overview

Attackers register look-alike domains — typos, homoglyphs, extra words like `-claim` or `-airdrop`, alternate TLDs — to phish your users. A registered look-alike with a mail server is a complete impersonation kit: it can send convincing email and host a matching drainer or fake-login page. This guide covers responding to a live look-alike and reducing the risk of new ones.

---

## Take Down an Active Look-Alike

### Why It's Critical

The damage from impersonation lands on your community and your reputation even when your own infrastructure is untouched. A look-alike domain is the standard host for pages that harvest credentials or drain wallets from users who mistype or follow a fake link.

### Implementation Steps

- [ ] Confirm you do not own the domain and capture evidence (screenshots, WHOIS, resolving IP, any mail records).
- [ ] File abuse / takedown reports with the domain's registrar and its hosting provider.
- [ ] Report the domain to phishing feeds — Google Safe Browsing, and for web3, Chainabuse (https://chainabuse.com/) — so wallets and browsers warn users.
- [ ] Warn your community through your official, verified channels with the exact malicious domain so they can recognize it.
- [ ] If it targets a specific campaign (a token launch, an airdrop), coordinate the warning with that announcement.

---

## Reduce Future Risk

### Implementation Steps

- [ ] Defensively register the highest-risk permutations of your brand (common typos, `-app`, `.xyz`, key TLDs).
- [ ] Monitor certificate-transparency logs and new domain registrations for look-alikes continuously.
- [ ] Publish a canonical list of your official domains and channels on your own site so users have a source of truth.

---

## Notes

Prioritize look-alikes that have a mail server configured — those can phish by email *and* host a fake site, and are the most dangerous.
