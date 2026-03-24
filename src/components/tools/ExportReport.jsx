import { useMemo, useRef } from 'react'
import { useStore } from '../../store/useStore.js'
import { MAJORS } from '../../data/salaries.js'
import { calculateSalary, salaryBreakdown, formatCurrency, calculateLoan, calculateROI } from '../../lib/calculations.js'
import { TIER_LABELS } from '../../data/salaries.js'
import { INCOME_BRACKETS } from '../../data/colleges.js'
import CollegeSearch from '../ui/CollegeSearch.jsx'
import Select from '../ui/Select.jsx'
import { AREA_MULTIPLIERS, EXPERIENCE_MULTIPLIERS } from '../../data/salaries.js'

const AREA_OPTIONS = Object.keys(AREA_MULTIPLIERS).map(a => ({ value: a, label: a }))
const EXP_OPTIONS  = Object.keys(EXPERIENCE_MULTIPLIERS).map(e => ({ value: e, label: e }))
const INCOME_OPTIONS = INCOME_BRACKETS.map(b => ({ value: b.key, label: b.label }))

const VERDICT_COLOR = {
  Comfortable: 'text-emerald-700',
  Manageable:  'text-yellow-700',
  Tight:       'text-orange-600',
  'At Risk':   'text-red-600',
}
const VERDICT_BG = {
  Comfortable: 'bg-emerald-50 border-emerald-200',
  Manageable:  'bg-yellow-50 border-yellow-200',
  Tight:       'bg-orange-50 border-orange-200',
  'At Risk':   'bg-red-50 border-red-200',
}

const DEFAULT_MONTHLY_LIVING = 2100

export default function ExportReport() {
  const {
    college, setCollege,
    major, setMajor,
    job, setJob,
    area, setArea,
    experience, setExperience,
    incomeKey, setIncomeKey,
  } = useStore()
  const reportRef = useRef(null)

  const majorObj = MAJORS.find(m => m.id === major)
  const jobObj   = majorObj?.jobs.find(j => j.id === job)
  const majorOptions = MAJORS.map(m => ({ value: m.id, label: m.name }))
  const jobOptions   = majorObj?.jobs.map(j => ({ value: j.id, label: j.title })) ?? []

  const salary = useMemo(() => calculateSalary({ college, job: jobObj, area, experience }), [college, jobObj, area, experience])
  const { monthly, weekly, hourly } = salaryBreakdown(salary)

  const loan = useMemo(() => calculateLoan({ college, incomeKey }), [college, incomeKey])

  const roi = useMemo(() => {
    if (!salary || !loan) return null
    return calculateROI({
      annualSalary: salary,
      loanAmount: loan.totalLoan4Year,
      interestRate: loan.blendedRate * 100,
      monthlyLiving: DEFAULT_MONTHLY_LIVING,
    })
  }, [salary, loan])

  const incomeLabel = INCOME_BRACKETS.find(b => b.key === incomeKey)?.label ?? '—'
  const canExport = college && jobObj && salary

  function handlePrint() {
    window.print()
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black text-gray-800" style={{ fontFamily: "'Syne', sans-serif" }}>Export Report</h2>
        <p className="text-gray-500 text-sm mt-1">Generate a printable summary for counseling sessions or sharing with parents. Includes salary, loan estimate, and ROI verdict.</p>
      </div>

      {/* Inputs */}
      <div className="grid gap-4 no-print">
        <CollegeSearch value={college} onChange={setCollege} />
        <Select label="Family Annual Income" value={incomeKey} onChange={setIncomeKey} options={INCOME_OPTIONS} placeholder="Select income bracket" />
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
          <h3 className="text-lg font-bold text-teal-100">College &amp; Career Financial Summary</h3>
        </div>

        {/* Profile */}
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-100">
          <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Student Profile</p>
          <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-sm">
            <ProfileRow label="College" value={college?.name ?? '—'} />
            <ProfileRow label="Location" value={college ? `${college.city}, ${college.state}` : '—'} />
            <ProfileRow label="College Tier" value={college ? TIER_LABELS[college.tier] : '—'} />
            <ProfileRow label="Family Income" value={incomeLabel} />
            <ProfileRow label="Major" value={majorObj?.name ?? '—'} />
            <ProfileRow label="Job Title" value={jobObj?.title ?? '—'} />
            <ProfileRow label="Area of Work" value={area} />
            <ProfileRow label="Experience Level" value={experience} />
          </div>
        </div>

        {/* Salary Section */}
        {salary ? (
          <div className="px-6 py-5 border-b border-gray-100">
            <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3">Estimated Starting Salary</p>
            <div className="text-4xl font-black text-gray-900 mb-1">{formatCurrency(salary)}</div>
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
          <div className="px-6 py-6 text-center text-gray-500 text-sm border-b border-gray-100">
            Complete major and job title above to generate salary estimate.
          </div>
        )}

        {/* Loan Section */}
        {loan ? (
          <div className="px-6 py-5 border-b border-gray-100">
            <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3">Estimated Loan Burden at Graduation</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-2xl font-black text-gray-800">{formatCurrency(loan.totalLoan4Year)}</div>
                <div className="text-xs text-gray-500 mt-0.5">Total 4-year loan (est.)</div>
              </div>
              <div>
                <div className="text-2xl font-black text-gray-800">{formatCurrency(loan.monthlyPayment)}</div>
                <div className="text-xs text-gray-500 mt-0.5">Monthly payment (10-yr standard)</div>
              </div>
              <div>
                <div className="text-lg font-bold text-gray-700">{formatCurrency(loan.netPricePerYear)}/yr</div>
                <div className="text-xs text-gray-500 mt-0.5">Net price after aid</div>
              </div>
              <div>
                <div className="text-lg font-bold text-gray-700">{formatCurrency(loan.totalInterest)}</div>
                <div className="text-xs text-gray-500 mt-0.5">Total interest over 10 years</div>
              </div>
            </div>
          </div>
        ) : (
          <div className="px-6 py-6 text-center text-gray-500 text-sm border-b border-gray-100">
            Select a family income bracket to see loan estimate.
          </div>
        )}

        {/* ROI Verdict */}
        {roi ? (
          <div className="px-6 py-5 border-b border-gray-100">
            <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3">Monthly Budget After Graduation</p>
            <div className={`rounded-xl border p-4 mb-3 ${VERDICT_BG[roi.verdict]}`}>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">ROI Verdict</span>
                <span className={`text-xl font-black ${VERDICT_COLOR[roi.verdict]}`}>{roi.verdict}</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {roi.monthlyDisposable >= 0
                  ? `${formatCurrency(roi.monthlyDisposable)}/mo remaining after loan payment + est. living costs`
                  : `${formatCurrency(Math.abs(roi.monthlyDisposable))}/mo short — loan + living costs exceed take-home pay`
                }
              </p>
            </div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
              <ProfileRow label="Take-home pay" value={`${formatCurrency(roi.monthlyTakeHome)}/mo`} />
              <ProfileRow label="Loan payment" value={`${formatCurrency(roi.monthlyPayment)}/mo`} />
              <ProfileRow label="Est. living expenses" value={`${formatCurrency(DEFAULT_MONTHLY_LIVING)}/mo`} />
              <ProfileRow label="Disposable income" value={`${formatCurrency(roi.monthlyDisposable)}/mo`} />
            </div>
            <p className="text-xs text-gray-400 mt-2">
              Living expenses use a national default of {formatCurrency(DEFAULT_MONTHLY_LIVING)}/mo. Tax uses national avg effective rate. Actual figures vary by state and lifestyle.
            </p>
          </div>
        ) : null}

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
          <p className="text-xs text-gray-500 leading-relaxed">
            <span className="font-semibold text-gray-500">Data sources:</span> BLS National OES · College Scorecard · IPEDS · Federal Student Aid · Glassdoor · Salary.com
          </p>
          <p className="text-xs text-gray-500 mt-1 leading-relaxed">
            All figures are estimates based on publicly available U.S. market data. Tax uses national average effective rate — varies by state. Loan models 10-year standard repayment; income-driven repayment (IDR) plans may lower monthly payments. For educational purposes only. Not financial or career advice.
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
