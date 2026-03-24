import { useState, useMemo, useEffect } from 'react'
import { useStore } from '../../store/useStore.js'
import { MAJORS, AREA_MULTIPLIERS, EXPERIENCE_MULTIPLIERS } from '../../data/salaries.js'
import { calculateSalary, calculateROI, formatCurrency, formatPct } from '../../lib/calculations.js'
import CollegeSearch from '../ui/CollegeSearch.jsx'
import Select from '../ui/Select.jsx'

const AREA_OPTIONS = Object.keys(AREA_MULTIPLIERS).map(a => ({ value: a, label: a }))
const EXP_OPTIONS  = Object.keys(EXPERIENCE_MULTIPLIERS).map(e => ({ value: e, label: e }))

const VERDICT_STYLES = {
  Comfortable: 'bg-emerald-50 border-emerald-200 text-emerald-800',
  Manageable:  'bg-yellow-50 border-yellow-200 text-yellow-800',
  Tight:       'bg-orange-50 border-orange-200 text-orange-800',
  'At Risk':   'bg-red-50 border-red-200 text-red-800',
}
const VERDICT_BAR = {
  Comfortable: 'bg-emerald-500',
  Manageable:  'bg-yellow-400',
  Tight:       'bg-orange-400',
  'At Risk':   'bg-red-500',
}

export default function LoanROI() {
  const { college, setCollege, major, setMajor, job, setJob, area, setArea, experience, setExperience, loanSnapshot } = useStore()

  const [loanAmount, setLoanAmount]     = useState(38000)
  const [interestRate, setInterestRate] = useState(6.53)
  const [monthlyLiving, setMonthlyLiving] = useState(2100)

  // Smart Auto-Fill from Loan Estimator
  useEffect(() => {
    if (loanSnapshot) {
      setLoanAmount(loanSnapshot.loanAmount || 38000)
      setInterestRate(parseFloat(loanSnapshot.interestRate) || 6.53)
      if (loanSnapshot.college) setCollege(loanSnapshot.college)
    }
  }, [loanSnapshot])

  const majorObj = MAJORS.find(m => m.id === major)
  const jobObj   = majorObj?.jobs.find(j => j.id === job)
  const majorOptions = MAJORS.map(m => ({ value: m.id, label: m.name }))
  const jobOptions   = majorObj?.jobs.map(j => ({ value: j.id, label: j.title })) ?? []

  const annualSalary = useMemo(() =>
    calculateSalary({ college, job: jobObj, area, experience }),
    [college, jobObj, area, experience]
  )

  const roi = useMemo(() =>
    calculateROI({ annualSalary, loanAmount, interestRate, monthlyLiving }),
    [annualSalary, loanAmount, interestRate, monthlyLiving]
  )

  const barWidth = roi ? Math.max(0, Math.min(100, (roi.monthlyDisposable / roi.monthlyTakeHome) * 100)) : 0

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black text-gray-800" style={{ fontFamily: "'Syne', sans-serif" }}>Loan ROI Calculator</h2>
        <p className="text-gray-500 text-sm mt-1">See if your salary can comfortably cover loan payments and living expenses.</p>
      </div>

      {loanSnapshot && (
        <div className="flex items-center gap-2 bg-teal-50 border border-teal-200 rounded-xl px-4 py-2.5">
          <svg className="w-4 h-4 text-teal-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          <span className="text-sm text-teal-700 font-medium">Auto-filled from Loan Estimator</span>
        </div>
      )}

      {/* Salary inputs */}
      <div className="grid gap-4">
        <CollegeSearch value={college} onChange={setCollege} />
        <Select label="Major" value={major} onChange={v => { setMajor(v) }} options={majorOptions} placeholder="Select a major" />
        {major && <Select label="Job Title" value={job} onChange={setJob} options={jobOptions} placeholder="Select a job title" />}
        <div className="grid grid-cols-2 gap-4">
          <Select label="Area of Work" value={area} onChange={setArea} options={AREA_OPTIONS} />
          <Select label="Experience" value={experience} onChange={setExperience} options={EXP_OPTIONS} />
        </div>
      </div>

      {/* Loan inputs */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
        <p className="text-xs font-bold uppercase tracking-widest text-gray-500">Loan Details</p>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="input-label">Loan Amount ($)</label>
            <input
              type="number"
              value={loanAmount}
              onChange={e => setLoanAmount(Number(e.target.value))}
              className="input-field"
              min={0} max={500000} step={1000}
            />
          </div>
          <div>
            <label className="input-label">Interest Rate (%)</label>
            <input
              type="number"
              value={interestRate}
              onChange={e => setInterestRate(Number(e.target.value))}
              className="input-field"
              min={0} max={20} step={0.01}
            />
          </div>
        </div>
        <div>
          <label className="input-label">Monthly Living Expenses ($)</label>
          <input
            type="number"
            value={monthlyLiving}
            onChange={e => setMonthlyLiving(Number(e.target.value))}
            className="input-field"
            min={0} step={100}
          />
        </div>
      </div>

      {/* Results */}
      {roi ? (
        <div className="space-y-4 animate-fade-up">
          {/* Monthly breakdown */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-0">
            <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3">Monthly Breakdown</p>
            <div className="data-row">
              <span className="text-sm text-gray-600">Gross income</span>
              <span className="text-sm font-semibold text-gray-800">{formatCurrency(roi.monthlyGross)}</span>
            </div>
            <div className="data-row">
              <span className="text-sm text-gray-600">Federal income tax (~{Math.round(roi.taxes.federalEffective * 100)}%)</span>
              <span className="text-sm font-semibold text-red-500">−{formatCurrency(roi.taxes.monthlyFederal)}</span>
            </div>
            <div className="data-row">
              <span className="text-sm text-gray-600">FICA (SS + Medicare, 7.65%)</span>
              <span className="text-sm font-semibold text-red-500">−{formatCurrency(roi.taxes.monthlyFica)}</span>
            </div>
            <div className="data-row">
              <span className="text-sm text-gray-600">State income tax (~{Math.round(roi.taxes.stateRate * 100)}% avg)</span>
              <span className="text-sm font-semibold text-red-500">−{formatCurrency(roi.taxes.monthlyState)}</span>
            </div>
            <div className="data-row">
              <span className="text-sm text-gray-600">Take-home pay</span>
              <span className="text-sm font-bold text-gray-800">{formatCurrency(roi.monthlyTakeHome)}</span>
            </div>
            <div className="data-row">
              <span className="text-sm text-gray-600">Loan payment</span>
              <span className="text-sm font-semibold text-orange-600">−{formatCurrency(roi.monthlyPayment)}</span>
            </div>
            <div className="data-row">
              <span className="text-sm text-gray-600">Living expenses</span>
              <span className="text-sm font-semibold text-orange-600">−{formatCurrency(roi.monthlyLiving)}</span>
            </div>
            <div className="flex justify-between items-center pt-3 mt-1 border-t border-gray-100">
              <span className="text-sm font-bold text-gray-700">Monthly disposable</span>
              <span className={`text-lg font-black ${roi.monthlyDisposable >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {formatCurrency(roi.monthlyDisposable)}
              </span>
            </div>
          </div>

          {/* Verdict */}
          <div className={`rounded-2xl border-2 p-5 ${VERDICT_STYLES[roi.verdict]}`}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium opacity-70">ROI Verdict</span>
              <span className="text-xl font-black">{roi.verdict}</span>
            </div>
            <div className="h-2 rounded-full bg-black/10 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${VERDICT_BAR[roi.verdict]}`}
                style={{ width: `${barWidth}%` }}
              />
            </div>
            <p className="text-xs mt-2 opacity-60">
              {roi.monthlyDisposable >= 0
                ? `${formatCurrency(roi.monthlyDisposable)}/mo left after loan + living costs`
                : `${formatCurrency(Math.abs(roi.monthlyDisposable))}/mo short — loan + expenses exceed take-home`
              }
            </p>
          </div>
          {/* Verdict explanation */}
          <div className="bg-gray-50 rounded-2xl border border-gray-100 p-4 text-xs text-gray-500 space-y-2">
            <p className="font-semibold text-gray-600 text-sm">What does your verdict mean?</p>
            <div className="space-y-1.5">
              <p><span className="font-semibold text-emerald-600">Comfortable (30%+ left over)</span> — Your salary comfortably covers your loan and living costs with meaningful money to save or invest each month.</p>
              <p><span className="font-semibold text-yellow-600">Manageable (15–30% left over)</span> — You can cover your costs, but your budget is tight. One unexpected expense could create stress. Building an emergency fund should be a priority.</p>
              <p><span className="font-semibold text-orange-600">Tight (0–15% left over)</span> — You can technically make payments, but there's very little margin. Consider whether income-driven repayment (IDR) could lower your monthly payment.</p>
              <p><span className="font-semibold text-red-600">At Risk (negative)</span> — Your estimated take-home doesn't cover your loan payment and living costs. This doesn't mean the path is impossible — IDR plans can cap payments at 5–10% of discretionary income — but it's a serious signal to explore alternatives.</p>
            </div>
            <p className="text-gray-400 pt-1">
              <span className="font-semibold">Debt-to-income ratio</span> is the percentage of your gross monthly income that goes toward loan payments. Lenders and financial planners generally consider under 10% healthy; above 20% is considered a strain.
            </p>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl bg-gray-50 border border-gray-100 p-8 text-center">
          <div className="text-4xl mb-3">◎</div>
          <p className="text-gray-500 text-sm">Complete the salary inputs above to see your ROI assessment.</p>
        </div>
      )}

      <div className="text-xs text-gray-500 border-t pt-4 space-y-2">
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          <p className="font-semibold text-amber-800 mb-1">⚠ Tax estimate note</p>
          <p className="text-amber-700 leading-relaxed">
            Federal income tax uses 2024 brackets (single filer, $14,600 standard deduction). FICA (Social Security + Medicare)
            is a flat 7.65%. State tax uses a national population-weighted average effective rate — students in no-income-tax
            states (TX, FL, WA, etc.) will take home 2–5% more than shown; those in CA, NY, or NJ will take home less.
          </p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
          <p className="font-semibold text-blue-800 mb-1">ℹ Income-driven repayment (IDR)</p>
          <p className="text-blue-700 leading-relaxed">
            This tool models standard 10-year repayment only. If your loan burden looks Tight or At Risk,
            income-driven repayment plans (IBR, SAVE, PAYE) can significantly lower your monthly payment.
            Students in public service careers may also qualify for{' '}
            <a
              href="https://studentaid.gov/manage-loans/forgiveness-cancellation/public-service"
              target="_blank"
              rel="noopener noreferrer"
              className="underline text-blue-600"
            >
              Public Service Loan Forgiveness
            </a>
            . Visit{' '}
            <a
              href="https://studentaid.gov/idr"
              target="_blank"
              rel="noopener noreferrer"
              className="underline text-blue-600"
            >
              studentaid.gov/idr
            </a>{' '}
            to learn more.
          </p>
        </div>
        <p className="text-gray-400">For educational purposes only. Not financial advice.</p>
      </div>
    </div>
  )
}
