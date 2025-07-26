# Domain 4: DevOps & Infrastructure

### **Development Environment Security**

**SP-DI-001: Isolated Development Environments**
- Development activities MUST be performed in containerized or virtualized environments
- Development environments MUST be isolated from production systems
- Code execution MUST be sandboxed to prevent host system compromise
- *Addresses risks: [R-DI-001: Compromised Development Environments](../risks/04-devops-infrastructure.md#r-di-001-compromised-development-environments)*
- *Implementation guidance: [C-DI-001: Development Environment Isolation](../controls/04-devops-infrastructure.md#c-di-001-development-environment-isolation)*

**SP-DI-002: Trusted Base Images and Dependencies**
- Development containers MUST be created from trusted, regularly updated base images
- All dependencies MUST be scanned for known vulnerabilities
- Software Bill of Materials (SBOM) MUST be maintained for all applications
- *Addresses risks: [R-DI-001: Compromised Development Environments](../risks/04-devops-infrastructure.md#r-di-001-compromised-development-environments), [R-DI-003: Supply Chain Attacks Through Dependencies](../risks/04-devops-infrastructure.md#r-di-003-supply-chain-attacks-through-dependencies)*
- *Implementation guidance: [C-DI-002: Trusted Base Images and Dependencies](../controls/04-devops-infrastructure.md#c-di-002-trusted-base-images-and-dependencies)*

### **Source Code Management**

**SP-DI-003: Repository Security Controls**
- All source code repositories MUST be private by default
- Branch protection rules MUST be enabled for main/production branches
- Signed commits MUST be required for all code changes
- Two-person approval MUST be required for pull requests to protected branches
- *Addresses risks: [R-DI-005: CI/CD Pipeline Manipulation](../risks/04-devops-infrastructure.md#r-di-005-cicd-pipeline-manipulation)*
- *Implementation guidance: [C-DI-003: Repository Security Controls](../controls/04-devops-infrastructure.md#c-di-003-repository-security-controls)*

**SP-DI-004: Code Security Scanning**
- Static Application Security Testing (SAST) MUST be performed on all code
- Pre-commit hooks MUST prevent secret commits
- Dependency vulnerability scanning MUST be integrated into development workflows
- Security test results MUST be tracked and remediated
- *Addresses risks: [R-DI-001: Compromised Development Environments](../risks/04-devops-infrastructure.md#r-di-001-compromised-development-environments), [R-DI-003: Supply Chain Attacks Through Dependencies](../risks/04-devops-infrastructure.md#r-di-003-supply-chain-attacks-through-dependencies), [R-DI-006: Infrastructure Secrets Exposure](../risks/04-devops-infrastructure.md#r-di-006-infrastructure-secrets-exposure)*
- *Implementation guidance: [C-DI-004: Code Security Scanning](../controls/04-devops-infrastructure.md#c-di-004-code-security-scanning)*

### **Secrets Management**

**SP-DI-005: Secure Secrets Storage**
- Secrets MUST NOT be stored in source code or configuration files
- Dedicated secrets management systems MUST be used for sensitive data
- Secrets MUST be encrypted at rest and in transit
- Access to secrets MUST be logged and audited
- *Addresses risks: [R-DI-006: Infrastructure Secrets Exposure](../risks/04-devops-infrastructure.md#r-di-006-infrastructure-secrets-exposure)*
- *Implementation guidance: [C-DI-005: Secure Secrets Storage](../controls/04-devops-infrastructure.md#c-di-005-secure-secrets-storage)*

**SP-DI-006: Secret Rotation and Lifecycle Management**
- Secrets MUST be rotated regularly and on compromise
- Secret access MUST follow principle of least privilege
- Unused secrets MUST be identified and removed
- Emergency secret rotation procedures MUST be established
- *Addresses risks: [R-DI-006: Infrastructure Secrets Exposure](../risks/04-devops-infrastructure.md#r-di-006-infrastructure-secrets-exposure)*
- *Implementation guidance: [C-DI-006: Secret Rotation and Lifecycle Management](../controls/04-devops-infrastructure.md#c-di-006-secret-rotation-and-lifecycle-management)*

### **CI/CD Pipeline Security**

**SP-DI-007: Pipeline Configuration Security**
- Pipeline configurations MUST be stored in version control
- Pipeline execution MUST be logged and auditable
- Deployment approvals MUST be required for production environments
- Build artifacts MUST be signed and verified before deployment

**SP-DI-008: Pipeline Access Controls**
- Pipeline access MUST use individual accounts with multi-factor authentication
- Pipeline secrets MUST be managed through secure secret stores
- Separate service accounts with minimal permissions MUST be used for pipeline execution
- Pipeline modifications MUST require approval and review

### **Infrastructure as Code**

**SP-DI-009: IaC Security and Compliance**
- All infrastructure MUST be defined and managed through code
- IaC templates MUST be version controlled and reviewed
- Infrastructure changes MUST go through approval processes
- IaC security scanning MUST be performed before deployment

**SP-DI-010: Infrastructure Drift Detection**
- Infrastructure drift MUST be detected and remediated
- Configuration compliance MUST be continuously monitored
- Unauthorized changes MUST be detected and alerted
- Infrastructure state MUST be regularly validated

### **Cloud Security Configuration**

**SP-DI-011: Secure Cloud Resource Configuration**
- Cloud resources MUST follow security best practices and benchmarks
- Default security groups and network ACLs MUST be restrictive
- Cloud storage MUST be encrypted and access-controlled
- Logging and monitoring MUST be enabled for all cloud resources

**SP-DI-012: Cloud Security Posture Management**
- Security configuration compliance MUST be continuously monitored
- Cloud security posture management (CSPM) tools MUST be deployed
- Security misconfigurations MUST be automatically detected and remediated
- Cloud security policies MUST be enforced and audited

### **Container Security**

**SP-DI-013: Container Image Security**
- Container images MUST be scanned for vulnerabilities before deployment
- Containers MUST run with minimal privileges and capabilities
- Container registries MUST be secured and access-controlled
- Container images MUST be signed and verified

**SP-DI-014: Runtime Container Security**
- Runtime security monitoring MUST be implemented for containers
- Container orchestration platforms MUST be securely configured
- Pod Security Standards MUST be implemented in Kubernetes
- Container network policies MUST be enforced

### **Access Management**

**SP-DI-015: Infrastructure Access Controls**
- Infrastructure access MUST use individual accounts with multi-factor authentication
- Privileged access MUST be time-limited and require approval
- Just-in-time (JIT) access MUST be implemented for privileged operations
- All access activities MUST be logged and monitored

**SP-DI-016: Break-Glass Procedures**
- Break-glass procedures MUST be established for emergency access
- Emergency access MUST be monitored and audited
- Break-glass account usage MUST trigger immediate alerts
- Post-incident reviews MUST be conducted for all break-glass usage

### **Monitoring and Logging**

**SP-DI-017: Comprehensive Infrastructure Monitoring**
- Infrastructure metrics and logs MUST be centrally collected and analyzed
- Security events MUST trigger automated alerts and responses
- Monitoring systems MUST be highly available and tamper-resistant
- Monitoring data MUST be retained according to compliance requirements

**SP-DI-018: Security Information and Event Management**
- Security Information and Event Management (SIEM) systems MUST be deployed
- Security events MUST be correlated and analyzed for threats
- Incident response MUST be integrated with monitoring and alerting
- Threat intelligence MUST be integrated into monitoring systems

### **Disaster Recovery**

**SP-DI-019: Backup and Recovery Capabilities**
- Critical systems MUST have automated backup and recovery procedures
- Recovery time objectives (RTO) and recovery point objectives (RPO) MUST be defined
- Backup systems MUST be tested regularly
- Multi-region deployments MUST be used for critical applications

**SP-DI-020: Business Continuity Planning**
- Disaster recovery plans MUST be documented and regularly tested
- Business continuity procedures MUST account for various disaster scenarios
- Alternative operational procedures MUST be established for extended outages
- Disaster recovery testing MUST be performed at least annually