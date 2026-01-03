---
description: How to run tests and verify changes
---

# Run Tests

// turbo-all

## TypeScript Check
Verify no type errors:
```bash
npx tsc --noEmit
```

## Playwright Tests
Run the E2E test suite:
```bash
npm test
```

## Production Build
Verify the build succeeds:
```bash
npm run build
```

## Dev Server
Start local development:
```bash
npm run dev
```
The server runs at http://localhost:5173/

## Preview Production Build
Preview the built version:
```bash
npm run preview
```
