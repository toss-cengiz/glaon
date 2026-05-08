import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { SignInRoute } from './sign-in-route';
import { SignUpRoute } from './sign-up-route';

interface ClerkRouteProps {
  readonly forceRedirectUrl?: string;
}
vi.mock('@clerk/clerk-react', () => ({
  SignIn: (props: ClerkRouteProps) => (
    <div data-testid="mock-sign-in" data-redirect={props.forceRedirectUrl ?? ''}>
      sign-in
    </div>
  ),
  SignUp: (props: ClerkRouteProps) => (
    <div data-testid="mock-sign-up" data-redirect={props.forceRedirectUrl ?? ''}>
      sign-up
    </div>
  ),
}));

describe('SignInRoute', () => {
  it('renders Clerk SignIn under the cloud-sign-in-route landmark', () => {
    render(<SignInRoute />);
    expect(screen.getByTestId('cloud-sign-in-route')).toBeInTheDocument();
    expect(screen.getByTestId('mock-sign-in')).toHaveAttribute('data-redirect', '/');
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/sign in/i);
  });

  it('forwards the redirectUrl prop to Clerk', () => {
    render(<SignInRoute redirectUrl="/dashboard" />);
    expect(screen.getByTestId('mock-sign-in')).toHaveAttribute('data-redirect', '/dashboard');
  });
});

describe('SignUpRoute', () => {
  it('renders Clerk SignUp under the cloud-sign-up-route landmark', () => {
    render(<SignUpRoute />);
    expect(screen.getByTestId('cloud-sign-up-route')).toBeInTheDocument();
    expect(screen.getByTestId('mock-sign-up')).toHaveAttribute('data-redirect', '/');
  });
});
