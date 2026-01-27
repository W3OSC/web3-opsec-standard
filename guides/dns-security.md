---
id: dns-security-records-guide
type: GUIDE
scope: ORGANIZATION
---

<div align="center">
  <h1>DNS Security Records Guide</h1>
  <p><em>Protect Your Domain and Email</em></p>
</div>

---

## Overview

DNS security records protect your domain from spoofing, phishing, and man-in-the-middle attacks. This guide tells you what to implement, why it matters, and how to do it. Whether you're a solo developer or managing enterprise infrastructure, implementing these records properly is critical for protecting your domain reputation and preventing email-based attacks.

---

## Email Security

**Email authentication records are the foundation of domain security. Without them, attackers can impersonate your domain and send phishing emails to your customers, partners, and employees.**

### SPF (Sender Policy Framework)

**Why It's Critical**
Stops attackers from sending email that looks like it's from your domain. Without SPF, anyone can pretend to be you.

**Implementation Steps**
- [ ] Go to your DNS provider
- [ ] Add a TXT record at your root domain (`@`)
- [ ] Set value to: `v=spf1 include:_spf.google.com ~all` (for Google Workspace)
- [ ] Or: `v=spf1 include:spf.protection.outlook.com ~all` (for Microsoft 365)
 
**Important:** You can only have ONE SPF record. If you use multiple email services (e.g., Google + Mailchimp), combine them: `v=spf1 include:_spf.google.com 
include:servers.mcsv.net ~all`
                                                                                
**Status:** Required if you send email from your domain

---

### DKIM (DomainKeys Identified Mail)

**Why It's Critical**
Cryptographically signs your emails so recipients know they're actually from you and haven't been tampered with.

**Implementation Steps**
- [ ] Enable DKIM in your email provider (Google Workspace, Office 365, etc.)
- [ ] Provider gives you DNS record(s) to add - the "selector" name (like google._domainkey or selector1._domainkey) comes from your provider
- [ ] After adding the DNS record, return to your provider and click "Verify" or "Activate" to start signing emails   

**Status:** Required if you send email from your domain

---

### DMARC

**Why It's Critical**
Tells other email servers what to do when someone fails SPF or DKIM checks. This is your policy enforcement mechanism.

**Implementation Steps**
- [ ] Add a TXT record at _dmarc.yourdomain.com with: v=DMARC1; p=none; rua=mailto:dmarc-reports@yourdomain.com (make sure this email exists - you'll get daily   
  reports)
- [ ] Monitor reports for 1-4 weeks depending on your email patterns (longer if you send monthly invoices/newsletters)
- [ ] Once reports show all legitimate email passes, change p=none to p=reject (or use p=quarantine as a safer middle step) 

**Why the Progression Matters**
Starting with `p=reject` might block legitimate email if your SPF/DKIM isn't configured perfectly. The gradual approach lets you fix issues before enforcing.

**Status:** Required for all domains

---

## Certificate Control

### CAA (Certification Authority Authorization)

**Why It's Important**
Prevents rogue certificate authorities from issuing certificates for your domain. Without CAA, any CA can issue a cert for your domain.

**Implementation Steps**
- [ ] Add CAA record(s) at your root domain listing which CAs can issue certificates - format varies by DNS provider (tag: issue, value: letsencrypt.org or full format 0 issue "letsencrypt.org")
- [ ] If using multiple CAs or want flexibility, add multiple CAA records (one per CA)
- [ ] If using wildcard certificates (*.yourdomain.com), also add issuewild records with the same CA values 

**Status:** Recommended for all domains with HTTPS

---

## Transport Security

### MTA-STS (Mail Transfer Agent Strict Transport Security)

**Why It's Recommended**
Forces email servers to use encrypted TLS when delivering email to you. Prevents downgrade attacks where an attacker forces email to be sent unencrypted.     

**Implementation Steps**
- [ ] Add TXT record at _mta-sts.yourdomain.com: v=STSv1; id=20260127 (increment id every time you change the policy - mail servers use this to know when to      
refetch)
- [ ] Create subdomain mta-sts.yourdomain.com with valid HTTPS certificate, then add policy file at /.well-known/mta-sts.txt with ALL your MX servers listed:     
```
version: STSv1
mode: testing
mx: mail1.yourdomain.com                                                                                                                                      
mx: mail2.yourdomain.com                                                                                                                                      
max_age: 86400
```
- [ ] After testing, change `mode: testing` to `mode: enforce` AND increment the `id` in your TXT record (e.g., `id=20260128`)

**Important:** List ALL MX servers in your policy. Missing even one will cause email delivery failures from that server.
                                        
**Status:** Recommended for business domains sending/receiving sensitive email                                                                                                                                                                                                                                                    
---

## DNS Integrity

**Advanced DNS security features require operational maturity. Only implement these if you have dedicated resources for ongoing maintenance and monitoring.**

### DNSSEC

**Why It's Advanced**
Cryptographically signs your DNS records so resolvers can verify they haven't been tampered with. This prevents DNS spoofing attacks.                         

**Why Not Everyone Needs It**
DNSSEC is operationally complex. Keys expire and need rotation. If you forget to rotate keys, your entire domain stops resolving. Misconfiguration can break  
your entire domain. Only implement if you have operational maturity.                

**Implementation Steps**
- [ ] Check if your DNS provider supports DNSSEC (not all do) - if supported, enable it (usually one-click)                                                       
- [ ] Provider auto-generates DNSKEY and RRSIG records, then provides a DS record for you to add at your domain registrar                                         
- [ ] Set up monitoring for key expiration (keys typically expire every 30-90 days) with alerts at least 7 days before expiration
                              
**Records Involved**
- **DNSKEY:** Your public key (auto-generated by DNS provider)
- **RRSIG:** Signatures for each DNS record (auto-generated)
- **DS:** Hash of your DNSKEY, stored at your registrar (you add this manually)

**Status:** Required for government/financial institutions. Recommended for high-value domains handling sensitive data.

---

### TLSA (DANE)

**Why It's Advanced**
Binds TLS certificates to DNS records. Provides the strongest email security but requires DNSSEC first.

**Why Not Everyone Needs It**
TLSA requires DNSSEC to work. If DNSSEC breaks, TLSA breaks. **Every certificate renewal requires immediate TLSA record update** or email delivery fails. Only
implement if you already have mature DNSSEC operations.               
 
**Implementation Steps**
- [ ] **Must have DNSSEC enabled first**
- [ ] Generate SHA-256 hash of your mail server's certificate public key (requires OpenSSL)
- [ ] Add TLSA record at _25._tcp.mail.yourdomain.com with value: 3 1 1 <certificate-hash> (3=match cert, 1=pubkey, 1=SHA-256)

**Status:** Optional. Only for critical infrastructure or when required by regulation (e.g., EU government agencies).
