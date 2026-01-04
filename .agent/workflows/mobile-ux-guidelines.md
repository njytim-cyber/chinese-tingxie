---
description: Guidelines for optimizing Mobile UX and Touch Interactions
---

# Mobile UX Guidelines

Follow these patterns when implementing features for mobile devices (screen width <= 600px).

## 1. Focus View (Carousel)
For complex inputs (like Dictation), avoid scrolling lists. Use a focused **Carousel View**:
-   **One Item at a Time**: Display only the active character/element suitable for the viewport.
-   **Auto-Advance**: Automatically move to the next item upon successful completion.

## 2. Smart Navigation
Avoid generic "Prev/Next" buttons that clutter the UI or trap the user.
-   **Hide Irrelevant Buttons**: If at the start, hide the "Previous" (`<`) button.
-   **Transform Context**: At the end of a sequence, change the "Next" (`>`) button to a **"Submit"** or **"Check"** (`✓`) button. This provides a clear "Done" action and prevents the "stuck" feeling.

## 3. Viewport Management
Mobile browsers often have rubber-band scrolling that disrupts game-like apps.
-   **Lock Viewport**: Apply `overflow: hidden; position: fixed; width: 100%; height: 100%;` to `body` for immersive modes.
-   **Safe Areas**: Respect notch/dynamic island safe areas using `env(safe-area-inset-...)`.

## 4. Touch Targets
-   **Size**: Interactive elements must be at least 44x44px.
-   **Spacing**: Ensure adequate generic margin to prevent accidental clicks.
