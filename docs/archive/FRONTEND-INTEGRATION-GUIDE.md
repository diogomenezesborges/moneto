# Frontend Integration Guide - ID-Based Categories

## New Components Created

### 1. CategorySelector (`components/ui/CategorySelector.tsx`)

ID-based dropdown component that replaces the old text-based category selectors.

**Features:**

- Fetches taxonomy from `/api/categories` (with IDs)
- Cascading dropdowns (Major → Category → SubCategory)
- Returns both IDs and names on change
- Loading and error states
- Dark mode support

**Usage:**

```tsx
import { CategorySelector } from '@/components/ui/CategorySelector'
;<CategorySelector
  majorCategoryId={transaction.majorCategoryId}
  categoryId={transaction.categoryId}
  subCategoryId={transaction.subCategoryId}
  onChange={selection => {
    // selection contains:
    // - majorCategoryId, categoryId, subCategoryId (IDs for storage)
    // - majorCategory, category, subCategory (names for display)
    setEditForm({
      ...editForm,
      ...selection,
    })
  }}
  token={auth.token}
  disabled={loading}
/>
```

### 2. AIClassifier Components (`components/ui/AIClassifier.tsx`)

**AIClassifier** - Single transaction AI classification button:

```tsx
import { AIClassifier } from '@/components/ui/AIClassifier'
;<AIClassifier
  transactionId={transaction.id}
  token={auth.token}
  onClassified={() => loadTransactions()}
/>
```

**ConfidenceBadge** - Shows AI confidence with reasoning tooltip:

```tsx
import { ConfidenceBadge } from '@/components/ui/AIClassifier'
;<ConfidenceBadge
  confidence={transaction.classifierConfidence}
  reasoning={transaction.classifierReasoning}
/>
```

**AIBatchClassifier** - Batch classify up to 50 pending transactions:

```tsx
import { AIBatchClassifier } from '@/components/ui/AIClassifier'
;<AIBatchClassifier token={auth.token} onClassified={() => loadTransactions()} />
```

## Integration Steps for `app/page.tsx`

### Step 1: Add Imports

```tsx
import { CategorySelector } from '@/components/ui/CategorySelector'
import { AIClassifier, ConfidenceBadge, AIBatchClassifier } from '@/components/ui/AIClassifier'
```

### Step 2: Update State to Include IDs

Modify the `editForm` state to include ID fields:

```tsx
const [editForm, setEditForm] = useState<
  Partial<Transaction> & {
    majorCategoryId?: string | null
    categoryId?: string | null
    subCategoryId?: string | null
  }
>({})
```

### Step 3: Replace Category Dropdowns in Edit Mode

**OLD CODE:**

```tsx
{editingId === transaction.id ? (
  <div className="flex flex-col gap-1">
    <select
      value={editForm.majorCategory || ''}
      onChange={(e) => {
        const major = e.target.value
        setEditForm({ ...editForm, majorCategory: major, category: '', subCategory: '' })
      }}
    >
      <option value="">Major Category...</option>
      {MAJOR_CATEGORIES.map(cat => (
        <option key={cat.name} value={cat.name}>{cat.emoji} {cat.name}</option>
      ))}
    </select>
    {/* ... more dropdowns ... */}
  </div>
) : (
  // Display mode
)}
```

**NEW CODE:**

```tsx
{
  editingId === transaction.id ? (
    <CategorySelector
      majorCategoryId={editForm.majorCategoryId || transaction.majorCategoryId}
      categoryId={editForm.categoryId || transaction.categoryId}
      subCategoryId={editForm.subCategoryId || transaction.subCategoryId}
      onChange={selection => {
        setEditForm({
          ...editForm,
          // IDs (primary)
          majorCategoryId: selection.majorCategoryId,
          categoryId: selection.categoryId,
          subCategoryId: selection.subCategoryId,
          // Names (for backward compatibility)
          majorCategory: selection.majorCategory,
          category: selection.category,
          subCategory: selection.subCategory,
        })
      }}
      token={auth.token || ''}
    />
  ) : (
    // Display mode - show category with confidence badge
    <div className="flex items-center gap-2">
      <span
        className="text-xs px-2 py-1 rounded-full border border-indigo-300 dark:border-indigo-700"
        style={{
          backgroundColor: getCategoryColor(transaction.majorCategory).bg,
          color: getCategoryColor(transaction.majorCategory).text,
        }}
      >
        {transaction.majorCategory} › {transaction.category}
        {transaction.subCategory && ` › ${transaction.subCategory}`}
      </span>
      {transaction.classifierConfidence && (
        <ConfidenceBadge
          confidence={transaction.classifierConfidence}
          reasoning={transaction.classifierReasoning}
        />
      )}
    </div>
  )
}
```

### Step 4: Add AI Classify Button to Transactions Table

Add the AI classify button next to the edit button for pending transactions:

```tsx
<td className="px-4 py-3 whitespace-nowrap text-sm">
  <div className="flex items-center gap-2">
    {/* Existing Edit button */}
    <button
      onClick={() => {
        setEditingId(transaction.id)
        setEditForm(transaction)
      }}
      className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
    >
      <Edit2 size={16} />
    </button>

    {/* NEW: AI Classify button (only for pending/uncategorized) */}
    {transaction.status === 'pending' && (
      <AIClassifier
        transactionId={transaction.id}
        token={auth.token || ''}
        onClassified={() => loadTransactions()}
      />
    )}

    {/* Existing Delete button */}
    <button
      onClick={() => handleDeleteTransaction(transaction.id)}
      className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
    >
      <Trash2 size={16} />
    </button>
  </div>
</td>
```

### Step 5: Add Batch AI Classify Button

Add a batch classify button in the header actions (next to "Auto-Categorize"):

```tsx
<div className="flex items-center gap-2">
  {/* Existing Auto-Categorize button */}
  <button
    onClick={handleAutoCategorize}
    disabled={loading}
    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
  >
    <Sparkles size={16} className="inline mr-2" />
    Auto-Categorize
  </button>

  {/* NEW: Batch AI Classify */}
  <AIBatchClassifier token={auth.token || ''} onClassified={() => loadTransactions()} />
</div>
```

### Step 6: Update handleSaveEdit Function

Ensure the save function sends both IDs and names:

```tsx
const handleSaveEdit = async () => {
  try {
    setLoading(true)

    const res = await fetch('/api/transactions', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${auth.token}`,
      },
      body: JSON.stringify({
        id: editingId,
        // Send both IDs and names - backend dual-writes
        ...editForm,
      }),
    })

    if (!res.ok) throw new Error('Failed to update transaction')

    setEditingId(null)
    setEditForm({})
    await loadTransactions()
    showNotification('Transaction updated successfully', 'success')
  } catch (error) {
    showNotification('Failed to update transaction', 'error')
  } finally {
    setLoading(false)
  }
}
```

### Step 7: Update Transaction Interface

Ensure the Transaction interface includes the new AI fields:

```tsx
interface TransactionWithUser extends Transaction {
  user: User
  // These should already be in Prisma schema, but TypeScript might need them:
  majorCategoryId?: string | null
  categoryId?: string | null
  subCategoryId?: string | null
  classifierConfidence?: number | null
  classifierReasoning?: string | null
  classifierVersion?: string | null
}
```

## Visual Improvements

### Confidence Indicators

The `ConfidenceBadge` component automatically color-codes confidence:

- 🟢 **Green** (70-100%): High confidence - AI is very certain
- 🟡 **Yellow** (50-69%): Medium confidence - Review recommended
- 🔴 **Red** (0-49%): Low confidence - Manual review needed

Hover over the badge to see the AI's reasoning.

### AI Classification Flow

1. **Single Transaction:**
   - Click the AI Classify button next to any pending transaction
   - AI classifies it in ~1-2 seconds
   - Transaction auto-updates with categories and confidence badge
   - Low confidence (<70%) transactions are auto-flagged for review

2. **Batch Mode:**
   - Click "AI Classify Batch" in the header
   - Processes up to 50 pending transactions
   - Shows summary: "✓ Classified 47 transactions (12 flagged as low confidence)"
   - All results appear immediately in the table

## Migration Strategy

### Option A: Full Migration (Recommended for New Features)

Replace all old category selectors with `<CategorySelector>` component. This gives you:

- Stable IDs for ML
- Better UX with cascading dropdowns
- Consistent behavior across all edit modes

### Option B: Gradual Migration

Keep existing dropdowns but add:

1. AI classify buttons for enhanced UX
2. Confidence badges to show AI quality
3. Migrate to `CategorySelector` later when convenient

The backend dual-write ensures both approaches work seamlessly.

## Testing Checklist

After integration, verify:

- [ ] Category dropdowns load and display correctly
- [ ] Selecting categories cascades properly (Major → Category → SubCategory)
- [ ] Editing a transaction saves both IDs and names
- [ ] Single AI classify button works
- [ ] Batch AI classify processes multiple transactions
- [ ] Confidence badges appear on AI-classified transactions
- [ ] Hovering over confidence shows reasoning tooltip
- [ ] Low confidence transactions are flagged
- [ ] Dark mode works for all new components

## API Endpoints Used

- `GET /api/categories` - Fetch taxonomy with IDs
- `POST /api/transactions/ai-classify` - AI classification (single or batch)
- `PATCH /api/transactions` - Update transaction (dual-write)

## Example: Complete Edit Cell

Here's a complete example of an edit cell with all new features:

```tsx
<td className="px-4 py-3">
  {editingId === transaction.id ? (
    // EDIT MODE
    <CategorySelector
      majorCategoryId={editForm.majorCategoryId || transaction.majorCategoryId}
      categoryId={editForm.categoryId || transaction.categoryId}
      subCategoryId={editForm.subCategoryId || transaction.subCategoryId}
      onChange={selection => setEditForm({ ...editForm, ...selection })}
      token={auth.token || ''}
    />
  ) : (
    // DISPLAY MODE
    <div className="flex flex-col gap-1">
      {transaction.majorCategory ? (
        <div className="flex items-center gap-2">
          <span
            className="text-xs px-2 py-1 rounded-full border"
            style={{
              backgroundColor: getCategoryColor(transaction.majorCategory).bg,
              color: getCategoryColor(transaction.majorCategory).text,
            }}
          >
            {transaction.majorCategory} › {transaction.category}
            {transaction.subCategory && ` › ${transaction.subCategory}`}
          </span>

          {/* Show confidence badge if AI-classified */}
          {transaction.classifierConfidence && (
            <ConfidenceBadge
              confidence={transaction.classifierConfidence}
              reasoning={transaction.classifierReasoning}
            />
          )}
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 italic">Uncategorized</span>
          <AIClassifier
            transactionId={transaction.id}
            token={auth.token || ''}
            onClassified={() => loadTransactions()}
          />
        </div>
      )}
    </div>
  )}
</td>
```

## Support

If you encounter issues:

1. Check browser console for errors
2. Verify API endpoints return `taxonomyWithIds` in response
3. Ensure all transactions have both text and ID fields populated (backfill completed)
4. Check that Gemini API key is configured in `.env` for AI features

---

**Status**: Components ready for integration
**Date**: 2025-12-27
