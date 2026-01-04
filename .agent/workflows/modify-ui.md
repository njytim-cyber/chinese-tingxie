---
description: How to modify UI styles and components
---

# Modify UI

## Style Changes

### CSS Variables (Theme)
Edit the `:root` section in `styles.css`:
```css
:root {
    --bg-color: #0f172a;
    --card-bg: #1e293b;
    --primary: #38bdf8;
    --accent: #f472b6;
    --gold: #fbbf24;
    --success: #4ade80;
    --danger: #ef4444;
}
```

### Component Styles
Add new styles to the end of `styles.css`, following existing naming conventions.

## HTML Structure
Edit `index.html` for structural changes. Main areas:
- `#start-overlay` - Start screen
- `.hud` - Top navigation bar
- `.game-stage` - Main game area
- `.controls-area` - Game buttons

## TypeScript UI Logic
Edit `src/game.ts` for dynamic UI. Key methods:
- `showLessonSelect()` - Lesson picker
- `loadLevel()` - Word display
- `showMenu()` - Pause menu
- `showFeedback()` - Success/error messages

## Verify
41: // turbo
42: 1. Run dev server:

## See Also
- [Mobile UX Guidelines](mobile-ux-guidelines.md) for touch and responsiveness rules.
// turbo
1. Run dev server:
   ```bash
   npm run dev
   ```

// turbo
2. Run tests:
   ```bash
   npm test
   ```
