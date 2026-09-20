// Enforces CLAUDE.md rule 5: no hardcoded colors, sizes, fonts or durations outside the token files.
// Allowed literals: 0, %, unitless numbers, and @media breakpoints (CSS cannot use variables there).
import fs from 'node:fs'
import path from 'node:path'

const ROOT = 'src'
const TOKEN_FILES = new Set(['src/styles/tokens.css', 'src/styles/unmapped.css'])
const problems = []

// Every custom property that exists in the token files, so typos in var(--...) are caught.
const defined = new Set(
  [...TOKEN_FILES].flatMap((f) => [...fs.readFileSync(f, 'utf8').matchAll(/(--[\w-]+)\s*:/g)].map((m) => m[1])),
)

function* walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name).replaceAll('\\', '/')
    if (e.isDirectory()) yield* walk(p)
    else yield p
  }
}

const CSS_RULES = [
  [/#[0-9a-fA-F]{3,8}\b/, 'hex color'],
  [/\brgba?\(/, 'rgb/rgba color'],
  [/\bhsla?\(/, 'hsl color'],
  [/(?<![\w-])-?\d*\.?\d+(px|rem|em|ms)\b/, 'size/duration literal'],
  [/(?<![\w-])\d*\.?\d+s\b/, 'duration literal'],
  [/font-family\s*:\s*(?!var\()/, 'font-family literal'],
]
const TSX_RULES = [
  [/#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b(?![\w-])/, 'hex color'],
  [/\brgba?\(/, 'rgb/rgba color'],
]

for (const file of walk(ROOT)) {
  if (TOKEN_FILES.has(file)) continue
  const isCss = file.endsWith('.css')
  const isTsx = /\.(tsx|ts)$/.test(file)
  if (!isCss && !isTsx) continue
  const rules = isCss ? CSS_RULES : TSX_RULES
  fs.readFileSync(file, 'utf8').split('\n').forEach((line, i) => {
    if (isCss && (/^\s*@media/.test(line) || /^\s*(\/\*|\*)/.test(line))) return
    const code = isCss ? line.replace(/\/\*.*?\*\//g, '') : line
    if (isCss) {
      for (const m of code.matchAll(/var\((--[\w-]+)/g)) {
        if (!defined.has(m[1])) problems.push(`${file}:${i + 1}  undefined variable ${m[1]}: ${line.trim()}`)
      }
    }
    for (const [re, label] of rules) if (re.test(code)) problems.push(`${file}:${i + 1}  ${label}: ${line.trim()}`)
  })
}

if (problems.length) {
  console.error(`Found ${problems.length} problem(s). Use tokens from src/styles/tokens.css (or flag a gap); every var(--x) must exist:\n`)
  console.error(problems.join('\n'))
  process.exit(1)
}
console.log('check-tokens: no hardcoded values found.')
