<!--
id: protonmail-individual-configuration
type: CONFIGURATION
scope: INDIVIDUAL
-->

<div align="center"> <img src="../../../../images/guides/protonmail.svg" alt="Proton Mail Logo" width="64" height="64"> <h2><a href="https://proton.me/mail" target="_blank" rel="noopener noreferrer">Proton Mail</a> Configuration Guide</h2> </div>

## Account Security

- [ ]  Settings > Account and password > **Two-factor authentication** > **Security key (FIDO2)** preferred, authenticator app otherwise
    - [ ]  Enroll **two** security keys so losing one does not lock you out
- [ ]  Use a strong, unique, password-manager-generated password (SP-GS-008)
- [ ]  Understand the two-password model if enabled: your mailbox password decrypts your mail and **cannot be recovered by Proton** if lost
- [ ]  Settings > Recovery > Store the **recovery phrase** in your password manager or on physical media
    - [ ]  Treat recovery email and recovery phone as attack surface - prefer the recovery phrase, and avoid a personal phone number where possible (SP-CS-002)
- [ ]  Enable sign-in and security event notifications

## Mailbox Hardening

- [ ]  Settings > Encryption and keys > Review your PGP key configuration and back up your private key securely
- [ ]  Understand the encryption boundary: mail between Proton accounts is end-to-end encrypted; **mail to external providers is not**, unless you use PGP with the recipient or send a password-protected message
- [ ]  Use **password-protected messages** (with the password shared out-of-band) for sensitive external correspondence
- [ ]  Settings > Email settings > **Confirm link** before opening external URLs > **On**
- [ ]  Settings > Email settings > **Block remote content / tracker protection** > **On** - prevents senders confirming you opened a message and leaking your IP
- [ ]  Import and verify PGP public keys for trusted external counterparties through a channel you already trust (SP-CS-005)

## Aliases & Address Hygiene

- [ ]  Use **hide-my-email aliases** or plus-addressing to create a distinct address per service - this compartmentalizes breaches and reveals which service leaked your address
- [ ]  Keep a **dedicated address for financial and exchange accounts** that is never published, never used for signups, and never posted publicly
- [ ]  Do not reuse your public-facing address as an account recovery address for high-value accounts
- [ ]  Review aliases periodically and disable any receiving unwanted mail (supports [Digital Footprint](../../../digital-footprint.md))

## Session Management

- [ ]  Settings > Security and privacy > **Sessions** > Review active sessions and revoke anything unrecognized or stale
- [ ]  Review authorized third-party applications and bridge/IMAP credentials; revoke unused ones
- [ ]  Log out on shared or temporary devices; never stay signed in on hardware you do not control (SP-EP-001)
- [ ]  Set a short auto-lock / session timeout on mobile clients

## Phishing Defense

- [ ]  **Proton will never ask for your password or recovery phrase by email** - treat any such request as an attack
- [ ]  Verify "security alert" and "account expiring" messages by signing in through a bookmarked URL, never via links in the message
- [ ]  Check that official Proton mail carries the verification indicator shown in the web client
- [ ]  Report phishing through the client's built-in reporting rather than forwarding it onward
