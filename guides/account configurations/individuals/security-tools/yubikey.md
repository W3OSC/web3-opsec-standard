<!--
id: yubikey-individual-configuration
type: CONFIGURATION
scope: INDIVIDUAL
-->

<div align="center">
  <img src="../../../../images/guides/yubikey.svg" alt="YubiKey Logo" width="64" height="64">
  <h2><a href="https://www.yubico.com/" target="_blank" rel="noopener noreferrer">YubiKey</a> Configuration Guide</h2>
</div>

## Individual Security Key Setup

#### Procurement
- [ ]  Purchase only from [yubico.com](https://www.yubico.com/store/) or authorized resellers > never second-hand or from marketplace sellers
- [ ]  Verify each key is genuine at [yubico.com/genuine](https://www.yubico.com/genuine/) before registering it anywhere
- [ ]  Inspect packaging for signs of tampering on arrival

#### Initial Setup
- [ ]  Register at least **TWO** keys on every account (primary + backup) so losing one never locks you out
- [ ]  Store the backup key securely **offsite** (e.g., safe at a separate location or safety deposit box)
- [ ]  Keep an up-to-date inventory of which accounts each key is registered on > store the inventory in your password manager
- [ ]  Label or serial-record each key so you can tell primary and backup apart

#### Per-Account Registration
Register FIDO2/WebAuthn security keys (both primary and backup), then remove weaker fallback methods (SMS/TOTP) where the platform allows:
- [ ]  Google > Security > 2-Step Verification > **Add security key** > remove phone/SMS methods afterward
- [ ]  GitHub > Settings > Password and authentication > **Add security key** > remove SMS fallback
- [ ]  Password manager (1Password/Bitwarden) > Two-factor settings > **Add security key** > prefer key-only where supported
- [ ]  X/Twitter > Security > Two-factor authentication > **Security key** > disable SMS 2FA
- [ ]  Discord > My Account > **Register a security key** (note: Discord may still require TOTP as a base method)
- [ ]  Exchange accounts (Coinbase/Kraken/etc.) > Security > **Add security key** > remove SMS and, where allowed, TOTP
- [ ]  Domain registrar > Security settings > **Add security key** > remove weaker fallbacks
- [ ]  After each registration, confirm sign-in works with the key, then delete SMS/TOTP fallbacks where the platform permits

#### PIN & Interfaces
- [ ]  Set a **FIDO2 PIN** on each key using Yubico Authenticator (or OS security key settings)
- [ ]  Disable unused interfaces (e.g., **NFC** or the **OTP** slot) via Yubico Authenticator > Toggle Applications, if you do not need them
- [ ]  Keep touch-required policies enabled so no operation completes without physical presence
- [ ]  Do not write the PIN down with the key or store them together

#### Advanced Uses
- [ ]  Store TOTP codes on-key via **Yubico Authenticator** for sites that only support authenticator apps
- [ ]  Use SSH resident keys (`ssh-keygen -t ed25519-sk -O resident`) for hardware-backed SSH authentication
- [ ]  Consider OpenPGP applet for signing/encryption > set user and admin PINs away from defaults
- [ ]  If you use advanced features heavily (TOTP/SSH/PGP), keep them on a **separate key** from your daily FIDO2 sign-in key to limit blast radius

#### Loss Procedures
- [ ]  Immediately sign in to affected accounts with the **backup key**
- [ ]  Remove the lost key from **every** account listed in your inventory
- [ ]  Order a replacement key from yubico.com or an authorized reseller
- [ ]  Register the replacement everywhere and update the inventory
- [ ]  If the lost key had a FIDO2 PIN, treat exposure as low but still complete removal promptly > brute-force lockout protects credentials, not account listings
