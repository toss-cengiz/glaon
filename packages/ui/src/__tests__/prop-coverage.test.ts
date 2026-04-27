// F6 prop-coverage gate. For every Glaon wrap under
// `src/components/<Name>/<Name>.tsx` we expect a sibling
// `<Name>.stories.tsx` whose Storybook `meta.args` ∪ `meta.argTypes`
// ∪ optional `excludeFromArgs` export covers every prop the wrap
// exposes. The same test also asserts each story file declares a
// `parameters.design` entry — Chromatic's Figma plugin (#53) reads
// that to map design ↔ code.
//
// Component prop introspection runs through `react-docgen-typescript`
// against the same tsconfig Storybook uses, so kit re-exports
// (`export { Button } from '../base/buttons/button'`) flow through
// to the kit's typed prop surface.

import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { globSync } from 'glob';
import { withCustomConfig } from 'react-docgen-typescript';
import { describe, expect, it } from 'vitest';

const here = dirname(fileURLToPath(import.meta.url));
const packageRoot = resolve(here, '..', '..');

const parser = withCustomConfig(join(packageRoot, 'tsconfig.json'), {
  shouldExtractLiteralValuesFromEnum: true,
  savePropValueAsString: true,
  // Skip props that come from the underlying DOM / RN host element. They
  // are validated by TypeScript itself; surfacing them as Storybook
  // controls would produce hundreds of empty knobs per primitive.
  propFilter: (prop) => {
    if (prop.parent === undefined) return true;
    return !/(node_modules|react-aria-components|react-native)/.test(prop.parent.fileName);
  },
});

// macOS APFS is case-insensitive by default, which lets `[A-Z]*` match
// kebab-cased files like `dot-icon.tsx` when running locally. Constrain
// both segments to require an uppercase first character so only Glaon
// wrap files (`<PascalDir>/<PascalFile>.tsx`) get scanned, leaving the
// kit-source tiers (`base/`, `application/`, `foundations/`) outside
// the gate's reach.
const componentFiles = globSync('src/components/[A-Z]*/[A-Z]*.tsx', {
  cwd: packageRoot,
  nocase: false,
  ignore: ['**/*.stories.tsx', '**/*.test.tsx'],
}).map((rel) => ({
  rel,
  abs: join(packageRoot, rel),
  storyAbs: join(packageRoot, rel.replace(/\.tsx$/, '.stories.tsx')),
  name: (rel.split('/').pop() ?? rel).replace(/\.tsx$/, ''),
}));

interface StoryMetaShape {
  args?: Record<string, unknown>;
  argTypes?: Record<string, unknown>;
  parameters?: { design?: { url?: string; type?: string } };
}

interface StoryModule {
  meta: StoryMetaShape;
  excludeFromArgs: string[];
}

async function loadStoryModule(storyPath: string): Promise<StoryModule> {
  const mod = (await import(storyPath)) as {
    default?: StoryMetaShape;
    excludeFromArgs?: string[];
  };
  if (!mod.default) {
    throw new Error(`No default export (Storybook meta) in ${storyPath}`);
  }
  return { meta: mod.default, excludeFromArgs: mod.excludeFromArgs ?? [] };
}

describe('prop-coverage gate (F6)', () => {
  it('discovers at least one Glaon component wrap', () => {
    expect(componentFiles.length).toBeGreaterThan(0);
  });

  for (const file of componentFiles) {
    describe(file.name, () => {
      it('has a sibling stories file', () => {
        expect(globSync(file.storyAbs).length).toBe(1);
      });

      it('exposes every prop in Storybook controls or excludeFromArgs', async () => {
        const docs = parser.parse(file.abs);
        const first = docs[0];
        if (first === undefined) {
          throw new Error(
            `react-docgen-typescript could not extract a component from ${file.rel}. ` +
              `Make sure the file exports a React component named "${file.name}".`,
          );
        }
        const propNames = Object.keys(first.props);
        const { meta, excludeFromArgs } = await loadStoryModule(file.storyAbs);
        const covered = new Set([
          ...Object.keys(meta.args ?? {}),
          ...Object.keys(meta.argTypes ?? {}),
          ...excludeFromArgs,
        ]);
        const missing = propNames.filter((p) => !covered.has(p));
        expect(missing, `Missing in ${file.rel.replace(/\.tsx$/, '.stories.tsx')}`).toEqual([]);
      });

      it('declares `parameters.design` so Chromatic can map design ↔ code', async () => {
        const { meta } = await loadStoryModule(file.storyAbs);
        const design = meta.parameters?.design;
        expect(design, `Missing parameters.design in ${file.name}.stories.tsx`).toBeDefined();
        expect(design?.type ?? 'figma').toBe('figma');
        expect(typeof design?.url).toBe('string');
        expect(design?.url).toMatch(/^https:\/\/www\.figma\.com\/design\//);
      });
    });
  }
});
