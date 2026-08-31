<!--
id: multisig-treasury
type: GUIDE
scope: ORGANIZATION
-->

<div align="center">
  <h1>Move Treasury to a Multisig</h1>
  <p><em>No single key should control the funds</em></p>
</div>

---

## Overview

The most common catastrophic mistake in web3 is holding treasury funds in a single-key wallet (an externally owned account). A single key has no protection: if it is phished, malware-stolen, or lost, the entire balance is gone with no recovery and no second approval to stop it — the failure mode behind many of the largest treasury losses on record. This guide covers moving to a multisig and running it well.

---

## Adopt a Multisig for Treasury

### Why It's Critical

A multisig requires multiple independent signers to approve any transfer, so compromising one key is not enough to move funds. It turns a single point of failure into a set of approvals an attacker cannot forge.

### Implementation Steps

- [ ] Deploy a battle-tested multisig (e.g. a Gnosis Safe) for treasury funds.
- [ ] Choose a signer threshold that balances security and availability (e.g. 3-of-5); never use 1-of-N.
- [ ] Put each signer key on a separate hardware wallet, held by a different trusted person.
- [ ] Move treasury funds off any single-key wallet into the multisig; keep only small operational float in hot wallets.
- [ ] Document who the signers are, how to reach them, and the recovery process if a signer is unavailable.

---

## Operate It Safely

### Implementation Steps

- [ ] Verify every transaction's details on the hardware wallet screen before signing (see transaction-verification guidance).
- [ ] Review and rotate signers when team members change.
- [ ] Consider a timelock for large or sensitive operations so they are public and delayed.

---

## Notes

A multisig only helps if the signer keys are genuinely independent — different people, different hardware. Five signers on one laptop is still one point of failure.
