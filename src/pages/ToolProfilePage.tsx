import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import EditorialCard from '../components/ui/EditorialCard'
import { dataPath } from '../utils/dataPath'
import { compareTools, methodologyWeights, rankTools } from '../utils/scoring'

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

type EvidenceSource = {
  id: string
  toolId: string
  sourceType: string
  title: string
  url: string
  evidenceStrength: 'Low' | 'Medium' | 'High'
  lastReviewed: string
}

function toConfidenceLevel(sources: EvidenceSource[]) {
  if (sources.some((source) => source.evidenceStrength === 'High')) return 'High'
  if (sources.some((source) => source.evidenceStrength === 'Medium')) return 'Medium'
  return 'Low'
}

export default function ToolProfilePage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [tools, setTools] = useState<ToolRecord[]>([])
  const [categories, setCategories] = useState<CategoryRecord[]>([])
  const [scores, setScores] = useState<SnapshotScore[]>([])
  const [evidenceSources, setEvidenceSources] = useState<EvidenceSource[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      const [toolsResponse, categoriesResponse, scoresResponse, evidenceResponse] = await Promise.all([
        fetch(dataPath('tools.json')),
        fetch(dataPath('categories.json')),
        fetch(dataPath('scoreSnapshots.json')),
        fetch(dataPath('evidenceSources.json'))
      ])

      const toolsJson = await toolsResponse.json()
      const categoriesJson = await categoriesResponse.json()
      const scoresJson = await scoresResponse.json()
      const evidenceJson = await evidenceResponse.json()

      setTools(toolsJson.tools ?? [])
      setCategories(categoriesJson.categories ?? [])
      setScores(scoresJson.snapshots?.[0]?.scores ?? [])
      setEvidenceSources(evidenceJson.sources ?? [])
      setIsLoading(false)
    }

    void loadData()
  }, [])

  const rankedTools = useMemo(() => {
    const scored = tools.map((tool) => {
      const snapshot = scores.find((item) => item.toolId === tool.id)
      return {
        toolId: tool.id,
        name: tool.name,
        vendor: tool.vendor,
        categoryId: tool.categoryId,
        dimensions: snapshot?.dimensions ?? {},
        overallScore: snapshot?.overallScore ?? 0
      }
    })
    return rankTools(scored)
  }, [tools, scores])

  const activeToolId = searchParams.get('toolId') ?? rankedTools[0]?.toolId ?? ''
  const compareToolId = searchParams.get('compareToolId') ?? ''

  const activeTool = rankedTools.find((tool) => tool.toolId === activeToolId) ?? rankedTools[0]
  const compareTarget = rankedTools.find((tool) => tool.toolId === compareToolId)

  const activeToolRecord = tools.find((tool) => tool.id === activeTool?.toolId)
  const category = categories.find((item) => item.id === activeToolRecord?.categoryId)
  const evidence = evidenceSources.filter((source) => source.toolId === activeTool?.toolId)

  const sortedDimensions = useMemo(() => {
    if (!activeTool) return []
    return methodologyWeights.dimensions
      .map((dimension) => ({
        key: dimension.key,
        label: dimension.label,
        value: activeTool.dimensions[dimension.key] ?? 0
      }))
      .sort((a, b) => b.value - a.value)
  }, [activeTool])

  const strengths = sortedDimensions.slice(0, 3)
  const watchouts = sortedDimensions.slice(-3).reverse()
  const confidence = toConfidenceLevel(evidence)
  const lastReviewed = evidence.map((source) => source.lastReviewed).sort().reverse()[0] ?? 'Not available'

  const comparison = activeTool && compareTarget ? compareTools(activeTool, compareTarget) : null

  if (!activeTool) {
    return (
      <section>
        <EditorialCard title="Tool Profile">
          <p>No tool data available.</p>
        </EditorialCard>
      </section>
    )
  }

  return (
    <section className="space-y-6">
      <EditorialCard eyebrow="Executive Drilldown" title="Tool Profile">
        <p>Inspect an individual tool’s governance posture, evidence quality, and comparative position.</p>
        <p className="mt-2 text-xs uppercase tracking-[0.09em] text-ink-500">Sample data warning: illustrative only, not factual.</p>
      </EditorialCard>

      {isLoading ? (
        <EditorialCard title="Loading Tool Profile">
          <p>Loading tool records, scores, categories, and evidence references.</p>
        </EditorialCard>
      ) : null}

      {!isLoading ? <EditorialCard title="Select Tool">
        <p className="mb-3 text-xs text-ink-500">Choose a primary tool and optional comparison tool to generate side-by-side deltas.</p>
        <div className="grid gap-3 md:grid-cols-2">
          <select
            value={activeTool.toolId}
            onChange={(event) => setSearchParams({ toolId: event.target.value, compareToolId })}
            className="rounded-sm border border-paper-200 bg-white px-3 py-2 text-sm"
          >
            {rankedTools.map((tool) => (
              <option key={tool.toolId} value={tool.toolId}>
                {tool.name}
              </option>
            ))}
          </select>
          <select
            value={compareToolId}
            onChange={(event) => setSearchParams({ toolId: activeTool.toolId, compareToolId: event.target.value })}
            className="rounded-sm border border-paper-200 bg-white px-3 py-2 text-sm"
          >
            <option value="">Compare with another tool</option>
            {rankedTools
              .filter((tool) => tool.toolId !== activeTool.toolId)
              .map((tool) => (
                <option key={tool.toolId} value={tool.toolId}>
                  {tool.name}
                </option>
              ))}
          </select>
        </div>
      </EditorialCard> : null}

      {!isLoading ? <div className="grid gap-6 xl:grid-cols-3">
        <EditorialCard title={activeToolRecord?.name ?? activeTool.name}>
          <p className="text-sm text-ink-500">{activeToolRecord?.vendor ?? activeTool.vendor}</p>
          <p className="mt-2 text-sm">
            Category: <span className="font-medium">{category?.name ?? 'Unmapped'}</span>
          </p>
          <p className="mt-2 text-sm">
            Overall Score: <span className="font-medium">{activeTool.overallScore.toFixed(2)}</span>
          </p>
          <p className="mt-2 text-sm">
            Rank: <span className="font-medium">#{activeTool.rank}</span>
          </p>
          <p className="mt-2 text-sm">
            Score Band: <span className="font-medium">{activeTool.band}</span>
          </p>
          <p className="mt-2 text-sm">
            Confidence Level: <span className="font-medium">{confidence}</span>
          </p>
          <p className="mt-2 text-sm">
            Last Reviewed: <span className="font-medium">{lastReviewed}</span>
          </p>
        </EditorialCard>

        <EditorialCard title="Strengths">
          <ul className="space-y-2 text-sm">
            {strengths.map((item) => (
              <li key={item.key}>
                {item.label}: <span className="font-medium">{item.value.toFixed(1)} / 5</span>
              </li>
            ))}
          </ul>
        </EditorialCard>

        <EditorialCard title="Watchouts">
          <ul className="space-y-2 text-sm">
            {watchouts.map((item) => (
              <li key={item.key}>
                {item.label}: <span className="font-medium">{item.value.toFixed(1)} / 5</span>
              </li>
            ))}
          </ul>
        </EditorialCard>
      </div> : null}

      {!isLoading ? <EditorialCard title="Score Breakdown">
        <div className="overflow-x-auto">
          <table className="dense-table">
            <thead>
              <tr>
                <th>Dimension</th>
                <th>Weight</th>
                <th>Score</th>
              </tr>
            </thead>
            <tbody>
              {methodologyWeights.dimensions.map((dimension) => (
                <tr key={dimension.key}>
                  <td>{dimension.label}</td>
                  <td>{dimension.weight}</td>
                  <td>{(activeTool.dimensions[dimension.key] ?? 0).toFixed(1)} / 5</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </EditorialCard> : null}

      {!isLoading ? <EditorialCard title="Evidence Links">
        {evidence.length === 0 ? (
          <p className="text-sm text-ink-500">No sample evidence linked for this tool.</p>
        ) : (
          <ul className="space-y-3">
            {evidence.map((source) => (
              <li key={source.id} className="rounded-sm border border-paper-200 bg-white p-3">
                <p className="text-sm font-medium">{source.title}</p>
                <p className="text-xs text-ink-500">
                  {source.sourceType} · Strength: {source.evidenceStrength} · Reviewed: {source.lastReviewed}
                </p>
                <a className="text-sm text-burgundy-700 underline" href={source.url} target="_blank" rel="noreferrer">
                  Open evidence link
                </a>
              </li>
            ))}
          </ul>
        )}
      </EditorialCard> : null}

      {!isLoading ? <EditorialCard title="Compare With Another Tool">
        {!comparison ? (
          <p className="text-sm text-ink-500">Choose a comparison tool from the selector above.</p>
        ) : (
          <div className="space-y-4">
            <p className="text-sm">
              Comparing <span className="font-medium">{comparison.left.name}</span> vs{' '}
              <span className="font-medium">{comparison.right.name}</span> · Score Delta:{' '}
              <span className="font-medium">{comparison.scoreDelta.toFixed(2)}</span>
            </p>
            <div className="overflow-x-auto">
              <table className="dense-table">
                <thead>
                  <tr>
                    <th>Dimension</th>
                    <th>Selected Tool</th>
                    <th>Comparison Tool</th>
                    <th>Delta</th>
                  </tr>
                </thead>
                <tbody>
                  {comparison.dimensionDeltas.map((item) => (
                    <tr key={item.key}>
                      <td>{item.label}</td>
                      <td>{item.left.toFixed(1)}</td>
                      <td>{item.right.toFixed(1)}</td>
                      <td>{item.delta.toFixed(1)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </EditorialCard> : null}

      {!isLoading ? <div>
        <Link to="/benchmark" className="text-sm text-burgundy-700 underline">
          Back to Benchmark
        </Link>
      </div> : null}
    </section>
  )
}
