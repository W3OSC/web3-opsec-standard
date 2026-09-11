<!--
id: langchain-organization-configuration
type: CONFIGURATION
scope: ORGANIZATION
-->

<div align="center">
  <h2><a href="https://www.langchain.com/" target="_blank" rel="noopener noreferrer">LangChain</a> Configuration Guide</h2>
  <p><em>Supply-chain, Agent Server, Tracing, MCP and Workload-Isolation controls for LangChain and LangGraph deployments</em></p>
</div>

---

## SDK & Supply Chain

- [ ] **Upgrade Every LangChain Package to a Patched Release** — `pip install pip-audit && pip-audit -r requirements.txt --fix && pip install -r requirements.txt`; verify: `pip-audit -r requirements.txt`
- [ ] **Pin and Patch the Checkpoint and Store Packages Separately** — `pip install pip-tools && pip-compile -P langgraph-checkpoint -P langgraph-checkpoint-postgres -P langgraph-checkpoint-sqlite -o requirements.txt requirements.in && pip install -r requirements.txt`; verify: `pip show langgraph-checkpoint langgraph-checkpoint-postgres langgraph-checkpoint-sqlite`
- [ ] **Rebuild the Agent Server Image on a Patched Release** — `langgraph build --pull -t <agent-image>:<tag>`; verify: `docker run --rm <agent-image>:<tag> pip show langgraph-api`
- [ ] **Upgrade the Tracing SDK to a Patched Release** — `pip install -U langsmith`; verify: `pip show langsmith`
- [ ] **Require Package Hashes on Every Install** — `pip install pip-tools && pip-compile --generate-hashes -o requirements.txt requirements.in && pip install --require-hashes -r requirements.txt`; verify: `grep -nE "require-hashes|--hash=" requirements*.txt Dockerfile`
- [ ] **Pin langchain-community to Its Final Release and Schedule Its Removal (archived by the vendor, no further security fixes; move each integration to its partner package)** — `pip install pip-tools && pip-compile -P langchain-community -o requirements.txt requirements.in && pip install -r requirements.txt`; verify: `pip show langchain-community`
- [ ] **Uninstall langchain-experimental (archived by the vendor, no further fixes; it ships the in-process PythonREPLTool and PALChain)** — `pip uninstall -y langchain-experimental && sed -i '/^langchain-experimental/d' requirements.in requirements.txt`; verify: `pip show langchain-experimental`
- [ ] **Upgrade the JavaScript Packages to Patched Releases** — `npm audit fix`; verify: `npm audit`
- [ ] **Make the Advisory Scan Fail the Build** — `pip install pip-audit && pip-audit -r requirements.txt && npm audit --audit-level=high`

---

## Agent Security (Tools & Code Execution)

- [ ] **Set Every allow_dangerous_ Opt-In to False (each opt-in lets the agent load pickled objects or fetch arbitrary URLs)** — `sed -i -E 's/(allow_dangerous_[a-z_]+)=True/\1=False/g' $(grep -rlE "allow_dangerous_[a-z_]+=True" --include="*.py" .)`; verify: `grep -rn "allow_dangerous_" --include="*.py" .`
- [ ] **Replace In-Process Code Execution with a Container-Sandboxed Shell Tool (PythonREPLTool, PALChain and ShellTool run agent-written code inside the server process; the default host policy sandboxes nothing)** — `ShellToolMiddleware(execution_policy=DockerExecutionPolicy(image="<sandbox-image>"))`; verify: `grep -rnE "PythonREPL|PALChain|langchain_community.tools.shell|HostExecutionPolicy" --include="*.py" .`
- [ ] **Grant Tool Credentials Read-Only Access Wherever the Task Allows** — `psql -d <db> -c "CREATE ROLE agent_ro LOGIN PASSWORD '<password>'; GRANT CONNECT ON DATABASE <db> TO agent_ro; GRANT USAGE ON SCHEMA public TO agent_ro; GRANT SELECT ON ALL TABLES IN SCHEMA public TO agent_ro"`; verify: `psql -d <db> -c "SELECT has_table_privilege('agent_ro', '<table>', 'INSERT, UPDATE, DELETE')"`
- [ ] **Require Human Approval Before an Irreversible Tool Runs** — `HumanInTheLoopMiddleware(interrupt_on={"<send_or_delete_tool>": True})`; verify: `grep -rn "interrupt_on" --include="*.py" .`
- [ ] **Set Tool and Model Call Limits** — `ToolCallLimitMiddleware(run_limit=<n>), ModelCallLimitMiddleware(run_limit=<n>)`; verify: `grep -rnE "ToolCallLimitMiddleware|ModelCallLimitMiddleware" --include="*.py" .`
- [ ] **Review Every Public Prompt-Hub Pull and Replace It with a Prompt You Own** — `Client().push_prompt("<prompt-name>", object=<prompt>)`; verify: `grep -rnE "dangerously_pull_public_prompt|pull_prompt|hub.pull|pullPrompt" .`

---

## Agent Server (Authentication & Exposed Surface)

- [ ] **Configure Custom Authentication** — `jq '.auth.path = "./auth.py:auth"' langgraph.json > langgraph.json.tmp && mv langgraph.json.tmp langgraph.json`; verify: `jq '.auth.path' langgraph.json`
- [ ] **Do Not Turn Off Authentication for Studio Requests** — `jq '.auth.disable_studio_auth = false' langgraph.json > langgraph.json.tmp && mv langgraph.json.tmp langgraph.json`; verify: `jq '.auth.disable_studio_auth' langgraph.json`
- [ ] **Restrict CORS Origins to an Explicit List** — `jq '.http.cors.allow_origins = ["https://<app-origin>"]' langgraph.json > langgraph.json.tmp && mv langgraph.json.tmp langgraph.json`; verify: `jq '.http.cors.allow_origins' langgraph.json`
- [ ] **Disable Unused Endpoints** — `jq '.http += {disable_mcp:true, disable_a2a:true, disable_ui:true, disable_meta:true, disable_store:true}' langgraph.json > langgraph.json.tmp && mv langgraph.json.tmp langgraph.json`; verify: `jq '.http | {disable_mcp, disable_a2a, disable_ui, disable_meta, disable_store}' langgraph.json`
- [ ] **Enable Authentication on Custom Routes and Run It First** — `jq '.http.enable_custom_route_auth = true | .http.middleware_order = "auth_first"' langgraph.json > langgraph.json.tmp && mv langgraph.json.tmp langgraph.json`; verify: `jq '.http.enable_custom_route_auth, .http.middleware_order' langgraph.json`
- [ ] **Exclude Credentials from Header Logging** — `jq '.http.logging_headers = {excludes: ["authorization", "cookie", "x-api-key"]}' langgraph.json > langgraph.json.tmp && mv langgraph.json.tmp langgraph.json`; verify: `jq '.http.logging_headers' langgraph.json`
- [ ] **Do Not Enable the LangSmith API-Key Fallback** — `jq '.auth.allow_langsmith_api_keys = false' langgraph.json > langgraph.json.tmp && mv langgraph.json.tmp langgraph.json`; verify: `jq '.auth.allow_langsmith_api_keys' langgraph.json`

---

## Agent Server (State, Webhooks & Encryption)

- [ ] **Set Checkpoint and Store TTLs** — `jq '.checkpointer.ttl = {strategy:"delete", default_ttl:43200, sweep_interval_minutes:60} | .store.ttl = {default_ttl:43200, refresh_on_read:false, sweep_interval_minutes:60}' langgraph.json > langgraph.json.tmp && mv langgraph.json.tmp langgraph.json`; verify: `jq '.checkpointer.ttl, .store.ttl' langgraph.json`
- [ ] **Disable the Pickle Fallback and Set an Explicit JSON Module Allowlist** — `jq '.checkpointer.serde = {pickle_fallback:false, allowed_json_modules:[["<module>","<Class>"]]}' langgraph.json > langgraph.json.tmp && mv langgraph.json.tmp langgraph.json`; verify: `jq '.checkpointer.serde' langgraph.json`
- [ ] **Restrict Webhook Targets in the URL Policy** — `jq '.webhooks.url = {allowed_domains:["hooks.<your-domain>"], require_https:true, disable_private_ips:true, allowed_ports:[443]}' langgraph.json > langgraph.json.tmp && mv langgraph.json.tmp langgraph.json`; verify: `jq '.webhooks.url' langgraph.json`
- [ ] **Encrypt Checkpoints at Rest** — `kubectl create secret generic langgraph-aes -n <namespace> --from-literal=LANGGRAPH_AES_KEY=$(openssl rand -hex 16) && kubectl set env deployment/<agent-server> -n <namespace> --from=secret/langgraph-aes`; verify: `kubectl exec deployment/<agent-server> -n <namespace> -- printenv LANGGRAPH_AES_KEY | tr -d '\n' | wc -c`

---

## Tracing & Data Protection

- [ ] **Disable Tracing or Point It at an Instance You Govern** — `kubectl set env deployment/<agent-server> -n <namespace> LANGSMITH_TRACING=false`; verify: `kubectl exec deployment/<agent-server> -n <namespace> -- printenv LANGSMITH_TRACING LANGSMITH_ENDPOINT`
- [ ] **Hide Inputs and Outputs When Traces Leave the Boundary** — `kubectl set env deployment/<agent-server> -n <namespace> LANGSMITH_HIDE_INPUTS=true LANGSMITH_HIDE_OUTPUTS=true`; verify: `kubectl exec deployment/<agent-server> -n <namespace> -- printenv LANGSMITH_HIDE_INPUTS LANGSMITH_HIDE_OUTPUTS`
- [ ] **Set a Trace Sampling Rate** — `kubectl set env deployment/<agent-server> -n <namespace> LANGSMITH_TRACING_SAMPLING_RATE=0.1`; verify: `kubectl exec deployment/<agent-server> -n <namespace> -- printenv LANGSMITH_TRACING_SAMPLING_RATE`
- [ ] **Restrict Standalone-Server Egress to an Allowlist** — `kubectl patch networkpolicy <agent-egress-policy> -n <namespace> --type json -p '[{"op":"add","path":"/spec/egress/-","value":{"to":[{"ipBlock":{"cidr":"<trace-endpoint-cidr>"}}],"ports":[{"protocol":"TCP","port":443}]}}]'`; verify: `kubectl get networkpolicy -n <namespace>`

---

## MCP Servers & Tool Connections

- [ ] **Connect to MCP Servers Over HTTPS Only, with an Explicit Credential** — `MCPAdapter(Client("https://<mcp-server>/mcp", auth=<token>))`; verify: `grep -rn "http://" --include="*.py" .`
- [ ] **Require Approval for MCP Tools Annotated Destructive, Not by Tool Name** — `InterruptOnConfig(allowed_decisions=["approve", "reject"], when=needs_approval)`; verify: `grep -rnE "destructive_?[Hh]int" --include="*.py" .`
- [ ] **Send Each User's Own Credential on MCP Calls, Never One Shared Token** — `MCPAdapter(Client(CONFIG, auth=BearerAuth(token_for(user))))`; verify: `grep -rnwE "auth|headers" --include="*.py" .`

---

## Workload Isolation (Kubernetes)

- [ ] **Deny All Egress by Default and Allow Only the Model, Checkpoint and Trace Endpoints** — `kubectl apply -n <namespace> -f <agent-egress-networkpolicy>.yaml`; verify: `kubectl get networkpolicy -n <namespace> -o yaml`
- [ ] **Block the Metadata Endpoint** — `kubectl patch networkpolicy <agent-egress-policy> -n <namespace> --type json -p '[{"op":"add","path":"/spec/egress/0/to/0/ipBlock/except","value":["169.254.169.254/32"]}]'`; verify: `kubectl get networkpolicy -n <namespace> -o yaml | grep 169.254.169.254`
- [ ] **Disable Service-Account Token Automount** — `kubectl patch serviceaccount <agent-sa> -n <namespace> -p '{"automountServiceAccountToken": false}'`; verify: `kubectl get sa -n <namespace> -o jsonpath='{.items[*].automountServiceAccountToken}'`
- [ ] **Run the Agent Non-Root with a Read-Only Root Filesystem** — `kubectl patch deployment <agent-server> -n <namespace> --type json -p '[{"op":"add","path":"/spec/template/spec/securityContext","value":{"runAsNonRoot":true}},{"op":"add","path":"/spec/template/spec/containers/0/securityContext","value":{"readOnlyRootFilesystem":true,"allowPrivilegeEscalation":false}}]'`; verify: `kubectl get pod -n <namespace> -o jsonpath='{.items[*].spec.containers[*].securityContext}'`
- [ ] **Move Any Provider Key Found in the Repository or Image to a Secret Manager and Rotate It** — `kubectl create secret generic provider-keys -n <namespace> --from-literal=OPENAI_API_KEY=<rotated-key> --from-literal=LANGSMITH_API_KEY=<rotated-key> && kubectl set env deployment/<agent-server> -n <namespace> --from=secret/provider-keys`; verify: `grep -rnE "(sk-|lsv2_)[A-Za-z0-9_-]{20,}" --exclude-dir=.git .`
