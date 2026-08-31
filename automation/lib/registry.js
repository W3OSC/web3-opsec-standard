// Service registry (services.yml) + credential resolution.

import fs from 'node:fs';
import path from 'node:path';
import YAML from 'yaml';
import { REPO_ROOT, guidesByService } from './guides.js';

const REGISTRY_FILE = path.join(REPO_ROOT, 'automation', 'services.yml');

export function loadRegistry() {
  const raw = YAML.parse(fs.readFileSync(REGISTRY_FILE, 'utf8'));
  const guides = guidesByService();
  const services = new Map();
  for (const [key, cfg] of Object.entries(raw)) {
    services.set(key, {
      key,
      name: cfg.name || key,
      login_url: cfg.login_url || null,
      mode: cfg.mode || 'manual',
      enabled: Boolean(cfg.enabled),
      ci: Boolean(cfg.ci),
      auth: cfg.auth || [],
      notes: cfg.notes || '',
      guides: guides.get(key) || {},
    });
  }
  // Surface guides that exist on disk but have no registry entry.
  for (const [key, g] of guides) {
    if (!services.has(key)) {
      services.set(key, {
        key,
        name: key,
        login_url: null,
        mode: 'manual',
        enabled: false,
        ci: false,
        auth: [],
        notes: 'Not in services.yml - add an entry.',
        guides: g,
        unregistered: true,
      });
    }
  }
  return services;
}

// Credentials come from either:
//   1. W3OS_CREDENTIALS - a JSON object secret:
//      { "notion": { "email": "...", "password": "...", "totp_secret": "...",
//                    "organization": { "email": "..." } } }
//      The optional "organization"/"individual" sub-objects override base fields per scope.
//   2. Individual env vars: W3OS_NOTION_EMAIL, W3OS_NOTION_PASSWORD,
//      W3OS_NOTION_TOTP_SECRET, and scope-specific W3OS_NOTION_ORG_EMAIL etc.
// IMAP inbox (for get_email_code) is global: W3OS_IMAP_HOST / PORT / USER / PASSWORD.
export const CRED_FIELDS = ['email', 'password', 'username', 'phone', 'totp_secret', 'backup_code'];

export function resolveCredentials(serviceKey, scope) {
  const creds = {};
  const blob = process.env.W3OS_CREDENTIALS;
  if (blob) {
    let parsed;
    try {
      parsed = JSON.parse(blob);
    } catch {
      throw new Error('W3OS_CREDENTIALS is set but is not valid JSON');
    }
    const svc = parsed[serviceKey];
    if (svc) {
      for (const f of CRED_FIELDS) if (svc[f] != null) creds[f] = String(svc[f]);
      const scoped = svc[scope];
      if (scoped) for (const f of CRED_FIELDS) if (scoped[f] != null) creds[f] = String(scoped[f]);
    }
  }
  const prefix = `W3OS_${serviceKey.toUpperCase().replaceAll('-', '_')}_`;
  const scopePrefix = `${prefix}${scope === 'organization' ? 'ORG_' : 'IND_'}`;
  for (const f of CRED_FIELDS) {
    const suffix = f.toUpperCase();
    if (process.env[prefix + suffix] != null) creds[f] = process.env[prefix + suffix];
    if (process.env[scopePrefix + suffix] != null) creds[f] = process.env[scopePrefix + suffix];
  }
  return creds;
}

export function imapConfig() {
  const { W3OS_IMAP_HOST, W3OS_IMAP_PORT, W3OS_IMAP_USER, W3OS_IMAP_PASSWORD } = process.env;
  if (!W3OS_IMAP_HOST || !W3OS_IMAP_USER || !W3OS_IMAP_PASSWORD) return null;
  return {
    host: W3OS_IMAP_HOST,
    port: Number(W3OS_IMAP_PORT || 993),
    secure: true,
    auth: { user: W3OS_IMAP_USER, pass: W3OS_IMAP_PASSWORD },
  };
}
