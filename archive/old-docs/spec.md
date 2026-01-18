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

---

## 9. Deployment & CI/CD (Netlify)

**IMPORTANT: Cost Management Strategy**
- ✅ **Commits are FREE**: Commit as often as needed (`git add . && git commit -m "..."`)
- ✅ **Pull Requests are FREE**: Create PRs without consuming developer credits
- ❌ **Push to `master` COSTS CREDITS**: Only push to production when user explicitly says "push"

**Workflow**:
```bash
# Development (Free - do frequently)
git add . && git commit -m "feat: description"

# Production deployment (Costs credits - wait for user approval)
git push origin master  # Only when user says "push"
```

**Best Practice**:
- Make multiple commits during development
- Build up a clean commit history
- Only push to `master` when feature is complete and user approves
- Consider using PR workflow for larger features to avoid accidental credit consumption

---

## 10. Key Learnings & Gotchas

### 10.1. Mobile Audio Unlock
**Problem**: iOS/Android browsers block audio until user interaction
**Solution**: Aggressive audio unlock strategy in `src/audio.ts`
- Multiple touch event handlers (`touchstart`, `touchend`, `click`)
- Silent test tone on first interaction
- Persistent `AudioContext.resume()` calls
- Special handling for stubborn devices (Huawei tablets)

### 10.2. Service Worker Cache Strategy
**Problem**: PWA users not seeing new versions despite Netlify cache headers
**Solution**: Network-first for HTML/JSON, cache-first for assets
```javascript
// public/sw.js
const CACHE_NAME = 'tingxie-v1.21.22'; // Update version on each deploy

if (isHTMLorJSON) {
    // Network-first strategy
    event.respondWith(fetch(event.request).then(...));
} else {
    // Cache-first for static assets
    event.respondWith(caches.match(event.request).then(...));
}
```

### 10.3. Version Detection Without Losing User Data
**Problem**: Clearing cache loses localStorage progress
**Solution**: Version checker that shows update notification
- Store version in separate localStorage key
- Compare on app load, show banner if mismatch
- User can refresh manually without losing progress
- Implementation: `src/utils/versionChecker.ts`

### 10.4. Mobile Scrollbar Visibility
**Problem**: Styled scrollbar appearing on mobile browsers
**Solution**: Media queries to detect touch devices
```css
/* Desktop: Show styled scrollbar */
@media (hover: hover) and (pointer: fine) {
    ::-webkit-scrollbar { width: 8px; }
}

/* Mobile: Hide scrollbar */
@media (hover: none) and (pointer: coarse) {
    *::-webkit-scrollbar { display: none; }
}
```

### 10.5. Phrase-Based Practice with Single Character Display
**Problem**: Horizontal character boxes get cut off on mobile
**Solution**: Show one 280x280 character box at a time
- Store full phrase context in controller
- Display phrase term at top with current character highlighted
- Create new `HanziWriter` instance for each character
- Maintain phrase-based progression through 3 stages
- **Files**: `src/game/XiziController.ts`, `src/data.ts`

### 10.6. Audio Repetition Prevention
**Problem**: TTS speaking same chunk repeatedly while moving between characters
**Solution**: Track last spoken chunk text
```typescript
// src/game.ts
let lastChunkText: string | null = null;

function handleChunkChange(chunkText: string, completedText: string): void {
    // Only play audio when chunk actually changes
    if (chunkText !== lastChunkText) {
        lastChunkText = chunkText;
        speakWord(chunkText);
    }
}
```

### 10.7. PWA Manifest Branding
**Key fields for app identity**:
- `name`: Full app name (心织笔耕)
- `short_name`: Icon label (心织)
- `theme_color`: Browser chrome color
- `background_color`: Splash screen background
- `icons`: 192x192 and 512x512 PNG (maskable preferred)

**Files**: `public/manifest.json`, `public/icon-*.png`
