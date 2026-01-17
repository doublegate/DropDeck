'use client';

import { HelpCircle, History, LayoutDashboard, Link2, Package, Settings, X } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Logo } from './logo';

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
}

const navItems = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Active Deliveries',
    href: '/deliveries',
    icon: Package,
  },
  {
    title: 'History',
    href: '/history',
    icon: History,
  },
  {
    title: 'Connected Platforms',
    href: '/platforms',
    icon: Link2,
  },
  {
    title: 'Settings',
    href: '/settings',
    icon: Settings,
  },
  {
    title: 'Help',
    href: '/help',
    icon: HelpCircle,
  },
];

export function MobileNav({ isOpen, onClose }: MobileNavProps) {
  const pathname = usePathname();

  // Close on route change - pathname change triggers close
  // biome-ignore lint/correctness/useExhaustiveDependencies: pathname change should trigger close
  useEffect(() => {
    onClose();
  }, [pathname, onClose]);

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/50 md:hidden"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <aside className="fixed inset-y-0 left-0 z-50 w-72 bg-[var(--dd-bg-card)] shadow-xl md:hidden">
        {/* Header */}
        <div className="flex h-16 items-center justify-between border-b border-[var(--dd-border)] px-4">
          <Logo size="sm" />
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
            <span className="sr-only">Close menu</span>
          </Button>
        </div>

        {/* Navigation */}
        <nav className="space-y-1 p-4">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-brand-cyan/10 text-brand-cyan'
                    : 'text-[var(--dd-text-secondary)] hover:bg-[var(--dd-bg-tertiary)] hover:text-[var(--dd-text-primary)]'
                )}
              >
                <item.icon className="h-5 w-5" />
                <span>{item.title}</span>
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
