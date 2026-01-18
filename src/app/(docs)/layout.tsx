import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    template: '%s | DropDeck Help',
    default: 'Help Center | DropDeck',
  },
  description: 'Get help with DropDeck - your unified delivery tracking dashboard',
};

interface DocsLayoutProps {
  children: React.ReactNode;
}

export default function DocsLayout({ children }: DocsLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      {/* Simple header for docs pages */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <a href="/" className="flex items-center gap-2 font-semibold">
            <span className="text-lg">DropDeck</span>
          </a>
          <nav className="ml-6 flex items-center space-x-6 text-sm font-medium">
            <a href="/help" className="transition-colors hover:text-foreground/80 text-foreground">
              Help Center
            </a>
            <a
              href="/help/faq"
              className="transition-colors hover:text-foreground/80 text-muted-foreground"
            >
              FAQ
            </a>
            <a
              href="/privacy"
              className="transition-colors hover:text-foreground/80 text-muted-foreground"
            >
              Privacy
            </a>
            <a
              href="/terms"
              className="transition-colors hover:text-foreground/80 text-muted-foreground"
            >
              Terms
            </a>
          </nav>
          <div className="ml-auto">
            <a href="/" className="text-sm text-muted-foreground hover:text-foreground">
              Back to App
            </a>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="container py-8">{children}</main>

      {/* Simple footer */}
      <footer className="border-t py-6 md:py-0">
        <div className="container flex flex-col items-center justify-between gap-4 md:h-16 md:flex-row">
          <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
            &copy; {new Date().getFullYear()} DropDeck. All rights reserved.
          </p>
          <nav className="flex items-center space-x-4 text-sm text-muted-foreground">
            <a href="/privacy" className="hover:underline">
              Privacy Policy
            </a>
            <a href="/terms" className="hover:underline">
              Terms of Service
            </a>
            <a href="/help" className="hover:underline">
              Help
            </a>
          </nav>
        </div>
      </footer>
    </div>
  );
}
