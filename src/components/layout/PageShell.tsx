import type { ReactNode } from 'react'

type NavItem = {
  to: string
  label: string
}

type PageShellProps = {
  title: string
  subtitle: string
  navItems: NavItem[]
  currentPath: string
  onNavigate: (to: string) => void
  children: ReactNode
}

export default function PageShell({
  title,
  subtitle,
  navItems,
  currentPath,
  onNavigate,
  children
}: PageShellProps) {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b border-paper-200 bg-paper-50/95 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h1 className="text-2xl sm:text-3xl">{title}</h1>
                <p className="mt-1 max-w-3xl text-sm text-ink-500">{subtitle}</p>
              </div>
              <span className="inline-block border-l-2 border-burgundy-600 pl-3 text-xs uppercase tracking-[0.15em] text-burgundy-700">
                Editorial Intelligence
              </span>
            </div>
            <nav className="overflow-x-auto pb-1">
              <ul className="flex min-w-max gap-2">
                {navItems.map((item) => {
                  const isActive = currentPath === item.to
                  return (
                    <li key={item.to}>
                      <button
                        type="button"
                        onClick={() => onNavigate(item.to)}
                        className={`rounded-sm border px-3 py-1.5 text-xs tracking-wide transition sm:text-sm ${
                          isActive
                            ? 'border-burgundy-700 bg-burgundy-700 text-paper-50'
                            : 'border-paper-200 bg-white/80 text-ink-700 hover:border-burgundy-500 hover:text-burgundy-700'
                        }`}
                      >
                        {item.label}
                      </button>
                    </li>
                  )
                })}
              </ul>
            </nav>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">{children}</main>
    </div>
  )
}
