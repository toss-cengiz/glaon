import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

type A11yImpact = 'minor' | 'moderate' | 'serious' | 'critical';

interface AssertA11yOptions {
  /**
   * Axe rules to disable for this call. Use sparingly — every entry
   * should be justified in a comment at the call site (e.g. known
   * upstream library bug, deliberate design decision).
   */
  disableRules?: string[];
  /**
   * Impact levels that cause the test to fail. Anything below this is
   * attached to the test report for visibility but does not fail CI.
   * Defaults to serious + critical.
   */
  failOn?: A11yImpact[];
}

const DEFAULT_FAIL_ON: A11yImpact[] = ['serious', 'critical'];

export async function assertA11y(page: Page, options: AssertA11yOptions = {}): Promise<void> {
  const { disableRules = [], failOn = DEFAULT_FAIL_ON } = options;
  const info = test.info();

  let builder = new AxeBuilder({ page });
  if (disableRules.length > 0) {
    builder = builder.disableRules(disableRules);
  }

  const results = await builder.analyze();

  const failSet = new Set<string>(failOn);
  const fatal = results.violations.filter((v) => (v.impact ? failSet.has(v.impact) : false));
  const informational = results.violations.filter((v) =>
    v.impact ? !failSet.has(v.impact) : true,
  );

  if (informational.length > 0) {
    await info.attach('a11y-informational', {
      body: JSON.stringify(informational, null, 2),
      contentType: 'application/json',
    });
  }

  if (fatal.length > 0) {
    await info.attach('a11y-violations', {
      body: JSON.stringify(fatal, null, 2),
      contentType: 'application/json',
    });
    const summary = fatal
      .map((v) => {
        const impact = v.impact ?? 'unknown';
        const count = v.nodes.length;
        return `  [${impact}] ${v.id} — ${v.help} (${String(count)} node${count === 1 ? '' : 's'})`;
      })
      .join('\n');
    const plural = fatal.length === 1 ? '' : 's';
    expect(
      fatal,
      `axe-core found ${String(fatal.length)} ${failOn.join(' + ')} violation${plural}:\n${summary}\nSee the "a11y-violations" attachment for full details.`,
    ).toEqual([]);
  }
}
