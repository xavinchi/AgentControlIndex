import { Fragment, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import EditorialCard from '../components/ui/EditorialCard'
import { dataPath } from '../utils/dataPath'
import {
  calculateMovement,
  filterTools,
  methodologyWeights,
  rankTools,
  type DimensionScores,
  type RankedTool,
  type ScoreBand
} from '../utils/scoring'

type ToolRecord = {
  id: string
  name: string
  vendor: string
  categoryId: string
}

type CategoryRecord = {
  id: string
  name: string
}

type SnapshotRecord = {
  toolId: string
  overallScore?: number
  dimensions: DimensionScores
}

type SortKey = 'rank' | 'name' | 'vendor' | 'overallScore' | 'band' | 'movement'
type SortDirection = 'asc' | 'desc'

type BenchmarkRow = RankedTool & {
  movement: number | null
  movementLabel: 'up' | 'down' | 'no-change' | 'new'
}

function movementBadge(movementLabel: BenchmarkRow['movementLabel'], movement: number | null) {
  if (movementLabel === 'new') return 'New'
  if (movementLabel === 'no-change') return 'No change'
  if (movementLabel === 'up') return `Up ${movement}`
  return `Down ${Math.abs(movement ?? 0)}`
}

function compareValues(a: BenchmarkRow, b: BenchmarkRow, key: SortKey) {
  if (key === 'rank' || key === 'overallScore') return a[key] - b[key]
  if (key === 'movement') return (a.movement ?? -999) - (b.movement ?? -999)
  return String(a[key] ?? '').localeCompare(String(b[key] ?? ''))
}

export default function BenchmarkPage() {
  const [tools, setTools] = useState<ToolRecord[]>([])
  const [categories, setCategories] = useState<CategoryRecord[]>([])
  const [snapshot, setSnapshot] = useState<SnapshotRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({})
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState<string>('all')
  const [activeBand, setActiveBand] = useState<ScoreBand | 'all'>('all')
  const [sortKey, setSortKey] = useState<SortKey>('rank')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')

  useEffect(() => {
    async function loadData() {
      const [toolsResponse, categoriesResponse, snapshotResponse] = await Promise.all([
        fetch(dataPath('tools.json')),
        fetch(dataPath('categories.json')),
        fetch(dataPath('scoreSnapshots.json'))
      ])

      const toolsJson = await toolsResponse.json()
      const categoriesJson = await categoriesResponse.json()
      const snapshotJson = await snapshotResponse.json()

      setTools(toolsJson.tools ?? [])
      setCategories(categoriesJson.categories ?? [])
      setSnapshot(snapshotJson.snapshots?.[0]?.scores ?? [])
      setIsLoading(false)
    }

    void loadData()
  }, [])

  const rows = useMemo<BenchmarkRow[]>(() => {
    if (tools.length === 0 || snapshot.length === 0) return []

    const currentScored = tools.map((tool) => {
      const score = snapshot.find((entry) => entry.toolId === tool.id)
      return {
        toolId: tool.id,
        name: tool.name,
        vendor: tool.vendor,
        categoryId: tool.categoryId,
        dimensions: score?.dimensions ?? ({} as DimensionScores),
        overallScore: score?.overallScore
      }
    })

    const currentRanked = rankTools(currentScored)

    // Static fallback to show movement in a single-snapshot prototype.
    const previousRanked = rankTools(
      currentScored.map((tool, index) => ({
        ...tool,
        overallScore: (tool.overallScore ?? 0) - ((index % 3) - 1) * 1.2
      }))
    )

    return calculateMovement(currentRanked, previousRanked)
  }, [tools, snapshot])

  const filteredRows = useMemo(() => {
    return filterTools(rows, {
      search,
      categoryIds: activeCategory === 'all' ? [] : [activeCategory],
      bands: activeBand === 'all' ? [] : [activeBand]
    })
  }, [rows, search, activeCategory, activeBand])

  const sortedRows = useMemo(() => {
    const list = [...filteredRows].sort((a, b) => compareValues(a, b, sortKey))
    return sortDirection === 'asc' ? list : list.reverse()
  }, [filteredRows, sortDirection, sortKey])

  function onSort(nextKey: SortKey) {
    if (nextKey === sortKey) {
      setSortDirection((current) => (current === 'asc' ? 'desc' : 'asc'))
      return
    }
    setSortKey(nextKey)
    setSortDirection(nextKey === 'overallScore' || nextKey === 'movement' ? 'desc' : 'asc')
  }

  return (
    <section className="space-y-6">
      <EditorialCard eyebrow="Executive Comparison" title="Benchmark Rankings">
        <p>
          Use this table to compare relative governance readiness, score bands, and dimension-level positioning across tools.
        </p>
        <p className="mt-2 text-xs uppercase tracking-[0.09em] text-ink-500">Sample data warning: illustrative only, not factual.</p>
      </EditorialCard>

      <EditorialCard title="Search & Filters">
        <p className="mb-3 text-xs text-ink-500">Filter by category and score band, then sort columns for leadership cut views.</p>
        <div className="grid gap-3 md:grid-cols-3">
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search tool or vendor"
            className="rounded-sm border border-paper-200 bg-white px-3 py-2 text-sm text-ink-900 outline-none focus:border-burgundy-600"
          />

          <select
            value={activeCategory}
            onChange={(event) => setActiveCategory(event.target.value)}
            className="rounded-sm border border-paper-200 bg-white px-3 py-2 text-sm text-ink-900 outline-none focus:border-burgundy-600"
          >
            <option value="all">All Categories</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>

          <select
            value={activeBand}
            onChange={(event) => setActiveBand(event.target.value as ScoreBand | 'all')}
            className="rounded-sm border border-paper-200 bg-white px-3 py-2 text-sm text-ink-900 outline-none focus:border-burgundy-600"
          >
            <option value="all">All Score Bands</option>
            {methodologyWeights.scoreBands.map((band) => (
              <option key={band.label} value={band.label}>
                {band.label}
              </option>
            ))}
          </select>
        </div>
      </EditorialCard>

      {isLoading ? (
        <EditorialCard title="Loading Benchmark Table">
          <p>Fetching tools, categories, and score snapshots.</p>
        </EditorialCard>
      ) : null}

      {!isLoading ? <EditorialCard title="Benchmark Table">
        <div className="overflow-x-auto">
          <table className="dense-table min-w-[980px]">
            <thead>
              <tr>
                <th>
                  <button type="button" onClick={() => onSort('rank')}>
                    Rank
                  </button>
                </th>
                <th>
                  <button type="button" onClick={() => onSort('name')}>
                    Tool
                  </button>
                </th>
                <th>
                  <button type="button" onClick={() => onSort('vendor')}>
                    Vendor
                  </button>
                </th>
                <th>
                  <button type="button" onClick={() => onSort('overallScore')}>
                    Score
                  </button>
                </th>
                <th>
                  <button type="button" onClick={() => onSort('band')}>
                    Score Band
                  </button>
                </th>
                <th>
                  <button type="button" onClick={() => onSort('movement')}>
                    Movement
                  </button>
                </th>
                <th>Profile</th>
                <th>Breakdown</th>
              </tr>
            </thead>
            <tbody>
              {sortedRows.map((row) => (
                <Fragment key={row.toolId}>
                  <tr>
                    <td>{row.rank}</td>
                    <td className="font-medium">{row.name}</td>
                    <td>{row.vendor}</td>
                    <td>{row.overallScore.toFixed(2)}</td>
                    <td>{row.band}</td>
                    <td>{movementBadge(row.movementLabel, row.movement)}</td>
                    <td>
                      <Link className="text-burgundy-700 underline" to={`/tool-profile?toolId=${row.toolId}`}>
                        Open
                      </Link>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="text-burgundy-700 underline"
                        onClick={() =>
                          setExpandedRows((current) => ({
                            ...current,
                            [row.toolId]: !current[row.toolId]
                          }))
                        }
                      >
                        {expandedRows[row.toolId] ? 'Hide' : 'Show'}
                      </button>
                    </td>
                  </tr>
                  {expandedRows[row.toolId] ? (
                    <tr key={`${row.toolId}-expanded`}>
                      <td colSpan={8} className="bg-paper-100/50">
                        <div className="grid gap-2 py-1 md:grid-cols-2 xl:grid-cols-4">
                          {methodologyWeights.dimensions.map((dimension) => (
                            <div key={dimension.key} className="rounded-sm border border-paper-200 bg-white px-3 py-2">
                              <p className="text-[0.68rem] uppercase tracking-[0.08em] text-ink-500">{dimension.label}</p>
                              <p className="mt-1 text-sm text-ink-900">
                                {(row.dimensions[dimension.key] ?? 0).toFixed(1)} / 5
                              </p>
                            </div>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ) : null}
                </Fragment>
              ))}
              {sortedRows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-6 text-center text-ink-500">
                    No tools match the current filters. Try clearing category or score band constraints.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </EditorialCard> : null}
    </section>
  )
}
