# Contributing

We welcome contributions to help improve the W3OSS standard. Here's how to get involved.

We're actively looking for collaborators. Join the Telegram group to be a part of the discussion: https://t.me/+yhmMnY2DyNBmNDlh

## How To Propose A Change

1. Fork or clone the repo
2. Make your changes
3. Submit a PR. Include:
	- What you changed and why
	- Add your organization to the contributors section of the README in your PR
4. Admins will review and merge

## What To Add

- **Domains**:
	- OpSec is a very broad topic and new domains are welcome to be proposed. Do not add anything that pertains to written application code - W3OSS is strictly scoped to ***non-code*** security issues
- **Risks**:
	- Each domain has a set of security risks that its requirements are designed to protect against
	- Risks should have clear descriptions and be impactful to security
- **Requirements**:
	- Requirements represent the necessary security properties that an organization must meet in order to defend against the defined risks
	- These should be general approaches for mitigating risks for a domain
- **Security controls**:
	- Controls represent concrete steps that should be taken in order to satisfy a requirement
	- These should be as specific and actionable as possible (e.g. what buttons to click in settings to secure a service account)

## Style Guidelines

- Keep things simple, be concise and direct
- Controls must have a corresponding Requirement, and vice versa
- Be specific and actionable in your guidance
	- Avoid vague statements like "Monitor your network traffic": instead, elaborate on how and why to do something — for example, "Use Little Snitch on endpoints to monitor connection requests, default deny any unknown requests to prevent malware payload delivery.
- The W3OSS is focused primarily on organizational security. Content should be written such that it pertains to organizations, the risks they face, and how they can mitigate those risks at scale
	- Guidance for individuals is helpful, but must be actionable by organizations (e.g. "Undergo phishing training" is only actionable at the individual level whereas "Utilize a phishing training tracker to ensure all members have undergone required phishing training" is a control that an organization could feasibly implement and be measured against)