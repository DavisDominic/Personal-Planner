# Decisions

Product and design decisions made while building, so they survive between sessions.
`PRD.md` is still the source of truth for behavior; this file records how gaps and conflicts were resolved.
Add new entries at the top. Status is **Confirmed** (the user said so) or **Assumed** (Claude's default, awaiting a yes).

---

## Data layer (Slice 1)
**Status: Assumed.** Choices the PRD leaves open, made while building. Correct any that are wrong.

- **Formats:** dates are local `YYYY-MM-DD`, times `HH:mm`, timestamps ISO 8601, ids UUIDs. Absent optional fields are omitted, not null.
- **Statuses:** Task `active | completed | no-longer-relevant`; Open Loop `open | taken-care-of`; Goal `active | archived`. Deleting removes the record (no trash) and returns it so the UI can offer Undo.
- **Undo and reopen:** completing, resolving and archiving each have a reverse (`reopenTask`, `reopenOpenLoop`, `restoreRitual`, `restoreGoalFromArchive`) so a mis-tap is recoverable. A completed task cannot be moved until reopened (it stays on its original date).
- **Older unfinished tasks:** the PRD says an unfinished task is surfaced the next day as "From yesterday". Tasks from earlier days are surfaced too (the Welcome Back review needs them). The domain returns all unfinished dated tasks from before a date; the UI decides how to group and label them.
- **Empty reflection:** saving empty content on an existing reflection removes it (returned for Undo). Saving empty with nothing stored creates nothing.
- **Weekly rituals** mean "once a week, any day", so every day lists them. Check-ins are accepted on any date, including days the frequency doesn't list.
- **Goal change history** ("when changed significantly") is not recorded yet. It is undefined in the PRD and belongs with the Goals screen (Slice 8).
- **Convert Open Loop to Task** creates a new task (new id, new created time) and deletes the loop in one transaction. It keeps the loop's title, note and date unless overridden.
- **The priority prompt is a question, not a rule.** `shouldConfirmPriority(date, taskId?)` tells the UI whether to ask. The domain never blocks a sixth priority, and never asks on moves.

## Year view and Goals (Slice 7)
**Status: Assumed** unless noted

- **Year view** (Day / Week / Month / **Year** switch, `‹ 2026 ›`): exactly what PRD 12 lists, three things: the **12 months**, a **light indication of recorded activity**, and the **Year's goals**. No individual tasks, open loops or rituals.
- **Each month card** shows a factual "N recorded days" (blank when there are none: absence is neutral) and a small strip with one bar per week of the month. Empty weeks are faint marks, never a gap or a failure. A card opens that month, keeping the selected date if it is in that month, else today if it is, else the 1st. The month holding the selected date is the yellow card; the month holding today has an ink dot.
- **A "recorded day"** is a day on which a task was completed, a ritual was checked in, an open loop was taken care of, or a day reflection was written. It is a count, never a score, target or comparison.
- **The Year reflection is not on the Year view**, because PRD 12 says the Year holds exactly those three things. It will live in Looking Back with the other reflections. *(Flag: say if you would rather it sat on the Year view.)*
- **Goals page** (PRD 4, 10): the goals for the current year, month and week as violet cards, each with "+ Add a goal" and, when any exist, "Archived · N — Show" with Restore. Other periods are reached from the Year, Month and Week views.
- **Month and Week** show their goals as a slim violet strip above the grid (goal titles you can tap, plus "+ Add a goal"): "available as context" (PRD 12).
- **A goal is just a title and an optional description** (PRD 10): no progress, milestones or checklist, and no link to tasks. Tap one to edit; actions are Archive / Restore and Delete, each with Undo. A week goal's field says "Something I want this week to be about." Goal change history ("when changed significantly") is still not recorded.
- **Layout fixes** (2026-09-20): the calendar title slot is sized per view with the label centred above the title, and the Day is two independent columns (doing on the left: Priorities, Tasks, From yesterday; context on the right: On My Mind, Rituals, Reflection), which removes the empty half-width gap.

## Daybook brand, control sizes and the date picker
**Status: Confirmed** (2026-09-20) unless noted

- **The app is called Daybook** ("Keep what matters"), not Planner. The logo is recreated as SVG in the design system's own lemon and ink, with its own fonts: the notebook **app icon** (spiral rings and a D) sits beside the "DAYBOOK" name in the sidebar and the phone header, and is the favicon; the full wordmark logo is ready for the first-launch screen. The reference artwork's yellow is a little lighter than the design system's lemon; the design system's lemon is used, as asked. The browser tab title is "Daybook". The stored database keeps its internal name `personal-planner` so nobody's existing data is orphaned.
- **One control height:** default buttons, icon buttons and fields are all **44px** (the design system's touch size), so they line up next to each other. Small buttons stay 32px for compact actions inside cards. This replaces the design system's 40px buttons and 42px fields.
- **Custom date picker** in the design system's style (white sheet, ink border, heavy offset shadow, ink circle for today, yellow circle for the selected date) replaces the browser's dark native one everywhere a date is chosen: the calendar toolbar, Capture, task and open-loop details, and Move. Arrow keys move by day and week, Page Up / Page Down by month, Enter chooses, Escape closes only the calendar. Optional dates have a Clear button. **Time** still uses the browser's own picker. *(Assumed: say if you want that restyled too.)*
- **Calendar toolbar (Day, Week and Month alike):** the period title sits **between the Back and Next arrows** (`‹ September 2026 ›`), in a fixed-width slot so the arrows don't jump as the title changes. On the right: a **Show today** button that returns to the present (disabled while today is already the selected date) and the date picker. **Confirmed** (2026-09-20).
- **Today and the selected date:** today is no longer a yellow cell. **Today's number sits in an ink circle** and **the selected date's number in a yellow circle**, in the Month grid, the Week headers and the date picker. If they are the same date, the yellow circle shows. This replaces the design system's yellow "today" cell. **Confirmed** (2026-09-20).

## Reflections (Slice 6) and Capture placement
**Status: Assumed** unless noted

- **No separate Capture button** on the Day (or elsewhere on the page): Capture is only the sidebar button on desktop and the floating button on phones. **Confirmed** (2026-09-20). To keep PRD 7's "created from a Day context", opening Capture while viewing a Day gives a Task that Day's date (the tab still defaults to Open Loop).
- **Month view:** hovering (or keyboard-focusing) a day shows a small **+** in its top-right corner that opens Capture on the Task tab with that date, so tasks can be added from the overview. On touch devices wider than a phone the + is always visible; on phones the cell stays a plain tap target that opens the Day. **Confirmed** (2026-09-20).
- **Reflections** live at the bottom of the **Day**, **Week** and **Month** screens (the Year reflection will live in Looking Back). Until the user writes, it is only a quiet "REFLECTION / OPTIONAL + Add something" (PRD 18).
- **Writing** happens on a lined sheet and **saves as you type** (about half a second after you stop, and when leaving the field), with a small "Saved". An abandoned empty editor creates no record, and clearing all the text removes the record. **Delete** removes it permanently with an Undo toast.
- **Prompts** ("What moved forward today?", "Today counts because…", "What do I want to carry into tomorrow?") are optional buttons on the Day only; tapping one starts the text. Week and Month have no prompts (the PRD lists none).

## Task and open-loop actions (Slice 5)
**Status: Assumed**

- **Tap a title** on the Day to open its details: a modal on desktop, a bottom sheet on phones. Tasks: edit title, note, date, time and priority (P1–P5, or the task's current level), plus actions. Open loops: edit title, note and an optional date, plus actions.
- **Task actions:** *Complete today* (date becomes today; not marked done; only for a dated task from another day), *No longer relevant*, *Delete*, and *Reopen* for a completed task. Each shows a toast with Undo. Moving a task to any other date is just editing its Date, or the Move dialog on the Week (its click alternative to dragging).
- **From yesterday:** on **today's Day only**, unfinished dated tasks from earlier days appear in a quiet blue card, "From yesterday" for the previous day and "From earlier" (with each task's date) for older ones. Nothing changes by being listed. Each row has the tick (done on its original date) and a visible **Complete today** button; the rest is behind the title. No "overdue" wording, and no "keep here" action (PRD 7).
- **The gentle priority question** appears in the edit view only when a priority is newly set or changed, never on a move or Complete today (PRD 7).
- **Open loop actions:** *Taken care of*, *Turn into a task*, *Delete* (all with Undo). A loop turned into a task keeps its title, note and date; with no date of its own it lands on the Day it was opened from, so it doesn't start recurring every day by accident. Undo turns it back into an open loop.

## Calendar and Day view
**Status: Assumed**

- **Where things live:** opening the app lands on **today's Day** (PRD 25). The **Calendar** link opens the **Month**. Routes are `/calendar/{day|week|month}/{date}`. The Day / Week / Month switch keeps the focused date, and a date picker, previous / next and a Today button sit above each view.
- **Month and Week previews** show dated tasks and dated open loops only. **Undated tasks are left out** of them (they would repeat in every cell); they live on the Day. Order in a cell: priorities (lemon, with "P1" text), tasks (coral), open loops (peach). Done tasks stay on their date, checked and struck through, after unfinished ones. Colour is never the only signal.
- **Density:** Month shows 3 items then "+N more"; Week shows 5. On phones the Month cell shows only tiny markers, never titles. The 7-column Week is desktop only (981px and up); below that Week is a vertical list of days.
- **Week actions:** empty space in a day (or "Add a task" on phones) opens Capture on the Task tab with that date filled in. On desktop a task can be **dragged to another day** (a toast offers Undo), and every task also has a **Move** button that opens "Choose a date", the click alternative to dragging. Only unfinished tasks move. On phones, tapping a task on the Day opens its details, where the Date can be changed.
- **Day view, top to bottom:** Priorities (always all visible), Tasks (remaining visible; "Completed · N — Show" discloses the rest; empty shows "+ Add a task"), On My Mind (all open loops, newest first: the first 3 then "+N more — Show"; ticking one marks it Taken care of with an Undo toast), Rituals (those due that day, first 2 then "+N more — Show"; ticking toggles the check-in; each shows a factual "N recorded days"). Empty sections are simply absent.
- **Card heading icons sit beside the heading** (before the title), not on the right where they looked clickable. This departs from the design system's sample on purpose. **Confirmed** (2026-09-20).
- **Notes show on the Day** under the task or open loop title (first three lines; the full note is in the edit view). **Confirmed** (2026-09-20). Week and Month cards stay title-only.
- **Completed priorities sink to the bottom** of the Priorities card, still visible and checked (PRD 7). Completed tasks in the Tasks card sit behind "Completed · N — Show" at the bottom, per PRD 12. **Confirmed** (2026-09-20).
- The Day's "N remaining · N completed" counts priorities and tasks together.
- **Live:** screens update the moment data is saved, through a domain `watch` query, with no reload.
- **Not built yet:** the Year reflection (planned for Looking Back).
- **Wording:** the toolbar shows "Month" / "Week" above the period title, the reverse of the design system's sample, because the period is the useful heading.

## Capture (Slice 3)
**Status: Assumed** unless noted

- **Open Loop** (default): only a title. "Add a note" reveals a note field. The optional date is set later, when editing.
- **Task:** title, date, time, priority (None, P1–P5) and an optional note. Only these fields appear for a Task.
- **Ritual:** name and frequency (Daily, Weekly, Weekends, Custom weekdays). Custom reveals a weekday picker (Sunday first) and needs at least one day.
- **No date means every day.** Capture leaves the Task date empty, and the field says: "Leave empty to show it every day until it's done." (PRD 7 defaults the date to today only for dated flows, which the Day and Week screens will provide.)
- **Priority choices are P1–P5** (the PRD's recommended range). The domain accepts higher levels; the UI offers none yet.
- **The gentle question** ("You've chosen five priorities already. Add this anyway?", with Go back and Add anyway) appears only when saving a Task with a priority into a day that already has five. An undated priority task counts against today. It never blocks.
- **Save is disabled** until the form is valid; Enter saves a valid form. After saving, the panel closes and a short factual toast confirms ("Open loop saved"). Toasts last six seconds and will carry Undo where an action is destructive.
- **Errors** are calm: the domain's message for invalid input, otherwise "We couldn't save that. Nothing has been changed."

## Weeks start on Sunday
**Status: Confirmed** (2026-09-20)

Weeks run Sunday to Saturday everywhere (week goals, week reflections, the Week view). The design system's sample week board shows Mon–Sun, and its month grid starts on Sunday; the sample data is illustrative, so the user's decision wins.

## App shell (Slice 2)
**Status: Assumed** unless noted

- Routes: `/calendar` (home), `/looking-back`, `/goals`, `/search`, `/settings`, plus `/gallery`. Each screen is a titled placeholder until its slice.
- **Desktop (981px and up):** persistent sidebar with + Capture on top, Calendar / Looking Back / Goals, and Search (with the Ctrl K / ⌘ K hint) and Settings at the bottom.
- **Phones and tablets (980px and down):** header with the brand and a Search button, a bottom nav (Calendar / Looking Back / Goals / Settings), and the floating + Capture button at the bottom right (56px, above the bottom nav). Tablets use the phone layout for now; the design system's "compact top/side nav" for 681–980px is not built.
- **Capture** opens as a centred modal on desktop and a bottom sheet on phones and tablets, with the input focused. Saving is wired in the Capture slice (below).
- **Search** for now is its own screen. Ctrl/⌘ + K goes to it (ignored while the capture modal is open). The design system's desktop modal/command surface arrives with the Search slice.
- Breakpoints stay literal because CSS cannot use variables in media queries: 980px (desktop starts at 981px) and 680px.

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

### Undated tasks without a priority
**Status: Confirmed** (2026-09-20)
- They appear on the Day's Tasks section every day from their creation date, **below all other tasks**, and keep appearing day after day until finished or removed.
- Completing one shows it checked on the day it was completed, then it stops appearing. No Longer Relevant or deleting removes it everywhere. *(Same treatment as undated priority tasks; assumed.)*
- They are not date-bound, so they never appear in "From yesterday", and they are not priorities so they don't count toward the five.

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
