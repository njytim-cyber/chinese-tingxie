# Claude Code Session Notes

## Session: 2026-01-19 (Continued) - Version Display & Repository Cleanup 🧹

### Repository Organization & Code Quality

**Context**: After implementing purchase celebrations, user requested version display on loading screen, version in console logs, cleanup of unnecessary console messages, and repository organization.

**Tasks Completed**:

#### 1. Version Display on Splash Screen
- Added version string "v2.1.0" to splash screen content
- Styled with `.splash-version` class: subtle, positioned below subtitle
- Removed old `version-tag-bottom` from start overlay
- Version now prominently displayed during app initialization

**Files Changed**:
- [index.html](index.html#L42) - Added `<p class="splash-version">v2.1.0</p>`
- [public/css/index.css](public/css/index.css#L61-L68) - Added `.splash-version` styling

---

#### 2. Enhanced Console Logging
- Replaced generic "Initializing app (v1.21.22)..." with styled branded output
- Added styled console logs using `%c` CSS formatting:
  ```javascript
  console.log('%c🎨 心织笔耕 - Chinese Dictation App', 'color: #dc2626; font-size: 16px; font-weight: bold');
  console.log('%c📦 Version: 2.1.0', 'color: #059669; font-weight: bold');
  console.log('%c🚀 Initializing...', 'color: #0891b2');
  console.log('%c✓ App initialized successfully', 'color: #059669; font-weight: bold');
  ```
- Updated success message from plain "App initialized" to styled version

**Files Changed**:
- [src/main.ts](src/main.ts#L24-L26) - Enhanced initialization logs
- [src/main.ts](src/main.ts#L136) - Styled success message

---

#### 3. Console Message Cleanup
- Removed debug log: `console.log('ShopRenderer.show started')`
- Cleaned up service worker registration logs:
  - Removed: `console.log('SW registered:', registration.scope)`
  - Removed: `console.log('New service worker activated')`
  - Removed: `console.log('Service worker updated to:', event.data.version)`
  - Kept: `console.error('Service worker registration failed:', error)` for debugging
- Reduced console noise while maintaining error visibility

**Files Changed**:
- [src/ui/renderers/ShopRenderer.ts](src/ui/renderers/ShopRenderer.ts#L54) - Removed debug log
- [index.html](index.html#L182-L217) - Cleaned service worker logs

---

#### 4. Repository Organization
Created clean root directory structure by archiving obsolete files:

**Archive Structure**:
```
archive/
├── README.md
├── python-scripts/     (11 scripts)
│   ├── convert-set-b.py
│   ├── escape-inner-quotes.py
│   ├── fix-*.py (7 files)
│   └── rebuild-json.py
└── old-docs/           (7 files)
    ├── .eslintrc.hanziwriter.md
    ├── .refactoring-plan.md
    ├── features.html
    ├── master_specifications.md
    ├── NAVIGATION_MAP.md
    ├── TABBED_NAVIGATION_IMPLEMENTATION.md
    ├── spec.md
    └── task.md
```

**Removed Files**:
- `nul` - Empty temporary file
- `试卷宝-其它四年级上学期试卷 (2).pdf` - Unrelated PDF

**Clean Root Directory**:
```
root/
├── .claude/                  (Claude Code config)
├── .github/                  (CI workflows)
├── archive/                  (archived files)
├── dist/                     (build output)
├── node_modules/             (dependencies)
├── public/                   (static assets)
├── scripts/                  (build scripts)
├── src/                      (source code)
├── CHANGELOG.md              (version history)
├── CLAUDE.md                 (session notes)
├── index.html                (entry point)
├── netlify.toml              (deployment config)
├── package.json              (dependencies)
├── package-lock.json         (lockfile)
├── README.md                 (project overview)
├── tsconfig.json             (TypeScript config)
├── tsconfig.tsbuildinfo      (TypeScript cache)
└── vite.config.ts            (build config)
```

**Rationale**:
- Python scripts were one-off utilities for data migration (no longer needed)
- Old docs superseded by current documentation
- Cleaner root makes navigation easier
- Archive preserves history without cluttering active workspace

---

### Current Status

**Branch**: master
**Latest Commit**: 4bc3c04 - chore: add version display and clean up repo organization
**Deployment**: https://chinese-tingxie.pages.dev/
**Build**: ✅ Passing
**Bundle Size**: UI 155.73 kB (stable)

---

## Session: 2026-01-19 - Purchase Celebration Effects ✨

### Delightful UX Enhancement

**Context**: After completing shop expansion to 150 items, user asked "ok anything else that brings delight" - exploring ways to make the shopping experience more satisfying and joyful.

**Problem**: Purchase feedback was minimal - just green text saying "购买成功" with no visual celebration. The moment of spending yuanbao and acquiring items felt flat.

**Solution**: Implemented a multi-layered celebration animation system that triggers on successful purchases.

---

#### Celebration Components

**1. Confetti Burst** - 30 multi-colored particles exploding radially from card center
- Random colors: gold, orange, green, blue, red, purple
- Random timing offsets and duration variations
- Smooth physics with rotation and scaling
- Auto-cleanup after 1.5s

**2. Sparkle Explosion** - 12 golden sparkle particles in radial burst pattern
- Consistent 30° spacing in circular pattern
- Variable distance (80-120px)
- Gold glow with shadow effects
- Auto-cleanup after 1s

**3. Card Animations**:
- **Just Purchased**: Bounce and wiggle with scale and rotation
- **Icon Celebration**: Icon scales to 1.4x with rotation
- **Gold Shimmer**: Horizontal sweep of golden gradient
- **Success Pulse**: Expanding green ring (unused but available)

**4. Floating Yuanbao** - Shows amount spent floating upward
- Displays yuanbao icon + "-[amount]" text
- Floats up 150px while rotating 720°
- Fades out smoothly over 1.5s

---

#### Technical Implementation

**Files Created**:
- [public/css/features/shop-animations.css](public/css/features/shop-animations.css) - 10 animation sequences with keyframes

**Files Modified**:
- [public/css/index.css](public/css/index.css#L17) - Added shop-animations import
- [src/ui/renderers/ShopRenderer.ts](src/ui/renderers/ShopRenderer.ts#L343-L498) - Added celebration methods:
  - `createConfetti(x, y)` - Generate confetti particles at position
  - `createSparkles(x, y)` - Generate sparkle burst at position
  - `celebrateCard(itemId)` - Orchestrate all card animations
  - `createFloatingYuanbao(x, y, amount)` - Show yuanbao cost floating up
  - `executePurchase()` - Enhanced to trigger celebrations before card update

**Animation Timing**:
```
Purchase confirmed
├─ 0ms: Success feedback message
├─ 0ms: Floating yuanbao starts (-[price])
├─ 0ms: Confetti burst (30 particles)
├─ 0ms: Sparkle explosion (12 particles)
├─ 0ms: Card bounce animation (600ms)
├─ 0ms: Icon celebration (800ms)
├─ 0ms: Gold shimmer sweep (800ms)
└─ 200ms: Card updated with "已拥有" badge
```

**Performance**:
- All particles use CSS transforms (GPU-accelerated)
- Automatic DOM cleanup via setTimeout
- No ongoing animations after completion
- Bundle impact: +3.17 kB (152.60 → 155.77 kB)

---

#### Visual Experience

When a user purchases an item:
1. **Modal confirmation** with item details
2. **Click "确定"** to confirm purchase
3. **Explosion of joy**:
   - Confetti bursts in all directions
   - Golden sparkles radiate outward
   - Card bounces and wiggles excitedly
   - Icon spins and scales up
   - Gold shimmer sweeps across card
   - Yuanbao cost floats away
4. **Card updates** to show "已拥有" badge (owned)
5. **Balance updates** in header

The celebration lasts ~1.5 seconds total, providing satisfying visual feedback without being excessive.

---

#### Design Philosophy

**Emotional Impact**: Transform a transactional moment into a micro-celebration that:
- Validates the user's decision
- Makes spending feel rewarding
- Adds personality to the app
- Creates memorable interactions

**Implementation Principles**:
- Layered effects create depth
- Staggered timing prevents visual chaos
- Auto-cleanup ensures no memory leaks
- GPU-accelerated transforms for smooth 60fps
- Degrades gracefully (still functional without animations)

---

### Current Status

**Branch**: master
**Latest Commit**: 4c78250 - feat: add delightful purchase celebration animations
**Deployment**: https://chinese-tingxie.pages.dev/
**Build**: ✅ Passing
**Bundle Size**: UI 155.77 kB (+3.17 kB from v2.1.0)

---

## Session: 2026-01-18 (Expansion) - Shop Modularization & 150 Items 🛍️

### Major Refactoring

#### Shop System Expansion: 31 → 150 Items

**Problem**: Shop had only 31 items in a monolithic 359-line file. Expanding to more items would create an unmaintainable codebase.

**Solution**: Created modular structure with 4 category files, expanded to 150 total items.

**Files Created**:
- [src/data/shop/appearance.ts](src/data/shop/appearance.ts) - 60 items (stroke effects, ink colors, themes, styles, textures, borders, animations)
- [src/data/shop/powerups.ts](src/data/shop/powerups.ts) - 30 items (hints, XP boosts, shields, time extensions, bundles)
- [src/data/shop/tools.ts](src/data/shop/tools.ts) - 30 items (stats, modes, customization, learning paths, social features)
- [src/data/shop/content.ts](src/data/shop/content.ts) - 30 items (bonus sets, specialized packs, thematic collections, exam prep)

**Files Modified**:
- [src/data/shopItems.ts](src/data/shopItems.ts) - Reduced from 359 to 60 lines
  - Now imports and aggregates from category modules
  - Maintained all helper functions
  - Clean ESM structure

---

### Expansion Details

#### Appearance Items (60 total)
**Stroke Effects** (14 items):
- Original 4: sparkle, rainbow, brush, neon
- Added 10: glow, watercolor, calligraphy, shadow, fire, ice, laser, smoke, lightning, galaxy

**Ink Colors** (14 items):
- Original 4: gold, jade, crimson, purple
- Added 10: silver, bronze, sapphire, emerald, coral, amber, rose, indigo, turquoise, peach

**Themes** (13 items):
- Original 3: silk, bamboo, lotus
- Added 10: mountain, ocean, cloud, moon, plum, orchid, chrysanthemum, peony, imperial, scholarly

**Writing Styles** (5 items):
- kaishu (楷书), xingshu (行书), caoshu (草书), lishu (隶书), zhuanshu (篆书)

**Paper Textures** (4 items):
- rice paper, parchment, silk, aged

**Border Decorations** (5 items):
- classic, floral, geometric, dragon, phoenix

**Animation Effects** (4 items):
- fade, bounce, slide, rotate

#### Power-ups (30 total)
**Hint Tokens** (3 items):
- Single (10元宝), 5-pack (40元宝), 10-pack (70元宝)

**XP Boosts** (4 items):
- 2x single/3-pack/5-pack, 3x single

**Shields** (5 items):
- Quality shield (single/3-pack), perfect insurance (single/3-pack), streak saver

**Time & Convenience** (4 items):
- Time extension (30s/60s), skip token, undo token

**Advanced Boosts** (4 items):
- Combo booster, auto-complete, reveal pinyin, slow motion

**Mega Packs** (4 items):
- Starter pack, power pack, ultimate pack, lucky box

**Special Boosters** (6 items):
- Mastery boost, yuanbao boost, double reward, fortune charm, practice marathon, perfectionist

#### Tools (30 total)
**Core Tools** (5 items):
- Custom wordlist, advanced stats, night mode, shuffle mode, simplified toggle

**Advanced Features** (4 items):
- Export data, import data, cloud sync, offline mode

**Learning Customization** (5 items):
- Speed control, difficulty adjust, font selector, audio control, voice input

**Practice Modes** (5 items):
- Timed challenge, zen mode, competition mode, review mode, adaptive learning

**Analytics & Insights** (4 items):
- Progress reports, heatmap view, comparison tools, mastery tracker

**Social & Sharing** (3 items):
- Achievement share, study groups, friend challenge

**Premium Features** (4 items):
- Annotation tool, bookmark system, learning path, AI tutor

#### Content (30 total)
**Bonus Sets** (5 items):
- Sets D, E, F, G, H (丁、戊、己、庚、辛)

**Specialized Packs** (5 items):
- Idiom pack/advanced, poetry pack/modern, classical texts

**Thematic Collections** (5 items):
- Nature, culture, food, travel, business

**Grade-Level Content** (4 items):
- Primary 1-3, primary 4-6, middle school, high school

**Exam Preparation** (4 items):
- HSK 1-3, HSK 4-6, gaokao prep, AP Chinese

**Special Collections** (7 items):
- Rare characters, similar chars, homophones, proverbs, seasonal, zodiac, master collection

---

### Technical Improvements

**Modular Structure**:
- Separation by item category for better organization
- Each category file is independently maintainable
- Easy to expand individual categories without touching others

**ESM Compliance**:
- Clean ES module imports/exports
- TypeScript types properly exported
- No circular dependencies

**Code Reduction**:
- Main shopItems.ts: 359 → 60 lines (83% reduction)
- Total codebase: More items, better organized, easier to maintain

**Build Performance**:
- TypeScript compilation: ✅ Passes
- Production build: ✅ Succeeds (1.04s)
- No performance regression

---

### Current Status

**Branch**: master
**Latest Commits**:
- 563f5ef - fix: complete shop expansion to 150 items with all SVG icons
- 26e0639 - docs: document shop expansion to 150 items
- 20799ee - refactor: modularize shop items and expand to 150 total

**Shop Items**: ✅ 150 total (60 appearance, 30 powerups, 30 tools, 30 content)
**SVG Icons**: ✅ 87 total definitions (all items covered)
**Bundle Size**: 152.60 kB UI bundle (+15.7 kB for 5x content expansion)
**Deployment**: Pushed to production
**CI Status**: ✅ Passing

---

### What Was Completed

✅ **Modular Structure** - Created 4 category files (appearance/powerups/tools/content)
✅ **Code Reduction** - shopItems.ts: 359 → 60 lines (83% reduction)
✅ **Item Expansion** - 31 → 150 items (60/30/30/30 distribution)
✅ **Icon Coverage** - Added 73 new SVG icons (87 total, all items covered)
✅ **Build Verification** - TypeScript + production build passing
✅ **Bundle Optimization** - Only +15.7 kB for 5x content expansion
✅ **Documentation** - Complete session notes in CLAUDE.md
✅ **Deployment** - All changes pushed to production

---

### Notes for Future Development

1. **Adding New Items**: Add to appropriate category file in `src/data/shop/`
2. **Category Distribution**: Maintain balance across categories
3. **Icon Definitions**: Add corresponding SVG icons to [shopIcons.ts](src/data/shopIcons.ts)
4. **Pricing Strategy**: Keep ranges consistent within categories
5. **Item Types**: Use `cosmetic`, `consumable`, `permanent`, or `content`

---

## Session: 2026-01-18 (Final) - v2.1.0 Release - Shop System 🏪

### Major Features

#### Complete Shop System with Yuan bao (元宝) Currency

**Problem**: Gold ingot icons were purely decorative, representing XP/stats with no actual currency system. Users had no way to spend in-game rewards or customize their experience.

**Solution**: Implemented a comprehensive shop system with spendable yuanbao currency, 30 purchasable items, and multiple earning mechanics.

---

### 🪙 Currency System

**Earning Yuanbao**:
- **Word Completion**: 1-2 元宝 based on quality (Perfect: 2, Good: 1)
- **Session Completion**: 5-20 元宝 (scales with words: 5 + words, max 20)
- **Daily Login**: 5 元宝 (once per day)
- **Achievements**: 10-150 元宝 (tier-based rewards)
  - First Word: 10
  - 3/7/30-day streaks: 20/50/100
  - Level 5/10: 30/50
  - 10/50/all words learned: 25/50/150
  - Perfect 10/1000 XP/lesson complete: 40/30/35
- **Retroactive Bonus**: Existing players receive yuanbao based on current progress (one-time)

**Display**: Header shows `🔥 streak · 元宝 balance · 📚 words learned`

---

### 🛍️ Shop Items (30 Total)

#### Appearance (11 items)
**Stroke Effects** (50-80 元宝):
- 星光笔迹 (Sparkle trail)
- 彩虹笔迹 (Rainbow gradient)
- 毛笔效果 (Traditional brush)
- 霓虹笔迹 (Neon glow)

**Ink Colors** (90-100 元宝):
- 金墨 (Gold)
- 翡翠墨 (Jade green)
- 朱砂墨 (Crimson)
- 紫薇墨 (Purple)

**Card Themes** (120-150 元宝):
- 绸缎主题 (Silk texture)
- 竹简主题 (Bamboo scroll)
- 莲花主题 (Lotus decoration)

#### Power-ups (6 items - Consumables)
- 提示符 (10 元宝) - Hint token, stackable
- 提示包 5个 (40 元宝) - 5-pack bundle
- 学习加速 (30 元宝) - 2x XP for 1 session
- 学习加速 3场 (75 元宝) - 2x XP for 3 sessions
- 品质护盾 (25 元宝) - Mistakes don't reduce quality
- 完美保险 (35 元宝) - Auto-correct first error

#### Tools (5 items - Permanent Unlocks)
- 自定义词单 (200 元宝) - Custom word lists
- 高级统计 (150 元宝) - Advanced analytics dashboard
- 简繁切换 (100 元宝) - Simplified/Traditional toggle
- 随机模式 (80 元宝) - Full shuffle practice
- 夜间模式 (120 元宝) - Dark theme with auto-switching

#### Content (4 items - Unlockable Sets)
- 丁集 Set D (250 元宝) - 20 additional dictation passages
- 戊集 Set E (300 元宝) - 20 advanced passages
- 成语专辑 (180 元宝) - 50 common idioms
- 诗词专辑 (200 元宝) - Classic Tang/Song poetry

---

### 🎨 UI/UX

**Navigation**:
- New "商店" tab in main nav (4-tab layout: 听写 | 默写 | 商店 | 进度)
- Categorized browsing: 全部 (All) / 外观 (Appearance) / 道具 (Power-ups) / 工具 (Tools) / 内容 (Content)

**Item Cards**:
- Icon, name, description, price
- Purchase button (disabled if owned for non-stackables)
- "已拥有" badge for owned items
- "x{count}" badge for stackable items
- Responsive grid layout (1 col mobile, 2-4 cols desktop)

**Purchase Flow**:
- Confirmation modal with item details and balance check
- Real-time balance updates after purchase
- Toast notifications for success/errors

**Styling**:
- Tang Dynasty aesthetic maintained
- Gold ingot SVG icons throughout
- Hover animations and smooth transitions
- Mobile-optimized touch targets

---

### 🛠️ Technical Implementation

**Data Layer**:
- **PlayerStats** extended with:
  - `yuanbao: number` - Currency balance
  - `lastLoginDate: string | null` - Daily reward tracking
  - `purchasedItems: string[]` - Owned item IDs
  - `activeEffects: Record<string, number>` - Active power-up expiry timestamps
  - `shopInitialized?: boolean` - Retroactive bonus flag
- **shopItems.ts**: Item database with metadata (id, name, desc, price, type, category, icon, data)

**Game Integration**:
- `GameLogic.calculateYuanbao(quality)` - Earn 0-2 per word
- `GameLogic.calculateSessionBonus(wordsCompleted)` - Scaled session rewards
- `WordCompletionHandler` - Auto-award yuanbao on completion, show in feedback
- `SessionManager` - Award session completion bonus
- `achievements.ts` - Modified `checkAchievements()` to award yuanbao on unlock

**Shop Functions** ([src/data/manager.ts](src/data/manager.ts)):
- `grantRetroactiveBonus()` - One-time bonus for existing players
- `checkDailyLoginReward()` - Daily 5 yuanbao claim
- `addYuanbao(amount, reason?)` - Add currency with logging
- `purchaseItem(itemId)` - Validation, balance check, inventory update
- `ownsItem(itemId)` / `getItemCount(itemId)` - Ownership queries
- `useConsumableItem(itemId)` - Decrement stackable items
- `activatePowerUp/deactivatePowerUp/isPowerUpActive` - Effect management
- `cleanupExpiredPowerUps()` - Remove stale effects

**UI Components**:
- **ShopRenderer** ([src/ui/renderers/ShopRenderer.ts](src/ui/renderers/ShopRenderer.ts))
  - Uses `TabbedNav` for category switching
  - Item grid with `createItemCard()` for each item
  - Balance header with SVG gold ingot
  - Purchase confirmation via `UIManager.showConfirm()`
- **HUDController** ([src/ui/HUDController.ts](src/ui/HUDController.ts))
  - `updateDashboardStats()` now shows: 🔥 streak · 元宝 balance · 📚 words
  - Calls `getYuanbaoBalance()` which auto-cleans expired effects
- **shop.css** ([public/css/features/shop.css](public/css/features/shop.css))
  - Responsive grid (280-320px cards)
  - Tang Dynasty color scheme
  - Owned/count badges
  - Purchase modal styling

**Module Resolution Fix**:
- Changed from `export *` to explicit named exports in `src/data/index.ts`
- Imported shop functions directly from `'../data/manager'` where needed
- Resolved TypeScript barrel export detection issues

---

### ⚡ Performance Optimizations

1. **Session Bonus Scaling**:
   - Changed from flat 5 yuanbao to `min(5 + wordsCompleted, 20)`
   - Rewards longer practice sessions: 10 words = 15 元宝, 15+ = 20 元宝

2. **Proper Initialization Flag**:
   - Replaced magic string `'__retroactive_bonus_granted__'` in purchasedItems[]
   - Added `shopInitialized: boolean` field to PlayerStats
   - Cleaner code, no pollution of inventory array

3. **Proactive Power-Up Cleanup**:
   - Added `cleanupExpiredPowerUps()` calls in:
     - `getYuanbaoBalance()` - before displaying shop
     - `purchaseItem()` - before processing purchases
     - `useConsumableItem()` - before using items
   - Previously only ran on `loadData()`, now runs at key interaction points

---

### 📦 Files Changed

**Created**:
- [src/data/shopItems.ts](src/data/shopItems.ts) - 30-item database
- [src/ui/renderers/ShopRenderer.ts](src/ui/renderers/ShopRenderer.ts) - Shop UI renderer
- [public/css/features/shop.css](public/css/features/shop.css) - Shop styling

**Modified**:
- [src/types.ts](src/types.ts) - Extended PlayerStats, added ShopItem/Category types
- [src/data/manager.ts](src/data/manager.ts) - Shop functions (12 new exports)
- [src/data/index.ts](src/data/index.ts) - Explicit named exports
- [src/data/stats.ts](src/data/stats.ts) - Default stats with shop fields
- [src/data/achievements.ts](src/data/achievements.ts) - Yuanbao rewards on unlock
- [src/game/GameLogic.ts](src/game/GameLogic.ts) - Yuanbao calculation functions
- [src/game/WordCompletionHandler.ts](src/game/WordCompletionHandler.ts) - Award yuanbao
- [src/game/SessionManager.ts](src/game/SessionManager.ts) - Session completion bonus
- [src/game.ts](src/game.ts) - `navigateToShop()` method
- [src/ui/HUDController.ts](src/ui/HUDController.ts) - 3-stat header display
- [src/ui/UIManager.ts](src/ui/UIManager.ts) - `showShop()` integration
- [src/main.ts](src/main.ts) - Shop button event handler
- [index.html](index.html) - Shop navigation button
- [public/css/index.css](public/css/index.css) - Import shop.css

---

### 🎯 Build Metrics

- **Build size**: ~260 kB (unchanged from v2.0.2)
- **CSS**: 55.04 kB
- **UI chunk**: 108.42 kB (includes ShopRenderer)
- **Game logic**: 44.54 kB
- **Compilation**: ~1 second

---

### 🚀 Deployment Notes

**Migration**:
- Retroactive bonus automatically granted on first load post-update
- Existing players receive yuanbao based on:
  - 10 per level
  - 50 per achievement
  - 20 per 7-day streak milestone
- No breaking changes to existing data structures
- Backward compatible

**Testing Checklist**:
- [x] Build succeeds with no TypeScript errors
- [x] Shop tab appears in navigation
- [x] Categories filter items correctly
- [x] Purchase flow validates funds and ownership
- [x] Yuanbao balance updates in header
- [x] Daily login rewards work
- [x] Session/word completion awards yuanbao
- [x] Achievement unlocks award yuanbao
- [x] Retroactive bonus grants correctly (one-time)
- [x] Power-up cleanup runs proactively

---

### 📊 Current Status

**Branch**: master
**Version**: 2.1.0 🏪
**Latest Commits**:
- ae2d51a - refactor: optimize shop system performance and code quality
- 74669c7 - feat: add complete shop system with yuanbao currency (v2.1.0)
- e5c7496 - docs: update CLAUDE.md with v2.0.2 session notes
- 37824e8 - feat: replace 'Lv.X' text with visual dots in character mastery
- 80fdd93 - chore: bump version to 2.0.2 with cache-clearing reload

**Deployment**: https://chinese-tingxie.pages.dev/
**CI Status**: ✅ Passing (Node 20)

**What's Live**:
- Complete shop system with 30 items
- Yuanbao currency earning & spending
- Daily login rewards (5 元宝)
- Quality-based word rewards (1-2 元宝)
- Session completion bonuses (5-20 元宝)
- Achievement rewards (10-150 元宝)
- Retroactive bonus for existing players

**Next Steps**:
- Item effects are data-only (cosmetics/power-ups not yet implemented)
- Shop items ready for future feature integration
- Achievement gallery still shows "under development" toast

---

### 🎯 Notes for Future Development

1. **Shop System**:
   - Items purchasable but effects not implemented yet
   - Power-up system ready for integration (`activatePowerUp`, `isPowerUpActive`, etc.)
   - Cosmetic effects (stroke styles, ink colors, themes) need renderer integration

2. **Currency Balance**:
   - Users earn yuanbao consistently across all game modes
   - Economy tested at ~15-25 yuanbao per session for typical performance
   - High performers can earn 35-50 yuanbao with perfect streaks

3. **Module Pattern**:
   - Use explicit named exports in barrel files (avoid `export *`)
   - Import shop functions from `'../data/manager'` directly when needed
   - Maintains TypeScript module resolution compatibility

4. **Performance**:
   - Power-up cleanup happens proactively at key interaction points
   - Session bonuses scale with effort to reward longer practice
   - Shop UI uses responsive grid optimized for mobile

---

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
