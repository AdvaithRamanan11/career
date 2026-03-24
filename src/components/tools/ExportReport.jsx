import { useMemo, useRef } from 'react'
import { useStore } from '../../store/useStore.js'
import { MAJORS } from '../../data/salaries.js'
import { calculateSalary, salaryBreakdown, formatCurrency } from '../../lib/calculations.js'
import { TIER_LABELS } from '../../data/salaries.js'
import CollegeSearch from '../ui/CollegeSearch.jsx'
import Select from '../ui/Select.jsx'
import { AREA_MULTIPLIERS, EXPERIENCE_MULTIPLIERS } from '../../data/salaries.js'

const AREA_OPTIONS = Object.keys(AREA_MULTIPLIERS).map(a => ({ value: a, label: a }))
const EXP_OPTIONS  = Object.keys(EXPERIENCE_MULTIPLIERS).map(e => ({ value: e, label: e }))

export default function ExportReport() {
  const { college, setCollege, major, setMajor, job, setJob, area, setArea, experience, setExperience } = useStore()
  const reportRef = useRef(null)

  const majorObj = MAJORS.find(m => m.id === major)
  const jobObj   = majorObj?.jobs.find(j => j.id === job)
  const majorOptions = MAJORS.map(m => ({ value: m.id, label: m.name }))
  const jobOptions   = majorObj?.jobs.map(j => ({ value: j.id, label: j.title })) ?? []

  const salary = useMemo(() => calculateSalary({ college, job: jobObj, area, experience }), [college, jobObj, area, experience])
  const { monthly, weekly, hourly } = salaryBreakdown(salary)

  const canExport = college && jobObj && salary

  function handlePrint() {
    window.print()
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black text-gray-800" style={{ fontFamily: "'Syne', sans-serif" }}>Export Report</h2>
        <p className="text-gray-500 text-sm mt-1">Generate a printable one-page summary for counseling sessions or sharing with parents.</p>
      </div>

      {/* Inputs */}
      <div className="grid gap-4 no-print">
        <CollegeSearch value={college} onChange={setCollege} />
        <Select label="Major" value={major} onChange={v => setMajor(v)} options={majorOptions} placeholder="Select a major" />
        {major && <Select label="Job Title" value={job} onChange={setJob} options={jobOptions} placeholder="Select a job title" />}
        <div className="grid grid-cols-2 gap-4">
          <Select label="Area of Work" value={area} onChange={setArea} options={AREA_OPTIONS} />
          <Select label="Experience" value={experience} onChange={setExperience} options={EXP_OPTIONS} />
        </div>
      </div>

      {/* Preview card */}
      <div ref={reportRef} className="bg-white rounded-2xl border border-gray-200 overflow-hidden print-card">
        {/* Report header */}
        <div className="bg-gradient-to-br from-teal-600 to-teal-800 px-6 py-5 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                <span className="text-white font-black text-xs" style={{ fontFamily: "'Syne', sans-serif" }}>IQ</span>
              </div>
              <span className="font-black" style={{ fontFamily: "'Syne', sans-serif" }}>CareerIQ</span>
            </div>
            <span className="text-xs bg-white/20 px-2 py-1 rounded-full text-teal-100 font-medium">NATIONAL 2024–2026</span>
          </div>
          <h3 className="text-lg font-bold text-teal-100">Income Prediction Report</h3>
        </div>

        {/* Profile */}
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-100">
          <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Student Profile</p>
          <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-sm">
            <ProfileRow label="College" value={college?.name ?? '—'} />
            <ProfileRow label="State" value={college ? `${college.city}, ${college.state}` : '—'} />
            <ProfileRow label="Tier" value={college ? TIER_LABELS[college.tier] : '—'} />
            <ProfileRow label="Major" value={majorObj?.name ?? '—'} />
            <ProfileRow label="Job Title" value={jobObj?.title ?? '—'} />
            <ProfileRow label="Area of Work" value={area} />
            <ProfileRow label="Experience Level" value={experience} />
          </div>
        </div>

        {/* Salary results */}
        {salary ? (
          <div className="px-6 py-5">
            <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-4">Estimated Salary</p>
            <div className="text-5xl font-black text-gray-900 mb-1">{formatCurrency(salary)}</div>
            <p className="text-gray-500 text-sm mb-4">Estimated annual gross income</p>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Monthly', value: monthly },
                { label: 'Weekly',  value: weekly  },
                { label: 'Hourly',  value: hourly  },
              ].map(({ label, value }) => (
                <div key={label} className="bg-gray-50 rounded-xl p-3 text-center">
                  <div className="font-bold text-gray-800">{formatCurrency(value)}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{label}</div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="px-6 py-8 text-center text-gray-500 text-sm">
            Complete the profile above to generate your salary estimate.
          </div>
        )}

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
          <p className="text-xs text-gray-500 leading-relaxed">
            <span className="font-semibold text-gray-500">Data sources:</span> BLS National OES · College Scorecard · IPEDS · Glassdoor · Levels.fyi · NALP · Salary.com
          </p>
          <p className="text-xs text-gray-500 mt-1 leading-relaxed">
            All figures represent estimated gross income based on publicly available U.S. market data. For educational and informational purposes only. Not financial or career advice.
          </p>
          <p className="text-xs text-gray-500 mt-2">CareerIQ · CC BY 4.0 · Advaith Ramanan · advaithramanan11.github.io/career</p>
        </div>
      </div>

      {/* Action buttons */}
      <div className="grid gap-3 no-print">
        <button
          onClick={handlePrint}
          disabled={!canExport}
          className={`btn-primary ${!canExport ? 'opacity-40 cursor-not-allowed' : ''}`}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
          Print / Save as PDF
        </button>
        {!canExport && (
          <p className="text-xs text-center text-gray-500">Complete college, major, and job title to enable export.</p>
        )}
      </div>

      <div className="text-xs text-gray-500 border-t pt-4 no-print">
        <p>Use your browser's Print dialog to save as PDF. Works in Chrome, Firefox, Safari, and Edge.</p>
      </div>
    </div>
  )
}

function ProfileRow({ label, value }) {
  return (
    <div>
      <span className="text-gray-500">{label}: </span>
      <span className="font-medium text-gray-700">{value}</span>
    </div>
  )
}
