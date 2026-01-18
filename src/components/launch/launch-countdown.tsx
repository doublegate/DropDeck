'use client';

import { Rocket } from 'lucide-react';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface TimeUnit {
  value: number;
  label: string;
}

interface LaunchCountdownProps {
  targetDate: Date;
  className?: string;
  onLaunch?: () => void;
}

export function LaunchCountdown({ targetDate, className, onLaunch }: LaunchCountdownProps) {
  const [timeLeft, setTimeLeft] = useState<TimeUnit[]>([]);
  const [isLaunched, setIsLaunched] = useState(false);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = Date.now();
      const target = targetDate.getTime();
      const difference = target - now;

      if (difference <= 0) {
        setIsLaunched(true);
        onLaunch?.();
        return [];
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      return [
        { value: days, label: 'Days' },
        { value: hours, label: 'Hours' },
        { value: minutes, label: 'Minutes' },
        { value: seconds, label: 'Seconds' },
      ];
    };

    setTimeLeft(calculateTimeLeft());

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate, onLaunch]);

  if (isLaunched) {
    return (
      <div className={cn('text-center py-12', className)}>
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary mb-6">
          <Rocket className="h-10 w-10 text-primary-foreground animate-bounce" />
        </div>
        <h2 className="text-3xl font-bold mb-2">We Have Launched!</h2>
        <p className="text-muted-foreground">
          DropDeck is now live. Start tracking your deliveries today.
        </p>
      </div>
    );
  }

  return (
    <div className={cn('text-center', className)}>
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-6">
        <Rocket className="h-8 w-8 text-primary" />
      </div>

      <h2 className="text-2xl font-bold mb-2">Launching Soon</h2>
      <p className="text-muted-foreground mb-8">
        Get ready for a unified delivery tracking experience
      </p>

      <div className="flex justify-center gap-4">
        {timeLeft.map((unit) => (
          <div key={unit.label} className="flex flex-col items-center">
            <div className="w-20 h-20 rounded-lg bg-card border flex items-center justify-center mb-2">
              <span className="text-3xl font-bold tabular-nums">
                {String(unit.value).padStart(2, '0')}
              </span>
            </div>
            <span className="text-xs uppercase tracking-wide text-muted-foreground">
              {unit.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Static version for SSR (without countdown animation)
 */
interface LaunchBannerProps {
  message?: string;
  className?: string;
}

export function LaunchBanner({ message = 'Coming Soon', className }: LaunchBannerProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-center gap-2 bg-primary text-primary-foreground py-2 px-4 text-sm font-medium',
        className
      )}
    >
      <Rocket className="h-4 w-4" />
      <span>{message}</span>
    </div>
  );
}
