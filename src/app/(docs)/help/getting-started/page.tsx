import { ArrowLeft, ArrowRight, CheckCircle2 } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Getting Started',
  description: 'Learn how to set up DropDeck and start tracking your deliveries',
};

const STEPS = [
  {
    number: 1,
    title: 'Create Your Account',
    description:
      'Sign up for DropDeck using your Google or GitHub account. We use secure OAuth authentication to keep your account safe.',
    details: [
      'Visit dropdeck.app and click "Sign In"',
      'Choose your preferred sign-in method (Google or GitHub)',
      'Authorize DropDeck to access your basic profile information',
      'Your account is created automatically',
    ],
  },
  {
    number: 2,
    title: 'Connect Your First Platform',
    description:
      'Link your delivery accounts to start tracking. We support major platforms like Instacart, DoorDash, Uber Eats, and more.',
    details: [
      'Go to Settings > Platforms',
      'Click "Connect" next to your preferred platform',
      'Sign in to your delivery platform account',
      'Authorize DropDeck to access your order information',
    ],
  },
  {
    number: 3,
    title: 'Explore Your Dashboard',
    description:
      'Once connected, your active deliveries appear on the dashboard with real-time updates.',
    details: [
      'View all active deliveries in one place',
      'See driver locations on the live map',
      'Track ETA updates in real-time',
      'Receive notifications for status changes',
    ],
  },
  {
    number: 4,
    title: 'Configure Notifications',
    description:
      'Set up notifications to stay informed about your deliveries without having to check the app.',
    details: [
      'Enable browser notifications when prompted',
      'Customize which updates you want to receive',
      'Set quiet hours to avoid notifications at night',
      'Choose per-platform notification preferences',
    ],
  },
];

export default function GettingStartedPage() {
  return (
    <div className="max-w-3xl mx-auto">
      {/* Breadcrumb */}
      <nav className="mb-8">
        <Link
          href="/help"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Help Center
        </Link>
      </nav>

      {/* Header */}
      <header className="mb-12">
        <h1 className="text-3xl font-bold tracking-tight mb-4">Getting Started with DropDeck</h1>
        <p className="text-lg text-muted-foreground">
          Follow these steps to set up DropDeck and start tracking all your deliveries in one
          unified dashboard.
        </p>
      </header>

      {/* Steps */}
      <div className="space-y-12">
        {STEPS.map((step, index) => (
          <section key={step.number} className="relative">
            {/* Connection line */}
            {index < STEPS.length - 1 && (
              <div className="absolute left-4 top-12 bottom-0 w-px bg-border" />
            )}

            <div className="flex gap-6">
              {/* Step number */}
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
                {step.number}
              </div>

              {/* Content */}
              <div className="flex-1 pb-8">
                <h2 className="text-xl font-semibold mb-2">{step.title}</h2>
                <p className="text-muted-foreground mb-4">{step.description}</p>

                <ul className="space-y-2">
                  {step.details.map((detail) => (
                    <li key={detail} className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-sm">{detail}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>
        ))}
      </div>

      {/* Tips */}
      <div className="mt-12 rounded-lg border bg-muted/50 p-6">
        <h2 className="font-semibold mb-4">Pro Tips</h2>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li>
            <strong className="text-foreground">Connect multiple platforms</strong> - The more
            platforms you connect, the more useful DropDeck becomes.
          </li>
          <li>
            <strong className="text-foreground">Enable notifications</strong> - Get real-time
            updates without having to keep the app open.
          </li>
          <li>
            <strong className="text-foreground">Pin the dashboard</strong> - Keep DropDeck open in a
            browser tab or use the PWA for quick access.
          </li>
        </ul>
      </div>

      {/* Navigation */}
      <nav className="mt-12 flex items-center justify-between border-t pt-8">
        <Link
          href="/help"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Help Center
        </Link>
        <Link
          href="/help/platforms"
          className="inline-flex items-center text-sm text-primary hover:underline"
        >
          Connecting Platforms
          <ArrowRight className="h-4 w-4 ml-1" />
        </Link>
      </nav>
    </div>
  );
}
