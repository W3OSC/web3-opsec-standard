<!--
id: key-ceremony-organization-guide
type: GUIDE
scope: ORGANIZATION
-->

# Key Generation Ceremony Guide

*Documented procedures for generating, backing up, and retiring high-value keys*

---

## Overview

A key is only as trustworthy as the moment it was created. If the generation environment was compromised, no amount of downstream discipline — hardware wallets, multisig thresholds, monitoring — recovers the situation, because the attacker held the key before your controls ever applied. For high-value keys (treasury signers, contract admin keys, deployer keys), generation must therefore be a **ceremony**: a scripted, witnessed, documented procedure in a controlled environment, not something an engineer does alone at their desk.

This guide provides the ceremony procedure and the backup, recovery-drill, and decommissioning operations that follow from it. It is derived from CCSS key-lifecycle practices and directly supports requirements SP-WM-020 (Key Generation Procedures), SP-WM-021 (Backup Distribution and Recovery Testing), and SP-WM-022 (Key Compromise Protocol). Device selection, seed-phrase handling rules, and backup media recommendations are covered in the [Multi-Sig Operations and Ideal Setup Guide](./multisig-ideal-setup.md); this guide covers the *process* wrapped around those tools. The ceremony overhead is proportional to key value: run the full procedure for treasury and admin keys, and a lightweight subset for low-value operational keys.

---

## Ceremony Preparation

💡 **Everything that can be decided, verified, or written down before the ceremony should be. The ceremony itself should be boring: people following a script they have already read.**

- [ ] **Assign participant roles** before the ceremony, with named individuals for each:
  - [ ] **Operator**: performs the hands-on key generation steps
  - [ ] **Witness**: independent participant who follows the script and attests each step was performed as written — must not be the operator's direct report
  - [ ] **Recorder**: maintains the ceremony log (steps completed, serial numbers, deviations)
  - [ ] **Custodians**: receive the sealed backups at the end of the ceremony and transport them to their storage locations
- [ ] **Prepare the ceremony script in advance**: a step-by-step written procedure covering every action from device unboxing to backup sealing
  - [ ] All participants review the script before the ceremony date
  - [ ] The script includes explicit abort criteria (failed device attestation, unexpected device behavior, missing participant) — aborting is a normal outcome, not a failure
- [ ] **Prepare the generation device**:
  - [ ] Use a factory-new hardware wallet purchased directly from the manufacturer, or a dedicated air-gapped machine that has never been connected to an untrusted network
  - [ ] Verify device integrity/authenticity using the manufacturer's attestation procedure before the ceremony (see device verification links in the multisig guide)
- [ ] **Control the room**:
  - [ ] Private room with no cameras, no windows overlooking work surfaces, and no unauthorized attendees
  - [ ] All phones, laptops, and smart devices not required by the script are left outside
  - [ ] Backup media (metal plates, tamper-evident bags), pens, and the printed script staged in the room beforehand
- [ ] **Schedule deliberately**: Book enough uninterrupted time that no step is rushed, and never combine multiple unrelated key ceremonies into one session
- [ ] **Dry-run the script**: Walk through the full script with a throwaway device before the real ceremony, so procedural surprises happen with a key that will never hold funds
- [ ] **Pre-stage the paperwork**: ceremony log template, custody assignment records, and tamper-evident bag serial log ready to fill in

---

## Generation Procedure

- [ ] **Verify firmware first**: Confirm the device firmware is authentic and current (manufacturer attestation check / signed firmware verification) before generating anything — record the firmware version in the ceremony log
- [ ] **Generate on-device only**: Keys must come from the device's hardware RNG or another audited, high-quality entropy source (SP-WM-020)
  - [ ] Never import a seed generated on a computer or on another device
  - [ ] Never use brain wallets, user-chosen phrases, or unaudited software RNGs
- [ ] **Use maximum-strength seeds**: 24-word seed phrases (or the device's strongest supported backup scheme)
- [ ] **No photography, no phones, no digital transcription**: The seed is written only onto the designated physical backup media, only by the operator, with the witness confirming no other copy is made
- [ ] **Record in real time**: The recorder logs each completed step as it happens — logs reconstructed after the fact defeat the purpose of attestation
- [ ] **Verify the backup immediately**: Use the device's recovery-check feature (or a wipe-and-restore on the same device) to prove the recorded seed actually restores the wallet before any funds ever depend on it
- [ ] **Verify derived addresses**: Confirm the first receiving address(es) independently on a second device or via an offline derivation tool, so the address you publish is provably derived from the seed you backed up
- [ ] **Record the result in trusted references**: Immediately add the verified addresses to the organization's address book and allowlists so downstream transaction verification has a known-good source
- [ ] **Witness attestation**: The witness signs the ceremony log attesting that every step of the script was followed, and every deviation (however minor) is recorded
- [ ] **Test with a minimal transaction**: Before transferring high value, send and recover a small test amount to prove end-to-end control of the key

### Ceremony Log Contents

The ceremony log is the artifact that makes the ceremony auditable. At minimum it records:

- [ ] Date, location, and named participants with their roles
- [ ] Device make, model, serial number, and the firmware version verified
- [ ] Script version followed, each step initialed as completed, and any deviations with justification
- [ ] Backup media created, tamper-evident bag serial numbers, and assigned custodians
- [ ] First derived address(es) verified and the verification method used
- [ ] Witness attestation signature

---

## Backup Creation & Distribution

- [ ] **Metal backup medium**: Record the seed on fireproof/corrosion-resistant metal, not paper — one metal backup per storage location
- [ ] **Apply the encryption-at-rest rule**: Follow the seed-phrase protection method from the multisig guide (passphrase, recorded shuffle, or equivalent) so a recovered plate alone cannot reconstitute the key, with the related secret stored separately in a password manager
- [ ] **Never co-locate a backup with its secret**: The passphrase/shuffle record and the seed plate must never share a storage location or a custodian
- [ ] **Seal in tamper-evident bags**:
  - [ ] Each backup sealed in a serialized tamper-evident bag during the ceremony, in view of the witness
  - [ ] Bag serial numbers recorded in the ceremony log and in the custody register
  - [ ] Tamper checks (verify seals and serials) performed on a defined schedule, at least semi-annually
- [ ] **Distribute geographically**: Store backups in at least two separate physical locations (e.g. office safe + bank safe-deposit box) such that no single fire, flood, or seizure destroys all copies
- [ ] **Assign custody explicitly**: A named custodian for each backup location, recorded in the custody register, with a documented handover procedure when custodians change roles or leave
- [ ] **Inventory annually**: Reconcile the custody register against physically sighted bags and serial numbers at least once a year, independent of recovery drills
- [ ] **Optional — Shamir sharding**: For the highest-value keys, split the secret with Shamir's Secret Sharing (N-of-M) or a device-native multi-share backup scheme, and distribute shards to independent custodians/locations
  - [ ] Ensure M minus N shard losses are tolerable and no single custodian holds enough shards to reconstruct
  - [ ] Record shard custody in the same register as whole backups

---

## Recovery Drills

💡 **An untested backup is a hope, not a control. SP-WM-021 requires recovery to be proven, not assumed.**

- [ ] **Annual restore test per critical key**: At least once a year — and after any change to backup media or storage locations — restore each critical key from its backup onto a spare, wiped device and verify the derived addresses match the production wallet
- [ ] **Two-person execution**: Every drill is executed by at least two authorized people, and the drill roster rotates so that recovery never depends on any single individual's availability
- [ ] **Drill the sharded path too**: If a key uses Shamir/multi-share backup, the drill must include gathering the threshold of shards from their real custodians, exercising the actual logistics
- [ ] **Verify custody during drills**: Confirm each custodian can physically produce their backup within the expected time — custody drift (moved offices, departed employees) is the most common silent failure
- [ ] **Time-box and measure**: Track time-to-recover against a target; if restoring a treasury key takes longer than your incident response window, the backup design needs to change
- [ ] **Document results**: Record date, participants, backup/bag serials used, elapsed time, and any problems encountered; broken seals, unreadable plates, or missing custodians are treated as incidents, not footnotes
- [ ] **Re-seal after the drill**: Any opened tamper-evident bag is replaced with a new serialized bag, and the serial log is updated during the drill, not after
- [ ] **Feed findings back**: Update the ceremony script, custody register, or storage arrangements based on drill findings, and track fixes to completion

---

## Decommissioning Keys

Keys are retired when a signer departs, a device is replaced, a key is suspected compromised, or a wallet is wound down. Retirement is a ceremony too — an unretired "old" key is a standing liability.

- [ ] **Remove on-chain authority first**: Before anything else, remove the key from all multisig quorums, revoke its roles/ownership on contracts, and remove any allowlist or module entries referencing it — verify on-chain that the removals executed
- [ ] **Migrate remaining funds**: Sweep any balance controlled by the key to its documented successor wallet, following the standard process in the [Transaction Verification Guide](./transaction-verification.md)
- [ ] **Destroy or wipe the key material**:
  - [ ] Hardware wallets: factory-reset the device in view of a witness
  - [ ] Metal/paper backups: retrieve every backup listed in the custody register and physically destroy it (cut/shred/deface beyond reconstruction), with the witness confirming each serial number
  - [ ] Shards: retrieve and destroy all shards, or enough that reconstruction is impossible
- [ ] **Reconcile the custody register**: Every backup and shard recorded at creation must be accounted for at destruction — an unaccounted backup means the key is NOT decommissioned and must be treated per the key compromise protocol (SP-WM-022)
- [ ] **Record the decommissioning**: Log date, reason, participants, on-chain removal transaction hashes, and destroyed backup serials
- [ ] **Communicate the retirement**: Notify signers, finance, and monitoring owners that the key is retired, so any future activity from its addresses is treated as hostile
- [ ] **If compromise is suspected, do not wait for ceremony formalities**: Execute the key compromise protocol immediately — pre-approved destination wallets and ready-to-propose signer replacement transactions exist precisely so this can happen within minutes
