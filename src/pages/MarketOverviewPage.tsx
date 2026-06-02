import { useEffect, useMemo, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts'
import EditorialCard from '../components/ui/EditorialCard'
import { dataPath } from '../utils/dataPath'
import { calculateMovement, rankTools } from '../utils/scoring'

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

type SnapshotScore = {
  toolId: string
  overallScore: number
  dimensions: Record<string, number>
}

const PIE_COLORS = ['#6f1d2d', '#a47e3b', '#33302c', '#842538', '#5b5550', '#9a2e44', '#7c673f', '#493f38']

export default function MarketOverviewPage() {
  const [tools, setTools] = useState<ToolRecord[]>([])
  const [categories, setCategories] = useState<CategoryRecord[]>([])
  const [snapshot, setSnapshot] = useState<SnapshotScore[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      const [toolsResponse, categoriesResponse, snapshotsResponse] = await Promise.all([
        fetch(dataPath('tools.json')),
        fetch(dataPath('categories.json')),
        fetch(dataPath('scoreSnapshots.json'))
      ])

      const toolsJson = await toolsResponse.json()
      const categoriesJson = await categoriesResponse.json()
      const snapshotsJson = await snapshotsResponse.json()

      setTools(toolsJson.tools ?? [])
      setCategories(categoriesJson.categories ?? [])
      setSnapshot(snapshotsJson.snapshots?.[0]?.scores ?? [])
      setIsLoading(false)
    }

    void loadData()
  }, [])

  const rankedTools = useMemo(() => {
    const scored = tools.map((tool) => {
      const score = snapshot.find((item) => item.toolId === tool.id)
      return {
        toolId: tool.id,
        name: tool.name,
        vendor: tool.vendor,
        categoryId: tool.categoryId,
        dimensions: score?.dimensions ?? {},
        overallScore: score?.overallScore ?? 0
      }
    })
    return rankTools(scored)
  }, [tools, snapshot])

  const topRankedData = useMemo(
    () =>
      rankedTools.slice(0, 5).map((tool) => ({
        name: tool.name?.replace(/^Sample Tool \d+:\s*/, ''),
        score: tool.overallScore
      })),
    [rankedTools]
  )

  const categoryDistributionData = useMemo(() => {
    const counts = new Map<string, number>()
    tools.forEach((tool) => counts.set(tool.categoryId, (counts.get(tool.categoryId) ?? 0) + 1))

    return categories
      .map((category) => ({
        name: category.name,
        value: counts.get(category.id) ?? 0
      }))
      .filter((item) => item.value > 0)
  }, [categories, tools])

  const movementData = useMemo(() => {
    const movementRows = calculateMovement(rankedTools, rankedTools)
    return movementRows.map((item) => ({
      name: item.name?.replace(/^Sample Tool \d+:\s*/, ''),
      movement: item.movement ?? 0
    }))
  }, [rankedTools])

  const kpi = useMemo(() => {
    const totalTools = rankedTools.length
    const avgScore =
      totalTools === 0 ? 0 : Math.round((rankedTools.reduce((acc, tool) => acc + tool.overallScore, 0) / totalTools) * 10) / 10
    const topBandCount = rankedTools.filter((tool) => tool.band === 'Strong Performer' || tool.band === 'Leader').length
    const categoriesCovered = new Set(tools.map((tool) => tool.categoryId)).size

    return { totalTools, avgScore, topBandCount, categoriesCovered }
  }, [rankedTools, tools])

  return (
    <section className="space-y-6">
      <EditorialCard eyebrow="Executive Snapshot" title="Market Overview">
        <p>
          Quick read for leadership review: current distribution, relative ranking concentration, and governance posture
          summary from this dataset.
        </p>
        <p className="mt-2 text-xs uppercase tracking-[0.09em] text-ink-500">Sample data warning: illustrative only, not factual.</p>
      </EditorialCard>

      {isLoading ? (
        <EditorialCard title="Loading Market Data">
          <p>Preparing benchmark snapshot and charts.</p>
        </EditorialCard>
      ) : null}

      {!isLoading ? <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <EditorialCard title="Total Tools">{kpi.totalTools}</EditorialCard>
        <EditorialCard title="Average Score">{kpi.avgScore}</EditorialCard>
        <EditorialCard title="Leader + Strong Performer">{kpi.topBandCount}</EditorialCard>
        <EditorialCard title="Categories Covered">{kpi.categoriesCovered}</EditorialCard>
      </div> : null}

      {!isLoading ? <div className="grid gap-6 xl:grid-cols-2">
        <EditorialCard title="Top Ranked Tools">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topRankedData} margin={{ top: 8, right: 8, left: 0, bottom: 28 }}>
                <CartesianGrid stroke="#e7d9c8" strokeDasharray="2 2" />
                <XAxis dataKey="name" angle={-20} textAnchor="end" interval={0} height={56} tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="score" fill="#6f1d2d" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </EditorialCard>

        <EditorialCard title="Category Distribution">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={categoryDistributionData} dataKey="value" nameKey="name" outerRadius={105}>
                  {categoryDistributionData.map((entry, index) => (
                    <Cell key={`${entry.name}-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </EditorialCard>

        <EditorialCard title="Score Movement (Static Snapshot)">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={movementData} margin={{ top: 8, right: 8, left: 0, bottom: 28 }}>
                <CartesianGrid stroke="#e7d9c8" strokeDasharray="2 2" />
                <XAxis dataKey="name" angle={-20} textAnchor="end" interval={0} height={56} tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Line type="monotone" dataKey="movement" stroke="#a47e3b" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </EditorialCard>

        <EditorialCard eyebrow="Editorial Insight" title="Short Perspective">
          <p className="leading-6">
            The sample field clusters around the mid-to-upper bands, suggesting policy and audit controls are often
            prioritized over broader integration maturity in early governance programs.
          </p>
          <p className="mt-3 text-xs uppercase tracking-[0.09em] text-ink-500">
            Insight is generated from prototype data only and should be replaced with researched commentary.
          </p>
        </EditorialCard>
      </div> : null}
    </section>
  )
}
