<!--
id: subdomain-takeover
type: GUIDE
scope: ORGANIZATION
-->

<div align="center">
  <h1>Fix and Prevent Subdomain Takeovers</h1>
  <p><em>Remove dangling DNS records before an attacker claims them</em></p>
</div>

---

## Overview

A subdomain takeover happens when a DNS record (usually a CNAME) points at a third-party service — GitHub Pages, Heroku, S3, a CDN — whose backing resource has been deleted, leaving the pointer dangling. An attacker can re-register that resource and serve their own content from your subdomain. For a web3 project this is catastrophic: a page on your real domain is the perfect host for a phishing or wallet-drainer site your community will trust. This guide covers fixing an active dangling record and preventing new ones.

---

## Remediate a Dangling Record

### Why It's Critical

Content served from `docs.yourdomain.com` or `status.yourdomain.com` inherits your users' trust and your domain's reputation with browsers and wallets. A takeover lets an attacker phish, steal cookies, or run a drainer under your own brand — often without you noticing until users report losses.

### Implementation Steps

- [ ] Identify the dangling subdomain and the service its CNAME points to (e.g. a `*.github.io` or `*.herokuapp.com` target that no longer resolves).
- [ ] Immediately remove the dangling DNS record, OR re-claim the backing resource on the third-party service so an attacker cannot.
- [ ] Audit **all** DNS records for other CNAMEs pointing at external services, and confirm each target still exists and is under your control.
- [ ] Check any content-integrity or crawler monitoring for unexpected changes on the affected host.

---

## Prevent Future Takeovers

### Why It's Critical

Takeovers are almost always the result of a decommissioning process that removed the cloud resource but forgot the DNS record. A little process discipline eliminates the whole class of bug.

### Implementation Steps

- [ ] Make "remove the DNS record" a required step whenever you tear down a site, app, or bucket.
- [ ] Prefer pointing records at resources you fully control; avoid CNAMEs to services that release names on deletion.
- [ ] Run continuous subdomain / dangling-record monitoring so a new dangling pointer is flagged within hours, not months.

---

## Notes

The dangerous signature is a CNAME to a known service whose own lookup fails (NXDOMAIN). If you see that, treat it as an active incident — an attacker may already be able to claim it.
