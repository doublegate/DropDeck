'use client';

import {
  AlertCircle,
  Bug,
  Gauge,
  HelpCircle,
  Lightbulb,
  MessageSquarePlus,
  Send,
  Sparkles,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type FeedbackCategory =
  | 'bug'
  | 'feature_request'
  | 'ux_improvement'
  | 'platform_issue'
  | 'performance'
  | 'other';

interface CategoryOption {
  value: FeedbackCategory;
  label: string;
  icon: React.ReactNode;
  description: string;
}

const CATEGORIES: CategoryOption[] = [
  {
    value: 'bug',
    label: 'Bug Report',
    icon: <Bug className="h-4 w-4" />,
    description: 'Something is not working correctly',
  },
  {
    value: 'feature_request',
    label: 'Feature Request',
    icon: <Lightbulb className="h-4 w-4" />,
    description: 'Suggest a new feature',
  },
  {
    value: 'ux_improvement',
    label: 'UX Improvement',
    icon: <Sparkles className="h-4 w-4" />,
    description: 'Improve the user experience',
  },
  {
    value: 'platform_issue',
    label: 'Platform Issue',
    icon: <AlertCircle className="h-4 w-4" />,
    description: 'Issue with a delivery platform',
  },
  {
    value: 'performance',
    label: 'Performance',
    icon: <Gauge className="h-4 w-4" />,
    description: 'App speed or responsiveness',
  },
  {
    value: 'other',
    label: 'Other',
    icon: <HelpCircle className="h-4 w-4" />,
    description: 'Something else',
  },
];

interface FeedbackWidgetProps {
  className?: string;
  position?: 'bottom-right' | 'bottom-left';
}

export function FeedbackWidget({ className, position = 'bottom-right' }: FeedbackWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<'category' | 'form'>('category');
  const [category, setCategory] = useState<FeedbackCategory | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const positionClasses = {
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
  };

  const handleCategorySelect = (cat: FeedbackCategory) => {
    setCategory(cat);
    setStep('form');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!category || !title || !description) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category,
          title,
          description,
          metadata: {
            url: window.location.href,
            userAgent: navigator.userAgent,
          },
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to submit feedback');
      }

      setSubmitted(true);

      // Reset after delay
      setTimeout(() => {
        setIsOpen(false);
        setSubmitted(false);
        setStep('category');
        setCategory(null);
        setTitle('');
        setDescription('');
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit feedback');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setStep('category');
    setCategory(null);
    setTitle('');
    setDescription('');
    setError(null);
  };

  return (
    <div className={cn('fixed z-50', positionClasses[position], className)}>
      {/* Trigger button */}
      {!isOpen && (
        <Button onClick={() => setIsOpen(true)} size="lg" className="rounded-full shadow-lg">
          <MessageSquarePlus className="h-5 w-5 mr-2" />
          Feedback
        </Button>
      )}

      {/* Feedback panel */}
      {isOpen && (
        <div className="w-80 rounded-lg border bg-card shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b p-4">
            <h3 className="font-semibold">
              {submitted ? 'Thank You!' : step === 'category' ? 'Send Feedback' : 'Submit Feedback'}
            </h3>
            <button type="button" onClick={handleClose} className="rounded-full p-1 hover:bg-muted">
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Content */}
          <div className="p-4">
            {submitted ? (
              <div className="text-center py-8">
                <div className="mx-auto w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-4">
                  <Send className="h-6 w-6 text-green-600" />
                </div>
                <p className="text-muted-foreground">
                  Your feedback has been submitted. We appreciate your input!
                </p>
              </div>
            ) : step === 'category' ? (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground mb-4">
                  What type of feedback would you like to share?
                </p>
                {CATEGORIES.map((cat) => (
                  <button
                    type="button"
                    key={cat.value}
                    onClick={() => handleCategorySelect(cat.value)}
                    className="w-full flex items-center gap-3 p-3 rounded-lg border hover:bg-muted text-left transition-colors"
                  >
                    <div className="flex-shrink-0 text-muted-foreground">{cat.icon}</div>
                    <div>
                      <div className="font-medium text-sm">{cat.label}</div>
                      <div className="text-xs text-muted-foreground">{cat.description}</div>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  {CATEGORIES.find((c) => c.value === category)?.icon}
                  <span>{CATEGORIES.find((c) => c.value === category)?.label}</span>
                  <button
                    type="button"
                    onClick={() => setStep('category')}
                    className="ml-auto text-primary hover:underline"
                  >
                    Change
                  </button>
                </div>

                <div>
                  <label htmlFor="title" className="block text-sm font-medium mb-1">
                    Title
                  </label>
                  <input
                    id="title"
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Brief summary"
                    required
                    minLength={5}
                    maxLength={200}
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>

                <div>
                  <label htmlFor="description" className="block text-sm font-medium mb-1">
                    Description
                  </label>
                  <textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Provide more details..."
                    required
                    minLength={10}
                    maxLength={5000}
                    rows={4}
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                  />
                </div>

                {error && <div className="text-sm text-destructive">{error}</div>}

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
                </Button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
