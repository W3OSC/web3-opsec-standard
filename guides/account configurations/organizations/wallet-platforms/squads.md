<!--
id: squads-organization-configuration
type: CONFIGURATION
scope: ORGANIZATION
-->

<div align="center"> <img src="../../../../images/guides/squads.svg" alt="Squads Logo" width="64" height="64"> <h2><a href="https://app.squads.so/" target="_blank" rel="noopener noreferrer">Squads</a> Configuration Guide</h2> </div>

## Multisig Setup

#### Members & Threshold
- [ ]  Settings > Members > **3+ members**
- [ ]  Settings > Threshold > **More than 50% of voting members** (e.g. 2-of-3, 3-of-4, 3-of-5)
    - [ ]  Never use a **1-of-N** configuration - a single compromised key drains every vault in the Squad
- [ ]  Ensure every member key is a **hardware wallet** (no browser-extension hot wallets, no seed phrases in password managers)
- [ ]  Ensure no two member keys are held on the same device or by the same person via shared devices

#### Member Hygiene
- [ ]  Settings > Members > Name each member clearly (person + device, e.g. `alice-ledger`) so voters can verify who has approved a proposal
- [ ]  Record every member's public key, holder, and device in the organization's key registry

## Roles & Permissions

- [ ]  Settings > Members > Review each member's permissions and grant only what their role requires (Squads v4 splits permissions into **Proposer**, **Voter**, and **Executor**)
    - [ ]  Give operational staff **Proposer**-only keys so they can queue transactions without approval power
    - [ ]  Reserve **Voter** permission for keyholders who are trained to review decoded transactions
    - [ ]  Limit **Executor** permission to the members expected to land approved transactions on-chain
- [ ]  Confirm the approval threshold is counted against **Voter** members only - adding proposer-only members must not silently weaken the quorum
- [ ]  Settings > Time lock > Set a **time lock** on execution so approved proposals cannot execute instantly (gives the team a window to catch a malicious approval)

## Sub-accounts & Vaults

- [ ]  Segregate funds across vaults by purpose: a **treasury vault** for reserves and separate **operational vaults** for day-to-day payments
    - [ ]  Keep the bulk of funds in the treasury vault and top up operational vaults on a schedule, not on demand
- [ ]  Spending limits > Only configure spending limits on **operational vaults**, never on the treasury vault
    - [ ]  Scope every spending limit to a specific member, token, and amount with a **reset period** - a spending limit bypasses the threshold for its beneficiary
    - [ ]  Review existing spending limits and remove any that are unused or unattributed

## Transaction Safety

- [ ]  Require every voter to review the built-in **simulation** results before approving; a failed or skipped simulation is a blocker
- [ ]  Require every voter to verify the **program IDs** invoked by the proposal against the known IDs of the intended protocols
- [ ]  Require every voter to read the **decoded instructions** (recipients, amounts, mints, authorities) - never approve a proposal that only shows raw instruction data
- [ ]  Treat any interaction with an **unknown or unverifiable program** as a blocker - do not approve until the program is identified and the interaction was expected
- [ ]  Verify recipient address and amount on the hardware wallet screen, not only in the browser

## Member Rotation & Continuity

- [ ]  Add a replacement member **before** removing the outgoing member so the threshold remains satisfiable at every step
    - [ ]  Re-check the threshold after every membership change - removing a voter can silently turn a 3-of-5 into a 3-of-4
- [ ]  Document the full member set, permissions, threshold, and vault layout in the organization's key registry and update it on every change
- [ ]  Test the member-rotation procedure (swap out one member) at least once so key replacement is routine before it is urgent
- [ ]  Define and document the response runbook for a compromised member key (remove or swap the member immediately; the threshold buys time, not immunity)

## Access Hygiene

- [ ]  Bookmark **https://app.squads.so/** and access the Squad only via the bookmark
    - [ ]  Never follow "Squads" links from emails, Discord, Telegram, or search ads - verify the domain character-by-character
- [ ]  Review each member wallet's connected apps and revoke sessions for any unused or unrecognized dApps
- [ ]  Review and disconnect stale **WalletConnect** sessions on every member wallet - an old session on a compromised dApp can prompt signatures

## Monitoring

- [ ]  Enable proposal and execution **notifications** for every member (new proposals, approvals, executed transactions) so no member votes from a chat-link prompt alone
- [ ]  Pair the Squad with an external watcher (e.g. a Solana account monitor or webhook service) on the multisig address that alerts on:
    - [ ]  Member added / removed and threshold or permission changes
    - [ ]  Config changes (time lock, spending limits) and every vault outflow
- [ ]  Route watcher alerts to a monitored team channel, not a single person's inbox
