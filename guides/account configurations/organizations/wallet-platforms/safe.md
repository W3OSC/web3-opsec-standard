<!--
id: safe-wallet-organization-configuration
type: CONFIGURATION
scope: ORGANIZATION
-->

<div align="center"> <img src="../../../../images/guides/safe.svg" alt="Safe Logo" width="64" height="64"> <h2><a href="https://app.safe.global/" target="_blank" rel="noopener noreferrer">Safe&#123;Wallet&#125;</a> Configuration Guide</h2> </div>

## Safe Setup

#### Owners & Threshold
- [ ]  Settings > Setup > Members > **3+ owners**
- [ ]  Settings > Setup > Required confirmations > **More than 50% of owners** (e.g. 2-of-3, 3-of-4, 3-of-5)
    - [ ]  Never use a **1-of-N** configuration - a single compromised key drains the Safe
- [ ]  Ensure every owner key is a **hardware wallet** (no browser-extension hot wallets, no seed phrases in password managers)
- [ ]  Ensure no two owner keys are held on the same device or by the same person via shared devices

#### Owner Hygiene
- [ ]  Address book > Add every owner address with a clear name (person + device, e.g. `alice-ledger`)
- [ ]  Settings > Setup > Members > Rename each owner so signers can verify who has confirmed a transaction

#### Chain-Specific Deployments
- [ ]  Review every chain the Safe is deployed on (switch networks in the top bar and check Settings > Setup on each)
    - [ ]  Confirm the owner set and threshold match on every chain - same address does not mean same owners
    - [ ]  Do not send funds to the Safe address on chains where it has not been deployed and verified

## Security Settings

#### Spending Limits
- [ ]  Settings > Spending limits > Review all spending limits and remove any unnecessary
    - [ ]  Only use spending limits for defined, low-value operational allowances (they let a single beneficiary bypass the threshold)
    - [ ]  Set a **reset period** on every spending limit rather than a one-time unlimited allowance

#### Transaction Guard
- [ ]  Settings > Setup > Transaction guard > Review the configured guard
    - [ ]  Only use **audited** guard contracts - a malicious guard can block all transactions and brick the Safe

#### Fallback Handler
- [ ]  Settings > Setup > Fallback handler > Verify it is the official Safe `CompatibilityFallbackHandler` (or intentionally **empty**)

#### Modules
- [ ]  Settings > Modules > Review all enabled modules and **remove any unknown modules** immediately
    - [ ]  Modules can execute transactions **without any owner signatures** - treat an unrecognized module as an active compromise

## Signing Policy

- [ ]  Require every signer to run the built-in **transaction simulation** before signing; failed or skipped simulations are a blocker
- [ ]  Require every signer to verify the **safeTxHash** shown on their hardware wallet screen against the hash shown in Safe&#123;Wallet&#125; before approving
- [ ]  Treat any **delegatecall** warning as a blocker - do not sign unless the target is a known, audited contract (e.g. the official MultiSend) and the operation was expected
- [ ]  Verify recipient address, amount, and network on the hardware device screen, not only in the browser

## Notifications & Monitoring

- [ ]  Settings > Notifications > Push notifications > **On** for every owner (confirmation requests, queued and executed transactions)
- [ ]  Enable email notifications for queued transactions where available so no owner signs from a chat-link prompt alone
- [ ]  Pair the Safe with an external watcher (e.g. **Tenderly alerts** or equivalent) that alerts on:
    - [ ]  `AddedOwner` / `RemovedOwner` / `ChangedThreshold` events
    - [ ]  `EnabledModule` / `DisabledModule` and guard changes
- [ ]  Route watcher alerts to a monitored team channel, not a single person's inbox

## Access Hygiene

- [ ]  Bookmark **https://app.safe.global/** and access the Safe only via the bookmark
    - [ ]  Never follow "Safe" links from emails, Discord, Telegram, or search ads - verify the domain character-by-character
- [ ]  WalletConnect (top bar) > Review connected sessions and disconnect any unused or unrecognized dApps
- [ ]  Settings > Safe Apps > Review custom apps and remove any that are unused or unofficial

## Recovery & Continuity

- [ ]  Document the full owner set, threshold, and chain deployments in the organization's key registry
- [ ]  Test the owner-rotation procedure (swap out one owner) at least once so key replacement is routine before it is urgent
- [ ]  Address book > Export > Back up the address book CSV to secure organization storage
- [ ]  Define and document the response runbook for a compromised owner key (rotate the owner immediately; the threshold buys time, not immunity)
