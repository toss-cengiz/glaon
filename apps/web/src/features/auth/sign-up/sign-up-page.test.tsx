// SignUpPage smoke. Drives the form through a fake `useSignUp` so the
// happy path (`signUp.create` → `prepareEmailAddressVerification` →
// `/verify-email?after=signup`) is exercised end-to-end without
// touching Clerk's network.

import { ToastProvider } from '@glaon/ui';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AuthProvider } from '../../../auth/auth-provider';
import { WebTokenStore } from '../../../auth/web-token-store';
import { SignUpPage } from './sign-up-page';

const createSpy = vi.fn();
const prepareSpy = vi.fn();

vi.mock('@clerk/clerk-react', () => ({
  useSignUp: () => ({
    isLoaded: true,
    signUp: {
      create: createSpy,
      prepareEmailAddressVerification: prepareSpy,
      authenticateWithRedirect: vi.fn(() => Promise.resolve(undefined)),
    },
  }),
}));

function renderPage(navigate?: (url: string) => void) {
  const tokenStore = new WebTokenStore({ logoutEndpoint: '/auth/logout' });
  // ToastProvider mirrors apps/web App.tsx; SignUpPage calls
  // `useToast()` for general API errors (#527).
  const ui = (
    <AuthProvider tokenStore={tokenStore}>
      <ToastProvider>
        <SignUpPage imageSlot={null} {...(navigate !== undefined ? { navigate } : {})} />
      </ToastProvider>
    </AuthProvider>
  );
  return render(ui);
}

function fillField(formEl: HTMLElement, label: RegExp, value: string) {
  const input = within(formEl).getByLabelText(label);
  fireEvent.change(input, { target: { value } });
}

function fillPassword(formEl: HTMLElement, value: string, index: number) {
  const inputs = formEl.querySelectorAll<HTMLInputElement>('input[type="password"]');
  const target = inputs[index];
  expect(target).toBeDefined();
  if (target !== undefined) {
    fireEvent.change(target, { target: { value } });
  }
}

describe('SignUpPage', () => {
  beforeEach(() => {
    createSpy.mockReset();
    prepareSpy.mockReset();
  });

  it('renders the Sign up heading and the form', () => {
    renderPage();
    expect(screen.getByRole('heading', { level: 1, name: /sign up/i })).toBeInTheDocument();
    expect(screen.getByTestId('signup-form')).toBeInTheDocument();
  });

  it('shows an inline error when passwords do not match', async () => {
    renderPage();
    const form = screen.getByTestId('signup-form');
    fillField(form, /name/i, 'Olivia');
    fillField(form, /email/i, 'olivia@untitledui.com');
    fillPassword(form, 'correct-horse', 0);
    fillPassword(form, 'different-pony', 1);
    fireEvent.click(within(form).getByRole('button', { name: /get started/i }));
    await waitFor(() => {
      expect(screen.getByTestId('signup-form')).toBeInTheDocument();
    });
    // The mismatch never reaches Clerk.
    expect(createSpy).not.toHaveBeenCalled();
  });

  it('rejects passwords shorter than 8 characters', async () => {
    renderPage();
    const form = screen.getByTestId('signup-form');
    fillField(form, /name/i, 'Olivia');
    fillField(form, /email/i, 'olivia@untitledui.com');
    fillPassword(form, 'short', 0);
    fillPassword(form, 'short', 1);
    fireEvent.click(within(form).getByRole('button', { name: /get started/i }));
    await waitFor(() => {
      expect(createSpy).not.toHaveBeenCalled();
    });
  });

  it('submits to Clerk and redirects to the verification page on success', async () => {
    createSpy.mockResolvedValueOnce(undefined);
    prepareSpy.mockResolvedValueOnce(undefined);
    const navigate = vi.fn();
    renderPage(navigate);
    const form = screen.getByTestId('signup-form');
    fillField(form, /name/i, 'Olivia');
    fillField(form, /email/i, 'olivia@untitledui.com');
    fillPassword(form, 'correct-horse', 0);
    fillPassword(form, 'correct-horse', 1);
    fireEvent.click(within(form).getByRole('button', { name: /get started/i }));

    await waitFor(() => {
      expect(createSpy).toHaveBeenCalledTimes(1);
    });
    const arg = createSpy.mock.calls[0]?.[0] as { emailAddress: string; password: string };
    expect(arg.emailAddress).toBe('olivia@untitledui.com');
    expect(arg.password).toBe('correct-horse');
    expect(prepareSpy).toHaveBeenCalledWith({ strategy: 'email_code' });
    await waitFor(() => {
      expect(navigate).toHaveBeenCalledWith('/verify-email?after=signup');
    });
  });
});
