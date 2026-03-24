import { useMemo } from 'react'
import { useStore } from '../../store/useStore.js'
import { MAJORS } from '../../data/salaries.js'
import { generateScenarios, formatCurrency, formatPct } from '../../lib/calculations.js'
import CollegeSearch from '../ui/CollegeSearch.jsx'
import Select from '../ui/Select.jsx'

const EXP_ORDER = ['Entry', 'Early Career', 'Experienced', 'Veteran']
const AREA_ORDER = ['Urban', 'Suburban', 'Rural']

const AREA_ICONS = { Urban: '🏙', Suburban: '🏘', Rural: '🌾' }

export default function WhatIfScenarios() {
  const { college, setCollege, major, setMajor, job, setJob } = useStore()

  const majorObj = MAJORS.find(m => m.id === major)
  const jobObj   = majorObj?.jobs.find(j => j.id === job)
  const majorOptions = MAJORS.map(m => ({ value: m.id, label: m.name }))
  const jobOptions   = majorObj?.jobs.map(j => ({ value: j.id, label: j.title })) ?? []

  const scenarios = useMemo(() =>
    generateScenarios({ college, job: jobObj }),
    [college, jobObj]
  )

  // Group by experience for the grid
  const byExp = EXP_ORDER.map(exp => ({
    exp,
    areas: AREA_ORDER.map(area => scenarios.find(s => s.experience === exp && s.area === area)).filter(Boolean)
  }))

  const hasResults = scenarios.length > 0

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black text-gray-800" style={{ fontFamily: "'Syne', sans-serif" }}>What-If Scenarios</h2>
        <p className="text-gray-500 text-sm mt-1">See all location × experience combinations at once — your full career salary picture.</p>
      </div>

      <div className="grid gap-4">
        <CollegeSearch value={college} onChange={setCollege} />
        <Select label="Major" value={major} onChange={v => setMajor(v)} options={majorOptions} placeholder="Select a major" />
        {major && <Select label="Job Title" value={job} onChange={setJob} options={jobOptions} placeholder="Select a job title" />}
      </div>

      {hasResults ? (
        <div className="space-y-4 animate-fade-up">
          {/* Area header */}
          <div className="grid grid-cols-3 gap-2 px-1">
            {AREA_ORDER.map(a => (
              <div key={a} className="text-center text-xs font-bold uppercase tracking-widest text-gray-500">
                {AREA_ICONS[a]} {a}
              </div>
            ))}
          </div>

          {/* Scenario grid: 4 rows × 3 cols */}
          {byExp.map(({ exp, areas }, rowIdx) => (
            <div key={exp}>
              <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">{exp}</p>
              <div className="grid grid-cols-3 gap-2">
                {areas.map(({ area, salary, pctChange }) => {
                  const isBase = exp === 'Entry' && area === 'Suburban'
                  const isPositive = pctChange > 0
                  const isNegative = pctChange < 0
                  return (
                    <div
                      key={area}
                      className={`rounded-xl p-3.5 border transition-all ${
                        isBase
                          ? 'bg-teal-50 border-teal-200'
                          : 'bg-white border-gray-100 hover:border-gray-200 hover:shadow-sm'
                      }`}
                    >
                      <div className={`text-lg font-black leading-tight ${isBase ? 'text-teal-700' : 'text-gray-800'}`}>
                        {formatCurrency(salary, true)}
                      </div>
                      {!isBase && (
                        <div className={`text-xs font-semibold mt-1 ${isPositive ? 'text-emerald-600' : isNegative ? 'text-red-500' : 'text-gray-500'}`}>
                          {formatPct(pctChange)}
                        </div>
                      )}
                      {isBase && (
                        <div className="text-xs text-teal-500 font-medium mt-1">baseline</div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}

          <div className="bg-gray-50 rounded-2xl border border-gray-100 p-4 text-xs text-gray-500 space-y-2">
            <p className="font-semibold text-gray-600 text-sm">How to read this grid</p>
            <p>Each cell shows your estimated salary for one combination of career stage and location. The <span className="text-teal-600 font-semibold">teal baseline</span> is Entry level in a Suburban area — the most common starting point for recent graduates. Every other cell shows the percentage change from that baseline.</p>
            <p><span className="font-semibold text-gray-600">Urban vs. Rural:</span> Urban salaries are higher, but so is the cost of living. A rural salary that looks lower on paper may actually leave you with more disposable income once rent and transportation are factored in. Use the Loan ROI tool to compare real take-home after expenses.</p>
            <p><span className="font-semibold text-gray-600">Experience levels:</span> Entry is 0–2 years. Early Career is 2–5 years. Experienced is 5–10 years. Veteran is 10+ years. The jumps between levels reflect typical raises and promotions in this field — they're not guaranteed and vary significantly by employer.</p>
            <p className="text-gray-400">All figures are gross income estimates based on BLS national data. Actual earnings vary by employer, negotiation, and local market conditions.</p>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl bg-gray-50 border border-gray-100 p-8 text-center">
          <div className="text-4xl mb-3">◫</div>
          <p className="text-gray-500 text-sm">Select a college, major, and job title to generate all 12 scenarios.</p>
        </div>
      )}

      <div className="text-xs text-gray-500 border-t pt-4">
        <p>BLS OES · Salary.com · BEA Regional Data. All figures are gross income estimates.</p>
      </div>
    </div>
  )
}
