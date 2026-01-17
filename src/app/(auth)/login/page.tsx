import { CheckCircle, Lock, Package, Zap } from 'lucide-react';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { OAuthButtons } from '@/components/auth/oauth-buttons';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { getSession } from '@/lib/auth';

export const metadata: Metadata = {
  title: 'Sign In - DropDeck',
  description: 'Sign in to your DropDeck account to track all your deliveries in one place.',
};

export default async function LoginPage() {
  const session = await getSession();

  // Redirect if already authenticated
  if (session) {
    redirect('/dashboard');
  }

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
          <p className="text-[var(--dd-text-tertiary)] text-sm">Every drop. One deck.</p>
        </div>

        {/* Login Card */}
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-xl">Welcome back</CardTitle>
            <CardDescription>
              Sign in to track all your deliveries in one unified dashboard.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <OAuthButtons callbackUrl="/dashboard" />

            <div className="relative my-6">
              <Separator />
              <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-[var(--dd-bg-card)] px-2 text-xs text-[var(--dd-text-muted)]">
                secure authentication
              </span>
            </div>

            <p className="text-center text-xs text-[var(--dd-text-muted)]">
              By signing in, you agree to our{' '}
              <a href="/terms" className="text-brand-cyan hover:underline">
                Terms of Service
              </a>{' '}
              and{' '}
              <a href="/privacy" className="text-brand-cyan hover:underline">
                Privacy Policy
              </a>
              .
            </p>
          </CardContent>
        </Card>

        {/* Features Preview */}
        <div className="mt-8 grid grid-cols-3 gap-4 text-center">
          <div className="flex flex-col items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--dd-bg-tertiary)]">
              <CheckCircle className="h-5 w-5 text-brand-cyan" aria-hidden="true" />
            </div>
            <span className="text-xs text-[var(--dd-text-tertiary)]">10+ Platforms</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--dd-bg-tertiary)]">
              <Zap className="h-5 w-5 text-brand-cyan" aria-hidden="true" />
            </div>
            <span className="text-xs text-[var(--dd-text-tertiary)]">Real-time</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--dd-bg-tertiary)]">
              <Lock className="h-5 w-5 text-brand-cyan" aria-hidden="true" />
            </div>
            <span className="text-xs text-[var(--dd-text-tertiary)]">Secure</span>
          </div>
        </div>
      </div>
    </div>
  );
}
