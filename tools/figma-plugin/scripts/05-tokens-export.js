// Glaon — 05 Tokens Export
//
// Reads ALL local Variables collections from the current Figma file
// and emits one Style Dictionary–compatible JSON per (collection,
// mode). Read-only: no mutation, no network. Idempotent — same Figma
// state, same output.
//
// Filename rule:
//   - Single-mode collection → `<collection>.json`
//   - Multi-mode collection  → `<collection>.<mode>.json`
//   Names are kebab-cased (`Brand Primitives` → `brand-primitives`).
//
// Schema (Style Dictionary v3-compatible plain shape — not DTCG):
//   { "<seg1>": { "<seg2>": { "value": "...", "type": "color" } } }
//   Aliases resolve to `{<target.collection>.<path>}` references with
//   the target collection prefix so cross-collection references stay
//   unambiguous when Style Dictionary loads multiple files together.
//
// Usage:
//   1. Copy this file's contents into tools/figma-plugin/code.js.
//   2. Open the Design System Figma file (variables source-of-truth).
//   3. Run plugin: Plugins → Development → Glaon.
//   4. Iframe lists every collection × mode found, with file body and
//      Copy + Download buttons. Save the relevant files into
//      `packages/ui/tokens/` and commit them.
//   5. `git restore tools/figma-plugin/code.js` to scaffold.

(async () => {
  try {
    const collections = await figma.variables.getLocalVariableCollectionsAsync();
    if (!collections.length) {
      throw new Error('No local Variable collections in this file.');
    }

    // Cache every variable across every collection so alias targets
    // (which may live in another collection) resolve cleanly.
    const byId = new Map();
    const collectionByVarId = new Map();
    for (const col of collections) {
      for (const id of col.variableIds) {
        const v = await figma.variables.getVariableByIdAsync(id);
        if (!v) continue;
        byId.set(id, v);
        collectionByVarId.set(id, col);
      }
    }

    const files = [];
    const inventory = [];

    for (const col of collections) {
      const modes = col.modes;
      const colSlug = kebab(col.name);
      const multiMode = modes.length > 1;

      inventory.push({
        collection: col.name,
        slug: colSlug,
        modes: modes.map((m) => m.name),
        variableCount: col.variableIds.length,
      });

      for (const mode of modes) {
        const doc = {};
        for (const id of col.variableIds) {
          const v = byId.get(id);
          if (!v) continue;
          const value = v.valuesByMode[mode.modeId];
          const tokenValue = renderTokenValue(value, v.resolvedType, byId, collectionByVarId);
          setPath(doc, v.name, { value: tokenValue, type: mapType(v.resolvedType) });
        }
        const fileName = multiMode ? `${colSlug}.${kebab(mode.name)}.json` : `${colSlug}.json`;
        files.push({
          name: fileName,
          collection: col.name,
          mode: mode.name,
          variableCount: col.variableIds.length,
          body: JSON.stringify(doc, null, 2) + '\n',
        });
        // Single-mode collection: only emit once.
        if (!multiMode) break;
      }
    }

    figma.showUI(buildUiHtml(files, inventory), {
      width: 760,
      height: 600,
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

function renderTokenValue(value, figmaType, byId, collectionByVarId) {
  if (value && typeof value === 'object' && value.type === 'VARIABLE_ALIAS') {
    const target = byId.get(value.id);
    if (!target) return null;
    const targetCol = collectionByVarId.get(value.id);
    const colPrefix = targetCol ? `${kebab(targetCol.name)}.` : '';
    return `{${colPrefix}${target.name.replace(/\//g, '.')}}`;
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

function kebab(s) {
  return String(s)
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .toLowerCase();
}

function buildUiHtml(files, inventory) {
  const inventoryRows = inventory
    .map(
      (i) =>
        `<tr><td>${escapeHtml(i.collection)}</td><td>${escapeHtml(
          i.modes.join(', '),
        )}</td><td>${i.variableCount}</td></tr>`,
    )
    .join('');

  const sections = files
    .map(
      (f, i) => `
    <section>
      <header>
        <h2>${escapeHtml(f.name)}</h2>
        <div class="meta">${escapeHtml(f.collection)} · ${escapeHtml(f.mode)} · ${f.variableCount} vars</div>
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
    .inventory { background: #fff; border: 1px solid #e5e5e5; border-radius: 6px; margin-bottom: 12px; padding: 8px 12px; }
    .inventory h3 { margin: 0 0 6px; font-size: 12px; font-weight: 600; }
    table { width: 100%; border-collapse: collapse; font-size: 11px; }
    th, td { text-align: left; padding: 4px 6px; border-bottom: 1px solid #f0f0f0; }
    th { color: #525252; font-weight: 500; }
    section { background: #fff; border: 1px solid #e5e5e5; border-radius: 6px; margin-bottom: 12px; overflow: hidden; }
    header { display: flex; align-items: center; gap: 8px; padding: 8px 12px; background: #fafafa; border-bottom: 1px solid #e5e5e5; }
    header h2 { margin: 0; font-size: 13px; font-weight: 600; flex: 0 0 auto; }
    header .meta { flex: 1; font-size: 11px; color: #525252; }
    .actions { display: flex; gap: 6px; }
    button { font-family: inherit; font-size: 11px; border: 1px solid #d4d4d4; background: #fff; border-radius: 4px; padding: 4px 10px; cursor: pointer; }
    button:hover { background: #f0f0f0; }
    pre { margin: 0; padding: 12px; max-height: 200px; overflow: auto; font-family: 'SF Mono', Menlo, Consolas, monospace; font-size: 11px; line-height: 1.5; white-space: pre; }
    .footer { padding: 8px 0 0; text-align: right; }
    .close { background: #18181b; color: #fff; border-color: #18181b; }
  </style></head><body>
    <div class="inventory">
      <h3>Discovered collections (${inventory.length})</h3>
      <table>
        <thead><tr><th>Collection</th><th>Modes</th><th>Variables</th></tr></thead>
        <tbody>${inventoryRows}</tbody>
      </table>
    </div>
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
