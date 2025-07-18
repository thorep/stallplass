'use client';

import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

const buttonVariants = cva(
  'inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98] select-none',
  {
    variants: {
      variant: {
        primary: 'bg-indigo-600 text-white shadow-sm hover:bg-indigo-700 focus:ring-indigo-500 hover:shadow-md',
        secondary: 'bg-emerald-600 text-white shadow-sm hover:bg-emerald-700 focus:ring-emerald-500 hover:shadow-md',
        accent: 'bg-amber-500 text-white shadow-sm hover:bg-amber-600 focus:ring-amber-500 hover:shadow-md',
        outline: 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 focus:ring-indigo-500 hover:border-slate-400',
        ghost: 'text-slate-700 hover:bg-slate-100 focus:ring-indigo-500',
        destructive: 'bg-red-600 text-white shadow-sm hover:bg-red-700 focus:ring-red-500 hover:shadow-md'
      },
      size: {
        xs: 'h-7 px-2.5 text-xs rounded-md',
        sm: 'h-8 px-3 text-sm rounded-md',
        md: 'h-10 px-4 text-sm rounded-lg',
        lg: 'h-12 px-6 text-base rounded-lg',
        xl: 'h-14 px-8 text-lg rounded-xl',
        icon: 'h-10 w-10 rounded-lg'
      },
      fullWidth: {
        true: 'w-full'
      }
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md'
    }
  }
);

interface ButtonProps 
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  children: React.ReactNode;
  loading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, fullWidth, children, loading, disabled, ...props }, ref) => {
    return (
      <button
        className={buttonVariants({ variant, size, fullWidth, className })}
        ref={ref}
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
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;