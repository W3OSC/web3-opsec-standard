<!--
id: rabby-individual-configuration
type: CONFIGURATION
scope: INDIVIDUAL
-->

<div align="center"> <img src="../../../../images/guides/rabby.svg" alt="Rabby Logo" width="64" height="64"> <h2><a href="https://rabby.io/" target="_blank" rel="noopener noreferrer">Rabby</a> Configuration Guide</h2> </div>

## Installation Integrity

- [ ]  Install **only** via the link from `rabby.io` to the official store listing - never from a search advertisement
- [ ]  Verify the publisher is **DeBank** before installing
- [ ]  Use a dedicated browser profile for wallet activity with no unrelated extensions (SP-EP-009, SP-EP-011)

## Setup

- [ ]  Pair with a **hardware wallet** for any meaningful value; use Rabby as the interface layer only (SP-WM-002)
- [ ]  Import high-value addresses as **watch-only** for monitoring without exposing signing capability
- [ ]  Keep hot-wallet balances limited to spending money (SP-WM-011)
- [ ]  Maintain separate addresses per context rather than one address across all activity (SP-WM-004)

## Security Features

Rabby's pre-transaction analysis is its main advantage - the controls below exist to make sure you actually use it.

- [ ]  Confirm **pre-transaction risk scanning** is active and review its output on every signature request
- [ ]  Review the **"What's changed" balance diff** before confirming - this shows the predicted net effect on your holdings
- [ ]  Treat **security engine alerts as blockers**, not as noise to click through
    - [ ]  If an alert fires and you do not fully understand why, reject the transaction and investigate away from the dApp
- [ ]  Verify the **contract and chain** shown in the signing panel match the dApp you intended to use
- [ ]  Reject any signature request whose decoded contents Rabby cannot display meaningfully

## Approval Management

- [ ]  Use Rabby's built-in **approval dashboard** to review outstanding token and NFT approvals on a schedule
- [ ]  Revoke unlimited approvals and any approval to a protocol you no longer use
- [ ]  Prefer transaction-sized spending caps over unlimited approvals when a dApp offers the choice

## Multi-Chain Hygiene

- [ ]  Verify the **active chain** before signing - multi-chain wallets make chain-confusion attacks easier
- [ ]  Add only the chains you actually use; review the custom RPC list for entries you did not add
- [ ]  Confirm custom RPC endpoints point at providers you trust (SP-SC-018)

## General

- [ ]  Set a short **auto-lock** interval
- [ ]  Review and disconnect stale **connected dApps** regularly
- [ ]  Never enter your seed phrase into any website - Rabby will never request it (SP-WM-003)
- [ ]  Keep the extension updated
- [ ]  On suspected compromise, migrate funds from a clean device and follow the key compromise protocol (SP-WM-022) - see the [MetaMask guide](metamask.md) for the same incident sequence
