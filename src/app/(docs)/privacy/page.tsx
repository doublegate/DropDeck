import { ArrowLeft } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'DropDeck Privacy Policy - How we collect, use, and protect your data',
};

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto prose prose-slate dark:prose-invert">
      {/* Breadcrumb */}
      <nav className="not-prose mb-8">
        <Link
          href="/help"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Help Center
        </Link>
      </nav>

      <h1>Privacy Policy</h1>

      <p className="lead">Last updated: January 2026</p>

      <p>
        This Privacy Policy describes how DropDeck (&quot;we,&quot; &quot;us,&quot; or
        &quot;our&quot;) collects, uses, and shares information about you when you use our website
        and services (collectively, the &quot;Service&quot;).
      </p>

      <h2>Information We Collect</h2>

      <h3>Information You Provide</h3>
      <ul>
        <li>
          <strong>Account Information:</strong> When you create an account, we collect your name,
          email address, and profile picture from your OAuth provider (Google or GitHub).
        </li>
        <li>
          <strong>Platform Connections:</strong> When you connect delivery platforms, we receive
          OAuth tokens that allow us to access your order and delivery information from those
          platforms.
        </li>
        <li>
          <strong>Feedback:</strong> When you submit feedback, we collect the content you provide
          along with metadata about your browser and current page.
        </li>
      </ul>

      <h3>Information Collected Automatically</h3>
      <ul>
        <li>
          <strong>Usage Data:</strong> We collect information about how you use the Service,
          including pages visited, features used, and actions taken.
        </li>
        <li>
          <strong>Device Information:</strong> We collect information about the device and browser
          you use to access the Service.
        </li>
        <li>
          <strong>Log Data:</strong> Our servers automatically record information including your IP
          address, browser type, and access times.
        </li>
      </ul>

      <h2>How We Use Your Information</h2>

      <p>We use the information we collect to:</p>
      <ul>
        <li>Provide, maintain, and improve the Service</li>
        <li>Aggregate and display your delivery information from connected platforms</li>
        <li>Send you notifications about your deliveries (with your consent)</li>
        <li>Respond to your comments, questions, and support requests</li>
        <li>Monitor and analyze trends, usage, and activities</li>
        <li>Detect, investigate, and prevent security incidents</li>
      </ul>

      <h2>Data Storage and Security</h2>

      <h3>Encryption</h3>
      <p>
        All sensitive data, including platform access tokens, is encrypted using AES-256-GCM
        encryption before storage. We never store your platform passwords.
      </p>

      <h3>Data Retention</h3>
      <ul>
        <li>Account data is retained until you delete your account</li>
        <li>Delivery data is cached temporarily and delivery history is retained for 90 days</li>
        <li>Platform tokens are stored until you disconnect the platform or they expire</li>
      </ul>

      <h3>Security Measures</h3>
      <p>
        We implement industry-standard security measures including HTTPS encryption, secure OAuth
        flows, and regular security audits.
      </p>

      <h2>Information Sharing</h2>

      <p>
        We do not sell your personal information. We may share information in the following
        circumstances:
      </p>
      <ul>
        <li>
          <strong>Service Providers:</strong> We work with third-party service providers who perform
          services on our behalf (hosting, analytics, error tracking).
        </li>
        <li>
          <strong>Legal Requirements:</strong> We may disclose information if required by law or in
          response to valid legal process.
        </li>
        <li>
          <strong>Safety:</strong> We may disclose information when we believe it is necessary to
          protect the rights, property, or safety of DropDeck, our users, or others.
        </li>
      </ul>

      <h2>Your Rights and Choices</h2>

      <h3>Access and Portability</h3>
      <p>
        You can access your data through the Service. Contact us to request a copy of your data.
      </p>

      <h3>Deletion</h3>
      <p>
        You can delete your account at any time from Settings. This will permanently delete all your
        data, including connected platforms and delivery history.
      </p>

      <h3>Platform Connections</h3>
      <p>
        You can disconnect any platform at any time from Settings. This immediately revokes our
        access and deletes stored tokens.
      </p>

      <h3>Notifications</h3>
      <p>You can manage notification preferences in Settings or disable them entirely.</p>

      <h2>Third-Party Services</h2>

      <p>
        The Service integrates with third-party delivery platforms. Your use of those platforms is
        subject to their respective privacy policies:
      </p>
      <ul>
        <li>Instacart Privacy Policy</li>
        <li>DoorDash Privacy Policy</li>
        <li>Uber Eats Privacy Policy</li>
        <li>Amazon Privacy Policy</li>
        <li>Walmart Privacy Policy</li>
      </ul>

      <h2>Cookies and Tracking</h2>

      <p>We use essential cookies for:</p>
      <ul>
        <li>Session management and authentication</li>
        <li>Remembering your preferences</li>
        <li>Security and fraud prevention</li>
      </ul>

      <p>
        We use analytics tools to understand how the Service is used. You can opt out of analytics
        tracking in your browser settings.
      </p>

      <h2>Children&apos;s Privacy</h2>

      <p>
        The Service is not intended for children under 13. We do not knowingly collect personal
        information from children under 13.
      </p>

      <h2>Changes to This Policy</h2>

      <p>
        We may update this Privacy Policy from time to time. We will notify you of any changes by
        posting the new policy on this page and updating the &quot;Last updated&quot; date.
      </p>

      <h2>Contact Us</h2>

      <p>If you have questions about this Privacy Policy, please contact us at:</p>
      <p>
        <a href="mailto:privacy@dropdeck.app">privacy@dropdeck.app</a>
      </p>
    </div>
  );
}
