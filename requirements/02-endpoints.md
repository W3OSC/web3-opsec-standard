# Domain 2: Endpoint Security

## Risks

- R-EP-001: Malware Infection and Credential Theft
- R-EP-002: Physical Device Compromise
- R-EP-003: Network-Based Attacks and Lateral Movement
- R-EP-004: Social Engineering Targeting Device Users
- R-EP-005: Insider Threats and Privilege Abuse
- R-EP-006: Development Environment Compromise
- R-EP-007: Commingled Personal and Organizational data
- R-EP-008: Insecure Networks Usage
- R-EP-009: Public Credential Leakage
- R-EP-010: Malicious Browser Extensions and IDE Plugins
- R-PS-011: Unauthorized Physical Access to Privileged Devices
- R-PS-012: Visual Surveillance and Shoulder Surfing Attacks
- R-PS-013: Theft or Tampering of Privileged Devices

### **Device Management**

**SP-EP-001: Dedicated Devices**
- Each organization member must have a device dedicated to organization-related activities and work
- Devices should have biometric login options, secure boot, and support for full disk encryption
- Personal devices must never be used for work activities or have access to organization accounts

**SP-EP-002: Device Supply Chain Security**
- Dedicated devices should be procured by the organization directly from manufacturers or authorized distributors
- Hardware wallets should be purchased using pseudonyms and delivered to secure locations
- Devices must be delivered securely and inspected for tampering upon receipt
- Hardware authenticity must be verified through cryptographic attestation when available

**SP-EP-003: Device Configuration**
- Full disk encryption must be required on all organization devices
- Inactivity screen locks must be enabled, with a period of no more than 5 minutes before requiring password re-entry
- A secure DNS provider should be used (e.g. Cloudflare's [1.1.1.1](https://www.cloudflare.com/learning/dns/what-is-1.1.1.1/))
- OS and browser security updates must always be installed as soon as possible when they are available
- Users must operate with standard (non-administrative) accounts for daily activities
- Administrative privileges must only be granted on a just-in-time basis with proper approval and logging

### **Access Control**

**SP-EP-004: Secure Device Usage**
- Endpoints must implement automatic screen locks with timeout periods ≤5 minutes
- Biometric authentication should be used to prevent password leakage to cameras and onlookers when in public
- Privacy screens should be used when working in public spaces
- Trusted VPNs should be used when on any public Wi-Fi
- When traveling, an organization-managed VPN should be used to secure network traffic
- Applications must never be run with root or administrator privileges unless absolutely necessary for specific system tasks

**SP-EP-005: Home Network Security**
- Home WiFi networks should have recommended security settings:
	- A strong password (at least 20 characters)
	- Router and modem updated to the latest firmware
	- Rotated admin login credentials (not the default for the device)
	- Have a separate network for guest devices
	- Use WPA3/WPA2 encryption (AES, not TKIP)
	- Disable WPS
	- Disable remote management

### **Security Monitoring**

**SP-EP-006: Endpoint Detection and Response (EDR)**
- Organizations should deploy an EDR solution on all endpoints handling organization operations
- Managed EDR is preferred for large organizations. Self-managed is adequate with proper monitoring
- In the absence of EDR, active network monitoring (e.g. Little Snitch, Lulu, or Glasswire) must be used
- Persistence monitoring (e.g. BlockBlock) should be enabled to alert on persistent component additions

**SP-EP-007: Network Monitoring and Firewall**
- All endpoints must have active network monitoring in place
- Network monitoring tools must track outbound connections and block all traffic unless explicitly approved
- Network firewalls must be enabled

**SP-EP-008: Malware Detection**
- All organization devices should have basic antivirus software enabled (built-in OS antivirus is acceptable, but must be properly enabled without any rule exceptions)
- Antivirus software should be regularly updated as soon as new releases are available

### **Software Management**

**SP-EP-009: Browser Security and Isolation**
- Organization members should implement browser app isolation
  - Suggested set up: One browser for session-based, sensitive activities; another browser for opening links and temporary browsing
- Wallet extensions should only be used on a browser dedicated only to transacting

**SP-EP-010: Secure External File Interaction**
- Files received from outside the organization must only be opened in a secure sandbox or after being sanitized (e.g. via [Dangerzone](https://dangerzone.rocks/) or Google Docs)
- Internally shared files must be distributed via a dedicated file sharing platform (Google Drive/Docs, Dropbox, Notion, etc.), and never sent as email or DM attachments (to prevent social engineering malware delivery vectors)
- Shared links should always be manually navigated to or re-typed (to avoid homograph attacks)

**SP-EP-011: Browser Extension and Plugin Vetting**
- All browser extensions must be reviewed and approved before installation
- Extensions must be obtained only from official stores (Chrome Web Store, Firefox Add-ons, Microsoft Edge Add-ons, etc.)
- User-installed extensions (i.e. manually installed from file) must be prohibited on organization devices
- Browser extension permissions must be reviewed and minimized to necessary functions only
- Extensions with excessive permissions (read all websites, access to file system, etc.) should be avoided

### **Workspace Security**

**SP-EP-012: Secure Workspace Requirements**
- Dedicated workspace areas must be established for performing sensitive operations
- Workspaces must be positioned to prevent unauthorized visual access to screens and activities
- Privileged operations should never be performed in public spaces

**SP-EP-013: Remote Work Physical Security**
- Work areas must be isolated from common areas where visitors or family members have access
- Organizational devices and materials must be securely stored when not in use
- Privacy screens should be used on all devices to prevent visual eavesdropping when in public spaces
- Computer screens must be locked when unattended
- Biometric login and SSO should be used in public spaces to prevent password leakage