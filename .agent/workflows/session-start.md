---
description: Guidelines for starting a new coding session with context efficiency
---

# Session Start Workflow

> Reference `@spec.md` at the start of every task to anchor context.

## 1. Context Loading (Required)
```
Read @spec.md before proceeding.
```

## 2. Identify Relevant Files
Tag only files relevant to the current task:
- UI changes: `@styles.css`, `@ui.ts`, `@index.html`
- Game logic: `@game.ts`, `@input.ts`
- Data/persistence: `@data.ts`

## 3. State the Objective
Format: "I need to [ACTION] in [FILE] because [REASON]"

Example:
> "I need to add a new button in `index.html` and style it in `styles.css` because users need to toggle grid styles."

## 4. Plan Before Execute
1. Ask for a numbered implementation plan
2. Validate the plan for logic errors
3. Execute step-by-step

## 5. Verify After Changes
```bash
// turbo
npm run build
```

## 6. Session End Checklist
- [ ] Build passes
- [ ] Update `spec.md` if architecture changed
- [ ] Commit to git
