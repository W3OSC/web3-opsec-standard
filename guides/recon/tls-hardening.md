<!--
id: tls-hardening
type: GUIDE
scope: ORGANIZATION
-->

<div align="center">
  <h1>Harden TLS on Your Endpoints</h1>
  <p><em>Valid certificates, strong keys, no legacy protocols</em></p>
</div>

---

## Overview

TLS is what makes the padlock mean something. An expired certificate takes your site offline behind a scary warning; an invalid chain or a legacy protocol version lets a network attacker downgrade or intercept the connection. This guide covers keeping certificates valid and automatically renewed, and configuring the server to only speak modern, secure TLS.

---

## Keep Certificates Valid and Automated

### Why It's Critical

A missed renewal is a self-inflicted outage that also trains your users to click through certificate warnings — the exact behaviour that lets a real man-in-the-middle succeed. Automation removes the human deadline entirely.

### Implementation Steps

- [ ] Use automated certificate issuance and renewal (ACME / Let's Encrypt, or your CA's automation).
- [ ] Serve the **full** certificate chain, including intermediates, and ensure the certificate matches the hostname.
- [ ] Add certificate-expiry monitoring that alerts well before the deadline as a backstop.
- [ ] Use a 2048-bit-or-larger RSA key or a modern ECDSA (P-256) key.

---

## Disable Weak Protocols and Ciphers

### Why It's Critical

TLS 1.0 and 1.1 are deprecated and vulnerable to downgrade and cipher attacks. If your server still accepts them, an attacker on the network path can force a downgrade.

### Implementation Steps

- [ ] Require TLS 1.2 or higher; disable TLS 1.0 and 1.1 at the load balancer / server.
- [ ] Prefer modern cipher suites and enable HSTS (see the web security headers guide) so browsers refuse plain HTTP.
- [ ] Re-test your endpoint with an SSL/TLS analyzer after changes and aim for an A grade.

---

## Notes

If you terminate TLS at a CDN or load balancer, apply these settings there — that is where the public handshake actually happens.
