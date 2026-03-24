import { useStore } from './store/useStore.js'
import PredictIncome from './components/tools/PredictIncome.jsx'
import LoanEstimator from './components/tools/LoanEstimator.jsx'
import CompareSchools from './components/tools/CompareSchools.jsx'
import LoanROI from './components/tools/LoanROI.jsx'
import WhatIfScenarios from './components/tools/WhatIfScenarios.jsx'
import ExportReport from './components/tools/ExportReport.jsx'

const TOOLS = [
  { id: 'predict', label: 'Predict Income',    icon: '◈', group: 'tools' },
  { id: 'loan',    label: 'Loan Estimator',    icon: '◉', group: 'tools' },
  { id: 'compare', label: 'Compare Schools',   icon: '⇄', group: 'tools' },
  { id: 'roi',     label: 'Loan ROI',          icon: '◎', group: 'tools' },
  { id: 'whatif',  label: 'What-If Scenarios', icon: '◫', group: 'tools' },
  { id: 'export',  label: 'Export Report',     icon: '↗', group: 'more'  },
]

const TOOL_COMPONENTS = {
  predict: PredictIncome,
  loan:    LoanEstimator,
  compare: CompareSchools,
  roi:     LoanROI,
  whatif:  WhatIfScenarios,
  export:  ExportReport,
}

export default function App() {
  const { activeTool, setActiveTool } = useStore()
  const ActiveComponent = TOOL_COMPONENTS[activeTool] || PredictIncome

  function navigate(id) {
    setActiveTool(id)
    // Scroll the widget's own content area to top, not the host page
    document.getElementById('careeriq-content')?.scrollTo({ top: 0, behavior: 'smooth' })
    // Tell the host page our new height after nav
    notifyHeight()
  }

  function notifyHeight() {
    const h = document.documentElement.scrollHeight
    window.parent?.postMessage({ type: 'careeriq:resize', height: h }, '*')
  }

  const toolItems = TOOLS.filter(t => t.group === 'tools')
  const moreItems = TOOLS.filter(t => t.group === 'more')

  return (
    /*
      This root div IS the widget. It has no viewport assumptions —
      it sizes to its own content. The host page's iFrame or div
      determines the outer container size.
    */
    <div
      className="flex bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
      style={{ minHeight: '600px', fontFamily: "'DM Sans', system-ui, sans-serif" }}
    >
      {/* Left sidebar — fixed within the widget */}
      <aside className="w-52 shrink-0 border-r border-gray-100 bg-white flex flex-col">
        {/* Logo */}
        <div className="px-5 pt-6 pb-5 border-b border-gray-100">
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center shadow-sm shrink-0">
              <span className="text-white font-black text-xs" style={{ fontFamily: "'Syne', sans-serif" }}>IQ</span>
            </div>
            <div className="font-black text-gray-800 leading-none" style={{ fontFamily: "'Syne', sans-serif", fontSize: '18px' }}>
              CareerIQ
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2 leading-relaxed">College Income &amp; Loan ROI Predictor</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 overflow-auto">
          <p className="text-xs font-bold uppercase tracking-widest text-gray-500 px-2 mb-2">Tools</p>
          {toolItems.map(t => (
            <NavButton key={t.id} tool={t} active={activeTool === t.id} onNavigate={navigate} />
          ))}
          <p className="text-xs font-bold uppercase tracking-widest text-gray-500 px-2 mt-5 mb-2">More</p>
          {moreItems.map(t => (
            <NavButton key={t.id} tool={t} active={activeTool === t.id} onNavigate={navigate} />
          ))}
        </nav>

        {/* Attribution — required by CC BY 4.0 */}
        <div className="px-4 py-3 border-t border-gray-100">
          <p className="text-xs text-gray-500 leading-snug">Free for nonprofit &amp; classroom use</p>
          <p className="text-xs text-gray-500 mt-0.5">CC BY 4.0 · Advaith Ramanan</p>
        </div>
      </aside>

      {/* Main content area — scrolls independently inside the widget */}
      <main
        id="careeriq-content"
        className="flex-1 overflow-auto bg-gray-50"
      >
        <div className="max-w-xl mx-auto px-6 py-7">
          <div key={activeTool} className="animate-fade-up">
            <ActiveComponent />
          </div>
        </div>
      </main>
    </div>
  )
}

function NavButton({ tool, active, onNavigate }) {
  return (
    <button
      onClick={() => onNavigate(tool.id)}
      className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-sm font-medium transition-all duration-200 mb-0.5 text-left ${
        active
          ? 'bg-teal-50 text-teal-700'
          : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
      }`}
    >
      <span className={`text-base leading-none w-5 text-center shrink-0 ${active ? 'text-teal-700' : 'text-gray-500'}`}>
        {tool.icon}
      </span>
      <span className="text-xs">{tool.label}</span>
      {active && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-teal-500 shrink-0" />}
    </button>
  )
}
