---
description: Orchestrator workflow for structured task execution
---

# Task Orchestrator Workflow

This workflow ensures every task follows a high-signal, low-drift execution path. Follow these steps for every task, regardless of how simple the user prompt is.

## Phase 1: Grounding & Context
1. **Read `spec.md`**: Use `view_file` on `@spec.md` to synchronize with project constraints.
2. **Context Tagging**: Identify the specific files needed for the task based on `@spec.md`.
3. **State Intent**: Confirm the objective in relation to the architecture (e.g., "I will modify `ui.ts` to add the feature X according to the Scholar's Desk tokens in `spec.md`").

## Phase 2: Implementation Planning
1. **Draft Plan**: Create or update `implementation_plan.md` (or provide a numbered list).
2. **Review Constraints**: Ensure the plan complies with:
    - No Tailwind (Vanilla CSS only)
    - Mobile-first approach
    - Use of established CSS variables in `styles.css`
3. **User Approval**: Use `notify_user` to get approval for the plan before any code is written.

## Phase 3: Step-by-Step Execution
1. **Atomic Edits**: Use `replace_file_content` or `multi_replace_file_content` for surgical changes.
2. **Build Verification**: Run `npm run build` after every major file change to catch regressions immediately.

## Phase 4: Final Validation
1. **Build Check**: Final `npm run build`.
2. **Documentation**: Update `walkthrough.md` with proof of work (recordings/screenshots for UI).
3. **Spec Sync**: Update `spec.md` if any architectural patterns changed.
