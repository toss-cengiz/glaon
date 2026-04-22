// Lighthouse CI — desktop preset.
// Mobile counterpart: .lighthouserc.mobile.cjs (looser perf budget, same
// metric thresholds). See docs/performance.md for budget rationale.
module.exports = {
  ci: {
    collect: {
      startServerCommand: 'pnpm --filter @glaon/web preview -- --port 4173 --strictPort',
      startServerReadyPattern: 'Local:',
      url: ['http://localhost:4173/'],
      numberOfRuns: 3,
      settings: {
        preset: 'desktop',
        // Chrome on GitHub runners needs --no-sandbox and uses the
        // headless build; the rest follows LHCI autorun defaults.
        chromeFlags: '--no-sandbox --headless=new',
      },
    },
    assert: {
      assertions: {
        'categories:performance': ['error', { minScore: 0.9 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
        'total-blocking-time': ['error', { maxNumericValue: 200 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
};
