# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.1] - 2026-01-18

### Added
- 🎯 Manual "继续 →" button in 习字 mode after phrase completion
- 📊 Consistent progress controls across all three practice modes
- 📍 Next chunk button container with proper spacing in 默写 mode

### Changed
- 🔄 习字 mode: Replaced auto-advance with manual button control
- 🎨 Improved button layout and vertical spacing across all modes
- 📱 Enhanced mobile layout with better centering and overflow handling

### Fixed
- ⚡ Updated GitHub Actions workflows to use Node.js 20 (Vite 7 requirement)
- 🎨 Added missing CSS for next-chunk-container visibility

## [2.0.0] - 2026-01-18

### Added
- 📊 Phrase progress indicator in 习字 mode ("词组 3/10")
- 🎯 Word limit selection (5/10/all) for 习字 mode
- ⚙️ Cloudflare Pages configuration files for optimized deployment
- 🔧 Automatic version syncing across files
- 📋 Semantic versioning (semver) system

### Changed
- 🔇 Removed sound effect for wrong strokes in 习字 mode (silent feedback)
- 🎨 Simplified 习字 session completion (auto-finish after selected limit)

### Fixed
- 🐛 **Critical:** Next button not clickable after completing first phrase
- 🐛 Event listeners now properly restored after DOM recreation
- 🔊 AudioContext warnings eliminated with auto-resume on user interaction
- 📍 Desktop vertical centering for 听写 and 默写 modes
- 📱 Mobile layout optimization (eliminated excess whitespace)
- 🔤 Pinyin display indexing bug in 听写 mode

### Technical
- Migrated from Netlify to Cloudflare Pages
- Added version bumping scripts (`npm run version:patch/minor/major`)
- Improved code documentation and session learnings

## [1.21.22] - 2026-01-17

### Added
- CSS modularization (game.css split into 8 focused modules)
- Mobile UX optimizations
- Pinyin array structure documentation

### Changed
- Improved responsive design for mobile and tablet devices

---

## Version Naming

- **Major (X.0.0)**: Breaking changes, significant new features
- **Minor (0.X.0)**: New features, backwards compatible
- **Patch (0.0.X)**: Bug fixes, minor improvements

## How to Update Version

```bash
# Bug fix (2.0.0 → 2.0.1)
npm run version:patch

# New feature (2.0.0 → 2.1.0)
npm run version:minor

# Breaking change (2.0.0 → 3.0.0)
npm run version:major
```
