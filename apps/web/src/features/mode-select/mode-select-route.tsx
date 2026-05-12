// Mode selector — the entry point a first-run web user lands on (#353).
// Owns the local probe + preference persistence + flush-on-switch. Pure
// card primitives are imported; no fetching happens inside them.
//
// Probe target follows ADR 0024: Glaon does not advertise its own
// `glaon.local`; we probe the user's HA hostname. A `lastLocalUrl` from
// a prior session is preferred; otherwise we fall back to
// `http://homeassistant.local:8123` which is HA's default mDNS name.

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import type { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';

import { LanguageSwitcher } from '../../i18n/LanguageSwitcher';
import { probeLocal, type LocalProbeResult } from './local-probe';
import { ModeSelectorCard } from './mode-selector-card';
import {
  readModePreference,
  writeModePreference,
  type ModeChoice,
  type ModePreference,
} from './mode-preference';

const DEFAULT_LOCAL_URL = 'http://homeassistant.local:8123';

interface ModeSelectRouteProps {
  readonly cloudAvailable: boolean;
  readonly defaultLocalUrl?: string;
  readonly onChoose: (preference: ModePreference) => void;
}

export function ModeSelectRoute({
  cloudAvailable,
  defaultLocalUrl = DEFAULT_LOCAL_URL,
  onChoose,
}: ModeSelectRouteProps): ReactNode {
  const { t } = useTranslation();
  const [manualUrl, setManualUrl] = useState<string>('');
  const probeUrl = useMemo(() => {
    const stored = readModePreference();
    if (stored?.lastLocalUrl !== undefined && stored.lastLocalUrl.length > 0) {
      return stored.lastLocalUrl;
    }
    return defaultLocalUrl;
  }, [defaultLocalUrl]);
  const [probeState, setProbeState] = useState<{
    status: 'pending' | 'done';
    result: LocalProbeResult | null;
  }>({ status: 'pending', result: null });

  useEffect(() => {
    const ctl = { cancelled: false };
    void (async () => {
      const result = await probeLocal(probeUrl);
      if (ctl.cancelled) return;
      setProbeState({ status: 'done', result });
    })();
    return () => {
      ctl.cancelled = true;
    };
  }, [probeUrl]);

  const choose = (mode: ModeChoice, lastLocalUrl?: string): void => {
    const preference: ModePreference =
      lastLocalUrl !== undefined && lastLocalUrl.length > 0 ? { mode, lastLocalUrl } : { mode };
    writeModePreference(preference);
    onChoose(preference);
  };

  const localMeta = describeLocal(probeState, t);

  return (
    <main data-testid="mode-select-route">
      <h1>{t('modeSelect.heading')}</h1>
      <p>{t('modeSelect.subheading')}</p>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1rem',
          marginTop: '1.5rem',
        }}
      >
        <ModeSelectorCard
          mode="local"
          title={t('modeSelect.local.title')}
          description={t('modeSelect.local.description')}
          meta={localMeta}
          onSelect={() => {
            choose('local', probeState.result?.reachable === true ? probeUrl : undefined);
          }}
        />
        <ModeSelectorCard
          mode="cloud"
          title={t('modeSelect.cloud.title')}
          description={t('modeSelect.cloud.description')}
          disabled={!cloudAvailable}
          meta={cloudAvailable ? undefined : t('modeSelect.cloud.unavailable')}
          onSelect={() => {
            choose('cloud');
          }}
        />
      </div>

      <section
        data-testid="mode-select-manual-url"
        style={{ marginTop: '1.75rem' }}
        aria-label={t('modeSelect.manual.ariaLabel')}
      >
        <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>
          {t('modeSelect.manual.label')}
          <input
            type="url"
            inputMode="url"
            placeholder={t('modeSelect.manual.placeholder')}
            value={manualUrl}
            onChange={(event) => {
              setManualUrl(event.target.value);
            }}
            style={{
              display: 'block',
              width: '100%',
              padding: '0.5rem 0.75rem',
              borderRadius: '6px',
              border: '1px solid #d0d7de',
              marginTop: '0.5rem',
              font: 'inherit',
            }}
          />
        </label>
        <button
          type="button"
          data-testid="mode-select-manual-submit"
          disabled={manualUrl.trim().length === 0}
          onClick={() => {
            choose('local', manualUrl.trim());
          }}
          style={{
            marginTop: '0.5rem',
            padding: '0.5rem 1rem',
            borderRadius: '6px',
            border: '1px solid #d0d7de',
            background: 'white',
            cursor: manualUrl.trim().length === 0 ? 'not-allowed' : 'pointer',
            font: 'inherit',
          }}
        >
          {t('modeSelect.manual.submit')}
        </button>
      </section>

      <div style={{ marginTop: '1.5rem', maxWidth: '240px' }}>
        <LanguageSwitcher />
      </div>
    </main>
  );
}

function describeLocal(
  state: {
    status: 'pending' | 'done';
    result: LocalProbeResult | null;
  },
  t: TFunction,
): string {
  if (state.status === 'pending') return t('modeSelect.local.probing');
  if (state.result?.reachable === true)
    return t('modeSelect.local.found', { url: state.result.url });
  return t('modeSelect.local.notFound');
}
