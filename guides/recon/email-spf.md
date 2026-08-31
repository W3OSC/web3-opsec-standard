<!--
id: email-spf
type: GUIDE
scope: ORGANIZATION
-->

<div align="center">
  <h1>Publish a Strict SPF Record</h1>
  <p><em>Stop attackers from sending email as your domain</em></p>
</div>

---

## Overview

SPF (Sender Policy Framework) is a DNS TXT record that lists which mail servers are allowed to send email on behalf of your domain. Without it — or with a permissive version of it — anyone on the internet can send mail that appears to come from your domain, which is the opening move in most phishing and business-email-compromise attacks against a web3 team and its community. This guide walks you through publishing an SPF record that authorizes only your real senders and rejects everyone else.

---

## Fix a Missing or Weak SPF Record

### Why It's Critical

Receiving mail servers use SPF to decide whether a message that claims to be from your domain actually came from an authorized server. A missing record means no such check happens. A record ending in `+all` authorizes the entire internet, and `?all` (neutral) or `~all` (softfail) still let unauthorized mail through — spoofed mail can land in inboxes and get users to click, connect a wallet, or approve a transaction.

### Implementation Steps

- [ ] Enumerate every service that legitimately sends mail as your domain (Google Workspace / Microsoft 365, transactional providers like SendGrid or Postmark, marketing tools, ticketing systems).
- [ ] Publish a single SPF TXT record at your root domain (`@`) that `include:`s each provider, e.g. `v=spf1 include:_spf.google.com include:sendgrid.net -all`.
- [ ] End the record with `-all` (hardfail) so unlisted senders are rejected, not merely flagged.
- [ ] Keep the record within the RFC 7208 limit of **10 DNS lookups** — flatten or remove unused `include:` mechanisms if you exceed it, or SPF silently fails on strict receivers.
- [ ] Publish `v=spf1 -all` on any parked domain that never sends mail, so it cannot be spoofed either.
- [ ] Verify with a checker (e.g. an SPF/MX lookup tool) that the record resolves and reports no permerror.

---

## Notes

SPF alone is not enough: it breaks when mail is forwarded, so pair it with DKIM and an enforcing DMARC policy (see the DKIM and DMARC guides). All three together are what actually stops domain spoofing.
