# Design System Documentation

## Overview

Stallplass uses a consistent design system built on Tailwind CSS with custom typography theming to ensure visual consistency across the entire application.

## Typography System

### Custom Typography Theme

The application uses a custom typography scale defined in `tailwind.config.js` that provides consistent font sizes, line heights, and font weights across all components.

### Typography Scale

Based on the dashboard design as the source of truth:

| Class Name | Font Size | Line Height | Font Weight | Usage |
|------------|-----------|-------------|-------------|-------|
| `text-dashboard-section` | 24px | 32px | 700 | Main section headings like "Mine staller" |
| `text-dashboard-title` | 20px | 28px | 600 | Item titles like stable names |
| `text-dashboard-subtitle` | 18px | 24px | 600 | Subsection headings |
| `text-dashboard-body` | 14px | 20px | 400 | Body text, descriptions |
| `text-dashboard-label` | 14px | 20px | 500 | Form labels, metadata |
| `text-dashboard-caption` | 12px | 16px | 400 | Small text, captions |

### Responsive Typography

For responsive design, use these classes that automatically scale:

| Class Name | Mobile | Desktop | Usage |
|------------|--------|---------|-------|
| `text-page-title md:text-page-title-lg` | 24px | 32px | Main page titles |
| `text-section-heading md:text-section-heading-lg` | 20px | 24px | Section headings |
| `text-card-title md:text-card-title-lg` | 18px | 20px | Card/item titles |

## Implementation

### Tailwind Configuration

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      fontSize: {
        // Dashboard-based typography (source of truth)
        'dashboard-section': ['24px', { lineHeight: '32px', fontWeight: '700' }],
        'dashboard-title': ['20px', { lineHeight: '28px', fontWeight: '600' }],
        'dashboard-subtitle': ['18px', { lineHeight: '24px', fontWeight: '600' }],
        'dashboard-body': ['14px', { lineHeight: '20px', fontWeight: '400' }],
        'dashboard-label': ['14px', { lineHeight: '20px', fontWeight: '500' }],
        'dashboard-caption': ['12px', { lineHeight: '16px', fontWeight: '400' }],
        
        // Responsive versions
        'section-heading': ['20px', { lineHeight: '28px', fontWeight: '700' }],
        'section-heading-lg': ['24px', { lineHeight: '32px', fontWeight: '700' }],
        'page-title': ['24px', { lineHeight: '32px', fontWeight: '700' }],
        'page-title-lg': ['32px', { lineHeight: '40px', fontWeight: '700' }],
        'card-title': ['18px', { lineHeight: '24px', fontWeight: '600' }],
        'card-title-lg': ['20px', { lineHeight: '28px', fontWeight: '600' }],
      }
    }
  }
}
```

### Usage Examples

#### Page Title
```tsx
<h1 className="text-page-title md:text-page-title-lg text-gray-900">
  {stable.name}
</h1>
```

#### Section Heading
```tsx
<h2 className="text-section-heading md:text-section-heading-lg text-gray-900">
  Tilgjengelige bokser
</h2>
```

#### Body Text
```tsx
<p className="text-dashboard-body text-gray-700">
  {stable.description}
</p>
```

#### Subsection Heading
```tsx
<h3 className="text-dashboard-subtitle text-gray-900">
  Kontaktinformasjon
</h3>
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
| `text-3xl font-bold` | `text-page-title md:text-page-title-lg` |
| `text-xl font-bold` | `text-section-heading md:text-section-heading-lg` |
| `text-lg font-semibold` | `text-dashboard-subtitle` |
| `text-base` | `text-dashboard-body` |
| `text-sm` | `text-dashboard-body` |
| `text-xs` | `text-dashboard-caption` |

## Best Practices

### Do's
✅ Use custom typography classes for all text
✅ Follow the responsive patterns with `md:` prefixes
✅ Maintain consistency with dashboard design
✅ Test typography on both mobile and desktop

### Don'ts
❌ Use arbitrary font sizes with `text-[16px]`
❌ Mix custom and standard Tailwind text classes
❌ Create component-specific font sizes
❌ Ignore responsive typography patterns

## Validation

To ensure typography consistency:

1. **Visual Testing**: Compare public pages with dashboard typography
2. **Code Review**: Check that custom typography classes are used
3. **Responsive Testing**: Verify scaling across breakpoints
4. **Design QA**: Ensure alignment with design system

## Future Considerations

- Consider adding semantic text classes (e.g., `text-error`, `text-warning`)
- Potential integration with CSS-in-JS for theme switching
- Performance optimization for typography loading
- Accessibility improvements for text contrast and sizing