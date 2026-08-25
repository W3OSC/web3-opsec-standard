<!--
id: transaction-verification-organization-guide
type: GUIDE
scope: ORGANIZATION
-->

# Transaction Verification Guide

*Step-by-step calldata verification for multisig signers — the control that stops blind-signing losses*

---

## Overview

The February 2025 Bybit incident demonstrated the failure mode this guide exists to prevent: a compromised proposal UI displayed a benign-looking transfer to every signer while their hardware wallets actually signed a malicious payload that handed control of the cold wallet to attackers. Every signer approved. Nearly $1.5B was lost. No key was stolen and no contract was exploited — the signers simply trusted what a web page told them instead of verifying what their devices were signing.

UI-only verification fails because the interface that proposes a transaction and the payload that gets signed are two different things. Any layer between them — the proposal web app, a browser extension, a compromised developer machine at the UI vendor, DNS, or a malicious dependency — can present one transaction while submitting another for signature. The only trustworthy display is the hardware wallet screen, and it is only useful if you independently compute what *should* appear on it. This guide defines the verification procedure every signer must complete before approving any transaction. It assumes the signing environment described in the [Multi-Sig Operations and Ideal Setup Guide](./multisig-ideal-setup.md); this guide covers the per-transaction process, not wallet setup.

---

## Before You Sign: The Five Checkpoints

💡 **Every signer completes all five checkpoints for every transaction. A signature is an attestation that you verified the payload — not that the UI looked normal.**

- [ ] **1. Authenticate the proposal**: Verify the transaction was proposed by an authorized proposer and matches a stated intent
  - [ ] Confirm the proposer's identity through an out-of-band channel (a call or authenticated chat separate from the proposal platform) — a queue entry is not authentication
  - [ ] Confirm the stated intent in the proposer's own words: recipient, amount, contract, and action
- [ ] **2. Simulate the transaction**: Run the transaction through a simulator (Tenderly, or the Safe built-in simulation)
  - [ ] Review the resulting state changes — balance deltas, approvals granted, ownership or implementation slots modified — against the stated intent
  - [ ] Treat any state change you cannot explain as grounds for rejection, not as a curiosity
- [ ] **3. Decode and verify the calldata**: Independently decode the raw calldata — never rely on the proposal UI's rendering of it
  - [ ] Confirm the to-address, function selector, and every parameter match the stated intent
  - [ ] Use an independent decoder such as [Swiss Knife](https://calldata.swiss-knife.xyz/decoder), ideally on a different machine than the one displaying the proposal
- [ ] **4. Verify hashes on the hardware wallet screen**: The device screen is the only display you trust
  - [ ] Independently compute the expected Safe domain hash, message hash, and safe-tx-hash (tools below)
  - [ ] Confirm the values shown on the HARDWARE WALLET screen match your independently computed values exactly
- [ ] **5. Cross-check on a second interface**: Before the final signature that meets threshold, verify the queue independently
  - [ ] Confirm the queued transaction details on a second, independent interface (self-hosted UI, different device, or direct RPC query)
  - [ ] Ensure the second interface shares no infrastructure with the primary proposal UI — not the same machine, browser profile, or DNS path

---

## Verifying Safe Transactions

### Reviewing the Queue

- [ ] Verify you are operating on the correct Safe — confirm the full Safe address and chain, since lookalike Safes are a known phishing pattern
- [ ] Open the transaction queue and record the pending transaction's `to`, `value`, `data`, `operation`, and `nonce` fields from the raw transaction data view — not the summary card
- [ ] Confirm the nonce matches the expected next nonce and that no unexpected transactions sit ahead of it in the queue
- [ ] Confirm `operation` is `0` (CALL). Treat `operation = 1` (DELEGATECALL) as a red flag requiring the elevated process in [High-Risk Transaction Types](#high-risk-transaction-types)

### Computing the Safe Transaction Hash Independently

- [ ] Compute the expected safe-tx-hash on a machine independent of the proposal UI using one of:
  - [ ] [safe-tx-hashes-util](https://github.com/pcaversaccio/safe-tx-hashes-util) (or the [Cyfrin fork](https://github.com/Cyfrin/safe-tx-hashes) that avoids Safe API dependence)
  - [ ] [OpenZeppelin Safe Utils](https://safeutils.openzeppelin.com/) for a browser-based cross-check
- [ ] Verify the tool's inputs (Safe address, chain, nonce, to, value, data, operation) were taken from the raw transaction data, not copied from the UI summary
- [ ] Have at least one other signer compute the hash with a different tool and compare results out-of-band

### Verifying on the Device Screen

- [ ] Enable EIP-712 / clear-signing display in the device's Ethereum app settings before the signing session, so structured hashes are displayed rather than blind-signed
- [ ] On Ledger, review the EIP-712 signing screens and confirm the **domain hash** and **message hash** match your independently computed values, byte for byte
- [ ] On Trezor, confirm the displayed safe-tx-hash / EIP-712 fields match your computed values
- [ ] If the device shows only a blind-signing prompt (raw hash with no decoded fields and no way to compare), abort — do not approve a hash you cannot independently reproduce
- [ ] Reject and investigate if ANY displayed value differs from your computed value, even by one character — never re-try until it "looks right"

### Red Flags That Require Rejection or Escalation

- [ ] **Delegatecall** (`operation = 1`): can rewrite Safe storage, including owners and the mastercopy — reject unless it targets a pre-approved, audited module (e.g. MultiSendCallOnly) and went through the elevated review process
- [ ] **`approve` / `increaseAllowance` / `setApprovalForAll`**: verify the spender address is a known contract and the amount is bounded to the immediate need — unlimited approvals to unfamiliar spenders are how treasuries drain later, not immediately
- [ ] **Upgrade or mastercopy changes**: any transaction touching `changeMasterCopy`, proxy implementation slots, `enableModule`, `setGuard`, or `setFallbackHandler` alters what the Safe *is* — these require the elevated process and out-of-band confirmation from every signer
- [ ] **Owner/threshold changes**: `addOwnerWithThreshold`, `removeOwner`, `changeThreshold` must match a documented, pre-announced signer lifecycle event
- [ ] **Manufactured urgency**: pressure to sign quickly ("the rate expires", "everyone else already signed") is itself a red flag — verification time is non-negotiable, and rushed signers are exactly what the Bybit attackers relied on

---

## Verifying EOA Transactions

For transactions signed directly by an EOA (deployer keys, hot wallets, personal signers):

- [ ] **Full address verification**: Verify the ENTIRE recipient address character-by-character against a known-good record — never only the first and last 4 characters, which address-poisoning attacks are specifically designed to match
- [ ] **Source the address independently**: Take the recipient address from your own address book or a prior verified transaction, never from transaction history (poisoned entries) or a message that has not been re-verified out-of-band
- [ ] **Value and gas on the device**: Confirm the amount and max gas/fee shown on the hardware wallet screen — a wrong value on the device means a compromised host, not a display bug
- [ ] **Chain ID**: Confirm the chain ID on the device matches the intended network, preventing replay or wrong-network sends
- [ ] **Nonce**: Confirm the nonce is the expected next nonce for the account — an unexpected nonce can indicate a pending malicious transaction or a replacement attack
- [ ] **Calldata for contract calls**: If the transaction carries data, decode it and verify selector and parameters exactly as with Safe transactions
- [ ] **Test transaction for new recipients**: For first-time or high-value destinations, send a small test amount and confirm receipt out-of-band before the full transfer

---

## High-Risk Transaction Types

The following transaction types require extra controls beyond the five checkpoints:

| Transaction type | Why it is dangerous | Extra required steps |
| --- | --- | --- |
| Arbitrary external call to a new/unknown contract | Unknown code executes with treasury context | 24h+ waiting period; independent review of target contract source; second technical reviewer |
| Delegatecall (`operation = 1`) | Target code runs in the Safe's own storage context and can replace owners/mastercopy | Reject by default; if genuinely required, elevated approval, audited target only, all-signer out-of-band confirmation |
| Token approvals (`approve`, `setApprovalForAll`) | Grants standing spend rights that can be exercised later | Bound amounts to immediate need; verify spender against verified contract lists; scheduled revocation review |
| Contract upgrades / mastercopy or implementation changes | Silently replaces all contract logic | Timelock/waiting period; diff review of new implementation; second technical reviewer; elevated approval threshold |
| Signer, threshold, module, or guard changes | Alters the security policy of the wallet itself | Must map to a pre-announced lifecycle event; out-of-band confirmation with the affected signer; elevated approval |

- [ ] Define which transaction types your organization classifies as high-risk and document the extra steps for each
- [ ] Enforce a mandatory waiting period for high-risk transactions (a timelock such as the Zodiac Delay modifier makes this non-bypassable on-chain)
- [ ] Require a designated second reviewer, independent of the proposer, to complete the full verification procedure for high-risk transactions

---

## EIP-7702 Considerations

EIP-7702 lets an EOA delegate its execution to contract code. A signed delegation turns "your address" into "someone else's code running as your address," so delegation transactions deserve the same scrutiny as contract upgrades.

- [ ] **Verify the delegation designator**: Before signing any EIP-7702 authorization, verify the delegate contract address character-by-character and confirm the contract source is verified, audited, and the address matches official project documentation via an out-of-band source
- [ ] **Treat authorization requests as high-risk by default**: A malicious delegate contract gains full control of the EOA and everything it holds — wallets should never sign 7702 authorizations presented unexpectedly by a dApp
- [ ] **Check chain ID in the authorization**: A `chainId` of `0` authorizes the delegation on ALL chains — reject unless cross-chain delegation is explicitly intended
- [ ] **Audit existing delegations**: Periodically check whether organization EOAs carry an active delegation (account code beginning with `0xef0100`) and confirm each delegate address is expected
- [ ] **Know the revocation procedure**: Practice revoking a delegation (a new authorization to the zero address) so it can be executed immediately if a delegate contract is compromised
- [ ] **Verify sponsored/relayed flows end-to-end**: If a third party relays or sponsors your 7702 transaction, verify the full authorization tuple yourself — sponsorship changes who pays for the transaction, not what you authorized
- [ ] **Multisig signer EOAs must not carry delegations**: Signer keys used in your quorum should have no 7702 delegation at all; a delegated signer EOA undermines the hardware-wallet trust model this guide depends on
