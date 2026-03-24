import { useMemo } from "react";
import { useStore } from "../../store/useStore.js";
import { MAJORS, AREA_MULTIPLIERS, EXPERIENCE_MULTIPLIERS } from "../../data/salaries.js";
import { calculateSalary, salaryBreakdown, formatCurrency } from "../../lib/calculations.js";
import CollegeSearch from "../ui/CollegeSearch.jsx";
import Select from "../ui/Select.jsx";
import SalaryCard from "../ui/SalaryCard.jsx";

const AREA_OPTIONS = Object.keys(AREA_MULTIPLIERS).map((a) => ({ value: a, label: a }));
const EXPERIENCE_OPTIONS = Object.keys(EXPERIENCE_MULTIPLIERS).map((e) => ({ value: e, label: e }));

export default function PredictIncome() {
  const { college, setCollege, major, setMajor, job, setJob, area, setArea, experience, setExperience } = useStore();

  const majorObj = MAJORS.find((m) => m.id === major);
  const jobObj = majorObj?.jobs.find((j) => j.id === job);

  const salary = useMemo(() => calculateSalary({ college, job: jobObj, area, experience }), [college, jobObj, area, experience]);
  const { monthly, weekly, hourly } = salaryBreakdown(salary);

  const majorOptions = MAJORS.map((m) => ({ value: m.id, label: m.name }));
  const jobOptions = majorObj?.jobs.map((j) => ({ value: j.id, label: j.title })) ?? [];

  const profileLine = [college?.name, majorObj?.name, jobObj?.title, area, experience].filter(Boolean).join(" · ");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black text-gray-800" style={{ fontFamily: "'Syne', sans-serif" }}>Predict Income</h2>
        <p className="text-gray-500 text-sm mt-1">Estimate your starting salary based on college, major, and career path.</p>
      </div>

      <SalaryCard
        annual={salary}
        monthly={monthly}
        weekly={weekly}
        hourly={hourly}
        badge="NATIONAL 2024–2026"
      />

      {profileLine && (
        <p className="text-xs text-gray-500 italic px-1">{profileLine}</p>
      )}

      <div className="grid gap-4">
        <CollegeSearch value={college} onChange={setCollege} />

        <Select
          label="Major"
          value={major}
          onChange={(v) => setMajor(v)}
          options={majorOptions}
          placeholder="Select a major"
        />

        {major && (
          <Select
            label="Job Title"
            value={job}
            onChange={setJob}
            options={jobOptions}
            placeholder="Select a job title"
          />
        )}

        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Area of Work"
            value={area}
            onChange={setArea}
            options={AREA_OPTIONS}
          />
          <Select
            label="Experience Level"
            value={experience}
            onChange={setExperience}
            options={EXPERIENCE_OPTIONS}
          />
        </div>
      </div>

      <div className="text-xs text-gray-500 border-t pt-4 space-y-2">
        <p className="font-medium text-gray-500">Data sources</p>
        <p>BLS National OES · Glassdoor · Levels.fyi · NALP · Salary.com</p>
        <p>Salary estimates reflect gross income. Actual earnings vary by employer, negotiation, and economic conditions.</p>
        <details className="mt-2">
          <summary className="cursor-pointer font-medium text-gray-500 hover:text-gray-700 transition-colors">
            ℹ How this estimate is calculated
          </summary>
          <div className="mt-2 bg-gray-50 rounded-xl p-3 space-y-1 text-gray-500 leading-relaxed">
            <p>
              <span className="font-semibold">Step 1 — BLS base wage:</span> Each job title starts with its national
              mean annual wage from the BLS Occupational Employment and Wage Statistics (OES) survey.
            </p>
            <p>
              <span className="font-semibold">Step 2 — College earnings multiplier:</span> Each college carries a
              multiplier derived from the College Scorecard's reported median earnings 10 years after entry,
              relative to the national median across all colleges in the database. A school where graduates
              earn 10% above the national median has a multiplier of 1.10.
            </p>
            {/* Dynamic geographic skew warning — shown for any high-multiplier school in a non-urban area */}
            {college && college.earningsMultiplier >= 1.3 && area && area !== 'Urban' ? (
              <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-amber-700 text-xs leading-relaxed">
                <span className="font-semibold">⚠ Geographic skew note for {college.name}:</span> This school's
                earnings multiplier ({college.earningsMultiplier.toFixed(2)}×) reflects where its graduates
                <span className="font-semibold"> actually end up working</span> — which for high-earning schools
                tends to be concentrated in high-pay urban markets. Applying this multiplier to a {area.toLowerCase()} location
                may overestimate what you'd earn, since the multiplier already reflects an urban salary premium
                that the location discount only partially corrects for. Treat this estimate as a reasonable
                upper bound rather than a precise figure.
              </div>
            ) : college && college.earningsMultiplier >= 1.3 && area === 'Urban' ? (
              <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 text-blue-700 text-xs leading-relaxed">
                <span className="font-semibold">ℹ Note for {college.name}:</span> This school has a high earnings
                multiplier ({college.earningsMultiplier.toFixed(2)}×), reflecting that its graduates tend to work
                in high-paying urban markets. Your Urban location selection aligns well with this — this estimate
                is more reliable than it would be for non-urban locations.
              </div>
            ) : college ? (
              <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-gray-500 text-xs leading-relaxed">
                <span className="font-semibold">ℹ About this school's multiplier:</span> {college.name} has an
                earnings multiplier of {college.earningsMultiplier?.toFixed(2) ?? '1.00'}×, meaning its graduates
                earn {college.earningsMultiplier >= 1.0
                  ? `about ${Math.round((college.earningsMultiplier - 1) * 100)}% above`
                  : `about ${Math.round((1 - college.earningsMultiplier) * 100)}% below`
                } the national median for their field. This reflects a mix of school selectivity,
                graduate career choices, and where alumni tend to work geographically.
              </div>
            ) : null}
            <p>
              <span className="font-semibold">Step 3 — Location adjustment:</span> Urban, Suburban, and Rural
              multipliers are applied based on BLS and BEA regional wage data. This adjusts for the fact that
              the same job title pays differently depending on local labor market conditions and cost of living —
              a software engineer in rural Montana earns significantly less than one in San Francisco.
            </p>
            <p>
              <span className="font-semibold">Step 4 — Experience adjustment:</span> Entry, Early Career,
              Experienced, and Veteran multipliers reflect typical career progression curves from BLS and
              Salary.com longitudinal data. Entry = 0–2 years, Early Career = 2–5 years, Experienced = 5–10
              years, Veteran = 10+ years.
            </p>
            <p className="text-gray-400 pt-1">
              Result = BLS base × college multiplier × location multiplier × experience multiplier.
              This estimate reflects <span className="font-semibold text-gray-500">your specific inputs</span> —
              not the average graduate of that school, but a graduate working in the location
              and career you selected. Change any input and the estimate updates immediately.
              All figures are national estimates for educational illustration only.
            </p>
          </div>
        </details>
      </div>
    </div>
  );
}
