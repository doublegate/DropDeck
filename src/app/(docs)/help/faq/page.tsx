import { ArrowLeft } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'FAQ',
  description: 'Frequently asked questions about DropDeck',
};

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQSection {
  title: string;
  items: FAQItem[];
}

const FAQ_SECTIONS: FAQSection[] = [
  {
    title: 'General',
    items: [
      {
        question: 'What is DropDeck?',
        answer:
          'DropDeck is a unified delivery tracking dashboard that aggregates real-time tracking information from multiple delivery platforms like Instacart, DoorDash, Uber Eats, Amazon, and more into a single view.',
      },
      {
        question: 'Is DropDeck free to use?',
        answer:
          'DropDeck is currently in beta and free for beta users. We plan to offer a free tier with basic features and premium tiers with advanced functionality in the future.',
      },
      {
        question: 'Which platforms does DropDeck support?',
        answer:
          'We currently support Instacart, DoorDash, Uber Eats, Amazon (Fresh and Prime), Walmart+, Shipt, Drizly, Total Wine, Costco, and Sams Club. We are actively working to add more platforms.',
      },
    ],
  },
  {
    title: 'Account & Security',
    items: [
      {
        question: 'How do I create an account?',
        answer:
          'You can sign up using your Google or GitHub account. We use OAuth for secure authentication, which means we never see or store your password.',
      },
      {
        question: 'Is my data secure?',
        answer:
          'Yes. All sensitive data like platform tokens are encrypted using AES-256-GCM encryption before storage. We use industry-standard security practices and never store your platform passwords.',
      },
      {
        question: 'Can I delete my account?',
        answer:
          'Yes, you can delete your account at any time from Settings > Account > Delete Account. This will permanently remove all your data, including connected platforms and delivery history.',
      },
    ],
  },
  {
    title: 'Platform Connections',
    items: [
      {
        question: 'Why do I need to connect my platform accounts?',
        answer:
          'Connecting your accounts allows DropDeck to securely access your order and delivery information. We use OAuth authorization when available, which means you log in directly with the platform and grant us limited access.',
      },
      {
        question: 'What happens if a platform connection expires?',
        answer:
          'DropDeck will notify you when a connection expires. You can reconnect by going to Settings > Platforms and clicking "Reconnect" next to the affected platform.',
      },
      {
        question: 'Can DropDeck place orders on my behalf?',
        answer:
          'No. DropDeck only has read-only access to your order and delivery information. We cannot place orders, modify orders, or take any actions on your accounts.',
      },
    ],
  },
  {
    title: 'Tracking & Notifications',
    items: [
      {
        question: 'How often is delivery information updated?',
        answer:
          'Active deliveries are updated in real-time through webhooks and polling. Driver location updates typically refresh every 10-30 seconds depending on the platform.',
      },
      {
        question: 'Why is the ETA different from what the platform shows?',
        answer:
          'DropDeck displays the ETA provided by each platform. Minor differences may occur due to update timing. The platform app always has the most authoritative ETA.',
      },
      {
        question: 'How do I enable push notifications?',
        answer:
          'When you first sign in, your browser will ask for notification permissions. You can also enable them later from Settings > Notifications. Make sure notifications are not blocked in your browser settings.',
      },
    ],
  },
  {
    title: 'Troubleshooting',
    items: [
      {
        question: 'My delivery is not showing up. What should I do?',
        answer:
          'First, verify the platform is connected in Settings > Platforms. If connected, try clicking "Sync" to manually refresh. If the issue persists, the order may not be in a trackable state yet.',
      },
      {
        question: 'The map is not loading. How can I fix this?',
        answer:
          'Make sure you are connected to the internet and have not blocked location services. Try refreshing the page. If the issue continues, try clearing your browser cache.',
      },
      {
        question: 'I am not receiving notifications. What is wrong?',
        answer:
          'Check that notifications are enabled in Settings > Notifications. Also verify your browser has notification permissions for DropDeck. Some browsers or devices may have Do Not Disturb modes enabled.',
      },
    ],
  },
];

export default function FAQPage() {
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
        <h1 className="text-3xl font-bold tracking-tight mb-4">Frequently Asked Questions</h1>
        <p className="text-lg text-muted-foreground">
          Find answers to common questions about DropDeck.
        </p>
      </header>

      {/* FAQ sections */}
      <div className="space-y-12">
        {FAQ_SECTIONS.map((section) => (
          <section key={section.title}>
            <h2 className="text-xl font-semibold mb-6 pb-2 border-b">{section.title}</h2>
            <div className="space-y-6">
              {section.items.map((item) => (
                <div key={item.question}>
                  <h3 className="font-medium mb-2">{item.question}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{item.answer}</p>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>

      {/* Contact CTA */}
      <div className="mt-12 rounded-lg border bg-card p-6 text-center">
        <h2 className="font-semibold mb-2">Did not find what you were looking for?</h2>
        <p className="text-muted-foreground mb-4 text-sm">
          Our support team is happy to help with any other questions.
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
