import { useMemo } from 'react'
import { useStore } from '../../store/useStore.js'
import { MAJORS, AREA_MULTIPLIERS, EXPERIENCE_MULTIPLIERS } from '../../data/salaries.js'
import { compareSchools, formatCurrency, formatPct } from '../../lib/calculations.js'
import { useState } from 'react'
import { COLLEGES } from '../../data/colleges.js'
import CollegeSearch from '../ui/CollegeSearch.jsx'
import Select from '../ui/Select.jsx'

const AREA_OPTIONS = Object.keys(AREA_MULTIPLIERS).map(a => ({ value: a, label: a }))
const EXP_OPTIONS  = Object.keys(EXPERIENCE_MULTIPLIERS).map(e => ({ value: e, label: e }))

export default function CompareSchools() {
  const { major, setMajor, job, setJob, area, setArea, experience, setExperience } = useStore()
  const [schoolA, setSchoolA] = useState(null)
  const [schoolB, setSchoolB] = useState(null)

  const majorObj = MAJORS.find(m => m.id === major)
  const jobObj   = majorObj?.jobs.find(j => j.id === job)

  const majorOptions = MAJORS.map(m => ({ value: m.id, label: m.name }))
  const jobOptions   = majorObj?.jobs.map(j => ({ value: j.id, label: j.title })) ?? []

  const result = useMemo(() =>
    compareSchools({ collegeA: schoolA, collegeB: schoolB, job: jobObj, area, experience }),
    [schoolA, schoolB, jobObj, area, experience]
  )

  const winner = result ? (result.salaryA >= result.salaryB ? 'A' : 'B') : null

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black text-gray-800" style={{ fontFamily: "'Syne', sans-serif" }}>Compare Schools</h2>
        <p className="text-gray-500 text-sm mt-1">Side-by-side salary and lifetime earnings for any two U.S. colleges.</p>
      </div>

      {/* Shared inputs */}
      <div className="grid gap-4">
        <Select label="Major" value={major} onChange={v => { setMajor(v) }} options={majorOptions} placeholder="Select a major" />
        {major && <Select label="Job Title" value={job} onChange={setJob} options={jobOptions} placeholder="Select a job title" />}
        <div className="grid grid-cols-2 gap-4">
          <Select label="Area of Work" value={area} onChange={setArea} options={AREA_OPTIONS} />
          <Select label="Experience" value={experience} onChange={setExperience} options={EXP_OPTIONS} />
        </div>
      </div>

      {/* School pickers */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="bg-white rounded-2xl border-2 border-gray-100 p-4">
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">School A</p>
          <CollegeSearch value={schoolA} onChange={setSchoolA} label="" />
        </div>
        <div className="bg-white rounded-2xl border-2 border-gray-100 p-4">
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">School B</p>
          <CollegeSearch value={schoolB} onChange={setSchoolB} label="" />
        </div>
      </div>

      {/* Results */}
      {result ? (
        <div className="space-y-4 animate-fade-up">
          {/* Salary comparison */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { school: schoolA, salary: result.salaryA, lifetime: result.lifetimeA, side: 'A' },
              { school: schoolB, salary: result.salaryB, lifetime: result.lifetimeB, side: 'B' },
            ].map(({ school, salary, lifetime, side }) => (
              <div
                key={side}
                className={`rounded-2xl p-5 border-2 transition-all ${
                  winner === side
                    ? 'bg-gradient-to-br from-teal-500 to-teal-700 border-teal-400 text-white'
                    : 'bg-white border-gray-100'
                }`}
              >
                {winner === side && (
                  <div className="text-xs font-bold uppercase tracking-widest text-teal-200 mb-2">Higher earning</div>
                )}
                <div className="text-xs font-medium text-gray-400 mb-1 truncate" style={{ color: winner === side ? 'rgba(255,255,255,0.7)' : undefined }}>
                  {school?.name}
                </div>
                <div className={`text-3xl font-black mb-1 ${winner === side ? 'text-white' : 'text-gray-800'}`}>
                  {formatCurrency(salary)}
                </div>
                <div className={`text-xs ${winner === side ? 'text-teal-200' : 'text-gray-400'}`}>Annual est. salary</div>
                <div className={`mt-3 pt-3 border-t ${winner === side ? 'border-teal-400' : 'border-gray-100'}`}>
                  <div className={`text-sm font-bold ${winner === side ? 'text-white' : 'text-gray-700'}`}>{formatCurrency(lifetime, true)}</div>
                  <div className={`text-xs ${winner === side ? 'text-teal-200' : 'text-gray-400'}`}>30-yr lifetime earnings</div>
                </div>
              </div>
            ))}
          </div>

          {/* Delta summary */}
          <div className="bg-gray-50 rounded-2xl p-4 text-center border border-gray-100">
            <div className="text-2xl font-black text-gray-800">{formatPct(result.pctDiff)}</div>
            <div className="text-sm text-gray-500 mt-1">salary difference between schools</div>
            <div className="text-xs text-gray-400 mt-2">
              {formatCurrency(Math.abs(result.lifetimeDiff))} lifetime earnings gap (flat projection)
            </div>
            <div className="text-xs text-gray-300 mt-1">
              Actual earnings likely 30–40% higher with 2–3% annual growth
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl bg-gray-50 border border-gray-100 p-8 text-center">
          <div className="text-4xl mb-3">⇄</div>
          <p className="text-gray-400 text-sm">Select two schools, a major, and job title to compare.</p>
        </div>
      )}

      <div className="text-xs text-gray-400 border-t pt-4">
        <p>BLS OES · College Scorecard · IPEDS · For educational purposes only.</p>
      </div>
    </div>
  )
}
