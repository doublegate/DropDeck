import { ArrowLeft } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'DropDeck Terms of Service - Rules and guidelines for using our service',
};

export default function TermsPage() {
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

      <h1>Terms of Service</h1>

      <p className="lead">Last updated: January 2026</p>

      <p>
        Please read these Terms of Service (&quot;Terms&quot;) carefully before using the DropDeck
        website and service (the &quot;Service&quot;) operated by DropDeck (&quot;we,&quot;
        &quot;us,&quot; or &quot;our&quot;).
      </p>

      <h2>1. Acceptance of Terms</h2>

      <p>
        By accessing or using the Service, you agree to be bound by these Terms. If you disagree
        with any part of the Terms, you may not access the Service.
      </p>

      <h2>2. Description of Service</h2>

      <p>
        DropDeck is a delivery tracking aggregation service that allows you to view and track
        deliveries from multiple platforms in a single dashboard. The Service provides:
      </p>
      <ul>
        <li>Unified view of active deliveries across connected platforms</li>
        <li>Real-time tracking and ETA updates when available</li>
        <li>Notifications for delivery status changes</li>
        <li>Delivery history and analytics</li>
      </ul>

      <h2>3. Account Registration</h2>

      <h3>3.1 Account Creation</h3>
      <p>
        To use the Service, you must create an account using a supported OAuth provider (Google or
        GitHub). You agree to provide accurate and complete information during registration.
      </p>

      <h3>3.2 Account Security</h3>
      <p>
        You are responsible for maintaining the security of your account and any activities that
        occur under your account. Notify us immediately of any unauthorized access.
      </p>

      <h3>3.3 Account Termination</h3>
      <p>
        You may delete your account at any time. We may suspend or terminate your account for
        violation of these Terms or for any other reason at our discretion.
      </p>

      <h2>4. Platform Connections</h2>

      <h3>4.1 Authorization</h3>
      <p>
        When you connect a delivery platform, you authorize us to access your order and delivery
        information from that platform on your behalf.
      </p>

      <h3>4.2 Read-Only Access</h3>
      <p>
        The Service only reads delivery information. We cannot and will not place orders, modify
        orders, or take any actions on your connected platform accounts.
      </p>

      <h3>4.3 Third-Party Terms</h3>
      <p>
        Your use of connected platforms remains subject to those platforms&apos; terms of service.
        We are not responsible for issues arising from your use of third-party platforms.
      </p>

      <h2>5. Acceptable Use</h2>

      <p>You agree not to:</p>
      <ul>
        <li>Use the Service for any illegal purpose</li>
        <li>Attempt to gain unauthorized access to the Service or its systems</li>
        <li>Interfere with or disrupt the Service</li>
        <li>Use automated means to access the Service without permission</li>
        <li>Share your account credentials with others</li>
        <li>Reverse engineer or attempt to extract source code from the Service</li>
        <li>Use the Service to collect data about other users</li>
      </ul>

      <h2>6. Intellectual Property</h2>

      <h3>6.1 Our Property</h3>
      <p>
        The Service, including its design, features, and content, is owned by DropDeck and protected
        by intellectual property laws. You may not copy, modify, or distribute any part of the
        Service without permission.
      </p>

      <h3>6.2 Your Content</h3>
      <p>
        You retain ownership of any content you submit to the Service, including feedback. By
        submitting content, you grant us a license to use it to provide and improve the Service.
      </p>

      <h2>7. Disclaimer of Warranties</h2>

      <p>
        THE SERVICE IS PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; WITHOUT WARRANTIES OF
        ANY KIND, EXPRESS OR IMPLIED. WE DO NOT WARRANT THAT:
      </p>
      <ul>
        <li>The Service will be uninterrupted or error-free</li>
        <li>Delivery information will be accurate or up-to-date</li>
        <li>The Service will meet your specific requirements</li>
        <li>Any errors in the Service will be corrected</li>
      </ul>

      <h2>8. Limitation of Liability</h2>

      <p>
        TO THE MAXIMUM EXTENT PERMITTED BY LAW, DROPDECK SHALL NOT BE LIABLE FOR ANY INDIRECT,
        INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO:
      </p>
      <ul>
        <li>Loss of profits or revenue</li>
        <li>Loss of data</li>
        <li>Missed or late deliveries</li>
        <li>Issues with third-party platforms</li>
      </ul>
      <p>
        OUR TOTAL LIABILITY SHALL NOT EXCEED THE AMOUNT YOU PAID US IN THE PAST TWELVE MONTHS, OR
        $100, WHICHEVER IS GREATER.
      </p>

      <h2>9. Indemnification</h2>

      <p>
        You agree to indemnify and hold harmless DropDeck and its officers, directors, employees,
        and agents from any claims, damages, losses, or expenses arising from your use of the
        Service or violation of these Terms.
      </p>

      <h2>10. Changes to Terms</h2>

      <p>
        We may update these Terms at any time. We will notify you of material changes by posting the
        new Terms on this page and updating the &quot;Last updated&quot; date. Continued use of the
        Service after changes constitutes acceptance of the new Terms.
      </p>

      <h2>11. Governing Law</h2>

      <p>
        These Terms shall be governed by and construed in accordance with the laws of the State of
        Delaware, United States, without regard to its conflict of law provisions.
      </p>

      <h2>12. Dispute Resolution</h2>

      <p>
        Any disputes arising from these Terms or the Service shall be resolved through binding
        arbitration in accordance with the rules of the American Arbitration Association. You waive
        your right to a jury trial or class action.
      </p>

      <h2>13. Severability</h2>

      <p>
        If any provision of these Terms is found to be unenforceable, the remaining provisions will
        continue in effect.
      </p>

      <h2>14. Entire Agreement</h2>

      <p>
        These Terms, together with our Privacy Policy, constitute the entire agreement between you
        and DropDeck regarding the Service.
      </p>

      <h2>15. Contact Us</h2>

      <p>If you have questions about these Terms, please contact us at:</p>
      <p>
        <a href="mailto:legal@dropdeck.app">legal@dropdeck.app</a>
      </p>
    </div>
  );
}
