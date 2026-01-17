import * as React from 'react';

import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex h-10 w-full rounded-md border border-[var(--dd-border)] bg-[var(--dd-bg-card)] px-3 py-2 text-sm text-[var(--dd-text-primary)] ring-offset-[var(--dd-bg-primary)] file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-[var(--dd-text-primary)] placeholder:text-[var(--dd-text-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-cyan focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';

export { Input };
