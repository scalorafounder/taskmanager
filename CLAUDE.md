# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start Vite dev server (reads PORT env var for preview tools)
npm run build    # Production build
npm run lint     # ESLint
npm run preview  # Serve the dist/ build locally
```

## Architecture

**Stack:** React 19, Vite 8, Tailwind CSS v4, Framer Motion, @dnd-kit, Supabase

### State & data flow

All task mutations live in `src/hooks/useTasks.js` as `useCallback` functions operating on a single `tasks` array via `setTasks`. The hook is the single source of truth — no external state library.

`App.jsx` owns the top-level orchestration:
- Pulls everything from `useTasks` and passes props down
- Handles Supabase load-on-mount and debounced save (800 ms) to `user_tasks` table
- Supabase is **optional**: if `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` are absent, the app runs in local demo mode with a no-op Supabase stub (`src/lib/supabase.js`)
- Auth state is managed in `src/context/AuthContext.jsx` via `useAuth()`

### Task data model

```js
// Regular task
{ id, title, completed, type: 'task', createdAt }

// Group
{ id, title, completed, type: 'group', children: [{ id, title, completed }], createdAt, pendingRename? }
```

Groups auto-complete when all children are done. `pendingRename: true` triggers the inline rename input to open on mount (used by merge and folder-button creation).

### Component hierarchy

```
App.jsx
  AuthProvider (context/AuthContext.jsx)
  AppShell → AuthScreen | AppContent
    TaskList.jsx          ← DndContext + SortableContext wrapper
      TaskItem.jsx        ← useSortable (top-level tasks/groups)
        SubTaskRow        ← useDraggable (children, draggable out of group)
    AddTaskBar.jsx        ← bottom input bar + folder button
```

### Drag-and-drop

- **Top-level tasks** use `useSortable` from `@dnd-kit/sortable` — they reorder or merge.
- **Subtasks** use `useDraggable` from `@dnd-kit/core` — dragging one out of a group extracts it as a standalone task (`extractFromGroup` in useTasks).
- Merge is triggered by hovering a dragged task over another for ≥ 400 ms (`MERGE_THRESHOLD_MS` in TaskList).
- `findSubtaskParent` in TaskList detects subtask drags so they skip the merge timer and go straight to extraction on drop.
- The children container uses `onPointerDown/onTouchStart stopPropagation` to prevent accidental group drags; subtask drag listeners fire before this bubbles, so they still activate.

### Styling conventions

- Dark theme: base `#0c0c0e` background, all colors via `rgba(255,255,255,α)`.
- Completed tasks: green border `rgba(74,222,128,0.4)` + subtle glow, no strikethrough, readable text.
- All interactive motion uses Framer Motion (`motion.div`, `AnimatePresence`). Spring/ease configs are inline.
- Mobile-first: `touch-none` on draggable elements, `env(safe-area-inset-*)` for padding, 16px font on inputs to prevent iOS zoom.

### Environment variables

| Variable | Purpose |
|---|---|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon key |

Both must be set for auth and cloud sync to activate. Without them the app works fully in local/demo mode.
