import { AlertCircle, ArrowLeft, CheckCircle2 } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Troubleshooting',
  description: 'Solutions to common DropDeck issues',
};

interface TroubleshootingItem {
  problem: string;
  description: string;
  solutions: string[];
}

interface TroubleshootingSection {
  title: string;
  items: TroubleshootingItem[];
}

const TROUBLESHOOTING: TroubleshootingSection[] = [
  {
    title: 'Connection Issues',
    items: [
      {
        problem: 'Platform shows as disconnected',
        description: 'Your platform connection may have expired or encountered an error.',
        solutions: [
          'Go to Settings > Platforms and click "Reconnect" for the affected platform',
          'Sign in to your platform account when prompted',
          'Ensure you have an active account with the delivery platform',
          'Check if the platform is experiencing any outages on their status page',
        ],
      },
      {
        problem: 'Cannot connect new platform',
        description: 'You are unable to complete the platform connection process.',
        solutions: [
          'Disable any ad blockers or privacy extensions temporarily',
          'Try using a different browser (Chrome or Firefox recommended)',
          'Clear your browser cookies and cache',
          'Ensure pop-ups are allowed for DropDeck',
          'Check that you are signed into the correct platform account',
        ],
      },
      {
        problem: 'Connection keeps expiring',
        description: 'Platform connections expire more frequently than expected.',
        solutions: [
          'This is normal for some platforms that issue short-lived tokens',
          'Reconnect when prompted - your data will sync automatically',
          'Ensure you do not revoke access from the platform side',
          'Contact support if connections expire within hours',
        ],
      },
    ],
  },
  {
    title: 'Missing Deliveries',
    items: [
      {
        problem: 'Active delivery not showing',
        description: 'You have an active delivery but it does not appear in DropDeck.',
        solutions: [
          'Verify the platform is connected (Settings > Platforms)',
          'Click the sync button to manually refresh data',
          'Wait 1-2 minutes for new orders to propagate',
          'Check if the order is in a trackable state (confirmed and assigned)',
          'Some orders may not show until a driver is assigned',
        ],
      },
      {
        problem: 'Delivery disappeared',
        description: 'A delivery that was showing is no longer visible.',
        solutions: [
          'Check the Delivered or History section - it may have completed',
          'The order may have been cancelled',
          'Try syncing the platform data manually',
          'The platform connection may have expired - reconnect if needed',
        ],
      },
      {
        problem: 'Wrong delivery status',
        description: 'The delivery status does not match what the platform shows.',
        solutions: [
          'Click sync to fetch the latest status',
          'Status updates may be delayed by up to 30 seconds',
          'Some platforms do not provide real-time status updates',
          'The platform app will always have the most accurate status',
        ],
      },
    ],
  },
  {
    title: 'Map Issues',
    items: [
      {
        problem: 'Map not loading',
        description: 'The map view shows a blank area or loading spinner.',
        solutions: [
          'Check your internet connection',
          'Refresh the page',
          'Clear browser cache and cookies',
          'Disable any browser extensions that may block scripts',
          'Try a different browser',
        ],
      },
      {
        problem: 'Driver location not updating',
        description: 'The driver marker on the map is not moving.',
        solutions: [
          'Location updates depend on the platform providing them',
          'Not all platforms support real-time driver tracking',
          'Some drivers may have location sharing disabled',
          'Wait 30 seconds and the map will auto-refresh',
        ],
      },
      {
        problem: 'Incorrect delivery address',
        description: 'The destination marker is in the wrong location.',
        solutions: [
          'The address is provided by the delivery platform',
          'Check the original order on the platform app',
          'Some addresses may not geocode accurately',
          'This does not affect actual delivery - drivers use correct address',
        ],
      },
    ],
  },
  {
    title: 'Notification Problems',
    items: [
      {
        problem: 'Not receiving any notifications',
        description: 'Push notifications are not appearing.',
        solutions: [
          'Check Settings > Notifications and ensure they are enabled',
          'Allow notifications when your browser asks for permission',
          'Check browser settings - notifications may be blocked for this site',
          'Disable Do Not Disturb mode on your device',
          'On mobile, ensure the browser has notification permissions',
        ],
      },
      {
        problem: 'Receiving too many notifications',
        description: 'Getting more notifications than desired.',
        solutions: [
          'Go to Settings > Notifications to customize which events trigger notifications',
          'Disable notification types you do not need',
          'Set up quiet hours to prevent notifications at night',
          'Disable notifications for specific platforms if needed',
        ],
      },
      {
        problem: 'Delayed notifications',
        description: 'Notifications arrive after the event has occurred.',
        solutions: [
          'Some delay is normal (usually under 30 seconds)',
          'Check your device network connection',
          'Background app refresh may be disabled',
          'Push notification services may experience delays during high traffic',
        ],
      },
    ],
  },
];

export default function TroubleshootingPage() {
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
        <h1 className="text-3xl font-bold tracking-tight mb-4">Troubleshooting Guide</h1>
        <p className="text-lg text-muted-foreground">
          Having issues? Find solutions to common problems below.
        </p>
      </header>

      {/* Troubleshooting sections */}
      <div className="space-y-12">
        {TROUBLESHOOTING.map((section) => (
          <section key={section.title}>
            <h2 className="text-xl font-semibold mb-6 pb-2 border-b">{section.title}</h2>
            <div className="space-y-8">
              {section.items.map((item) => (
                <div key={item.problem} className="rounded-lg border bg-card p-6">
                  <div className="flex items-start gap-3 mb-3">
                    <AlertCircle className="h-5 w-5 text-orange-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-medium">{item.problem}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                    </div>
                  </div>
                  <div className="ml-8 mt-4">
                    <h4 className="text-sm font-medium mb-2">Solutions:</h4>
                    <ul className="space-y-2">
                      {item.solutions.map((solution) => (
                        <li key={solution} className="flex items-start gap-2 text-sm">
                          <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                          <span>{solution}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>

      {/* Still need help */}
      <div className="mt-12 rounded-lg border bg-muted/50 p-6 text-center">
        <h2 className="font-semibold mb-2">Still having trouble?</h2>
        <p className="text-muted-foreground mb-4 text-sm">
          If none of these solutions work, our support team can help.
        </p>
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
