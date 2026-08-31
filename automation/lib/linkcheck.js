// Zero-cost staleness signal: checks that every external URL referenced by the guides
// still resolves. Dead vendor doc links are usually the first symptom of a renamed or
// removed feature.

import { loadAllGuides } from './guides.js';

const URL_RE = /https?:\/\/[^\s)"'<>\]]+/g;
const TIMEOUT_MS = 15_000;
const UA =
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36 W3OS-linkcheck';

function cleanUrl(url) {
  return url.replace(/[.,;:!?]+$/, '');
}

async function checkUrl(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    let res = await fetch(url, {
      method: 'HEAD',
      redirect: 'follow',
      signal: controller.signal,
      headers: { 'user-agent': UA },
    });
    if (!res.ok) {
      // Many sites reject or 404 HEAD requests; always retry with GET before judging.
      res = await fetch(url, {
        method: 'GET',
        redirect: 'follow',
        signal: controller.signal,
        headers: { 'user-agent': UA },
      });
    }
    if (res.ok) return { ok: true, status: res.status };
    // Bot walls (403/429/503 from CDNs) are warnings, not dead links.
    if ([401, 403, 429, 503, 999].includes(res.status)) {
      return { ok: true, warn: true, status: res.status };
    }
    return { ok: false, status: res.status };
  } catch (err) {
    return { ok: false, status: 0, error: err.name === 'AbortError' ? 'timeout' : err.message };
  } finally {
    clearTimeout(timer);
  }
}

export async function runLinkcheck({ concurrency = 8 } = {}) {
  const guides = loadAllGuides();
  const targets = new Map(); // url -> [{guide, line}]
  for (const guide of guides) {
    guide.content.split('\n').forEach((line, i) => {
      for (const raw of line.match(URL_RE) ?? []) {
        const url = cleanUrl(raw);
        if (url.includes('img.shields.io')) continue;
        if (!targets.has(url)) targets.set(url, []);
        targets.get(url).push({ guide: guide.relPath, line: i + 1 });
      }
    });
  }

  const urls = [...targets.keys()];
  const results = [];
  let idx = 0;
  async function worker() {
    while (idx < urls.length) {
      const url = urls[idx++];
      const check = await checkUrl(url);
      results.push({ url, refs: targets.get(url), ...check });
    }
  }
  await Promise.all(Array.from({ length: concurrency }, worker));

  const dead = results.filter((r) => !r.ok);
  const warned = results.filter((r) => r.ok && r.warn);
  return { total: urls.length, dead, warned, results };
}

export function linkcheckMarkdown({ total, dead, warned }) {
  const lines = ['# Guide link check', '', `Checked ${total} unique URLs.`, ''];
  if (!dead.length) lines.push('No dead links found.');
  else {
    lines.push(`## Dead links (${dead.length})`, '');
    for (const d of dead) {
      lines.push(`- ${d.url} (${d.error ?? `HTTP ${d.status}`})`);
      for (const ref of d.refs) lines.push(`  - ${ref.guide}:${ref.line}`);
    }
  }
  if (warned.length) {
    lines.push('', `## Bot-walled (verify manually) (${warned.length})`, '');
    for (const w of warned) lines.push(`- ${w.url} (HTTP ${w.status})`);
  }
  return lines.join('\n') + '\n';
}
