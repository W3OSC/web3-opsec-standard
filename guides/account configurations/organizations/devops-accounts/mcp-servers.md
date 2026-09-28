<!--
id: mcp-servers-organization-configuration
type: CONFIGURATION
scope: ORGANIZATION
-->

<div align="center">
  <img src="../../../../images/guides/mcp-servers.svg" alt="Model Context Protocol Logo" width="64" height="64">
  <h2><a href="https://modelcontextprotocol.io/" target="_blank" rel="noopener noreferrer">MCP Server</a> Configuration Guide</h2>
  <p><em>Allowlist, Pinning, Connector and Gateway controls for the MCP servers your agents load and the MCP servers you run</em></p>
</div>

---

## How to Use This Guide

Each item states its **pass** condition, then gives **Console** (the GitHub, Cursor and JetBrains IDE Services admin pages) and **CLI** (`jq` and `yq` on each tool's managed settings file, `gh` for GitHub, `codex` for the servers Codex enables, and `curl`, `nginx`, `lsof`, `docker` and `kubectl` for the servers you run) steps to **Verify** and **Fix** it. Under CLI, **Expect** is the output that means it passes. Pick the channel you work in at the top of the guide; an item shows only the channels that can check or change the setting, and it passes only when every file, entry and server the command returns meets the condition.

#### Prerequisites

- The sections are per tool: run the ones for the agent tools your organization deploys. Deliver each tool's managed file with your device management; where another policy source replaces the file, the tool's line below says so, and the items check the value the endpoint receives.
- `jq`, and `yq` (mikefarah, a release that writes TOML) for the Codex file.
  - Fixes that change a system file need root: most write a temporary file and install it with `sudo install -m 0644`, the nginx Fixes write with `sudo tee` and `sudo sed -i`; on Windows, run them from an elevated Git Bash and drop `sudo`.
- Claude Code: set the managed-settings directory variable for your platform:
  - Linux and WSL: `export CC_DIR=/etc/claude-code`
  - macOS: `export CC_DIR="/Library/Application Support/ClaudeCode"`
  - Windows: `export CC_DIR="/c/Program Files/ClaudeCode"`
  - Items read `$CC_DIR/managed-settings.json`: keep their keys in that file and create it once as `{}` if it is absent. Claude Code merges every file in `managed-settings.d/` after it, adding their list entries and letting their values replace yours, so confirm that this prints nothing: `grep -l -E 'allowedMcpServers|allowManagedMcpServersOnly' "$CC_DIR"/managed-settings.d/*.json 2>/dev/null`
  - Where the claude.ai admin console or an MDM profile delivers Claude Code policy, that source replaces the file; run the same `jq` programs on its JSON.
- GitHub Copilot and VS Code: `export GH_CFG=<config-org>/.github-private`, the repository your enterprise selected as its Copilot configuration source, with `copilot/managed-settings.json` on its default branch (create it as `{}` first), and `gh` signed in as an account that may write it; the policy items need an enterprise owner or, for the organization policy, an organization owner.
  - Without GitHub Enterprise, deploy the same keys in the device file (`/etc/github-copilot/managed-settings.json`, `/Library/Application Support/GitHubCopilot/managed-settings.json` or `C:\Program Files\GitHubCopilot\managed-settings.json`) and run each `jq` program on that file; on Linux and macOS, Copilot CLI reads it only as a regular file, not a symbolic link, owned by root and not writable by group or others, so install it with `sudo install -m 0644` and check it with `ls -l` on the file.
  - Copilot CLI ignores the whole device file when one entry fails validation.
  - Set each key in one channel only: VS Code takes a key from the first channel that sets it (device MDM, then the repository, then the device file) and does not combine lists.
- Cursor items need a Cursor Enterprise team and an admin of it; other Cursor plans have no organization MCP control, so there the only decision is whether Cursor may run at all.
- Codex: set the requirements-file variable for your platform:
  - Linux and macOS: `export CODEX_REQ=/etc/codex/requirements.toml`
  - Windows: `export CODEX_REQ="/c/ProgramData/OpenAI/Codex/requirements.toml"`
  - Create the file once if it is absent: `sudo mkdir -p "$(dirname "$CODEX_REQ")" && sudo touch "$CODEX_REQ"`
  - Cloud-managed requirements and the macOS MDM key `requirements_toml_base64` take precedence over this file where you use them: a value there replaces this file's, and tables such as `mcp_servers` merge by key, so check those sources as well.
- JetBrains items need IDE Services with AI Enterprise and an administrator of it.
- MCP servers you run: `export MCP_HOST=<mcp-host>`, the public name of each remote MCP server.
  - The remote-server items assume nginx terminates TLS for it and forwards `/mcp` to agentgateway on `127.0.0.1:3000`, which checks tokens and forwards to the server.
  - agentgateway itself listens on port `3000` on every interface, because its binds take a port and no address: run the gateway in a container published on `127.0.0.1` as for the MCP server containers below and check it with the local-listener item's Verify on port `3000`, or close the port to other hosts with a host firewall rule for IPv4 and IPv6 (an `iptables` rule covers IPv4 only; add the same rule with `ip6tables`) and check it from another host with `curl -s -m 5 -o /dev/null -w '%{http_code}\n' http://<gateway-host-address>:3000/mcp` on each IPv4 and IPv6 address of the gateway host, an IPv6 address in brackets: it prints a code other than `000` before you add the rule and must print `000` after it; otherwise a token holder reaches the gateway directly, past nginx's checks.
  - Set `statsAddr: 127.0.0.1:15020` and `readinessAddr: 127.0.0.1:15021` under `config:` in `/etc/agentgateway/config.yaml` as well: the gateway's metrics and readiness ports also listen on every interface by default.
  - nginx items edit files under `/etc/nginx/conf.d/` and agentgateway items edit `/etc/agentgateway/config.yaml` with `yq`, whose paths assume agentgateway's `binds:` form and pick the route whose `matches` include `path: {exact: /mcp}`: if your MCP route has no `matches` or matches by prefix, first give it `matches` for `/mcp` and `/.well-known/oauth-protected-resource/mcp`, the two paths nginx forwards.
  - The first nginx item's Fix rewrites `/etc/nginx/conf.d/mcp.conf` whole and drops the lines the origin, rate-limit and log Fixes add to it: run it before them, and run them again after it.
  - On the `gateways:` and `routes:` form the vendor recommends, read `.routes[]` where an item writes `.binds[].listeners[].routes[]`, and with the top-level `mcp:` form the same policies sit under `.mcp.policies`.
  - The GitHub MCP server items assume it runs as Deployment `github-mcp-server` in one namespace: `export NS=<namespace>`.
  - Write every `kubectl set env` and `kubectl patch` change into your manifests too, so the next rollout keeps it.
- Placeholders in angle brackets are yours to fill; choose each value once per tool section, or once per server in the servers-you-run section, and use it on every line that names it.
  - In the Codex pin Fix, `<pinned-argument>` is the pinned form of the package argument: `<package>@<version>` for `npx`, `bunx` and `uvx`, `<package>==<version>` for `pipx` and after `uvx --from`, and `<image>@sha256:<digest>` for `docker`; for `uvx`, write `<version>` with three numbers, adding `.0` to a two-number release.
  - `<n>` and each `<index-of-...>` placeholder are the 0-based position of that argument in `args` or in the list the second Verify prints.
  - `<run-options>` and `<args>` are the other options and the arguments the container ran with, with each further `-p` rewritten as `-p 127.0.0.1:<host-port>:<container-port>` and without `--network host`; read them with `docker inspect <mcp-container>` before the Fix removes the container.

---

## Claude Code

- [ ] **Match Every Claude Code MCP Allowlist Entry on a Command or URL** - pass: `allowedMcpServers` in `managed-settings.json` is a list, and every entry in it is a `serverCommand` or `serverUrl` entry
  - **CLI**:
    - Verify:
      ```bash
      jq '.allowedMcpServers | if type == "array" then [.[] | select(has("serverCommand") or has("serverUrl") | not)] | length else "not set" end' "$CC_DIR/managed-settings.json"
      ```
    - Expect: `0`. With no list every server runs, and a `serverName` entry admits any server you give an approved server's name.
    - Fix:
      ```bash
      t=$(mktemp) && jq '.allowedMcpServers = ((.allowedMcpServers // []) | map(select(has("serverCommand") or has("serverUrl"))))' "$CC_DIR/managed-settings.json" > "$t" \
        && sudo install -m 0644 "$t" "$CC_DIR/managed-settings.json"
      ```

- [ ] **Restrict Claude Code to the Managed MCP Allowlist** - pass: `allowManagedMcpServersOnly` is `true` in `managed-settings.json`
  - **CLI**:
    - Verify: `jq '.allowManagedMcpServersOnly' "$CC_DIR/managed-settings.json"`
    - Expect: `true`. Otherwise an `allowedMcpServers` list in your own settings or a cloned repository's widens the allowlist to any server it names.
    - Fix:
      ```bash
      t=$(mktemp) && jq '.allowManagedMcpServersOnly = true' "$CC_DIR/managed-settings.json" > "$t" \
        && sudo install -m 0644 "$t" "$CC_DIR/managed-settings.json"
      ```

- [ ] **Allow Only Exact HTTPS URLs in the Claude Code MCP Allowlist** - pass: every `serverUrl` entry in `allowedMcpServers` starts with `https://`, or `http://127.0.0.1:` or `http://localhost:` for a local server, and has no `*` or `@` before its path
  - **CLI**:
    - Verify:
      ```bash
      jq -c '.allowedMcpServers | if type == "array" then [.[] | .serverUrl // empty | select((startswith("https://") or startswith("http://127.0.0.1:") or startswith("http://localhost:")) and (sub("^[a-z*]+://"; "") | split("/")[0] | test("[*@]") | not) | not)] else "not set" end' "$CC_DIR/managed-settings.json"
      ```
    - Expect: `[]`. A `*` or `@` before the path admits a server on a domain someone else registers, and an `http://` URL sends your token in the clear.
    - Fix:
      ```bash
      t=$(mktemp) && jq '.allowedMcpServers |= map(select((.serverUrl // null) == null or (.serverUrl | (startswith("https://") or startswith("http://127.0.0.1:") or startswith("http://localhost:")) and (sub("^[a-z*]+://"; "") | split("/")[0] | test("[*@]") | not))))' "$CC_DIR/managed-settings.json" > "$t" \
        && sudo install -m 0644 "$t" "$CC_DIR/managed-settings.json"
      ```

- [ ] **Remove Claude Code MCP Allowlist Entries That Use Variables (your environment sets them)** - pass: no `allowedMcpServers` entry in `managed-settings.json` contains `${`
  - **CLI**:
    - Verify:
      ```bash
      jq '.allowedMcpServers | if type == "array" then [.[] | tostring | select(contains("${"))] | length else "not set" end' "$CC_DIR/managed-settings.json"
      ```
    - Expect: `0`. A `${VAR}` entry expands from the environment you start Claude Code in, so you can point an approved entry at your own binary or URL.
    - Fix:
      ```bash
      t=$(mktemp) && jq '.allowedMcpServers |= map(select(tostring | contains("${") | not))' "$CC_DIR/managed-settings.json" > "$t" \
        && sudo install -m 0644 "$t" "$CC_DIR/managed-settings.json"
      ```

---

## GitHub Copilot and VS Code

- [ ] **Set the MCP Servers in Copilot Policy Explicitly for the Enterprise** - pass: the enterprise policy `MCP servers in Copilot` reads `Enabled everywhere` or `Disabled everywhere`
  - **Console**:
    - Verify: GitHub > Enterprises > <enterprise> > AI controls > MCP > `MCP servers in Copilot` shows `Enabled everywhere` or `Disabled everywhere`
    - Fix: GitHub > Enterprises > <enterprise> > AI controls > MCP > `MCP servers in Copilot` > select `Disabled everywhere`, or `Enabled everywhere` once the allowlist items below pass

- [ ] **Set the MCP Servers in Copilot Policy Explicitly for the Organization** - pass: the organization policy `MCP servers in Copilot` reads `Enabled` or `Disabled`
  - **Console**:
    - Verify: GitHub > your profile picture > Organizations > <org> > Settings > Copilot > Policies > `MCP servers in Copilot` shows `Enabled` or `Disabled`
    - Fix: GitHub > your profile picture > Organizations > <org> > Settings > Copilot > Policies > `MCP servers in Copilot` > select `Disabled`, or `Enabled` once the allowlist items below pass

- [ ] **Restrict Copilot MCP Servers to a Command and URL Allowlist** - pass: `allowedMcpServers` in the Copilot managed settings is a list, and every entry in it is a `serverCommand` or `serverUrl` entry
  - **Console**:
    - Verify: GitHub > <config-org>/.github-private > copilot > managed-settings.json > `allowedMcpServers` is present and lists only `serverCommand` and `serverUrl` entries
    - Fix: GitHub > <config-org>/.github-private > copilot > managed-settings.json > Edit file > set `allowedMcpServers` to the approved `serverCommand` and `serverUrl` entries > Commit changes... > Commit changes
  - **CLI**:
    - Verify:
      ```bash
      gh api "repos/$GH_CFG/contents/copilot/managed-settings.json" -H "Accept: application/vnd.github.raw+json" \
        | jq '.allowedMcpServers | if type == "array" then [.[] | select(has("serverCommand") or has("serverUrl") | not)] | length else "not set" end'
      ```
    - Expect: `0`. With no list every server runs, and a `serverName` entry admits any server you give an approved server's name.
    - Fix:
      ```bash
      p="repos/$GH_CFG/contents/copilot/managed-settings.json"
      gh api "$p" -H "Accept: application/vnd.github.raw+json" \
        | jq '.allowedMcpServers = ((.allowedMcpServers // []) | map(select(has("serverCommand") or has("serverUrl"))))' > managed-settings.json \
        && gh api -X PUT "$p" -f message="Allowlist MCP servers by command and URL" -f sha="$(gh api "$p" --jq .sha)" \
             -f content="$(base64 < managed-settings.json | tr -d '\n')"
      ```

- [ ] **Restrict VS Code to the Managed MCP Allowlist and Block User and Plugin MCP Servers in Copilot CLI** - pass: `allowManagedMcpServersOnly` is `true` in the Copilot managed settings
  - **Console**:
    - Verify: GitHub > <config-org>/.github-private > copilot > managed-settings.json > `allowManagedMcpServersOnly` is `true`
    - Fix: GitHub > <config-org>/.github-private > copilot > managed-settings.json > Edit file > set `"allowManagedMcpServersOnly": true`, replacing any existing value > Commit changes... > Commit changes
  - **CLI**:
    - Verify:
      ```bash
      gh api "repos/$GH_CFG/contents/copilot/managed-settings.json" -H "Accept: application/vnd.github.raw+json" \
        | jq '.allowManagedMcpServersOnly'
      ```
    - Expect: `true`. Otherwise a missing or unparsable managed allowlist leaves VS Code running every MCP server you or a repository adds.
    - Fix:
      ```bash
      p="repos/$GH_CFG/contents/copilot/managed-settings.json"
      gh api "$p" -H "Accept: application/vnd.github.raw+json" \
        | jq '.allowManagedMcpServersOnly = true' > managed-settings.json \
        && gh api -X PUT "$p" -f message="Require the managed MCP allowlist" -f sha="$(gh api "$p" --jq .sha)" \
             -f content="$(base64 < managed-settings.json | tr -d '\n')"
      ```

- [ ] **Allow Only Exact HTTPS URLs in the Copilot MCP Allowlist** - pass: every `serverUrl` entry in `allowedMcpServers` starts with `https://`, or `http://127.0.0.1:` or `http://localhost:` for a local server, and has no `*` or `@` before its path
  - **Console**:
    - Verify: GitHub > <config-org>/.github-private > copilot > managed-settings.json > every `serverUrl` in `allowedMcpServers` starts with `https://`, or `http://127.0.0.1:` or `http://localhost:` for a local server, and has no `*` or `@` before its path
    - Fix: GitHub > <config-org>/.github-private > copilot > managed-settings.json > Edit file > replace each `serverUrl` that has a `*` or `@` before its path, or `http://` for a remote host, by the exact URL > Commit changes... > Commit changes
  - **CLI**:
    - Verify:
      ```bash
      gh api "repos/$GH_CFG/contents/copilot/managed-settings.json" -H "Accept: application/vnd.github.raw+json" \
        | jq -c '.allowedMcpServers | if type == "array" then [.[] | .serverUrl // empty | select((startswith("https://") or startswith("http://127.0.0.1:") or startswith("http://localhost:")) and (sub("^[a-z*]+://"; "") | split("/")[0] | test("[*@]") | not) | not)] else "not set" end'
      ```
    - Expect: `[]`. A `*` or `@` before the path admits a server on a host someone else controls, and an `http://` URL sends your token in the clear.
    - Fix:
      ```bash
      p="repos/$GH_CFG/contents/copilot/managed-settings.json"
      gh api "$p" -H "Accept: application/vnd.github.raw+json" \
        | jq '.allowedMcpServers |= map(select((.serverUrl // null) == null or (.serverUrl | (startswith("https://") or startswith("http://127.0.0.1:") or startswith("http://localhost:")) and (sub("^[a-z*]+://"; "") | split("/")[0] | test("[*@]") | not))))' > managed-settings.json \
        && gh api -X PUT "$p" -f message="Allow only exact https MCP URLs" -f sha="$(gh api "$p" --jq .sha)" \
             -f content="$(base64 < managed-settings.json | tr -d '\n')"
      ```

- [ ] **Remove Copilot MCP Allowlist Entries That Use Variables (your environment sets them)** - pass: no `allowedMcpServers` entry in the Copilot managed settings contains `$`
  - **Console**:
    - Verify: GitHub > <config-org>/.github-private > copilot > managed-settings.json > no `serverCommand` or `serverUrl` in `allowedMcpServers` contains `$`
    - Fix: GitHub > <config-org>/.github-private > copilot > managed-settings.json > Edit file > remove each entry that contains `$`, then add its literal command or URL if you still approve it > Commit changes... > Commit changes
  - **CLI**:
    - Verify:
      ```bash
      gh api "repos/$GH_CFG/contents/copilot/managed-settings.json" -H "Accept: application/vnd.github.raw+json" \
        | jq '.allowedMcpServers | if type == "array" then [.[] | tostring | select(contains("$"))] | length else "not set" end'
      ```
    - Expect: `0`. Copilot expands `$VAR` and `${VAR}` in an entry from the environment it starts in, so you can point an approved entry at your own binary or URL.
    - Fix:
      ```bash
      p="repos/$GH_CFG/contents/copilot/managed-settings.json"
      gh api "$p" -H "Accept: application/vnd.github.raw+json" \
        | jq '.allowedMcpServers |= map(select(tostring | contains("$") | not))' > managed-settings.json \
        && gh api -X PUT "$p" -f message="Remove variable MCP allowlist entries" -f sha="$(gh api "$p" --jq .sha)" \
             -f content="$(base64 < managed-settings.json | tr -d '\n')"
      ```

---

## Cursor

- [ ] **Restrict Cursor MCP Servers to the Team Allowlist** - pass: the team MCP allowlist holds only command entries for approved stdio servers and URL entries for approved remote servers, and `Allow User MCP Extensions` is off
  - **Console**:
    - Verify: Cursor dashboard > Team Settings > MCP Configuration > `Allow User MCP Extensions` is off, and `MCP Allowlist` shows only the approved command and URL entries
    - Fix: Cursor dashboard > Team Settings > MCP Configuration > turn off `Allow User MCP Extensions` > MCP Allowlist > Add MCP for each approved server, as a command entry for a stdio server or a URL entry for a remote server > delete every other entry > save

- [ ] **Pin an Exact Command Line in Every Cursor MCP Command Entry** - pass: every command entry in the team MCP allowlist starts with the runner's full path, names an exact package version, and has no `*`
  - **Console**:
    - Verify: Cursor dashboard > Team Settings > MCP Configuration > MCP Allowlist > every command entry reads like `/usr/local/bin/npx -y <package>@<version>`, with the runner's full path, no `*` and no `@latest`
    - Fix: Cursor dashboard > Team Settings > MCP Configuration > edit each command entry to the runner's full path and the reviewed version, such as `/usr/local/bin/npx -y <package>@<version>`, removing every `*` > add one entry for each install path your endpoints use > save

- [ ] **Match Cursor MCP URL Entries on Exact Hosts** - pass: every URL entry in the team MCP allowlist starts with `https://`, or `http://127.0.0.1:` or `http://localhost:` for a local server, and has no `*` or `@` before its path
  - **Console**:
    - Verify: Cursor dashboard > Team Settings > MCP Configuration > MCP Allowlist > every URL entry starts with `https://`, or `http://127.0.0.1:` or `http://localhost:` for a local server, and has no `*` or `@` before its path
    - Fix: Cursor dashboard > Team Settings > MCP Configuration > MCP Allowlist > replace each URL entry that has a `*` or `@` before its path, or `http://` for a remote host, by the exact URL of the approved server: `https://<host>/<path>`, or `http://127.0.0.1:<port>/<path>` for a local server > save

---

## OpenAI Codex

- [ ] **Restrict Codex MCP Servers to Identities in requirements.toml** - pass: `requirements.toml` has an `mcp_servers` table, and every entry's `identity` is a plain-string `url` with no `command`, or a `command` table with `executable` and `args`
  - **CLI**:
    - Verify:
      ```bash
      yq -p toml -o json '.mcp_servers' "$CODEX_REQ" \
        | jq 'if type == "object" then [to_entries[] | select((.value.identity.command | type) == "string" or ((.value.identity.url | type) != "string" and ((.value.identity.command | type) != "object" or (.value.identity.command.args | type) != "array"))) | .key] else "not set" end'
      ```
    - Expect: `[]`. With no table every server runs, and a plain-string `command` such as `npx` admits every package npx can fetch.
    - Fix:
      ```bash
      t=$(mktemp) && yq -p toml -o toml 'del(.mcp_servers.<server-with-string-command>)' "$CODEX_REQ" > "$t" \
        && sudo install -m 0644 "$t" "$CODEX_REQ"
      ```
    - Fix:
      ```bash
      t=$(mktemp) && yq -p toml -o toml '.mcp_servers.<server>.identity.command = {"executable": "npx", "args": [{"match": "exact", "value": "-y"}, {"match": "exact", "value": "<package>@<version>"}]}' "$CODEX_REQ" > "$t" \
        && sudo install -m 0644 "$t" "$CODEX_REQ"
      ```
    - Fix:
      ```bash
      t=$(mktemp) && yq -p toml -o toml '.mcp_servers.<remote-server>.identity = {"url": "https://<host>/mcp"}' "$CODEX_REQ" > "$t" \
        && sudo install -m 0644 "$t" "$CODEX_REQ"
      ```

- [ ] **Pin the Package Argument of Every Codex MCP Command Identity** - pass: every `mcp_servers` command identity that runs `npx`, `bunx`, `uvx`, `pipx` or `docker` has an `exact` argument naming an exact package version, or an image digest for `docker`
  - **CLI**:
    - Verify:
      ```bash
      yq -p toml -o json '.mcp_servers' "$CODEX_REQ" \
        | jq 'if type == "object" then [.[] | .identity.command | objects | select(([.executable] + [.args[]? | .value // empty]) | any(.[]; test("(^|[/\\\\])(npx|bunx|uvx|pipx|docker)(\\.cmd|\\.exe)?$"; "i"))) | select([.args[]? | select(.match == "exact") | .value] | any(test("@[0-9]+\\.[0-9]+\\.[0-9]+[0-9A-Za-z.+-]*$|==[0-9]+(\\.[0-9]+)*[0-9A-Za-z.+-]*$|@sha256:[0-9a-f]{64}$")) | not)] | length else "not set" end'
      ```
    - Expect: `0`. A runner identity with no pinned argument admits whatever release the registry serves next, including a hijacked one.
    - Fix:
      ```bash
      t=$(mktemp) && yq -p toml -o toml '.mcp_servers.<server>.identity.command.args[<n>] = {"match": "exact", "value": "<pinned-argument>"}' "$CODEX_REQ" > "$t" \
        && sudo install -m 0644 "$t" "$CODEX_REQ"
      ```

- [ ] **Restrict the MCP Servers Bundled in Codex Plugins** - pass: `requirements.toml` has at least one `plugins.<plugin>.mcp_servers` table, and `codex mcp list --json` shows every server that is not in your approved list with `enabled` set to `false`
  - **CLI**:
    - Verify:
      ```bash
      yq -p toml -o json '.plugins' "$CODEX_REQ" | jq '[.[]? | objects | select(has("mcp_servers"))] | length'
      ```
    - Verify:
      ```bash
      codex mcp list --json | jq -r '.[] | select(.enabled) | .name'
      ```
    - Expect: at least `1` from the first command, and only the names of servers you approved from the second. A plugin's bundled server escapes a non-empty `mcp_servers` table and runs unreviewed with your credentials.
    - Fix:
      ```bash
      t=$(mktemp) && yq -p toml -o toml '.plugins."<plugin>@<marketplace>".mcp_servers.<plugin-remote-server>.identity = {"url": "https://<plugin-host>/mcp"}' "$CODEX_REQ" > "$t" \
        && sudo install -m 0644 "$t" "$CODEX_REQ"
      ```
    - Fix:
      ```bash
      t=$(mktemp) && yq -p toml -o toml '.plugins."<plugin>@<marketplace>".mcp_servers.<plugin-stdio-server>.identity.command = {"executable": "<command>", "args": [{"match": "exact", "value": "<argument>"}]}' "$CODEX_REQ" > "$t" \
        && sudo install -m 0644 "$t" "$CODEX_REQ"
      ```

- [ ] **Disable Codex App Connectors in requirements.toml (each is a remote tool outside your server review)** - pass: `features.apps` is `false` in `requirements.toml`
  - **CLI**:
    - Verify: `yq -p toml -o json '.features.apps' "$CODEX_REQ"`
    - Expect: `false`. Otherwise every connector you enable in ChatGPT reaches the session, outside the MCP identities you reviewed.
    - Fix:
      ```bash
      t=$(mktemp) && yq -p toml -o toml '.features.apps = false' "$CODEX_REQ" > "$t" \
        && sudo install -m 0644 "$t" "$CODEX_REQ"
      ```

---

## JetBrains

- [ ] **Disable Adding MCP Servers by Users in JetBrains AI Enterprise (their servers skip your reviewed list)** - pass: `Allow users to add MCP in their IDE` is off in the AI Enterprise Model Context Protocol settings
  - **Console**:
    - Verify: IDE Services > Configuration > License & Activation > AI Enterprise > Settings > Model Context Protocol > `Allow users to add MCP in their IDE` is off
    - Fix: IDE Services > Configuration > License & Activation > AI Enterprise > Settings > Model Context Protocol > turn off `Allow users to add MCP in their IDE` > Confirm > Save

---

## MCP Servers You Run

- [ ] **Publish Only the MCP Endpoint and Its Metadata Through the Proxy** - pass: nginx forwards only `/mcp` and `/.well-known/oauth-protected-resource/mcp` for `$MCP_HOST` and answers every other path with `404`
  - **CLI**:
    - Verify:
      ```bash
      for p in sse messages admin health docs; do printf '%s ' "/$p"; curl -s -o /dev/null --max-time 5 -w '%{http_code}\n' "https://$MCP_HOST/$p"; done
      ```
    - Verify: `sudo grep -c -F 'location / { return 404; }' /etc/nginx/conf.d/mcp.conf`
    - Verify:
      ```bash
      sudo grep -o 'proxy_pass' /etc/nginx/conf.d/mcp.conf | wc -l
      ```
    - Expect: five lines, each ending in `404`, then `1` and `2` from the other two commands. A path that answers `200`, `401` or `405` reaches the server, such as a deprecated SSE endpoint or an admin page you never meant to publish.
    - Fix:
      ```bash
      printf 'server { listen 443 ssl; server_name %s; ssl_certificate <cert.pem>; ssl_certificate_key <key.pem>; location = /mcp { proxy_pass http://127.0.0.1:3000; proxy_http_version 1.1; proxy_set_header Host $host; proxy_buffering off; proxy_read_timeout 3600s; } location = /.well-known/oauth-protected-resource/mcp { proxy_pass http://127.0.0.1:3000; proxy_set_header Host $host; } location / { return 404; } }\n' "$MCP_HOST" \
        | sudo tee /etc/nginx/conf.d/mcp.conf >/dev/null && sudo nginx -t && sudo nginx -s reload
      ```

- [ ] **Reject Foreign Origins at the MCP Proxy With 403** - pass: a request to `/mcp` with an `Origin` outside your allowlist gets `403`, and a request without an `Origin` still reaches the gateway
  - **CLI**:
    - Verify:
      ```bash
      curl -s -o /dev/null -w '%{http_code}\n' -X POST -H 'Origin: https://evil.example' -H 'Content-Type: application/json' -d '{}' "https://$MCP_HOST/mcp"
      ```
    - Verify:
      ```bash
      curl -s -o /dev/null -w '%{http_code}\n' -X POST -H 'Content-Type: application/json' -d '{}' "https://$MCP_HOST/mcp"
      ```
    - Expect: `403` from the first command, and from the second any status other than `403` (`401` once the gateway checks tokens). Without the check, pages on other sites can send requests to the endpoint from your users' browsers, and the specification requires a `403` for them.
    - Fix:
      ```bash
      printf 'map_hash_bucket_size 128;\nmap $http_origin $mcp_origin_ok { default 0; "" 1; "https://<app-origin>" 1; }\n' | sudo tee /etc/nginx/conf.d/mcp-origin.conf >/dev/null \
        && sudo sed -i 's|location = /mcp {|location = /mcp { if ($mcp_origin_ok = 0) { return 403; }|' /etc/nginx/conf.d/mcp.conf \
        && sudo nginx -t && sudo nginx -s reload
      ```

- [ ] **Require a Token Issued for This Server on Every MCP Request** - pass: agentgateway's `mcpAuthentication` on the `/mcp` route runs in `strict` mode with your IdP's issuer, this server's URL as the only audience and `exp` required, so a request without a token or with another service's token gets `401`
  - **CLI**:
    - Verify:
      ```bash
      curl -sS -o /dev/null -D - -X POST -H 'Content-Type: application/json' -d '{}' "https://$MCP_HOST/mcp" | grep -i -E '^(HTTP/|www-authenticate:)'
      ```
    - Verify:
      ```bash
      curl -s -o /dev/null -w '%{http_code}\n' -X POST -H 'Authorization: Bearer <token-for-another-audience>' -H 'Content-Type: application/json' -d '{}' "https://$MCP_HOST/mcp"
      ```
    - Verify:
      ```bash
      yq '.binds[].listeners[].routes[].policies.mcpAuthentication | select(.) | [.mode, .issuer, (.audiences | join(",")), ((.jwtValidationOptions.requiredClaims // ["exp"]) | join(","))] | join(" ")' /etc/agentgateway/config.yaml
      ```
    - Expect: a `401` status line with `www-authenticate: Bearer resource_metadata="https://<mcp-host>/.well-known/oauth-protected-resource/mcp"`, then `401`, then `strict <issuer> https://<mcp-host>/mcp exp`. Otherwise anyone who reaches the URL, or holds a token your IdP issued for another service, calls your tools.
    - Fix:
      ```bash
      t=$(mktemp) && yq '(.binds[].listeners[].routes[] | select(.matches[].path.exact == "/mcp") | .policies.mcpAuthentication) = {"mode": "strict", "issuer": "<issuer>", "audiences": ["https://<mcp-host>/mcp"], "jwks": {"url": "<jwks-url>"}, "resourceMetadata": {"resource": "https://<mcp-host>/mcp", "scopesSupported": ["<scope>"], "bearerMethodsSupported": ["header"]}}' /etc/agentgateway/config.yaml > "$t" \
        && sudo install -m 0644 "$t" /etc/agentgateway/config.yaml && sudo systemctl restart agentgateway
      ```

- [ ] **Publish Minimal Protected Resource Metadata for Each MCP Server** - pass: the server's protected resource metadata lists only the scopes its tools need, none of `*`, `all`, `full-access`, `<name>:*` or `offline_access`, and `header` as the only bearer method
  - **CLI**:
    - Verify:
      ```bash
      curl -sS "https://$MCP_HOST/.well-known/oauth-protected-resource/mcp" \
        | jq -c '{resource: (.resource // "MISSING"), bearer_methods_supported, scopes_supported, broad: [(.scopes_supported // [])[] | select(. == "*" or . == "all" or . == "full-access" or . == "offline_access" or endswith(":*"))]}'
      ```
    - Expect: `{"resource":"https://<mcp-host>/mcp","bearer_methods_supported":["header"],"scopes_supported":["<scope>"],"broad":[]}`, with only the scopes your tools need in `scopes_supported`. Clients request every scope listed, so a broad scope turns one stolen token into access to everything the account can do.
    - Fix:
      ```bash
      t=$(mktemp) && yq '(.binds[].listeners[].routes[].policies.mcpAuthentication | select(.) | .resourceMetadata) |= (.scopesSupported = ["<scope>"] | .bearerMethodsSupported = ["header"])' /etc/agentgateway/config.yaml > "$t" \
        && sudo install -m 0644 "$t" /etc/agentgateway/config.yaml && sudo systemctl restart agentgateway
      ```

- [ ] **Serve Each MCP Endpoint Over HTTPS Only** - pass: `https://$MCP_HOST/mcp` answers and plain `http://$MCP_HOST/mcp` gets no HTTP response
  - **CLI**:
    - Verify: `curl -s -o /dev/null -w '%{http_code}\n' -X POST "https://$MCP_HOST/mcp"`
    - Verify: `curl -s -o /dev/null -w '%{http_code}\n' --max-time 5 -X POST "http://$MCP_HOST/mcp"`
    - Expect: `401` from the first command and `000` from the second. A plaintext listener, even one that redirects, lets anyone on the network read the bearer token clients send.
    - Fix:
      ```bash
      printf 'server { listen 80; server_name %s; return 444; }\n' "$MCP_HOST" | sudo tee /etc/nginx/conf.d/mcp-plaintext.conf >/dev/null \
        && sudo nginx -t && sudo nginx -s reload
      ```

- [ ] **Rate-Limit Each MCP Endpoint per Credential at the Proxy** - pass: nginx limits `/mcp` per bearer token, or per client address without one, and answers requests over the limit with `429`
  - **CLI**:
    - Verify:
      ```bash
      curl -s -Z -o /dev/null -w '%{http_code}\n' -X POST -H 'Content-Type: application/json' -d '{}' "https://$MCP_HOST/mcp?n=[1-60]" | sort | uniq -c
      ```
    - Verify: `sudo grep -c -F 'limit_req_zone $mcp_limit_key' /etc/nginx/conf.d/mcp-ratelimit.conf`
    - Expect: a count of `429` lines above zero, then `1` from the second command. With no limit, one leaked token or a looping agent can call expensive tools as fast as the server answers.
    - Fix:
      ```bash
      printf 'map $http_authorization $mcp_limit_key { "" $binary_remote_addr; default $http_authorization; }\nlimit_req_zone $mcp_limit_key zone=mcp:10m rate=<rate>r/s;\nlimit_req_status 429;\n' \
        | sudo tee /etc/nginx/conf.d/mcp-ratelimit.conf >/dev/null \
        && sudo sed -i -e 's| limit_req zone=mcp [^;]*;||g' -e 's|location = /mcp {|location = /mcp { limit_req zone=mcp burst=<burst> nodelay;|' /etc/nginx/conf.d/mcp.conf \
        && sudo nginx -t && sudo nginx -s reload
      ```

- [ ] **Log the MCP Method and Tool Name of Every Request at the Proxy** - pass: nginx logs every `/mcp` request as JSON with the `Mcp-Method` and `Mcp-Name` headers, the protocol version, the status and a request id
  - **CLI**:
    - Verify:
      ```bash
      sudo nginx -T 2>/dev/null | grep -E 'log_format mcp|access_log /var/log/nginx/mcp_access.log'
      ```
    - Expect: a `log_format mcp` line containing `$http_mcp_method` and `$http_mcp_name`, and an `access_log /var/log/nginx/mcp_access.log mcp;` line. Without it the requests the proxy refuses itself, such as foreign origins and rate-limited floods, leave no record of the tool they targeted.
    - Fix:
      ```bash
      printf 'log_format mcp escape=json \x27{"time":"$time_iso8601","client":"$remote_addr","status":$status,"protocol_version":"$http_mcp_protocol_version","method":"$http_mcp_method","name":"$http_mcp_name","request_id":"$request_id"}\x27;\n' \
        | sudo tee /etc/nginx/conf.d/mcp-log.conf >/dev/null \
        && sudo sed -i 's|location = /mcp {|location = /mcp { access_log /var/log/nginx/mcp_access.log mcp;|' /etc/nginx/conf.d/mcp.conf \
        && sudo nginx -t && sudo nginx -s reload
      ```

- [ ] **Authorize Tools per Identity at the MCP Gateway** - pass: agentgateway's `mcpAuthorization` on the `/mcp` route has allow rules naming the tools each identity may call, so a token without a rule sees neither `tools/list` entries nor calls for other tools
  - **CLI**:
    - Verify:
      ```bash
      yq '.binds[].listeners[].routes[] | select(.matches[].path.exact == "/mcp") | .policies.mcpAuthorization.rules[] | (.allow // .)' /etc/agentgateway/config.yaml
      ```
    - Expect: one line per allow rule, each naming tools with `mcp.tool.name`, such as `mcp.tool.name == "<tool>" && jwt.sub == "<subject>"`. Without rules every caller with a valid token sees and calls every tool, including the destructive ones.
    - Fix:
      ```bash
      t=$(mktemp) && yq '(.binds[].listeners[].routes[] | select(.matches[].path.exact == "/mcp") | .policies.mcpAuthorization.rules) = [{"allow": "mcp.tool.name in [\"<read-tool>\"]"}, {"allow": "mcp.tool.name == \"<write-tool>\" && jwt.sub == \"<subject>\""}]' /etc/agentgateway/config.yaml > "$t" \
        && sudo install -m 0644 "$t" /etc/agentgateway/config.yaml && sudo systemctl restart agentgateway
      ```

- [ ] **Bind Local MCP HTTP Servers to 127.0.0.1** - pass: every MCP server that speaks HTTP on an endpoint listens only on `127.0.0.1`
  - **CLI**:
    - Verify: `sudo lsof -nP -iTCP:<port> -sTCP:LISTEN`
    - Expect: one or more lines after the header, each ending in `TCP 127.0.0.1:<port> (LISTEN)`. A server on every interface can be reached from your whole network, and one without authentication runs its tools for any caller.
    - Fix: `github-mcp-server http --port <port> --listen-host 127.0.0.1`
    - Fix: `docker mcp gateway run --transport streaming --port <port> --host 127.0.0.1`

- [ ] **Publish MCP Server Containers on 127.0.0.1 Only** - pass: every published port of every MCP server container is bound to `127.0.0.1` or `::1`, and none uses the `host` network
  - **CLI**:
    - Verify: `docker ps --format '{{.Names}}\t{{.Networks}}\t{{.Ports}}'`
    - Expect: every MCP container's line shows a network other than `host` and only `127.0.0.1:` or `[::1]:` mappings, such as `127.0.0.1:<port>-><port>/tcp`. A `0.0.0.0:` or `[::]:` mapping publishes the server to every network the host is on.
    - Fix:
      ```bash
      docker rm -f <mcp-container> && docker run -d --name <mcp-container> -p 127.0.0.1:<port>:<port> <run-options> <image> <args>
      ```

- [ ] **Run the Shared GitHub MCP Server Read-Only** - pass: `GITHUB_READ_ONLY` is `1` on the `github-mcp-server` Deployment and no `--read-only=` argument overrides it
  - **CLI**:
    - Verify:
      ```bash
      kubectl get deployment github-mcp-server -n $NS -o jsonpath='{range .spec.template.spec.containers[0].env[*]}{.name}={.value}{"\n"}{end}' | grep '^GITHUB_READ_ONLY='
      ```
    - Verify:
      ```bash
      kubectl get deployment github-mcp-server -n $NS -o jsonpath='{.spec.template.spec.containers[0].args}'
      ```
    - Expect: `GITHUB_READ_ONLY=1`, then an argument list with no `--read-only=`, which would override it. Otherwise every agent that reaches the shared server can create issues, push files and merge pull requests with the caller's token.
    - Fix: `kubectl set env deployment/github-mcp-server -n $NS GITHUB_READ_ONLY=1`
    - Fix:
      ```bash
      kubectl patch deployment github-mcp-server -n $NS --type json -p '[{"op": "remove", "path": "/spec/template/spec/containers/0/args/<index-of-read-only-arg>"}]'
      ```

- [ ] **Limit the Shared GitHub MCP Server to the Toolsets Your Agents Use** - pass: `GITHUB_TOOLSETS` on the `github-mcp-server` Deployment names only the toolsets your agents use, never `all`, and no `--toolsets` argument overrides it
  - **CLI**:
    - Verify:
      ```bash
      kubectl get deployment github-mcp-server -n $NS -o jsonpath='{range .spec.template.spec.containers[0].env[*]}{.name}={.value}{"\n"}{end}' | grep '^GITHUB_TOOLSETS='
      ```
    - Verify:
      ```bash
      kubectl get deployment github-mcp-server -n $NS -o jsonpath='{.spec.template.spec.containers[0].args}'
      ```
    - Expect: `GITHUB_TOOLSETS=<toolset>,<toolset>` without `all`, then an argument list with no `--toolsets`, which would override it. With no server-side list, any client can send `X-MCP-Toolsets: all` and switch on every toolset, admin ones included.
    - Fix: `kubectl set env deployment/github-mcp-server -n $NS GITHUB_TOOLSETS=<toolset>,<toolset>`
    - Fix:
      ```bash
      kubectl patch deployment github-mcp-server -n $NS --type json -p '[{"op": "remove", "path": "/spec/template/spec/containers/0/args/<index-of-toolsets-arg>"}]'
      ```

- [ ] **Enable Lockdown Mode on the Shared GitHub MCP Server** - pass: `GITHUB_LOCKDOWN_MODE` is `1` on the `github-mcp-server` Deployment and no `--lockdown-mode=` argument overrides it
  - **CLI**:
    - Verify:
      ```bash
      kubectl get deployment github-mcp-server -n $NS -o jsonpath='{range .spec.template.spec.containers[0].env[*]}{.name}={.value}{"\n"}{end}' | grep '^GITHUB_LOCKDOWN_MODE='
      ```
    - Verify:
      ```bash
      kubectl get deployment github-mcp-server -n $NS -o jsonpath='{.spec.template.spec.containers[0].args}'
      ```
    - Expect: `GITHUB_LOCKDOWN_MODE=1`, then an argument list with no `--lockdown-mode=`, which would override it. Otherwise issue and pull request text from outside contributors reaches your agents unfiltered, carrying prompt injection into the session.
    - Fix: `kubectl set env deployment/github-mcp-server -n $NS GITHUB_LOCKDOWN_MODE=1`
    - Fix:
      ```bash
      kubectl patch deployment github-mcp-server -n $NS --type json -p '[{"op": "remove", "path": "/spec/template/spec/containers/0/args/<index-of-lockdown-arg>"}]'
      ```
