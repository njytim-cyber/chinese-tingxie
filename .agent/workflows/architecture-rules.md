---
description: Architecture rules for modular, maintainable code
---

# Architecture Rules

## CSS Architecture

**CRITICAL: Modular CSS Only**
- ❌ NEVER edit `public/styles.css` directly - it is DEPRECATED
- ⚠️ `public/css/legacy.css` is temporary - migrate sections to modular files
- ✅ All NEW styles go in `public/css/` directory structure
- ✅ CSS is imported via `main.ts` using Vite's native import

### Current Import (Temporary)
```typescript
// main.ts - imports legacy.css for all styles
import '../public/css/legacy.css';
```

### Target Import (After Full Migration)
```typescript
// main.ts - modular imports
import '../public/css/base/variables.css';
import '../public/css/base/reset.css';
import '../public/css/layout/main.css';
import '../public/css/components/header.css';
import '../public/css/components/footer.css';
import '../public/css/components/buttons.css';
import '../public/css/components/cards.css';
import '../public/css/components/modals.css';
import '../public/css/features/lesson.css';
import '../public/css/features/progress.css';
import '../public/css/features/game.css';
import '../public/css/utils/animations.css';
```

### Adding New Styles
1. Identify the category (component, feature, layout, etc.)
2. Add to the appropriate file in `public/css/`
3. If new file needed, add `@import` in `index.css`

---

## TypeScript Architecture

**CRITICAL: Small, Focused Files**
- ❌ Files should NOT exceed 300 lines
- ✅ Split large files into focused modules
- ✅ Use ES module imports/exports

### Current Structure (Refactor Target)
```
src/
├── main.ts              # Entry point + CSS imports
├── game.ts              # → Split into game/, state/, handlers/
├── data.ts              # → Split into data/, storage/
├── audio.ts             # ✓ Small enough
├── input.ts             # ✓ Small enough
├── ui/
│   ├── UIManager.ts     # → Consider splitting
│   └── renderers/       # ✓ Good modular structure
└── dictation.ts         # ✓ OK
```

---

## Import Order Convention
1. External dependencies
2. CSS imports (Vite)
3. Internal modules (data, utils)
4. UI/Rendering modules
5. Feature modules
