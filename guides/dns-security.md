<!--
id: dns-security-records-guide
type: GUIDE
scope: ORGANIZATION
-->

<div align="center">
  <h1>DNS Security Guide</h1>
  <p><em>Email authentication, certificate control, and DNS integrity</em></p>
</div>

---

## Overview

DNS records decide who can send email as your domain, which authorities can issue certificates for it, and whether resolvers can trust the answers they get. Without them, attackers can impersonate your domain in phishing campaigns against your own users, partners, and employees. This guide covers each record type in order of priority: what it protects against, exactly how to implement it, and whether you need it at all.

---

## Email Authentication

These three records are the foundation of domain security. Without them, anyone can send email that appears to come from you.

### SPF (Sender Policy Framework)

**Required if you send email from your domain.**

SPF lists the servers allowed to send email as your domain. Without it, anyone can pretend to be you.

- [ ] **Add a TXT record at your root domain** (`@`)
- [ ] **Set the value for your provider** — `v=spf1 include:_spf.google.com ~all` for Google Workspace, or `v=spf1 include:spf.protection.outlook.com ~all` for Microsoft 365
- [ ] **Keep it to ONE record** — multiple SPF records are invalid; if you use several email services (e.g. Google + Mailchimp), combine them: `v=spf1 include:_spf.google.com include:servers.mcsv.net ~all`

### DKIM (DomainKeys Identified Mail)

**Required if you send email from your domain.**

DKIM cryptographically signs outgoing mail so recipients can verify it actually came from you and wasn't tampered with in transit.

- [ ] **Enable DKIM in your email provider** (Google Workspace, Microsoft 365, etc.)
- [ ] **Add the DNS record(s) the provider generates** — the selector name (like `google._domainkey` or `selector1._domainkey`) comes from your provider
- [ ] **Return to the provider and click Verify/Activate** — signing doesn't start until the record is confirmed

### DMARC

**Required for all domains.**

DMARC tells receiving servers what to do with mail that fails SPF or DKIM — it is the enforcement layer on top of both.

- [ ] **Add a TXT record at `_dmarc.yourdomain.com`** with `v=DMARC1; p=none; rua=mailto:dmarc-reports@yourdomain.com` — make sure the report address exists; you'll receive daily reports
- [ ] **Monitor reports for 1–4 weeks** (longer if you send infrequent mail like monthly invoices or newsletters) until all legitimate mail passes
- [ ] **Then enforce** — change `p=none` to `p=reject`, using `p=quarantine` as a safer middle step if needed

Starting directly at `p=reject` can block legitimate email while SPF/DKIM issues remain; the staged rollout lets you find and fix them before enforcing.

**Privacy note:** avoid `ruf=` (forensic reports) in your DMARC record — forensic reports can expose private email content and may violate privacy regulations. Use only `rua=` aggregate reports.

---

## Certificate Control

Who can mint valid TLS certificates for your domain is a DNS decision too.

### CAA (Certification Authority Authorization)

**Recommended for all domains serving HTTPS.**

CAA restricts which certificate authorities may issue certificates for your domain. Without it, any CA in the world can issue one.

- [ ] **Add CAA record(s) at your root domain** naming your CA(s) — e.g. tag `issue`, value `letsencrypt.org` (full format: `0 issue "letsencrypt.org"`; syntax varies by DNS provider)
- [ ] **Add one record per CA** if you use multiple CAs or want flexibility
- [ ] **Add matching `issuewild` records** if you use wildcard certificates (`*.yourdomain.com`)

---

## Transport Security

Email authentication proves who sent a message; transport security keeps it encrypted on the way.

### MTA-STS (Mail Transfer Agent Strict Transport Security)

**Recommended for business domains sending or receiving sensitive email.**

MTA-STS forces sending servers to use encrypted TLS when delivering mail to you, blocking downgrade attacks that would let mail travel unencrypted.

- [ ] **Add a TXT record at `_mta-sts.yourdomain.com`** with `v=STSv1; id=20260127` — increment `id` every time you change the policy, so mail servers know to refetch it
- [ ] **Serve a policy file** at `https://mta-sts.yourdomain.com/.well-known/mta-sts.txt` (the subdomain needs a valid HTTPS certificate):

```
version: STSv1
mode: testing
mx: mail1.yourdomain.com
mx: mail2.yourdomain.com
max_age: 86400
```

- [ ] **After testing, switch to `mode: enforce`** and increment the `id` in your TXT record (e.g. `id=20260128`)

**Important:** list ALL of your MX servers in the policy — missing even one causes delivery failures from that server.

---

## DNS Integrity

These features provide the strongest guarantees but punish operational mistakes with a fully broken domain. Only adopt them if you have dedicated resources for ongoing maintenance and monitoring.

### DNSSEC

**Required for government and financial institutions; recommended for high-value domains handling sensitive data.**

DNSSEC cryptographically signs your DNS records so resolvers can verify they haven't been tampered with, defeating DNS spoofing. The trade-off is operational: keys expire and must rotate, and a missed rotation or misconfiguration takes your entire domain offline.

- [ ] **Confirm your DNS provider supports DNSSEC** (not all do), then enable it — usually one click
- [ ] **Add the DS record at your registrar** — the provider auto-generates DNSKEY and RRSIG records and hands you the DS record to place manually
- [ ] **Monitor key expiration** — keys typically rotate every 30–90 days; alert at least 7 days before expiry

Records involved: **DNSKEY** (your public key, auto-generated), **RRSIG** (per-record signatures, auto-generated), **DS** (a hash of your DNSKEY, added manually at the registrar).

### TLSA (DANE)

**Optional — critical infrastructure or regulatory requirements only (e.g. EU government agencies).**

TLSA binds your mail server's TLS certificate into DNS, providing the strongest email transport security available. It requires working DNSSEC and inherits all of its fragility — and **every certificate renewal requires an immediate TLSA record update** or email delivery fails.

- [ ] **Enable DNSSEC first** — TLSA does not function without it
- [ ] **Generate a SHA-256 hash** of your mail server's certificate public key (requires OpenSSL)
- [ ] **Add a TLSA record at `_25._tcp.mail.yourdomain.com`** with value `3 1 1 <certificate-hash>` (3 = match certificate, 1 = public key, 1 = SHA-256)
