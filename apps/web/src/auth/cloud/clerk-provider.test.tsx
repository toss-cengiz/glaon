import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { CloudAuthProvider, getClerkPublishableKey } from './clerk-provider';

vi.mock('@clerk/clerk-react', () => ({
  ClerkProvider: ({
    publishableKey,
    children,
  }: {
    publishableKey: string;
    children: ReactNode;
  }) => (
    <div data-testid="mock-clerk-provider" data-publishable-key={publishableKey}>
      {children}
    </div>
  ),
}));

describe('CloudAuthProvider', () => {
  it('mounts ClerkProvider with the provided publishable key', () => {
    render(
      <CloudAuthProvider publishableKey="pk_test_abc">
        <span data-testid="child">child</span>
      </CloudAuthProvider>,
    );
    const provider = screen.getByTestId('mock-clerk-provider');
    expect(provider).toHaveAttribute('data-publishable-key', 'pk_test_abc');
    expect(screen.getByTestId('child')).toBeInTheDocument();
  });
});

describe('getClerkPublishableKey', () => {
  it('returns null when the env var is unset (default test environment)', () => {
    expect(getClerkPublishableKey()).toBeNull();
  });
});
