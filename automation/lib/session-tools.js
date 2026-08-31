// Non-browser tools available to the verification agent:
//   get_credential  - test-account login fields for the service under verification
//   get_totp_code   - current TOTP code derived from the stored secret
//   get_email_code  - most recent verification code from the shared IMAP inbox
//   record_finding  - structured per-checklist-item verdict (the run's actual output)

import { betaTool } from '@anthropic-ai/sdk/helpers/beta/json-schema';
import { authenticator } from 'otplib';
import { imapConfig } from './registry.js';

export const STATUSES = [
  'confirmed',
  'drifted',
  'missing',
  'unverifiable_paid',
  'unverifiable_permission',
  'blocked',
  'skipped',
];

export function buildSessionTools({ credentials, guide, findings }) {
  const itemsById = new Map(guide.items.map((i) => [i.id, i]));

  const getCredential = betaTool({
    name: 'get_credential',
    description:
      'Get a login credential for the dedicated test account of the service being verified. ' +
      'Call this when a login form asks for the value; never guess credentials.',
    inputSchema: {
      type: 'object',
      properties: {
        field: {
          type: 'string',
          enum: ['email', 'password', 'username', 'phone', 'backup_code'],
          description: 'Which credential field you need.',
        },
      },
      required: ['field'],
      additionalProperties: false,
    },
    run: async ({ field }) => {
      const value = credentials[field];
      if (!value) return `NOT CONFIGURED: no "${field}" stored for this service. If login is impossible without it, record remaining items as blocked.`;
      return value;
    },
  });

  const getTotpCode = betaTool({
    name: 'get_totp_code',
    description:
      'Get the current 6-digit TOTP code for the test account, computed from the stored ' +
      'authenticator secret. Call at the moment the login form asks for the code (codes ' +
      'expire every 30 seconds).',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    run: async () => {
      const secret = credentials.totp_secret;
      if (!secret) return 'NOT CONFIGURED: no TOTP secret stored for this service.';
      try {
        return authenticator.generate(secret.replace(/\s+/g, ''));
      } catch (err) {
        return `TOOL ERROR: could not generate TOTP code: ${err.message}`;
      }
    },
  });

  const getEmailCode = betaTool({
    name: 'get_email_code',
    description:
      'Fetch the most recent verification/sign-in code emailed to the test inbox. Use when ' +
      'a service emails a one-time code or magic link during login. Polls for up to 60 seconds.',
    inputSchema: {
      type: 'object',
      properties: {
        sender_hint: {
          type: 'string',
          description: 'Substring expected in the sender address or subject, e.g. "notion".',
        },
      },
      required: [],
      additionalProperties: false,
    },
    run: async ({ sender_hint }) => {
      const config = imapConfig();
      if (!config) return 'NOT CONFIGURED: W3OS_IMAP_HOST/USER/PASSWORD are not set.';
      try {
        const code = await fetchEmailCode(config, sender_hint);
        return code ?? 'NO CODE FOUND: no matching recent email with a code arrived within 60s. You may retry once.';
      } catch (err) {
        return `TOOL ERROR: IMAP lookup failed: ${err.message}`;
      }
    },
  });

  const recordFinding = betaTool({
    name: 'record_finding',
    description:
      'Record the verification verdict for ONE checklist item. You must call this exactly ' +
      'once for every item id in the checklist before finishing. This is the only output of ' +
      'the run that is kept.',
    inputSchema: {
      type: 'object',
      properties: {
        item_id: { type: 'string', description: 'The id shown next to the checklist item.' },
        status: {
          type: 'string',
          enum: STATUSES,
          description:
            'confirmed: the setting exists exactly as described. ' +
            'drifted: the setting exists but its path, label, or values changed - provide suggested_text. ' +
            'missing: the setting no longer exists anywhere you could find. ' +
            'unverifiable_paid: gated behind a paid plan the test account lacks. ' +
            'unverifiable_permission: requires a role/permission the test account lacks. ' +
            'blocked: could not reach the screen (login failure, captcha, outage). ' +
            'skipped: not verifiable via UI (e.g. behavioral advice, not a setting).',
        },
        observed: {
          type: 'string',
          description: 'What the UI actually shows: the real navigation path and label you found.',
        },
        suggested_text: {
          type: 'string',
          description:
            'For drifted items only: the corrected checklist text that should replace the ' +
            'current item text (everything after "- [ ] ", preserving the guide\'s ' +
            'formatting conventions like "Section > Subsection > **Value**").',
        },
        notes: { type: 'string', description: 'Anything a human reviewer should know.' },
      },
      required: ['item_id', 'status', 'observed'],
      additionalProperties: false,
    },
    run: async ({ item_id, status, observed, suggested_text, notes }) => {
      const item = itemsById.get(item_id);
      if (!item) {
        const known = [...itemsById.keys()].join(', ');
        return `UNKNOWN item_id "${item_id}". Valid ids: ${known}`;
      }
      findings.set(item_id, {
        item_id,
        status,
        observed,
        suggested_text: suggested_text || null,
        notes: notes || null,
        item_text: item.text,
        section: item.section,
        line: item.line,
      });
      return `Recorded ${item_id} (${findings.size}/${guide.items.length} items done).`;
    },
  });

  return [getCredential, getTotpCode, getEmailCode, recordFinding];
}

async function fetchEmailCode(config, senderHint) {
  const { ImapFlow } = await import('imapflow');
  const { simpleParser } = await import('mailparser');
  const deadline = Date.now() + 60_000;
  const codeRe = /\b(\d{4,8})\b/;

  while (Date.now() < deadline) {
    const client = new ImapFlow({ ...config, logger: false });
    await client.connect();
    try {
      const lock = await client.getMailboxLock('INBOX');
      try {
        const since = new Date(Date.now() - 10 * 60_000);
        const uids = await client.search({ since });
        const recent = (uids || []).slice(-15).reverse();
        for (const uid of recent) {
          const msg = await client.fetchOne(uid, { source: true });
          if (!msg?.source) continue;
          const parsed = await simpleParser(msg.source);
          const from = parsed.from?.text?.toLowerCase() ?? '';
          const subject = parsed.subject?.toLowerCase() ?? '';
          if (senderHint) {
            const hint = senderHint.toLowerCase();
            if (!from.includes(hint) && !subject.includes(hint)) continue;
          }
          const haystack = `${parsed.subject ?? ''}\n${parsed.text ?? ''}`;
          const m = haystack.match(codeRe);
          if (m) return `Code: ${m[1]} (from: ${parsed.from?.text ?? '?'}, subject: ${parsed.subject ?? '?'})`;
        }
      } finally {
        lock.release();
      }
    } finally {
      await client.logout().catch(() => {});
    }
    await new Promise((r) => setTimeout(r, 5000));
  }
  return null;
}
