# Chinese Tingxie (听写) - Project Specification

> **Purpose**: This file anchors context for AI agents. Reference with `@spec.md` at the start of complex tasks.

---

## 1. Project Overview

**App Name**: 星空听写 (Starry Dictation)  
**Type**: Progressive Web App (PWA) for Chinese character writing practice  
**Stack**: Vite + TypeScript + Vanilla CSS (No Tailwind)  
**Target**: Mobile-first, responsive design

---

## 2. Architecture

```
src/
├── main.ts        # App entry, event bindings
├── game.ts        # Game controller (Game object)
├── ui.ts          # UIManager class (DOM manipulation)
├── input.ts       # HanziWriterInput class (character writing)
├── audio.ts       # SoundFX, speakWord (TTS)
├── data.ts        # SRS logic, localStorage persistence
├── types.ts       # TypeScript interfaces
└── dictation.ts   # Dictation mode (dynamic import)

public/
├── styles.css     # All CSS (single file)
└── version.json   # Version info

index.html         # SPA shell
```

---

## 3. Design System: Scholar's Desk (Tang Dynasty)

### Color Tokens (CSS Variables)
| Token | Value | Usage |
|-------|-------|-------|
| `--tang-paper` | `#F9F7F2` | Body background |
| `--tang-ink` | `#2B2B2B` | Primary text |
| `--tang-ink-light` | `#666666` | Secondary text |
| `--tang-red` | `#C44032` | Primary actions, active states |
| `--tang-jade` | `#7DA89B` | Success, progress |
| `--tang-gold` | `#D4AF37` | Accents (sparingly) |
| `--tang-paper-dark` | `#E5E0D6` | Borders, dividers |

### Typography
| Element | Font | Usage |
|---------|------|-------|
| Headers | `ZCOOL XiaoWei` | App title, lesson titles |
| Body | `Noto Sans SC` | Instructions, menus |
| Characters | `KaiTi` | Writing grid |

### Component Rules
- **Cards**: White bg + vermilion border (active)
- **Buttons**: Pill shape (`border-radius: 999px`)
- **Header**: Transparent/light, no heavy grey boxes
- **Shadows**: Soft, diffused (`0 2px 4px rgba(43,43,43,0.05)`)

---

## 4. Key Files Reference

| File | Purpose | Tag When |
|------|---------|----------|
| `styles.css` | All styling | UI changes |
| `ui.ts` | View rendering | Screen logic |
| `game.ts` | Game state | Gameplay changes |
| `input.ts` | Writing input | Grid/stroke logic |
| `data.ts` | Persistence | SRS, stats |
| `index.html` | HTML shell | New elements |

---

## 5. Development Workflows

### Run Dev Server
```bash
npm run dev -- --port 5174
```

### Build & Verify
```bash
npm run build
```

### Test (Playwright)
```bash
npm test
```

### Deploy (Netlify via GitHub)
```bash
git add . && git commit -m "message" && git push
```

---

## 6. Constraints & Rules

1. **No Tailwind**: Use vanilla CSS only
2. **Single CSS File**: All styles in `public/styles.css`
3. **Mobile-First**: Design for touch, then desktop
4. **Build Verification**: Run `npm run build` after code changes
5. **High Contrast**: Text must be readable (no gold/yellow on white)

---

## 7. Current Features

- [x] Lesson-based character practice (SRS)
- [x] Dictation mode (passage listening)
- [x] Grid styles: Tian Zi Ge / Mi Zi Ge / Blank
- [x] XP system with streaks
- [x] Tang Dynasty visual theme

---

## 8. Session Handoff Checklist

Before ending a session:
1. [ ] Run `npm run build` (must pass)
2. [ ] Update `spec.md` if architecture changed
3. [ ] Commit changes to git
4. [ ] Note any pending work in `task.md`
