// Glaon Figma Plugin — scaffold entry.
//
// Replace the body of the IIFE below with a Claude-authored script for
// the current design task. See tools/figma-plugin/README.md for the
// workflow and docs/figma.md "Claude-authored design" for the contract.
//
// Default behavior (scaffold): show a notification confirming the plugin
// loads, then close. No mutation.

(() => {
  figma.notify('Glaon plugin scaffold — replace code.js with a task script.');
  figma.closePlugin();
})();
