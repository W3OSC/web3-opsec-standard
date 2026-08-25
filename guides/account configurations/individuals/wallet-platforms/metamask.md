<!--
id: metamask-individual-configuration
type: CONFIGURATION
scope: INDIVIDUAL
-->

<div align="center"> <img src="../../../../images/guides/metamask.svg" alt="MetaMask Logo" width="64" height="64"> <h2><a href="https://metamask.io/" target="_blank" rel="noopener noreferrer">MetaMask</a> Configuration Guide</h2> </div>

## Installation Integrity

- [ ]  Install **only** by following the link from `metamask.io` to the official store listing - never from a search-engine advertisement
    - [ ]  Malicious clones bought as sponsored search results are one of the most common initial-compromise paths
- [ ]  Verify the extension publisher and listing details (install count, publisher name) before installing
- [ ]  Use a **dedicated browser profile** for wallet activity, separate from general browsing (SP-EP-009)
- [ ]  Install no unrelated extensions in that profile - any extension with page access can tamper with what you see (SP-EP-011)

## Wallet Setup

- [ ]  Pair MetaMask with a **hardware wallet** and use the extension purely as an interface for any meaningful value (SP-WM-002)
- [ ]  Never import a high-value seed phrase directly into the extension - a browser-resident key is a hot key
- [ ]  Limit any hot-wallet balance to spending money you can afford to lose entirely (SP-WM-011)
- [ ]  Use **separate accounts per context** (public/doxxed, DeFi, minting, testing) rather than one address for everything (SP-WM-004)

## Security Settings

- [ ]  Settings > Security & privacy > **Security alerts** (Blockaid) > **On**
- [ ]  Settings > Security & privacy > **Transaction simulation / Estimate balance changes** > **On**
- [ ]  Settings > Security & privacy > **Phishing detection** > **On**
- [ ]  Settings > Security & privacy > **Auto-lock timer** > Set to a short interval (5 minutes or less)
- [ ]  Settings > Experimental / Advanced > Review any preview features before enabling

## Privacy Settings

- [ ]  Settings > Security & privacy > Review **Connected sites** regularly and disconnect dApps you no longer use
- [ ]  Consider a **custom RPC endpoint** you control or trust rather than defaults, and understand that your RPC provider sees your address activity
- [ ]  Disable participation in optional metrics collection if you prefer minimal telemetry
- [ ]  Avoid connecting the same address to unrelated dApps - it links your activity into a single on-chain identity (supports [Digital Footprint](../../../digital-footprint.md))

## Transaction Hygiene

- [ ]  **Read the simulation result before every confirmation** - if the predicted balance change does not match your intent, reject
- [ ]  Scrutinize `approve`, `setApprovalForAll`, and `permit` prompts - these grant ongoing spending authority, not a one-time transfer
    - [ ]  Set a **custom spending cap** matching the transaction amount instead of accepting unlimited approval
- [ ]  Verify the full destination address on screen, character by character - not just the first and last four (address poisoning)
- [ ]  Revoke stale approvals on a schedule using `revoke.cash` or the equivalent, especially after minting or testing new protocols
- [ ]  Never sign an opaque message you cannot decode; unreadable signature requests are how drainers obtain permits

## Seed & Recovery

- [ ]  Never export, screenshot, photograph, or type your Secret Recovery Phrase into any website (SP-WM-003)
- [ ]  **MetaMask will never ask for your SRP** - any "wallet validation", "sync", or "support" site requesting it is a theft attempt
- [ ]  Store recovery material per the hardware wallet guidance, on physical media only
- [ ]  Treat any prompt to "re-enter your seed to restore" inside a browser as an attack

## Updates & Incident Response

- [ ]  Keep the extension updated; review changelogs for security-relevant changes
- [ ]  If compromise is suspected: **move funds from a clean device first**, then revoke approvals - do not troubleshoot on the suspect machine
- [ ]  Treat a suspected key exposure as a key compromise event and follow the organization's key compromise protocol (SP-WM-022)
