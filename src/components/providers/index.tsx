'use client';

import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { TRPCProvider } from '@/lib/trpc/react';
import { ThemeProvider } from './theme-provider';

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <ThemeProvider>
      <TRPCProvider>
        <TooltipProvider>
          {children}
          <Toaster />
        </TooltipProvider>
      </TRPCProvider>
    </ThemeProvider>
  );
}
