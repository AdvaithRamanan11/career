import { formatCurrency } from "../../lib/calculations.js";

export default function SalaryCard({ annual, monthly, weekly, hourly, label = "Estimated Annual Salary", badge }) {
  const isEmpty = !annual;
  return (
    <div className={`rounded-2xl p-6 transition-all duration-500 ${isEmpty ? "bg-gray-100" : "bg-gradient-to-br from-[#1A9E8F] to-[#0d7a6e]"}`}>
      <div className="flex items-start justify-between mb-2">
        <p className={`text-sm font-medium ${isEmpty ? "text-gray-400" : "text-teal-100"}`}>{label}</p>
        {badge && <span className="text-xs font-bold px-2 py-1 rounded-full bg-white/20 text-white tracking-wider">{badge}</span>}
      </div>
      <div className={`text-5xl font-black tracking-tight mb-4 ${isEmpty ? "text-gray-300" : "text-white"}`}>
        {isEmpty ? "—" : formatCurrency(annual)}
      </div>
      {!isEmpty && (
        <div className="grid grid-cols-3 gap-2 pt-4 border-t border-white/20">
          {[
            { label: "Monthly", value: monthly },
            { label: "Weekly", value: weekly },
            { label: "Hourly", value: hourly },
          ].map(({ label, value }) => (
            <div key={label} className="text-center">
              <div className="text-white font-bold text-lg">{formatCurrency(value)}</div>
              <div className="text-teal-200 text-xs mt-0.5">{label}</div>
            </div>
          ))}
        </div>
      )}
      {isEmpty && (
        <p className="text-gray-400 text-sm">Complete all fields above to see your estimate</p>
      )}
    </div>
  );
}
