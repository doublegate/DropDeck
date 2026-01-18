'use client';

import { CheckCircle2, Ticket, XCircle } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface InviteCodeFormProps {
  className?: string;
  onSuccess?: () => void;
}

export function InviteCodeForm({ className, onSuccess }: InviteCodeFormProps) {
  const [code, setCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!code.trim()) return;

    setIsSubmitting(true);
    setStatus('idle');
    setMessage('');

    try {
      const response = await fetch('/api/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to redeem invite code');
      }

      setStatus('success');
      setMessage(data.message || 'Welcome to the beta!');
      onSuccess?.();
    } catch (err) {
      setStatus('error');
      setMessage(err instanceof Error ? err.message : 'Failed to redeem invite code');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCode = (value: string): string => {
    // Auto-format code (uppercase, add dashes for readability)
    return value.toUpperCase().replace(/[^A-Z0-9]/g, '');
  };

  return (
    <div className={cn('space-y-4', className)}>
      <div className="text-center space-y-2">
        <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
          <Ticket className="h-6 w-6 text-primary" />
        </div>
        <h2 className="text-xl font-semibold">Enter Invite Code</h2>
        <p className="text-sm text-muted-foreground">
          Have an invite code? Enter it below to join the DropDeck beta.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="invite-code" className="sr-only">
            Invite Code
          </label>
          <input
            id="invite-code"
            type="text"
            value={code}
            onChange={(e) => setCode(formatCode(e.target.value))}
            placeholder="XXXXXXXX"
            disabled={isSubmitting || status === 'success'}
            maxLength={12}
            className={cn(
              'w-full rounded-lg border bg-background px-4 py-3 text-center text-lg font-mono tracking-widest',
              'focus:outline-none focus:ring-2 focus:ring-ring',
              status === 'success' && 'border-green-500 bg-green-50',
              status === 'error' && 'border-red-500 bg-red-50'
            )}
          />
        </div>

        {status !== 'idle' && (
          <div
            className={cn(
              'flex items-center gap-2 text-sm p-3 rounded-lg',
              status === 'success' && 'bg-green-100 text-green-800',
              status === 'error' && 'bg-red-100 text-red-800'
            )}
          >
            {status === 'success' ? (
              <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
            ) : (
              <XCircle className="h-4 w-4 flex-shrink-0" />
            )}
            <span>{message}</span>
          </div>
        )}

        <Button
          type="submit"
          className="w-full"
          disabled={!code.trim() || isSubmitting || status === 'success'}
        >
          {isSubmitting ? 'Validating...' : status === 'success' ? 'Joined!' : 'Join Beta'}
        </Button>
      </form>

      <p className="text-xs text-center text-muted-foreground">
        No invite code?{' '}
        <a href="/waitlist" className="text-primary hover:underline">
          Join the waitlist
        </a>
      </p>
    </div>
  );
}
