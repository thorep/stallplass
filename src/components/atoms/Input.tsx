import React from 'react';
import { Input as ShadcnInput } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface InputProps extends React.ComponentProps<typeof ShadcnInput> {
  className?: string;
}

export function Input({ className, ...props }: InputProps) {
  return (
    <ShadcnInput
      className={cn(className)}
      {...props}
    />
  );
}