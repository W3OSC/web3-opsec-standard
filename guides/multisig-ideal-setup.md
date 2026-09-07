<!--
id: multisig-ideal-setup-organization-guide
type: GUIDE
scope: ORGANIZATION
-->

<div align="center">
  <h1>Multi-Sig Wallet Security Guide</h1>
  <p><em>Platform setup, hardware wallets, transaction verification, and quorum design</em></p>
</div>

---

## Overview

Multi-sig security is defense in depth: platform choice, hardware wallets, verification discipline, isolated signing environments, and quorum design each cover for the failure of the others. Configured together, no single compromised device, person, or software component can move your assets. None of it is one-time setup — attackers constantly evolve their methods, and these layers only protect quorums that stay rigorous about maintaining them.

Every signer should also meet the baseline in the [Personal Security Checklist](individual-security.md).

---

## Multi-Sig Platform & Software Wallets

The software layer is the most exposed one — choose platforms and wallets that help you verify what you sign.

### Platform setup

- [ ] **Use a trusted multi-sig platform** — [Safe](https://safe.global/wallet) is the gold standard for multi-sig management, though any equivalent system can be used
- [ ] **Self-host the multi-sig UI** (highly recommended) — deploy from the [Safe monorepo](https://github.com/safe-global/safe-wallet-monorepo/tree/dev/apps/web); it should not be your final line of defense, but securing the UI protects your verification process from frontend supply-chain attacks

### Software wallet selection

Compare wallet security scores at [coinspect.com/wallets](https://www.coinspect.com/wallets/) before choosing.

**[Rabby](https://rabby.io/)** (recommended, open source)

- [ ] **Enable pre-sign security checks** — e.g. new-address warnings
- [ ] **Use the built-in transaction simulation** before every signature

**[MetaMask](https://metamask.io/) with security Snaps** (alternative)

- [ ] **[Wallet Guard](https://snaps.metamask.io/snap/npm/wallet-guard-snap/)** — transaction insights and security warnings
- [ ] **[Tenderly](https://snaps.metamask.io/snap/npm/tenderly/metamask-snap/)** — simulate transactions before confirming them
- [ ] **[Forta Network](https://snaps.metamask.io/snap/npm/forta-network/metamask-snap/)** — scam and malicious address detection
- [ ] **[Web3 Antivirus](https://snaps.metamask.io/snap/npm/web3-antivirus/web3-antivirus-snap/)** — alerts on known bad addresses and assets

---

## Hardware Wallets

Hardware wallets are your last line of defense: every other control in this guide could fail, and a properly used hardware wallet would still keep the keys safe.

### Selection and purchase

- [ ] **Buy directly from the manufacturer** — never a reseller; use a pseudonym and ship to a PO box or secure locker where practical
- [ ] **Require a large screen** that can display full transaction data; clear-signing support is highly recommended
- [ ] **Use touch-screen PIN entry with shuffled buttons**
- [ ] **Use at least a 6-digit PIN** — the longer the better
- [ ] **Diversify brands across the team** so a single 0-day or supply-chain compromise cannot reach a quorum of signers

Recommended devices: [Ledger Stax](https://shop.ledger.com/products/ledger-stax) · [Ledger Flex](https://shop.ledger.com/pages/ledger-flex) · [GridPlus Lattice1](https://gridplus.io/products/grid-lattice1) · [Trezor Safe 5](https://trezor.io/trezor-safe-5)

### Verification and key setup

- [ ] **Verify device integrity on receipt** — [Ledger](https://support.ledger.com/article/4404389367057-zd#h_01FPAFSEH1S9Q6B0NN21ZNKFHS) · [GridPlus](https://docs.gridplus.io/lattice1/lattice1-guides/how-to-verify-that-your-lattice1-is-authentic) · [Trezor](https://trezor.io/learn/a/authenticate-trezor-safe-5)
- [ ] **Generate new private keys on the device** — never import them from a computer or another device
- [ ] **Never let keys exist digitally** — no exports, photos, or password-manager copies of private keys or seed phrases; always use 24-word seed phrases
- [ ] **Never store seed phrases in plain text** — scramble the word order, add a 25th secret word, or require an import passphrase, with the related secret stored in a password manager
- [ ] **Treat clear signing as an aid, not a substitute** — always fully verify transactions yourself

### Backup strategy

A healthy quorum is itself a backup: signing wallets should serve no other purpose, and if a signer loses access, the quorum can vote to swap in a replacement. Individual seed backups are therefore optional for signers — provided the signing pool stays deep enough that losing several signers at once is still recoverable. Any wallet that controls assets outside a quorum must always have physical backups.

- [ ] **Use fireproof metal** as the physical backup medium
- [ ] **Store backups only in a secure location** — a physical safe or equivalent

Advanced options:

- [ ] **Shard the seed** with [Shamir's Secret Sharing](https://en.wikipedia.org/wiki/Shamir%27s_secret_sharing) (N of M shards) — see this [open-source implementation](https://github.com/privy-io/shamir-secret-sharing)
- [ ] **Use device-native multi-share backups** where available — e.g. [Trezor Multi-Share Backup](https://trezor.io/learn/a/multi-share-backup-on-trezor)
- [ ] **Distribute shards across trust boundaries** — trusted family members, bank safe-deposit boxes, hidden physical locations

---

## Contract-Level Controls

On-chain controls keep working even when every off-chain layer is compromised.

- [ ] **Enforce invariants in the contracts themselves** — expected token balance changes, ownership and administration, proxy implementation addresses — with automatic reversion when any invariant is violated
- [ ] **Add a challenge period before execution** so suspicious transactions can be caught in flight
- [ ] **Establish a veto quorum** — a smaller group, separate from the confirmation quorum, that reviews pending transactions and can block them
- [ ] **Use [Zodiac Modifier Delay](https://github.com/gnosisguild/zodiac-modifier-delay/tree/main)** or equivalent for on-chain time-locked delays on Safe wallets

---

## Transaction Verification

Verification discipline decays: processes break down over time unless they are well defined and teams stay deliberately vigilant. The tools below make rigorous verification cheap enough to sustain.

### Verify what you sign

- [ ] **Compute expected transaction hashes independently** with [Safe TX Hashes Util](https://github.com/pcaversaccio/safe-tx-hashes-util) — or the [Cyfrin fork](https://github.com/Cyfrin/safe-tx-hashes), which works without relying on the Safe API — and compare against what your hardware wallet displays
- [ ] **Decode calldata into human-readable form** with the [Swiss Knife decoder](https://calldata.swiss-knife.xyz/decoder)
- [ ] **Monitor the Safe for suspicious activity** — [Safe Watcher](https://github.com/Gearbox-protocol/safe-watcher) or equivalent, connected to Telegram and watching especially for unexpected `delegateCall` transactions
- [ ] **Firewall signing machines to known-good domains** using the [DeFi DNS whitelist](https://github.com/0xKoda/defi-dns-whitelist/tree/main)
- [ ] **Run network and persistence monitoring on signing machines** — [Little Snitch](https://www.obdev.at/products/littlesnitch/index.html) or [LuLu](https://objective-see.org/products/lulu.html) (macOS), [GlassWire](https://www.glasswire.com/) (Windows), plus [BlockBlock](https://objective-see.org/products/blockblock.html) to alert on anything installing persistence

### Multi-channel confirmation

- [ ] **Never rely on the signing machine alone** to tell you the truth about a transaction
- [ ] **Validate transaction details on at least two additional devices** — a mobile device is recommended as one of them
- [ ] **Keep the channels independent** so one compromised device cannot forge consensus

---

## Signing Environment

Isolate wallet management from everything else you do. Three tiers, strongest first:

**Air-gapped machine** (highest security)

- [ ] **Physically remove or disable the network interface**
- [ ] **Move transaction data by QR code or USB** — with strict auto-run restrictions and extra caution on any USB use

**Restricted-network machine** (balanced)

- [ ] **Enforce strict firewall rules** permitting only transaction-related traffic — active network monitoring tools make this straightforward to maintain

**Dedicated machine** (minimum requirement)

- [ ] **One laptop, used exclusively for crypto transactions** — no other activities, ever; the discipline is the control

For advanced users, SELinux or similar mandatory access controls can further restrict file system access and inter-process communication on signing machines.

---

## Wallet & Quorum Design

Minimize single points of failure in both where assets sit and who can move them.

### Wallet separation

- [ ] **Separate cold storage from hot signing wallets** — long-term holdings never share keys with day-to-day transacting
- [ ] **Split cold assets across at least 3 equally funded wallets** so no single attack can take everything in one transaction

### Quorum selection

- [ ] **Favor competent, well-vetted technical signers** who will understand full transaction details and effects
- [ ] **Use a 3-to-5 signature threshold** drawn from a pool of no more than double that — more signers is not automatically better; every signer must be highly trusted and secure. Set the threshold as high as you can tolerate
- [ ] **Diversify signer backgrounds** — developers, founders, and other trusted roles, plus external parties such as security auditors or trusted advisors
- [ ] **Distribute signers across different hardware, networks, and organizations**

### Custody options

- [ ] **Consider professional custody** — self-management is not a hard requirement; custody services whose business is securing on-chain assets (Circle, CEXs like Coinbase or Kraken, [MPC Vault](https://mpcvault.com/)) are a legitimate option
- [ ] **Consider mixing models** — in-house hot wallet management with external custody for cold storage diversifies management risk
