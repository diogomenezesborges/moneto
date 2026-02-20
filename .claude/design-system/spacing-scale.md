# Spacing Scale Reference

> **Last Updated**: 2026-02-14
> **Status**: Phase 0 Design System - Task #138
> **Purpose**: Standardize spacing patterns across components for consistency and maintainability

## Table of Contents

1. [Tailwind Spacing Scale](#tailwind-spacing-scale)
2. [Component-Specific Patterns](#component-specific-patterns)
3. [Responsive Spacing](#responsive-spacing)
4. [Usage Guidelines](#usage-guidelines)
5. [Common Patterns](#common-patterns)

---

## Tailwind Spacing Scale

Tailwind uses a numeric scale where **1 unit = 0.25rem (4px)**.

### Base Scale (rem units)

| Class       | Value (rem) | Value (px) | Use Case                         |
| ----------- | ----------- | ---------- | -------------------------------- |
| `space-0`   | 0           | 0px        | Reset spacing                    |
| `space-0.5` | 0.125rem    | 2px        | Micro spacing (icon adjustments) |
| `space-1`   | 0.25rem     | 4px        | Icon-text gaps, tight spacing    |
| `space-1.5` | 0.375rem    | 6px        | Small element spacing            |
| `space-2`   | 0.5rem      | 8px        | Inline element spacing, tags     |
| `space-2.5` | 0.625rem    | 10px       | Input padding (vertical)         |
| `space-3`   | 0.75rem     | 12px       | Component padding (small)        |
| `space-4`   | 1rem        | 16px       | **Component padding (default)**  |
| `space-5`   | 1.25rem     | 20px       | Medium spacing                   |
| `space-6`   | 1.5rem      | 24px       | **Section spacing (default)**    |
| `space-8`   | 2rem        | 32px       | Large section spacing            |
| `space-10`  | 2.5rem      | 40px       | Extra large spacing              |
| `space-12`  | 3rem        | 48px       | Page section spacing             |
| `space-16`  | 4rem        | 64px       | Major page sections              |

### Fractional Values

| Class  | Value  | Use Case               |
| ------ | ------ | ---------------------- |
| `1/2`  | 50%    | Half-width containers  |
| `1/3`  | 33.33% | Three-column grids     |
| `2/3`  | 66.66% | Two-thirds layouts     |
| `1/4`  | 25%    | Four-column grids      |
| `3/4`  | 75%    | Three-quarters layouts |
| `full` | 100%   | Full-width elements    |

---

## Component-Specific Patterns

### Buttons

**Default Button**:

```tsx
className = 'px-4 py-2 rounded-lg'
// Horizontal: 16px, Vertical: 8px
```

**Small Button**:

```tsx
className = 'px-3 py-1.5 rounded-md text-sm'
// Horizontal: 12px, Vertical: 6px
```

**Large Button**:

```tsx
className = 'px-6 py-3 rounded-xl text-lg'
// Horizontal: 24px, Vertical: 12px
```

**Icon Button**:

```tsx
className = 'p-2 rounded-lg'
// All sides: 8px
```

### Cards

**Default Card** (Desktop):

```tsx
className = 'p-6 rounded-lg'
// All sides: 24px
```

**Mobile Card**:

```tsx
className = 'p-4 rounded-lg'
// All sides: 16px (mobile-first approach)
```

**Large Card** (Feature sections):

```tsx
className = 'p-8 rounded-xl'
// All sides: 32px
```

**Card Header/Footer**:

```tsx
<div className="p-6 border-b">Header</div>
<div className="p-6">Content</div>
<div className="p-6 border-t">Footer</div>
// Consistent 24px padding
```

### Forms

**Form Container**:

```tsx
className = 'space-y-6'
// Vertical spacing: 24px between form sections
```

**Field Groups**:

```tsx
className = 'space-y-4'
// Vertical spacing: 16px between form fields
```

**Input Fields**:

```tsx
className = 'px-3 py-2.5 rounded-lg'
// Horizontal: 12px, Vertical: 10px
```

**Field Labels**:

```tsx
className = 'mb-2'
// Bottom margin: 8px (label-to-input gap)
```

**Form Sections**:

```tsx
<div className="space-y-6">
  <div className="pb-4 border-b">
    <h3>Section Title</h3>
  </div>
  <div className="space-y-4">{/* Form fields */}</div>
</div>
// Section header bottom padding: 16px
// Fields spacing: 16px
// Sections spacing: 24px
```

### Lists

**Compact List**:

```tsx
className = 'gap-2'
// Item spacing: 8px (transaction rows)
```

**Comfortable List**:

```tsx
className = 'gap-4'
// Item spacing: 16px (feature cards)
```

**Wide List**:

```tsx
className = 'gap-6'
// Item spacing: 24px (large feature sections)
```

**List Item Padding**:

```tsx
className = 'p-4 rounded-lg'
// All sides: 16px
```

### Dialogs

**Dialog Container**:

```tsx
className = 'p-4' // Outer padding (mobile viewport)
```

**Dialog Header**:

```tsx
className = 'p-6 border-b'
// Padding: 24px, bottom border separation
```

**Dialog Content**:

```tsx
className = 'p-6 space-y-4'
// Padding: 24px, content spacing: 16px
```

**Dialog Footer**:

```tsx
className = 'p-6 border-t gap-3'
// Padding: 24px, button gap: 12px
```

### Badges & Tags

**Category Badge**:

```tsx
className = 'px-3 py-1.5 rounded-lg gap-1.5'
// Horizontal: 12px, Vertical: 6px, Icon gap: 6px
```

**Tag Display**:

```tsx
className = 'px-2.5 py-1 rounded-md gap-1.5'
// Horizontal: 10px, Vertical: 4px, Icon gap: 6px
```

**Status Badge**:

```tsx
className = 'px-2 py-0.5 rounded-md text-xs'
// Horizontal: 8px, Vertical: 2px
```

### Navigation

**Navigation Bar**:

```tsx
className = 'px-6 py-4'
// Horizontal: 24px, Vertical: 16px
```

**Navigation Items**:

```tsx
className = 'gap-2'
// Icon-text gap: 8px
```

**Navigation Spacing**:

```tsx
className = 'space-x-4'
// Horizontal spacing between nav items: 16px
```

---

## Responsive Spacing

### Mobile-First Approach

Use smaller spacing on mobile, increase for larger screens:

```tsx
// Card padding
className = 'p-4 md:p-6 lg:p-8'
// Mobile: 16px, Tablet: 24px, Desktop: 32px

// Section spacing
className = 'space-y-4 md:space-y-6 lg:space-y-8'
// Mobile: 16px, Tablet: 24px, Desktop: 32px

// Grid gaps
className = 'gap-4 md:gap-6 lg:gap-8'
// Mobile: 16px, Tablet: 24px, Desktop: 32px
```

### Breakpoint Reference

| Breakpoint | Min Width | Use Case               |
| ---------- | --------- | ---------------------- |
| `sm:`      | 640px     | Small tablets          |
| `md:`      | 768px     | Tablets, small laptops |
| `lg:`      | 1024px    | Laptops, desktops      |
| `xl:`      | 1280px    | Large desktops         |
| `2xl:`     | 1536px    | Extra large screens    |

---

## Usage Guidelines

### Do's ✅

1. **Use Consistent Spacing**:
   - Cards: `p-6` (desktop), `p-4` (mobile)
   - Sections: `space-y-6`
   - Fields: `space-y-4`
   - Buttons: `px-4 py-2`

2. **Use Semantic Spacing**:
   - Related items: `gap-2` or `gap-3`
   - Sections: `gap-6` or `space-y-6`
   - Page sections: `gap-8` or `space-y-8`

3. **Use Responsive Spacing**:
   - Mobile-first: start with smaller values
   - Scale up for larger screens: `p-4 md:p-6 lg:p-8`

4. **Use Even Numbers**:
   - Prefer: `space-2`, `space-4`, `space-6`, `space-8`
   - Avoid: `space-5`, `space-7`, `space-9` (unless specific design requirement)

### Don'ts ❌

1. **Don't Mix Units**:
   - ❌ `className="p-4 m-[20px]"` (mixing Tailwind and arbitrary values)
   - ✅ `className="p-4 m-5"` (consistent Tailwind scale)

2. **Don't Use Arbitrary Values for Common Spacing**:
   - ❌ `className="gap-[16px]"` (use `gap-4` instead)
   - ❌ `className="p-[24px]"` (use `p-6` instead)
   - ✅ Use arbitrary values only for unique design requirements

3. **Don't Overuse Margins**:
   - ❌ `className="mb-4"` on every element
   - ✅ Use `space-y-4` on parent container instead

4. **Don't Forget Dark Mode**:
   - Spacing should remain consistent in both light and dark modes
   - No need for `dark:` variants on spacing utilities

---

## Common Patterns

### Pattern 1: Card with Header, Content, Footer

```tsx
<div className="rounded-lg border border-border bg-card shadow-sm">
  {/* Header */}
  <div className="p-6 border-b border-border">
    <h2 className="text-lg font-semibold">Card Title</h2>
  </div>

  {/* Content */}
  <div className="p-6 space-y-4">
    <p>Content goes here</p>
  </div>

  {/* Footer */}
  <div className="p-6 border-t border-border flex justify-end gap-3">
    <button className="px-4 py-2">Cancel</button>
    <button className="px-4 py-2">Save</button>
  </div>
</div>
```

**Spacing Breakdown**:

- Card sections: `p-6` (24px all sides)
- Content items: `space-y-4` (16px vertical)
- Footer buttons: `gap-3` (12px horizontal)

---

### Pattern 2: Form with Sections

```tsx
<form className="space-y-6">
  {/* Section 1 */}
  <div className="space-y-4">
    <h3 className="text-lg font-semibold pb-4 border-b">Section Title</h3>
    <div className="space-y-4">
      <div>
        <label className="block mb-2">Field Label</label>
        <input className="w-full px-3 py-2.5 rounded-lg" />
      </div>
    </div>
  </div>

  {/* Section 2 */}
  <div className="space-y-4">{/* Same structure */}</div>
</form>
```

**Spacing Breakdown**:

- Form sections: `space-y-6` (24px between sections)
- Section fields: `space-y-4` (16px between fields)
- Label-to-input: `mb-2` (8px)
- Input padding: `px-3 py-2.5` (12px horizontal, 10px vertical)

---

### Pattern 3: List with Items

```tsx
<div className="space-y-2">
  {items.map(item => (
    <div key={item.id} className="p-4 rounded-lg border hover:shadow-md">
      <div className="flex items-center gap-3">
        <Icon size={20} />
        <div className="flex-1">
          <h4 className="font-medium">{item.title}</h4>
          <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
        </div>
      </div>
    </div>
  ))}
</div>
```

**Spacing Breakdown**:

- List items: `space-y-2` (8px vertical, compact list)
- Item padding: `p-4` (16px all sides)
- Icon-text gap: `gap-3` (12px)
- Title-description gap: `mt-1` (4px)

---

### Pattern 4: Grid Layout

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
  {items.map(item => (
    <div key={item.id} className="p-6 rounded-lg border bg-card">
      {/* Card content */}
    </div>
  ))}
</div>
```

**Spacing Breakdown**:

- Mobile gap: `gap-4` (16px)
- Tablet gap: `md:gap-6` (24px)
- Card padding: `p-6` (24px all sides)

---

### Pattern 5: Dialog Layout

```tsx
<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
  <div className="bg-background rounded-xl shadow-xl max-w-2xl w-full">
    {/* Header */}
    <div className="p-6 border-b">
      <h2 className="text-2xl font-bold flex items-center gap-2">
        <Icon size={24} />
        <span>Dialog Title</span>
      </h2>
    </div>

    {/* Content */}
    <div className="p-6 space-y-4">{/* Dialog content */}</div>

    {/* Footer */}
    <div className="p-6 border-t flex justify-end gap-3">
      <button className="px-4 py-2">Cancel</button>
      <button className="px-4 py-2">Confirm</button>
    </div>
  </div>
</div>
```

**Spacing Breakdown**:

- Outer padding (viewport): `p-4` (16px, prevents edge-to-edge)
- Dialog sections: `p-6` (24px all sides)
- Content items: `space-y-4` (16px vertical)
- Header icon-text: `gap-2` (8px)
- Footer buttons: `gap-3` (12px)

---

## Cross-Reference

### Related Components

- **Buttons**: See Task #143 for button component redesign
- **Cards**: See Task #147 for card component redesign
- **Forms**: See Task #146 for form section redesign
- **Badges**: See Task #144 (CategoryBadge) and Task #145 (TagDisplay)

### Related Documentation

- **Color System**: `.claude/design-system/color-system.md` (to be created)
- **Typography Scale**: `app/globals.css` (CSS variables defined)
- **Component Library**: `app/components/` (component implementations)

---

## Maintenance

**When to Update**:

- Adding new component types
- Discovering inconsistent spacing patterns
- Updating responsive breakpoints
- Adding new design patterns

**How to Update**:

1. Update this document with new patterns
2. Verify changes with visual regression tests
3. Update component tests if spacing affects functionality
4. Document changes in CLAUDE.md changelog

---

**End of Spacing Scale Reference**
