<!--
id: cloudflare-organization-configuration
type: CONFIGURATION
scope: ORGANIZATION
-->

<div align="center"> <img src="../../../../images/guides/cloudflare.svg" alt="Cloudflare Logo" width="64" height="64"> <h2><a href="https://www.cloudflare.com/" target="_blank" rel="noopener noreferrer">Cloudflare</a> Configuration Guide</h2> </div>

## Account Security

#### Authentication
- Manage Account > Members (dash.cloudflare.com > Manage Account > Members)
    - [ ]  Require two-factor authentication for all members of this account > **On**
        - [ ]  Instruct all members to register a hardware security key (FIDO2) as their 2FA method, not SMS or TOTP where possible
- My Profile > Authentication (dash.cloudflare.com/profile/authentication)
    - [ ]  Two-Factor Authentication > **On** with a **Security Key** registered
    - [ ]  Store backup codes offline in your organization's secrets vault

#### Member Management
- Manage Account > Members
    - [ ]  Review member list and remove departed members or unrecognized accounts
    - [ ]  Review Role for each member > Assign least-privilege scoped roles (e.g. **DNS**, **Analytics**) instead of **Super Administrator**
        - [ ]  Ensure no more than 2-3 Super Administrators

#### API Tokens
- My Profile > API Tokens (dash.cloudflare.com/profile/api-tokens)
    - [ ]  Review all tokens and delete any unused or unrecognized
    - [ ]  For each remaining token, scope Permissions and Zone Resources to the minimum required (never **All zones** unless necessary)
        - [ ]  Set Client IP Address Filtering to your CI/infrastructure egress IPs where feasible
        - [ ]  Set a TTL / rotate tokens on a regular schedule
    - [ ]  Global API Key > Do not use; treat as compromised if it has ever been shared, and roll it

#### Audit Logs
- Manage Account > Audit Log
    - [ ]  Review audit log regularly for unexpected member, DNS, or token changes
    - [ ]  Notifications (Manage Account > Notifications) > Create alerts for available security events (e.g. **Security Events**, **Advanced Security Events**)

## Registrar and Domain

#### Domain Protection
- Domain Registration > Manage Domains (dash.cloudflare.com > Domain Registration)
    - [ ]  For each domain > Configuration > Transfer Lock > **On**
    - [ ]  WHOIS redaction > **On** (default with Cloudflare Registrar - verify no personal data is exposed)
    - [ ]  Auto-renew > **On**
        - [ ]  Billing > Verify a valid, funded payment method so renewals cannot fail
    - [ ]  Custom Domain Protection (registry lock) > **Enable** for business-critical domains [[1]](#registry-lock)

## DNS Security

#### DNSSEC
- For each zone > DNS > Settings
    - [ ]  DNSSEC > **On**
        - [ ]  Confirm the DS record is published at your registrar and the zone shows **Success**

#### Records Hygiene
- For each zone > DNS > Records
    - [ ]  Add CAA records restricting certificate issuance to your intended CAs (e.g. `0 issue "letsencrypt.org"`, `0 issue "pki.goog"`, plus `0 issuewild ";"` if wildcards are not used)
    - [ ]  Review all records and remove stale entries (dangling CNAMEs are subdomain-takeover risks)
    - [ ]  Establish a change-review discipline: DNS changes for production zones require a second approver and are made via audited tokens, not personal Global API Keys

#### Monitoring
- Each zone > Analytics & Logs > DNS
    - [ ]  Review DNS analytics for unexpected query patterns
- Manage Account > Notifications
    - [ ]  Add available DNS/zone notifications (e.g. **DNSSEC-related** alerts, zone transfer events) so record tampering is detected quickly

## TLS/SSL

#### Encryption Mode
- For each zone > SSL/TLS > Overview
    - [ ]  Encryption mode > **Full (strict)** [[2]](#full-strict)
- SSL/TLS > Edge Certificates
    - [ ]  Minimum TLS Version > **TLS 1.2** (or 1.3 if all clients support it)
    - [ ]  Always Use HTTPS > **On**
    - [ ]  Opportunistic Encryption > **On**
    - [ ]  HTTP Strict Transport Security (HSTS) > **On** with care [[3]](#hsts)
    - [ ]  Certificate Transparency Monitoring > **On** - alerts you when any certificate is issued for your domain, a key early-warning signal for hijack attempts

## Protection Features

#### WAF and Rate Limiting
- For each zone > Security > WAF
    - [ ]  Managed rules > Deploy the **Cloudflare Managed Ruleset**
    - [ ]  Rate limiting rules > Add rules for authentication and other sensitive endpoints (login, password reset, API token issuance)

#### Bots and Emergencies
- Security > Bots
    - [ ]  Bot Fight Mode > Evaluate and enable if it does not break legitimate API/monitoring traffic [[4]](#bot-fight)
- [ ]  Ensure on-call staff know how to enable **Under Attack Mode** (zone Overview > Quick Actions) during active DDoS or credential-stuffing incidents

## Pages/Workers

#### Deployment Security (if used)
- Workers & Pages (dash.cloudflare.com > Workers & Pages)
    - [ ]  Restrict deployment permissions > Only grant members the **Workers Admin** / Pages edit roles if they deploy code
    - [ ]  CI deploy tokens > Scope API tokens to **Workers Scripts:Edit** on specific accounts only, and rotate them
- Each Worker/Pages project > Settings
    - [ ]  Store secrets as **Secrets** (encrypted), never as plain-text environment variables or in source
    - [ ]  Pages > Preview deployments > Access policy > Restrict viewing to organization members (Cloudflare Access) so unreleased frontends and secrets in previews are not public
    - [ ]  Review custom domains attached to projects and remove any unused

---

## Notes

### <a id="registry-lock"></a>[1] Custom Domain Protection / Registry Lock
Registry lock places out-of-band, human-verified controls on domain transfers, nameserver changes, and deletion - the strongest defense against domain hijacking, which has been used to drain users of web3 frontends via DNS takeover. Cloudflare offers this as Custom Domain Protection on Enterprise plans; if unavailable, consider a registrar that offers registry lock for your most critical domains.

### <a id="full-strict"></a>[2] Full (strict)
Modes below Full (strict) (Off, Flexible, Full) allow unvalidated or unencrypted connections between Cloudflare and your origin, enabling on-path attackers to serve modified content - fatal for a web3 frontend where injected JavaScript can rewrite transaction payloads. Full (strict) validates the origin certificate; use a Cloudflare Origin CA certificate on the origin if needed.

### <a id="hsts"></a>[3] HSTS Care
HSTS instructs browsers to refuse plain-HTTP connections for the max-age you set. If you later disable HTTPS or move to an origin without valid TLS, returning visitors will be locked out until max-age expires. Start with a short max-age, confirm everything works, then increase it before enabling includeSubDomains or preload.

### <a id="bot-fight"></a>[4] Bot Fight Mode
Bot Fight Mode challenges traffic that matches known bot patterns and cannot be selectively bypassed on free plans. It can break wallet apps, RPC health checks, uptime monitors, and legitimate API integrations - test against your real traffic before enforcing, or use Super Bot Fight Mode / custom WAF rules with allowlists on paid plans.
