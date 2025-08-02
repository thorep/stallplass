'use client';

import { forwardRef } from 'react';
import { Button as ShadcnButton } from '@/components/ui/button';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';

// Custom variants for our specific button styles
const customButtonVariants = cva(
  '',
  {
    variants: {
      variant: {
        // Custom variants not in shadcn
        primary: 'bg-indigo-600 text-white shadow-xs hover:bg-indigo-700 focus-visible:ring-indigo-500/20',
        accent: 'bg-amber-500 text-white shadow-xs hover:bg-amber-600 focus-visible:ring-amber-500/20',
        emerald: 'bg-emerald-600 text-white shadow-xs hover:bg-emerald-700 focus-visible:ring-emerald-500/20'
      },
      size: {
        // Custom sizes not in shadcn
        xs: 'h-7 px-2.5 text-xs rounded-md',
        md: 'h-11 px-6 text-base rounded-lg',
        xl: 'h-14 px-8 text-lg rounded-xl'
      },
      fullWidth: {
        true: 'w-full'
      }
    }
  }
);

// Define our custom variant and size types
type CustomVariant = 'primary' | 'accent' | 'emerald';
type CustomSize = 'xs' | 'md' | 'xl';
type ShadcnVariant = 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
type ShadcnSize = 'default' | 'sm' | 'lg' | 'icon';

interface ButtonProps extends Omit<React.ComponentProps<typeof ShadcnButton>, 'variant' | 'size'> {
  variant?: ShadcnVariant | CustomVariant;
  size?: ShadcnSize | CustomSize;
  loading?: boolean;
  fullWidth?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', fullWidth, children, loading, disabled, ...props }, ref) => {
    // Check if we're using custom variants/sizes
    const isCustomVariant = ['primary', 'accent', 'emerald'].includes(variant);
    const isCustomSize = ['xs', 'md', 'xl'].includes(size);
    
    // Map custom variants to shadcn default, otherwise use the shadcn variant
    const shadcnVariant = isCustomVariant ? 'default' : variant as ShadcnVariant;
    const shadcnSize = isCustomSize ? 'default' : size as ShadcnSize;

    // Only apply custom styles for custom variants/sizes
    const customVariantToApply = isCustomVariant ? variant as CustomVariant : undefined;
    const customSizeToApply = isCustomSize ? size as CustomSize : undefined;

    return (
      <ShadcnButton
        ref={ref}
        variant={shadcnVariant}
        size={shadcnSize}
        className={cn(
          // Apply custom styles only when needed
          customButtonVariants({ 
            variant: customVariantToApply, 
            size: customSizeToApply, 
            fullWidth 
          }),
          'active:scale-[0.98] transition-all duration-200',
          className
        )}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {children}
      </ShadcnButton>
    );
  }
);

Button.displayName = 'Button';

export default Button;