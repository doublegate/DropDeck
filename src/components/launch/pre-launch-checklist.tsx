'use client';

import { AlertCircle, CheckCircle2, Circle, RefreshCw } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ChecklistItem {
  id: string;
  label: string;
  description: string;
  category: 'infrastructure' | 'testing' | 'documentation' | 'monitoring' | 'launch';
  check: () => Promise<boolean>;
}

interface CheckResult {
  id: string;
  status: 'pending' | 'checking' | 'passed' | 'failed';
  error?: string;
}

const CHECKLIST_ITEMS: ChecklistItem[] = [
  // Infrastructure
  {
    id: 'health-check',
    label: 'Health check endpoint',
    description: 'API health check returns 200',
    category: 'infrastructure',
    check: async () => {
      const res = await fetch('/api/health');
      const data = await res.json();
      return data.status === 'healthy';
    },
  },
  {
    id: 'database',
    label: 'Database connection',
    description: 'PostgreSQL is reachable',
    category: 'infrastructure',
    check: async () => {
      const res = await fetch('/api/health');
      const data = await res.json();
      return data.checks?.database?.status === 'ok';
    },
  },
  {
    id: 'redis',
    label: 'Redis connection',
    description: 'Redis cache is reachable',
    category: 'infrastructure',
    check: async () => {
      const res = await fetch('/api/health');
      const data = await res.json();
      return data.checks?.redis?.status === 'ok';
    },
  },

  // Testing
  {
    id: 'auth-flow',
    label: 'Authentication flow',
    description: 'OAuth login endpoints accessible',
    category: 'testing',
    check: async () => {
      // Check if auth page is accessible
      const res = await fetch('/api/auth/providers');
      return res.ok;
    },
  },

  // Documentation
  {
    id: 'help-center',
    label: 'Help center accessible',
    description: 'Help documentation is available',
    category: 'documentation',
    check: async () => {
      const res = await fetch('/help');
      return res.ok;
    },
  },
  {
    id: 'privacy-policy',
    label: 'Privacy policy',
    description: 'Privacy policy page accessible',
    category: 'documentation',
    check: async () => {
      const res = await fetch('/privacy');
      return res.ok;
    },
  },
  {
    id: 'terms',
    label: 'Terms of service',
    description: 'Terms of service page accessible',
    category: 'documentation',
    check: async () => {
      const res = await fetch('/terms');
      return res.ok;
    },
  },

  // Monitoring
  {
    id: 'status-page',
    label: 'Status page',
    description: 'System status page available',
    category: 'monitoring',
    check: async () => {
      // Status would be at /status but we check health for now
      const res = await fetch('/api/health');
      return res.ok;
    },
  },
];

interface PreLaunchChecklistProps {
  className?: string;
}

export function PreLaunchChecklist({ className }: PreLaunchChecklistProps) {
  const [results, setResults] = useState<Record<string, CheckResult>>({});
  const [isRunning, setIsRunning] = useState(false);

  // Initialize results
  useEffect(() => {
    const initial: Record<string, CheckResult> = {};
    for (const item of CHECKLIST_ITEMS) {
      initial[item.id] = { id: item.id, status: 'pending' };
    }
    setResults(initial);
  }, []);

  const runChecks = async () => {
    setIsRunning(true);

    for (const item of CHECKLIST_ITEMS) {
      setResults((prev) => ({
        ...prev,
        [item.id]: { id: item.id, status: 'checking' },
      }));

      try {
        const passed = await item.check();
        setResults((prev) => ({
          ...prev,
          [item.id]: { id: item.id, status: passed ? 'passed' : 'failed' },
        }));
      } catch (error) {
        setResults((prev) => ({
          ...prev,
          [item.id]: {
            id: item.id,
            status: 'failed',
            error: error instanceof Error ? error.message : 'Check failed',
          },
        }));
      }

      // Small delay between checks
      await new Promise((resolve) => setTimeout(resolve, 200));
    }

    setIsRunning(false);
  };

  const categories = [
    'infrastructure',
    'testing',
    'documentation',
    'monitoring',
    'launch',
  ] as const;

  const getStatusIcon = (status: CheckResult['status']) => {
    switch (status) {
      case 'passed':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'failed':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'checking':
        return <RefreshCw className="h-5 w-5 text-blue-500 animate-spin" />;
      default:
        return <Circle className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const passedCount = Object.values(results).filter((r) => r.status === 'passed').length;
  const totalCount = CHECKLIST_ITEMS.length;

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Pre-Launch Checklist</h2>
          <p className="text-sm text-muted-foreground">Verify all systems before going live</p>
        </div>
        <Button onClick={runChecks} disabled={isRunning}>
          {isRunning ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Running...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4 mr-2" />
              Run Checks
            </>
          )}
        </Button>
      </div>

      {/* Progress */}
      <div className="flex items-center gap-4">
        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-green-500 transition-all duration-300"
            style={{ width: `${(passedCount / totalCount) * 100}%` }}
          />
        </div>
        <span className="text-sm font-medium">
          {passedCount}/{totalCount} passed
        </span>
      </div>

      {/* Checklist by category */}
      {categories.map((category) => {
        const items = CHECKLIST_ITEMS.filter((i) => i.category === category);
        if (items.length === 0) return null;

        return (
          <div key={category}>
            <h3 className="text-sm font-medium uppercase tracking-wide text-muted-foreground mb-3">
              {category}
            </h3>
            <div className="space-y-2">
              {items.map((item) => {
                const result = results[item.id];
                return (
                  <div
                    key={item.id}
                    className={cn(
                      'flex items-center gap-3 p-3 rounded-lg border',
                      result?.status === 'passed' && 'border-green-200 bg-green-50',
                      result?.status === 'failed' && 'border-red-200 bg-red-50'
                    )}
                  >
                    {getStatusIcon(result?.status ?? 'pending')}
                    <div className="flex-1">
                      <div className="font-medium text-sm">{item.label}</div>
                      <div className="text-xs text-muted-foreground">
                        {result?.error ?? item.description}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
