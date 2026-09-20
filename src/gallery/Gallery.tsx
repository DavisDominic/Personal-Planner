import { useState } from 'react'
import type { ReactNode } from 'react'
import {
  Archive, Blocks, Bookmark, Brain, Calendar, CalendarDays, Check, ChevronDown, ChevronLeft, ChevronRight, CircleCheck,
  CircleHelp, CirclePlus, Clock3, Compass, Component, Download, FileText, Filter, History, LayoutGrid, LibraryBig, ListChecks,
  ListOrdered, MessageSquare, Move, MousePointer2, NotebookPen, Palette, Plus, Repeat, Save, Search, Settings, Shapes, Square,
  SquarePen, Sun, Target, TextCursorInput, Trash2, Type, Undo2, Upload, X,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Button, IconButton } from '../components/Button/Button'
import { Field, Select, TextArea } from '../components/Field/Field'
import { Card, CardHead, CardKicker, CardRule } from '../components/Card/Card'
import { TaskRow } from '../components/Task/Task'
import { RitualGrid } from '../components/Ritual/Ritual'
import { NoteLines, OpenLoopLine, OpenLoopList, ReflectionSheet } from '../components/Paper/Paper'
import { CalendarToolbar, MonthGrid, WeekGrid, YearGrid } from '../components/Calendar/Calendar'
import type { MonthCell, WeekDay, YearMonth } from '../components/Calendar/Calendar'
import { Widget, WidgetGrid } from '../components/Widget/Widget'
import { MobileNav, ProductNav } from '../components/Nav/Nav'
import { CapturePanel } from '../components/Capture/Capture'
import { AppIcon } from '../components/Logo/Logo'
import type { CaptureTab } from '../components/Capture/captureTabs'
import { FilterChips, SearchBar } from '../components/Search/Search'
import { InlineMessage, Toast } from '../components/Feedback/Feedback'
import { Dialog, Sheet } from '../components/Overlay/Overlay'
import { EmptyState, Skeleton } from '../components/Empty/Empty'
import { DataTable } from '../components/Table/Table'
import { cx } from '../lib/cx'
import t from '../styles/typography.module.css'
import g from './Gallery.module.css'

/* ------------------------------------------------------------------ helpers */

function Section({ id, n, title, note, children }: { id: string; n: string; title: string; note: string; children: ReactNode }) {
  return (
    <section className={g.section} id={id}>
      <div className={g.sectionHead}>
        <div className={g.sectionTitle}>
          {n} / {title}
        </div>
        <p className={g.sectionNote}>{note}</p>
      </div>
      {children}
    </section>
  )
}

const Board = ({ className, children }: { className?: string; children: ReactNode }) => (
  <div className={cx(g.board, className)}>{children}</div>
)

/** Reads the live token value, so the gallery can show it without repeating it. */
function Swatch({ token, name, dark }: { token: string; name: string; dark?: boolean }) {
  const [value] = useState(() => getComputedStyle(document.documentElement).getPropertyValue(`--${token}`).trim())
  return (
    <div className={cx(g.swatch, dark ? g.dark : g.light)} style={{ background: `var(--${token})` }}>
      <div className={g.swatchName}>{name}</div>
      <div className={g.swatchCode}>{value}</div>
    </div>
  )
}

function Semantic({ token, label, caption }: { token: string; label: string; caption: string }) {
  return (
    <div className={g.semantic}>
      <span className={g.semanticDot} style={{ background: `var(--${token})` }} />
      <div>
        <b>{label}</b>
        <div className={t.typeCaption}>{caption}</div>
      </div>
    </div>
  )
}

function CaptureDemo() {
  const [tab, setTab] = useState<CaptureTab>('open-loop')
  return (
    <CapturePanel tab={tab} onTabChange={setTab} canSave onSubmit={() => {}}>
      <Field label="What's on your mind?" defaultValue="Figure out career direction" />
    </CapturePanel>
  )
}

/* --------------------------------------------------------------- sample data */

const SWATCHES: [string, string, boolean?][] = [
  ['lemon', 'Lemon'], ['amber', 'Amber'], ['coral', 'Coral'], ['blush', 'Blush'], ['rose', 'Rose'], ['violet', 'Violet'],
  ['periwinkle', 'Periwinkle'], ['sky', 'Sky'], ['mint', 'Mint'], ['sage', 'Sage'], ['olive', 'Olive'], ['peach', 'Peach'],
  ['paper', 'Paper'], ['paper-deep', 'Paper Deep'], ['ink', 'Ink', true], ['ink-muted', 'Ink Muted'],
]

const ICON_GROUPS: { title: string; icons: [LucideIcon, string][] }[] = [
  { title: 'Navigation & calendar', icons: [[CalendarDays, 'calendar-days'], [Calendar, 'calendar'], [ChevronLeft, 'chevron-left'], [ChevronRight, 'chevron-right'], [ChevronDown, 'chevron-down'], [Sun, 'today / day']] },
  { title: 'Capture & actions', icons: [[Plus, 'plus'], [CirclePlus, 'plus-circle'], [SquarePen, 'square-pen'], [Check, 'check'], [CircleCheck, 'circle-check'], [Trash2, 'trash-2']] },
  { title: 'Information & retrieval', icons: [[Search, 'search'], [Filter, 'filter'], [Archive, 'archive'], [History, 'history'], [Bookmark, 'bookmark'], [FileText, 'file-text']] },
  { title: 'Planner-specific language', icons: [[Brain, 'open loops / mind'], [Target, 'goals'], [Repeat, 'rituals'], [NotebookPen, 'reflection'], [ListChecks, 'tasks'], [Clock3, 'time']] },
  { title: 'System', icons: [[Settings, 'settings'], [Download, 'export'], [Upload, 'import'], [Save, 'save'], [Undo2, 'undo'], [CircleHelp, 'help']] },
]

const W = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const cell = (day: number, extra: Partial<MonthCell> = {}): MonthCell => ({ day, ...extra })
const MONTH: MonthCell[] = [
  cell(30, { muted: true }),
  cell(1, { items: [{ label: 'Portfolio', tone: 'sage' }] }),
  cell(2, { items: [{ label: 'Goal review', tone: 'violet' }] }),
  cell(3, { items: [{ label: 'Invoice', tone: 'coral' }, { label: 'Meeting', tone: 'sky' }] }),
  cell(4),
  cell(5, { items: [{ label: 'Passport', tone: 'peach' }] }),
  cell(6),
  cell(7, { items: [{ label: 'Walk', tone: 'sage' }] }),
  cell(8), cell(9),
  cell(10, { items: [{ label: 'Presentation', tone: 'coral' }] }),
  ...[11, 12, 13, 14, 15, 16, 17, 18].map((d) => cell(d)),
  cell(19, { today: true, items: [{ label: 'Finish deck', tone: 'coral' }, { label: 'Weekly goal', tone: 'violet' }] }),
  ...[20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30].map((d) => cell(d)),
  cell(1, { muted: true }), cell(2, { muted: true }), cell(3, { muted: true }),
]

const WEEK: WeekDay[] = [
  { dow: 'Mon', date: 21, tasks: [{ title: 'Portfolio', meta: 'priority', tone: 'sage' }] },
  { dow: 'Tue', date: 22, tasks: [{ title: 'Presentation', meta: '4:00 pm', tone: 'lemon' }, { title: 'Weekly goal', meta: 'context', tone: 'violet' }] },
  { dow: 'Wed', date: 23, tasks: [{ title: 'Send invoice', meta: 'task', tone: 'coral' }] },
  { dow: 'Thu', date: 24 },
  { dow: 'Fri', date: 25, tasks: [{ title: 'Review', meta: 'task', tone: 'sky' }] },
  { dow: 'Sat', date: 26 },
  { dow: 'Sun', date: 27, tasks: [{ title: 'Plan week', meta: 'goal', tone: 'violet' }] },
]

const YEAR: YearMonth[] = [
  { name: 'Jan', sub: 'Year goal', active: true, bars: 4 },
  { name: 'Feb', sub: '12 recorded days', bars: 3 },
  { name: 'Mar', sub: '8 recorded days', bars: 2 },
  { name: 'Apr', sub: '18 recorded days', bars: 5 },
]

const NAV_SIDEBAR: { label: string; items: [string, string, LucideIcon][] }[] = [
  { label: 'Foundations', items: [['overview', 'Overview', LibraryBig], ['color', 'Color', Palette], ['type', 'Typography', Type], ['layout', 'Layout', LayoutGrid], ['spacing', 'Spacing', Move]] },
  { label: 'Components', items: [['icons', 'Icon library', Shapes], ['buttons', 'Buttons', MousePointer2], ['inputs', 'Inputs', TextCursorInput], ['cards', 'Cards', Square], ['states', 'States', Component], ['feedback', 'Feedback', MessageSquare], ['overlays', 'Modal & sheet', Square], ['empty', 'Empty & loading', Square]] },
  { label: 'Planner patterns', items: [['navigation', 'Navigation', Compass], ['calendar', 'Calendar', CalendarDays], ['day', 'Day', Sun], ['widgets', 'Widgets', Blocks], ['capture', 'Capture', CirclePlus], ['history', 'Looking Back', Archive], ['search', 'Search', Search]] },
]

const PRODUCT_NAV = [
  { label: 'Today', icon: <Sun aria-hidden="true" /> },
  { label: 'Week', icon: <CalendarDays aria-hidden="true" /> },
  { label: 'Rituals', icon: <Repeat aria-hidden="true" /> },
  { label: 'On my mind', icon: <Brain aria-hidden="true" /> },
]
const MOBILE_NAV = [
  { label: 'Calendar', icon: <CalendarDays aria-hidden="true" /> },
  { label: 'Looking back', icon: <Archive aria-hidden="true" /> },
  { label: 'Goals', icon: <Target aria-hidden="true" /> },
  { label: 'Settings', icon: <Settings aria-hidden="true" /> },
]

const SIZES: [string, string, string][] = [
  ['04', '4px', 'Micro'], ['08', '8px', 'Tight'], ['12', '12px', 'Compact'], ['16', '16px', 'Default'],
  ['24', '24px', 'Component'], ['32', '32px', 'Layout'], ['48', '48px', 'Major'], ['64', '64px', 'Section'],
]

/* ------------------------------------------------------------------- page */

export default function Gallery() {
  const [active, setActive] = useState('overview')
  return (
    <div className={g.shell}>
      <aside className={g.sidebar}>
        <div className={g.brand}>
          <AppIcon />
          <span className={g.brandName}>Daybook</span>
          <span className={g.brandMeta}>V1.1</span>
        </div>
        {NAV_SIDEBAR.map((group) => (
          <div key={group.label}>
            <div className={g.navLabel}>{group.label}</div>
            <nav className={g.nav} aria-label={group.label}>
              {group.items.map(([id, label, Icon]) => (
                <a key={id} href={`#${id}`} className={id === active ? g.active : undefined} aria-current={id === active ? 'location' : undefined} onClick={() => setActive(id)}>
                  <Icon aria-hidden="true" />
                  {label}
                </a>
              ))}
            </nav>
          </div>
        ))}
      </aside>

      <main className={g.main}>
        <div className={g.content}>
          <header className={g.hero} id="overview">
            <div className={g.pageKicker}>Component gallery — rendered in code</div>
            <h1>
              Daybook <span>Design System</span>
            </h1>
            <p>
              Slice 0. Every component below is built as React + CSS Modules from <code>tokens.css</code>. Compare it side by side with the original
              design system file.
            </p>
            <div className={g.heroPills}>
              <span className={cx(g.pill, g.lemon)}>V1.1 Expanded</span>
              <span className={cx(g.pill, g.coral)}>Stationery / Archive</span>
              <span className={cx(g.pill, g.sage)}>Mobile First</span>
              <span className={cx(g.pill, g.violet)}>Lucide Icons</span>
              <span className={cx(g.pill, g.sky)}>No Guilt Mechanics</span>
            </div>
          </header>

          {/* 01 COLOR */}
          <Section id="color" n="01" title="Color tokens" note="The references use color as a filing system. Keep the palette saturated, flat and physical-looking, with dark ink as the constant.">
            <Board>
              <div className={g.grid6}>
                {SWATCHES.map(([token, name, dark]) => (
                  <Swatch key={token} token={token} name={name} dark={dark} />
                ))}
              </div>
              <div className={g.mt6}>
                <div className={t.typeLabel}>Semantic mapping</div>
                <div className={cx(g.grid3, g.mt3)}>
                  <Semantic token="lemon" label="Priority" caption="Yellow / attention" />
                  <Semantic token="coral" label="Tasks" caption="Coral / action" />
                  <Semantic token="peach" label="Open Loops" caption="Peach / on my mind" />
                  <Semantic token="sage" label="Rituals" caption="Sage / practice" />
                  <Semantic token="violet" label="Goals" caption="Violet / direction" />
                  <Semantic token="periwinkle" label="History" caption="Blue / archive" />
                </div>
              </div>
            </Board>
          </Section>

          {/* 02 TYPE */}
          <Section id="type" n="02" title="Typography" note="Space Grotesk is the functional display voice; Space Mono supplies the tiny archival labels that make the UI feel like printed stationery.">
            <Board>
              <div className={g.grid2}>
                <div>
                  <div className={t.typeCaption}>Display / Space Grotesk 56–72 / 700</div>
                  <div className={cx(t.typeDisplay, g.mt2)}>Wednesday</div>
                  <div className={cx(t.typeCaption, g.mt3)}>Screen title / year / major archive labels</div>
                </div>
                <div>
                  <div className={t.typeCaption}>H1 / Space Grotesk 40 / 700</div>
                  <div className={cx(t.typeH1, g.mt2)}>Today's plan</div>
                  <div className={cx(t.typeCaption, g.mt3)}>Primary screen headings</div>
                </div>
                <div>
                  <div className={t.typeCaption}>H2 / Space Grotesk 28 / 700</div>
                  <div className={cx(t.typeH2, g.mt2)}>Looking Back</div>
                  <div className={cx(t.typeCaption, g.mt3)}>Section headings / archive groups</div>
                </div>
                <div>
                  <div className={t.typeCaption}>H3 / Space Grotesk 20 / 600</div>
                  <div className={cx(t.typeH3, g.mt2)}>Finish presentation</div>
                  <div className={cx(t.typeCaption, g.mt3)}>Cards / task titles / widgets</div>
                </div>
              </div>
              <div className={g.divider} />
              <div className={g.grid3}>
                <div>
                  <div className={t.typeCaption}>BODY / 15</div>
                  <p className={t.typeBody}>Turn what's in your head into a manageable day.</p>
                </div>
                <div>
                  <div className={t.typeCaption}>LABEL / MONO 10</div>
                  <div className={t.typeLabel}>REMAINING · 03</div>
                </div>
                <div>
                  <div className={t.typeCaption}>CAPTION / MONO 9</div>
                  <div className={t.typeCaption}>TODAY · 4:00 PM · PRIORITY</div>
                </div>
              </div>
              <div className={g.mt6}>
                <div className={t.typeLabel}>Typography rules</div>
                <ul className={g.rules}>
                  <li>Sentence case for user-authored content.</li>
                  <li>Uppercase + mono only for metadata, navigation labels and compact system language.</li>
                  <li>Never use all-caps for paragraphs.</li>
                  <li>Do not use handwritten or novelty fonts in core UI.</li>
                  <li>Use tight display tracking and comfortable body line-height.</li>
                </ul>
              </div>
            </Board>
          </Section>

          {/* 03 LAYOUT */}
          <Section id="layout" n="03" title="Layout system" note="The interface is a grid of paper modules, not a dashboard of floating cards. White space is structural.">
            <Board>
              <div className={t.typeLabel}>12-column desktop grid</div>
              <div className={cx(g.layoutDemo, g.mt3)}>
                <span className={g.col12}>12</span>
                <span className={g.col8}>8</span>
                <span className={g.col4}>4</span>
                <span className={g.col6}>6</span>
                <span className={g.col6}>6</span>
                <span className={g.col4}>4</span>
                <span className={g.col4}>4</span>
                <span className={g.col4}>4</span>
                <span className={g.col3}>3</span>
                <span className={g.col3}>3</span>
                <span className={g.col3}>3</span>
                <span className={g.col3}>3</span>
              </div>
              <div className={cx(g.mt6, g.grid3)}>
                <div><div className={g.measure}>Desktop gutter 24px</div><p className={t.typeSmall}>Primary content gaps use 16–24px.</p></div>
                <div><div className={g.measure}>Page padding 28px</div><p className={t.typeSmall}>Desktop content begins with a restrained margin.</p></div>
                <div><div className={g.measure}>Section gap 64px</div><p className={t.typeSmall}>Large section separation keeps the system editorial.</p></div>
              </div>
              <div className={cx(g.mt6, g.grid3)}>
                <Card kind="flat"><div className={t.typeLabel}>Mobile</div><div className={t.typeH3}>4px base / 12px page</div></Card>
                <Card kind="flat"><div className={t.typeLabel}>Tablet</div><div className={t.typeH3}>16px page / 16px gap</div></Card>
                <Card kind="flat"><div className={t.typeLabel}>Desktop</div><div className={t.typeH3}>28px page / 18–24px gap</div></Card>
              </div>
            </Board>
          </Section>

          {/* 04 SPACING */}
          <Section id="spacing" n="04" title="Spacing & geometry" note="The references feel designed because the small things align. Keep the rhythm systematic.">
            <Board>
              <div className={g.grid4}>
                {SIZES.map(([n, px, label]) => (
                  <Card key={n}>
                    <div className={t.typeLabel}>{n}</div>
                    <div className={t.typeH2}>{px}</div>
                    <div className={t.typeCaption}>{label}</div>
                  </Card>
                ))}
              </div>
              <div className={cx(g.mt6, g.grid4)}>
                {[[g.r0, '0 / square'], [g.r1, '2 / stationery'], [g.r3, '8 / sheet'], [g.rPill, 'pill / control']].map(([cls, label]) => (
                  <Card key={label}>
                    <div className={cx(g.radiusBlock, cls)} />
                    <div className={cx(t.typeCaption, g.mt2)}>{label}</div>
                  </Card>
                ))}
              </div>
            </Board>
          </Section>

          {/* 05 ICONS */}
          <Section id="icons" n="05" title="Icon library" note="Lucide is the canonical icon family. Simple outline icons; filled iconography is avoided except for explicit state indicators.">
            <Board>
              <div className={t.typeLabel}>Icon rules</div>
              <div className={cx(g.grid3, g.mt3)}>
                <Card><b>Default</b><p className={t.typeSmall}>20px in compact controls, 24px in standard controls, 32px in widgets.</p></Card>
                <Card><b>Stroke</b><p className={t.typeSmall}>1.75px default; 2px when an icon needs stronger legibility.</p></Card>
                <Card><b>Color</b><p className={t.typeSmall}>Ink by default. Accent only when the icon is part of a semantic colored module.</p></Card>
              </div>
              {ICON_GROUPS.map((group) => (
                <div key={group.title}>
                  <div className={cx(t.typeLabel, g.mt6)}>{group.title}</div>
                  <div className={cx(g.grid6, g.mt3)}>
                    {group.icons.map(([Icon, name]) => (
                      <div key={name} className={g.iconDemo}>
                        <Icon aria-hidden="true" />
                        <span>{name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              <div className={cx(t.typeLabel, g.mt6)}>Icon sizes</div>
              <div className={cx(g.stateRow, g.mt3)}>
                <div className={cx(g.iconDemo, g.iconSize16)}><Calendar aria-hidden="true" /><span>16</span></div>
                <div className={cx(g.iconDemo, g.iconSize20)}><Calendar aria-hidden="true" /><span>20</span></div>
                <div className={cx(g.iconDemo, g.iconSize24)}><Calendar aria-hidden="true" /><span>24</span></div>
                <div className={cx(g.iconDemo, g.iconSize32)}><Calendar aria-hidden="true" /><span>32</span></div>
              </div>
            </Board>
          </Section>

          {/* 06 BUTTONS */}
          <Section id="buttons" n="06" title="Buttons" note="Buttons borrow the reference's printed label aesthetic. The system deliberately avoids rounded SaaS “pill buttons” except for filters and tags.">
            <Board>
              <div className={t.typeLabel}>Primary / secondary / semantic</div>
              <div className={cx(g.row, g.mt3)}>
                <Button tone="primary" icon={<Plus aria-hidden="true" />}>Add task</Button>
                <Button>Edit</Button>
                <Button tone="coral">Save this</Button>
                <Button tone="lemon">Today</Button>
                <Button tone="violet">Plan</Button>
                <Button tone="sage">Check in</Button>
                <Button tone="ghost">Archive</Button>
                <Button disabled>Disabled</Button>
              </div>
              <div className={cx(t.typeLabel, g.mt6)}>Sizes</div>
              <div className={cx(g.row, g.center, g.mt3)}>
                <Button size="small">Small</Button>
                <Button>Default</Button>
                <Button size="large">Large</Button>
              </div>
              <div className={cx(t.typeLabel, g.mt6)}>Icon buttons</div>
              <div className={cx(g.row, g.mt3)}>
                <IconButton label="Search"><Search aria-hidden="true" /></IconButton>
                <IconButton label="Add" tone="fill"><Plus aria-hidden="true" /></IconButton>
                <IconButton label="Today" tone="lemon"><Sun aria-hidden="true" /></IconButton>
                <IconButton label="Close" round><X aria-hidden="true" /></IconButton>
              </div>
              <div className={cx(t.typeLabel, g.mt6)}>State contract</div>
              <DataTable
                head={['State', 'Visual', 'Behavior']}
                rows={[
                  ['Default', '1px ink border', 'Normal interaction.'],
                  ['Hover', '2px offset shadow / slight lift', 'Only on pointer devices.'],
                  ['Pressed', 'Returns to baseline / no shadow', 'Immediate tactile feedback.'],
                  ['Focus', '3px focus ring', 'Keyboard-visible and never color-only.'],
                  ['Disabled', 'Reduced opacity', 'No pointer interaction.'],
                  ['Loading', 'Preserve button width', 'Use spinner only for genuinely asynchronous operations.'],
                ]}
              />
            </Board>
          </Section>

          {/* 07 INPUTS */}
          <Section id="inputs" n="07" title="Form inputs" note="Forms should feel like filling a useful paper form, not completing an enterprise data-entry workflow.">
            <Board>
              <div className={g.grid2}>
                <Field label="Task" placeholder="What needs to happen…" help="Required." />
                <Field label="Date" defaultValue="20 Sep 2026" help="Optional for Open Loops." />
                <TextArea label="Note" placeholder="Add a note…" />
                <Select label="Frequency" defaultValue="Daily">
                  <option>Daily</option>
                  <option>Weekly</option>
                  <option>Weekends</option>
                  <option>Custom</option>
                </Select>
                <Field label="Error" defaultValue="Something went wrong" state="error" help="We couldn't save that change." />
                <Field label="Success" defaultValue="Saved" state="success" help="Your previous version is safe." />
              </div>
            </Board>
          </Section>

          {/* 08 CARDS */}
          <Section id="cards" n="08" title="Cards & paper objects" note="Color blocks are a core visual motif. They identify the kind of thing you are looking at, while dark linework keeps everything coherent.">
            <div className={g.grid3}>
              <Card as="article" kind="color" tone="coral">
                <CardHead kicker="TASKS" title="Task stack" icon={<ListChecks aria-hidden="true" />} />
                <CardRule />
                <TaskRow title="Review quarterly goals" onColor />
                <TaskRow title="Send proposal draft" defaultDone onColor />
              </Card>
              <Card as="article" kind="color" tone="violet">
                <CardHead kicker="IN THIS ORDER" title="Priorities" icon={<ListOrdered aria-hidden="true" />} />
                <OpenLoopList>
                  <OpenLoopLine><span>1</span><span className={g.grow}>Deep work block</span></OpenLoopLine>
                  <OpenLoopLine><span>2</span><span className={g.grow}>Team standup</span></OpenLoopLine>
                  <OpenLoopLine><span>3</span><span className={g.grow}>Inbox zero</span></OpenLoopLine>
                </OpenLoopList>
              </Card>
              <Card as="article" kind="color" tone="sage">
                <CardHead kicker="RITUAL" title="Habit" icon={<Repeat aria-hidden="true" />} />
                <RitualGrid label="Habit check-ins" initial={[true, true, false, false, false, false, false, true, true, true, false, false, false, false]} />
              </Card>
              <Card as="article">
                <CardKicker>A GOOD THOUGHT</CardKicker>
                <NoteLines />
              </Card>
              <Card as="article" kind="color" tone="blush">
                <CardKicker>MORE OF THIS</CardKicker>
                <OpenLoopList><OpenLoopLine /><OpenLoopLine /></OpenLoopList>
                <CardKicker className={g.mt5}>LESS OF THAT</CardKicker>
                <OpenLoopList><OpenLoopLine /><OpenLoopLine /></OpenLoopList>
              </Card>
              <Card as="article" kind="flat">
                <CardKicker>MY REMINDER TO—</CardKicker>
                <div className={g.mt4}><TextArea label="Reminder" placeholder="Write it down…" /></div>
                <div className={g.endRow}><Button tone="sage" size="small">Save this</Button></div>
              </Card>
            </div>
          </Section>

          {/* 09 STATES */}
          <Section id="states" n="09" title="Component states" note="The system needs explicit states before it needs polish. Every interactive component must have a default, hover, focus, pressed, disabled and relevant semantic state.">
            <Board>
              <div className={g.stateRow}>
                {[
                  ['Default', 'Ready', ''], ['Hover', 'Pointer', g.hover], ['Focus', 'Keyboard', g.focus], ['Pressed', 'Active', g.pressed],
                  ['Disabled', 'Unavailable', g.disabled], ['Error', 'Needs repair', g.error], ['Success', 'Saved', g.success],
                ].map(([name, desc, cls]) => (
                  <div key={name} className={cx(g.stateBox, cls)}>
                    <div className={g.stateName}>{name}</div>
                    <div className={g.stateDescription}>{desc}</div>
                  </div>
                ))}
              </div>
              <div className={cx(g.mt6, g.grid3)}>
                <Card><div className={t.typeLabel}>Task complete</div><p className={t.typeSmall}>Checkbox fills ink; title strikes through; record remains visible.</p></Card>
                <Card><div className={t.typeLabel}>Ritual check-in</div><p className={t.typeSmall}>Square fills ink; no celebration or streak animation.</p></Card>
                <Card><div className={t.typeLabel}>Open loop resolved</div><p className={t.typeSmall}>Moves to Taken care of; no destructive visual treatment.</p></Card>
              </div>
            </Board>
          </Section>

          {/* 10 NAVIGATION */}
          <Section id="navigation" n="10" title="Navigation" note="The product navigation is deliberately small. Calendar, Looking Back and Goals are the primary places; Search and Settings are utility layers.">
            <Board>
              <ProductNav brand="Daybook" items={PRODUCT_NAV} />
              <div className={cx(g.mt6, g.narrow)}>
                <div className={t.typeLabel}>Mobile navigation</div>
                <div className={g.mt3}><MobileNav items={MOBILE_NAV} /></div>
              </div>
              <p className={cx(t.typeCaption, g.mt5)}>
                Rituals and Open Loops are not required to become primary navigation destinations in V1. They can be reached contextually from Today and Search.
                This reference demonstrates component treatment rather than changing the frozen IA.
              </p>
            </Board>
          </Section>

          {/* 11 CALENDAR */}
          <Section id="calendar" n="11" title="Calendar system" note="Year = orientation. Month = context. Week = planning. Day = doing. The same visual language scales across all four.">
            <Board>
              <CalendarToolbar caption="September 2026" title="Month">
                <IconButton label="Previous month"><ChevronLeft aria-hidden="true" /></IconButton>
                <Button tone="lemon" size="small">Today</Button>
                <IconButton label="Next month"><ChevronRight aria-hidden="true" /></IconButton>
              </CalendarToolbar>
              <MonthGrid weekdays={W} cells={MONTH} />
              <div className={cx(t.typeLabel, g.mt8)}>Week / desktop</div>
              <div className={g.mt3}><WeekGrid days={WEEK} /></div>
              <div className={cx(t.typeLabel, g.mt8)}>Year / orientation</div>
              <div className={g.mt3}><YearGrid months={YEAR} /></div>
            </Board>
          </Section>

          {/* 12 DAY */}
          <Section id="day" n="12" title="Day screen" note="The Day is the main doing surface. It should look like one sheet of today's desk, not a KPI dashboard.">
            <Board>
              <div className={g.grid2}>
                <Card tone="lemon">
                  <CardKicker>IN THIS ORDER</CardKicker>
                  <TaskRow title="Finish presentation" meta="Priority" onColor />
                  <TaskRow title="Send invoice" meta="Priority" onColor />
                  <TaskRow title="Work on aiRA" defaultDone onColor />
                </Card>
                <Card>
                  <CardKicker>TODAY / WEDNESDAY</CardKicker>
                  <div className={cx(t.typeH2, g.mt2)}>20 Sep</div>
                  <div className={cx(t.typeSmall, g.mt1, g.muted)}>3 remaining · 3 completed</div>
                  <CardRule />
                  <Button tone="lemon">+ Capture</Button>
                </Card>
              </div>
              <div className={cx(g.mt5, g.grid2)}>
                <Card kind="color" tone="coral">
                  <CardHead kicker="TASKS" title="Remaining · 3" icon={<ListChecks aria-hidden="true" />} />
                  <TaskRow title="Reply to Jack" onColor />
                  <TaskRow title="Book dentist" onColor />
                  <TaskRow title="Review portfolio" onColor />
                </Card>
                <Card tone="peach">
                  <CardHead kicker="ON MY MIND" title="7 Open Loops" icon={<Brain aria-hidden="true" />} />
                  <OpenLoopList>
                    <OpenLoopLine>Figure out portfolio structure</OpenLoopLine>
                    <OpenLoopLine>Look into passport appointment</OpenLoopLine>
                    <OpenLoopLine>+</OpenLoopLine>
                  </OpenLoopList>
                </Card>
              </div>
              <div className={cx(g.mt5, g.grid2)}>
                <Card tone="sage">
                  <CardHead kicker="RITUALS" title="2 of 4 checked" icon={<Repeat aria-hidden="true" />} />
                  <RitualGrid label="Smoke-free check-ins" initial={[true, true, false, false, false, false, false]} />
                  <div className={cx(t.typeCaption, g.ink, g.mt3)}>Smoke-free · 22 recorded days</div>
                </Card>
                <ReflectionSheet prompt="REFLECTION / OPTIONAL">
                  <Button size="small" className={g.mt2}>Save reflection</Button>
                </ReflectionSheet>
              </div>
            </Board>
          </Section>

          {/* 13 WIDGETS */}
          <Section id="widgets" n="13" title="Planner widgets" note="Widgets are compact visual summaries. They show facts and context; they do not score the user.">
            <WidgetGrid>
              <Widget tone="lemon" kicker="Things I did" corner="THIS WEEK" number="18">completed Tasks recorded.</Widget>
              <Widget tone="sage" kicker="Smoke-free" corner="RITUAL" number="22">recorded days. Previous records remain.</Widget>
              <Widget tone="violet" kicker="This week" corner="GOAL" number="01">“Finish portfolio case study”</Widget>
              <Widget tone="sky" kicker="Taken care of" corner="MONTH" number="06">Open Loops resolved.</Widget>
              <Widget tone="coral" kicker="Waiting" corner="CONTEXT" number="03">unfinished Tasks from previous dates.</Widget>
              <Widget tone="paper" kicker="Record begins" corner="HISTORY" number="01 JAN" small>Earliest retained historical record.</Widget>
            </WidgetGrid>
          </Section>

          {/* 14 CAPTURE */}
          <Section id="capture" n="14" title="Universal capture" note="The default is Open Loop. The user can switch directly to Task or Ritual without passing through another object.">
            <Board className={g.boardCenter}>
              <CaptureDemo />
            </Board>
          </Section>

          {/* 15 LOOKING BACK */}
          <Section id="history" n="15" title="Looking Back" note="The archive uses blue/periwinkle as a quiet visual shift away from today's action colors.">
            <div className={g.grid2}>
              <Card kind="color" tone="periwinkle">
                <CardKicker>THINGS I DID</CardKicker>
                <div className={cx(t.typeH1, g.mt3)}>18</div>
                <div className={t.typeSmall}>completed Tasks</div>
                <CardRule />
                <TaskRow title="Work on aiRA" meta="Today · 10:40" defaultDone onColor />
                <TaskRow title="Send invoice" meta="Yesterday" defaultDone onColor />
              </Card>
              <Card>
                <CardKicker>TIMELINE</CardKicker>
                <div className={g.mt4}>
                  <TaskRow title="Work on aiRA" meta="Task completed · Today" leading={<CircleCheck aria-hidden="true" />} />
                  <TaskRow title="Passport application" meta="Taken care of · Yesterday" leading={<Check aria-hidden="true" />} />
                  <TaskRow title="Smoke-free" meta="Ritual check-in · Sep 18" leading={<Repeat aria-hidden="true" />} />
                </div>
              </Card>
            </div>
            <div className={g.mt4}>
              <FilterChips label="Time scope" items={['Recent', 'Week', 'Month', 'Year', 'All time']} />
            </div>
          </Section>

          {/* 16 SEARCH */}
          <Section id="search" n="16" title="Search & filters" note="Search is the safety net for a planner that can accumulate hundreds of Open Loops and years of history.">
            <Board>
              <SearchBar placeholder="Search tasks, Open Loops, goals, reflections…" hint="⌘ K" />
              <FilterChips label="Filters" items={['All', 'Tasks', 'Open loops', 'Rituals', 'Goals', 'Reflections', 'Past', 'Upcoming']} />
              <div className={cx(g.mt5, g.grid2)}>
                <Card>
                  <div className={t.typeLabel}>EXACT MATCH</div>
                  <div className={cx(t.typeH3, g.mt2)}>passport</div>
                  <div className={cx(t.typeSmall, g.mt2)}>Open Loop · Sep 5</div>
                </Card>
                <Card>
                  <div className={t.typeLabel}>CONTENT MATCH</div>
                  <div className={cx(t.typeH3, g.mt2)}>Book appointment</div>
                  <div className={cx(t.typeSmall, g.mt2)}>Task note contains “passport”</div>
                </Card>
              </div>
            </Board>
          </Section>

          {/* 17 FEEDBACK */}
          <Section id="feedback" n="17" title="Feedback & system messages" note="Feedback is factual. The app never turns a save event into praise or a missed action into shame.">
            <div className={g.grid2}>
              <div>
                <div className={t.typeLabel}>Toast / Undo</div>
                <div className={g.mt3}><Toast actionLabel="Undo">Task deleted</Toast></div>
              </div>
              <div>
                <div className={t.typeLabel}>Inline error</div>
                <div className={g.mt3}><InlineMessage kind="error">We couldn't save that change. Your previous version is still here.</InlineMessage></div>
              </div>
              <div>
                <div className={t.typeLabel}>Inline success</div>
                <div className={g.mt3}><InlineMessage kind="success">Saved. Your reflection is recorded.</InlineMessage></div>
              </div>
              <div>
                <div className={t.typeLabel}>Backup error</div>
                <div className={g.mt3}><InlineMessage kind="error">This backup couldn't be imported. Your current data hasn't been changed.</InlineMessage></div>
              </div>
            </div>
          </Section>

          {/* 18 OVERLAYS */}
          <Section id="overlays" n="18" title="Modal & sheet patterns" note="A temporary surface should look like a sheet placed over the planner, not a glossy application dialog.">
            <div className={g.grid2}>
              <div className={g.modalDemo}>
                <Dialog>
                  <div className={t.typeLabel}>Move task</div>
                  <h3>Choose a date</h3>
                  <p>The Task will leave its current date and appear on the selected date.</p>
                  <Field label="Date" defaultValue="24 Sep 2026" />
                  <div className={g.footRow}>
                    <Button tone="ghost">Cancel</Button>
                    <Button tone="primary">Move</Button>
                  </div>
                </Dialog>
              </div>
              <div className={cx(g.modalDemo, g.end)}>
                <Sheet>
                  <div className={t.typeLabel}>Capture</div>
                  <div className={cx(t.typeH2, g.mt2)}>What's on your mind?</div>
                  <div className={g.mt4}><Field label="Open loop" placeholder="Start typing…" /></div>
                  <div className={g.footRow}><Button tone="primary">Save</Button></div>
                </Sheet>
              </div>
            </div>
          </Section>

          {/* 19 EMPTY */}
          <Section id="empty" n="19" title="Empty, loading & fallback states" note="Empty is valid. The product should not invent motivational content just because a section has nothing in it.">
            <div className={g.grid3}>
              <EmptyState icon={<NotebookPen aria-hidden="true" />} title="Reflection" text="+ Add something" />
              <EmptyState icon={<Brain aria-hidden="true" />} title="On My Mind" text="Nothing here." />
              <Card>
                <div className={t.typeLabel}>LOADING</div>
                <div className={g.skeletons}>
                  <Skeleton width="medium" />
                  <Skeleton width="long" />
                  <Skeleton width="short" />
                </div>
              </Card>
            </div>
          </Section>

          <footer className={g.footer}>
            <span>Daybook Design System V1.1</span>
            <span>Stationery / archive / external brain</span>
            <span>V1 product behavior remains frozen</span>
          </footer>
        </div>
      </main>
    </div>
  )
}
