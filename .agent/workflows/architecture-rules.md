---
description: Architecture rules for secure, stable, and performant code
---

# Architecture Guidelines

Follow these rules for every code change to maintain security, stability, and performance.

## Security Rules

1. **No eval() or Function()** - Never use dynamic code execution
2. **Sanitize user input** - All localStorage reads must handle null/invalid values
3. **Use HTTPS** - All external resources must use secure protocols
4. **No inline event handlers** - Use addEventListener instead of onclick attributes

## Stability Rules

1. **TypeScript strict mode** - All new code must be type-safe
2. **Null checks** - Always check DOM elements before accessing (e.g., `if (!element) return`)
3. **Error boundaries** - Wrap async operations in try/catch
4. **Graceful degradation** - Features must work if optional APIs unavailable (e.g., speech synthesis)

## Performance Rules

1. **Cache DOM queries** - Query elements once, store in variables
2. **Avoid layout thrashing** - Batch DOM reads/writes, don't interleave
3. **Use requestAnimationFrame** - All animations must use rAF, not setInterval
4. **Minimize reflows** - Use CSS classes instead of inline style changes
5. **Lazy loading** - Load heavy resources (HanziWriter) on demand

## Code Organization

1. **Single responsibility** - Each module handles one concern:
   - `game.ts` - Game state and flow control
   - `ui.ts` - UI rendering
   - `input.ts` - Input handling
   - `data.ts` - Data persistence
   - `audio.ts` - Sound effects
   - `particles.ts` - Visual effects

2. **Interface-driven** - Use TypeScript interfaces for cross-module contracts (see `types.ts`)

3. **No circular dependencies** - Data flows in one direction:
   ```
   main.ts → game.ts → ui.ts/input.ts → data.ts/audio.ts
   ```

## Before Committing

1. Run `npm run build` - Must complete without errors
2. Run `npm run test` - All Playwright tests must pass
3. Check for lint errors - No TypeScript warnings allowed
