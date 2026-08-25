<!--
id: phantom-individual-configuration
type: CONFIGURATION
scope: INDIVIDUAL
-->

<div align="center"> <img src="../../../../images/guides/phantom.svg" alt="Phantom Logo" width="64" height="64"> <h2><a href="https://phantom.com/" target="_blank" rel="noopener noreferrer">Phantom</a> Configuration Guide</h2> </div>

## Installation Integrity

- [ ]  Install **only** via the link from `phantom.com` to the official store or app store listing - never from a search advertisement
- [ ]  Verify the publisher on mobile app stores before installing; clone apps using the Phantom name and icon appear regularly
- [ ]  Use a dedicated browser profile for wallet activity with no unrelated extensions (SP-EP-009, SP-EP-011)

## Setup

- [ ]  Pair with a **hardware wallet** (Ledger) for any meaningful value (SP-WM-002)
- [ ]  Keep hot-wallet balances limited to spending money (SP-WM-011)
- [ ]  Use separate accounts per context - public activity, DeFi, minting - rather than one address (SP-WM-004)

## Security Settings

- [ ]  Settings > Security & Privacy > **Auto-lock timer** > Short interval
- [ ]  Settings > Security & Privacy > **Transaction previews / simulation** > **On**
- [ ]  Settings > Security & Privacy > **Blocklist / scam site warnings** > **On**
- [ ]  Review **Trusted Apps** and revoke connections you no longer use

## Solana-Specific Risks

- [ ]  **Never interact with unknown airdropped tokens or NFTs** - malicious airdrops are the dominant Solana drain vector
    - [ ]  Use Phantom's built-in hide or burn tools; do **not** visit any "claim", "unlock", or "verify" site linked from a token's metadata
- [ ]  Scrutinize **token delegate and `setAuthority`** requests - these hand ongoing control of a token account to another party
- [ ]  Review and revoke existing token delegations on a schedule
- [ ]  Be alert to **durable nonce** transactions: a signed transaction can be held and executed later, so a signature you approve today may settle at an attacker-chosen moment
- [ ]  Verify the program being invoked matches the dApp you intended to use; reject requests you cannot decode

## Connected Apps

- [ ]  Review **Trusted Apps** regularly and revoke stale dApp connections
- [ ]  Verify dApp domains before connecting - bookmark the ones you use rather than reaching them via search or social links

## Seed & Recovery

- [ ]  Never export, screenshot, or enter your recovery phrase into any website (SP-WM-003)
- [ ]  **Phantom will never ask for your recovery phrase** - "wallet sync", "validation", and "support" requests for it are theft attempts
- [ ]  On mobile, do not place the recovery phrase in unencrypted cloud backup; store it on physical media per the key backup guidance
- [ ]  Protect the mobile device itself with a strong passcode and remote wipe (see [Mobile Security](../../../mobile-security.md))

## Incident Response

- [ ]  On a suspected drain: **migrate remaining funds from a clean device first**, then revoke delegates and app connections
- [ ]  Do not troubleshoot or reconnect the wallet on the suspect device
- [ ]  Treat the event as a key compromise and follow the organization's protocol (SP-WM-022)
