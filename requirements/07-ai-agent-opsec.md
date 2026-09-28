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
- R-AI-009: Unpatched Agent Framework Dependencies
- R-AI-010: Unauthenticated Agent Runtime Endpoints
- R-AI-011: Persistent Agent State Exposure or Tampering
- R-AI-012: Unbounded Tool Authority in Deployed Agents
- R-AI-013: Trace and Prompt Exfiltration to Third Parties
- R-AI-014: Prompt and Trace Store Exposure
- R-AI-015: Default-Open Model Catalogue
- R-AI-016: Long-Lived Bearer Credentials for Inference
- R-AI-017: Inference Over Public Network Paths
- R-AI-018: Unlogged Inference and Unmanaged Retention
- R-AI-019: Safeguard Bypass Through Alternate Endpoints
- R-AI-020: Retrieval Corpus Exposure and Poisoning
- R-AI-021: Managed Agent Runtime Credential Exposure
- R-AI-022: Model-Initiated Retrieval as an Exfiltration Channel
- R-AI-023: Unauthenticated Self-Hosted Inference Endpoints
- R-AI-024: Untrusted Model Artifacts in the Serving Process
- R-AI-025: Unbrokered Model Access Through Shared Provider Keys
- R-AI-026: Unbounded Inference Consumption
- R-AI-027: Provider-Side Prompt Retention Outside Organization-Held Keys
- R-AI-028: Silent Model Version Drift

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

### **Deployed Agent Runtime**

**SP-AI-008: Agent Framework Supply Chain**
- Minimum versions for every agent-framework package must be taken from the advisory database and re-checked before each release
- Installs should verify package hashes, not only versions
- Archived or unmaintained framework packages must be absent from production dependency manifests
- An advisory scan against the lock file must run on every build and fail on a known vulnerability
- Packages that version independently of the core framework, including checkpointers and the tracing SDK, must be pinned explicitly
- Runtime images must be rebuilt when the runtime package publishes a security fix

**SP-AI-009: Agent Runtime Exposure**
- Every route on a deployed agent runtime must require authentication before the runtime is reachable
- API surfaces the deployment does not use, including protocol and documentation endpoints, must be disabled
- Browser origins allowed to call the agent API must be listed explicitly; wildcards must not be used
- Credentials and session headers must be excluded from request logs
- Custom routes mounted on the runtime must sit behind the same authentication as the API

**SP-AI-010: Agent State and Memory Protection**
- Checkpoint, thread and store data must be encrypted at rest with a key the organization holds
- A retention period must be set for checkpoints and store items; indefinite retention must not be the default
- Deserialization of persisted state must use an explicit allowlist; pickle and arbitrary-module fallbacks must be disabled
- Where a store namespace is a tenant boundary, isolation must be verified against the deployed store version
- Run-completion webhooks must be restricted to allow-listed domains over HTTPS, with loopback and private addresses denied

**SP-AI-011: Agent Tool Authorization Boundary**
- A tool manifest must exist for every deployed agent, naming each tool, its resource, its credential and whether its effect is reversible
- The tool manifest must be version-controlled and approved before deployment
- Tool credentials must be scoped read-only wherever the task allows
- Tools that send, delete, transfer or deploy must require human approval before execution
- The approval mechanism must not be bypassable through a synthetic tool result
- Code-execution and shell tools must run in a container with no host mounts, never on the host
- Prompts and tool definitions pulled at runtime from a public registry must be treated as executable configuration
- Only prompt and tool artifacts the organization owns may be loaded at runtime
- MCP servers reached by deployed agents must be vetted per SP-AI-002 and reached over HTTPS with explicit authentication
- MCP calls must carry the credential of the user who initiated the run rather than one shared token
- A deployed agent should have a bound on tool calls and model calls per run

**SP-AI-012: Agent Trace and Prompt Egress**
- Sending traces, prompts or tool results to an external observability service must be an explicit decision
- A runtime that enables tracing by default must have it disabled or pointed at an instance the organization governs
- Inputs and outputs must be masked or hidden before traces leave the organization's boundary
- The tracing SDK must be kept on a release whose redaction covers streamed output
- Trace volume leaving the boundary should be sampled where full traces are not required
- Outbound access from the runtime must be limited to the model endpoint, the state store, the trace destination and any documented license beacon

**SP-AI-013: Prompt and Trace Store Protection**
- Access to a prompt or trace store must be role-based, with read-only roles for anyone who only reviews
- Publishing a trace to a login-free link must be limited to named roles and reviewed on a schedule
- Traces must be masked before ingestion, and a masking failure must drop the event rather than store it unmasked
- A retention period must be set for traces and prompts; indefinite retention must not be the default
- Self-hosted stores must disable open sign-up and enforce single sign-on for corporate domains
- Secrets that hash API keys or encrypt stored credentials must be unique per environment and held in a secret manager
- Outbound targets configured by store users, such as model base URLs and webhooks, should be restricted to approved endpoints
- Only the web tier of a self-hosted store may be reachable; databases, queues and object storage must be internal

### **Managed Inference**

**SP-AI-014: Approved Model Catalogue**
- An approved list of models and Regions must be maintained, and every other model must be denied at the organization level on every platform endpoint
- Where the platform enables models by default, the deny must be in place before the first invocation, because the first call can create the subscription
- Provider marketplace subscriptions must be restricted to the approved product identifiers where the platform supports the condition
- Invocation permissions must name the approved model and routing-profile identifiers; a wildcard resource that admits every model the catalogue gains later must not be used
- Cross-Region routing must be constrained to the geographies the organization's data-residency obligations permit
- Removing a model agreement or subscription must not be recorded as blocking the model, because the next invocation can recreate it

**SP-AI-015: Inference Credential Hygiene**
- Workloads must authenticate with signed, short-lived credentials; bearer API keys may be issued only where a client cannot sign requests, consistent with SP-AI-004
- Long-term keys must carry an expiry capped by policy, and their creation must be denied at the organization level except for an approved exception list
- Bearer-token use must be denied on identities that authenticate with signed requests, on every endpoint the platform exposes
- The identity behind a long-term key must carry a policy scoped to the models, Regions and source addresses it needs, not a default managed policy
- Creation of a long-term key must be recorded in the audit trail and raise an alert
- A service-specific credential must not be issued to a human identity

**SP-AI-016: Private Inference Path**
- Inference from workloads inside the organization's network must traverse private endpoints for every endpoint surface the platform exposes
- Each private endpoint must carry a policy scoped to the actions and identities that path serves
- Invocation must be denied when the request did not arrive through an approved private endpoint, so a leaked credential is unusable from the public internet
- Customization, import and batch jobs must run inside the organization's network boundary, and the storage they read must accept traffic only from that boundary
- An endpoint carrying the platform's default full-access policy must not be recorded as a private path

**SP-AI-017: Inference Logging and Retention**
- Prompt and completion logging must be enabled on every endpoint surface in every Region; endpoints the platform cannot log must be denied or logged otherwise
- The log destination must be encrypted with an organization-held key, readable only by named security roles, and protected against deletion for the retention period
- Credentials and personal data in the log destination must be masked at every egress point, with unmasked access limited to named principals
- Data-plane events that the audit trail does not capture by default, including safeguard evaluations, agent invocations and retrievals, must be enabled
- The platform's data-retention mode must be set deliberately at every scope the platform offers and enforced by policy, not left at the platform default
- Conversation state the platform stores on the organization's behalf should be encrypted with a key the organization holds
- An API-call trail that records that an invocation happened must not be recorded as satisfying prompt and completion logging

**SP-AI-018: Inference Anomaly Detection**
- Managed threat detection must be enabled on the model platform's API activity in every Region used
- The provider's AI security posture standard must be enabled where one exists, so that configuration drift produces findings rather than one-off checks
- Bearer-token invocations by identities that should sign their requests must raise an alert
- Safeguard interventions must be alarmed per application, so that a rise in blocked prompts is investigated as a possible injection campaign
- A metric that is emitted but not alarmed must not be recorded as detection

**SP-AI-019: Enforced Safeguards**
- Every model-invoking application must have a safeguard policy covering prompt attacks at the highest strength, credential and personal-data detection, and its refused topics
- Safeguards must be published as immutable versions and referenced by version in enforcement
- Safeguards must be enforced at account or organization level for every inference path the platform supports, not supplied per request by the caller
- Safeguards shared across accounts must be scoped to the organization; a wildcard principal must not be used
- Safeguard configurations should be encrypted with a key the organization holds
- Applications that answer from a retrieved source should enable grounding and relevance checks
- A safeguard the caller can omit, tag around, or bypass through an alternate endpoint or API must not be recorded as enforced

**SP-AI-020: Knowledge Base Protection**
- Retrieval corpora must not be publicly readable, and the identities that can write to the source must be enumerated and limited
- Corpus data at rest, in transit through ingestion, and in the vector store must be encrypted with a key the organization holds
- Connector and vector-store credentials must live in a secret manager with rotation, never in configuration, consistent with SP-DI-009
- The service identity that reads the corpus must be scoped to the named source, store and knowledge base, and not shared across knowledge bases
- Vector stores must be private to the organization's network and grant access only to the retrieval service identity
- The deletion policy of a data source must remove its embeddings when the source or knowledge base is deleted
- Ingestion must be logged, so that what the assistant can answer from is a matter of record
- Read access to a corpus must not be treated as equivalent to write access when assessing exposure; poisoning needs the second, disclosure only the first

**SP-AI-021: Managed Agent Runtime Isolation**
- Managed agent runtimes, code interpreters and browsers must run in the organization's network, and creation in public network mode must be denied by policy
- Every tool gateway must require inbound authorization; gateways that authenticate without authorizing must be denied unless a policy engine or interceptor enforces access
- A runtime's execution identity must hold no more privilege than the principals allowed to invoke it, because code inside the runtime can read its credentials
- Agent sessions must expire on an idle timeout, and agent resources, memory and gateways must be encrypted with a key the organization holds
- Tool functions invoked by an agent must trust only that agent's identity, and one service identity must serve one agent, consistent with SP-AI-011
- Every agent must have a safeguard associated with it, and the platform's input-classification step must remain enabled
- Gateway and runtime invocations must be captured as audit-trail data events
- A gateway reachable without an authorizer must not be recorded as isolated

**SP-AI-022: Model-Initiated Web Retrieval**
- Model-initiated retrieval from the external web must be denied by default across the organization and enabled per identity only for a documented use case
- Where enabled, retrieval must be restricted to approved Regions and captured as audit-trail data events, because a denied fetch is otherwise invisible to the caller
- Retrieval scope must be assessed on what the model can fetch, any URL it produces, not on what the caller supplies, consistent with SP-AI-003
- A managed policy whose name says read-only must not be recorded as restricting retrieval

### **Self-Hosted Inference**

**SP-AI-023: Inference Endpoint Exposure**
- Self-hosted inference servers must bind a loopback or private interface and must not be reachable from outside the segment that serves the calling application
- Every inference endpoint must sit behind a reverse proxy that forwards only authenticated inference paths; the servers in common use leave management endpoints open
- Cross-origin access to an inference endpoint must be restricted to named origins; a wildcard origin must not be configured on servers or workstations
- Development, debugging, runtime-adapter and demo-tool endpoints must be absent from production servers, and debug request-body dumps must be off
- Inter-node, cache-transfer and internal RPC traffic must stay on an isolated segment, with a host firewall admitting only that segment, administrative access and the API port
- Per-request fan-out and media size limits must be set on every server that accepts untrusted callers
- The serving namespace must deny egress by default with named allows, admit ingress from the gateway only, and mount no API credentials
- A passthrough that forwards prompts to a third-party cloud must be disabled on servers and workstations until the organization approves that service
- Servers must run a patched release, re-checked against the public advisory databases on a schedule; an advisory with no fixed release must have a recorded mitigation
- Every server must run under explicit load, concurrency and queue ceilings, and every serving pod under memory and accelerator limits
- Accelerator nodes must be reserved for the serving workload
- Inference traffic must be encrypted in transit at the proxy or at the listener
- Server extensions must be loaded only by explicit allowlist
- Vendor telemetry must be disabled on every server
- A server-side API key that guards only some path prefixes must not be recorded as authentication for the endpoint

**SP-AI-024: Model Artifact Provenance and Format Policy**
- Servers and workstations must load models by full name from an organization-controlled registry or mirror, pinned to an immutable identifier where the server supports one
- Weight formats that can execute code on load must be denied at the server configuration; only formats that cannot execute code may be loaded
- Remote-code execution options in model loaders must be disabled on production servers
- Production servers must not pull artifacts from public hubs at runtime; the cache must be pre-populated and a loader with an offline mode run offline
- The model store and every loader cache directory must be writable only by the service account
- Server-side reads of local files and fetches of remote media must be disabled or restricted to named domains
- A vulnerability scan of an artifact must not be recorded as the gate; the format, revision and source controls are the gate

### **Model Access Governance**

**SP-AI-025: Gateway-Mediated Model Access**
- Consumers without a provider identity must reach models through a gateway the organization operates, and provider credentials must be held by the gateway alone
- Each consumer must hold its own gateway credential carrying a model allowlist, spend ceiling, rate limits and expiry; the root credential must not reach applications
- The gateway must check every model request against the consumer's allowlist, and a consumer must not be able to change its own entitlements
- The root credential must be set before the gateway is reachable; a gateway started without one may authorize every request it receives
- The root credential and the key that encrypts stored provider credentials must come from a secret manager and be unique per environment, consistent with SP-AI-013
- Management routes and the administrative interface must admit administrators only, the interface through single sign-on alone, and both must be absent from the consumer-facing listener
- Direct routes from consumer networks to provider endpoints must be denied, so that the gateway is the only egress for model traffic, consistent with SP-AI-016
- Every request must be attributed in the usage record to the consumer credential and end user, so that spend and abuse trace to an owner
- A consumer credential that admits every model, or lacks a ceiling or an expiry, must not be recorded as gateway-mediated access

**SP-AI-026: Inference Consumption Ceilings**
- Every consumer identity must carry a hard ceiling on spend or tokens that stops requests at the cap and resets on a fixed period
- Request and token rate limits must be set per consumer below the provider quota, so that one consumer cannot exhaust the allocation others share
- Where the platform allows a quota decrease, the provider-side quota must be lowered to the approved ceiling, so that the cap holds without the gateway
- Consumption must be alerted to the owning team at thresholds below the ceiling, so that the cap is reached deliberately rather than discovered
- Ceilings must be set by an administrator role; a consumer or team administrator must not be able to raise its own ceiling
- A billing budget that only notifies must not be recorded as a ceiling; a budget stops consumption only where it triggers an enforcing action

**SP-AI-027: Provider Data-Use Governance**
- For every provider in use, the organization must record whether prompts and outputs are retained, reviewed by people or shared, and for how long
- Where the data class requires it, the provider's opt-out from abuse-monitoring retention or human review must be requested and the approval held as a record
- Accepting a provider addendum that adds logging or sharing must be limited to named roles, and models it covers must stay denied until acceptance
- Prompt copies the provider keeps for abuse review must be treated as outside the organization's key boundary and listed in the data inventory
- Where the provider's opt-out removes its review, the organization's own safeguards and detection must be enforced on that path first, consistent with SP-AI-018 and SP-AI-019
- A provider's statement that prompts are not used for training must not be recorded as zero retention; abuse review, grounding and caching keep copies

**SP-AI-028: Model Version and Lifecycle Control**
- Every deployment must pin an approved model version, and automatic upgrade to a version the catalogue has not approved must be disabled
- Preview and pre-release models must be denied for production workloads by policy, because the provider may change or retire them on short notice
- Retirement dates for every catalogued model must be tracked and the replacement tested before that date, so that a forced upgrade never lands untested
- A deployment that follows the provider's default version must not be recorded as pinned; the provider changes or retires it on its own schedule
