import { Bell, BookOpen, HelpCircle, Link2, MapPin, Settings } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Help Center',
  description: 'Get started with DropDeck and learn how to track all your deliveries in one place',
};

const HELP_SECTIONS = [
  {
    title: 'Getting Started',
    description: 'New to DropDeck? Start here to set up your account',
    icon: BookOpen,
    href: '/help/getting-started',
    articles: [
      'Creating your account',
      'Connecting your first platform',
      'Understanding the dashboard',
    ],
  },
  {
    title: 'Connecting Platforms',
    description: 'Learn how to connect delivery platforms',
    icon: Link2,
    href: '/help/platforms',
    articles: [
      'Instacart integration',
      'DoorDash integration',
      'Uber Eats integration',
      'Amazon integration',
    ],
  },
  {
    title: 'Live Tracking',
    description: 'Track your deliveries in real-time',
    icon: MapPin,
    href: '/help/tracking',
    articles: ['Using the live map', 'Understanding ETA estimates', 'Driver location updates'],
  },
  {
    title: 'Notifications',
    description: 'Stay updated on your deliveries',
    icon: Bell,
    href: '/help/notifications',
    articles: ['Setting up notifications', 'Notification types', 'Quiet hours configuration'],
  },
  {
    title: 'Settings',
    description: 'Customize your DropDeck experience',
    icon: Settings,
    href: '/help/settings',
    articles: ['Theme preferences', 'Platform ordering', 'Account management'],
  },
  {
    title: 'Troubleshooting',
    description: 'Having issues? Find solutions here',
    icon: HelpCircle,
    href: '/help/troubleshooting',
    articles: ['Connection problems', 'Missing deliveries', 'Map not loading'],
  },
];

export default function HelpPage() {
  return (
    <div className="max-w-4xl mx-auto">
      {/* Hero section */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold tracking-tight mb-4">How can we help you?</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Find answers to common questions or browse our documentation to get the most out of
          DropDeck.
        </p>
      </div>

      {/* Search (basic) */}
      <div className="mb-12">
        <div className="relative">
          <input
            type="search"
            placeholder="Search for help articles..."
            className="w-full h-12 px-4 rounded-lg border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      {/* Help sections grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-12">
        {HELP_SECTIONS.map((section) => (
          <Link
            key={section.href}
            href={section.href}
            className="group block rounded-lg border bg-card p-6 hover:border-primary transition-colors"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="rounded-lg bg-primary/10 p-2 text-primary">
                <section.icon className="h-5 w-5" />
              </div>
              <h2 className="font-semibold group-hover:text-primary transition-colors">
                {section.title}
              </h2>
            </div>
            <p className="text-sm text-muted-foreground mb-4">{section.description}</p>
            <ul className="text-sm space-y-1">
              {section.articles.slice(0, 3).map((article) => (
                <li key={article} className="text-muted-foreground">
                  {article}
                </li>
              ))}
            </ul>
          </Link>
        ))}
      </div>

      {/* Quick links */}
      <div className="rounded-lg border bg-card p-6">
        <h2 className="font-semibold mb-4">Quick Links</h2>
        <div className="flex flex-wrap gap-4">
          <Link href="/help/faq" className="text-sm text-primary hover:underline">
            Frequently Asked Questions
          </Link>
          <Link href="/help/getting-started" className="text-sm text-primary hover:underline">
            Quick Start Guide
          </Link>
          <Link href="/help/troubleshooting" className="text-sm text-primary hover:underline">
            Troubleshooting Guide
          </Link>
          <Link href="/status" className="text-sm text-primary hover:underline">
            System Status
          </Link>
        </div>
      </div>

      {/* Contact section */}
      <div className="mt-12 text-center">
        <h2 className="text-xl font-semibold mb-2">Still need help?</h2>
        <p className="text-muted-foreground mb-4">Our support team is here to assist you.</p>
        <Link
          href="mailto:support@dropdeck.app"
          className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Contact Support
        </Link>
      </div>
    </div>
  );
}
