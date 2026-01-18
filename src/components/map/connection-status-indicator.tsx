'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Wifi, WifiOff, AlertCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ConnectionState } from '@/hooks/use-realtime';

/**
 * ConnectionStatusIndicator props
 */
interface ConnectionStatusIndicatorProps {
  /** Current connection state */
  state: ConnectionState;
  /** Additional CSS classes */
  className?: string;
  /** Show compact version (icon only) */
  compact?: boolean;
}

/**
 * Get icon and color for connection state
 */
function getStateConfig(state: ConnectionState) {
  switch (state) {
    case 'connected':
      return {
        icon: Wifi,
        color: 'text-success',
        bgColor: 'bg-success/10',
        borderColor: 'border-success/20',
        label: 'Live',
      };
    case 'connecting':
      return {
        icon: Loader2,
        color: 'text-brand-cyan',
        bgColor: 'bg-brand-cyan/10',
        borderColor: 'border-brand-cyan/20',
        label: 'Connecting...',
        animate: true,
      };
    case 'disconnected':
      return {
        icon: WifiOff,
        color: 'text-[var(--dd-text-muted)]',
        bgColor: 'bg-slate-500/10',
        borderColor: 'border-slate-500/20',
        label: 'Offline',
      };
    case 'failed':
      return {
        icon: AlertCircle,
        color: 'text-error',
        bgColor: 'bg-error/10',
        borderColor: 'border-error/20',
        label: 'Connection failed',
      };
    default:
      return {
        icon: WifiOff,
        color: 'text-[var(--dd-text-muted)]',
        bgColor: 'bg-slate-500/10',
        borderColor: 'border-slate-500/20',
        label: 'Unknown',
      };
  }
}

/**
 * ConnectionStatusIndicator component
 * Shows the current real-time connection state
 */
export function ConnectionStatusIndicator({
  state,
  className,
  compact = false,
}: ConnectionStatusIndicatorProps) {
  const config = getStateConfig(state);
  const Icon = config.icon;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={state}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.15 }}
        className={cn(
          'inline-flex items-center gap-1.5',
          'px-2.5 py-1.5 rounded-full',
          'border shadow-sm',
          'bg-[var(--dd-bg-card)]',
          config.borderColor,
          className
        )}
      >
        <Icon className={cn('w-4 h-4', config.color, config.animate && 'animate-spin')} />
        {!compact && (
          <span className={cn('text-xs font-medium', config.color)}>{config.label}</span>
        )}

        {/* Live indicator dot for connected state */}
        {state === 'connected' && (
          <motion.span
            className="w-1.5 h-1.5 rounded-full bg-success"
            animate={{
              opacity: [1, 0.5, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        )}
      </motion.div>
    </AnimatePresence>
  );
}

export type { ConnectionStatusIndicatorProps };
