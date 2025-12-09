# Domain 4: DevOps & Infrastructure

## Risks

- R-DI-001: Compromised Development Environments
- R-DI-002: Insecure Cloud Configurations
- R-DI-003: Supply Chain Attacks Through Dependencies
- R-DI-004: Privileged Access Abuse
- R-DI-005: CI/CD Pipeline Manipulation
- R-DI-006: Infrastructure Secrets Exposure
- R-DI-007: Malware Infection in Trusted Code
- R-DI-008: Impersonated Code Commits
- R-DI-009: Forced Manual Deployments
- R-DI-010: Compromised Software Dependencies and Packages
- R-DI-011: Typosquatting and Package Name Confusion Attacks
- R-DI-012: Malicious or Compromised Development Tools
- R-DI-013: Cloud Service Provider Security Failures
- R-DI-014: Malicious Code Injection by Trusted Contributors

### **Development Environment Security**

**SP-DI-001: Isolated Development Environments**
- Development activities should be performed in containerized or virtualized environments
- Each code repo should have its own isolated environment to prevent cross contamination
- Code execution must be sandboxed to prevent host system compromise and malware infection

**SP-DI-002: IDE Plugin Security**
- IDE extensions and plugins must be thoroughly vetted before installation
- Extensions must be obtained only from official repositories (e.g. VS Code Marketplace)
- AI-powered extensions that process code should be restricted to approved providers only
- Regular reviews of installed extensions must be performed to identify unused or unrecognized plugins

### **Source Code Management**

**SP-DI-003: Repository Security Controls**
- All source code repos must be private by default
- Branch protection rules must be enabled for main/production branches to prevent forced merges
- Signed commits must be required for all code changes
- At least two-person approval must be required for pull requests to protected branches

**SP-DI-004: Source Code Secret Scanning**
- Source code must be continuously scanned for accidentally committed secrets
- Pre-commit hooks should be used by all developers to prevent accidentally committing secrets

**SP-DI-005: Package Verification and Integrity**
- All software packages must be verified for authenticity before installation
- Packages must be obtained from official repositories and trusted mirrors only
- Private package repositories should be used for internal dependencies
- Package integrity monitoring should detect tampering or modification

**SP-DI-006: Typosquatting Detection and Prevention**
- Package names should be verified against known typosquatting patterns before installation
- Visual verification techniques must be used to detect character substitution attacks:
  - Copy package names into code blocks to display in monospace font for character verification
  - Use monospace fonts (Consolas, Monaco, Courier New) that clearly distinguish similar characters
  - Compare package names character-by-character against official documentation
- Automated typosquatting detection tools should be integrated into package management workflows

**SP-DI-007: Dependency Management and Scanning**
- All dependencies must be scanned for known vulnerabilities before deployment
- Dependency version pinning must be used to prevent automatic updates to compromised versions
- Regular dependency audits must be used to identify outdated or vulnerable components
- Package versions should be at least 6 months old and have balanced usage metrics
- The changelog of individual dependencies and versions should be reviewed for alignment to expected functionality

**SP-DI-008: Enhanced Code Review for External Contributors**
- Require additional approvers for all code contributions from external collaborators
- Track code contributions and flag unexpected code changes (e.g. commit rewrites or unprompted edits)
- Restrict privileges for external contributors to minimum necessary access

### **Developer Operations**

**SP-DI-009: Secure Secrets Storage**
- Secrets must not be stored in source code or configuration files unless encrypted
- Dedicated secrets management systems must be used for production secrets
- Production secrets should not be accessible by humans

**SP-DI-010: Pipeline Access Controls**
- Deployment pipeline modifications must require multi-party approvals
- Pipeline secrets must be managed through secure secret stores, and only accessible by system accounts
- Separate service accounts with minimal permissions must be used for pipeline execution
- Manual deployment steps and permissions for humans must not be allowed

### **Infrastructure**

**SP-DI-011: Infrastructure as Code (IaC)**
- All infrastructure must be defined and managed through code
- IaC definitions must be automatically deployed, with no manual steps or permissions required for humans
- Infrastructure changes must go through a multi-party approval process
- IaC security scanning must be performed before deployment using automated tools

**SP-DI-012: Infrastructure Access Controls**
- Infrastructure access must use individual (non-shared) accounts with multi-factor authentication
- Privileged access must be time-limited and require explicit team approval by multiple parties
- Just-in-time (JIT) access control should be implemented for privileged manual operations
- Where JIT access control is not possible, auto-expiring (or planned manually revoked) credentials should be used
- All access activities must be fully logged and monitored in redundant, immutable channels

**SP-DI-013: Break-Glass Accounts**
- Break-glass procedures should be established for emergency access to infrastructure and deployments
- Emergency access to these accounts must be monitored and fully audited upon any usage
- Break-glass account usage must trigger immediate, immutable alerts to the entire team
- Post-incident reviews should be conducted for all break-glass usage

**SP-DI-014: Backup and Disaster Recovery**
- Critical systems should have automated backup and recovery procedures
- A disaster recovery plan should be defined
- Backup systems should be tested regularly

**SP-DI-015: Cloud Service Provider Security**
- Cloud security configurations must be continuously monitored and validated
- Cloud service provider security incident notification must be in place
- Admin actions taken with cloud systems must trigger immediate alerts
- Multi-cloud strategies should be implemented to reduce single provider dependency

### **Smart Contract Security**

**SP-DI-016: Contract State Monitoring**
- Invariant monitoring should be set up for deployed and owned smart contracts, with well-defined invariants
- Alerts for all major attack indicators should be defined, including at least:
    - Changes in ETH and applicable ERC20 balances
    - Changes in contract ownership and admin permissions
    - Usage of protected functions
- Alerts must be delivered to immutable channels that cannot be silently supressed
- Alerts and invariant monitoring should be enforced at the relayer level, blocking execution and requiring override in order to process flagged transactions
