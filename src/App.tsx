import { Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import MarketOverviewPage from './pages/MarketOverviewPage'
import BenchmarkPage from './pages/BenchmarkPage'
import ToolProfilePage from './pages/ToolProfilePage'
import TrendExplorerPage from './pages/TrendExplorerPage'
import MethodologyPage from './pages/MethodologyPage'
import ResearchInputPage from './pages/ResearchInputPage'
import ReportExportPage from './pages/ReportExportPage'
import PageShell from './components/layout/PageShell'
import EditorialCard from './components/ui/EditorialCard'
import DenseTable from './components/ui/DenseTable'

const navItems = [
  { to: '/', label: 'Market Overview' },
  { to: '/benchmark', label: 'Benchmark' },
  { to: '/tool-profile', label: 'Tool Profile' },
  { to: '/trend-explorer', label: 'Trend Explorer' },
  { to: '/methodology', label: 'Methodology' },
  { to: '/research-input', label: 'Research Input' },
  { to: '/report-export', label: 'Report Export' }
]

export default function App() {
  const location = useLocation()
  const navigate = useNavigate()

  return (
    <PageShell
      title="Agent Control Index"
      subtitle="Executive benchmark for enterprise agent governance, runtime control, oversight, and auditability."
      navItems={navItems}
      currentPath={location.pathname}
      onNavigate={navigate}
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="space-y-6">
          <Routes>
            <Route path="/" element={<MarketOverviewPage />} />
            <Route path="/benchmark" element={<BenchmarkPage />} />
            <Route path="/tool-profile" element={<ToolProfilePage />} />
            <Route path="/trend-explorer" element={<TrendExplorerPage />} />
            <Route path="/methodology" element={<MethodologyPage />} />
            <Route path="/research-input" element={<ResearchInputPage />} />
            <Route path="/report-export" element={<ReportExportPage />} />
          </Routes>
        </div>
        <aside className="space-y-6">
          <EditorialCard eyebrow="System Note" title="Scoring Bands">
            <p className="mb-3 text-xs text-ink-500">All current outputs use sample data for product demonstration only.</p>
            <DenseTable
              headers={['Band', 'Range']}
              rows={[
                ['Leader', '85-100'],
                ['Strong Performer', '70-84'],
                ['Emerging Contender', '55-69'],
                ['Early Stage', '40-54'],
                ['Limited Evidence', '0-39']
              ]}
            />
          </EditorialCard>
        </aside>
      </div>
    </PageShell>
  )
}
