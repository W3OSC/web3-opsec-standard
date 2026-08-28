<!--
id: web-security-headers
type: GUIDE
scope: ORGANIZATION
-->

<div align="center">
  <h1>Set Your Web Security Headers</h1>
  <p><em>Harden the browser side of your application</em></p>
</div>

---

## Overview

HTTP security headers are cheap, high-leverage instructions to the browser that block whole classes of attack — protocol downgrade, script injection, clickjacking, and cookie theft. For a web3 front-end they matter more than usual, because a Content-Security-Policy is one of the strongest defences against the injected-script and malicious-dependency payloads behind most wallet-drainer attacks. This guide lists the headers to set and how.

---

## Send the Core Security Headers

### Why It's Critical

Missing headers are the difference between an injected script being blocked and it draining your users' wallets. Each header closes a specific, well-understood hole.

### Implementation Steps

- [ ] **Strict-Transport-Security** — `max-age=31536000; includeSubDomains` (and submit to the HSTS preload list once verified) so browsers never attempt plain HTTP.
- [ ] **Content-Security-Policy** — restrict `script-src`, `connect-src` and `frame-ancestors` to trusted origins. Roll it out in `Content-Security-Policy-Report-Only` mode first, watch the reports, then enforce.
- [ ] **X-Frame-Options: DENY** (or a CSP `frame-ancestors 'self'`) to prevent clickjacking of your dApp UI.
- [ ] **X-Content-Type-Options: nosniff** on all responses.
- [ ] **Referrer-Policy: strict-origin-when-cross-origin** so full URLs don't leak to third parties.

---

## Protect Your Cookies

### Why It's Critical

A session or auth cookie without protective attributes can be stolen by an injected script, leaked over HTTP, or ridden by a cross-site request.

### Implementation Steps

- [ ] Set `Secure`, `HttpOnly` and `SameSite` on session and authentication cookies.
- [ ] Suppress software version banners (`server_tokens off` in nginx, remove `X-Powered-By`) so responses don't hand attackers a precise CVE target.

---

## Notes

Deploy CSP in report-only mode first — a strict policy applied blind will break legitimate scripts. Use the violation reports to tune it, then switch to enforcing.
