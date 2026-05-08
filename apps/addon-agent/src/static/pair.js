/* global document, fetch */
(() => {
  'use strict';

  const states = {
    loading: document.getElementById('state-loading'),
    paired: document.getElementById('state-paired'),
    form: document.getElementById('state-form'),
    success: document.getElementById('state-success'),
  };
  const form = document.getElementById('pair-form');
  const input = document.getElementById('code-input');
  const submitBtn = document.getElementById('submit-btn');
  const errorEl = document.getElementById('code-error');
  const pairedHome = document.getElementById('paired-home');
  const pairedCloud = document.getElementById('paired-cloud');

  function show(name) {
    for (const [key, el] of Object.entries(states)) {
      if (!el) continue;
      el.hidden = key !== name;
    }
  }

  function setError(message) {
    if (!errorEl) return;
    errorEl.textContent = message;
  }

  async function readJson(response) {
    try {
      return await response.json();
    } catch {
      return {};
    }
  }

  function userMessageFor(status, body) {
    if (status === 400 && body && body.error === 'code-required') {
      return 'Please enter the 6-digit code.';
    }
    if (status === 401) return "That code didn't match. Double-check and try again.";
    if (status === 410) {
      if (body && body.code === 'code-already-claimed') {
        return 'That code was already used. Generate a new one in the Glaon app.';
      }
      return 'That code expired. Generate a new one in the Glaon app.';
    }
    if (status === 429) {
      const seconds =
        body && typeof body.retryAfterMs === 'number' ? Math.ceil(body.retryAfterMs / 1000) : null;
      if (seconds !== null && seconds > 0) {
        return `Too many attempts. Try again in about ${seconds} second${seconds === 1 ? '' : 's'}.`;
      }
      return 'Too many attempts. Try again in a moment.';
    }
    if (status === 502) return 'Could not reach the Glaon cloud. Check your internet connection.';
    return 'Something went wrong. Try again in a moment.';
  }

  async function loadStatus() {
    show('loading');
    try {
      const res = await fetch('/pair/status', { headers: { Accept: 'application/json' } });
      const body = await readJson(res);
      if (res.ok && body && body.paired === true) {
        if (pairedHome) pairedHome.textContent = body.homeId || '';
        if (pairedCloud) pairedCloud.textContent = body.cloudUrl || '';
        show('paired');
        return;
      }
    } catch {
      /* fall through to form */
    }
    show('form');
    if (input) input.focus();
  }

  async function submitCode(event) {
    event.preventDefault();
    setError('');
    if (!input) return;
    const code = String(input.value || '').trim();
    if (!/^\d{6}$/.test(code)) {
      setError('Enter the 6-digit code from the Glaon app.');
      input.focus();
      return;
    }
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Linking…';
    }
    try {
      const res = await fetch('/pair/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ code }),
      });
      const body = await readJson(res);
      if (res.ok && body && body.paired === true) {
        if (pairedHome) pairedHome.textContent = body.homeId || '';
        if (pairedCloud) pairedCloud.textContent = body.cloudUrl || '';
        show('success');
        return;
      }
      setError(userMessageFor(res.status, body));
      input.focus();
    } catch {
      setError('Could not reach the addon. Refresh this page and try again.');
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Link this home';
      }
    }
  }

  if (form) form.addEventListener('submit', submitCode);
  void loadStatus();
})();
