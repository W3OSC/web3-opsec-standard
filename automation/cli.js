#!/usr/bin/env node
// W3OS guide verification CLI. Run `node cli.js help` for usage.

import fs from 'node:fs';
import path from 'node:path';
import { loadRegistry, resolveCredentials, imapConfig } from './lib/registry.js';
import { REPO_ROOT } from './lib/guides.js';

const OUT_DEFAULT = path.join(REPO_ROOT, 'automation', 'output');

function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const key = a.slice(2);
      const next = argv[i + 1];
      if (next !== undefined && !next.startsWith('--')) {
        args[key] = next;
        i++;
      } else args[key] = true;
    } else args._.push(a);
  }
  return args;
}

function selectTargets(registry, { service, scope, all }) {
  const targets = [];
  for (const svc of registry.values()) {
    if (service && svc.key !== service) continue;
    if (!service && !all && (!svc.enabled || svc.mode === 'manual')) continue;
    for (const s of ['individual', 'organization']) {
      if (scope && s !== scope) continue;
      const guide = svc.guides[s];
      if (guide) targets.push({ service: svc, guide });
    }
  }
  return targets;
}

const commands = {
  async list() {
    const registry = loadRegistry();
    console.log(
      'SERVICE'.padEnd(14),
      'MODE'.padEnd(9),
      'ENABLED'.padEnd(8),
      'CI'.padEnd(4),
      'GUIDES',
    );
    for (const svc of registry.values()) {
      const guides = Object.entries(svc.guides)
        .map(([s, g]) => `${s}(${g.items.length})`)
        .join(' ');
      console.log(
        svc.key.padEnd(14),
        svc.mode.padEnd(9),
        String(svc.enabled).padEnd(8),
        String(svc.ci).padEnd(4),
        guides || '-',
      );
    }
  },

  async matrix(args) {
    const registry = loadRegistry();
    const filter = args.services
      ? String(args.services)
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      : null;
    const include = [];
    for (const svc of registry.values()) {
      if (svc.mode === 'manual') continue;
      if (filter ? !filter.includes(svc.key) : !svc.enabled) continue;
      if (args.ci && !svc.ci) continue;
      for (const scope of ['individual', 'organization']) {
        if (svc.guides[scope]) include.push({ service: svc.key, scope });
      }
    }
    console.log(JSON.stringify({ include }));
  },

  async doctor(args) {
    const registry = loadRegistry();
    let ok = true;
    console.log(`ANTHROPIC_API_KEY: ${process.env.ANTHROPIC_API_KEY ? 'set' : 'MISSING'}`);
    console.log(`W3OS_CREDENTIALS: ${process.env.W3OS_CREDENTIALS ? 'set' : 'not set'}`);
    console.log(`IMAP inbox: ${imapConfig() ? 'configured' : 'not configured'}`);
    for (const svc of registry.values()) {
      if (args.service && svc.key !== args.service) continue;
      if (!args.service && !svc.enabled) continue;
      for (const scope of Object.keys(svc.guides)) {
        const creds = resolveCredentials(svc.key, scope);
        const have = Object.keys(creds).filter((k) => creds[k]);
        const needsTotp = svc.auth.includes('totp');
        const missing = [];
        if (svc.auth.includes('email') && !creds.email) missing.push('email');
        if (svc.auth.includes('password') && !creds.password) missing.push('password');
        if (needsTotp && !creds.totp_secret) missing.push('totp_secret');
        const status = missing.length ? `MISSING: ${missing.join(', ')}` : 'ok';
        if (missing.length) ok = false;
        console.log(`${svc.key}/${scope}: have [${have.join(', ') || 'none'}] -> ${status}`);
      }
    }
    if (!ok) process.exitCode = 1;
  },

  async verify(args) {
    const registry = loadRegistry();
    const targets = selectTargets(registry, {
      service: args.service,
      scope: args.scope,
      all: Boolean(args.all),
    });
    if (!targets.length) {
      console.error('No matching targets. Check --service/--scope, service mode, and enabled flags.');
      process.exitCode = 1;
      return;
    }
    const outDir = path.resolve(args.out || OUT_DEFAULT);
    fs.mkdirSync(outDir, { recursive: true });

    if (args['dry-run']) {
      for (const { service, guide } of targets) {
        console.log(`\n=== ${service.key} / ${guide.scope} (${guide.items.length} items) ===`);
        console.log(`login: ${service.login_url}  mode: ${service.mode}  ci: ${service.ci}`);
        for (const item of guide.items) {
          console.log(`  ${item.id}  [${item.section}] ${item.text.slice(0, 100)}`);
        }
      }
      return;
    }

    if (!process.env.ANTHROPIC_API_KEY && !process.env.ANTHROPIC_AUTH_TOKEN) {
      console.error('ANTHROPIC_API_KEY is not set.');
      process.exitCode = 1;
      return;
    }

    const { runVerification } = await import('./lib/verifier.js');
    let failures = 0;
    for (const { service, guide } of targets) {
      console.log(`\n=== Verifying ${service.key} / ${guide.scope} (${guide.items.length} items) ===`);
      try {
        const { result, outFile } = await runVerification({
          service,
          guide,
          headed: Boolean(args.headed),
          outDir,
          onProgress: (msg) => console.log(`  ${msg.split('\n')[0].slice(0, 160)}`),
        });
        const blocked = result.findings.filter((f) => f.status === 'blocked').length;
        console.log(
          `  done: ${result.findings.length - blocked}/${result.total_items} recorded, ` +
            `${blocked} blocked -> ${path.relative(process.cwd(), outFile)}`,
        );
        if (result.error) {
          console.error(`  run error: ${result.error}`);
          failures++;
        }
      } catch (err) {
        console.error(`  FAILED: ${err.message}`);
        failures++;
      }
    }
    if (failures) process.exitCode = 1;
  },

  async report(args) {
    const { collectFindings, buildReport, updateState } = await import('./lib/report.js');
    const inDir = path.resolve(args.in || OUT_DEFAULT);
    const results = collectFindings(inDir);
    if (!results.length) {
      console.error(`No findings.json files under ${inDir}`);
      process.exitCode = 1;
      return;
    }
    const md = buildReport(results);
    const outFile = path.resolve(args.out || path.join(inDir, 'report.md'));
    fs.writeFileSync(outFile, md);
    if (!args['no-state']) updateState(results);
    console.log(md);
    console.log(`Report written to ${outFile}`);
  },

  async update(args) {
    const { collectFindings } = await import('./lib/report.js');
    const { applyFindings } = await import('./lib/updater.js');
    const inDir = path.resolve(args.in || OUT_DEFAULT);
    const results = collectFindings(inDir);
    const { applied, unapplied } = applyFindings(results, { write: Boolean(args.write) });
    for (const a of applied) {
      console.log(`${args.write ? 'UPDATED' : 'WOULD UPDATE'} ${a.guide_path}:${a.line}`);
      console.log(`  - ${a.before}`);
      console.log(`  + ${a.after}`);
    }
    for (const u of unapplied) {
      console.log(`SKIPPED (${u.reason}): ${u.finding.item_text}`);
    }
    console.log(`\n${applied.length} applied, ${unapplied.length} need manual attention.`);
  },

  async linkcheck(args) {
    const { runLinkcheck, linkcheckMarkdown } = await import('./lib/linkcheck.js');
    const summary = await runLinkcheck();
    const md = linkcheckMarkdown(summary);
    if (args.out) {
      fs.mkdirSync(path.dirname(path.resolve(args.out)), { recursive: true });
      fs.writeFileSync(path.resolve(args.out), md);
    }
    console.log(md);
    if (summary.dead.length) process.exitCode = 1;
  },

  async help() {
    console.log(`W3OS guide verification CLI

Usage: node automation/cli.js <command> [options]

Commands:
  list                         Show services, modes, and parsed guide/item counts
  doctor [--service X]         Check credentials/config for enabled (or one) service
  verify [--service X] [--scope individual|organization]
         [--headed] [--dry-run] [--all] [--out DIR]
                               Run browser verification agent(s). Default: all enabled
                               non-manual services. --dry-run prints parsed checklists.
                               --headed opens a visible browser (local bootstrap).
  report [--in DIR] [--out FILE] [--no-state]
                               Aggregate findings into markdown; update state.json
  update [--in DIR] [--write]  Apply drifted-item fixes to guide markdown (dry-run
                               without --write)
  linkcheck [--out FILE]       Check every external URL referenced by the guides
  matrix [--services a,b] [--ci]
                               Print the GitHub Actions matrix JSON

Environment:
  ANTHROPIC_API_KEY            Required for verify
  W3OS_CREDENTIALS             JSON blob of per-service test-account credentials
  W3OS_<SERVICE>_<FIELD>       Alternative per-field credentials (EMAIL, PASSWORD,
                               TOTP_SECRET, USERNAME, PHONE, BACKUP_CODE)
  W3OS_IMAP_HOST/PORT/USER/PASSWORD  Shared inbox for emailed login codes
  W3OS_VERIFY_MODEL            Model override (default claude-opus-5)
`);
  },
};

const args = parseArgs(process.argv.slice(2));
const cmd = args._.shift() || 'help';
if (!commands[cmd]) {
  console.error(`Unknown command: ${cmd}`);
  await commands.help();
  process.exitCode = 1;
} else {
  await commands[cmd](args);
}
