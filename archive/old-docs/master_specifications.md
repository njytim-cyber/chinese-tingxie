This is the master list of specifications for the Coding Agent. It is organized by System Layer so the agent can build from the foundation up without missing dependencies.

Phase 1: The Design System (Configuration)
1.1. Color Palette (Tailwind Config)
Backgrounds:
tang-paper: #F9F7F2 (Primary App Background)
tang-paper-dark: #E5E0D6 (Borders, Dividers, Inactive elements)
lantern-bg: #1B1F3B (Dark Mode / Lantern Mode background)
Typography:
tang-ink: #2B2B2B (Primary Text - Soot Black)
tang-ink-light: #666666 (Secondary Text - Wash Grey)
lantern-text: #F2D0A4 (Dark Mode Text - Amber)
Actions & Accents:
tang-red: #C44032 (Primary Action / Cinnabar Seal)
tang-red-light: #FEF2F2 (Active State Backgrounds)
tang-jade: #7DA89B (Progress Bars / Success)
tang-gold: #D4AF37 (Stars / Ranks)

1.2. Typography Strategy
Headers (H1, H2, Badges): Font Family: ZCOOL XiaoWei or Ma Shan Zheng (Serif/Calligraphy).
Body Copy: Font Family: Noto Sans SC or System Sans (Legibility).
Writing Grid Characters: Font Family: KaiTi (Standard Textbook Script).

1.3. Global Assets (CSS/SVG)
Texture: Add a subtle "Rice Paper" noise texture overlay to the tang-paper background.
Shadows: Replace standard CSS shadows with "Tang Shadows" (soft, diffused, paper-lift effect).
iOS: shadowOpacity: 0.08, shadowRadius: 8.
Android: elevation: 4 with white background.

Phase 2: Core Components
2.1. The App Shell (Layout)
Remove: All grey header bars (bg-gray-500).
Implement: TangLayout wrapper.
Sticky Header: Background #F9F7F2 (or transparent with blur).
Border: 1px solid #E5E0D6 (Bottom).
Back Button: Minimalist SVG Arrow (#666666).

2.2. Navigation & Tabs
Bottom Nav: White/Cream background. Icons must be Outline Brush Style (variable width strokes). Active state fills with tang-red.
Segmented Controls (Tabs):
Container: Transparent (Remove grey backgrounds).
Active Tab: White Card style with tang-red text and subtle shadow.
Inactive Tab: Plain text (#666666).

2.3. Lists & Cards
Lesson Cards:
Shape: Rounded Corners (rounded-xl / 16px).
Inactive: White background, #E5E0D6 border, Grey Badge.
Active: #FEF2F2 (Red Wash) background, #C44032 border.
Badge: The "1" must be a Red Circle (Seal) with White text.
Progress Bars:
Style: "Jade Brush Stroke" (Rounded caps, #7DA89B fill).

Phase 3: Screens & Features
3.1. Home Screen (The Journey)
Layout: Replace vertical list with a "Shan Shui" (Landscape Painting) Scroll.
Nodes: Lanterns (Unlocked) vs. Ghosted Sketches (Locked).
Metaphors:
XP -> Merit (Jade Disc).
Streak -> Lantern (Lit/Unlit).
Lives -> Ink (Ink Stone level).

3.2. Lesson Detail (Writing View)
The Grid: Implement "Tián Zì Gé" (Field Grid).
Outer Border: Solid.
Inner Guides: Dashed Cinnabar Red lines (Opacity 30%).
The Ink: User input strokes must be Dark Charcoal (#2B2B2B) (not pure black) with rounded caps.
Success Animation:
Trigger: Correct write.
Action: "Stamp Slam" animation.
Graphic: The character "优" (Excellent) inside a red square seal, appearing with a scale-down "thud" effect.
Pagination: Replace dots with glowing "Jade Beads".

Phase 4: Sensory Experience (Polish)
4.1. Audio (The "Scholar's Studio")
Music: Vertical Layering (Base, Mid, Full) of 30s loops. Instruments: Guzheng, Dizi.
SFX:
Tap: Weiqi Stone clack (Stone on Wood).
Success: Porcelain Bell / Single Guzheng pluck.
Error: Bamboo Woodblock thud.
Page Turn: Paper Rustle.

4.2. Haptics
Writing: Light continuous impact (friction texture).
Stamp Success: Heavy Impact (Thud).
UI Tap: Medium Impact.

4.3. Transitions
Page Load: "Unfurl" (Scroll opening).
Image Load: "Ink Bleed" (Black ink spreading to fill the shape).

Phase 5: Immediate "Fix-It" List (Screenshot Specifics)
Home: Invert the "Navy Blue" card to White with Red Border.
Writing: Change "sú" text from Yellow to Grey or Red.
Global: Delete all "Modern Grey" headers and replace with the Cream/Beige theme.
Dark Mode: Implement "Lantern Mode" (Deep Indigo background, Amber text) instead of standard black.
