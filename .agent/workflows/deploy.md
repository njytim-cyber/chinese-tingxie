---
description: How to deploy changes to production (Netlify via GitHub)
---

# Deploy to Production

Follow these steps to deploy changes safely:

## Pre-flight Checks
1. Run TypeScript compiler to check for errors:
   ```bash
   npx tsc --noEmit
   ```

2. Run the test suite:
   ```bash
   npm test
   ```

3. Build the production bundle:
   ```bash
   npm run build
   ```

## Version Bump (CRITICAL)
// turbo
4. You MUST increment the version number in ALL of the following files before committing:
   - **`index.html` (First Page)**: 
     - Update `<meta name="version" content="...">`
     - Update visible text `<p class="version-tag">v...</p>`
   - `package.json`: Update `"version"` field
   - `public/sw.js`: Update `CACHE_NAME` constant


## Commit and Push
5. Stage all changes:
   ```bash
   git add -A
   ```

6. Commit with descriptive message:
   ```bash
   git commit -m "Brief description of changes"
   ```

7. Push to master (triggers Netlify build):
   ```bash
   git push origin master
   ```

## Verify Deployment
8. Wait 1-2 minutes for Netlify to build
9. Check the live site to verify changes
