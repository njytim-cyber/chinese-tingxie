# Task Log

## Session Handoff - 2026-01-17

### Completed This Session ✅
1. **听写 Mode - Audio Repetition Fix**
   - Prevented TTS from repeating audio when moving between characters in same chunk
   - Implementation: Track `lastChunkText` in `src/game.ts`
   - Status: ✅ Deployed to production

2. **习字 Mode - Phrase-Based Practice Rewrite**
   - Changed from character-based to phrase-based sequential practice
   - Single 280x280 character box (avoids mobile cutoff)
   - Phrase context displayed with current character highlighted
   - Flow: Write 刚 → 才 (stage 1) → 刚 → 才 (stage 2) → 刚 → 才 (stage 3)
   - Files: `src/game/XiziController.ts`, `src/data.ts`
   - Status: ✅ Deployed to production

3. **Documentation**
   - Updated `spec.md` with deployment strategy (Section 9)
   - Added Key Learnings & Gotchas (Section 10)
   - Status: 📝 In PR #2 (https://github.com/njytim-cyber/chinese-tingxie/pull/2)

### Pending Work 📋
- None currently

### Notes for Next Session 📝
- **PR #2** is open for documentation updates - merge when ready
- Current version: `1.21.22`
- All user-requested features implemented and deployed
- Netlify CI/CD: Use PR workflow to avoid credit consumption on exploratory work
