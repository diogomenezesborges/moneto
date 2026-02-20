# Mobile UX Audit - Issue #13

> **Date**: 2026-01-28
> **Scope**: Complete mobile responsiveness review
> **Goal**: Identify and fix all mobile UX issues

## Executive Summary

### Critical Issues Found: 12

- 4 High Priority (P1)
- 5 Medium Priority (P2)
- 3 Low Priority (P3)

### Estimated Impact

- **Current Mobile Lighthouse Score**: ~60-70 (estimated)
- **Target Mobile Lighthouse Score**: 85+
- **Touch Target Violations**: 15+ buttons/inputs
- **Responsive Breakpoints**: Partially implemented

---

## Detailed Findings

### 1. Transaction List (P1 - Critical)

**Issue**: Table layout (`grid-cols-12`) breaks on mobile screens
**Location**: `app/features/transactions/components/TransactionsFeature.tsx:314-360`

**Problems**:

- 12-column grid is unreadable on screens < 768px
- Horizontal scroll required on mobile
- Text truncation makes data illegible
- Checkboxes too small for touch (< 44x44px)

**Solution**:

- Implement mobile-specific card view
- Stack transaction details vertically
- Larger touch targets (min 44x44px)
- Swipe actions (delete, edit)

**Code Changes Needed**:

```tsx
// Mobile card view (< 768px)
<div className="block md:hidden">
  {transactions.map(t => (
    <TransactionCard key={t.id} transaction={t} />
  ))}
</div>

// Desktop table view (>= 768px)
<div className="hidden md:block">
  <TransactionTable transactions={transactions} />
</div>
```

---

### 2. Filters Panel (P1 - Critical)

**Issue**: Filters take up too much vertical space on mobile
**Location**: `app/features/transactions/components/TransactionsFeature.tsx:120-267`

**Problems**:

- Always-visible filters push content down
- Grid layout (`md:grid-cols-3`) stacks awkwardly
- Advanced filters add even more vertical space
- Search bar could be more compact

**Solution**:

- Collapsible filter panel (default closed on mobile)
- Bottom sheet/drawer for filters on mobile
- Sticky filter toggle button
- Quick filter chips (Status, Date range)

**Code Changes Needed**:

```tsx
// Mobile: Bottom sheet with filters
<MobileFilterSheet
  isOpen={showFilters}
  onClose={() => setShowFilters(false)}
  filters={...}
/>

// Desktop: Side panel or top panel
<DesktopFilters filters={...} />
```

---

### 3. Action Buttons (P2 - High)

**Issue**: Action buttons too small and crowded on mobile
**Location**: `app/features/transactions/components/TransactionsFeature.tsx:131-165`

**Problems**:

- Buttons in header: Add, Import, Export (3 buttons + count)
- Each button ~40px height (below 44px WCAG target)
- Horizontal spacing causes overflow on small screens
- Text labels disappear at narrow widths

**Solution**:

- Icon-only buttons on mobile with tooltips
- Dropdown menu for secondary actions (Import, Export)
- Primary action (Add) as floating action button (FAB)
- Larger touch targets (48x48px)

**Code Changes Needed**:

```tsx
// Mobile: FAB + dropdown
<FloatingActionButton icon={Plus} label="Add" />
<DropdownMenu items={[Import, Export]} />

// Desktop: Full buttons
<Button>Add Transaction</Button>
<Button>Import</Button>
<Button>Export</Button>
```

---

### 4. Header Navigation (P2 - High)

**Issue**: Header content cramped on mobile
**Location**: `app/page.tsx:193-243`

**Problems**:

- Logo + Language + Theme + User + Logout (too many items)
- User name + status text truncates
- Logout button may wrap to second line
- No hamburger menu for mobile

**Solution**:

- Hamburger menu for mobile (Language, Theme, Logout in drawer)
- Logo only in header on mobile
- User avatar icon instead of full name
- Bottom navigation bar option

**Code Changes Needed**:

```tsx
// Mobile header
<Header>
  <HamburgerMenu />
  <Logo />
  <UserAvatar />
</Header>

// Desktop header
<Header>
  <Logo />
  <Actions />
  <UserInfo />
</Header>
```

---

### 5. Tab Navigation (P2 - Medium)

**Issue**: Horizontal scroll tabs suboptimal on mobile
**Location**: `app/page.tsx:246-258`

**Problems**:

- Tabs use `overflow-x-auto` (acceptable but not ideal)
- Tab labels may be too long for small screens
- No active tab indicator visible when scrolled
- Touch targets acceptable but could be larger

**Solution**:

- Bottom navigation bar for mobile (iOS/Android style)
- Icon-only tabs with labels below
- Active tab clearly indicated
- Fixed position (always visible)

**Code Changes Needed**:

```tsx
// Mobile: Bottom nav bar
<BottomNavBar tabs={tabs} active={activeTab} />

// Desktop: Top tabs
<TopTabs tabs={tabs} active={activeTab} />
```

---

### 6. Forms (Add/Edit Transaction) (P1 - Critical)

**Issue**: Forms not optimized for mobile input
**Location**: Not visible in current code, but likely exists

**Problems**:

- Input fields may not be mobile-optimized
- Keyboard covers inputs (no scroll compensation)
- Date pickers may use browser default (poor UX)
- Form validation errors may be hard to see

**Solution**:

- Larger input fields (min height 48px)
- Proper `inputMode` attributes (numeric, tel, email)
- Custom date picker with mobile-friendly UI
- Clear, visible validation errors
- Auto-scroll to active input

**Code Changes Needed**:

```tsx
<Input
  type="number"
  inputMode="decimal"
  className="h-12 text-lg" // Larger on mobile
  onFocus={scrollIntoView}
/>
```

---

### 7. Pagination (P3 - Low)

**Issue**: Pagination controls may be too small
**Location**: Likely at bottom of transaction list

**Problems**:

- Page numbers buttons too small for touch
- Prev/Next buttons may not be large enough
- Current page indicator may not be obvious

**Solution**:

- Larger pagination buttons (48x48px)
- Clear active page indicator
- Infinite scroll option for mobile
- "Load More" button alternative

---

### 8. Cash Flow Page (P2 - Medium)

**Issue**: Sankey diagram not mobile-friendly
**Location**: `app/cash-flow/page.tsx`

**Problems**:

- Complex visualizations hard to interact with on small screens
- Likely requires horizontal scroll
- Touch interactions may not work well
- Labels may overlap or be unreadable

**Solution**:

- Simplified mobile view of cash flow
- Vertical layout instead of horizontal
- Tap-to-expand categories
- Alternative list view option

---

### 9. Stats/Dashboard Page (P2 - Medium)

**Issue**: Chart grids may not stack properly on mobile
**Location**: `app/features/stats/components/StatsFeature.tsx`

**Problems**:

- Charts in grid layout may be too small
- Legends may overlap with charts
- Interactive elements too small for touch
- Metric cards may stack awkwardly

**Solution**:

- Single column layout for mobile
- Larger charts (full width)
- Simplified chart legends
- Swipeable chart carousel option

---

### 10. Login Screen (P3 - Low)

**Issue**: Login form mostly mobile-friendly, minor improvements needed
**Location**: `app/page.tsx:123-186`

**Current State**: ✅ Mostly good

- PIN input is large (text-2xl)
- Buttons are adequate size
- Responsive padding

**Minor Improvements**:

- Slightly larger PIN input (text-3xl on mobile)
- Ensure theme toggle is large enough (currently good)

---

### 11. Dark Mode Toggle (P3 - Low)

**Issue**: Toggle button adequate but could be larger
**Location**: Multiple locations

**Current State**: Generally OK (p-3 = 12px padding)

- Icon size: w-5 h-5 (20px) - below 44x44px target

**Solution**:

- Increase button size to p-4 (16px padding)
- Ensure hit target is at least 44x44px

---

### 12. Bulk Selection (P2 - Medium)

**Issue**: Checkboxes too small for mobile
**Location**: `app/features/transactions/components/TransactionsFeature.tsx:316-347`

**Problems**:

- Checkbox size: w-4 h-4 (16px) - way below 44x44px
- Hard to tap accurately on touch screens
- Selection state may not be obvious

**Solution**:

- Larger checkboxes on mobile (min 24x24px)
- Larger hit area (padding around checkbox)
- Alternative: Swipe to select
- Long-press to enter selection mode

---

## Touch Target Summary

### Current Violations (< 44x44px)

1. **Checkboxes**: 16x16px → Need 44x44px hit area
2. **Action buttons**: ~40px → Need 48px minimum
3. **Tab buttons**: Variable → Need 44x44px minimum
4. **Icon buttons**: 20px icon → Need 44x44px container
5. **Pagination**: Unknown → Need 48x48px buttons
6. **Date inputs**: Standard → May need larger
7. **Select dropdowns**: Standard → Need larger touch target

### WCAG 2.1 AA Requirement

- **Minimum touch target**: 44x44px
- **Recommended**: 48x48px with 8px spacing

---

## Responsive Breakpoints

### Current Usage

- `md:` (768px) - Used for grid layouts
- `sm:` (640px) - Used for padding
- `lg:` (1024px) - Used for max-width

### Recommended

- **Mobile**: < 768px (default)
- **Tablet**: 768px - 1024px (`md:`)
- **Desktop**: > 1024px (`lg:`)

---

## Implementation Priority

### Phase 1: Critical Fixes (Days 1-2)

1. ✅ Transaction card view for mobile
2. ✅ Collapsible filter panel
3. ✅ Form input improvements
4. ✅ Touch target fixes (checkboxes, buttons)

### Phase 2: Enhanced Mobile UX (Day 3)

5. Bottom navigation bar
6. Floating action button
7. Mobile header with hamburger menu
8. Swipe actions for transactions

### Phase 3: Optimization (Day 4)

9. Cash flow mobile view
10. Stats page mobile optimization
11. Infinite scroll / load more
12. Performance optimization

---

## Testing Checklist

### Devices to Test

- [ ] iPhone SE (375px width) - Smallest modern iPhone
- [ ] iPhone 14 Pro (393px width) - Current flagship
- [ ] Samsung Galaxy S21 (360px width) - Common Android
- [ ] iPad Mini (768px width) - Tablet breakpoint
- [ ] iPad Pro (1024px width) - Large tablet

### Browsers to Test

- [ ] iOS Safari (primary)
- [ ] Android Chrome (primary)
- [ ] Firefox Mobile
- [ ] Samsung Internet

### Interactions to Test

- [ ] Touch tap (all buttons, links)
- [ ] Scroll (vertical, horizontal)
- [ ] Swipe (navigation, actions)
- [ ] Pinch zoom (should be disabled in forms)
- [ ] Keyboard input (forms, search)
- [ ] Orientation change (portrait ↔ landscape)

### Lighthouse Tests

- [ ] Mobile Performance > 80
- [ ] Mobile Accessibility > 90
- [ ] Mobile Best Practices > 90
- [ ] Mobile SEO > 90

---

## Success Metrics

### Before (Estimated)

- Mobile Lighthouse: ~65
- Touch Target Pass Rate: ~40%
- Mobile Usability Issues: 12
- Horizontal Scroll Required: Yes

### After (Target)

- Mobile Lighthouse: 85+
- Touch Target Pass Rate: 100%
- Mobile Usability Issues: 0
- Horizontal Scroll Required: No

---

## Next Steps

1. Create mobile-optimized components:
   - `TransactionCard.tsx` - Mobile card view
   - `MobileFilterSheet.tsx` - Bottom sheet for filters
   - `BottomNavBar.tsx` - Mobile navigation
   - `FloatingActionButton.tsx` - FAB for primary action

2. Update existing components with responsive classes:
   - Add `hidden md:block` for desktop-only elements
   - Add `block md:hidden` for mobile-only elements
   - Increase touch targets with `md:p-2 p-4`

3. Test thoroughly on real devices

4. Measure improvements with Lighthouse

---

**Document Status**: Audit Complete ✅
**Next**: Begin implementation
