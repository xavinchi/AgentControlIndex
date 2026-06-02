import type { HTMLAttributes, ReactNode } from 'react'

type EditorialCardProps = {
  title?: string
  eyebrow?: string
  children: ReactNode
  className?: string
} & HTMLAttributes<HTMLElement>

export default function EditorialCard({ title, eyebrow, children, className = '', ...rest }: EditorialCardProps) {
  return (
    <section className={`editorial-card p-5 sm:p-6 ${className}`} {...rest}>
      {eyebrow ? <p className="mb-2 text-[0.68rem] uppercase tracking-[0.14em] text-burgundy-700">{eyebrow}</p> : null}
      {title ? <h2 className="mb-3 text-xl">{title}</h2> : null}
      <div className="text-sm text-ink-700">{children}</div>
    </section>
  )
}
