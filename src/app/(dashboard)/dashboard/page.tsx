import { CheckCircle, Clock, Package, Truck } from 'lucide-react';
import type { Metadata } from 'next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export const metadata: Metadata = {
  title: 'Dashboard',
  description: 'Track all your deliveries in one unified dashboard.',
};

// Placeholder stats for the dashboard
const stats = [
  {
    title: 'Active Deliveries',
    value: '3',
    description: 'Currently in transit',
    icon: Truck,
    color: 'text-brand-cyan',
  },
  {
    title: 'Arriving Soon',
    value: '2',
    description: 'Within the hour',
    icon: Clock,
    color: 'text-warning',
  },
  {
    title: 'Delivered Today',
    value: '5',
    description: 'Successfully completed',
    icon: CheckCircle,
    color: 'text-success',
  },
  {
    title: 'Total Packages',
    value: '10',
    description: 'This week',
    icon: Package,
    color: 'text-[var(--dd-text-secondary)]',
  },
];

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-[var(--dd-text-primary)]">Dashboard</h1>
        <p className="text-[var(--dd-text-tertiary)]">
          Track all your deliveries from one unified view.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-[var(--dd-text-secondary)]">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-[var(--dd-text-muted)]">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Active Deliveries Section */}
      <Card>
        <CardHeader>
          <CardTitle>Active Deliveries</CardTitle>
          <CardDescription>Your current deliveries across all connected platforms.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Package className="h-12 w-12 text-[var(--dd-text-muted)] mb-4" />
            <h3 className="text-lg font-medium text-[var(--dd-text-primary)]">
              No active deliveries
            </h3>
            <p className="text-sm text-[var(--dd-text-tertiary)] max-w-sm mt-1">
              Connect your delivery platforms to start tracking your packages in real-time.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
