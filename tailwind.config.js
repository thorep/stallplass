/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/ui/**/*.{js,ts,jsx,tsx,mdx}",
    "./**/(*)/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  safelist: [
    // Dialog animations
    "animate-in",
    "animate-out",
    "fade-in-0",
    "fade-out-0",
    "zoom-in-95",
    "zoom-out-95",
    "duration-200",
    "data-[state=open]:animate-in",
    "data-[state=closed]:animate-out",
    "data-[state=closed]:fade-out-0",
    "data-[state=open]:fade-in-0",
    "data-[state=closed]:zoom-out-95",
    "data-[state=open]:zoom-in-95",
    // Gradient directions
    {
      pattern: /bg-gradient-to-(t|tr|r|br|b|bl|l|tl)/,
    },
    // Gradient colors for indigo and purple specifically
    {
      pattern: /(from|via|to)-(indigo|purple)-(50|100|200|300|400|500|600|700|800|900)/,
    },
    {
      pattern: /(from|via|to)-(emerald|green)-(50|500|600)/,
    },
    // All classes explicitly used in /annonser page
    "bg-gradient-to-br",
    "bg-gradient-to-r",
    "from-indigo-900",
    "from-indigo-600",
    "from-indigo-500",
    "via-purple-900",
    "from-purple-500",
    "to-indigo-800",
    "to-purple-600",
    "to-emerald-500",
    "to-pink-500",
    "to-emerald-600",
    // Email confirmation page gradients
    "from-emerald-50",
    "from-emerald-500",
    "to-green-50",
    "to-green-500",
    "hover:from-emerald-600",
    "hover:to-green-600",
    "bg-indigo-50",
    "bg-indigo-100",
    "bg-indigo-200",
    "bg-indigo-600",
    "bg-indigo-900",
    "text-indigo-200",
    "text-indigo-600",
    "text-indigo-900",
    "hover:text-indigo-600",
    "hover:text-indigo-700",
    "hover:text-indigo-900",
    "hover:bg-indigo-50",
    "hover:bg-indigo-100",
    "bg-purple-900",
    "text-purple-600",
    "bg-white",
    "text-white",
    "hover:bg-white",
    "hover:bg-gray-100",
    "border-white",
    "border-2",
  ],
  theme: {
    extend: {
      colors: {
        // Stallplass brand colors
        leather: "var(--color-accent-leather)",
        meadow: "var(--color-accent-meadow)",
        success: "var(--color-success)",
        warning: "var(--color-warning)",
        error: "var(--color-error)",
        info: "var(--color-info)",
      },
      fontSize: {
        // Semantic Typography Scale (1:many relationship)
        // These can be used for any purpose that needs these sizes

        // Display & Hero text
        display: ["48px", { lineHeight: "56px", fontWeight: "800" }], // Hero banners, landing pages
        "display-sm": ["36px", { lineHeight: "44px", fontWeight: "800" }], // Mobile hero

        // Headings (hierarchical)
        h1: ["32px", { lineHeight: "40px", fontWeight: "700" }], // Main page titles, modal titles
        "h1-sm": ["28px", { lineHeight: "36px", fontWeight: "700" }], // Mobile h1
        h2: ["24px", { lineHeight: "32px", fontWeight: "700" }], // Section headings, card headers
        "h2-sm": ["22px", { lineHeight: "30px", fontWeight: "700" }], // Mobile h2
        h3: ["20px", { lineHeight: "28px", fontWeight: "600" }], // Subsection headings, item titles
        "h3-sm": ["18px", { lineHeight: "26px", fontWeight: "600" }], // Mobile h3
        h4: ["18px", { lineHeight: "26px", fontWeight: "600" }], // Card titles, form sections
        "h4-sm": ["16px", { lineHeight: "24px", fontWeight: "600" }], // Mobile h4
        h5: ["16px", { lineHeight: "24px", fontWeight: "500" }], // Labels, small headings
        h6: ["14px", { lineHeight: "20px", fontWeight: "500" }], // Smallest headings, metadata

        // Body text
        body: ["16px", { lineHeight: "24px", fontWeight: "400" }], // Main content, descriptions
        "body-sm": ["14px", { lineHeight: "20px", fontWeight: "400" }], // Smaller content, secondary text
        caption: ["12px", { lineHeight: "16px", fontWeight: "400" }], // Fine print, help text, timestamps
        overline: [
          "11px",
          {
            lineHeight: "16px",
            fontWeight: "500",
            letterSpacing: "0.5px",
            textTransform: "uppercase",
          },
        ], // Category labels, tags

        // Interactive elements
        button: ["14px", { lineHeight: "20px", fontWeight: "500" }], // Button text
        "button-lg": ["16px", { lineHeight: "24px", fontWeight: "500" }], // Large button text
        link: ["14px", { lineHeight: "20px", fontWeight: "500" }], // Link text
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
