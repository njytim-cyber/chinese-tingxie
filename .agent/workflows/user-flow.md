---
description: user flow diagram and navigation structure
---

# User Flow Workflow

This workflow documents the application's navigation flow. When modifying the application's navigation or adding new screens, update the diagram below to reflect the changes.

## App Navigation Flow

```mermaid
graph TD
    A[App Startup] --> B[Spelling Selector]
    
    B -- "Select Lesson" --> C[Spelling Mode (Game)]
    B -- "Tab: 默写" --> D[Dictation Selector]
    B -- "Tab: 进度" --> E[Progress / Analytics]
    
    D -- "Select Passage" --> F[Dictation Mode]
    D -- "Tab: 听写" --> B
    
    E -- "Tab: 听写" --> B
    
    C -- "Complete" --> G[Selection Results]
    F -- "Complete" --> H[Dictation Results]
    
    G -- "Continue / Back" --> B
    H -- "Continue / Back" --> D
    
    subgraph "Navigation States"
        B
        D
        E
    end
    
    subgraph "Practice Modes"
        C
        F
    end
```

## How to Update
1. Modify the Mermaid code above to reflect structural changes.
2. Synchronize these changes with the corresponding logic in `src/game.ts` and `src/main.ts`.
