'use client';

import {
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  History,
  LayoutDashboard,
  Link2,
  Package,
  Settings,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Logo } from './logo';

interface SidebarProps {
  collapsed?: boolean;
  onCollapse?: (collapsed: boolean) => void;
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
];

const bottomNavItems = [
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

export function Sidebar({ collapsed = false, onCollapse }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        'hidden md:flex flex-col border-r border-[var(--dd-border)] bg-[var(--dd-bg-card)] transition-all duration-200',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-between border-b border-[var(--dd-border)] px-4">
        <Logo showText={!collapsed} size="sm" />
        {onCollapse && (
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              'h-8 w-8',
              collapsed &&
                'absolute -right-3 top-6 z-10 rounded-full border border-[var(--dd-border)] bg-[var(--dd-bg-card)]'
            )}
            onClick={() => onCollapse(!collapsed)}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        )}
      </div>

      {/* Main navigation */}
      <nav className="flex-1 space-y-1 p-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-brand-cyan/10 text-brand-cyan'
                  : 'text-[var(--dd-text-secondary)] hover:bg-[var(--dd-bg-tertiary)] hover:text-[var(--dd-text-primary)]',
                collapsed && 'justify-center px-2'
              )}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span>{item.title}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Bottom navigation */}
      <div className="border-t border-[var(--dd-border)] p-2">
        {bottomNavItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-brand-cyan/10 text-brand-cyan'
                  : 'text-[var(--dd-text-secondary)] hover:bg-[var(--dd-bg-tertiary)] hover:text-[var(--dd-text-primary)]',
                collapsed && 'justify-center px-2'
              )}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span>{item.title}</span>}
            </Link>
          );
        })}
      </div>
    </aside>
  );
}
