# Decisions

Product and design decisions made while building, so they survive between sessions.
`PRD.md` is still the source of truth for behavior; this file records how gaps and conflicts were resolved.
Add new entries at the top. Status is **Confirmed** (the user said so) or **Assumed** (Claude's default, awaiting a yes).

---

## Data layer (Slice 1)
**Status: Assumed.** Choices the PRD leaves open, made while building. Correct any that are wrong.

- **Formats:** dates are local `YYYY-MM-DD`, times `HH:mm`, timestamps ISO 8601, ids UUIDs. Absent optional fields are omitted, not null.
- **Statuses:** Task `active | completed | no-longer-relevant`; Open Loop `open | taken-care-of`; Goal `active | archived`. Deleting removes the record (no trash) and returns it so the UI can offer Undo.
- **Weeks start on Monday** (matches the design system's week view). Note the design system's month grid starts on Sunday; that mismatch is unresolved.
- **Undo and reopen:** completing, resolving and archiving each have a reverse (`reopenTask`, `reopenOpenLoop`, `restoreRitual`, `restoreGoalFromArchive`) so a mis-tap is recoverable. A completed task cannot be moved until reopened (it stays on its original date).
- **Older unfinished tasks:** the PRD says an unfinished task is surfaced the next day as "From yesterday". Tasks from earlier days are surfaced too (the Welcome Back review needs them). The domain returns all unfinished dated tasks from before a date; the UI decides how to group and label them.
- **Empty reflection:** saving empty content on an existing reflection removes it (returned for Undo). Saving empty with nothing stored creates nothing.
- **Weekly rituals** mean "once a week, any day", so every day lists them. Check-ins are accepted on any date, including days the frequency doesn't list.
- **Goal change history** ("when changed significantly") is not recorded yet. It is undefined in the PRD and belongs with the Goals screen (Slice 8).
- **Convert Open Loop to Task** creates a new task (new id, new created time) and deletes the loop in one transaction. It keeps the loop's title, note and date unless overridden.
- **The priority prompt is a question, not a rule.** `shouldConfirmPriority(date, taskId?)` tells the UI whether to ask. The domain never blocks a sixth priority, and never asks on moves.

## Priority
**Status: Confirmed** (2026-09-20)

The PRD's rules apply as written (PRD 7, "Priority"). Only the representation is decided here.

- Shown as **P1, P2, P3, ...**. **P1 is the highest.** There is no P0.
- Recommended range is P1–P5. Higher levels (P6+) are allowed, with no upper cap and no hard block.
- The level is user-chosen and optional. The app never assigns or changes it, and never ranks automatically.
- **Levels can be shared.** Two tasks can both be P2. The number is a level, not a unique slot.
- **"Five" is counted per day.** The gentle confirmation ("You've chosen five priorities already. Add this anyway?") appears when the user sets or changes a priority on a task and that day already has five tasks with a priority. The count is by the task's date.
- The count includes completed priorities. It excludes deleted tasks and tasks marked No Longer Relevant.
- Day view: all priorities visible and never collapsed, ordered by level, completed ones kept with a checkmark. Week previews list priorities first.

### Undated tasks with a priority
- Allowed. An undated task with a priority **shows on every Day from its creation date onward** (no new screen).
- It sits in that day's Priorities section, ordered by its P-level, and counts toward that day's five. *(Assumed.)*
- It stays until it is completed, marked No Longer Relevant, or deleted. Completing it shows a checkmark on the day it was completed and it stops appearing on later days. *(Assumed.)*
- It is not date-bound, so it never appears in "From yesterday". *(Assumed.)*
- **Open:** where undated tasks *without* a priority appear is not specified by the PRD or decided here.

### Carry-over to the next day
- An unfinished task stays on its original date with its priority unchanged. The next day it appears in **From yesterday**, which is a view and not a data change.
- It does **not** count toward the new day's five and is not in the new day's Priorities section. It shows its P-level as a plain fact.
- **Complete today** changes the date to today and keeps the P-level. It then appears in today's Priorities and counts toward today's five.
- **Move to another date** does the same on the chosen day.
- **No confirmation on Complete today or Move.** The PRD says moving is allowed repeatedly "without warnings or nagging", and that wins. A day can end up with more than five priorities.

## Urgency language
**Status: Confirmed** (2026-09-20)

The PRD wins over the design system. The design system's `ASAP` badge, `blocked` badge and "ASAP / LATER" card kicker are not built. The card kicker reads "TASKS". Also see CLAUDE.md rule 4.

## Text on coloured surfaces
**Status: Confirmed** (2026-09-20)

Text on a coloured background uses `--ink`, never `--ink-muted`. Muted ink is only for plain white and paper surfaces.

## Mobile navigation and capture
- **Confirmed:** on mobile, **+ Capture is a floating button at the bottom right** (thumb zone), at least 48px, above the bottom nav and clear of the safe area. On desktop it sits at the top of the sidebar.
- **Confirmed** (2026-09-20):
  - Mobile bottom nav is Calendar / Looking Back / Goals / Settings, with no "More" menu.
  - Search is a magnifier icon in the mobile header, opening a full-screen search with filters below the field.
  - Desktop sidebar has Calendar / Looking Back / Goals, with Search and Settings as utility items at the bottom, and ⌘K opens search.

## Dark mode
**Status: Confirmed** (2026-09-20)

Not built. The design system defines no dark theme.

## Screens the design system doesn't cover
**Status: Assumed**

Goals, Settings/Backup, Welcome Back, First Launch, the "From yesterday" review, the date picker, the weekday selector and the sixth-priority confirmation are designed in the slice that first needs them. They are composed from existing components and tokens, and each is flagged for review. Any value without a token is raised with the user first.

## Design-system gaps and defaults
**Status: Confirmed** for reflection saving, focus ring, touch targets and unmapped values (2026-09-20); the rest are Assumed.

- **Reflection saving (Confirmed):** the PRD wins. Reflections save as the user types, with no Save button. The gallery still shows the design system's "Save reflection" button for comparison only.
- **Focus ring (Confirmed):** 3px, as in the design system CSS (its mobile spec text says 2px).
- **Touch targets (Confirmed):** visuals stay as the design system draws them. The interactive area extends to `--touch` (44px) without changing the look.
- **Unmapped values:** design-system values with no token are staged in `src/styles/unmapped.css` as `--u-*` variables. It is a list of gaps for the user to map, approve or change, not a token set. **Confirmed** as the approach on 2026-09-20.
- **Sidebar icons (Assumed):** built at 16px, per the design system CSS. The original renders them at 24px because of an icon-library quirk.
- **Left out of the gallery (Assumed):** the mobile-vs-web spec mockups and the accessibility, motion, content-language and handoff prose sections.

## Stack
**Status: Confirmed** (2026-09-20)

Vite, React, TypeScript, CSS Modules. Dexie and `vite-plugin-pwa` arrive with the slices that need them. Fonts (Fontsource) and icons (`lucide-react`) are bundled so the app works offline. No backend, no runtime CDN.
