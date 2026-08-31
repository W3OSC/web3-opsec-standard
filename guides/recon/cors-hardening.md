<!--
id: cors-hardening
type: GUIDE
scope: ORGANIZATION
-->

<div align="center">
  <h1>Lock Down Your CORS Policy</h1>
  <p><em>Stop arbitrary sites from reading your app's responses</em></p>
</div>

---

## Overview

CORS (Cross-Origin Resource Sharing) controls which other websites' JavaScript is allowed to read responses from your app. A policy that reflects any origin back in `Access-Control-Allow-Origin` — especially combined with `Access-Control-Allow-Credentials: true` — lets any malicious website a logged-in user visits read their authenticated data from your app. This guide covers replacing origin reflection with a strict allow-list.

---

## Replace Origin Reflection with an Allow-List

### Why It's Critical

If your server echoes back whatever `Origin` a request carries, its CORS policy effectively trusts the entire internet. With credentials allowed, this becomes a direct cross-origin data- and session-theft primitive: an attacker's page makes authenticated requests to your API in the victim's session and reads the responses.

### Implementation Steps

- [ ] Confirm the misconfiguration: send a request with an untrusted `Origin` header and check whether it is reflected in the `Access-Control-Allow-Origin` response header.
- [ ] Replace any origin-reflection logic with a fixed allow-list of the specific trusted origins that legitimately need cross-origin access.
- [ ] Never combine a reflected or wildcard (`*`) `Access-Control-Allow-Origin` with `Access-Control-Allow-Credentials: true`.
- [ ] For public, unauthenticated APIs, a wildcard origin without credentials is acceptable — but confirm no sensitive or authenticated data is served from that origin.
- [ ] Scope allowed methods and headers to only what each endpoint needs.

---

## Notes

The dangerous combination is *reflected origin + credentials*. A static wildcard on a genuinely public, credential-free endpoint is usually fine; reflecting the caller's origin almost never is.
