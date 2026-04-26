// Glaon — 01 Variables Bootstrap
//
// Creates the `Primitives` and `Semantic` Variables collections in the
// Design System Figma file with `Theme: Light / Dark` modes, and lays
// down the canonical Semantic taxonomy from
// docs/design-system-bootstrap.md.
//
// Usage:
//   1. Copy this file's contents into tools/figma-plugin/code.js.
//   2. Open the Design System Figma file.
//   3. Edit the BRAND_REF map below to fill in any Brand Guideline
//      values you have. Anything left as `null` is created as a visible
//      placeholder (magenta) and listed in the dry-run summary.
//   4. Run the plugin (Plugins → Development → Glaon).
//   5. Review the dry-run notification; flip CONFIRM to true; re-run.
//   6. After confirm, review Variables panel → publish library.
//   7. `git restore tools/figma-plugin/code.js` to scaffold.
//
// Idempotent: re-running after Brand Guideline updates only adds the new
// variables / modes; existing entries are kept.

const CONFIRM = false;

// Placeholder magenta — easy to spot in the file as "not yet defined".
const PLACEHOLDER = { r: 1, g: 0, b: 1, a: 1 };

// Brand Guideline values — fill in what's known, leave `null` for the rest.
// Format: { r, g, b, a } with 0..1 channels, OR null.
const BRAND_REF = {
  // Neutrals
  'color/dirty-white': null, // off-white surface base
  'color/sand-100': null,
  'color/sand-300': null,
  'color/night-blue-500': null, // primary text
  'color/night-blue-700': null,
  // Brand
  'color/brand-primary': null,
  'color/brand-primary-hover': null, // #138 follow-up
  'color/brand-primary-pressed': null, // #138 follow-up
  // States
  'color/state-success': null,
  'color/state-warning': null,
  'color/state-danger': null, // #137 follow-up
};

// Semantic taxonomy. Keys are variable names; values are the Primitives
// they bind to (per spec). If the primitive is missing, the semantic gets
// a placeholder fallback so consumers can still wire up.
const SEMANTIC_BINDINGS = {
  'surface/default': 'color/dirty-white',
  'surface/muted': 'color/sand-100',
  'surface/raised': 'color/dirty-white', // #139 follow-up may shift
  'text/primary': 'color/night-blue-500',
  'text/muted': 'color/night-blue-700',
  'text/inverse': 'color/dirty-white',
  'border/subtle': 'color/sand-300',
  'border/strong': 'color/night-blue-500',
  'brand/primary': 'color/brand-primary',
  'brand/hover': 'color/brand-primary-hover',
  'brand/pressed': 'color/brand-primary-pressed',
  'state/success': 'color/state-success',
  'state/warning': 'color/state-warning',
  'state/danger': 'color/state-danger',
};

(async () => {
  try {
    const collections = await figma.variables.getLocalVariableCollectionsAsync();
    const created = [];
    const updated = [];
    const missing = [];

    // --- Primitives collection ---
    let primitivesCol = collections.find((c) => c.name === 'Primitives');
    if (!primitivesCol) {
      if (CONFIRM) {
        primitivesCol = figma.variables.createVariableCollection('Primitives');
      }
      created.push('collection: Primitives');
    }
    const primitivesModes = ensureThemeModes(primitivesCol, CONFIRM, created);

    // --- Semantic collection ---
    let semanticCol = collections.find((c) => c.name === 'Semantic');
    if (!semanticCol) {
      if (CONFIRM) {
        semanticCol = figma.variables.createVariableCollection('Semantic');
      }
      created.push('collection: Semantic');
    }
    const semanticModes = ensureThemeModes(semanticCol, CONFIRM, created);

    // --- Primitives variables ---
    const allVars = await figma.variables.getLocalVariablesAsync('COLOR');
    const primitiveVarsByName = new Map();
    for (const [name, value] of Object.entries(BRAND_REF)) {
      let v = allVars.find(
        (x) =>
          x.name === name &&
          x.variableCollectionId === (primitivesCol ? primitivesCol.id : null),
      );
      const concreteValue = value !== null && value !== undefined ? value : PLACEHOLDER;
      if (!v) {
        if (CONFIRM && primitivesCol) {
          v = figma.variables.createVariable(name, primitivesCol, 'COLOR');
          v.setValueForMode(primitivesModes.light, concreteValue);
          v.setValueForMode(primitivesModes.dark, concreteValue);
        }
        created.push(`primitive: ${name}${value ? '' : ' (placeholder)'}`);
      } else if (CONFIRM) {
        // Update placeholder if we now have a real value.
        if (value) {
          v.setValueForMode(primitivesModes.light, concreteValue);
          v.setValueForMode(primitivesModes.dark, concreteValue);
          updated.push(`primitive: ${name}`);
        }
      }
      if (value === null) missing.push(name);
      if (v) primitiveVarsByName.set(name, v);
    }

    // --- Semantic variables ---
    for (const [semanticName, primitiveName] of Object.entries(SEMANTIC_BINDINGS)) {
      let v = allVars.find(
        (x) =>
          x.name === semanticName &&
          x.variableCollectionId === (semanticCol ? semanticCol.id : null),
      );
      if (!v) {
        if (CONFIRM && semanticCol) {
          v = figma.variables.createVariable(semanticName, semanticCol, 'COLOR');
        }
        created.push(`semantic: ${semanticName}`);
      }
      if (CONFIRM && v && primitiveVarsByName.has(primitiveName)) {
        const target = primitiveVarsByName.get(primitiveName);
        const alias = { type: 'VARIABLE_ALIAS', id: target.id };
        v.setValueForMode(semanticModes.light, alias);
        v.setValueForMode(semanticModes.dark, alias); // Dark fallback to Light until #140
      }
    }

    const summary = [
      CONFIRM ? '✅ APPLIED' : '🔍 DRY-RUN',
      `created: ${created.length}`,
      `updated: ${updated.length}`,
      `missing brand values: ${missing.length}`,
    ].join(' · ');
    figma.notify(summary, { timeout: 8000 });
    if (created.length || updated.length || missing.length) {
      console.log('[Glaon variables-bootstrap]');
      if (created.length) console.log('Created:', created);
      if (updated.length) console.log('Updated:', updated);
      if (missing.length) console.log('Missing (placeholder used):', missing);
    }
  } catch (err) {
    figma.notify(`Glaon plugin error: ${err.message}`, { error: true });
    throw err;
  } finally {
    figma.closePlugin();
  }
})();

function ensureThemeModes(collection, confirm, created) {
  if (!collection) {
    return { light: null, dark: null };
  }
  // Default mode named "Mode 1" or similar — rename to Light if there is only one.
  let lightMode = collection.modes.find((m) => /light/i.test(m.name));
  let darkMode = collection.modes.find((m) => /dark/i.test(m.name));
  if (!lightMode) {
    if (confirm) {
      const target = collection.modes[0];
      collection.renameMode(target.modeId, 'Light');
      lightMode = collection.modes.find((m) => m.name === 'Light');
    }
    created.push(`mode: ${collection.name}/Light`);
  }
  if (!darkMode) {
    if (confirm) {
      const id = collection.addMode('Dark');
      darkMode = { modeId: id, name: 'Dark' };
    }
    created.push(`mode: ${collection.name}/Dark`);
  }
  return {
    light: lightMode ? lightMode.modeId : undefined,
    dark: darkMode ? darkMode.modeId : undefined,
  };
}
