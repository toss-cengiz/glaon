// Glaon — 05 Tokens Export
//
// Reads ALL local design-token sources from the current Figma file
// and emits Style Dictionary–compatible JSON. Read-only: no mutation,
// no network. Idempotent — same Figma state, same output.
//
// Sources covered:
//   1. Variables collections — one JSON per (collection × mode).
//      Filename: `<collection>.json` (single-mode) or
//      `<collection>.<mode>.json` (multi-mode), both kebab-cased.
//   2. Local Paint Styles  → `paint-styles.json`  (color tokens)
//   3. Local Effect Styles → `effect-styles.json` (shadow tokens)
//   4. Local Text Styles   → `text-styles.json`   (typography tokens)
//
// Most Glaon Figma files keep brand colors as **Paint Styles** (not
// Variables) and shadows/typography as Effect/Text Styles, so this
// script must cover both stores.
//
// Schema (Style Dictionary v3-compatible plain shape — not DTCG):
//   { "<seg1>": { "<seg2>": { "value": "...", "type": "color" } } }
//   Variable aliases serialize as `{<target-collection>.<path>}` with
//   the target collection prefix so cross-collection references stay
//   unambiguous when Style Dictionary loads multiple files.
//
// Usage:
//   1. Copy this file's contents into tools/figma-plugin/code.js.
//   2. Open the Figma file (Brand Guideline or Design System).
//   3. Run plugin: Plugins → Development → Glaon.
//   4. Iframe lists every source found, with file body and Copy +
//      Download buttons. Save the relevant files into
//      `packages/ui/tokens/` and commit them.
//   5. `git restore tools/figma-plugin/code.js` to scaffold.

(async () => {
  try {
    const collections = await figma.variables.getLocalVariableCollectionsAsync();
    const paintStyles = await figma.getLocalPaintStylesAsync();
    const effectStyles = await figma.getLocalEffectStylesAsync();
    const textStyles = await figma.getLocalTextStylesAsync();

    if (!collections.length && !paintStyles.length && !effectStyles.length && !textStyles.length) {
      throw new Error('No Variables, Paint Styles, Effect Styles, or Text Styles in this file.');
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

    // --- Variables: one file per (collection × mode) ---
    for (const col of collections) {
      const modes = col.modes;
      const colSlug = kebab(col.name);
      const multiMode = modes.length > 1;

      inventory.push({
        source: `Variables / ${col.name}`,
        detail: `${modes.length} mode(s): ${modes.map((m) => m.name).join(', ')}`,
        count: col.variableIds.length,
      });

      for (const mode of modes) {
        const doc = {};
        for (const id of col.variableIds) {
          const v = byId.get(id);
          if (!v) continue;
          const value = v.valuesByMode[mode.modeId];
          const tokenValue = renderVariableValue(value, v.resolvedType, byId, collectionByVarId);
          setPath(doc, v.name, { value: tokenValue, type: mapVariableType(v.resolvedType) });
        }
        const fileName = multiMode ? `${colSlug}.${kebab(mode.name)}.json` : `${colSlug}.json`;
        files.push({
          name: fileName,
          source: 'variables',
          detail: `${col.name} — ${mode.name}`,
          count: col.variableIds.length,
          body: JSON.stringify(doc, null, 2) + '\n',
        });
        if (!multiMode) break;
      }
    }

    // --- Paint Styles → paint-styles.json ---
    if (paintStyles.length) {
      inventory.push({
        source: 'Paint Styles',
        detail: 'colors / fills',
        count: paintStyles.length,
      });
      const doc = {};
      for (const s of paintStyles) {
        const value = renderPaintStyleValue(s);
        if (value === null) continue;
        setPath(doc, s.name, { value, type: 'color' });
      }
      files.push({
        name: 'paint-styles.json',
        source: 'paint-styles',
        detail: `${paintStyles.length} styles`,
        count: paintStyles.length,
        body: JSON.stringify(doc, null, 2) + '\n',
      });
    }

    // --- Effect Styles → effect-styles.json ---
    if (effectStyles.length) {
      inventory.push({
        source: 'Effect Styles',
        detail: 'shadows / blurs',
        count: effectStyles.length,
      });
      const doc = {};
      for (const s of effectStyles) {
        const value = renderEffectStyleValue(s);
        if (value === null) continue;
        setPath(doc, s.name, { value, type: 'shadow' });
      }
      files.push({
        name: 'effect-styles.json',
        source: 'effect-styles',
        detail: `${effectStyles.length} styles`,
        count: effectStyles.length,
        body: JSON.stringify(doc, null, 2) + '\n',
      });
    }

    // --- Text Styles → text-styles.json ---
    if (textStyles.length) {
      inventory.push({
        source: 'Text Styles',
        detail: 'typography',
        count: textStyles.length,
      });
      const doc = {};
      for (const s of textStyles) {
        setPath(doc, s.name, { value: renderTextStyleValue(s), type: 'typography' });
      }
      files.push({
        name: 'text-styles.json',
        source: 'text-styles',
        detail: `${textStyles.length} styles`,
        count: textStyles.length,
        body: JSON.stringify(doc, null, 2) + '\n',
      });
    }

    figma.showUI(buildUiHtml(files, inventory), {
      width: 780,
      height: 620,
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

// --- Variables ---

function renderVariableValue(value, figmaType, byId, collectionByVarId) {
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

function mapVariableType(figmaType) {
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

// --- Paint Styles ---

function renderPaintStyleValue(style) {
  const paint = (style.paints || []).find((p) => p.visible !== false);
  if (!paint) return null;
  if (paint.type === 'SOLID') {
    const opacity = paint.opacity !== undefined ? paint.opacity : 1;
    return rgbaToHex({ r: paint.color.r, g: paint.color.g, b: paint.color.b, a: opacity });
  }
  if (paint.type === 'GRADIENT_LINEAR' || paint.type === 'GRADIENT_RADIAL') {
    const stops = (paint.gradientStops || [])
      .map((s) => `${rgbaToHex(s.color)} ${(s.position * 100).toFixed(0)}%`)
      .join(', ');
    if (paint.type === 'GRADIENT_LINEAR') return `linear-gradient(${stops})`;
    return `radial-gradient(${stops})`;
  }
  return null;
}

// --- Effect Styles (drop shadows + inner shadows) ---

function renderEffectStyleValue(style) {
  const shadows = (style.effects || []).filter(
    (e) => (e.type === 'DROP_SHADOW' || e.type === 'INNER_SHADOW') && e.visible !== false,
  );
  if (!shadows.length) return null;
  const parts = shadows.map((e) => ({
    inset: e.type === 'INNER_SHADOW',
    x: e.offset.x,
    y: e.offset.y,
    blur: e.radius,
    spread: e.spread || 0,
    color: rgbaToHex(e.color),
  }));
  return parts.length === 1 ? parts[0] : parts;
}

// --- Text Styles ---

function renderTextStyleValue(style) {
  const fontFamily = style.fontName ? style.fontName.family : null;
  const fontWeight = style.fontName ? style.fontName.style : null;
  const fontSize = `${style.fontSize}px`;
  const lineHeight =
    style.lineHeight && style.lineHeight.unit === 'PIXELS'
      ? `${style.lineHeight.value}px`
      : style.lineHeight && style.lineHeight.unit === 'PERCENT'
        ? `${style.lineHeight.value}%`
        : 'normal';
  const letterSpacing =
    style.letterSpacing && style.letterSpacing.unit === 'PIXELS'
      ? `${style.letterSpacing.value}px`
      : style.letterSpacing && style.letterSpacing.unit === 'PERCENT'
        ? `${style.letterSpacing.value}%`
        : '0';
  const out = {
    fontFamily,
    fontWeight,
    fontSize,
    lineHeight,
    letterSpacing,
  };
  if (style.textCase && style.textCase !== 'ORIGINAL') out.textCase = style.textCase;
  if (style.textDecoration && style.textDecoration !== 'NONE') {
    out.textDecoration = style.textDecoration;
  }
  return out;
}

// --- Common helpers ---

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

function setPath(obj, path, leaf) {
  const parts = path.split('/').map(kebabSegment);
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

function kebabSegment(s) {
  // Per-segment kebab — keeps numeric scale steps intact (e.g., "100").
  return String(s)
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
}

function buildUiHtml(files, inventory) {
  const inventoryRows = inventory
    .map(
      (i) =>
        `<tr><td>${escapeHtml(i.source)}</td><td>${escapeHtml(i.detail)}</td><td>${i.count}</td></tr>`,
    )
    .join('');

  const sections = files
    .map(
      (f, i) => `
    <section>
      <header>
        <h2>${escapeHtml(f.name)}</h2>
        <div class="meta">${escapeHtml(f.detail)} · ${f.count}</div>
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
    pre { margin: 0; padding: 12px; max-height: 220px; overflow: auto; font-family: 'SF Mono', Menlo, Consolas, monospace; font-size: 11px; line-height: 1.5; white-space: pre; }
    .footer { padding: 8px 0 0; text-align: right; }
    .close { background: #18181b; color: #fff; border-color: #18181b; }
    .empty { padding: 16px; text-align: center; color: #737373; }
  </style></head><body>
    <div class="inventory">
      <h3>Discovered token sources (${inventory.length})</h3>
      <table>
        <thead><tr><th>Source</th><th>Detail</th><th>Count</th></tr></thead>
        <tbody>${inventoryRows || '<tr><td colspan="3" class="empty">— none —</td></tr>'}</tbody>
      </table>
    </div>
    ${sections || '<div class="empty">No exportable files.</div>'}
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
