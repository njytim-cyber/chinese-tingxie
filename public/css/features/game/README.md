# Game Feature CSS Modules

This directory contains modularized CSS for game features (听写, 默写, 写字).

## Module Structure

- `_hud.css` - HUD (timer, score, lives) styles
- `_characters.css` - Character slots, grids, SVG containers
- `_displays.css` - Text displays, footer progress
- `_feedback.css` - Feedback modals, effects
- `_animations.css` - Animation keyframes
- `_toolbars.css` - Toolbars and action buttons
- `_dictation.css` - Dictation/spelling mode specific styles
- `_responsive.css` - All responsive breakpoints

## Import Order

The main `../game.css` file imports these modules in dependency order.

## Guidelines

- Each module has a single responsibility
- Prefix filenames with `_` to indicate they're partials
- Keep files under 300 lines when possible
- All `@media` queries belong in `_responsive.css`
