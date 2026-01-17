'use client';

import { SessionProvider } from 'next-auth/react';
import { useState } from 'react';
import { Header } from './header';
import { MobileNav } from './mobile-nav';
import { Sidebar } from './sidebar';

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <SessionProvider>
      <div className="flex h-screen overflow-hidden">
        {/* Desktop Sidebar */}
        <Sidebar collapsed={sidebarCollapsed} onCollapse={setSidebarCollapsed} />

        {/* Mobile Nav */}
        <MobileNav isOpen={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />

        {/* Main content area */}
        <div className="flex flex-1 flex-col overflow-hidden">
          <Header onMenuClick={() => setMobileNavOpen(true)} />
          <main className="flex-1 overflow-auto bg-[var(--dd-bg-secondary)] p-4 md:p-6">
            {children}
          </main>
        </div>
      </div>
    </SessionProvider>
  );
}
