// Aggregates findings.json files into a markdown report and updates automation/state.json
// (last-verified bookkeeping per guide).

import fs from 'node:fs';
import path from 'node:path';
import { REPO_ROOT } from './guides.js';

export const STATE_FILE = path.join(REPO_ROOT, 'automation', 'state.json');

export function collectFindings(inDir) {
  const results = [];
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.name === 'findings.json') {
        results.push(JSON.parse(fs.readFileSync(full, 'utf8')));
      }
    }
  };
  walk(inDir);
  return results.sort((a, b) => `${a.service}${a.scope}`.localeCompare(`${b.service}${b.scope}`));
}

function count(findings, status) {
  return findings.filter((f) => f.status === status).length;
}

export function buildReport(results) {
  const lines = [];
  lines.push('# Guide verification report');
  lines.push('');
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push('');
  lines.push('| Guide | Items | Confirmed | Drifted | Missing | Manual review | Blocked |');
  lines.push('|---|---|---|---|---|---|---|');
  for (const r of results) {
    const manual =
      count(r.findings, 'unverifiable_paid') +
      count(r.findings, 'unverifiable_permission') +
      count(r.findings, 'skipped');
    lines.push(
      `| ${r.guide_path} | ${r.total_items} | ${count(r.findings, 'confirmed')} | ` +
        `${count(r.findings, 'drifted')} | ${count(r.findings, 'missing')} | ${manual} | ` +
        `${count(r.findings, 'blocked')} |`,
    );
  }

  const drifted = results.flatMap((r) =>
    r.findings.filter((f) => f.status === 'drifted').map((f) => ({ r, f })),
  );
  const missing = results.flatMap((r) =>
    r.findings.filter((f) => f.status === 'missing').map((f) => ({ r, f })),
  );
  const manualItems = results.flatMap((r) =>
    r.findings
      .filter((f) => ['unverifiable_paid', 'unverifiable_permission', 'skipped'].includes(f.status))
      .map((f) => ({ r, f })),
  );
  const blockedRuns = results.filter((r) => r.findings.some((f) => f.status === 'blocked'));

  if (drifted.length) {
    lines.push('', '## Drifted settings (auto-fixable)', '');
    for (const { r, f } of drifted) {
      lines.push(`### ${r.guide_path}:${f.line}`);
      lines.push(`- **Was:** ${f.item_text}`);
      lines.push(`- **Observed:** ${f.observed}`);
      if (f.suggested_text) lines.push(`- **Suggested:** ${f.suggested_text}`);
      if (f.notes) lines.push(`- **Notes:** ${f.notes}`);
      lines.push('');
    }
  }

  if (missing.length) {
    lines.push('', '## Settings no longer found (needs human decision)', '');
    for (const { r, f } of missing) {
      lines.push(`- \`${r.guide_path}:${f.line}\` - ${f.item_text}`);
      lines.push(`  - Observed: ${f.observed}${f.notes ? ` (${f.notes})` : ''}`);
    }
  }

  if (manualItems.length) {
    lines.push('', '## Manual review required (paid plans / permissions / non-UI items)', '');
    for (const { r, f } of manualItems) {
      lines.push(`- \`${r.guide_path}:${f.line}\` [${f.status}] ${f.item_text}`);
      lines.push(`  - ${f.observed}${f.notes ? ` (${f.notes})` : ''}`);
    }
  }

  if (blockedRuns.length) {
    lines.push('', '## Blocked runs (verification incomplete)', '');
    for (const r of blockedRuns) {
      const blocked = r.findings.filter((f) => f.status === 'blocked');
      lines.push(`- ${r.guide_path}: ${blocked.length}/${r.total_items} items blocked. ${r.error ?? blocked[0]?.observed ?? ''}`);
    }
  }

  return lines.join('\n') + '\n';
}

export function updateState(results) {
  let state = {};
  if (fs.existsSync(STATE_FILE)) state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
  for (const r of results) {
    state[r.guide_id] = {
      guide_path: r.guide_path,
      last_verified: r.finished_at,
      model: r.model,
      total_items: r.total_items,
      confirmed: count(r.findings, 'confirmed'),
      drifted: count(r.findings, 'drifted'),
      missing: count(r.findings, 'missing'),
      manual:
        count(r.findings, 'unverifiable_paid') +
        count(r.findings, 'unverifiable_permission') +
        count(r.findings, 'skipped'),
      blocked: count(r.findings, 'blocked'),
    };
  }
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2) + '\n');
  return state;
}
