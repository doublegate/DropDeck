import { AlertTriangle, ArrowLeft, Package } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export const metadata: Metadata = {
  title: 'Authentication Error - DropDeck',
  description: 'An error occurred during authentication.',
};

interface AuthErrorPageProps {
  searchParams: Promise<{ error?: string }>;
}

const errorMessages: Record<string, { title: string; description: string }> = {
  Configuration: {
    title: 'Server Configuration Error',
    description: 'There is a problem with the server configuration. Please try again later.',
  },
  AccessDenied: {
    title: 'Access Denied',
    description:
      'You do not have permission to sign in. Please contact support if you believe this is an error.',
  },
  Verification: {
    title: 'Verification Error',
    description:
      'The verification link may have expired or already been used. Please try signing in again.',
  },
  OAuthSignin: {
    title: 'OAuth Sign In Error',
    description: 'There was a problem signing in with the selected provider. Please try again.',
  },
  OAuthCallback: {
    title: 'OAuth Callback Error',
    description: 'There was a problem processing the authentication response. Please try again.',
  },
  OAuthCreateAccount: {
    title: 'Account Creation Error',
    description:
      'There was a problem creating your account. The email may already be in use with another provider.',
  },
  EmailCreateAccount: {
    title: 'Account Creation Error',
    description: 'There was a problem creating your account. Please try again.',
  },
  Callback: {
    title: 'Callback Error',
    description: 'There was a problem during the authentication process. Please try again.',
  },
  OAuthAccountNotLinked: {
    title: 'Account Not Linked',
    description:
      'This email is already associated with another account. Please sign in using the original provider.',
  },
  EmailSignin: {
    title: 'Email Sign In Error',
    description: 'There was a problem sending the sign in email. Please try again.',
  },
  CredentialsSignin: {
    title: 'Sign In Error',
    description: 'The credentials provided are invalid. Please check your email and password.',
  },
  SessionRequired: {
    title: 'Session Required',
    description: 'You must be signed in to access this page.',
  },
  Default: {
    title: 'Authentication Error',
    description: 'An unexpected error occurred during authentication. Please try again.',
  },
};

export default async function AuthErrorPage({ searchParams }: AuthErrorPageProps) {
  const params = await searchParams;
  const error = params.error ?? 'Default';
  const errorInfo = errorMessages[error] ??
    errorMessages.Default ?? { title: 'Error', description: 'An error occurred.' };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--dd-bg-secondary)] p-4">
      <div className="w-full max-w-md">
        {/* Logo and Branding */}
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-cyan">
              <Package className="h-7 w-7 text-white" />
            </div>
            <span className="text-3xl font-bold text-[var(--dd-text-primary)]">DropDeck</span>
          </div>
        </div>

        {/* Error Card */}
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-error/10">
              <AlertTriangle className="h-6 w-6 text-error" />
            </div>
            <CardTitle className="text-xl">{errorInfo.title}</CardTitle>
            <CardDescription>{errorInfo.description}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Button asChild className="w-full">
              <Link href="/login">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Sign In
              </Link>
            </Button>
            <Button variant="ghost" asChild className="w-full">
              <Link href="/">Go to Homepage</Link>
            </Button>
          </CardContent>
        </Card>

        {/* Support Link */}
        <p className="mt-6 text-center text-sm text-[var(--dd-text-muted)]">
          Need help?{' '}
          <a href="mailto:support@dropdeck.app" className="text-brand-cyan hover:underline">
            Contact Support
          </a>
        </p>
      </div>
    </div>
  );
}
