// Glaon — 02 Text Styles
//
// Creates Glaon's canonical text style family (Display / Heading / Body /
// Caption) in the Design System Figma file. Web and RN sets are created
// in parallel namespaces. Numeric properties are hard-coded for the first
// pass; once typography Variables land per #146, this script is updated
// to bind to them.
//
// Usage:
//   1. Copy this file's contents into tools/figma-plugin/code.js.
//   2. Open the Design System Figma file. Run #145 first so collections
//      exist (this script is independent of them but the order keeps the
//      file tidy).
//   3. Edit the FONT block below if Brand Guideline has a typography
//      decision (#133); otherwise the placeholder Inter / Inter is used.
//   4. Run plugin (Plugins → Development → Glaon).
//   5. Review dry-run; flip CONFIRM; re-run; review styles in Figma.
//
// Idempotent: existing styles with the same name are skipped (not
// overwritten). To force an update, delete the style first or extend the
// script.

const CONFIRM = false;

// Replace these with Brand Guideline #133 outcome when available.
const FONT = {
  web: {
    family: 'Inter',
    regular: 'Regular',
    medium: 'Medium',
    semibold: 'SemiBold',
    bold: 'Bold',
  },
  rn: { family: 'Inter', regular: 'Regular', medium: 'Medium', semibold: 'SemiBold', bold: 'Bold' },
};

// Scale (px / line-height multiplier / weight). Mirrors a typical 1.25
// modular scale; replace with #133 outcome.
const SCALE = [
  { name: 'Display/XL', size: 56, line: 1.1, weight: 'bold' },
  { name: 'Display/LG', size: 44, line: 1.15, weight: 'bold' },
  { name: 'Display/MD', size: 36, line: 1.2, weight: 'semibold' },
  { name: 'Heading/H1', size: 28, line: 1.25, weight: 'semibold' },
  { name: 'Heading/H2', size: 24, line: 1.3, weight: 'semibold' },
  { name: 'Heading/H3', size: 20, line: 1.35, weight: 'medium' },
  { name: 'Heading/H4', size: 18, line: 1.4, weight: 'medium' },
  { name: 'Body/LG', size: 18, line: 1.5, weight: 'regular' },
  { name: 'Body/MD', size: 16, line: 1.5, weight: 'regular' },
  { name: 'Body/SM', size: 14, line: 1.5, weight: 'regular' },
  { name: 'Caption', size: 12, line: 1.4, weight: 'medium' },
];

(async () => {
  try {
    const existing = await figma.getLocalTextStylesAsync();
    const created = [];
    const skipped = [];

    for (const platform of ['Web', 'RN']) {
      const fontConfig = FONT[platform.toLowerCase()];
      // Pre-load all weights we'll use across the scale.
      if (CONFIRM) {
        const weights = new Set(SCALE.map((s) => fontConfig[s.weight] || 'Regular'));
        for (const style of weights) {
          await figma.loadFontAsync({ family: fontConfig.family, style });
        }
      }

      for (const entry of SCALE) {
        const fullName = `${platform}/${entry.name}`;
        const dup = existing.find((s) => s.name === fullName);
        if (dup) {
          skipped.push(fullName);
          continue;
        }
        if (CONFIRM) {
          const style = figma.createTextStyle();
          style.name = fullName;
          style.fontName = {
            family: fontConfig.family,
            style: fontConfig[entry.weight] || 'Regular',
          };
          style.fontSize = entry.size;
          style.lineHeight = { value: entry.size * entry.line, unit: 'PIXELS' };
        }
        created.push(fullName);
      }
    }

    const summary = [
      CONFIRM ? '✅ APPLIED' : '🔍 DRY-RUN',
      `created: ${created.length}`,
      `skipped (existing): ${skipped.length}`,
    ].join(' · ');
    figma.notify(summary, { timeout: 8000 });
    if (created.length) console.log('[Glaon text-styles] Created:', created);
    if (skipped.length) console.log('[Glaon text-styles] Skipped:', skipped);
  } catch (err) {
    figma.notify(`Glaon plugin error: ${err.message}`, { error: true });
    throw err;
  } finally {
    figma.closePlugin();
  }
})();
