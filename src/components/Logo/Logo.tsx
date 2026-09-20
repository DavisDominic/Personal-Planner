import { cx } from '../../lib/cx'
import s from './Logo.module.css'

/** The "D": a heavy letter drawn as a path, so it never depends on a font loading. */
const D_PATH = 'M44 30H58C71 30 78 39 78 48C78 57 71 66 58 66H44ZM54 39V57H58C63 57 66 54 66 48C66 42 63 39 58 39Z'

/** Daybook's app icon: a spiral-bound notebook with a D, in the design system's lemon and ink. */
export function AppIcon({ className, title }: { className?: string; title?: string }) {
  return (
    <svg className={cx(s.icon, className)} viewBox="0 0 96 96" role={title ? 'img' : undefined} aria-label={title} aria-hidden={title ? undefined : true}>
      <rect className={s.card} x="18" y="8" width="72" height="80" rx="20" />
      {[20, 32, 44, 56, 68].map((y) => (
        <rect key={y} className={s.ring} x="4" y={y} width="26" height="9" rx="4.5" />
      ))}
      <path className={s.letter} d={D_PATH} fillRule="evenodd" />
    </svg>
  )
}

/** The full Daybook logo: wordmark, rule and tagline on a spiral-bound page. */
export function Logo({ className, title = 'Daybook — keep what matters' }: { className?: string; title?: string }) {
  return (
    <svg className={cx(s.logo, className)} viewBox="0 0 640 210" role="img" aria-label={title}>
      <rect className={s.card} x="30" y="10" width="600" height="190" rx="14" />
      {[36, 63, 90, 117, 144, 171].map((y) => (
        <rect key={y} className={s.ring} x="8" y={y} width="38" height="12" rx="6" />
      ))}
      <text className={s.word} x="96" y="118" fontSize="76" textLength="480" lengthAdjust="spacing">
        DAYBOOK
      </text>
      <line className={s.rule} x1="96" y1="138" x2="580" y2="138" />
      <text className={s.tagline} x="96" y="174" fontSize="24" textLength="380" lengthAdjust="spacing">
        KEEP WHAT MATTERS
      </text>
    </svg>
  )
}
