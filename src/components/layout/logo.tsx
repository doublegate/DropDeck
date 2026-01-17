import { Package } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface LogoProps {
  className?: string;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: {
    container: 'h-8 w-8',
    icon: 'h-4 w-4',
    text: 'text-lg',
  },
  md: {
    container: 'h-10 w-10',
    icon: 'h-5 w-5',
    text: 'text-xl',
  },
  lg: {
    container: 'h-12 w-12',
    icon: 'h-7 w-7',
    text: 'text-2xl',
  },
};

export function Logo({ className, showText = true, size = 'md' }: LogoProps) {
  const sizes = sizeClasses[size];

  return (
    <Link href="/dashboard" className={cn('flex items-center gap-2', className)}>
      <div
        className={cn('flex items-center justify-center rounded-lg bg-brand-cyan', sizes.container)}
      >
        <Package className={cn('text-white', sizes.icon)} />
      </div>
      {showText && (
        <span className={cn('font-bold text-[var(--dd-text-primary)]', sizes.text)}>DropDeck</span>
      )}
    </Link>
  );
}
