import t from '../styles/typography.module.css'

/** Stand-in for a screen that a later slice builds. Keeps the shell navigable without inventing content. */
export function PagePlaceholder({ title, kicker }: { title: string; kicker: string }) {
  return (
    <section>
      <div className={t.typeCaption}>{kicker}</div>
      <h1 className={t.typeH1}>{title}</h1>
    </section>
  )
}
