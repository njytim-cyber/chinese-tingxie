---
description: How to add new vocabulary to the lessons
---

# Add Vocabulary

To add new words or phrases to a lesson:

## 1. Edit data.ts
Open `src/data.ts` and locate the `LESSONS` array.

## 2. Add Phrase to Existing Lesson
Add a new object to the lesson's `phrases` array:
```typescript
{ term: "新词语", pinyin: "xīn cí yǔ" }
```

## 3. Pinyin Format
- Use spaces between syllables
- Include tone marks (ā á ǎ à, ē é ě è, etc.)
- Example: "你好" → "nǐ hǎo"

## 4. Verify
// turbo
Run the dev server to test:
```bash
npm run dev
```

## 5. Test
// turbo
Run tests to ensure nothing broke:
```bash
npm test
```
