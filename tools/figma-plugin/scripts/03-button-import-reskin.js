// Glaon — 03 Button Import + Re-skin
//
// Re-binds an Untitled UI Button (already pasted + detached on the
// Components page of the Design System file) to Glaon's Semantic
// variables, and tags the component description with
// `storybook-id: web-primitives-button`. Pattern: this is the template
// every other primitive issue (#148–#152) copies.
//
// Prerequisites:
//   - Variables collection `Semantic` exists (run 01-variables-bootstrap
//     first).
//   - The Untitled UI Button has been copied into the Design System
//     file's `Components` page and `Detach instance`'d. The detached
//     component (a COMPONENT_SET or COMPONENT node) is selected before
//     running this plugin.
//
// What it does:
//   - Walks the selection tree.
//   - For each fill/stroke of every node, applies a heuristic mapping
//     in BIND_MAP to assign a Semantic variable. Adjust BIND_MAP based
//     on dry-run output before flipping CONFIRM.
//   - Sets the component description to `storybook-id: web-primitives-button`.
//
// Usage:
//   1. Run scripts/01-variables-bootstrap.js first.
//   2. Paste the Untitled UI Button into Components page; Detach.
//   3. Select the resulting component / component set node.
//   4. Copy this script's contents into tools/figma-plugin/code.js.
//   5. Run plugin → review dry-run summary (lists every fill found and
//      what it would bind to).
//   6. Adjust BIND_MAP if the heuristic missed something.
//   7. Flip CONFIRM = true → re-run.

const CONFIRM = false;

const STORYBOOK_ID = 'web-primitives-button';

// Heuristic: node-name substring → Semantic variable name.
// Order matters; first match wins. Adjust based on the actual UUI Button
// node tree (visible in the dry-run console output).
const BIND_MAP = [
  // intent: primary
  { match: /primary.*background|fill.*primary/i, fill: 'brand/primary' },
  { match: /primary.*hover/i, fill: 'brand/hover' },
  { match: /primary.*pressed|primary.*active/i, fill: 'brand/pressed' },
  { match: /primary.*label|primary.*text/i, fill: 'text/inverse' },
  // intent: secondary / outline
  { match: /secondary.*background|outline.*background/i, fill: 'surface/default' },
  { match: /secondary.*border|outline.*border/i, fill: 'border/strong' },
  { match: /secondary.*label|outline.*label|secondary.*text/i, fill: 'text/primary' },
  // intent: ghost
  { match: /ghost.*background/i, fill: 'surface/muted' },
  { match: /ghost.*label|ghost.*text/i, fill: 'text/primary' },
  // intent: destructive
  { match: /destructive.*background|danger.*background/i, fill: 'state/danger' },
  { match: /destructive.*label|destructive.*text/i, fill: 'text/inverse' },
  // states
  { match: /disabled.*background/i, fill: 'surface/muted' },
  { match: /disabled.*label|disabled.*text/i, fill: 'text/muted' },
  // generic fallbacks
  { match: /label|text/i, fill: 'text/primary' },
  { match: /background|fill/i, fill: 'surface/default' },
];

(async () => {
  try {
    const selection = figma.currentPage.selection;
    if (selection.length !== 1) {
      figma.notify('Select exactly one COMPONENT or COMPONENT_SET node first.', { error: true });
      figma.closePlugin();
      return;
    }
    const root = selection[0];
    if (root.type !== 'COMPONENT' && root.type !== 'COMPONENT_SET') {
      figma.notify(`Selected node is ${root.type}; expected COMPONENT or COMPONENT_SET.`, {
        error: true,
      });
      figma.closePlugin();
      return;
    }

    const semanticVars = (await figma.variables.getLocalVariablesAsync('COLOR')).filter((v) =>
      v.name.includes('/'),
    );
    const semanticByName = new Map(semanticVars.map((v) => [v.name, v]));

    const plan = [];
    const skipped = [];
    walk(root, (node) => {
      if ('fills' in node && Array.isArray(node.fills)) {
        for (let i = 0; i < node.fills.length; i++) {
          const fill = node.fills[i];
          if (fill.type !== 'SOLID') continue;
          const target = pickBinding(node.name);
          if (!target) {
            skipped.push(`${node.name} fill[${i}] (no rule)`);
            continue;
          }
          const variable = semanticByName.get(target);
          if (!variable) {
            skipped.push(
              `${node.name} fill[${i}] → ${target} (variable missing — run 01-variables-bootstrap)`,
            );
            continue;
          }
          plan.push({ node, fillIndex: i, target, variable });
        }
      }
    });

    if (CONFIRM) {
      for (const entry of plan) {
        const fills = clone(entry.node.fills);
        fills[entry.fillIndex] = figma.variables.setBoundVariableForPaint(
          fills[entry.fillIndex],
          'color',
          entry.variable,
        );
        entry.node.fills = fills;
      }
      // Set storybook-id on the component description (or all variants).
      if (root.type === 'COMPONENT') {
        root.description = mergeStorybookId(root.description);
      } else {
        for (const child of root.children) {
          if (child.type === 'COMPONENT') {
            child.description = mergeStorybookId(child.description);
          }
        }
        root.description = mergeStorybookId(root.description);
      }
    }

    const summary = [
      CONFIRM ? '✅ APPLIED' : '🔍 DRY-RUN',
      `bindings: ${plan.length}`,
      `skipped: ${skipped.length}`,
    ].join(' · ');
    figma.notify(summary, { timeout: 8000 });
    console.log('[Glaon button-reskin] Plan:');
    for (const entry of plan)
      console.log(`  ${entry.node.name} fill[${entry.fillIndex}] → ${entry.target}`);
    if (skipped.length) {
      console.log('[Glaon button-reskin] Skipped:');
      for (const s of skipped) console.log(`  ${s}`);
    }
  } catch (err) {
    figma.notify(`Glaon plugin error: ${err.message}`, { error: true });
    throw err;
  } finally {
    figma.closePlugin();
  }
})();

function walk(node, fn) {
  fn(node);
  if ('children' in node) {
    for (const child of node.children) walk(child, fn);
  }
}

function pickBinding(nodeName) {
  for (const rule of BIND_MAP) {
    if (rule.match.test(nodeName)) return rule.fill;
  }
  return null;
}

function mergeStorybookId(existing) {
  const tag = `storybook-id: ${STORYBOOK_ID}`;
  if (!existing) return tag;
  if (existing.includes('storybook-id:')) {
    return existing.replace(/storybook-id:\s*\S+/g, tag);
  }
  return `${existing}\n\n${tag}`;
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}
