<!--
id: contract-security
type: GUIDE
scope: ORGANIZATION
-->

<div align="center">
  <h1>Secure Contract Upgradeability and Admin Keys</h1>
  <p><em>Put upgrade and owner rights behind a multisig, never a single key</em></p>
</div>

---

## Overview

An upgradeable contract is only as trustworthy as whoever controls its upgrade key. If that authority is a single externally owned account, one private key can replace the contract's entire logic with a malicious version and drain every balance it holds — the single most dangerous contract-governance mistake in web3. The same applies to privileged `owner()` powers like pause, mint, fee changes and withdrawals. This guide covers putting those rights behind proper governance.

---

## Protect the Upgrade Authority

### Why It's Critical

Whoever can push a new implementation to a proxy effectively owns the contract and everything in it. A single-key upgrade authority is a catastrophic single point of failure; a multisig with a timelock makes upgrades require multiple approvals and gives the community time to react.

### Implementation Steps

- [ ] Identify who controls upgrades for each proxy (the proxy admin, or the owner for UUPS-style proxies).
- [ ] Transfer the upgrade authority to a multisig (e.g. a Gnosis Safe) with an appropriate signer threshold and hardware-wallet signers.
- [ ] Add a timelock in front of upgrades so changes are announced and delayed, not instant and silent.
- [ ] For contracts that no longer need to change, consider making them immutable (renounce upgradeability).

---

## Protect Privileged Owner Roles

### Why It's Critical

Ownable-style privileged functions (pause, mint, set fees, withdraw) gated on a single key give an attacker who steals that key enough power to freeze, mint, or drain.

### Implementation Steps

- [ ] Transfer contract ownership / admin roles to a multisig, not an EOA.
- [ ] Scope privileged functions to the minimum necessary and document what each can do.
- [ ] Renounce ownership entirely where the privileged functions are no longer needed.
- [ ] Monitor admin/owner addresses on-chain for unexpected transactions.

---

## Notes

"Upgrade authority" (who can replace the code) and "owner" (who holds privileged functions) are often *different* accounts on the same contract — secure both. A contract can be upgradeable and Ownable at once.
