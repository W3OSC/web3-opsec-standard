<!--
id: agent-skills-organization-configuration
type: CONFIGURATION
scope: ORGANIZATION
-->

<div align="center">
  <img src="../../../../images/guides/agent-skills.svg" alt="Agent Skills Logo" width="64" height="64">
  <h2>Agent Skills and Plugins Configuration Guide</h2>
  <p><em>Marketplace, Plugin, Skill, Extension and Hook controls for the coding agents on your endpoints</em></p>
</div>

---

## How to Use This Guide

Each item states its **pass** condition, then gives **Console** (the GitHub, Cursor, Devin and JetBrains IDE Services admin pages) and **CLI** (`jq` and `yq` on each tool's managed settings file and `gh` for the files your organization keeps on GitHub) steps to **Verify** and **Fix** it. Under CLI, **Expect** is the output that means it passes. Pick the channel you work in at the top of the guide; an item shows only the channels that can check or change the setting, and it passes only when every file and entry the command returns meets the condition.

#### Prerequisites

- The sections are per tool: run the ones for the agent tools your organization deploys. Deliver each tool's managed file with your device management; where another policy source replaces the file, the tool's line below says so. MCP server allowlists are in the [MCP server guide](mcp-servers.md).
- `jq`, and `yq` (mikefarah, a release that writes TOML) for the Codex file. Fixes that change a system file write a temporary file and install it root-owned with `sudo install -m 0644`; on Windows, run them from an elevated Git Bash and drop `sudo`.
- Claude Code: set the managed-settings directory variable for your platform:
  - Linux and WSL: `export CC_DIR=/etc/claude-code`
  - macOS: `export CC_DIR="/Library/Application Support/ClaudeCode"`
  - Windows: `export CC_DIR="/c/Program Files/ClaudeCode"`
  - Items read `$CC_DIR/managed-settings.json`: keep their keys in that file and create it once as `{}` if it is absent. Claude Code merges every file in `managed-settings.d/` after it - a drop-in's value replaces the file's, its list adds to the file's, and its marketplace entry replaces the one with the same name - so confirm that this prints nothing: `grep -l -E 'KnownMarketplaces|additionalMarketplaces|allowedMarketplaces|disableSideloadFlags|strictPluginOnlyCustomization|allowManagedHooksOnly|disableSkillShellExecution|syncClaudeAiPlugins|policyHelper' "$CC_DIR"/managed-settings.d/*.json 2>/dev/null`
  - Where the claude.ai admin console, an MDM profile or a `policyHelper` delivers Claude Code policy, that source replaces the file; run the same `jq` programs on its JSON, or on the `managedSettings` object the helper prints.
  - `export CC_MKT=<org>/<marketplace-repo>` names the repository that holds your plugin marketplace.
- GitHub Copilot and VS Code: `export GH_CFG=<config-org>/.github-private`, the repository your enterprise selected as its Copilot configuration source, with `copilot/managed-settings.json` on its default branch (create it as `{}` first), and `gh` signed in as an account that may write it.
  - Without GitHub Enterprise, deploy the same keys in the device file (`/etc/github-copilot/managed-settings.json`, `/Library/Application Support/GitHubCopilot/managed-settings.json` or `C:\Program Files\GitHubCopilot\managed-settings.json`) and run each `jq` program on that file; on Linux and macOS, Copilot CLI reads it only as a regular file, not a symbolic link, owned by root and not writable by group or others, so install it with `sudo install -m 0644` and check it with `ls -l` on the file.
  - Use plain values there, because Copilot CLI ignores the whole device file when one entry fails validation, and GitHub's `overridable` wrapper fails it.
  - Set each key in one channel only: VS Code takes a key from the first channel that sets it (device MDM, then the repository, then the device file) and does not combine lists.
- VS Code device policies: `export VSC_POLICY=/etc/vscode/policy.json`, the Linux policy file, holding `AllowedExtensions` as a JSON object.
  - Create it once as `{}` if it is absent (`sudo mkdir -p /etc/vscode`).
  - On Windows the same policy names are values under `HKLM\SOFTWARE\Policies\Microsoft\VSCode`, and on macOS keys of the `com.microsoft.VSCode` configuration profile; set and read them there with the same values, except that on Windows a `true` or `false` policy is a `REG_DWORD` of `1` or `0`.
- Cursor items need a Cursor team admin; items marked for Enterprise need a Cursor Enterprise team.
  - A user or project `hooks.json` `workspaceOpen` hook can still load plugin folders through its `pluginPaths` output, past `Allow Local Plugin Imports`; no Cursor setting limits a user hook, and a project hook runs in every workspace the developer trusts, which is every workspace while Workspace Trust is off, its default.
- Codex: set the requirements-file variable for your platform:
  - Linux and macOS: `export CODEX_REQ=/etc/codex/requirements.toml`
  - Windows: `export CODEX_REQ="/c/ProgramData/OpenAI/Codex/requirements.toml"`
  - Create the file once if it is absent: `sudo mkdir -p "$(dirname "$CODEX_REQ")" && sudo touch "$CODEX_REQ"`
  - Cloud-managed requirements and the macOS MDM key `requirements_toml_base64` take precedence over this file where you use them: a value there replaces this file's, and `allowed_sources` rules with other names add to this file's, so check those sources as well.
  - `export CODEX_MKT=<org>/<marketplace-repo>` names the repository that holds your Codex plugin marketplace; keep its catalog in `.agents/plugins/marketplace.json`, because the Codex items read only that file.
- Gemini CLI: set the system settings file variable for your platform, and create the file once as `{}` if it is absent:
  - Linux: `export GEMINI_SYS=/etc/gemini-cli/settings.json`
  - macOS: `export GEMINI_SYS="/Library/Application Support/GeminiCli/settings.json"`
  - Gemini CLI reads it only if the file and every folder above it are owned by root and not writable by group or others (check the file and its folder with `ls -ld "$(dirname "$GEMINI_SYS")" "$GEMINI_SYS"`; the system folders above them are root-owned 0755 on a stock system), and otherwise prints `Security Warning: Skipping system settings file`.
  - On Windows run Gemini CLI in WSL2 with the Linux path: it skips `C:\ProgramData\gemini-cli\settings.json` because standard users can write to `C:\ProgramData`, a folder above it.
  - A developer who sets `GEMINI_CLI_SYSTEM_SETTINGS_PATH` in the environment Gemini CLI starts in points it at another file, and so can the `.env` or `.gemini/.env` of a folder the developer trusts, for the settings Gemini CLI reloads during a session and for a macOS `sandbox-exec` session it relaunches.
  - A Docker, Podman or LXC sandbox session, which the developer's `--sandbox` or `GEMINI_SANDBOX` starts as readily as `tools.sandbox`, does not read this file at all: Gemini CLI relaunches inside the container without mounting it, so none of the settings the Gemini items below set is in force there.
- Devin items need a Devin Enterprise admin; JetBrains items need IDE Services with IDE Provisioner and AI Enterprise, and an administrator of it.
  - Devin's plugin governance fails open for a level whose managed manifest cannot be fetched at session start.
  - The JetBrains `All plugins` `Block (Forced)` rule applies to local IDEs only; a Remote Development IDE provisioned through Toolbox is not locked down by it.
- Placeholders in angle brackets are yours to fill; choose each value once per tool section and use it on every line that names it, except that a line you run once per plugin, extension, marketplace, rule or profile takes that one's values each time.

---

## Claude Code

- [ ] **Restrict Claude Code Plugin Marketplaces to Your Approved Sources** - pass: `strictKnownMarketplaces` in `managed-settings.json` lists only your organization's marketplace sources, each with the `ref` its `extraKnownMarketplaces` entry pins, and no `skills-dir` entry
  - **CLI**:
    - Verify:
      ```bash
      jq -c '.strictKnownMarketplaces // .allowedMarketplaces // "not set"' "$CC_DIR/managed-settings.json"
      ```
    - Expect: a list of your own sources only, each with the `ref` its `extraKnownMarketplaces` entry pins and none a `skills-dir`, `hostPattern` or `pathPattern` entry, such as `[{"source":"github","repo":"<org>/<marketplace-repo>","ref":"<tag>"}]`. `"not set"` lets you add any marketplace and install whatever hooks and servers its plugins carry.
    - Fix:
      ```bash
      t=$(mktemp) && jq '.strictKnownMarketplaces = [{"source": "github", "repo": "<org>/<marketplace-repo>", "ref": "<tag>"}]' "$CC_DIR/managed-settings.json" > "$t" \
        && sudo install -m 0644 "$t" "$CC_DIR/managed-settings.json"
      ```

- [ ] **Pin Claude Code's Managed Marketplaces to a Reviewed Tag** - pass: every `github` or `git` source in `extraKnownMarketplaces` has a `ref` naming the release tag you reviewed
  - **CLI**:
    - Verify:
      ```bash
      jq -c '.extraKnownMarketplaces // .additionalMarketplaces // {} | if length == 0 then "none registered" else [to_entries[] | select(.value.source.source == "github" or .value.source.source == "git") | {(.key): (.value.source.ref // "none")}] end' "$CC_DIR/managed-settings.json"
      ```
    - Expect: each marketplace mapped to a release tag, such as `[{"<name>":"<tag>"}]`. A marketplace with `"none"` or a branch name follows whatever is pushed to that branch.
    - Fix:
      ```bash
      t=$(mktemp) && jq '(if has("additionalMarketplaces") and (has("extraKnownMarketplaces") | not) then "additionalMarketplaces" else "extraKnownMarketplaces" end) as $k | .[$k]["<name>"].source |= ((. // {"source": "github", "repo": "<org>/<marketplace-repo>"}) + {"ref": "<tag>"})' "$CC_DIR/managed-settings.json" > "$t" \
        && sudo install -m 0644 "$t" "$CC_DIR/managed-settings.json"
      ```

- [ ] **Disable Auto-Update for Claude Code Plugin Marketplaces (updates skip your review)** - pass: every marketplace in `extraKnownMarketplaces` has `autoUpdate` set to `false`
  - **CLI**:
    - Verify:
      ```bash
      jq -c '.extraKnownMarketplaces // .additionalMarketplaces // {} | if length == 0 then "none registered" else [to_entries[] | select(.value.autoUpdate != false) | .key] end' "$CC_DIR/managed-settings.json"
      ```
    - Expect: `[]`, or `"none registered"` when the file registers no marketplace. A marketplace that updates itself installs a new plugin release on every endpoint at the next session after its owner, or whoever took over the repository, pushes it.
    - Fix:
      ```bash
      t=$(mktemp) && jq 'if has("extraKnownMarketplaces") then .extraKnownMarketplaces |= with_entries(.value.autoUpdate = false) elif has("additionalMarketplaces") then .additionalMarketplaces |= with_entries(.value.autoUpdate = false) else . end' "$CC_DIR/managed-settings.json" > "$t" \
        && sudo install -m 0644 "$t" "$CC_DIR/managed-settings.json"
      ```

- [ ] **Pin Every Plugin in Your Claude Code Marketplace to a Commit or Digest** - pass: in your marketplace's `.claude-plugin/marketplace.json`, every `github`, `url` or `git-subdir` plugin source has a `sha`, every `archive` source has a `sha256`, and no plugin uses an `npm` or `command` source
  - **CLI**:
    - Verify:
      ```bash
      gh api "repos/$CC_MKT/contents/.claude-plugin/marketplace.json?ref=<tag>" -H "Accept: application/vnd.github.raw+json" \
        | jq -c '[.plugins[] | select((.source | type) == "object") | select(((.source.source | IN("github", "url", "git-subdir")) and (.source.sha | not)) or (.source.source == "archive" and (.source.sha256 | not)) or (.source.source | IN("npm", "command"))) | .name]'
      ```
    - Expect: `[]` at the tag your managed marketplace pins; after a Fix, tag the new commit and move the managed `ref` to that tag. A plugin without a pin follows its repository's default branch, so one push there reaches every endpoint at the next update.
    - Fix:
      ```bash
      p="repos/$CC_MKT/contents/.claude-plugin/marketplace.json"
      gh api "$p" -H "Accept: application/vnd.github.raw+json" \
        | jq '(.plugins[] | select(.name == "<plugin>") | .source.sha) = "<commit-sha>"' > marketplace.json \
        && gh api -X PUT "$p" -f message="Pin <plugin> to a reviewed commit" -f sha="$(gh api "$p" --jq .sha)" \
             -f content="$(base64 < marketplace.json | tr -d '\n')"
      ```
    - Fix:
      ```bash
      p="repos/$CC_MKT/contents/.claude-plugin/marketplace.json"
      gh api "$p" -H "Accept: application/vnd.github.raw+json" \
        | jq '(.plugins[] | select(.name == "<archive-plugin>") | .source.sha256) = "<sha256>"' > marketplace.json \
        && gh api -X PUT "$p" -f message="Pin <archive-plugin> to a reviewed digest" -f sha="$(gh api "$p" --jq .sha)" \
             -f content="$(base64 < marketplace.json | tr -d '\n')"
      ```

- [ ] **Disable Plugin Sideload Flags in Claude Code (they load plugins no one reviewed)** - pass: `disableSideloadFlags` is `true` in `managed-settings.json`
  - **CLI**:
    - Verify: `jq '.disableSideloadFlags' "$CC_DIR/managed-settings.json"`
    - Expect: `true`. Otherwise `--plugin-dir` or `CLAUDE_CODE_PLUGIN_DIRS` loads any local plugin, with its hooks and servers, past the marketplace allowlist.
    - Fix:
      ```bash
      t=$(mktemp) && jq '.disableSideloadFlags = true' "$CC_DIR/managed-settings.json" > "$t" \
        && sudo install -m 0644 "$t" "$CC_DIR/managed-settings.json"
      ```

- [ ] **Restrict Claude Code Skills and Subagents to Managed and Plugin Sources** - pass: `strictPluginOnlyCustomization` is `true`, or a list that contains `skills` and `agents`
  - **CLI**:
    - Verify:
      ```bash
      jq -c '.strictPluginOnlyCustomization | if . == true then "locked" elif type == "array" then (["skills", "agents"] - .) as $m | if ($m | length) == 0 then "locked" else {missing: $m} end else "not set" end' "$CC_DIR/managed-settings.json"
      ```
    - Expect: `"locked"`. Otherwise a skill or subagent committed to a repository you clone loads with the same trust as one you reviewed.
    - Fix:
      ```bash
      t=$(mktemp) && jq '.strictPluginOnlyCustomization = (if .strictPluginOnlyCustomization == true then true else ((.strictPluginOnlyCustomization // []) + ["skills", "agents"] | unique) end)' "$CC_DIR/managed-settings.json" > "$t" \
        && sudo install -m 0644 "$t" "$CC_DIR/managed-settings.json"
      ```

- [ ] **Allow Only Managed Hooks in Claude Code** - pass: `allowManagedHooksOnly` is `true` in `managed-settings.json`
  - **CLI**:
    - Verify: `jq '.allowManagedHooksOnly' "$CC_DIR/managed-settings.json"`
    - Expect: `true`. Otherwise the hooks in a repository's `.claude/settings.json` run their commands on the events they name, and under `claude -p` without any trust prompt.
    - Fix:
      ```bash
      t=$(mktemp) && jq '.allowManagedHooksOnly = true' "$CC_DIR/managed-settings.json" > "$t" \
        && sudo install -m 0644 "$t" "$CC_DIR/managed-settings.json"
      ```

- [ ] **Disable Inline Shell in Claude Code Skills (it runs when a skill is invoked)** - pass: `disableSkillShellExecution` is `true` in `managed-settings.json`
  - **CLI**:
    - Verify: `jq '.disableSkillShellExecution' "$CC_DIR/managed-settings.json"`
    - Expect: `true`. Otherwise every skill you invoke can run commands through the inline shell blocks in its `SKILL.md`, some of them pre-approved by the skill itself.
    - Fix:
      ```bash
      t=$(mktemp) && jq '.disableSkillShellExecution = true' "$CC_DIR/managed-settings.json" > "$t" \
        && sudo install -m 0644 "$t" "$CC_DIR/managed-settings.json"
      ```

- [ ] **Disable claude.ai Plugin Sync in Claude Code (synced plugins skip the marketplace allowlist)** - pass: `syncClaudeAiPlugins` is `false` in `managed-settings.json`
  - **CLI**:
    - Verify: `jq '.syncClaudeAiPlugins' "$CC_DIR/managed-settings.json"`
    - Expect: `false`. Otherwise a plugin you enable on claude.ai lands in your Claude Code sessions without passing the marketplace allowlist.
    - Fix:
      ```bash
      t=$(mktemp) && jq '.syncClaudeAiPlugins = false' "$CC_DIR/managed-settings.json" > "$t" \
        && sudo install -m 0644 "$t" "$CC_DIR/managed-settings.json"
      ```

---

## GitHub Copilot and VS Code

- [ ] **Restrict Copilot Plugin Marketplaces to Your Approved Sources** - pass: `strictKnownMarketplaces` in the Copilot managed settings lists only your organization's marketplace sources, each with a pinned `ref` (the same `ref` as its `extraKnownMarketplaces` entry, where you register one)
  - **Console**:
    - Verify: GitHub > <config-org>/.github-private > copilot > managed-settings.json > `strictKnownMarketplaces` lists only your organization's marketplace sources, each with a pinned `ref` (the same `ref` as its `extraKnownMarketplaces` entry, where you register one)
    - Fix: GitHub > <config-org>/.github-private > copilot > managed-settings.json > Edit file > set `strictKnownMarketplaces` to your approved sources, each with its pinned `ref` > Commit changes... > Commit changes
  - **CLI**:
    - Verify:
      ```bash
      gh api "repos/$GH_CFG/contents/copilot/managed-settings.json" -H "Accept: application/vnd.github.raw+json" \
        | jq -c '.strictKnownMarketplaces // "not set"'
      ```
    - Expect: a list of your own sources only, each with a `ref` naming a release tag, not a branch, and none a `hostPattern` or `pathPattern`, such as `[{"source":"github","repo":"<org>/<marketplace-repo>","ref":"<tag>"}]`. `"not set"` lets you add any marketplace and install whatever hooks and servers its plugins carry; the list does not unload a plugin installed before it, and Copilot CLI still installs from any local directory marketplace named in a user's `~/.copilot/settings.json`, whenever it was added.
    - Fix:
      ```bash
      p="repos/$GH_CFG/contents/copilot/managed-settings.json"
      gh api "$p" -H "Accept: application/vnd.github.raw+json" \
        | jq '.strictKnownMarketplaces = [{"source": "github", "repo": "<org>/<marketplace-repo>", "ref": "<tag>"}]' > managed-settings.json \
        && gh api -X PUT "$p" -f message="Allow only approved plugin marketplaces" -f sha="$(gh api "$p" --jq .sha)" \
             -f content="$(base64 < managed-settings.json | tr -d '\n')"
      ```

- [ ] **Restrict Copilot CLI and VS Code Agent Customizations to Plugins** - pass: `strictPluginOnlyCustomization` is `true` in the Copilot managed settings
  - **Console**:
    - Verify: GitHub > <config-org>/.github-private > copilot > managed-settings.json > `strictPluginOnlyCustomization` is `true`
    - Fix: GitHub > <config-org>/.github-private > copilot > managed-settings.json > Edit file > add `"strictPluginOnlyCustomization": true` > Commit changes... > Commit changes
  - **CLI**:
    - Verify:
      ```bash
      gh api "repos/$GH_CFG/contents/copilot/managed-settings.json" -H "Accept: application/vnd.github.raw+json" \
        | jq '.strictPluginOnlyCustomization'
      ```
    - Expect: `true`. Otherwise skills, agents and hooks committed to a repository load beside the ones you distribute as reviewed plugins.
    - Fix:
      ```bash
      p="repos/$GH_CFG/contents/copilot/managed-settings.json"
      gh api "$p" -H "Accept: application/vnd.github.raw+json" \
        | jq '.strictPluginOnlyCustomization = true' > managed-settings.json \
        && gh api -X PUT "$p" -f message="Restrict customizations to plugins" -f sha="$(gh api "$p" --jq .sha)" \
             -f content="$(base64 < managed-settings.json | tr -d '\n')"
      ```

- [ ] **Allow Only Managed Hooks in Copilot CLI and VS Code** - pass: `allowManagedHooksOnly` is `true` in the Copilot managed settings
  - **Console**:
    - Verify: GitHub > <config-org>/.github-private > copilot > managed-settings.json > `allowManagedHooksOnly` is `true`
    - Fix: GitHub > <config-org>/.github-private > copilot > managed-settings.json > Edit file > add `"allowManagedHooksOnly": true` > Commit changes... > Commit changes
  - **CLI**:
    - Verify:
      ```bash
      gh api "repos/$GH_CFG/contents/copilot/managed-settings.json" -H "Accept: application/vnd.github.raw+json" \
        | jq '.allowManagedHooksOnly'
      ```
    - Expect: `true`. Otherwise hooks committed in a repository's `.github/hooks` or `.claude/settings.json` run their commands in your agent sessions.
    - Fix:
      ```bash
      p="repos/$GH_CFG/contents/copilot/managed-settings.json"
      gh api "$p" -H "Accept: application/vnd.github.raw+json" \
        | jq '.allowManagedHooksOnly = true' > managed-settings.json \
        && gh api -X PUT "$p" -f message="Allow only managed hooks" -f sha="$(gh api "$p" --jq .sha)" \
             -f content="$(base64 < managed-settings.json | tr -d '\n')"
      ```

- [ ] **Restrict VS Code Extensions to an Allowlist** - pass: the `AllowedExtensions` device policy lists your approved publishers and extension ids, with no `"*": true` entry
  - **CLI**:
    - Verify:
      ```bash
      jq -c '.AllowedExtensions | if type == "string" then fromjson else . end | if type == "object" then keys elif . == null then "not set" else "not applied: \(type)" end' "$VSC_POLICY"
      ```
    - Expect: a list of your approved publishers and extension ids, with no `"*"`. Without the policy any extension installs, and an extension runs with the editor's full access to your files and tokens.
    - Fix:
      ```bash
      t=$(mktemp) && jq '.AllowedExtensions = {"<publisher>": true, "<publisher>.<extension>": ["<version>"]}' "$VSC_POLICY" > "$t" \
        && sudo install -m 0644 "$t" "$VSC_POLICY"
      ```

- [ ] **Pin a Version for Every VS Code Extension That Adds Agent Tools** - pass: in the `AllowedExtensions` device policy, every extension that contributes agent tools, MCP servers or chat participants is listed by id with exact versions
  - **CLI**:
    - Verify:
      ```bash
      jq -r '(.AllowedExtensions // "not set") | if type == "string" and . != "not set" then fromjson else . end | if type == "object" then to_entries[] | "\(.key)=\(.value | tojson)" else . end' "$VSC_POLICY"
      ```
    - Expect: a line such as `<publisher>.<extension>=["<version>"]` for each extension that adds agent tools. A `<publisher>=true` line admits every future release of every extension that publisher ships.
    - Fix:
      ```bash
      t=$(mktemp) && jq '.AllowedExtensions |= ((. // error("AllowedExtensions is not set")) | .["<publisher>.<extension>"] = ["<version>"])' "$VSC_POLICY" > "$t" \
        && sudo install -m 0644 "$t" "$VSC_POLICY"
      ```

- [ ] **Disable VS Code Extension Auto-Update (updates skip your review)** - pass: the `ExtensionsAutoUpdate` device policy is `off`
  - **CLI**:
    - Verify: `jq '.ExtensionsAutoUpdate' "$VSC_POLICY"`
    - Expect: `"off"`. Otherwise every extension, and every agent plugin VS Code checks with them, updates itself to whatever its publisher releases next.
    - Fix:
      ```bash
      t=$(mktemp) && jq '.ExtensionsAutoUpdate = "off"' "$VSC_POLICY" > "$t" \
        && sudo install -m 0644 "$t" "$VSC_POLICY"
      ```

- [ ] **Disable Third-Party Extension Tools in VS Code Chat (no MCP or plugin allowlist covers them)** - pass: the `ChatAgentExtensionTools` device policy is `false`
  - **CLI**:
    - Verify: `jq '.ChatAgentExtensionTools' "$VSC_POLICY"`
    - Expect: `false`. Otherwise any installed extension can hand the agent new tools that no MCP or plugin allowlist ever reviewed.
    - Fix:
      ```bash
      t=$(mktemp) && jq '.ChatAgentExtensionTools = false' "$VSC_POLICY" > "$t" \
        && sudo install -m 0644 "$t" "$VSC_POLICY"
      ```

---

## Cursor

- [ ] **Restrict Cursor Extensions to an Allowlist** - pass: `Allowed Extensions` for the Enterprise team lists your approved publishers and extension ids, with no `"*": true` entry
  - **Console**:
    - Verify: Cursor dashboard > Team Settings > Security & Identity > Allowed Extensions > the JSON lists only approved publishers and extension ids
    - Fix: Cursor dashboard > Team Settings > Security & Identity > Allowed Extensions > enter a JSON object of approved publishers and extension ids, without `"*": true`

- [ ] **Pin a Version for Every Cursor Extension That Adds Agent Tools** - pass: in the Enterprise team's `Allowed Extensions`, every extension that contributes agent tools or MCP servers is listed by id with exact versions
  - **Console**:
    - Verify: Cursor dashboard > Team Settings > Security & Identity > Allowed Extensions > each agent-tool extension appears as `"<publisher>.<extension>": ["<version>"]`, each version a bare version string with no `v` prefix
    - Fix: Cursor dashboard > Team Settings > Security & Identity > Allowed Extensions > set each agent-tool extension id to its reviewed versions, as `"<publisher>.<extension>": ["<version>"]`, adding the id where only its publisher is listed

- [ ] **Set a Marketplace Install Cooldown in Cursor** - pass: `Marketplace Install Cooldown (hours)` is greater than `0`
  - **Console**:
    - Verify: Cursor dashboard > Team Settings > Security & automation > Marketplace Install Cooldown (hours) > shows a number greater than `0`
    - Fix: Cursor dashboard > Team Settings > Security & automation > Marketplace Install Cooldown (hours) > enter the hours a release must be public before it installs, such as `72`

- [ ] **Require Extension Signature Verification in Cursor** - pass: `Require Extension Signature Verification` is on for the Enterprise team
  - **Console**:
    - Verify: Cursor dashboard > Team Settings > Security & automation > Require Extension Signature Verification > is on
    - Fix: Cursor dashboard > Team Settings > Security & automation > Require Extension Signature Verification > turn on

- [ ] **Disable Local Plugin Imports in Cursor (they skip the team marketplace)** - pass: `Allow Local Plugin Imports` is off
  - **Console**:
    - Verify: Cursor dashboard > Team Settings > Security & Identity > Marketplace and Plugins > Allow Local Plugin Imports > is off
    - Fix: Cursor dashboard > Team Settings > Security & Identity > Marketplace and Plugins > Allow Local Plugin Imports > turn off

- [ ] **Disable Member Publishing to the Cursor Team Marketplace (members publish unreviewed plugins)** - pass: `Allow Members to Publish` is off on the default team marketplace
  - **Console**:
    - Verify: Cursor dashboard > Plugins & MCPs > Default > Marketplace Settings > Allow Members to Publish > is off
    - Fix: Cursor dashboard > Plugins & MCPs > Default > Marketplace Settings > Allow Members to Publish > turn off

---

## OpenAI Codex

- [ ] **Restrict Codex Plugin Marketplaces to Approved Sources** - pass: `marketplaces.restrict_to_allowed_sources` is `true` in `requirements.toml`, `marketplaces.allowed_sources` names only your approved sources, and every `host_pattern` starts with `^`, ends with `$` and names a Git host only your organization publishes to
  - **CLI**:
    - Verify:
      ```bash
      yq -p toml -o json '.marketplaces' "$CODEX_REQ" \
        | jq -c 'if .restrict_to_allowed_sources == true then [.allowed_sources // {} | to_entries[] | {(.key): (.value.url // .value.host_pattern // .value.path)}] else "not restricted" end'
      ```
    - Expect: only your approved sources, such as `[{"<name>":"https://github.com/<org>/<marketplace-repo>.git"}]`, with every host pattern anchored to a host only you publish to, like `^git\.example\.com$`. `"not restricted"`, `.*`, an unanchored pattern or a public host such as `^github\.com$` admits a marketplace from any repository there or a look-alike host.
    - Fix:
      ```bash
      t=$(mktemp) && yq -p toml -o toml '.marketplaces.restrict_to_allowed_sources = true | .marketplaces.allowed_sources.<name> = {"source": "git", "url": "https://github.com/<org>/<marketplace-repo>.git", "ref": "<commit-sha>"}' "$CODEX_REQ" > "$t" \
        && sudo install -m 0644 "$t" "$CODEX_REQ"
      ```

- [ ] **Pin Every Codex Git Marketplace Source to a Commit** - pass: every rule under `marketplaces.allowed_sources` in `requirements.toml` is a `local` rule or a `git` rule with a `url` and a `ref` that is a full 40-character commit SHA
  - **CLI**:
    - Verify:
      ```bash
      yq -p toml -o json '.marketplaces.allowed_sources' "$CODEX_REQ" \
        | jq -c 'if type == "object" then [to_entries[] | select(.value.source != "local" and (.value.source != "git" or (.value.url | not) or ((.value.ref // "") | test("^[0-9a-f]{40}$") | not))) | .key] else "not set" end'
      ```
    - Expect: `[]`. A rule with no `ref`, a branch or tag `ref`, or a `host_pattern` admits new commits, and Codex upgrades Git marketplaces at every session start.
    - Fix:
      ```bash
      t=$(mktemp) && yq -p toml -o toml '.marketplaces.allowed_sources.<name> = {"source": "git", "url": "https://github.com/<org>/<marketplace-repo>.git", "ref": "<commit-sha>"}' "$CODEX_REQ" > "$t" \
        && sudo install -m 0644 "$t" "$CODEX_REQ"
      ```
    - Fix:
      ```bash
      t=$(mktemp) && yq -p toml -o toml 'del(.marketplaces.allowed_sources.<host-rule>)' "$CODEX_REQ" > "$t" \
        && sudo install -m 0644 "$t" "$CODEX_REQ"
      ```

- [ ] **Pin Every Plugin in Your Codex Marketplace** - pass: in your marketplace's `.agents/plugins/marketplace.json`, every `url` or `git-subdir` plugin source has a `sha` and every `npm` source has an exact `version`
  - **CLI**:
    - Verify:
      ```bash
      gh api "repos/$CODEX_MKT/contents/.agents/plugins/marketplace.json?ref=<commit-sha>" -H "Accept: application/vnd.github.raw+json" \
        | jq -c '[.plugins[] | select(.source | type == "object") | select(((.source.source == "url" or .source.source == "git-subdir") and (.source.sha | not)) or (.source.source == "npm" and ((.source.version // "") | test("^[0-9]+[.][0-9]+[.][0-9]+$") | not))) | .name]'
      ```
    - Expect: `[]` at the commit your `allowed_sources` rule pins, which after the Fixes is the new commit. An unpinned source or an npm range installs whatever release is newest when a session starts.
    - Fix:
      ```bash
      p="repos/$CODEX_MKT/contents/.agents/plugins/marketplace.json"
      gh api "$p" -H "Accept: application/vnd.github.raw+json" \
        | jq '(.plugins[] | select(.name == "<plugin>") | .source) |= (if .source == "npm" then .version = "<plugin-version>" else .sha = "<plugin-commit-sha>" end)' > marketplace.json \
        && gh api -X PUT "$p" -f message="Pin <plugin> to a reviewed build" -f sha="$(gh api "$p" --jq .sha)" \
             -f content="$(base64 < marketplace.json | tr -d '\n')"
      ```
    - Fix:
      ```bash
      c=<reviewed-commit-sha> && t=$(mktemp) \
        && yq -p toml -o toml ".marketplaces.allowed_sources.<name>.ref = \"$c\"" "$CODEX_REQ" > "$t" \
        && sudo install -m 0644 "$t" "$CODEX_REQ"
      ```

- [ ] **Disable Codex Remote Plugins (they skip the marketplace source policy)** - pass: `features.remote_plugin` is `false` in `requirements.toml`
  - **CLI**:
    - Verify: `yq -p toml -o json '.features.remote_plugin' "$CODEX_REQ"`
    - Expect: `false`. Otherwise plugins from the remote catalog reach your sessions outside the marketplace sources you allowed.
    - Fix:
      ```bash
      t=$(mktemp) && yq -p toml -o toml '.features.remote_plugin = false' "$CODEX_REQ" > "$t" \
        && sudo install -m 0644 "$t" "$CODEX_REQ"
      ```

- [ ] **Allow Only Managed Hooks in Codex** - pass: `allow_managed_hooks_only` is `true` in `requirements.toml`
  - **CLI**:
    - Verify: `yq -p toml -o json '.allow_managed_hooks_only' "$CODEX_REQ"`
    - Expect: `true`. Otherwise the hooks in a repository's `.codex/hooks.json` or in a plugin run their commands once you trust them.
    - Fix:
      ```bash
      t=$(mktemp) && yq -p toml -o toml '.allow_managed_hooks_only = true' "$CODEX_REQ" > "$t" \
        && sudo install -m 0644 "$t" "$CODEX_REQ"
      ```

---

## Gemini CLI

- [ ] **Restrict Gemini CLI Extensions to Your Reviewed Extension Directory** - pass: `security.allowedExtensions` in the system settings file is `["^/opt/gemini-extensions/[^/]+$"]`, and `/opt/gemini-extensions` is owned by root and not writable by others
  - **CLI**:
    - Verify: `jq -c '.security.allowedExtensions' "$GEMINI_SYS"`
    - Verify: `ls -ld /opt/gemini-extensions`
    - Expect: `["^/opt/gemini-extensions/[^/]+$"]`, then a `drwxr-xr-x` line owned by `root`. An empty list admits any extension, and a pattern for any other folder can match a Git URL or a folder you can write to.
    - Fix:
      ```bash
      t=$(mktemp) && jq '.security.allowedExtensions = ["^/opt/gemini-extensions/[^/]+$"]' "$GEMINI_SYS" > "$t" \
        && sudo install -m 0644 "$t" "$GEMINI_SYS"
      ```
    - Fix: `sudo install -d -o root -m 0755 /opt/gemini-extensions`

- [ ] **Disable Gemini CLI Skills in System Settings (no setting restricts where they come from)** - pass: `skills.enabled` is `false` in the system settings file
  - **CLI**:
    - Verify: `jq '.skills.enabled' "$GEMINI_SYS"`
    - Expect: `false`. Otherwise skills from a cloned repository's `.gemini/skills` or `.agents/skills` load beside the ones you reviewed.
    - Fix:
      ```bash
      t=$(mktemp) && jq '.skills.enabled = false' "$GEMINI_SYS" > "$t" \
        && sudo install -m 0644 "$t" "$GEMINI_SYS"
      ```

- [ ] **Disable Gemini CLI Hooks in System Settings (no setting limits them to managed ones)** - pass: `hooksConfig.enabled` is `false` in the system settings file
  - **CLI**:
    - Verify: `jq '.hooksConfig.enabled' "$GEMINI_SYS"`
    - Expect: `false`. Otherwise hook commands from a repository's settings and from installed extensions run on agent events.
    - Fix:
      ```bash
      t=$(mktemp) && jq '.hooksConfig.enabled = false' "$GEMINI_SYS" > "$t" \
        && sudo install -m 0644 "$t" "$GEMINI_SYS"
      ```

---

## Devin Desktop (Windsurf)

- [ ] **Forbid Every Devin Plugin You Have Not Approved** - pass: the Enterprise plugin manifest sets `"forbiddenPlugins": ["*"]` and lists each approved plugin, with its dependencies, under `optionalPlugins` or `requiredPlugins`
  - **Console**:
    - Verify: Devin web app > Customize > Plugins > Enterprise > Plugin settings > Edit manifest > the manifest shows `"forbiddenPlugins": ["*"]` and only reviewed plugins in `optionalPlugins` and `requiredPlugins`
    - Fix: Devin web app > Customize > Plugins > Enterprise > Plugin settings > Edit manifest > set `"forbiddenPlugins": ["*"]`, keep required plugins in `requiredPlugins`, and list every other reviewed plugin and every plugin a listed plugin depends on in `optionalPlugins` > save

- [ ] **Pin Every Devin Plugin in the Enterprise Manifest to a Commit** - pass: every git-sourced entry under `requiredPlugins` and `optionalPlugins` in the Enterprise manifest is an object with a full 40-character `sha` and no `ref`
  - **Console**:
    - Verify: Devin web app > Customize > Plugins > Enterprise > Plugin settings > Edit manifest > every git-sourced entry under `requiredPlugins` and `optionalPlugins` carries `"sha": "<commit-sha>"` with the full 40-character SHA, and the Plugins tab shows no `Plugin source not pinned` notice
    - Fix: Devin web app > Customize > Plugins > Enterprise > Plugin settings > Edit manifest > rewrite each git-sourced entry under `requiredPlugins` and `optionalPlugins` as an object with the reviewed full 40-character `"sha"` and no `"ref"` > save

---

## JetBrains

- [ ] **Block Every JetBrains Plugin You Have Not Approved** - pass: in every IDE Services profile, the Plugin Settings filters include every IDE your developers run, and the rules are an `All plugins` rule of type `Block (Forced)` plus `Allow` rules only for reviewed plugins
  - **Console**:
    - Verify: IDE Services > Profiles > <profile> > Plugins > Plugin Settings > the filters include every IDE your developers run, and the rules show an `All plugins` rule of type `Block (Forced)` and `Allow` rules only for reviewed plugins
    - Fix: IDE Services > Profiles > <profile> > Plugins > Plugin Settings > Add filter > Type: Include > IDE: <each IDE in use> > OK, then Add rule > All plugins > Block (Forced) > Save, then Add rule > Specific plugin > <plugin> > <version> > Allow > Save for each reviewed plugin

- [ ] **Turn Off Allow All Agents in the JetBrains AI Enterprise Agent Registry (it provisions every registry agent unreviewed)** - pass: `Allow all agents` is off in the AI Enterprise Agent Registry
  - **Console**:
    - Verify: IDE Services > Configuration > License & Activation > AI Enterprise > Settings > Agent Registry > `Allow all agents` is off
    - Fix: IDE Services > Configuration > License & Activation > AI Enterprise > Settings > Agent Registry > turn off `Allow all agents` > Save

- [ ] **Disable Custom ACP Agents in JetBrains IDEs (users could add any agent executable)** - pass: `Allow users to add custom ACP agents in their IDE` is off in every IDE Services profile
  - **Console**:
    - Verify: IDE Services > Profiles > <profile> > AI Enterprise > `Allow users to add custom ACP agents in their IDE` is off
    - Fix: IDE Services > Profiles > <profile> > AI Enterprise > turn off `Allow users to add custom ACP agents in their IDE` > Save
