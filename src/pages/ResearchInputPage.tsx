import { useMemo, useState } from 'react'
import EditorialCard from '../components/ui/EditorialCard'
import { calculateWeightedScore, methodologyWeights } from '../utils/scoring'

type EvidenceInput = {
  title: string
  url: string
  sourceType: string
  evidenceStrength: 'Low' | 'Medium' | 'High'
  lastReviewed: string
}

type DimensionInput = Record<string, number>

const defaultDimensions: DimensionInput = methodologyWeights.dimensions.reduce((acc, dimension) => {
  acc[dimension.key] = 0
  return acc
}, {} as DimensionInput)

const emptyEvidence: EvidenceInput = {
  title: '',
  url: '',
  sourceType: '',
  evidenceStrength: 'Medium',
  lastReviewed: ''
}

export default function ResearchInputPage() {
  const [toolId, setToolId] = useState('')
  const [name, setName] = useState('')
  const [vendor, setVendor] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [summary, setSummary] = useState('')
  const [strengthsText, setStrengthsText] = useState('')
  const [watchoutsText, setWatchoutsText] = useState('')
  const [dimensions, setDimensions] = useState<DimensionInput>(defaultDimensions)
  const [evidence, setEvidence] = useState<EvidenceInput[]>([emptyEvidence])
  const [copied, setCopied] = useState(false)

  const weightedScore = useMemo(() => calculateWeightedScore(dimensions), [dimensions])

  const warnings = useMemo(() => {
    const items: string[] = []
    if (!toolId.trim()) items.push('Tool ID is required.')
    if (!name.trim()) items.push('Tool name is required.')
    if (!vendor.trim()) items.push('Vendor is required.')
    if (!categoryId.trim()) items.push('Category is recommended for benchmark grouping.')
    if (summary.trim().length < 30) items.push('Summary is short; add more context for reviewers.')

    methodologyWeights.dimensions.forEach((dimension) => {
      const value = dimensions[dimension.key]
      if (value < 0 || value > 5 || Number.isNaN(value)) {
        items.push(`${dimension.label} must be between 0 and 5.`)
      }
    })

    const validEvidence = evidence.filter((item) => item.title.trim() || item.url.trim())
    if (validEvidence.length === 0) items.push('At least one evidence link is recommended.')
    validEvidence.forEach((item, index) => {
      if (!item.title.trim()) items.push(`Evidence ${index + 1}: title is missing.`)
      if (!item.url.trim()) items.push(`Evidence ${index + 1}: URL is missing.`)
      if (item.url && !/^https?:\/\//i.test(item.url)) items.push(`Evidence ${index + 1}: URL should start with http:// or https://.`)
      if (!item.lastReviewed.trim()) items.push(`Evidence ${index + 1}: last reviewed date is missing.`)
    })

    return items
  }, [toolId, name, vendor, categoryId, summary, dimensions, evidence])

  const previewJson = useMemo(() => {
    const payload = {
      metadata: {
        isSampleData: true,
        notFactual: true,
        generatedAt: new Date().toISOString(),
        note: 'Static research input preview. No backend write occurs.'
      },
      tool: {
        id: toolId.trim(),
        name: name.trim(),
        vendor: vendor.trim(),
        categoryId: categoryId.trim(),
        summary: summary.trim(),
        strengths: strengthsText
          .split('\n')
          .map((item) => item.trim())
          .filter(Boolean),
        watchouts: watchoutsText
          .split('\n')
          .map((item) => item.trim())
          .filter(Boolean)
      },
      scoring: {
        overallScore: weightedScore,
        dimensions
      },
      evidenceSources: evidence
        .filter((item) => item.title.trim() || item.url.trim())
        .map((item, index) => ({
          id: `${toolId || 'new-tool'}-source-${index + 1}`,
          ...item
        }))
    }

    return JSON.stringify(payload, null, 2)
  }, [toolId, name, vendor, categoryId, summary, strengthsText, watchoutsText, weightedScore, dimensions, evidence])

  async function copyJson() {
    try {
      await navigator.clipboard.writeText(previewJson)
      setCopied(true)
      setTimeout(() => setCopied(false), 1400)
    } catch {
      setCopied(false)
    }
  }

  return (
    <section className="space-y-6">
      <EditorialCard eyebrow="Research Workspace" title="Research Input">
        <p>This page is client-side only. Use it to draft tool updates and export JSON payloads for manual processing.</p>
        <p className="mt-2 text-xs uppercase tracking-[0.09em] text-ink-500">Sample data warning: draft content only, not factual publication output.</p>
      </EditorialCard>

      <EditorialCard title="Tool Form">
        <p className="mb-3 text-xs text-ink-500">Fields below create a tool payload for review and later inclusion in static data files.</p>
        <div className="grid gap-3 md:grid-cols-2">
          <input value={toolId} onChange={(e) => setToolId(e.target.value)} placeholder="Tool ID" className="rounded-sm border border-paper-200 px-3 py-2 text-sm" />
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Tool Name" className="rounded-sm border border-paper-200 px-3 py-2 text-sm" />
          <input value={vendor} onChange={(e) => setVendor(e.target.value)} placeholder="Vendor" className="rounded-sm border border-paper-200 px-3 py-2 text-sm" />
          <input value={categoryId} onChange={(e) => setCategoryId(e.target.value)} placeholder="Category ID" className="rounded-sm border border-paper-200 px-3 py-2 text-sm" />
          <textarea value={summary} onChange={(e) => setSummary(e.target.value)} placeholder="Summary" className="rounded-sm border border-paper-200 px-3 py-2 text-sm md:col-span-2" rows={3} />
        </div>
      </EditorialCard>

      <EditorialCard title="Score Dimensions (0 to 5)">
        <div className="grid gap-3 md:grid-cols-2">
          {methodologyWeights.dimensions.map((dimension) => (
            <label key={dimension.key} className="rounded-sm border border-paper-200 bg-white px-3 py-2 text-sm">
              <span className="block text-xs text-ink-500">{dimension.label}</span>
              <input
                type="number"
                min={0}
                max={5}
                step={0.1}
                value={dimensions[dimension.key] ?? 0}
                onChange={(e) =>
                  setDimensions((current) => ({
                    ...current,
                    [dimension.key]: Number(e.target.value)
                  }))
                }
                className="mt-1 w-full rounded-sm border border-paper-200 px-2 py-1"
              />
            </label>
          ))}
        </div>
        <p className="mt-3 text-sm">Calculated Weighted Score: <span className="font-medium">{weightedScore.toFixed(2)}</span></p>
      </EditorialCard>

      <EditorialCard title="Evidence Links">
        <p className="mb-3 text-xs text-ink-500">Add at least one evidence source with URL and review date to improve confidence quality.</p>
        <div className="space-y-3">
          {evidence.map((item, index) => (
            <div key={`evidence-${index}`} className="grid gap-2 rounded-sm border border-paper-200 bg-white p-3 md:grid-cols-5">
              <input value={item.title} onChange={(e) => setEvidence((cur) => cur.map((x, i) => (i === index ? { ...x, title: e.target.value } : x)))} placeholder="Title" className="rounded-sm border border-paper-200 px-2 py-1 text-sm md:col-span-2" />
              <input value={item.url} onChange={(e) => setEvidence((cur) => cur.map((x, i) => (i === index ? { ...x, url: e.target.value } : x)))} placeholder="URL" className="rounded-sm border border-paper-200 px-2 py-1 text-sm md:col-span-2" />
              <button type="button" onClick={() => setEvidence((cur) => cur.length > 1 ? cur.filter((_, i) => i !== index) : cur)} className="rounded-sm border border-paper-200 px-2 py-1 text-xs">Remove</button>
              <input value={item.sourceType} onChange={(e) => setEvidence((cur) => cur.map((x, i) => (i === index ? { ...x, sourceType: e.target.value } : x)))} placeholder="Source Type" className="rounded-sm border border-paper-200 px-2 py-1 text-sm" />
              <select value={item.evidenceStrength} onChange={(e) => setEvidence((cur) => cur.map((x, i) => (i === index ? { ...x, evidenceStrength: e.target.value as EvidenceInput['evidenceStrength'] } : x)))} className="rounded-sm border border-paper-200 px-2 py-1 text-sm">
                <option>Low</option>
                <option>Medium</option>
                <option>High</option>
              </select>
              <input type="date" value={item.lastReviewed} onChange={(e) => setEvidence((cur) => cur.map((x, i) => (i === index ? { ...x, lastReviewed: e.target.value } : x)))} className="rounded-sm border border-paper-200 px-2 py-1 text-sm" />
            </div>
          ))}
          <button type="button" onClick={() => setEvidence((cur) => [...cur, emptyEvidence])} className="rounded-sm border border-paper-200 bg-white px-3 py-1.5 text-sm">
            Add Evidence Link
          </button>
        </div>
      </EditorialCard>

      <div className="grid gap-6 xl:grid-cols-2">
        <EditorialCard title="Strengths">
          <textarea value={strengthsText} onChange={(e) => setStrengthsText(e.target.value)} rows={6} placeholder="One strength per line" className="w-full rounded-sm border border-paper-200 px-3 py-2 text-sm" />
        </EditorialCard>
        <EditorialCard title="Watchouts">
          <textarea value={watchoutsText} onChange={(e) => setWatchoutsText(e.target.value)} rows={6} placeholder="One watchout per line" className="w-full rounded-sm border border-paper-200 px-3 py-2 text-sm" />
        </EditorialCard>
      </div>

      <EditorialCard title="Validation Warnings">
        {warnings.length === 0 ? <p className="text-sm text-ink-700">No warnings.</p> : (
          <ul className="list-disc pl-5 text-sm text-ink-700">
            {warnings.map((warning) => <li key={warning}>{warning}</li>)}
          </ul>
        )}
      </EditorialCard>

      <EditorialCard title="JSON Preview">
        <p className="mb-3 text-xs text-ink-500">Use this JSON as a handoff artifact for manual merge into `public/data` files.</p>
        <div className="mb-3">
          <button type="button" onClick={copyJson} className="rounded-sm border border-burgundy-700 px-3 py-1.5 text-sm text-burgundy-700">
            {copied ? 'Copied' : 'Copy JSON'}
          </button>
        </div>
        <pre className="max-h-[28rem] overflow-auto rounded-sm border border-paper-200 bg-white p-3 text-xs leading-5">
          {previewJson}
        </pre>
      </EditorialCard>
    </section>
  )
}
