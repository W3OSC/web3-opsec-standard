// Bridges the local Playwright MCP server into Anthropic tool-runner tools.
//
// The Messages API's server-side MCP connector only supports remote URL servers, so we
// run @playwright/mcp locally over stdio and expose each of its tools as a runner tool
// whose run() proxies the call through the MCP client.

import path from 'node:path';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { betaTool } from '@anthropic-ai/sdk/helpers/beta/json-schema';

const require = createRequire(import.meta.url);

function playwrightMcpCommand() {
  try {
    const pkgPath = require.resolve('@playwright/mcp/package.json');
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    const bin = typeof pkg.bin === 'string' ? pkg.bin : Object.values(pkg.bin)[0];
    return { command: process.execPath, args: [path.join(path.dirname(pkgPath), bin)] };
  } catch {
    return { command: 'npx', args: ['-y', '@playwright/mcp@latest'] };
  }
}

export async function startBrowserSession({ headed = false, profileDir, outputDir }) {
  const { command, args } = playwrightMcpCommand();
  const flags = ['--browser', 'chromium'];
  if (!headed) flags.push('--headless');
  if (profileDir) flags.push('--user-data-dir', profileDir);
  if (outputDir) flags.push('--output-dir', outputDir);

  const transport = new StdioClientTransport({
    command,
    args: [...args, ...flags],
    stderr: 'pipe',
  });
  const client = new Client({ name: 'w3os-guide-verifier', version: '0.1.0' });
  await client.connect(transport);
  return client;
}

function contentToResult(result) {
  const blocks = result?.content ?? [];
  const parts = [];
  let hasImage = false;
  for (const block of blocks) {
    if (block.type === 'text') {
      parts.push({ type: 'text', text: block.text });
    } else if (block.type === 'image') {
      hasImage = true;
      parts.push({
        type: 'image',
        source: { type: 'base64', media_type: block.mimeType || 'image/png', data: block.data },
      });
    }
  }
  if (parts.length === 0) return 'OK (no output)';
  if (!hasImage) return parts.map((p) => p.text).join('\n');
  return parts;
}

// Returns an array of runner tools mirroring the MCP server's tool list.
export async function browserTools(mcpClient) {
  const { tools } = await mcpClient.listTools();
  return tools.map((t) =>
    betaTool({
      name: t.name,
      description: t.description || t.name,
      inputSchema: t.inputSchema,
      run: async (input) => {
        try {
          const result = await mcpClient.callTool({ name: t.name, arguments: input ?? {} });
          if (result.isError) {
            const text = (result.content ?? [])
              .filter((b) => b.type === 'text')
              .map((b) => b.text)
              .join('\n');
            return `TOOL ERROR: ${text || 'unknown error'}`;
          }
          return contentToResult(result);
        } catch (err) {
          return `TOOL ERROR: ${err.message}`;
        }
      },
    }),
  );
}
