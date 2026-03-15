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
        <p className="text-xs text-gray-400 italic px-1">{profileLine}</p>
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

      <div className="text-xs text-gray-400 border-t pt-4 space-y-1">
        <p className="font-medium text-gray-500">Data sources</p>
        <p>BLS National OES · Glassdoor · Levels.fyi · NALP · Salary.com</p>
        <p>Salary estimates reflect gross income. Actual earnings vary by employer, negotiation, and economic conditions.</p>
      </div>
    </div>
  );
}
