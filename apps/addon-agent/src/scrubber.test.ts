import { describe, expect, it } from 'vitest';

import { scrub } from './scrubber';

describe('scrubber', () => {
  it('redacts HA / Clerk / relay tokens at any nesting depth', () => {
    const input = {
      msg: 'connect',
      relay_secret: 'plain-text',
      headers: { authorization: 'Bearer xyz' },
      ha: { supervisor_token: 'ha-token' },
    };
    expect(scrub(input)).toEqual({
      msg: 'connect',
      relay_secret: '[REDACTED]',
      headers: { authorization: '[REDACTED]' },
      ha: { supervisor_token: '[REDACTED]' },
    });
  });

  it('matches keys case-insensitively', () => {
    expect(scrub({ Authorization: 'x' })).toEqual({ Authorization: '[REDACTED]' });
  });

  it('walks arrays', () => {
    expect(scrub({ events: [{ jwt: 'x' }] })).toEqual({ events: [{ jwt: '[REDACTED]' }] });
  });

  it('redacts a Bearer token embedded in a free-form string value', () => {
    expect(scrub({ msg: 'request failed: Bearer eyJabc.def.ghi rejected' })).toEqual({
      msg: 'request failed: Bearer [REDACTED] rejected',
    });
  });

  it('redacts a JWT-shaped substring in a free-form string value', () => {
    // Three base64url-ish segments, each ≥6 chars — matches the JWT regex
    // without containing real high-entropy material that would trip
    // secret-scanning tooling.
    expect(scrub({ msg: 'token=aaaaaa.bbbbbb.cccccc leaked' })).toEqual({
      msg: 'token=[REDACTED-JWT] leaked',
    });
  });

  it('leaves dotted identifiers shorter than the JWT shape alone', () => {
    expect(scrub({ msg: 'home_id=h-1.region.zone' })).toEqual({
      msg: 'home_id=h-1.region.zone',
    });
  });

  it('redacts top-level string inputs', () => {
    expect(scrub('Authorization: Bearer abc123')).toBe('Authorization: Bearer [REDACTED]');
  });

  it('preserves non-secret string content untouched', () => {
    expect(scrub({ msg: 'connected to relay.glaon.app, home=h-1' })).toEqual({
      msg: 'connected to relay.glaon.app, home=h-1',
    });
  });
});
