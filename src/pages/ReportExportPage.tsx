import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import PptxGenJS from 'pptxgenjs'
import { useEffect, useMemo, useRef, useState } from 'react'
import EditorialCard from '../components/ui/EditorialCard'
import { dataPath } from '../utils/dataPath'
import { rankTools } from '../utils/scoring'

type ToolRecord = { id: string; name: string; vendor: string; categoryId: string }
type ScoreRecord = { toolId: string; overallScore: number; dimensions: Record<string, number> }
type CategoryRecord = { id: string; name: string }

export default function ReportExportPage() {
  const [tools, setTools] = useState<ToolRecord[]>([])
  const [scores, setScores] = useState<ScoreRecord[]>([])
  const [categories, setCategories] = useState<CategoryRecord[]>([])
  const [isExportingPdf, setIsExportingPdf] = useState(false)
  const [isExportingPpt, setIsExportingPpt] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function loadData() {
      const [toolsResponse, scoreResponse, categoriesResponse] = await Promise.all([
        fetch(dataPath('tools.json')),
        fetch(dataPath('scoreSnapshots.json')),
        fetch(dataPath('categories.json'))
      ])
      const toolsJson = await toolsResponse.json()
      const scoreJson = await scoreResponse.json()
      const categoriesJson = await categoriesResponse.json()
      setTools(toolsJson.tools ?? [])
      setScores(scoreJson.snapshots?.[0]?.scores ?? [])
      setCategories(categoriesJson.categories ?? [])
      setIsLoading(false)
    }
    void loadData()
  }, [])

  const ranked = useMemo(() => {
    const scored = tools.map((tool) => {
      const score = scores.find((item) => item.toolId === tool.id)
      return {
        toolId: tool.id,
        name: tool.name,
        vendor: tool.vendor,
        categoryId: tool.categoryId,
        overallScore: score?.overallScore ?? 0,
        dimensions: score?.dimensions ?? {}
      }
    })
    return rankTools(scored)
  }, [tools, scores])

  const topFive = ranked.slice(0, 5)
  const avgScore = ranked.length ? (ranked.reduce((sum, item) => sum + item.overallScore, 0) / ranked.length).toFixed(1) : '0.0'
  const categoryCount = new Set(tools.map((tool) => tool.categoryId)).size

  const findings = useMemo(
    () => [
      `Sample dataset contains ${ranked.length} tools across ${categoryCount} categories.`,
      `Average benchmark score in this snapshot is ${avgScore}.`,
      `Top ranked tool in this sample snapshot is ${topFive[0]?.name ?? 'N/A'}.`
    ],
    [ranked.length, categoryCount, avgScore, topFive]
  )

  async function exportPdf() {
    if (!containerRef.current) return
    setIsExportingPdf(true)
    try {
      const sections = Array.from(containerRef.current.querySelectorAll<HTMLElement>('[data-export-section]'))
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' })
      for (let i = 0; i < sections.length; i += 1) {
        const canvas = await html2canvas(sections[i], { scale: 2, useCORS: true, backgroundColor: '#f9f5ef' })
        const image = canvas.toDataURL('image/png')
        const pageWidth = pdf.internal.pageSize.getWidth()
        const pageHeight = pdf.internal.pageSize.getHeight()
        const ratio = Math.min(pageWidth / canvas.width, pageHeight / canvas.height)
        const width = canvas.width * ratio
        const height = canvas.height * ratio
        const x = (pageWidth - width) / 2
        const y = 24
        if (i > 0) pdf.addPage()
        pdf.addImage(image, 'PNG', x, y, width, height)
      }
      pdf.save('agent-control-index-report.pdf')
    } finally {
      setIsExportingPdf(false)
    }
  }

  async function exportPptx() {
    setIsExportingPpt(true)
    try {
      const pptx = new PptxGenJS()
      pptx.layout = 'LAYOUT_WIDE' // 16:9
      pptx.author = 'Agent Control Index'
      pptx.subject = 'Static sample export'
      pptx.title = 'Agent Control Index Report'

      const slide1 = pptx.addSlide()
      slide1.addText('Agent Control Index', { x: 0.6, y: 1.2, w: 12.2, h: 0.8, fontSize: 34, bold: true, color: '161513' })
      slide1.addText('Sample Static Export', { x: 0.6, y: 2.1, w: 12.2, h: 0.4, fontSize: 18, color: '6F1D2D' })
      slide1.addText(`Generated: ${new Date().toISOString().slice(0, 10)}`, { x: 0.6, y: 2.8, w: 12.2, h: 0.3, fontSize: 12, color: '5B5550' })

      const slide2 = pptx.addSlide()
      slide2.addText('Market Overview', { x: 0.6, y: 0.4, w: 6, h: 0.5, fontSize: 24, bold: true, color: '161513' })
      slide2.addText(`Total Tools: ${ranked.length}\nAverage Score: ${avgScore}\nCategories Covered: ${categoryCount}`, {
        x: 0.6, y: 1.2, w: 5.8, h: 2.2, fontSize: 16, color: '33302C', breakLine: true
      })

      const slide3 = pptx.addSlide()
      slide3.addText('Benchmark Ranking (Top 5)', { x: 0.6, y: 0.4, w: 9, h: 0.5, fontSize: 24, bold: true, color: '161513' })
      slide3.addTable(
        [
          [{ text: 'Rank', options: { bold: true } }, { text: 'Tool', options: { bold: true } }, { text: 'Score', options: { bold: true } }, { text: 'Band', options: { bold: true } }],
          ...topFive.map((tool) => [
            { text: String(tool.rank) },
            { text: tool.name ?? '-' },
            { text: tool.overallScore.toFixed(2) },
            { text: tool.band }
          ])
        ],
        { x: 0.6, y: 1.1, w: 12.0, border: { type: 'solid', color: 'D8CCBC', pt: 1 }, fontSize: 13 }
      )

      const slide4 = pptx.addSlide()
      slide4.addText('Methodology', { x: 0.6, y: 0.4, w: 9, h: 0.5, fontSize: 24, bold: true, color: '161513' })
      slide4.addText('Weighted model: dimension score (0-5) normalized and scaled to 100.\nThis prototype dataset is sample only and not factual.', {
        x: 0.6, y: 1.1, w: 11.8, h: 1.3, fontSize: 15, color: '33302C', breakLine: true
      })
      slide4.addTable(
        [
          [{ text: 'Dimension', options: { bold: true } }, { text: 'Weight', options: { bold: true } }],
          [{ text: 'Runtime Policy Control' }, { text: '20%' }],
          [{ text: 'Identity, Access & Permissions' }, { text: '15%' }],
          [{ text: 'Observability & Auditability' }, { text: '15%' }],
          [{ text: 'Risk, Compliance & Governance' }, { text: '15%' }],
          [{ text: 'Human Oversight & Approvals' }, { text: '10%' }],
          [{ text: 'Tool Action Control' }, { text: '10%' }],
          [{ text: 'Enterprise Integration Readiness' }, { text: '10%' }],
          [{ text: 'Evidence Quality & Market Maturity' }, { text: '5%' }]
        ],
        { x: 0.6, y: 2.5, w: 12.0, border: { type: 'solid', color: 'D8CCBC', pt: 1 }, fontSize: 12 }
      )

      const slide5 = pptx.addSlide()
      slide5.addText('Key Findings', { x: 0.6, y: 0.4, w: 9, h: 0.5, fontSize: 24, bold: true, color: '161513' })
      findings.forEach((finding, index) => {
        slide5.addText(`• ${finding}`, { x: 0.8, y: 1.1 + index * 0.55, w: 11.8, h: 0.4, fontSize: 16, color: '33302C' })
      })
      slide5.addText('Note: all findings are generated from static sample records.', {
        x: 0.8, y: 3.4, w: 11.8, h: 0.3, fontSize: 12, color: '6F1D2D'
      })

      await pptx.writeFile({ fileName: 'agent-control-index-report.pptx' })
    } finally {
      setIsExportingPpt(false)
    }
  }

  return (
    <section className="space-y-6">
      <EditorialCard eyebrow="Board-Ready Output" title="Report Export">
        <p>Generate PDF or PowerPoint directly in the browser. Exports use static sample data only.</p>
        <p className="mt-2 text-xs text-ink-500">Recommended flow: review preview sections below, then export PDF for circulation or PPTX for live presentation.</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <button type="button" onClick={() => void exportPdf()} disabled={isExportingPdf} className="rounded-sm border border-burgundy-700 px-3 py-1.5 text-sm text-burgundy-700 disabled:opacity-60">
            {isExportingPdf ? 'Exporting PDF...' : 'Export PDF'}
          </button>
          <button type="button" onClick={() => void exportPptx()} disabled={isExportingPpt} className="rounded-sm border border-burgundy-700 px-3 py-1.5 text-sm text-burgundy-700 disabled:opacity-60">
            {isExportingPpt ? 'Exporting PPTX...' : 'Export PowerPoint (16:9)'}
          </button>
        </div>
      </EditorialCard>

      {isLoading ? (
        <EditorialCard title="Loading Export Content">
          <p>Preparing market overview, ranking, and findings for export.</p>
        </EditorialCard>
      ) : null}

      {!isLoading ? <div ref={containerRef} className="space-y-5">
        <EditorialCard data-export-section="" title="Title Page">
          <p className="text-lg font-medium">Agent Control Index</p>
          <p className="mt-2 text-sm text-ink-500">Static Sample Report Export</p>
        </EditorialCard>

        <EditorialCard data-export-section="" title="Market Overview">
          <ul className="list-disc pl-5 text-sm">
            <li>Total Tools: {ranked.length}</li>
            <li>Average Score: {avgScore}</li>
            <li>Categories Covered: {new Set(categories.map((c) => c.id)).size}</li>
          </ul>
        </EditorialCard>

        <EditorialCard data-export-section="" title="Benchmark Ranking">
          <table className="dense-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Tool</th>
                <th>Score</th>
                <th>Band</th>
              </tr>
            </thead>
            <tbody>
              {topFive.map((tool) => (
                <tr key={tool.toolId}>
                  <td>{tool.rank}</td>
                  <td>{tool.name}</td>
                  <td>{tool.overallScore.toFixed(2)}</td>
                  <td>{tool.band}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </EditorialCard>

        <EditorialCard data-export-section="" title="Methodology">
          <p className="text-sm">Enterprise governance-led scoring model using 0-5 dimension scores weighted to 100.</p>
          <p className="mt-2 text-xs text-ink-500">Prototype sample data only. Not factual.</p>
        </EditorialCard>

        <EditorialCard data-export-section="" title="Key Findings">
          <ul className="list-disc pl-5 text-sm">
            {findings.map((finding) => (
              <li key={finding}>{finding}</li>
            ))}
          </ul>
        </EditorialCard>
      </div> : null}
    </section>
  )
}
