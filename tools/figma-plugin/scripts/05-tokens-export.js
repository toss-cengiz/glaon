// Glaon — 05 Tokens Export
//
// Reads the `Primitives` and `Semantic` Variables collections (Theme:
// Light/Dark modes) from the current Figma file and emits Style
// Dictionary–compatible JSON for `packages/ui/tokens/`. Read-only:
// no mutation, no network. Idempotent — same Figma state, same output.
//
// Output (3 files via the iframe UI):
//   - primitives.json        — raw scales (color/space/radius/shadow);
//                              uses Light mode for primitives that have
//                              a Theme axis (most do not).
//   - semantic.light.json    — Semantic role bindings in Light mode.
//                              Each value is either a `{primitive.path}`
//                              reference or a literal.
//   - semantic.dark.json     — Same structure, Dark mode bindings.
//
// Usage:
//   1. Copy this file's contents into tools/figma-plugin/code.js.
//   2. Open the Design System Figma file (variables source-of-truth).
//   3. Run plugin: Plugins → Development → Glaon.
//   4. Iframe opens: per file, click `Copy` (paste into the matching
//      packages/ui/tokens/<name>.json) or `Download`.
//   5. Commit the 3 files. F2 (Style Dictionary build) consumes them.
//   6. `git restore tools/figma-plugin/code.js` to scaffold.
//
// Schema (Style Dictionary v3-compatible, plain shape — not DTCG):
//   { "<seg1>": { "<seg2>": { "value": "...", "type": "color" } } }
// Variable name "color/sand-100" → path color.sand-100 → key chain
//   color.sand-100. Aliases serialize as `{<target.path>}`.

(async () => {
  try {
    const collections = await figma.variables.getLocalVariableCollectionsAsync();
    const primitivesCol = collections.find((c) => c.name === 'Primitives');
    const semanticCol = collections.find((c) => c.name === 'Semantic');

    if (!primitivesCol || !semanticCol) {
      throw new Error(
        'Missing Primitives and/or Semantic collection. Run 01-variables-bootstrap.js first.',
      );
    }

    const lightOf = (col) => {
      const m = col.modes.find((x) => /light/i.test(x.name));
      return m ? m.modeId : null;
    };
    const darkOf = (col) => {
      const m = col.modes.find((x) => /dark/i.test(x.name));
      return m ? m.modeId : null;
    };

    const primLight = lightOf(primitivesCol);
    const primDark = darkOf(primitivesCol);
    const semLight = lightOf(semanticCol);
    const semDark = darkOf(semanticCol);

    if (!primLight || !semLight) {
      throw new Error('Missing `Light` mode in Primitives or Semantic collection.');
    }

    // Cache resolved Variables by id so alias lookups are O(1) and async-safe.
    const byId = new Map();
    const collectIds = [...primitivesCol.variableIds, ...semanticCol.variableIds];
    for (const id of collectIds) {
      const v = await figma.variables.getVariableByIdAsync(id);
      if (v) byId.set(id, v);
    }

    const primitivesJson = {};
    for (const id of primitivesCol.variableIds) {
      const v = byId.get(id);
      if (!v) continue;
      const value = v.valuesByMode[primLight];
      const tokenValue = await renderTokenValue(value, v.resolvedType);
      setPath(primitivesJson, v.name, {
        value: tokenValue,
        type: mapType(v.resolvedType),
      });
    }

    const semanticLightJson = buildSemanticDoc(semanticCol, byId, semLight);
    const semanticDarkJson = semDark
      ? buildSemanticDoc(semanticCol, byId, semDark)
      : { __note: 'Dark mode missing on Semantic collection — nothing to emit.' };

    const files = [
      {
        name: 'primitives.json',
        body: JSON.stringify(primitivesJson, null, 2) + '\n',
      },
      {
        name: 'semantic.light.json',
        body: JSON.stringify(semanticLightJson, null, 2) + '\n',
      },
      {
        name: 'semantic.dark.json',
        body: JSON.stringify(semanticDarkJson, null, 2) + '\n',
      },
    ];

    const stats = `primitives: ${Object.keys(primitivesJson).length} top-level · semantic.light: ${
      Object.keys(semanticLightJson).length
    } · semantic.dark: ${Object.keys(semanticDarkJson).length}`;

    figma.showUI(buildUiHtml(files, stats), {
      width: 720,
      height: 580,
      themeColors: true,
      title: 'Glaon — Tokens Export',
    });
    figma.ui.onmessage = (msg) => {
      if (msg && msg.type === 'close') figma.closePlugin('Tokens export closed.');
    };
  } catch (err) {
    figma.notify(`Glaon tokens-export error: ${err.message}`, { error: true });
    figma.closePlugin();
    throw err;
  }
})();

function buildSemanticDoc(col, byId, modeId) {
  const out = {};
  for (const id of col.variableIds) {
    const v = byId.get(id);
    if (!v) continue;
    const value = v.valuesByMode[modeId];
    const tokenValue = renderTokenValueSync(value, v.resolvedType, byId);
    setPath(out, v.name, { value: tokenValue, type: mapType(v.resolvedType) });
  }
  return out;
}

async function renderTokenValue(value, figmaType) {
  // Async path used for primitives — alias lookup may need an extra fetch.
  if (value && typeof value === 'object' && value.type === 'VARIABLE_ALIAS') {
    const target = await figma.variables.getVariableByIdAsync(value.id);
    if (!target) return null;
    return `{${target.name.replace(/\//g, '.')}}`;
  }
  if (figmaType === 'COLOR') return rgbaToHex(value);
  return value;
}

function renderTokenValueSync(value, figmaType, byId) {
  // Semantic doc uses the cached map; targets are guaranteed loaded.
  if (value && typeof value === 'object' && value.type === 'VARIABLE_ALIAS') {
    const target = byId.get(value.id);
    if (!target) return null;
    return `{${target.name.replace(/\//g, '.')}}`;
  }
  if (figmaType === 'COLOR') return rgbaToHex(value);
  return value;
}

function rgbaToHex(c) {
  if (!c) return null;
  const ch = (n) =>
    Math.round((n || 0) * 255)
      .toString(16)
      .padStart(2, '0');
  const hex = `#${ch(c.r)}${ch(c.g)}${ch(c.b)}`;
  if (c.a === undefined || c.a === 1) return hex;
  return `${hex}${ch(c.a)}`;
}

function mapType(figmaType) {
  switch (figmaType) {
    case 'COLOR':
      return 'color';
    case 'FLOAT':
      return 'dimension';
    case 'STRING':
      return 'string';
    case 'BOOLEAN':
      return 'boolean';
    default:
      return 'string';
  }
}

function setPath(obj, path, leaf) {
  const parts = path.split('/');
  let cur = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const key = parts[i];
    if (!cur[key] || typeof cur[key] !== 'object' || 'value' in cur[key]) {
      cur[key] = {};
    }
    cur = cur[key];
  }
  cur[parts[parts.length - 1]] = leaf;
}

function buildUiHtml(files, stats) {
  const sections = files
    .map(
      (f, i) => `
    <section>
      <header>
        <h2>${f.name}</h2>
        <div class="actions">
          <button data-copy="${i}">Copy</button>
          <button data-download="${i}">Download</button>
        </div>
      </header>
      <pre>${escapeHtml(f.body)}</pre>
    </section>`,
    )
    .join('');
  const filesJson = JSON.stringify(files);
  return `<!doctype html><html><head><meta charset="utf-8"><style>
    body { font-family: 'Inter', system-ui, sans-serif; margin: 0; padding: 12px; background: #f5f5f5; color: #111; font-size: 12px; }
    .stats { padding: 6px 10px; background: #fff; border: 1px solid #e5e5e5; border-radius: 6px; margin-bottom: 12px; font-size: 11px; color: #525252; }
    section { background: #fff; border: 1px solid #e5e5e5; border-radius: 6px; margin-bottom: 12px; overflow: hidden; }
    header { display: flex; align-items: center; justify-content: space-between; padding: 8px 12px; background: #fafafa; border-bottom: 1px solid #e5e5e5; }
    header h2 { margin: 0; font-size: 13px; font-weight: 600; }
    .actions { display: flex; gap: 6px; }
    button { font-family: inherit; font-size: 11px; border: 1px solid #d4d4d4; background: #fff; border-radius: 4px; padding: 4px 10px; cursor: pointer; }
    button:hover { background: #f0f0f0; }
    pre { margin: 0; padding: 12px; max-height: 180px; overflow: auto; font-family: 'SF Mono', Menlo, Consolas, monospace; font-size: 11px; line-height: 1.5; white-space: pre; }
    .footer { padding: 8px 0 0; text-align: right; }
    .close { background: #18181b; color: #fff; border-color: #18181b; }
  </style></head><body>
    <div class="stats">${escapeHtml(stats)}</div>
    ${sections}
    <div class="footer"><button class="close" id="close">Close</button></div>
    <script>
      const files = ${filesJson};
      document.querySelectorAll('[data-copy]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const idx = Number(btn.dataset.copy);
          navigator.clipboard.writeText(files[idx].body).then(() => {
            const orig = btn.textContent;
            btn.textContent = 'Copied!';
            setTimeout(() => (btn.textContent = orig), 1200);
          });
        });
      });
      document.querySelectorAll('[data-download]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const idx = Number(btn.dataset.download);
          const f = files[idx];
          const blob = new Blob([f.body], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = f.name;
          a.click();
          URL.revokeObjectURL(url);
        });
      });
      document.getElementById('close').addEventListener('click', () => {
        parent.postMessage({ pluginMessage: { type: 'close' } }, '*');
      });
    </script>
  </body></html>`;
}

function escapeHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
