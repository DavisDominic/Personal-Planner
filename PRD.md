**PERSONAL PLANNER**

**V1 Product Requirements Document**

**SINGLE SOURCE OF TRUTH  •  V1 FROZEN**

Purpose: Canonical product, interaction, behavioral, and technical specification for the Personal Planner V1.

Status: V1 Frozen

Next sequence: Wireframes → Interaction Prototype → Visual Personality → Design System → Technical Implementation → V1 Build → Real-Life Testing → Iteration

# Contents

1. Product Definition
2. Product Principles
3. V1 Scope
4. Information Architecture
5. Core Domain Objects
6. Universal Capture
7. Tasks
8. Open Loops
9. Rituals
10. Goals
11. Reflections
12. Calendar
13. Looking Back
14. Search
15. Returning After Absence
16. Suggestions and Automation Boundaries
17. Interaction and State Specification
18. Empty States
19. Error Handling
20. Persistence and Data
21. Backup and Restore
22. PWA and Technical Architecture
23. Responsive Behavior
24. Accessibility and Motion
25. First Launch
26. Emotional / Behavioral Acceptance Tests
27. Product Success Criteria
28. Explicitly Out of Scope
29. V1 Final Product Contract

# 1. Product Definition

The Personal Planner is a personal external-brain and daily planning system. Its purpose is to reduce the mental effort of remembering, organizing, and reviewing life while preserving the user's control over what matters.

Core user outcome:

*“Help me turn what’s in my head into a manageable day, and help me see that my life is moving forward.”*

The planner is deliberately not a productivity-maximization system. It should remain useful when the user has little energy, does very little, disappears for days, or simply does not want to plan.

## What the product does

- Captures things the user does not want to forget.
- Turns intentions into Tasks when the user chooses.
- Records Rituals and their factual check-ins.
- Stores Goals as directional context.
- Allows optional reflections without requiring them.
- Shows historical evidence of what actually happened.
- Provides Year, Month, Week, and Day planning contexts.
- Preserves information locally and supports manual backup/restore.

## What the product does not do

- Judge the user's productivity.
- Decide what the user should care about.
- Automatically reprioritize or reschedule life.
- Punish absence or unfinished work.
- Create urgency merely to increase engagement.
- Require every feature to be used.
- Interpret missing data as failure, laziness, or a negative emotional state.

# 2. Product Principles

| **Principle** | **Requirement** |
| --- | --- |
| Low friction | Using the planner should require less effort than the mental effort it replaces. |
| Progressive disclosure | Show what matters now; expand only when the user wants more. |
| Capture before organization | The user should be able to quickly get something out of their head without first categorizing it. |
| User control | The system can suggest, but the user always approves meaningful changes. |
| No guilt mechanics | No overdue shame, broken-streak pressure, productivity scores, or punishment. |
| Evidence over evaluation | Show what happened. Do not turn records into judgments. |
| Every day can end well | A low-output day is still a valid day in the system. |
| Returning is success | After absence, the user can simply return without penalty. |
| Small actions count | A completed small task, check-in, or resolved thought is a valid record. |
| Reduce decisions | The planner should simplify choices rather than create additional planning work. |
| Absence is neutral | Missing data is not automatically a problem state. |
| Suggestions should be easy to ignore | Contextual suggestions must never become nagging. |

# 3. V1 Scope

## Included

- Year / Month / Week / Day calendar hierarchy.
- Tasks and task history.
- Open Loops and resolution history.
- Rituals and factual check-ins.
- Year, Month, and Week Goals.
- Day, Week, Month, and Year Reflections.
- Looking Back / history.
- Global search.
- Universal capture.
- Local-first persistence using IndexedDB.
- Manual JSON export/import backup.
- Responsive mobile and desktop layouts.
- PWA/offline-capable core experience.
- Accessible interaction patterns.

## V1 boundary

Behavior and product decisions are frozen. Visual personality is intentionally not specified here beyond functional requirements. Visual design should not be used to solve unresolved behavioral problems.

# 4. Information Architecture

| **Primary area** | **Purpose** |
| --- | --- |
| Today | Where I am / where I’m going. The navigation item is labelled “Today” and opens today’s Day, the doing context; Week, Month and Year are reached from there. |
| Looking Back | What happened |
| Goals | What direction I’m choosing |
| + Capture | Quickly add something without navigating first |
| Search | Retrieve information across the planner |
| Settings | Backup, restore, application preferences, and related controls |

## Calendar hierarchy

Year → Month → Week → Day

Future dates are primarily planning contexts. Today is the primary doing context. Past dates are editable records/history. The underlying day model remains the same.

# 5. Core Domain Objects

Primary domain objects:

- Task
- Open Loop
- Ritual
- Ritual Check-in
- Goal
- Reflection

Infrastructure objects:

- Application Settings
- Backup Metadata

Derived views—not primary stored objects:

- Calendar
- History
- Search
- Priority
- Suggestion

## Task

id

title (required)

note?

date?

time?

priority

status

createdAt

updatedAt

completedAt?

## Open Loop

id

title (required)

note?

date?

status

createdAt

updatedAt

resolvedAt?

## Ritual

id

name (required)

frequency

createdAt

archivedAt?

## Ritual Check-in

id

ritualId

date

completedAt

## Goal

id

title

description?

scope

period

status

createdAt

updatedAt

archivedAt?

## Reflection

id

periodType

periodStart

periodEnd

content

createdAt

updatedAt

# 6. Universal Capture

The global + Capture control is available throughout the application.

Default capture type: Open Loop.

Capture types:

- Open Loop
- Task
- Ritual

## Mobile

- Bottom sheet or full-screen overlay.
- Keyboard opens automatically.
- Save returns to the current context.

## Desktop

- Modal or popover.
- Escape closes the overlay.
- Enter saves when the current form is valid.

## Progressive disclosure

Selecting Task reveals only relevant task options. Selecting Ritual reveals only relevant ritual creation fields. The user is never forced through an Open Loop → Task conversion funnel.

# 7. Tasks

Definition: A Task is something the user intends to do.

## Creation

- Can be created directly from + Capture.
- Can be created from a Day or Week context.
- Can be created by converting an Open Loop.
- Title is required.
- Date is optional, but defaults to today when created from a dated Task flow.
- Time, note, and priority are optional.

## Priority

Priority is a Task property, not a separate object. Priority is always user-chosen.

Recommended V1 range: 1–5. The system does not hard-block more than five.

If the user adds another priority after five, show a gentle confirmation: “You’ve chosen five priorities already. Add this anyway?”

The user may proceed. No automatic ranking occurs.

## Task state

Created → Active → Completed

Active → No Longer Relevant

Active → Deleted

## Completion

- Checkbox completion is one tap.
- Completed Tasks remain associated with their original date.
- completedAt is recorded.
- Completed Tasks remain available in history.
- Completed priorities remain visible on the Day screen with checkmarks.

## Unfinished tasks

An unfinished Task remains associated with its original date and is surfaced on the next day as “From yesterday.”

Available actions:

- Complete today
- Move to another date
- No longer relevant
- Delete

“Keep here” is deliberately not an action. There is no “overdue” language.

Complete today changes the Task's active date to today; it does not mark the Task completed.

Moving a Task immediately removes it from the old date and places it on the selected date.

The user may move a Task repeatedly without warnings or nagging.

## Delete

Delete permanently removes the Task from the current dataset. A short Undo action is available. There is no Trash system.

# 8. Open Loops

Definition: An Open Loop is anything the user does not want to forget. It can be as simple or developed as the user wants.

- Anything can be an Open Loop.
- No required category or type.
- No required date.
- No expiration.
- No requirement to become actionable.
- It may simply be resolved / taken care of.
- Optional notes are available only when needed.
- An optional date does not turn it into a Task.

## States

Created → Open → Taken Care Of

Open → Converted to Task

Open → Deleted

When an Open Loop is converted to a Task, the Open Loop ceases to exist as an Open Loop. There is no duplicate linked object.

## Day display

The Day screen shows a compact count and/or a few recent Open Loops, with “Show / +N more” for expansion. Expansion shows the full list.

The app does not decide which Open Loop deserves attention.

## Large brain dumps

The system must remain usable with hundreds of Open Loops. Search is therefore a first-class retrieval mechanism.

# 9. Rituals

Definition: A Ritual is something intentionally becoming part of life.

Rituals are not conventional streak trackers.

## Frequency

- Daily
- Weekly
- Weekends
- Custom selected weekdays

V1 is binary: done / not done.

## Check-ins

- One-tap check-in directly on the Day screen.
- Second tap toggles the check-in off.
- Each check-in is stored as a separate record.
- Historical check-ins are never rewritten by later frequency changes.

## Lapse behavior

If a Ritual is not done for days or months, nothing punitive happens. There is no streak reset, shame message, or escalating reminder.

Factual information such as “Smoke-free — 22 recorded days” may be shown. A lapse does not erase previous progress.

## Archive

Rituals can be archived. Historical check-ins remain. Archived Rituals can be retrieved and restored.

# 10. Goals

Goals are separate from Tasks and Rituals. They provide directional context rather than project management.

Supported scopes:

- Year
- Month
- Week

Weekly Goals are intentionally lightweight: “Something I want this week to be about.”

## Goals can contain

- Title
- Optional description/notes
- Scope and period
- Status
- Created/updated timestamps
- Archive state
- History when changed significantly

## Goal boundaries

- No milestones.
- No checklist.
- No progress percentage.
- No automatic Task generation.
- No automatic relationship between Tasks and Goals.
- No claim that a Task contributes to a Goal unless a future feature explicitly establishes such a relationship.

# 11. Reflections

Reflection is a first-class but optional record.

Scopes: Day, Week, Month, Year.

V1 allows one editable Reflection per period.

## Optional prompts

- What moved forward today?
- Today counts because…
- What do I want to carry into tomorrow?

Prompts are optional. The user may write freely.

The app must not manufacture positivity from insufficient information. A reflection can say the user did very little.

An empty editor that is abandoned creates no record.

Delete permanently removes the current record, with a short Undo.

# 12. Calendar

## Year View

The Year view is an orientation and overview screen, not a detailed planning surface.

It contains exactly three conceptual things:

1. The 12 months.
1. A lightweight indication of recorded activity.
1. Year Goals.

It does not display individual Tasks, Open Loops, or Rituals.

## Month View

- Calendar grid.
- Compact previews of recorded/planned items.
- Progressive disclosure to Day view.
- Month Goals are available as context.

## Week View

- Desktop: Google Calendar-like 7-column layout.
- Mobile: vertical seven-day list.
- Priorities first in previews.
- Approximately 3–5 items per day in compact view.
- “+N more” opens the full Day.
- Empty space in a day can create a Task with the date prefilled.
- Desktop supports drag-and-drop movement of Tasks between days.
- Week Goals are available as lightweight context.

## Day View

Day is the detailed working screen.

1. Priorities — all visible, never collapsed.
1. Tasks — remaining visible; completed progressively disclosed.
1. On My Mind / Open Loops — progressively disclosed.
1. Rituals — progressively disclosed.
1. Reflection — lightweight and optional at the bottom.
1. Contextual information — progressively disclosed.

Example structure:

Today

⭐ Priorities

☐ Finish presentation

☐ Send invoice

✓ Work on aiRA

Tasks

Remaining · 3

☐ Reply to Jack

☐ Book dentist

☐ …

Completed · 3 — Show

On My Mind · 7 — Show

Rituals

✓ Smoke-free

✓ Walk

+2 more

Reflection

+ Add something

## Date navigation

- Previous / next date
- Date picker
- Today shortcut
- Tapping a date opens its Day view

There is no separate “Tomorrow mode.”

# 13. Looking Back

Looking Back is an evidence/timeline system, not a productivity score.

Scopes:

- Recent
- Week
- Month
- Year
- All Time

## Categories

- Things I Did — completed Tasks
- Things I Kept Doing — Ritual check-ins
- Taken care of — resolved Open Loops
- Reflections
- Timeline

## Factual information that may be shown

- Tasks completed
- Priorities completed
- Open Loops taken care of
- Ritual check-ins
- Reflection entries
- Days with recorded items
- Goal notes/history

No productivity score, good/bad day label, ranking, or inferred emotional interpretation is permitted.

“Your record begins [date]” may identify the earliest retained historical record.

History is a derived view, not a separate primary data object.

# 14. Search

Search must work across:

- Tasks
- Open Loops
- Taken care of items
- Rituals and ritual history
- Goals
- Reflections
- Notes/content

Filters:

- Type
- Date
- Time scope

Example: search “passport” and choose All time.

## V1 ranking

1. Exact title match
1. Title match
1. Note/content match
1. More recent records

No AI search ranking in V1.

# 15. Returning After Absence

The planner never sends push notifications.

For 0–2 days of absence, no special treatment is required.

For 3+ days, show a lightweight Welcome Back state:

Welcome back.

Today is …

A few things are waiting for you.

3 unfinished tasks

6 Open Loops

[Review] [Start today]

For 30+ days, the same gentle pattern applies. There is no escalation.

Review presents unfinished Tasks individually with actions. The user can leave review at any point. Backlog cleanup never blocks starting today.

Never show “you missed X days,” “falling behind,” or equivalent guilt framing.

# 16. Suggestions and Automation Boundaries

Suggestions are contextual and optional.

## The system may

- Surface unfinished Tasks.
- Show how many things are waiting.
- Show factual Ritual progress.
- Suggest actions when the user explicitly opens an item.
- Show useful contextual information.
- Offer a review after absence.
- Show factual backup recency.

## The system must not

- Automatically reprioritize.
- Automatically reschedule.
- Automatically convert Open Loops.
- Decide what the user should care about.
- Repeatedly nag the same Open Loop.
- Manufacture urgency.
- Send push notifications.
- Create AI-generated schedules.
- Interpret inactivity as a personal failure.

Rule: A suggestion should be easy to ignore.

# 17. Interaction and State Specification

## Task

Created → Active → Completed / No Longer Relevant / Deleted

## Open Loop

Created → Open → Taken Care Of / Converted to Task / Deleted

## Ritual

Created → Active → Archived

Check-ins are independent historical records.

## Goal

Created → Active → Edited / Archived / Discarded

## Reflection

Created → Existing → Edited / Deleted

## Universal interaction rules

- Save changes immediately when practical.
- Use short Undo affordances for destructive actions.
- Do not force confirmation for routine reversible actions.
- Use calm factual language for errors.
- Do not rely on hover for essential functionality.

# 18. Empty States

Empty is valid. The interface should not manufacture filler or urgency.

| **Area** | **Empty behavior** |
| --- | --- |
| Priorities | Section may be absent; no warning. |
| Tasks | “Tasks  + Add a task” |
| Open Loops | Section may be absent. |
| Rituals | Section may be absent. |
| Goals | “Goals  + Add a goal” |
| Reflection | “Reflection  + Add something” |

# 19. Error Handling

Errors should be calm, specific, and preserve the user's previous valid state where possible.

“We couldn't save that change. Your previous version is still here.”

“This backup couldn't be imported. Your current data hasn't been changed.”

Avoid generic alarming language. Import failures must never partially replace current data.

# 20. Persistence and Data

V1 is local-first.

- No account required.
- No backend required.
- No cloud sync.
- Use IndexedDB rather than plain localStorage for primary persistence.
- Core features work offline once the app is loaded/installed.

Core domain operations should be implemented independently of UI components:

createTask()

completeTask()

moveTask()

deleteTask()

resolveOpenLoop()

convertOpenLoopToTask()

checkRitual()

archiveRitual()

createGoal()

saveReflection()

UI should not directly manipulate raw database records throughout the application.

# 21. Backup and Restore

Manual Export/Import JSON is the V1 multi-device recovery mechanism.

A backup contains all relevant current data:

- Tasks
- Open Loops
- Rituals
- Ritual check-ins
- Goals
- Goal history
- Reflections
- Relevant settings

## Backup metadata

schemaVersion

exportedAt

applicationVersion

data

## Import semantics

- Validate the entire backup before replacing current data.
- Import is replace, not merge.
- If invalid or corrupt, current data remains unchanged.
- Deleted records are absent from future exports.
- Older backup snapshots may still contain records that were later deleted.

Settings may show “Last backup” and a non-intrusive reminder after a long interval. No notification is sent.

Export should warn that the file contains private planner data.

Custom encryption is not a V1 requirement.

# 22. PWA and Technical Architecture

V1 should be a Progressive Web App.

Responsive Web App

        ↓

       PWA

        ↓

   Client App State

        ↓

    Domain Logic

        ↓

     IndexedDB

- Installable to supported mobile and desktop environments.
- Standalone launch where supported.
- Local persistence.
- Offline-capable core experience.
- No backend/API required for core functionality.

Core offline functionality includes Calendar, Tasks, Open Loops, Rituals, Goals, Reflections, History, Search, and Export/Import.

# 23. Responsive Behavior

## Mobile

- Mobile-first.
- Thumb-friendly interaction.
- Navigation in a drawer, opened from a menu button at the top left of the header.
- Capture as bottom sheet/full-screen overlay.
- Vertical Week.
- No hover dependence.
- Fast task completion and Ritual check-in.

## Desktop

- Sidebar navigation.
- 7-column Week.
- Drag-and-drop Task movement.
- Wider History, Search, and Goals surfaces.
- Modal/popover capture.

# 24. Accessibility and Motion

- Keyboard navigation.
- Visible focus states.
- Semantic controls.
- Accessible names for icon-only controls.
- Adequate touch targets.
- Sufficient contrast.
- Never use color as the only indicator of meaning.
- Screen-reader labels for important controls.

## Motion

- Small task-completion transition.
- Immediate Ritual confirmation.
- Smooth expand/collapse.
- Fast capture.
- Delete removal with Undo.
- No gamified celebration.

# 25. First Launch

No onboarding questionnaire and no setup wizard.

Your planner

A place to keep what's on your mind, plan your days,

and see what actually happened.

[Start]

Start leads directly to Today.

# 26. Emotional / Behavioral Acceptance Tests

| **Scenario** | **Expected behavior** |
| --- | --- |
| Bad day | No guilt, score, forced reflection, or requirement to manufacture productivity. |
| Productive day | Accurate record without exaggerated praise. |
| Forgotten Task | No overdue language; contextual review only. |
| Long absence | Welcome back without punishment or streak reset. |
| Huge brain dump | Hundreds of Open Loops remain searchable and manageable. |
| Doesn't want to plan | + → Open Loop → type → save is enough to use the app. |

Additional test: If the user wants evidence of progress, Looking Back must show factual records without interpreting them.

# 27. Product Success Criteria

Success is not measured by:

- More sessions per day
- More Tasks created
- Longer streaks
- More screen time
- Higher productivity scores

Success is measured qualitatively and behaviorally by:

- Low capture friction.
- Continuity after absence.
- Easy retrieval of past information.
- Objective evidence of activity.
- Low planner burden.
- Usability on difficult or low-output days.

A successful planner may mean the user spends very little time inside it because it quietly does its job.

# 28. Explicitly Out of Scope

- AI-generated schedules
- AI life coaching
- Automatic planning
- Automatic reprioritization
- Productivity score
- Mood / energy tracking
- Streak gamification
- XP, badges, leaderboards
- Push notifications
- Email reminders
- Google Calendar or external calendar integration
- Account system
- Cloud sync
- Collaboration / social features
- Projects
- Subtasks
- Milestones
- Dependencies
- Recurring Tasks
- Separate Event / Appointment object
- Complex tagging
- Automatic Goal relationships
- Automatic Open Loop classification
- Automatic Task rescheduling
- Sophisticated AI behavioral recommendations

# 29. V1 Final Product Contract

**The user decides.**

**The app remembers.**

**The app records.**

**The app shows what happened.**

**The app does not judge.**

**The app does not punish absence.**

**The app does not manufacture urgency.**

**The app does not require productivity to justify its existence.**

**Small actions count as records.**

**Nothing is required merely because a feature exists.**

**The planner reduces decisions rather than creating them.**

**The planner should remain useful on the user's worst days, not just their most productive ones.**

# V1 Freeze / Design Handoff

This document is the canonical V1 source of truth. When a wireframe, prototype, or implementation conflicts with this document, the conflict should be resolved against the requirements here rather than silently changing product behavior.

The next design phase is wireframing. Visual personality, typography, color, illustration, and aesthetic direction should be decided only after the core flows and information hierarchy have been tested.

Wireframing workflow: FigJam for flows/state maps → Figma for low-fidelity wireframes → Figma prototype for interaction testing → visual design → implementation.
