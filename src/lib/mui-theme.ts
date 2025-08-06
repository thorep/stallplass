import { createTheme } from '@mui/material/styles';

// Create MUI theme that integrates with our existing design system
export const theme = createTheme({
  palette: {
    primary: {
      main: '#4f46e5', // Indigo - matches CSS --primary
      dark: '#4338ca',
      light: '#6366f1',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#6b7280', // Gray - matches CSS --secondary
      dark: '#4b5563',
      light: '#9ca3af',
      contrastText: '#ffffff',
    },
    error: {
      main: '#ef4444', // Red - matches CSS --color-error
      dark: '#dc2626',
      light: '#f87171',
    },
    warning: {
      main: '#f59e0b', // Amber - matches CSS --color-warning
      dark: '#d97706',
      light: '#fbbf24',
    },
    success: {
      main: '#10b981', // Green - matches CSS --color-success
      dark: '#059669',
      light: '#34d399',
    },
    info: {
      main: '#3b82f6', // Blue - matches CSS --color-info
      dark: '#2563eb',
      light: '#60a5fa',
    },
  },
  typography: {
    fontFamily: 'var(--font-geist-sans), system-ui, -apple-system, sans-serif',
    // Map our custom typography scale to MUI variants
    h1: {
      fontSize: '32px',
      lineHeight: '40px',
      fontWeight: 700,
      '@media (max-width:640px)': {
        fontSize: '28px',
        lineHeight: '36px',
      },
    },
    h2: {
      fontSize: '24px',
      lineHeight: '32px',
      fontWeight: 700,
      '@media (max-width:640px)': {
        fontSize: '22px',
        lineHeight: '30px',
      },
    },
    h3: {
      fontSize: '20px',
      lineHeight: '28px',
      fontWeight: 600,
      '@media (max-width:640px)': {
        fontSize: '18px',
        lineHeight: '26px',
      },
    },
    body1: {
      fontSize: '16px',
      lineHeight: '24px',
      fontWeight: 400,
    },
    body2: {
      fontSize: '14px',
      lineHeight: '20px',
      fontWeight: 400,
    },
    button: {
      fontSize: '14px',
      lineHeight: '20px',
      fontWeight: 500,
      textTransform: 'none',
    },
  },
  shape: {
    borderRadius: 6, // Matches CSS --radius
  },
  components: {
    // Button component defaults
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: '6px',
          fontWeight: 500,
          boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
          '&:hover': {
            boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px 0 rgb(0 0 0 / 0.06)',
          },
          '&:focus-visible': {
            outline: 'none',
            boxShadow: '0 0 0 3px rgba(79, 70, 229, 0.5)',
          },
        },
        containedPrimary: {
          '&:hover': {
            backgroundColor: '#4338ca',
          },
        },
        outlined: {
          borderColor: '#e5e7eb',
          backgroundColor: '#ffffff',
          '&:hover': {
            backgroundColor: '#f9fafb',
            borderColor: '#d1d5db',
          },
        },
      },
    },
  },
});