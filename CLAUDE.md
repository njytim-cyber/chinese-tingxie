# Claude Code Session Notes

## Session: 2026-01-18 (Continued) - v2.0.2 Release

### Major Improvements

#### 1. Set C (丙) Addition for Dictation Mode (Commits: 644ac5c, 115e4e5)

**Problem**: Users needed a third dataset (Set C / 丙) for 默写 mode to expand learning content.

**Solution**: Added complete Set C with 20 dictation passages.

**Files Changed**:
- [public/dictation-set-c.json](public/dictation-set-c.json) - Created with 20 passages (c-1.1 through c-10.2)
- [src/data/sets.ts](src/data/sets.ts#L27-L31) - Added Set C to `getAvailableSets()` and `getAllDictationPassages()`
- [src/ui/renderers/LessonRenderer.ts](src/ui/renderers/LessonRenderer.ts) - Filtered to show only Sets A and B for lessons (C is 默写 only)
- [src/ui/renderers/DictationRenderer.ts](src/ui/renderers/DictationRenderer.ts#L148-L152) - Extended grouping logic to handle Set C format

**Technical Notes**:
- Set C uses format: "第N课 (必考)" and "第N课 (加分)"
- Chinese quotation marks ("") replaced with single quotes (') for valid JSON
- Cache-busting with `Date.now()` timestamp for fresh loads

---

#### 2. Visual Progress Indicators (Commits: 17a172a, 37824e8)

**Problem**: Text-based progress like "第二步: 辅助 (2/3)" and "Lv.2" was verbose and hard to scan.

**Solution**: Replaced all text-based progress with clean visual dots.

**Files Changed**:
- [src/game/XiziController.ts](src/game/XiziController.ts#L376-L424)
  - Simplified stage names: `['描红', '辅助', '默写']` (removed "第X步:" prefix)
  - Character progress as dots: `●●◉○○` (completed, current, remaining)
  - Stage progress dots made subtle with reduced opacity

- [src/ui/renderers/StatsRenderer.ts](src/ui/renderers/StatsRenderer.ts#L193-L215)
  - Character mastery levels now show as dots (max 5 levels)
  - Level 1: `●○○○○`, Level 3: `●●●○○`, etc.

**Visual Meaning**:
- `●` = Completed/achieved
- `◉` = Current (in 习字 mode)
- `○` = Remaining/not yet achieved

**Result**: Cleaner, more scannable progress display across all modes.

---

#### 3. Carousel Animation Fixes (Commit: f489d90)

**Problem**: Carousel animation caused disorienting vertical "bounce" when transitioning between characters with different pinyin label heights.

**Solution**: Added `align-items: flex-start` to prevent vertical shifting.

**Files Changed**:
- [public/css/features/game/_dictation.css](public/css/features/game/_dictation.css#L95)
  - `.spelling-chars-container`: Added `align-items: flex-start`
  - Ensures all char-boxes align to same top position during horizontal slide

**Result**: Smooth horizontal sliding without any vertical movement.

---

#### 4. Swipe Gesture Improvements (Commits: 286fae3, 48939d1)

**Problem**: Users accidentally triggered swipe navigation while drawing strokes on characters.

**Solution**: Expanded touch exclusion zones to cover entire character area.

**Files Changed**:
- [src/ui/renderers/DictationRenderer.ts](src/ui/renderers/DictationRenderer.ts#L479-L489)
  - Check for `.char-box` (includes slot + pinyin label)
  - Check for `.spelling-chars-container` (entire carousel area)
  - Swipe now only works on indicator dots and empty card areas

**Result**: No more accidental navigation while drawing characters.

---

#### 5. Mobile/Tablet Scrolling Fixes (Commit: 1208bb0)

**Problem**: Users on tablets and phones couldn't vertically scroll on 进度, 听写, and 默写 picker pages.

**Solution**: Added `touch-action: pan-y` to all scrollable containers.

**Files Changed**:
- [public/css/features/lesson.css](public/css/features/lesson.css#L15) - `.lesson-select`, `.lesson-grid`
- [public/css/features/progress.css](public/css/features/progress.css#L11) - `.progress-view`
- [public/css/components/cards.css](public/css/components/cards.css#L88) - `.lesson-group`, `.lesson-group-content`
- [public/css/features/game/_dictation.css](public/css/features/game/_dictation.css#L189) - `.wordlist-container`

**Technical Note**: Global `touch-action: manipulation` was blocking scroll; explicit `pan-y` allows vertical scrolling.

**Result**: All pages now scroll properly on touch devices.

---

#### 6. Activity History Label Fix (Commit: 115e4e5)

**Problem**: Activity history showed confusing "篇章" (passage) label for dictation activities.

**Solution**: Changed label to "默写" (dictation) to match actual activity.

**Files Changed**:
- [src/ui/renderers/StatsRenderer.ts](src/ui/renderers/StatsRenderer.ts#L183)
  - `log.mode === 'dictation' ? '默写' : '听写'`

**Result**: Clear, accurate activity labels in progress history.

---

#### 7. Code Refactoring (Commit: b4a1bc0)

**Problem**: Large monolithic files were hard to maintain.

**Solution**: Split into focused modules.

**Files Created**:
- `src/data/`: achievements.ts, manager.ts, persistence.ts, progress.ts, srs.ts, stats.ts
- `src/game/`: SessionManager.ts, WordCompletionHandler.ts, sessionResume.ts
- `src/types/state.ts`
- `src/ui/renderers/index.ts`

**Result**: Better code organization, reduced src/data.ts from 650 to ~100 lines.

---

#### 8. Version 2.0.2 with Cache-Clearing Reload (Commit: 80fdd93)

**Problem**: Mobile users with aggressive caching couldn't see updates despite refreshing.

**Solution**: Version bump with cache-clearing update mechanism.

**Files Changed**:
- [src/utils/versionChecker.ts](src/utils/versionChecker.ts#L6-L20)
  - Bumped to v2.0.2
  - Added comprehensive release notes
  - Update button now clears all caches before reload

**Release Notes v2.0.2**:
- 新增丙 (Set C) 默写内容
- 习字模式进度显示优化（用点替代文字）
- 修复触控滑动手势冲突
- 修复平板/手机无法垂直滚动问题
- 修复默写轮播动画垂直抖动
- 活动记录现在正确显示"默写"标签

**Result**: All users can now get fresh updates by clicking "立即更新" button.

---

### Current Status

**Branch**: master
**Version**: 2.0.2
**Latest Commits**:
- 37824e8 - feat: replace 'Lv.X' text with visual dots in character mastery
- 80fdd93 - chore: bump version to 2.0.2 with cache-clearing reload
- b4a1bc0 - refactor: split monolithic files into modular structure
- 1208bb0 - fix: enable vertical scrolling on progress and picker pages
- 48939d1 - fix: expand swipe exclusion to entire character area
- 115e4e5 - fix: show '默写' instead of '篇章' in activity history
- 17a172a - feat: replace verbose text with visual progress dots
- f489d90 - fix: prevent vertical shift in carousel animation
- 286fae3 - fix: disable swipe navigation on character box
- 644ac5c - fix: correct Set C JSON syntax and TypeScript error

**Deployment**: https://chinese-tingxie.pages.dev/
**CI Status**: ✅ Passing (Node 20)

---

### Notes for Future Development

1. **Visual Progress Pattern**: Dots (●○) are now the standard for all progress indicators. Maintain consistency across new features.

2. **Touch Gesture Exclusions**: When adding interactive areas, ensure they're excluded from swipe gestures using `.closest()` checks.

3. **Cache Management**: Version checker automatically clears caches on update. Test with aggressive caching (mobile Safari, etc.).

4. **Set Structure**: New sets should follow JSON format with `setId`, `passages[]`, and proper title formats.

5. **Responsive Scrolling**: Always add `touch-action: pan-y` to scrollable containers to override global `touch-action: manipulation`.

---

## Session: 2026-01-18 (Initial)

### Recent Changes

#### 1. Carousel Animation Enhancement (Commit: f3f3d45)

**Problem**: The dictation mode used a hide/show pattern for character boxes, which felt jarring and didn't provide smooth visual feedback when moving between characters.

**Solution**: Implemented a smooth carousel animation system:

**Files Changed**:
- [src/ui/renderers/DictationRenderer.ts](src/ui/renderers/DictationRenderer.ts#L435-L455)
  - Added "继续 →" next chunk button below toolbar (initially hidden)
  - Added `onNextChunk` callback to interface
  - Modified `updateCarouselView()` to use CSS transforms instead of hiding elements
  - Removed `.spelling-hidden` class from initial char-box rendering
  - Implemented horizontal sliding with `translateX(${currentCharIndex * -100}%)`

- [src/dictation.ts](src/dictation.ts#L246-L252)
  - Added `onNextChunk` callback that calls `nextChunk()` and hides button
  - Show next button when chunk is complete (line 397-398)
  - Auto-advance still works, but manual button provides user control

- [public/css/features/game/_dictation.css](public/css/features/game/_dictation.css#L90-L97)
  - `.spelling-chars-container`: Now uses `display: flex` with `flex-direction: row`
  - Added `transition: transform 0.4s cubic-bezier(0.25, 1, 0.5, 1)` for smooth sliding
  - Added `overflow: hidden` to parent to mask off-screen characters
  - Used `will-change: transform` for performance optimization

- [public/css/features/game/_characters.css](public/css/features/game/_characters.css#L20-L23)
  - `.char-box`: Added `width: 100%` and `flex-shrink: 0` for carousel item behavior
  - Each character now takes full container width as a carousel slide

**Result**:
- Smooth horizontal sliding animation between characters
- Manual next chunk button gives users control over pacing
- Better UX with visual continuity

---

#### 2. Mobile Layout Optimization (Commit: 555fd27)

**Problem**: On mobile devices, the writing card had excessive whitespace above it and could overflow on smaller screens, causing poor centering and scrolling issues.

**Solution**: Optimized mobile layout with flexible centering and safe character sizing.

**Files Changed**:
- [public/css/features/game/_responsive.css](public/css/features/game/_responsive.css#L5-L31)
  - Reduced top padding from 60px to 40px
  - Reduced bottom padding from 140px to 120px
  - Changed `justify-content: center` to `justify-content: flex-start` to allow scrolling
  - Added `margin: auto 0` to `.writing-card` for automatic vertical centering
  - Standardized `.char-slot` size to `min(220px, 60vw)` to prevent overflow on narrow screens

**Result**:
- Better vertical centering on mobile devices
- No overflow issues on smaller screens
- Card automatically centers when space is available
- Can scroll if content is too tall

---

### Technical Details

#### CSS Transform Carousel Pattern
```css
/* Container setup */
.spelling-chars-container {
    display: flex;
    flex-direction: row;
    transition: transform 0.4s cubic-bezier(0.25, 1, 0.5, 1);
}

/* Each item */
.char-box {
    width: 100%;
    flex-shrink: 0;
}

/* Sliding logic (JavaScript) */
container.style.transform = `translateX(${currentCharIndex * -100}%)`;
```

#### Mobile Layout Pattern
```css
/* Flexible centering with overflow protection */
.dictation-container {
    display: flex;
    flex-direction: column;
    justify-content: flex-start; /* Allow scroll */
}

.writing-card {
    margin: auto 0; /* Center vertically when space allows */
}

/* Safe sizing */
.char-slot {
    width: min(220px, 60vw); /* Cap at 60% viewport width */
}
```

---

### Previous Session Changes (Already Merged)

#### PR #6: Fix: Next button not clickable + 习字 UX improvements (v2.0.0)
- Fixed critical bug where next button wasn't clickable after DOM recreation
- Added word limit selection (5/10/all) for 习字 mode
- Added phrase progress indicator ("词组 3/10")
- Removed wrong stroke sound effect in 习字 mode
- Implemented semantic versioning with automated version sync
- Added update notification system with release notes
- Setup GitHub Actions CI (typecheck + build)
- Configured Cloudflare Pages deployment

#### PR #5: Fix: Eliminate excess whitespace above writing card
- Fixed pinyin display bug showing single syllable
- Improved vertical centering for writing practice

#### Earlier Work
- AudioContext autoplay warning fix
- HanziWriter reveal/hide centralization
- Character transition animation improvements

---

### Current Status

**Branch**: master
**Latest Commits**:
- 555fd27 - style: fix mobile layout overflow with margin auto centering and safe char sizing
- f3f3d45 - feat: smooth carousel animation and manual next chunk button
- e06e874 - fix: upgrade Node.js to v20 in GitHub Actions workflows

**Deployment**: https://chinese-tingxie.pages.dev/
**CI Status**: ✅ Passing (Node 20)

---

### Notes for Future Development

1. **Carousel Animation**: The carousel uses CSS transforms for performance. If adding more features, maintain the `will-change: transform` property.

2. **Mobile Sizing**: Character slots use `min(220px, 60vw)` - adjust the 60vw value if needed for different devices.

3. **Next Button**: Currently shows at chunk completion. Consider adding progress indicator or countdown if auto-advance timing needs visibility.

4. **Responsive Design**: The flex-start + margin auto pattern allows content to center when space is available but scroll when needed - useful pattern for future responsive work.
