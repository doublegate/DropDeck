'use client';

import { motion } from 'framer-motion';
import { Truck, Clock, CheckCircle, Package, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Stat card data
 */
interface StatData {
  title: string;
  value: number;
  description: string;
  icon: typeof Truck;
  color: string;
  trend?: {
    value: number;
    label: string;
    positive: boolean;
  };
}

/**
 * DeliveryStats props
 */
interface DeliveryStatsProps {
  /** Number of active deliveries */
  activeCount: number;
  /** Number arriving soon (within 15 min) */
  arrivingSoonCount: number;
  /** Number delivered today */
  deliveredTodayCount: number;
  /** Total deliveries this week */
  weeklyTotal?: number;
  /** Loading state */
  isLoading?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Single stat card component
 */
function StatCard({ stat, isLoading }: { stat: StatData; isLoading?: boolean }) {
  const Icon = stat.icon;

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-4 rounded" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-16 mb-1" />
          <Skeleton className="h-3 w-20" />
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-[var(--dd-text-secondary)]">
            {stat.title}
          </CardTitle>
          <Icon className={cn('h-4 w-4', stat.color)} />
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline gap-2">
            <motion.div
              key={stat.value}
              initial={{ scale: 1.1 }}
              animate={{ scale: 1 }}
              className="text-2xl font-bold tabular-nums"
            >
              {stat.value}
            </motion.div>
            {stat.trend && (
              <span
                className={cn(
                  'flex items-center text-xs font-medium',
                  stat.trend.positive ? 'text-success' : 'text-warning'
                )}
              >
                <TrendingUp
                  className={cn('w-3 h-3 mr-0.5', !stat.trend.positive && 'rotate-180')}
                />
                {stat.trend.value}% {stat.trend.label}
              </span>
            )}
          </div>
          <p className="text-xs text-[var(--dd-text-muted)] mt-1">{stat.description}</p>
        </CardContent>
      </Card>
    </motion.div>
  );
}

/**
 * DeliveryStats component
 * Dashboard stat cards showing delivery metrics
 */
export function DeliveryStats({
  activeCount,
  arrivingSoonCount,
  deliveredTodayCount,
  weeklyTotal = 0,
  isLoading = false,
  className,
}: DeliveryStatsProps) {
  const stats: StatData[] = [
    {
      title: 'Active Deliveries',
      value: activeCount,
      description: 'Currently in transit',
      icon: Truck,
      color: 'text-brand-cyan',
    },
    {
      title: 'Arriving Soon',
      value: arrivingSoonCount,
      description: 'Within 15 minutes',
      icon: Clock,
      color: arrivingSoonCount > 0 ? 'text-warning' : 'text-[var(--dd-text-muted)]',
    },
    {
      title: 'Delivered Today',
      value: deliveredTodayCount,
      description: 'Successfully completed',
      icon: CheckCircle,
      color: 'text-success',
    },
    {
      title: 'This Week',
      value: weeklyTotal,
      description: 'Total packages',
      icon: Package,
      color: 'text-[var(--dd-text-secondary)]',
    },
  ];

  return (
    <div className={cn('grid gap-4 md:grid-cols-2 lg:grid-cols-4', className)}>
      {stats.map((stat) => (
        <StatCard key={stat.title} stat={stat} isLoading={isLoading} />
      ))}
    </div>
  );
}

export type { DeliveryStatsProps };
