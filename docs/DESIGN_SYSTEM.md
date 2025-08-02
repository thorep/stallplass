# Design System Documentation

## Overview

Stallplass uses a consistent design system built on Tailwind CSS with custom typography theming to ensure visual consistency across the entire application.

## Typography System

### Custom Typography Theme

The application uses a custom typography scale defined in `tailwind.config.js` that provides consistent font sizes, line heights, and font weights across all components.

### Typography Scale

The application uses a semantic typography scale that provides consistent sizing and hierarchy:

#### Display & Hero Text
| Class Name | Font Size | Line Height | Font Weight | Usage |
|------------|-----------|-------------|-------------|-------|
| `text-display` | 48px | 56px | 800 | Hero banners, landing pages |
| `text-display-sm` | 36px | 44px | 800 | Mobile hero text |

#### Headings (Hierarchical)
| Class Name | Font Size | Line Height | Font Weight | Usage |
|------------|-----------|-------------|-------------|-------|
| `text-h1` | 32px | 40px | 700 | Main page titles, modal titles |
| `text-h1-sm` | 28px | 36px | 700 | Mobile h1 |
| `text-h2` | 24px | 32px | 700 | Section headings, card headers |
| `text-h2-sm` | 22px | 30px | 700 | Mobile h2 |
| `text-h3` | 20px | 28px | 600 | Subsection headings, item titles |
| `text-h3-sm` | 18px | 26px | 600 | Mobile h3 |
| `text-h4` | 18px | 26px | 600 | Card titles, form sections |
| `text-h4-sm` | 16px | 24px | 600 | Mobile h4 |
| `text-h5` | 16px | 24px | 500 | Labels, small headings |
| `text-h6` | 14px | 20px | 500 | Smallest headings, metadata |

#### Body Text
| Class Name | Font Size | Line Height | Font Weight | Usage |
|------------|-----------|-------------|-------------|-------|
| `text-body` | 16px | 24px | 400 | Main content, descriptions |
| `text-body-sm` | 14px | 20px | 400 | Smaller content, secondary text |
| `text-caption` | 12px | 16px | 400 | Fine print, help text, timestamps |
| `text-overline` | 11px | 16px | 500 | Category labels, tags (uppercase) |

#### Interactive Elements
| Class Name | Font Size | Line Height | Font Weight | Usage |
|------------|-----------|-------------|-------------|-------|
| `text-button` | 14px | 20px | 500 | Button text |
| `text-button-lg` | 16px | 24px | 500 | Large button text |
| `text-link` | 14px | 20px | 500 | Link text |

### Responsive Typography

For responsive design, use the mobile-specific classes with responsive breakpoints:

| Class Name | Mobile | Desktop | Usage |
|------------|--------|---------|-------|
| `text-h1-sm md:text-h1` | 28px | 32px | Main page titles |
| `text-h2-sm md:text-h2` | 22px | 24px | Section headings |
| `text-h3-sm md:text-h3` | 18px | 20px | Subsection headings |
| `text-h4-sm md:text-h4` | 16px | 18px | Card titles |
| `text-display-sm md:text-display` | 36px | 48px | Hero text |

## Implementation

### Tailwind Configuration

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
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
      }
    }
  }
}
```

### Usage Examples

#### Page Title
```tsx
<h1 className="text-h1-sm md:text-h1 text-gray-900">
  {stable.name}
</h1>
```

#### Section Heading
```tsx
<h2 className="text-h2-sm md:text-h2 text-gray-900">
  Tilgjengelige bokser
</h2>
```

#### Body Text
```tsx
<p className="text-body text-gray-700">
  {stable.description}
</p>
```

#### Subsection Heading
```tsx
<h3 className="text-h3 text-gray-900">
  Kontaktinformasjon
</h3>
```

#### Interactive Elements
```tsx
// Button text
<button className="text-button font-medium">
  Rediger stable
</button>

// Link text
<a href="#" className="text-link text-primary hover:underline">
  Se detaljer
</a>

// Caption text
<span className="text-caption text-gray-500">
  Sist oppdatert: {formatDate(updatedAt)}
</span>

// Category labels
<span className="text-overline text-gray-600">
  Kategori
</span>
```

## Design Principles

### Consistency
- All text sizes are defined in the custom theme
- Dashboard design serves as the source of truth
- No arbitrary font sizes should be used

### Responsiveness
- Automatic scaling between mobile and desktop
- Breakpoint-based typography adjustments
- Touch-friendly sizes on mobile

### Maintainability
- Single source of truth in Tailwind config
- IntelliSense support for custom classes
- Easy to update globally

## Migration from Standard Tailwind

When updating existing components, replace standard Tailwind text classes:

| Old Class | New Class |
|-----------|-----------|
| `text-3xl font-bold` | `text-h1-sm md:text-h1` |
| `text-2xl font-bold` | `text-h2-sm md:text-h2` |
| `text-xl font-semibold` | `text-h3-sm md:text-h3` |
| `text-lg font-semibold` | `text-h4` |
| `text-base` | `text-body` |
| `text-sm` | `text-body-sm` |
| `text-xs` | `text-caption` |
| `text-xs uppercase` | `text-overline` |

## Color System

### Shadcn Color Tokens (Primary System)

The application uses shadcn/ui's color token system as the foundation. Use these classes for consistent theming:

| Token | Usage | Example |
|-------|-------|---------|
| `bg-background` | Main page background | `<div className="bg-background">` |
| `bg-card` | Card and panel backgrounds | `<div className="bg-card border">` |
| `text-foreground` | Primary text color | `<h1 className="text-foreground">` |
| `text-muted-foreground` | Secondary text | `<p className="text-muted-foreground">` |
| `bg-primary` | Primary actions, buttons | `<button className="bg-primary">` |
| `text-primary` | Primary colored text | `<span className="text-primary">` |
| `bg-secondary` | Secondary backgrounds | `<div className="bg-secondary">` |
| `border-border` | Default borders | `<div className="border border-border">` |
| `bg-accent` | Accent backgrounds | `<div className="bg-accent">` |
| `bg-destructive` | Error/danger actions | `<button className="bg-destructive">` |

### Stallplass Brand Colors

Additional brand-specific colors for Stallplass-specific elements:

| Color | Class | Usage |
|-------|-------|-------|
| Leather | `bg-leather`, `text-leather` | Equestrian/rustic elements |
| Meadow | `bg-meadow`, `text-meadow` | Nature/outdoor elements |
| Success | `bg-success`, `text-success` | Success states |
| Warning | `bg-warning`, `text-warning` | Warning states |
| Error | `bg-error`, `text-error` | Error states |
| Info | `bg-info`, `text-info` | Information states |

### Color Usage Examples

```tsx
// Page layout with proper theming
<div className="min-h-screen bg-background text-foreground">
  <header className="bg-card border-b border-border">
    <h1 className="text-h1 text-foreground">Stallplass</h1>
  </header>
  
  <main className="p-6">
    <div className="bg-card rounded-lg border border-border p-6">
      <h2 className="text-h2 text-foreground mb-4">Mine staller</h2>
      <p className="text-body text-muted-foreground mb-6">
        Administrer dine staller og bokser
      </p>
      
      <div className="flex gap-3">
        <button className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-button">
          Legg til stable
        </button>
        <button className="bg-secondary text-secondary-foreground px-4 py-2 rounded-md text-button">
          Se alle
        </button>
      </div>
    </div>
  </main>
</div>
```

### Dark Mode Support

Colors automatically adapt to dark mode when using the `.dark` class on the root element. All shadcn tokens adjust appropriately.

## Best Practices

### Do's
✅ Use custom typography classes for all text
✅ Follow the responsive patterns with `md:` prefixes
✅ Use shadcn color tokens for consistent theming
✅ Use brand colors (leather, meadow) for Stallplass-specific elements
✅ Test typography and colors on both mobile and desktop
✅ Ensure proper contrast ratios for accessibility

### Don'ts
❌ Use arbitrary font sizes with `text-[16px]`
❌ Mix custom and standard Tailwind text classes
❌ Create component-specific font sizes or colors
❌ Use hardcoded hex colors instead of CSS variables
❌ Ignore responsive typography patterns
❌ Use legacy `text-gray-X` classes (use `text-muted-foreground` instead)

## Validation

To ensure design system consistency:

### Typography Validation
1. **Visual Testing**: Compare pages with typography scale
2. **Code Review**: Check that custom typography classes are used
3. **Responsive Testing**: Verify scaling across breakpoints
4. **No Standard Classes**: Ensure no `text-sm`, `text-lg`, etc. are used

### Color System Validation
1. **Theme Testing**: Test both light and dark modes
2. **Code Review**: Check that shadcn tokens are used consistently
3. **Contrast Testing**: Verify accessibility standards (WCAG AA)
4. **No Hardcoded Colors**: Ensure no hex values in className attributes
5. **Brand Consistency**: Verify leather/meadow colors are used appropriately

## Future Considerations

- Consider adding semantic text classes (e.g., `text-error`, `text-warning`)
- Potential integration with CSS-in-JS for theme switching
- Performance optimization for typography loading
- Accessibility improvements for text contrast and sizing