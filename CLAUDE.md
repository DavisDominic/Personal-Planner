# Personal Planner

A local-first personal planner (PWA). Read these before working:

- `PRD.md` — product behavior (converted from `Personal_Planner_V1_PRD_Single_Source_of_Truth.docx`).
- `Personal_Planner_V1_1_Expanded_Design_System (1).html` — visual reference.
- `src/styles/tokens.css` — the design tokens, copied verbatim from the design system.
- `DECISIONS.md` — how conflicts and gaps between the PRD and design system were resolved. Check it first, and add an entry when the user makes a new decision.

## Rules

### 1. Source of truth
- **The PRD wins on behavior. The design system wins on visuals.**
- If they conflict, or if one is silent or ambiguous where the other matters, **stop and flag it to the user**. Never resolve a conflict silently, and never invent behavior or visuals to fill a gap.

### 2. Data access
- UI code never touches IndexedDB (or Dexie) directly. It calls domain functions only (`createTask`, `completeTask`, `moveTask`, `deleteTask`, `resolveOpenLoop`, `convertOpenLoopToTask`, `checkRitual`, `archiveRitual`, `createGoal`, `saveReflection`, ...).
- Domain logic lives in `src/domain` (public API: `src/domain/index.ts`) on top of `src/db`. It is testable without a DOM: `npm test`.
- oxlint enforces this: `npm run lint` fails if UI code (`src/components`, `src/gallery`, `App`, `main`, `lib`) imports `dexie`, `src/db`, or domain internals.
- Import is validate-then-replace. A failed import must never change existing data.

### 3. No backend
- No server, API, accounts, cloud sync, analytics, or push notifications. Everything runs in the browser and works offline.
- Don't add network calls. Fonts and icons must be bundled or cached for offline use, not fetched at runtime.

### 4. No overdue or guilt language
- Applies to UI copy, code identifiers, comments, tests, and docs.
- Never use: overdue, late, missed, behind, streak (as pressure), failed, backlog, "you haven't...", or urgency framing.
- Use the design system's vocabulary: "From yesterday", "Taken care of", "On my mind", "22 recorded days", "Welcome back."
- Errors are calm and factual, and say what was preserved.
- No scores, rankings, good/bad day labels, or celebration effects.

### 5. Styling comes from tokens
- All colors, sizes, spacing, radii, shadows, fonts, and durations come from `src/styles/tokens.css` via `var(--...)`.
- No hardcoded hex/rgb values, px sizes, font names, or durations in components or component CSS.
- If a value you need has no token (for example ink at 12% opacity, or a 9px label size), **flag it to the user**. Don't hardcode it and don't add a token yourself.
- `src/styles/unmapped.css` is the one exception: it stages the values the design system uses that have no token (`--u-*`). It is a list of gaps awaiting the user's decision, not a token set. Components may reference `--u-*` vars, but never add to that file without flagging it.
- `npm run lint:tokens` must pass. It fails on hex/rgb colors, px/em/ms literals and font-family literals outside `tokens.css` and `unmapped.css`.
- Media-query breakpoints can't use variables, so they are the one literal allowed in CSS: 980px (and 981px for min-width, the desktop start) and 680px. Keep to those.
- Icons: Lucide, bundled locally.

### 6. Protected files
- **Never edit the design system HTML file.** It is a reference only.
- Never edit `tokens.css` names or values without the user's explicit approval. It mirrors the design system.
- `PRD.md` is edited only when the user asks.

## Working style
- Ask before installing dependencies or changing the stack.
- Build in small slices. Finish and verify one before starting the next.
