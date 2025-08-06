'use client';

import { TextField, TextFieldProps } from '@mui/material';
import { forwardRef } from 'react';

interface InputProps extends Omit<TextFieldProps, 'variant'> {
  variant?: 'outlined' | 'filled' | 'standard';
  min?: string | number;
  max?: string | number;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ variant = 'outlined', sx, min, max, ...props }, ref) => {
    // Separate HTML input attributes from TextField props
    const inputProps = { min, max };
    
    return (
      <TextField
        ref={ref}
        variant={variant}
        fullWidth
        InputProps={{
          ...props.InputProps,
        }}
        inputProps={{
          ...inputProps,
          ...props.inputProps,
        }}
        sx={{
          '& .MuiOutlinedInput-root': {
            height: '48px', // Balanced height - not too tall
            borderRadius: '6px', // Match design system
            backgroundColor: '#ffffff',
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: 'hsl(var(--ring))',
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: 'hsl(var(--ring))',
              borderWidth: '2px',
            },
          },
          '& .MuiInputLabel-root': {
            fontSize: '14px',
            fontWeight: 500,
          },
          '& .MuiInputBase-input': {
            fontSize: '16px',
            padding: '12px 14px', // Reduced padding to match smaller height
          },
          ...sx,
        }}
        {...props}
      />
    );
  }
);

Input.displayName = 'Input';

export { Input };