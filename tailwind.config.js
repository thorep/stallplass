/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "var(--color-primary)",
          hover: "var(--color-primary-hover)",
        },
        leather: "var(--color-accent-leather)",
        meadow: "var(--color-accent-meadow)",
        success: "var(--color-success)",
        warning: "var(--color-warning)",
        error: "var(--color-error)",
        info: "var(--color-info)",
        gray: {
          0: "var(--gray-0)",
          50: "var(--gray-50)",
          100: "var(--gray-100)",
          300: "var(--gray-300)",
          500: "var(--gray-500)",
          700: "var(--gray-700)",
          900: "var(--gray-900)",
        },
      },
      fontSize: {
        // Semantic Typography Scale (1:many relationship)
        // These can be used for any purpose that needs these sizes
        
        // Display & Hero text
        'display': ['48px', { lineHeight: '56px', fontWeight: '800' }],           // Hero banners, landing pages
        'display-sm': ['36px', { lineHeight: '44px', fontWeight: '800' }],        // Mobile hero
        
        // Headings (hierarchical)
        'h1': ['32px', { lineHeight: '40px', fontWeight: '700' }],                // Main page titles, modal titles
        'h1-sm': ['28px', { lineHeight: '36px', fontWeight: '700' }],             // Mobile h1
        'h2': ['24px', { lineHeight: '32px', fontWeight: '700' }],                // Section headings, card headers
        'h2-sm': ['22px', { lineHeight: '30px', fontWeight: '700' }],             // Mobile h2
        'h3': ['20px', { lineHeight: '28px', fontWeight: '600' }],                // Subsection headings, item titles
        'h3-sm': ['18px', { lineHeight: '26px', fontWeight: '600' }],             // Mobile h3
        'h4': ['18px', { lineHeight: '26px', fontWeight: '600' }],                // Card titles, form sections
        'h4-sm': ['16px', { lineHeight: '24px', fontWeight: '600' }],             // Mobile h4
        'h5': ['16px', { lineHeight: '24px', fontWeight: '500' }],                // Labels, small headings
        'h6': ['14px', { lineHeight: '20px', fontWeight: '500' }],                // Smallest headings, metadata
        
        // Body text
        'body': ['16px', { lineHeight: '24px', fontWeight: '400' }],              // Main content, descriptions
        'body-sm': ['14px', { lineHeight: '20px', fontWeight: '400' }],           // Smaller content, secondary text
        'caption': ['12px', { lineHeight: '16px', fontWeight: '400' }],           // Fine print, help text, timestamps
        'overline': ['11px', { lineHeight: '16px', fontWeight: '500', letterSpacing: '0.5px', textTransform: 'uppercase' }], // Category labels, tags
        
        // Interactive elements
        'button': ['14px', { lineHeight: '20px', fontWeight: '500' }],            // Button text
        'button-lg': ['16px', { lineHeight: '24px', fontWeight: '500' }],         // Large button text
        'link': ['14px', { lineHeight: '20px', fontWeight: '500' }],              // Link text
      },
    },
  },
  plugins: [],
}