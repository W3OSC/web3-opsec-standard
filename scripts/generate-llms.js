#!/usr/bin/env node
/**
 * Generates llms.txt (AI-readable index per https://llmstxt.org) and
 * llms-full.txt (full requirements text) from the repository content.
 *
 * Usage: node scripts/generate-llms.js
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const RAW_BASE = 'https://raw.githubusercontent.com/W3OSC/web3-opsec-standard/main';

function getAllFiles(dir, ext = '.md') {
  if (!fs.existsSync(dir)) return [];
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) results.push(...getAllFiles(full, ext));
    else if (entry.isFile() && entry.name.endsWith(ext)) results.push(full);
  }
  return results.sort();
}

function titleOf(content, fallback) {
  const h1 = content.match(/^# (.+)$/m);
  if (h1) return h1[1].trim();
  const h2 = content.match(/<h2>.*?<a[^>]*>([^<]+)<\/a>\s*(Configuration Guide)?<\/h2>/);
  if (h2) return `${h2[1].trim()} Configuration Guide`;
  return fallback;
}

function rawUrl(file) {
  return `${RAW_BASE}/${path.relative(ROOT, file).split(path.sep).map(encodeURIComponent).join('/')}`;
}

// ── llms.txt (index) ─────────────────────────────────────────────────────────

let out = [];
out.push('# Web3 Operational Security Standard (W3OS)');
out.push('');
out.push('> W3OS is an open standard defining operational security requirements for Web3 organizations: wallets and multisigs, endpoints, communications, DevOps, financial controls, AI agent usage, and smart contract operations. It complements code audits with the organizational controls that prevent key compromise, social engineering, and operational loss.');
out.push('');

out.push('## Requirements');
out.push('');
for (const file of getAllFiles(path.join(ROOT, 'requirements'))) {
  const content = fs.readFileSync(file, 'utf8');
  const title = titleOf(content, path.basename(file, '.md'));
  const controls = (content.match(/^\*\*SP-[A-Z]+-\d{3}:/gm) || []).length;
  out.push(`- [${title}](${rawUrl(file)}): ${controls} controls`);
}
out.push('');

out.push('## Guides');
out.push('');
for (const file of getAllFiles(path.join(ROOT, 'guides'))) {
  const content = fs.readFileSync(file, 'utf8');
  const rel = path.relative(path.join(ROOT, 'guides'), file);
  const title = titleOf(content, path.basename(file, '.md'));
  const scope = (content.match(/scope:\s*(\w+)/) || [])[1] || '';
  out.push(`- [${title}](${rawUrl(file)}): ${rel.includes('account configurations') ? 'configuration checklist' : 'implementation guide'}${scope ? ` (${scope.toLowerCase()})` : ''}`);
}
out.push('');

out.push('## Optional');
out.push('');
for (const name of ['docs/maturity-tiers.md', 'docs/crosswalk.md', 'docs/rekt-test.md']) {
  const file = path.join(ROOT, name);
  if (!fs.existsSync(file)) continue;
  const title = titleOf(fs.readFileSync(file, 'utf8'), name);
  out.push(`- [${title}](${rawUrl(file)})`);
}
out.push('');

fs.writeFileSync(path.join(ROOT, 'llms.txt'), out.join('\n'));
console.log(`Wrote llms.txt (${out.length} lines)`);

// ── llms-full.txt (full requirements text) ──────────────────────────────────

let full = ['# W3OS — Full Requirements Text', ''];
for (const file of getAllFiles(path.join(ROOT, 'requirements'))) {
  full.push(fs.readFileSync(file, 'utf8').trim());
  full.push('');
  full.push('---');
  full.push('');
}
fs.writeFileSync(path.join(ROOT, 'llms-full.txt'), full.join('\n'));
console.log(`Wrote llms-full.txt`);
