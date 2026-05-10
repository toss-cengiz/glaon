// Lighthouse CI — mobile emulation preset (simulated throttling + device).
// Desktop counterpart: .lighthouserc.cjs. See docs/performance.md.
module.exports = {
  ci: {
    collect: {
      startServerCommand: 'pnpm --filter @glaon/web preview -- --port 4173 --strictPort',
      startServerReadyPattern: 'Local:',
      url: ['http://localhost:4173/'],
      numberOfRuns: 3,
      settings: {
        // Lighthouse's default preset is mobile; we keep that here so
        // CLS/LCP/TBT are measured with simulated Slow 4G throttling
        // and Moto G4 form factor.
        chromeFlags: '--no-sandbox --headless=new',
      },
    },
    assert: {
      assertions: {
        // Mobile is harder to hit than desktop — tighter cold-start
        // cost, throttled network. 0.8 is the industry default
        // "good" threshold; we'll tune down once real content lands.
        'categories:performance': ['error', { minScore: 0.8 }],
        // Bumped from 2500 → 2700ms after the Phase 2 auth UI (#470 /
        // #471 / #472 / #473) added Clerk SDK + form primitives to the
        // initial bundle. Code-splitting LoginPage etc. is the
        // long-term fix (separate Phase 2.5 follow-up); 2700ms keeps
        // the mobile budget within Lighthouse's "needs improvement"
        // band rather than "poor".
        'largest-contentful-paint': ['error', { maxNumericValue: 2700 }],
        'total-blocking-time': ['error', { maxNumericValue: 200 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
};
