// Locale switcher demo (#429 / i18n-G). Reads the toolbar `locale`
// global and flips between two hand-rolled string maps so the
// Foundations / i18n MDX page can show the switcher actually doing
// something. Production translations live in apps/web + apps/mobile
// /locales/<lng>.json — this catalog is intentionally tiny and
// scoped to the demo so @glaon/ui doesn't take a dep on react-i18next
// (the package stays presentational; primitives are translated by
// the consumer feature layer per the data-fetching boundary).

import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import type { ReactNode } from 'react';

interface DemoStrings {
  readonly heading: string;
  readonly description: string;
  readonly cta: string;
  readonly hint: string;
}

const STRINGS: Record<'en' | 'tr', DemoStrings> = {
  en: {
    heading: 'Locale-aware demo',
    description:
      'Flip the toolbar Locale switcher (top-right) and watch the strings below re-render.',
    cta: 'Switch language',
    hint: 'This demo uses an inline catalog. Real apps consume react-i18next via useTranslation().',
  },
  tr: {
    heading: 'Locale duyarlı demo',
    description:
      'Sağ üstteki Locale değiştiriciyi kullanın; aşağıdaki metinler yeniden render eder.',
    cta: 'Dili değiştir',
    hint: 'Bu demo gömülü bir sözlük kullanır. Gerçek uygulamalar react-i18next + useTranslation() üzerinden okur.',
  },
};

function I18nDemo({ locale }: { readonly locale: 'en' | 'tr' }): ReactNode {
  const t = STRINGS[locale];
  return (
    <div className="flex max-w-md flex-col gap-4 p-6">
      <h2 className="text-xl font-semibold text-fg-primary">{t.heading}</h2>
      <p className="text-sm text-fg-secondary">{t.description}</p>
      <button
        type="button"
        className="self-start rounded-md bg-brand-solid px-4 py-2 text-sm font-medium text-white"
      >
        {t.cta}
      </button>
      <p className="text-xs text-fg-tertiary">{t.hint}</p>
      <code className="rounded bg-secondary px-2 py-1 text-xs text-fg-tertiary">
        active locale: <strong>{locale}</strong>
      </code>
    </div>
  );
}

const meta = {
  title: 'Foundations/i18n',
  parameters: {
    docs: {
      description: {
        component:
          'Toolbar-driven locale demo. The story reads `globals.locale` and renders the string catalog for the active language.',
      },
    },
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

// Single story; the locale axis lives on the toolbar so a reviewer
// flips it interactively (and Chromatic captures the EN baseline).
export const Default: Story = {
  render: (_args, { globals }) => {
    const locale = (globals.locale as 'en' | 'tr' | undefined) ?? 'en';
    return <I18nDemo locale={locale} />;
  },
};
