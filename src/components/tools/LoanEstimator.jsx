import { useMemo } from "react";
import { useStore } from "../../store/useStore.js";
import { INCOME_BRACKETS } from "../../data/colleges.js";
import { calculateLoan, formatCurrency } from "../../lib/calculations.js";
import CollegeSearch from "../ui/CollegeSearch.jsx";
import Select from "../ui/Select.jsx";

const INCOME_OPTIONS = INCOME_BRACKETS.map((b) => ({ value: b.key, label: b.label }));

function DataRow({ label, value, highlight, indent }) {
  return (
    <div className={`flex justify-between items-center py-2 ${indent ? "pl-4" : ""} ${highlight ? "bg-teal-50 -mx-4 px-4 rounded-lg font-bold" : "border-b border-gray-100"}`}>
      <span className={`text-sm ${highlight ? "text-teal-800 font-semibold" : "text-gray-600"}`}>{label}</span>
      <span className={`text-sm font-semibold ${highlight ? "text-teal-700" : "text-gray-800"}`}>{value}</span>
    </div>
  );
}

export default function LoanEstimator() {
  const { college, setCollege, incomeKey, setIncomeKey, setActiveTool, setLoanSnapshot } = useStore();

  const loan = useMemo(() => calculateLoan({ college, incomeKey }), [college, incomeKey]);

  function useInROI() {
    if (!loan) return;
    setLoanSnapshot({
      loanAmount: loan.totalLoan4Year,
      interestRate: (loan.blendedRate * 100).toFixed(2),
      college,
    });
    setActiveTool("roi");
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black text-gray-800" style={{ fontFamily: "'Syne', sans-serif" }}>Loan Estimator</h2>
        <p className="text-gray-500 text-sm mt-1">See a full breakdown of college costs and projected loan burden at graduation.</p>
      </div>

      <div className="grid gap-4">
        <CollegeSearch value={college} onChange={setCollege} />
        <Select
          label="Family Annual Income"
          value={incomeKey}
          onChange={setIncomeKey}
          options={INCOME_OPTIONS}
          placeholder="Select income bracket"
        />
      </div>

      {loan ? (
        <div className="space-y-4">
          {/* Cost of Attendance */}
          <div className="bg-white rounded-2xl border border-gray-200 p-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">Cost of Attendance (per year)</h3>
            <DataRow label="Tuition & Fees" value={formatCurrency(loan.tuition)} />
            <DataRow label="Room & Board" value={formatCurrency(loan.roomBoard)} />
            <DataRow label="Books & Other" value={formatCurrency(loan.booksOther)} />
            <DataRow label="Total COA / Year" value={formatCurrency(loan.totalCOA)} highlight />
          </div>

          {/* Financial Aid */}
          <div className="bg-white rounded-2xl border border-gray-200 p-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">Financial Aid Estimate (per year)</h3>
            <DataRow label="Net Price (after all grant aid)" value={formatCurrency(loan.netPricePerYear)} />
            <DataRow label="Federal Loan Cap (Year 1)" value={formatCurrency(loan.federalCapYear1)} />
            <DataRow label="Est. Loan Needed / Year" value={formatCurrency(loan.netPricePerYear)} highlight />
          </div>

          {/* Loan Projection */}
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-5 text-white">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-4">4-Year Loan Projection</h3>
            <div className="text-4xl font-black mb-1">{formatCurrency(loan.totalLoan4Year)}</div>
            <div className="text-gray-500 text-sm mb-4">Estimated total loan at graduation</div>
            <div className="grid grid-cols-2 gap-3 pt-4 border-t border-white/10">
              <div>
                <div className="text-white font-bold text-xl">{formatCurrency(loan.monthlyPayment)}</div>
                <div className="text-gray-500 text-xs">Est. monthly payment</div>
                <div className="text-gray-500 text-xs">(10-yr standard repayment)</div>
              </div>
              <div>
                <div className="text-white font-bold text-xl">{formatCurrency(loan.totalInterest)}</div>
                <div className="text-gray-500 text-xs">Total interest paid</div>
                <div className="text-gray-500 text-xs">Blended rate: {(loan.blendedRate * 100).toFixed(2)}%</div>
              </div>
            </div>
          </div>

          <button
            onClick={useInROI}
            className="w-full py-3 rounded-xl bg-teal-500 hover:bg-teal-600 text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
            Use This Estimate in Loan ROI Calculator
          </button>
        </div>
      ) : (
        <div className="rounded-2xl bg-gray-50 border border-gray-200 p-8 text-center">
          <div className="text-4xl mb-3">🎓</div>
          <p className="text-gray-500 text-sm">Select a college and income bracket to see your loan breakdown.</p>
        </div>
      )}

      <div className="text-xs text-gray-500 border-t pt-4 space-y-1">
        <p className="font-medium text-gray-500">Data sources</p>
        <p>IPEDS SFA Survey · College Scorecard API · Federal Student Aid</p>
        <p>COA figures may lag current academic year by 12–18 months. For educational purposes only.</p>
      </div>
    </div>
  );
}
