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
});
