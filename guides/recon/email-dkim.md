<!--
id: email-dkim
type: GUIDE
scope: ORGANIZATION
-->

<div align="center">
  <h1>Enable DKIM Signing</h1>
  <p><em>Cryptographically sign your outbound mail</em></p>
</div>

---

## Overview

DKIM (DomainKeys Identified Mail) attaches a cryptographic signature to every message your mail platform sends, and publishes the matching public key in DNS. Receivers verify the signature to confirm the mail genuinely came from you and was not tampered with in transit. Without DKIM, your mail is easier to spoof, and DMARC has only SPF to rely on — which breaks the moment a message is forwarded. This guide covers enabling DKIM on your mail platform and publishing the key.

---

## Turn On DKIM for Your Domain

### Why It's Critical

DKIM survives mail forwarding where SPF does not, so it is the more robust of the two authentication mechanisms DMARC depends on. A domain with no DKIM selectors has a real gap: legitimate mail is easier to forge, and DMARC enforcement is far more likely to misfire and quarantine your own messages.

### Implementation Steps

- [ ] In your mail platform's admin console, enable DKIM signing for your domain (Google Workspace: Apps > Google Workspace > Gmail > Authenticate email; Microsoft 365: Defender portal > Email authentication settings).
- [ ] Copy the DKIM public key / CNAME records the platform provides.
- [ ] Publish them in DNS at the selector host the platform specifies, e.g. `google._domainkey.yourdomain.com` or `selector1._domainkey.yourdomain.com`.
- [ ] Enable signing for **every** service that sends mail as your domain (transactional and marketing providers each have their own selector and key).
- [ ] Wait for DNS propagation, then turn on signing in the platform and send a test message.
- [ ] Verify the received message shows `dkim=pass` in its authentication results header.

---

## Notes

DKIM selectors are not discoverable — automated scanners probe common selector names, so a custom selector may not be detected externally even when DKIM is correctly configured. Confirm signing is on by inspecting the authentication headers of a real received message rather than relying on an external probe.
