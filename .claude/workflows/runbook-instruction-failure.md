# Runbook: Instruction Not Working

## When This Happens

Weekly summary shows repeated violations of same instruction.

## Diagnosis

1. Identify the failing instruction from learning summary:

   ```bash
   cat .claude/learnings/2026-Q1/week-NN-summary.md
   ```

2. Understand the pattern:
   - **How many times violated?** (2+ times = pattern)
   - **What was the context?** (urgent? routine?)
   - **Why did AI not follow it?** (unclear? too strict? wrong context?)

3. Review daily insights for details:
   ```bash
   grep -r "Instruction.*[failing instruction text]" .claude/learnings/2026-Q1/
   ```

## Resolution

### Option 1: Clarify Language

If instruction is ambiguous:

1. Rewrite with specific, unambiguous language
2. Add concrete example of correct behavior
3. Add example of incorrect behavior to avoid

**Example:**

- ❌ Before: "Never push to main"
- ✅ After: "AI MUST ask: 'Should I push to main? If yes, respond with: commit directly to main' and WAIT for exact phrase"

### Option 2: Add Verification Step

If instruction is followed but outcome is wrong:

1. Add verification hook
2. Make failure obvious (error message, blocked commit)
3. Provide clear remediation steps

**Example:**

- Instruction: "Check branch before commit"
- Hook: branch-check.js (fails if on main/develop)

### Option 3: Change Context

If instruction is too strict for reality:

1. Identify legitimate exceptions
2. Document exception handling protocol
3. Require explicit confirmation for exceptions

**Example:**

- Add "Emergency Hotfix" exception with confirmation phrase

### Option 4: Remove Instruction

If instruction is ineffective and can't be improved:

1. Document why it's being removed (in learning summary)
2. Archive the instruction (move to deprecated section)
3. Monitor if its absence causes problems

## Testing

1. Update instruction in CLAUDE.md or workflow file
2. Test in next AI session
3. Capture outcome in daily insight
4. Review in next weekly summary

## Verification

After 2 weeks:

- **Success:** Violations decrease to 0-1
- **Partial:** Violations decrease but still occur (iterate)
- **Failure:** Violations same or worse (try different approach)
