'use client';

import { LogOut } from 'lucide-react';
import { signOut } from 'next-auth/react';
import { Button, type ButtonProps } from '@/components/ui/button';

interface SignOutButtonProps extends Omit<ButtonProps, 'onClick'> {
  showIcon?: boolean;
}

export function SignOutButton({
  children,
  showIcon = true,
  variant = 'ghost',
  ...props
}: SignOutButtonProps) {
  const handleSignOut = () => {
    signOut({ callbackUrl: '/login' });
  };

  return (
    <Button variant={variant} onClick={handleSignOut} {...props}>
      {showIcon && <LogOut className="h-4 w-4" />}
      {children ?? 'Sign out'}
    </Button>
  );
}
