<!--
id: 1password-organization-configuration
type: CONFIGURATION
scope: ORGANIZATION
-->

<div align="center">
  <img src="../../../../images/guides/1password.svg" alt="1Password Logo" width="64" height="64">
  <h2><a href="https://1password.com/business" target="_blank" rel="noopener noreferrer">1Password Business</a> Configuration Guide</h2>
</div>

## Admin Console Settings

#### Account Policies
- Policies > Two-factor authentication >
    - [ ]  Require two-factor authentication for all team members > **On**
    - [ ]  Allowed methods > **Security key** preferred; authenticator app as fallback (never SMS)
- [ ]  Policies > Master password requirements > Set minimum strength policy (long, randomly generated account passwords)
- [ ]  Policies > Firewall rules > Restrict sign-ins by location/IP where applicable (allowlist office/VPN ranges, block high-risk regions)
- [ ]  Policies > Modern app requirements > Require up-to-date 1Password apps and browsers

#### Vault Architecture
- [ ]  Create per-team vaults (e.g., Engineering, Finance, Ops) instead of one shared vault
- [ ]  Grant vault access on a least-privilege basis > only the permissions each group needs (view vs. edit vs. manage)
- [ ]  Prohibit storing organization secrets in personal **Private** vaults > document this in policy and audit periodically
- [ ]  Create a dedicated break-glass vault for critical credentials (root/cloud accounts, registrar, signing keys) with **dual custody** > access requires two designated admins
- [ ]  Review vault access lists on a set cadence and remove stale grants

#### Sharing Controls
- [ ]  Policies > Item sharing > **Disable** public item sharing links, or enforce short default expiry (e.g., 1 hour / 1 view)
- [ ]  Restrict sharing to people in specific accounts or verified email domains only
- [ ]  Require items shared externally to expire automatically > no indefinite share links

#### Recovery
- [ ]  Create a Recovery Group with at least **2** trusted admins (never a single person)
- [ ]  Document the account recovery procedure so recovery does not depend on any one individual
- [ ]  Define an Emergency Kit storage policy for the organization owner account > printed/offline copy in a sealed, access-controlled location (e.g., safe or safety deposit box)
- [ ]  Test the recovery flow with a non-critical account at least annually

#### Provisioning & Lifecycle
- [ ]  Integrate SSO (Unlock with Okta/Entra/Google) and/or SCIM bridge for automated provisioning where the identity provider supports it
- [ ]  Map identity provider groups to 1Password groups so vault access follows role changes automatically
- [ ]  Deprovision departing members the **same day** > suspend, then delete after data review
- [ ]  Transfer vault ownership and reassign managed items during offboarding before deletion
- [ ]  Review pending invitations and remove any that are stale

#### Monitoring
- [ ]  Review **Watchtower** organization-wide reports for weak, reused, and compromised passwords on a set cadence
- [ ]  Review domain breach reports (1Password breach report) and rotate affected credentials promptly
- [ ]  Monitor sign-in attempts > investigate failed and unusual-location attempts
- [ ]  Review the **Activity Log** regularly for vault permission changes, exports, and admin actions
- [ ]  Send Activity Log events to your SIEM via the Events API where available

#### Client Hygiene
- [ ]  Install apps only from [1password.com/downloads](https://1password.com/downloads/) or official OS app stores
- [ ]  Install the browser extension only from the verified store listing (check publisher is AgileBits/1Password)
- [ ]  Enforce auto-lock timeouts on desktop and mobile clients (lock on idle, on device sleep, and on browser exit)
- [ ]  Disable clipboard persistence > clear clipboard contents after a short interval
