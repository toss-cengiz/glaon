import { useMemo, type ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';

import { createI18n } from './instance';

interface I18nProviderProps {
  readonly children: ReactNode;
}

export function I18nProvider({ children }: I18nProviderProps): ReactNode {
  const instance = useMemo(() => createI18n(), []);
  return <I18nextProvider i18n={instance}>{children}</I18nextProvider>;
}
