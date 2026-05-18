#!/usr/bin/env node
/**
 * W3OS content validator.
 * Validates guide markdown files against schema/guide-metadata.schema.json
 * and requirement markdown files for correct SP-XX-NNN formatting.
 * Reports all errors and exits non-zero if any are found.
 *
 * Usage: node scripts/validate.js
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const GUIDES_DIR = path.join(ROOT, 'guides');
const REQUIREMENTS_DIR = path.join(ROOT, 'requirements');

const VALID_TYPES = ['CONFIGURATION', 'GUIDE'];
const VALID_SCOPES = ['INDIVIDUAL', 'ORGANIZATION'];
const ID_PATTERN = /^[a-z0-9][a-z0-9-]*[a-z0-9]$|^[a-z0-9]$/;
const REQUIREMENT_ID_PATTERN = /^SP-[A-Z]+-\d{3}$/;

let errors = [];
let warnings = [];

function error(file, msg) {
  errors.push(`  [ERROR] ${file}: ${msg}`);
}

function warn(file, msg) {
  warnings.push(`  [WARN]  ${file}: ${msg}`);
}

// ── Utilities ──────────────────────────────────────────────────────────────

function getAllFiles(dir, ext = '.md') {
  if (!fs.existsSync(dir)) return [];
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) results.push(...getAllFiles(full, ext));
    else if (entry.isFile() && entry.name.endsWith(ext)) results.push(full);
  }
  return results;
}

function parseHtmlCommentMetadata(content) {
  const result = {};
  const pattern = /<!--\s*([\s\S]*?)\s*-->/g;
  let match;
  while ((match = pattern.exec(content)) !== null) {
    const commentContent = match[1];
    const lines = commentContent.includes('\n')
      ? commentContent.split('\n')
      : [commentContent];
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      const colonIdx = trimmed.indexOf(':');
      if (colonIdx === -1) continue;
      const key = trimmed.substring(0, colonIdx).trim();
      let value = trimmed.substring(colonIdx + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (!result[key]) result[key] = value;
    }
  }
  return Object.keys(result).length > 0 ? result : null;
}

function countChecklistItems(content) {
  return (content.match(/^[ \t]*- \[ \]/gm) || []).length;
}

// ── Guide validation ───────────────────────────────────────────────────────

function validateGuides() {
  console.log('\nValidating guides...');
  const files = getAllFiles(GUIDES_DIR);
  const seenIds = new Map(); // id → first file

  for (const file of files) {
    const rel = path.relative(ROOT, file);
    const content = fs.readFileSync(file, 'utf8');
    const meta = parseHtmlCommentMetadata(content);

    if (!meta) {
      error(rel, 'missing HTML comment metadata block (id, type, scope required)');
      continue;
    }

    // id
    if (!meta.id) {
      error(rel, 'metadata missing required field: id');
    } else if (!ID_PATTERN.test(meta.id)) {
      error(rel, `id "${meta.id}" must be kebab-case (lowercase letters, digits, hyphens only)`);
    } else if (seenIds.has(meta.id)) {
      error(rel, `duplicate id "${meta.id}" - already used by ${seenIds.get(meta.id)}`);
    } else {
      seenIds.set(meta.id, rel);
    }

    // type
    if (!meta.type) {
      error(rel, 'metadata missing required field: type');
    } else if (!VALID_TYPES.includes(meta.type)) {
      error(rel, `type "${meta.type}" is invalid. Must be one of: ${VALID_TYPES.join(', ')}`);
    }

    // scope
    if (!meta.scope) {
      error(rel, 'metadata missing required field: scope');
    } else if (!VALID_SCOPES.includes(meta.scope)) {
      error(rel, `scope "${meta.scope}" is invalid. Must be one of: ${VALID_SCOPES.join(', ')}`);
    }

    // checklist items
    const checklistCount = countChecklistItems(content);
    if (checklistCount === 0) {
      error(rel, 'no checklist items found (- [ ] ...) - sync will skip this guide');
    }

    // title presence
    const hasTitle =
      /<h1[^>]*>[^<]+<\/h1>/.test(content) ||
      /<h2[^>]*>.*?Configuration Guide<\/h2>/.test(content) ||
      /^# .+/m.test(content);
    if (!hasTitle) {
      warn(rel, 'no title found (<h1>, <h2> Configuration Guide, or # heading)');
    }
  }

  console.log(`  Scanned ${files.length} guide file(s). Found ${seenIds.size} unique IDs.`);
}

// ── Requirements validation ────────────────────────────────────────────────

function validateRequirements() {
  console.log('\nValidating requirements...');
  const files = getAllFiles(REQUIREMENTS_DIR);
  const DOMAIN_FILE_PATTERN = /^\d{2}-[a-z0-9-]+\.md$/;

  for (const file of files) {
    const rel = path.relative(ROOT, file);
    const filename = path.basename(file);

    if (!DOMAIN_FILE_PATTERN.test(filename)) {
      warn(rel, `filename does not match expected pattern NN-slug.md`);
    }

    const content = fs.readFileSync(file, 'utf8');
    const seenReqIds = new Set();
    let reqCount = 0;

    for (const match of content.matchAll(/^\*\*(SP-[A-Z]+-\d+): ([^*]+)\*\*/gm)) {
      const reqId = match[1];
      reqCount++;

      if (!REQUIREMENT_ID_PATTERN.test(reqId)) {
        error(rel, `requirement ID "${reqId}" does not match SP-XX-NNN pattern`);
      }
      if (seenReqIds.has(reqId)) {
        error(rel, `duplicate requirement ID "${reqId}"`);
      }
      seenReqIds.add(reqId);
    }

    if (reqCount === 0) {
      warn(rel, 'no requirements found (**SP-XX-NNN: ...**) - file may be empty or malformed');
    } else {
      console.log(`  ${filename}: ${reqCount} requirement(s)`);
    }

    // Check each requirement has at least one bullet point following it
    const lines = content.split('\n');
    let inReq = false;
    let bulletCount = 0;
    let lastReqId = '';
    for (const line of lines) {
      const trimmed = line.trim();
      const reqMatch = trimmed.match(/^\*\*(SP-[A-Z]+-\d+): [^*]+\*\*/);
      if (reqMatch) {
        if (inReq && bulletCount === 0) {
          error(rel, `requirement "${lastReqId}" has no control points (bullet points)`);
        }
        lastReqId = reqMatch[1];
        bulletCount = 0;
        inReq = true;
        continue;
      }
      if (inReq && trimmed.startsWith('- ')) {
        bulletCount++;
        continue;
      }
      if (inReq && (trimmed === '' || trimmed.startsWith('#'))) {
        if (bulletCount === 0) {
          error(rel, `requirement "${lastReqId}" has no control points (bullet points)`);
        }
        inReq = false;
      }
    }
    if (inReq && bulletCount === 0) {
      error(rel, `requirement "${lastReqId}" has no control points (bullet points)`);
    }
  }

  console.log(`  Scanned ${files.length} requirement file(s).`);
}

// ── Run ────────────────────────────────────────────────────────────────────

validateGuides();
validateRequirements();

console.log('');
if (warnings.length > 0) {
  console.log(`Warnings (${warnings.length}):`);
  warnings.forEach(w => console.log(w));
  console.log('');
}

if (errors.length > 0) {
  console.error(`Validation FAILED - ${errors.length} error(s):`);
  errors.forEach(e => console.error(e));
  process.exit(1);
} else {
  console.log(`Validation PASSED - no errors found.`);
}
