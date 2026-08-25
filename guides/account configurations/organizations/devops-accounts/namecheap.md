<!--
id: namecheap-organization-configuration
type: CONFIGURATION
scope: ORGANIZATION
-->

<div align="center"> <img src="../../../../images/guides/namecheap.svg" alt="Namecheap Logo" width="64" height="64"> <h2><a href="https://www.namecheap.com/" target="_blank" rel="noopener noreferrer">Namecheap</a> Configuration Guide</h2> </div>

## Account Security

#### Authentication
- [ ]  Profile > Security > Two-Factor Authentication > **U2F security key** or authenticator app
    - [ ]  Do **not** use SMS-based 2FA - registrar accounts are a prime SIM-swap target (SP-GS-013)
- [ ]  Use a unique, password-manager-generated password (SP-GS-008)
- [ ]  Register the account to a dedicated organization email that is itself protected with hardware-key MFA
- [ ]  Profile > Security > Review login history and active sessions; investigate anything unexpected

#### Delegated Access
- [ ]  Use Namecheap's **Share Access** / sub-account delegation instead of sharing the account password (SP-GS-009)
- [ ]  Grant each delegate the minimum permission set required, and review the delegate list quarterly
- [ ]  Remove delegated access the same day a member departs (SP-GS-024)

## Domain Protection

- [ ]  Domain List > Manage > **Registrar Lock** > **On** for every domain (blocks unauthorized transfers)
- [ ]  Domain List > Manage > **Domain Privacy** (WithheldForPrivacy) > **On** - keeps personal and office addresses out of WHOIS (supports the digital footprint guide)
- [ ]  Domain List > Manage > **Auto-Renew** > **On**, with a funded payment method that does not expire silently
    - [ ]  Set a calendar reminder ahead of expiry as a backstop; an expired domain is a full takeover
- [ ]  Maintain a domain inventory with registrar, expiry date, and named owner (SP-GS-020, SP-DI-021)
- [ ]  For domains that front funds or user transactions, evaluate moving to a registrar offering **registry lock** - Namecheap does not provide registry-level locking (SP-DI-020)

## DNS Security

- [ ]  Domain List > Manage > Advanced DNS > Enable **DNSSEC** on all primary domains
- [ ]  Add **CAA records** restricting which certificate authorities may issue for your domains, with an `iodef` reporting address
- [ ]  Review all DNS records and delete stale or dangling entries pointing at decommissioned infrastructure
- [ ]  Require a second reviewer for DNS changes and notify the team on every change (SP-DI-021)
- [ ]  Consider PremiumDNS or an external hardened DNS provider for resilience on critical zones

## Monitoring

- [ ]  Enable account login and change notifications to a monitored address
- [ ]  Monitor DNS zone and WHOIS records continuously for unauthorized changes (SP-DI-022)
- [ ]  Enable Certificate Transparency monitoring and alert on unexpected certificate issuance, flagging wildcards
- [ ]  Include registrar compromise and DNS hijack in the incident response playbooks, with the registrar support escalation path documented in advance
