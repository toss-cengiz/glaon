// Glaon — 04 Color Palette Rebuild
//
// Rebuilds the `Color Palette` frame in the Brand Guideline Figma file
// to match the primitive + semantic taxonomy decided in #132. The
// existing 4-swatch layout (Dark Slate Blue / Coral Red / Muted Steel
// Blue / Light Gray) is renamed and preserved as a legacy reference;
// a fresh `Color Palette` frame is created next to it with a primitive
// row + semantic row of swatches that bind to the file's Variables —
// or fall back to placeholder magenta if the Variables aren't there yet.
//
// What this script intentionally *doesn't* do (visual judgment is left
// to the designer): light/dark side-by-side preview, contrast
// annotations, do/don't examples. Add those manually in Figma after the
// scaffold is in place. The script preserves any non-`section/*` child
// frames you add to the new `Color Palette` frame, so manual sections
// survive re-runs.
//
// Usage:
//   1. Copy this file's contents into tools/figma-plugin/code.js.
//   2. Open the Brand Guideline Figma file (file key
//      JLbLmCMDdhxOisbVYiAo5C).
//   3. (Optional but recommended) Run 01-variables-bootstrap first in
//      this file so swatch fills bind to real Variables instead of
//      placeholder magenta.
//   4. Run plugin (Plugins → Development → Glaon).
//   5. Review the dry-run notification; flip CONFIRM = true; re-run.
//   6. In Figma: hand-author contrast notes, light/dark preview, and
//      do/don't examples (per #132 acceptance criteria).
//   7. `git restore tools/figma-plugin/code.js` to scaffold.
//
// Idempotent: re-running only refreshes the `section/primitives` and
// `section/semantic` frames inside `Color Palette`; everything else is
// left untouched.

const CONFIRM = false;

const LEGACY_FRAME_ID = '17:521';
const LEGACY_SUFFIX = '(legacy 2026-04-26)';
const NEW_FRAME_NAME = 'Color Palette';
const PLACEHOLDER = { r: 1, g: 0, b: 1 };

const PRIMITIVES = [
  { name: 'kirli-beyaz', note: 'off-white surface base' },
  { name: 'sand-100', note: 'lighter neutral' },
  { name: 'sand-300', note: 'mid neutral border' },
  { name: 'night-blue-500', note: 'primary text / strong border' },
  { name: 'night-blue-700', note: 'muted text shift' },
  { name: 'brand-primary', note: 'primary CTA hue' },
  { name: 'brand-primary-hover', note: '#138 follow-up' },
  { name: 'brand-primary-pressed', note: '#138 follow-up' },
  { name: 'state-success', note: 'confirmation' },
  { name: 'state-warning', note: 'caution' },
  { name: 'state-danger', note: '#137 follow-up' },
];

const SEMANTICS = [
  { name: 'surface/default', binding: 'kirli-beyaz' },
  { name: 'surface/muted', binding: 'sand-100' },
  { name: 'surface/raised', binding: 'kirli-beyaz' },
  { name: 'text/primary', binding: 'night-blue-500' },
  { name: 'text/muted', binding: 'night-blue-700' },
  { name: 'text/inverse', binding: 'kirli-beyaz' },
  { name: 'border/subtle', binding: 'sand-300' },
  { name: 'border/strong', binding: 'night-blue-500' },
  { name: 'brand/primary', binding: 'brand-primary' },
  { name: 'brand/hover', binding: 'brand-primary-hover' },
  { name: 'brand/pressed', binding: 'brand-primary-pressed' },
  { name: 'state/success', binding: 'state-success' },
  { name: 'state/warning', binding: 'state-warning' },
  { name: 'state/danger', binding: 'state-danger' },
];

const SWATCH_W = 120;
const SWATCH_H = 120;
const SWATCH_GAP = 16;
const ROW_GAP = 32;
const SECTION_GAP = 48;
const PER_ROW = 6;
const PADDING = 32;

(async () => {
  try {
    const allVars = await figma.variables.getLocalVariablesAsync('COLOR');
    const primitiveVars = new Map();
    const semanticVars = new Map();
    const missingPrimitives = [];
    const missingSemantics = [];

    for (const p of PRIMITIVES) {
      const v = allVars.find((x) => x.name === `color/${p.name}`);
      if (v) primitiveVars.set(p.name, v);
      else missingPrimitives.push(p.name);
    }
    for (const s of SEMANTICS) {
      const v = allVars.find((x) => x.name === s.name);
      if (v) semanticVars.set(s.name, v);
      else missingSemantics.push(s.name);
    }

    const actions = [];
    const legacy = await figma.getNodeByIdAsync(LEGACY_FRAME_ID);
    if (legacy && legacy.type === 'FRAME') {
      if (legacy.name.includes('legacy')) {
        actions.push(`legacy frame already renamed: "${legacy.name}"`);
      } else {
        actions.push(`rename legacy: "${legacy.name}" → "${legacy.name} ${LEGACY_SUFFIX}"`);
      }
    } else {
      actions.push(`legacy frame ${LEGACY_FRAME_ID} not found — creating fresh ${NEW_FRAME_NAME}`);
    }
    actions.push(
      `refresh "${NEW_FRAME_NAME}" with ${PRIMITIVES.length} primitives + ${SEMANTICS.length} semantics`,
    );

    if (!CONFIRM) {
      const summary = [
        '🔍 DRY-RUN',
        `actions: ${actions.length}`,
        `primitives missing: ${missingPrimitives.length}`,
        `semantics missing: ${missingSemantics.length}`,
      ].join(' · ');
      figma.notify(summary, { timeout: 8000 });
      console.log('[Glaon color-palette-rebuild] Plan:');
      for (const a of actions) console.log('  •', a);
      if (missingPrimitives.length) console.log('Missing primitives:', missingPrimitives);
      if (missingSemantics.length) console.log('Missing semantics:', missingSemantics);
      figma.closePlugin();
      return;
    }

    await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
    await figma.loadFontAsync({ family: 'Inter', style: 'SemiBold' });

    if (legacy && legacy.type === 'FRAME' && !legacy.name.includes('legacy')) {
      legacy.name = `${legacy.name} ${LEGACY_SUFFIX}`.trim();
    }

    const page = legacy?.parent ?? figma.currentPage;
    let newFrame = page.children.find(
      (n) => n.type === 'FRAME' && n.name === NEW_FRAME_NAME,
    );
    if (!newFrame) {
      newFrame = figma.createFrame();
      newFrame.name = NEW_FRAME_NAME;
      newFrame.layoutMode = 'VERTICAL';
      newFrame.primaryAxisSizingMode = 'AUTO';
      newFrame.counterAxisSizingMode = 'AUTO';
      newFrame.itemSpacing = SECTION_GAP;
      newFrame.paddingLeft = PADDING;
      newFrame.paddingRight = PADDING;
      newFrame.paddingTop = PADDING;
      newFrame.paddingBottom = PADDING;
      newFrame.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }];
      page.appendChild(newFrame);
      if (legacy && 'absoluteBoundingBox' in legacy && legacy.absoluteBoundingBox) {
        newFrame.x = legacy.x;
        newFrame.y = legacy.y + (legacy.height || 0) + 80;
      }
    }

    for (const child of [...newFrame.children]) {
      if (child.name.startsWith('section/')) child.remove();
    }

    const primitivesSection = buildSection(
      'Primitives',
      PRIMITIVES.map((p) =>
        buildSwatch({ label: p.name, sub: p.note, variable: primitiveVars.get(p.name) }),
      ),
    );
    newFrame.appendChild(primitivesSection);

    const semanticsSection = buildSection(
      'Semantic',
      SEMANTICS.map((s) =>
        buildSwatch({ label: s.name, sub: `→ ${s.binding}`, variable: semanticVars.get(s.name) }),
      ),
    );
    newFrame.appendChild(semanticsSection);

    const summary = [
      '✅ APPLIED',
      `primitives: ${PRIMITIVES.length}`,
      `semantics: ${SEMANTICS.length}`,
      `placeholders: ${missingPrimitives.length + missingSemantics.length}`,
    ].join(' · ');
    figma.notify(summary, { timeout: 8000 });
    if (missingPrimitives.length || missingSemantics.length) {
      console.log('[Glaon color-palette-rebuild] Placeholder swatches (Variables missing):');
      if (missingPrimitives.length) console.log('  primitives:', missingPrimitives);
      if (missingSemantics.length) console.log('  semantics:', missingSemantics);
    }
  } catch (err) {
    figma.notify(`Glaon plugin error: ${err.message}`, { error: true });
    throw err;
  } finally {
    figma.closePlugin();
  }
})();

function buildSection(title, swatchNodes) {
  const section = figma.createFrame();
  section.name = `section/${title.toLowerCase()}`;
  section.layoutMode = 'VERTICAL';
  section.primaryAxisSizingMode = 'AUTO';
  section.counterAxisSizingMode = 'AUTO';
  section.itemSpacing = ROW_GAP;
  section.fills = [];

  const heading = figma.createText();
  heading.name = `heading/${title.toLowerCase()}`;
  heading.fontName = { family: 'Inter', style: 'SemiBold' };
  heading.fontSize = 24;
  heading.characters = title;
  section.appendChild(heading);

  for (let i = 0; i < swatchNodes.length; i += PER_ROW) {
    const row = figma.createFrame();
    row.name = `row/${title.toLowerCase()}/${i / PER_ROW}`;
    row.layoutMode = 'HORIZONTAL';
    row.primaryAxisSizingMode = 'AUTO';
    row.counterAxisSizingMode = 'AUTO';
    row.itemSpacing = SWATCH_GAP;
    row.fills = [];
    for (const node of swatchNodes.slice(i, i + PER_ROW)) {
      row.appendChild(node);
    }
    section.appendChild(row);
  }

  return section;
}

function buildSwatch({ label, sub, variable }) {
  const wrapper = figma.createFrame();
  wrapper.name = `swatch/${label}`;
  wrapper.layoutMode = 'VERTICAL';
  wrapper.primaryAxisSizingMode = 'AUTO';
  wrapper.counterAxisSizingMode = 'AUTO';
  wrapper.itemSpacing = 8;
  wrapper.fills = [];

  const tile = figma.createRectangle();
  tile.name = `tile/${label}`;
  tile.resize(SWATCH_W, SWATCH_H);
  tile.cornerRadius = 8;
  if (variable) {
    const fill = figma.variables.setBoundVariableForPaint(
      { type: 'SOLID', color: { r: 1, g: 0, b: 1 } },
      'color',
      variable,
    );
    tile.fills = [fill];
  } else {
    tile.fills = [{ type: 'SOLID', color: PLACEHOLDER }];
  }
  wrapper.appendChild(tile);

  const labelNode = figma.createText();
  labelNode.name = `label/${label}`;
  labelNode.fontName = { family: 'Inter', style: 'SemiBold' };
  labelNode.fontSize = 12;
  labelNode.characters = label;
  wrapper.appendChild(labelNode);

  if (sub) {
    const subNode = figma.createText();
    subNode.name = `sub/${label}`;
    subNode.fontName = { family: 'Inter', style: 'Regular' };
    subNode.fontSize = 11;
    subNode.characters = sub;
    wrapper.appendChild(subNode);
  }

  return wrapper;
}
