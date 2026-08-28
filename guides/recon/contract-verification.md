<!--
id: contract-verification
type: GUIDE
scope: ORGANIZATION
-->

<div align="center">
  <h1>Verify Your Contract Source</h1>
  <p><em>Let users and auditors read what you deploy</em></p>
</div>

---

## Overview

An unverified contract is a black box: users are asked to send funds to, and approve, bytecode that neither they nor independent auditors can read. Verifying your source code on block explorers is a baseline transparency and trust measure — and it makes it far easier for the community and security researchers to catch a problem before it becomes an incident. This guide covers verifying your deployed contracts.

---

## Publish and Verify Source

### Why It's Critical

Unverified contracts erode user trust and can hide malicious or buggy behaviour. Verified source lets anyone confirm the deployed bytecode matches the published code and understand exactly what the contract does.

### Implementation Steps

- [ ] Verify the source of every deployed contract on the block explorers your users rely on (Etherscan and equivalents for each chain you deploy to).
- [ ] Ensure the verified source matches the exact compiler version and settings used for deployment, so the bytecode matches.
- [ ] Verify proxy implementation contracts as well as the proxies themselves.
- [ ] Publish the source in your public repository and link it from your docs.
- [ ] Consider a public audit and publish the report alongside the verified source.

---

## Notes

Verification is transparency, not a security guarantee on its own — but an unverified contract asking users for approvals is a red flag they are right to distrust. Pair verification with an audit for anything holding real value.
