# Domain 7: AI Agent Operational Security

## Risks

- R-AI-001: Unapproved Agent Tooling on Organization Devices
- R-AI-002: Unvetted Agent Extensions and MCP Servers
- R-AI-003: Prompt Injection via Untrusted Content
- R-AI-004: Shared Trust Boundary Between Ingestion and Privileged Access
- R-AI-005: Credential Disclosure to Third-Party Model Providers
- R-AI-006: Unscoped Credential Availability Within Agent Sessions
- R-AI-007: Indirect Production Access via Pipeline Modification
- R-AI-008: Unsupported Isolation Leading to Developer Workarounds

### **Agent Control**

**SP-AI-001: Approved Agent Tooling**
- The organization must maintain a list of agent tooling approved for use on organization devices
- Approved tooling must be enforced through the application control capability of the endpoint management or EDR deployment required by SP-EP-006, not through published expectation alone
- Introduction paths outside application control must be identified, including transient package execution, browser-based agents, and IDE-integrated agents
- Reducing the number of agents in use is the objective, as every other requirement in this domain applies only to tooling the organization configures

**SP-AI-002: Agent Extension Vetting**
- Extensions to approved agents, including MCP servers, skills, and plugins, must be vetted before use
- Vetted extensions must be distributed centrally, consistent with the browser extension controls in SP-EP-011
- User-installed agent extensions must be prohibited on organization devices
- Extension configuration files must be included in the sandbox baseline required by SP-AI-007 rather than maintained per-developer

### **Session Isolation**

**SP-AI-003: Agent Session Profiles**
- A general profile must be defined for agent work that reads untrusted content, including repository files, issues, pull request comments, dependency metadata, and web pages
- A credentialed profile must be defined for agent work touching production or privileged systems, without general outbound network read access
- Both profiles must exist as version-controlled configuration shared across the organization, not as per-developer setup
- Outbound domain allow-listing must not be recorded as satisfying this requirement, as untrusted content is hosted on allowed domains
- This requirement extends the device separation principle of SP-EP-001 to sessions within a single device

**SP-AI-004: Agent Credential Handling**
- Credentials must be supplied to agent processes by a secret manager at process start
- Credentials must not be stored in shell profiles, environment files on disk, or pasted into agent chat interfaces
- Credentials issued for agent use must be short-lived where the provider supports expiry
- Where expiry is unsupported, credentials must be scoped to the narrowest permission set the provider allows
- Client-side blocking of credential paste should be enabled where the approved agent tooling supports it

### **Production Reachability**

**SP-AI-005: Pipeline Configuration Approval**
- Modification of pipeline definitions, workflow files, and identity trust policies must require human approval through code ownership rules
- Branch protection must prevent agent-authored pipeline changes from executing with production credentials before approval
- Repository write access must be treated as production access wherever pipelines execute with production credentials

**SP-AI-006: Agent Production Reachability**
- Every path from an agent identity to a production resource must be enumerated, including repository write, pipeline execution, identity federation, and role chaining
- Paths not intended by the organization must be removed
- Restrictions on direct production access must not be recorded as mitigating where an indirect path remains open

### **Enablement**

**SP-AI-007: Published Sandbox Baseline**
- The organization must publish a reference sandbox configuration implementing SP-AI-002, SP-AI-003, and SP-AI-004
- The baseline must be audited before publication and on material change
- The baseline must be version-controlled and shared, so that developers are not required to construct isolation configurations independently
