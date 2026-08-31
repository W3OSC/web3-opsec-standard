// Applies "drifted" findings back to guide markdown deterministically.
//
// The verifier's suggested_text is the corrected item text (everything after "- [ ] ").
// We re-parse each guide, match findings to items by stable item id, and rewrite the line
// preserving its original indentation/checkbox prefix. Anything that can't be applied
// mechanically (missing items, structural moves) is returned for the manual-review list.

import fs from 'node:fs';
import { loadAllGuides } from './guides.js';

export function applyFindings(results, { write = false } = {}) {
  const guidesById = new Map(loadAllGuides().map((g) => [g.id, g]));
  const applied = [];
  const unapplied = [];

  const byGuide = new Map();
  for (const r of results) {
    for (const f of r.findings) {
      if (f.status !== 'drifted' || !f.suggested_text) continue;
      if (!byGuide.has(r.guide_id)) byGuide.set(r.guide_id, []);
      byGuide.get(r.guide_id).push({ run: r, finding: f });
    }
  }

  for (const [guideId, entries] of byGuide) {
    const guide = guidesById.get(guideId);
    if (!guide) {
      for (const e of entries) unapplied.push({ ...e, reason: `guide ${guideId} not found` });
      continue;
    }
    const itemsById = new Map(guide.items.map((i) => [i.id, i]));
    const lines = guide.content.split('\n');
    let changed = false;

    for (const entry of entries) {
      const { finding } = entry;
      const item = itemsById.get(finding.item_id);
      if (!item) {
        unapplied.push({ ...entry, reason: 'item no longer present in guide (edited since run?)' });
        continue;
      }
      const lineIdx = item.line - 1;
      const current = lines[lineIdx];
      if (!current.includes(item.text)) {
        unapplied.push({ ...entry, reason: `line ${item.line} changed since run` });
        continue;
      }
      const suggested = finding.suggested_text.trim().replace(/^-?\s*\[[ xX]\]\s*/, '');
      lines[lineIdx] = `${item.prefix}${suggested}`;
      applied.push({
        guide_path: guide.relPath,
        line: item.line,
        before: item.text,
        after: suggested,
      });
      changed = true;
    }

    if (changed && write) {
      fs.writeFileSync(guide.file, lines.join('\n'));
    }
  }

  return { applied, unapplied, wrote: write };
}
