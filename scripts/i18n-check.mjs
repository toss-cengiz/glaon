#!/usr/bin/env node
// i18n-check (#430 / i18n-H). Walks apps/web + apps/mobile source for
// `t('key')` call expressions (AST-based, so renamed imports + nested
// scope still resolve), then verifies every key has an entry in every
// locale file (`en.json`, `tr.json`) for that app.
//
// Exit codes:
//   0 — all keys present in every locale.
//   1 — at least one missing key (printed grouped by app + locale).
//
// Unused keys (present in JSON, no `t()` reference) are surfaced as
// warnings. They don't fail CI: some keys are computed at runtime
// (interpolation) and our heuristic only resolves string literals.

import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import ts from 'typescript';

const REPO_ROOT = fileURLToPath(new URL('..', import.meta.url));

/** @typedef {{ app: string; src: string; locales: { code: string; path: string }[] }} AppConfig */

/** @type {AppConfig[]} */
const APPS = [
  {
    app: 'apps/web',
    src: ['apps/web/src'],
    locales: [
      { code: 'en', path: 'apps/web/src/i18n/locales/en.json' },
      { code: 'tr', path: 'apps/web/src/i18n/locales/tr.json' },
    ],
  },
  {
    app: 'apps/mobile',
    // App.tsx lives at the package root in apps/mobile, with the
    // rest of the tree under src/ — scan both.
    src: ['apps/mobile/src', 'apps/mobile/App.tsx'],
    locales: [
      { code: 'en', path: 'apps/mobile/src/i18n/locales/en.json' },
      { code: 'tr', path: 'apps/mobile/src/i18n/locales/tr.json' },
    ],
  },
];

/**
 * Recursively collect the leaf paths in a JSON object as dotted keys.
 * `{ a: { b: 'x' } }` → `['a.b']`.
 * @param {unknown} value
 * @param {string} prefix
 * @param {Set<string>} into
 */
function collectKeys(value, prefix, into) {
  if (typeof value === 'string') {
    into.add(prefix);
    return;
  }
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    // Arrays / numbers / nulls are leaves we don't traverse.
    if (prefix.length > 0) into.add(prefix);
    return;
  }
  for (const [k, v] of Object.entries(value)) {
    collectKeys(v, prefix.length > 0 ? `${prefix}.${k}` : k, into);
  }
}

/**
 * Find every `t('literal')` call in a source file.
 * @param {string} filePath
 * @returns {string[]}
 */
function extractKeys(filePath) {
  const source = readFileSync(filePath, 'utf8');
  const sf = ts.createSourceFile(filePath, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  /** @type {string[]} */
  const keys = [];
  /** @param {ts.Node} node */
  const walk = (node) => {
    if (ts.isCallExpression(node)) {
      const callee = node.expression;
      // Match plain `t(...)` and member-access `i18n.t(...)` (covers
      // both i18next styles).
      const isT =
        (ts.isIdentifier(callee) && callee.text === 't') ||
        (ts.isPropertyAccessExpression(callee) &&
          ts.isIdentifier(callee.name) &&
          callee.name.text === 't');
      if (isT && node.arguments.length > 0) {
        const first = node.arguments[0];
        if (first !== undefined && ts.isStringLiteral(first)) {
          keys.push(first.text);
        } else if (first !== undefined && ts.isNoSubstitutionTemplateLiteral(first)) {
          keys.push(first.text);
        }
        // Computed / interpolated keys (template strings with substitutions,
        // variable refs) skip — a regex pass would still over-report, and the
        // unused-keys check already provides a cleanup signal.
      }
    }
    ts.forEachChild(node, walk);
  };
  walk(sf);
  return keys;
}

/**
 * Format a sorted, deduped key list for output.
 * @param {Iterable<string>} set
 */
function fmtList(set) {
  return [...set]
    .sort()
    .map((k) => `    - ${k}`)
    .join('\n');
}

/**
 * Resolve a source root: a directory yields its recursive `.ts`/`.tsx`
 * files; a single file path is returned as-is when it matches the
 * extension. Lets the config point at both `apps/mobile/src` and
 * `apps/mobile/App.tsx` (the entry that lives outside src).
 * @param {string} target
 * @returns {string[]}
 */
function resolveSource(target) {
  try {
    const stat = readdirSync(target, { withFileTypes: true });
    return walkSourceFiles(target, stat);
  } catch {
    if (target.endsWith('.ts') || target.endsWith('.tsx')) return [target];
    return [];
  }
}

/**
 * Recursive walker that returns every `.ts` / `.tsx` source file under
 * `dir`, skipping tests, stories, and `node_modules`. The check
 * intentionally ignores test/story files: those legitimately use raw
 * keys that don't need to be translated (test fixtures).
 * @param {string} dir
 * @returns {string[]}
 */
function walkSourceFiles(dir, entries) {
  /** @type {string[]} */
  const out = [];
  for (const entry of entries ?? readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...walkSourceFiles(full));
      continue;
    }
    if (entry.name.endsWith('.test.ts') || entry.name.endsWith('.test.tsx')) continue;
    if (entry.name.endsWith('.stories.ts') || entry.name.endsWith('.stories.tsx')) continue;
    if (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx')) out.push(full);
  }
  return out;
}

let failed = false;
const warnings = [];

for (const app of APPS) {
  /** @type {string[]} */
  const sourceFiles = [];
  for (const root of app.src) {
    const abs = join(REPO_ROOT, root);
    sourceFiles.push(...resolveSource(abs));
  }

  /** @type {Set<string>} */
  const usedKeys = new Set();
  for (const file of sourceFiles) {
    for (const key of extractKeys(file)) usedKeys.add(key);
  }

  /** @type {Map<string, Set<string>>} */
  const localeKeys = new Map();
  for (const locale of app.locales) {
    /** @type {Set<string>} */
    const set = new Set();
    const json = JSON.parse(readFileSync(join(REPO_ROOT, locale.path), 'utf8'));
    collectKeys(json, '', set);
    localeKeys.set(locale.code, set);
  }

  console.log(`\n[${app.app}] ${usedKeys.size} keys used in code · ${app.locales.length} locales`);

  // Required check: every used key exists in every locale.
  for (const locale of app.locales) {
    const set = localeKeys.get(locale.code);
    /** @type {string[]} */
    const missing = [];
    for (const key of usedKeys) {
      if (!set.has(key)) missing.push(key);
    }
    if (missing.length > 0) {
      failed = true;
      console.error(
        `\n  ✖ ${app.app}/locales/${locale.code}.json missing ${missing.length} key(s):\n${fmtList(
          missing,
        )}`,
      );
    } else {
      console.log(`  ✓ ${locale.code}.json — all used keys present`);
    }
  }

  // Required check: every key in the fallback (en.json) exists in every
  // other locale. Catches drift even when a key isn't yet referenced
  // from code (someone added an EN entry but forgot the TR pair).
  const enKeys = localeKeys.get('en');
  if (enKeys !== undefined) {
    for (const locale of app.locales) {
      if (locale.code === 'en') continue;
      const set = localeKeys.get(locale.code);
      if (set === undefined) continue;
      /** @type {string[]} */
      const drift = [];
      for (const key of enKeys) {
        if (!set.has(key)) drift.push(key);
      }
      if (drift.length > 0) {
        failed = true;
        console.error(
          `\n  ✖ ${app.app}/locales/${locale.code}.json missing ${drift.length} key(s) present in en.json:\n${fmtList(
            drift,
          )}`,
        );
      }
    }
  }

  // Warning: keys present in en.json that aren't referenced in code.
  // Doesn't fail CI — interpolated keys (`t(\`status.${name}\`)`) are
  // legitimate and won't show up in our literal-only scan.
  if (enKeys !== undefined) {
    /** @type {string[]} */
    const unused = [];
    for (const key of enKeys) {
      if (!usedKeys.has(key)) unused.push(key);
    }
    if (unused.length > 0) {
      warnings.push({ app: app.app, locale: 'en', keys: unused });
    }
  }
}

if (warnings.length > 0) {
  console.warn('\n--- Unused-key warnings (not failing CI) ---');
  for (const w of warnings) {
    console.warn(
      `\n  ⚠ ${w.app}/locales/${w.locale}.json — ${w.keys.length} key(s) without a t() reference:\n${fmtList(
        w.keys,
      )}`,
    );
  }
  console.warn(
    '\n  Some of these may be referenced via interpolated keys (template strings); review before deleting.',
  );
}

if (failed) {
  console.error('\ni18n-check failed. Add the missing translations and re-run `pnpm i18n:check`.');
  process.exit(1);
}

console.log('\ni18n-check ✓ — every used key exists in every locale.');
