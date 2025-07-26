# Web3 Operational Security Standard (W3OSS)

[![Version](https://img.shields.io/badge/version-1.0.0--draft-orange.svg)](https://github.com/W3OSC/web3-opsec-standard/releases)
[![Contributions Welcome](https://img.shields.io/badge/contributions-welcome-brightgreen.svg)](CONTRIBUTING.md)

> **📢 Contributing to W3OSS**
> 
> W3OSS is an open standard developed collaboratively by the Web3 security community. Contributions by anyone are welcome.
> 
> - 📖 **Read the [Contributing Guide](CONTRIBUTING.md)** for detailed information on how to propose changes, add new domains, or improve existing content
> - 💬 **Join the [Telegram Discussion Group](https://t.me/+yhmMnY2DyNBmNDlh)** to participate in ongoing discussions and connect with other contributors
> 
> *Help build the complete operational security standard for Web3 organizations.*

View W3OSS [here](https://w3osc.github.io/web3-opsec-standard/risk-requirement-control-mapping.html).
## Overview

The Web3 Operational Security Standard (W3OSS) is an open standard that defines comprehensive security requirements for organizations operating in Web3. W3OSS provides a framework for:
- **Organizations** to measure and improve their operational security posture against Web3-specific risks
- **Auditors** to consistently and comprehensively evaluate organizational OpSec posture
- **Stakeholders** to evaluate the security maturity of Web3 organizations

## Standard Framework

W3OSS is structured around three core components for each security domain:

### 🎯 **Risks**
Each domain identifies the specific attack vectors and threats that Web3 organizations face, including their potential business impact.

### 🛡️ **Security Properties** 
Exhaustive lists of security requirements that organizations must meet to be considered secure against the listed risks. These are measurable, auditable criteria that define what "secure" means for each domain.

### ⚙️ **Controls**
Concrete implementation steps and specific configurations that organizations can leverage to fulfill the security properties. These provide actionable guidance for achieving compliance.

## Why W3OSS?

Web3 organizations face unique operational security challenges that traditional Web2 security frameworks don't adequately address:

- **Digital Asset Management**: Securing cryptocurrency wallets, multi-signature schemes, and on-chain operations
- **Decentralized Infrastructure**: Managing distributed systems, smart contracts, and blockchain interactions
- **Community-Driven Operations**: Securing social channels, governance processes, and public communications
- **Rapid Development Cycles**: Balancing security with the fast-paced nature of Web3 development

Other Web3 security standards do exist, but are not specifically focused on OpSec. W3OSS is designed to be straightforward, actionable, and dedicated to operational security to supplement traditional code audits and empower Web3 organizations to maximize their overall security posture.

## Security Domains

W3OSS is organized into five core domains, each containing specific risks, security properties, and implementation controls:

### 🔐 Domain 1: Wallet & Multi-Signature Management
**Risks**: Private key compromise, multi-signature misconfiguration, social engineering attacks targeting signers  
**Focus**: Securing digital assets, private keys, and multi-signature operations  
🎯 [Risks](risks/01-wallet-multisig.md) | 📋 [Requirements](requirements/01-wallet-multisig.md) | ⚙️ [Controls](controls/01-wallet-multisig.md)

### 🖥️ Domain 2: Endpoint Security
**Risks**: Malware infection, device compromise, network-based attacks, insider threats  
**Focus**: Security controls for devices and computing environments used in Web3 operations  
🎯 [Risks](risks/02-endpoints.md) | 📋 [Requirements](requirements/02-endpoints.md) | ⚙️ [Controls](controls/02-endpoints.md)

### 💬 Domain 3: Communications & Social Media
**Risks**: Account takeover, social engineering, phishing campaigns, information disclosure  
**Focus**: Securing organizational communications, social media presence, and community interactions  
🎯 [Risks](risks/03-communications-socials.md) | 📋 [Requirements](requirements/03-communications-socials.md) | ⚙️ [Controls](controls/03-communications-socials.md)

### ⚙️ Domain 4: DevOps & Infrastructure
**Risks**: Compromised development environments, insecure cloud configurations, supply chain attacks  
**Focus**: Security controls for development operations, cloud infrastructure, and deployment processes  
🎯 [Risks](risks/04-devops-infrastructure.md) | 📋 [Requirements](requirements/04-devops-infrastructure.md) | ⚙️ [Controls](controls/04-devops-infrastructure.md)

### 🚨 Domain 5: Incident Readiness & Response
**Risks**: Delayed incident detection, inadequate response procedures, lack of security awareness  
**Focus**: Incident response capabilities, security training, and anti-phishing measures  
🎯 [Risks](risks/05-incident-readiness.md) | 📋 [Requirements](requirements/05-incident-readiness.md) | ⚙️ [Controls](controls/05-incident-readiness.md)