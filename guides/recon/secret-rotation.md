<!--
id: secret-rotation
type: GUIDE
scope: ORGANIZATION
-->

<div align="center">
  <h1>Rotate Leaked Secrets and Stop the Leak</h1>
  <p><em>Treat any committed secret as already compromised</em></p>
</div>

---

## Overview

A secret committed to a repository — an API key, a token, a private key or mnemonic — must be treated as compromised the moment it lands in git history, even if the commit is later removed. Public repositories are scraped continuously by automated tools looking for exactly this. For a web3 project a committed deployer or signer key means direct, irreversible loss of funds. This guide covers rotating the secret and preventing recurrence.

---

## Rotate Immediately

### Why It's Critical

The window between a secret being pushed and being abused is often minutes. Removing the commit does not help — the value is already out. The only safe assumption is that it is compromised.

### Implementation Steps

- [ ] Rotate the exposed secret right now — revoke the old value and issue a new one.
- [ ] For an on-chain key, move funds and privileges to a new key (or multisig) that was never exposed; the leaked key can never be trusted again.
- [ ] Remove the secret from git history (e.g. `git filter-repo`) and force-push, then have collaborators re-clone.
- [ ] Review logs for use of the leaked credential during the exposure window.

---

## Prevent Recurrence

### Implementation Steps

- [ ] Move secrets into a managed secret store / environment injection, never into the repository.
- [ ] Add pre-commit secret scanning (e.g. gitleaks) so secrets are blocked before they are committed.
- [ ] Enable your platform's push protection / secret scanning on all repositories, public and private.

---

## Notes

Rotation is the whole job. Scrubbing history is good hygiene but does nothing to protect the value that already leaked — rotate first, scrub second.
