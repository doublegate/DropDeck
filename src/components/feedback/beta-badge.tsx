'use client';

import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BetaBadgeProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'outline' | 'subtle';
}

const SIZE_STYLES = {
  sm: 'text-xs px-1.5 py-0.5 gap-1',
  md: 'text-sm px-2 py-1 gap-1.5',
  lg: 'text-base px-3 py-1.5 gap-2',
};

const ICON_SIZES = {
  sm: 'h-3 w-3',
  md: 'h-4 w-4',
  lg: 'h-5 w-5',
};

const VARIANT_STYLES = {
  default: 'bg-primary text-primary-foreground',
  outline: 'border-2 border-primary text-primary bg-transparent',
  subtle: 'bg-primary/10 text-primary',
};

export function BetaBadge({ className, size = 'md', variant = 'default' }: BetaBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-medium',
        SIZE_STYLES[size],
        VARIANT_STYLES[variant],
        className
      )}
    >
      <Sparkles className={ICON_SIZES[size]} />
      <span>Beta</span>
    </span>
  );
}

/**
 * Beta user indicator for user avatars/profiles
 */
interface BetaUserIndicatorProps {
  isBeta: boolean;
  children: React.ReactNode;
  className?: string;
}

export function BetaUserIndicator({ isBeta, children, className }: BetaUserIndicatorProps) {
  if (!isBeta) {
    return <>{children}</>;
  }

  return (
    <div className={cn('relative inline-block', className)}>
      {children}
      <span className="absolute -top-1 -right-1 flex h-4 w-4">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
        <span className="relative inline-flex rounded-full h-4 w-4 bg-primary items-center justify-center">
          <Sparkles className="h-2.5 w-2.5 text-primary-foreground" />
        </span>
      </span>
    </div>
  );
}
