# Exception Handling - Emergency Hotfix Protocol

**Only these operations are allowed on `main`/`develop`:**

## 1. Documentation-only updates

(README.md, CLAUDE.md, docs/)

- Must be minor updates (typos, clarifications)
- No code changes
- **AI MUST ask first**: "⚠️ This is a documentation update. Should I push directly to main? **If yes, please respond with: 'commit directly to main'**"
- **AI MUST wait** for user to respond with exact phrase: "commit directly to main"
- Cannot assume user intent from other phrases

## 2. Emergency hotfixes

(ONLY with explicit confirmation protocol)

- **AI MUST ask first**: "⚠️ This is urgent. Should I push directly to main? **If yes, please respond with: 'commit directly to main'**"
- **AI MUST wait** for user to respond with exact phrase: "commit directly to main"
- **AI MUST confirm**: "⚠️ Pushing directly to main as requested"
- **AI MUST NOT assume** urgency = permission
  - ❌ "GO GO GO" is NOT permission
  - ❌ "hurry" is NOT permission
  - ❌ "emergency" is NOT permission
  - ❌ "fix this now" is NOT permission
  - ✅ ONLY "commit directly to main" is permission
- Should be rare exceptions only

## Example of CORRECT protocol

```
User: "WE NEED TO FIX THIS NOW! GO GO GO"
AI: "⚠️ This is urgent. Should I push directly to main? If yes, please respond with: 'commit directly to main'"
User: "commit directly to main"
AI: "⚠️ Pushing directly to main as requested" [proceeds with push]
```

## Example of INCORRECT behavior (NEVER do this)

```
User: "WE NEED TO FIX THIS NOW! GO GO GO"
AI: [assumes permission and pushes directly to main] ❌ VIOLATION
```
