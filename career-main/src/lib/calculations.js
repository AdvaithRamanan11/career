import { AREA_MULTIPLIERS, EXPERIENCE_MULTIPLIERS } from '../data/salaries.js';
import ratesData from '../data/rates.json' with { type: 'json' };

// Annual wage growth rate — 10-year rolling average from BLS Employment Cost Index.
// Updated annually at build time by scripts/fetch-rates.js.
// Used for lifetime earnings projections (geometric series sum over 30 years).
export const ANNUAL_WAGE_GROWTH = ratesData.annualWageGrowthRate;

// ─── Salary Calculator ──────────────────────────────────────────────────────
export function calculateSalary({ college, job, area, experience }) {
  if (!college || !job || !area || !experience) return null;
  const base = job.blsBase;
  // earningsMultiplier is derived per-college from College Scorecard median
  // earnings (10yr after entry) relative to the national median across all
  // colleges. Falls back to 1.0 if somehow missing.
  const earningsMult = college.earningsMultiplier ?? 1.0;
  const areaMult = AREA_MULTIPLIERS[area] ?? 1.0;
  const expMult = EXPERIENCE_MULTIPLIERS[experience] ?? 1.0;
  return Math.round(base * earningsMult * areaMult * expMult);
}

// ─── Loan Calculator ────────────────────────────────────────────────────────
export function calculateLoan({ college, incomeKey }) {
  if (!college || !incomeKey) return null;
  const tuition    = college.tuition;
  const roomBoard  = college.roomBoard;
  const booksOther = college.booksOther;
  const totalCOA   = tuition + roomBoard + booksOther;

  // Net price = COA − all grant/scholarship aid, by family income bracket.
  // Sourced from IPEDS SFA survey via College Scorecard API (NPT4x_PUB / NPT4x_PRIV).
  // This is what the student actually needs to cover — no subtraction needed.
  // Fall back to full COA only if Scorecard has no net price data for this school.
  const netPricePerYear = college.netPrice?.[incomeKey] ?? totalCOA;

  // Federal Direct Loan annual caps for dependent undergraduates (Title IV, 2024-25):
  //   Year 1: $5,500  Year 2: $6,500  Year 3: $7,500  Year 4: $7,500
  //   Total:  $27,000  (NOT $5,500 × 4)
  const federalCapTotal = 27000;
  const federalCapYear1 = 5500;

  const totalLoan4Year = Math.max(0, netPricePerYear * 4);

  // Blended rate: federal 6.53% on the first $27k, then 9.08% (PLUS) on any remainder
  // Rates are 2024-25 actuals; updated annually via fetch-rates.js (issue #9)
  const federalRate = 0.0653;
  const plusRate    = 0.0908;
  const federalPortion = Math.min(totalLoan4Year, federalCapTotal);
  const plusPortion    = Math.max(0, totalLoan4Year - federalPortion);
  const blendedRate = totalLoan4Year > 0
    ? (federalPortion * federalRate + plusPortion * plusRate) / totalLoan4Year
    : federalRate;

  const monthlyPayment = calcMonthlyPayment(totalLoan4Year, blendedRate, 10);
  const totalPaid      = monthlyPayment * 120;
  const totalInterest  = totalPaid - totalLoan4Year;

  return {
    tuition,
    roomBoard,
    booksOther,
    totalCOA,
    netPricePerYear,                              // what student pays per year after all aid
    federalCapYear1,                              // shown in UI for context
    totalLoan4Year,
    blendedRate,
    monthlyPayment:  Math.round(monthlyPayment),
    totalInterest:   Math.round(Math.max(0, totalInterest)),
  };
}

export function calcMonthlyPayment(principal, annualRate, years) {
  if (principal <= 0) return 0;
  const r = annualRate / 12;
  const n = years * 12;
  if (r === 0) return principal / n;
  return (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
}

// ─── ROI Calculator ─────────────────────────────────────────────────────────
export function calculateROI({ annualSalary, loanAmount, interestRate, monthlyLiving }) {
  if (!annualSalary) return null;
  const taxRate = estimateTaxRate(annualSalary);
  const monthlyGross = annualSalary / 12;
  const monthlyTakeHome = monthlyGross * (1 - taxRate);
  const monthlyPayment = calcMonthlyPayment(loanAmount, interestRate / 100, 10);
  const monthlyDisposable = monthlyTakeHome - monthlyPayment - monthlyLiving;

  let verdict, color;
  const ratio = monthlyDisposable / monthlyTakeHome;
  if (ratio >= 0.3) { verdict = "Comfortable"; color = "green"; }
  else if (ratio >= 0.15) { verdict = "Manageable"; color = "yellow"; }
  else if (ratio >= 0) { verdict = "Tight"; color = "orange"; }
  else { verdict = "At Risk"; color = "red"; }

  return {
    monthlyGross: Math.round(monthlyGross),
    monthlyTakeHome: Math.round(monthlyTakeHome),
    monthlyPayment: Math.round(monthlyPayment),
    monthlyLiving,
    monthlyDisposable: Math.round(monthlyDisposable),
    taxRate,
    verdict,
    color,
    ratio,
  };
}

function estimateTaxRate(annualSalary) {
  // Simplified effective federal + avg state tax estimate
  if (annualSalary < 40000) return 0.16;
  if (annualSalary < 70000) return 0.22;
  if (annualSalary < 100000) return 0.27;
  if (annualSalary < 160000) return 0.31;
  if (annualSalary < 250000) return 0.35;
  return 0.39;
}

// ─── What-If Scenarios ──────────────────────────────────────────────────────
export function generateScenarios({ college, job }) {
  if (!college || !job) return [];
  const areas = ["Urban", "Suburban", "Rural"];
  const experiences = ["Entry", "Early Career", "Experienced", "Veteran"];
  const results = [];
  const entrySalary = calculateSalary({ college, job, area: "Suburban", experience: "Entry" });
  for (const experience of experiences) {
    for (const area of areas) {
      const salary = calculateSalary({ college, job, area, experience });
      const pctChange = entrySalary > 0 ? ((salary - entrySalary) / entrySalary) * 100 : 0;
      results.push({ area, experience, salary, pctChange });
    }
  }
  return results;
}

// ─── Comparison ─────────────────────────────────────────────────────────────
// Sum of geometric series: salary * ((1 + r)^n - 1) / r
// This gives the total earnings over n years assuming salary grows at rate r per year.
// Much more realistic than salary * n (flat projection) — accounts for raises and
// cost-of-living adjustments over a career. Rate sourced from BLS ECI (see rates.json).
export function lifetimeEarnings(startingSalary, years = 30) {
  if (!startingSalary || startingSalary <= 0) return 0;
  const r = ANNUAL_WAGE_GROWTH;
  return Math.round(startingSalary * (Math.pow(1 + r, years) - 1) / r);
}

export function compareSchools({ collegeA, collegeB, job, area, experience }) {
  if (!collegeA || !collegeB || !job) return null;
  const salaryA = calculateSalary({ college: collegeA, job, area, experience });
  const salaryB = calculateSalary({ college: collegeB, job, area, experience });
  const lifetimeA = lifetimeEarnings(salaryA);
  const lifetimeB = lifetimeEarnings(salaryB);
  const pctDiff = salaryA > 0 ? ((salaryB - salaryA) / salaryA) * 100 : 0;
  const lifetimeDiff = lifetimeB - lifetimeA;
  return { salaryA, salaryB, lifetimeA, lifetimeB, pctDiff, lifetimeDiff };
}

// ─── Formatters ──────────────────────────────────────────────────────────────
export function formatCurrency(n, compact = false) {
  if (n == null || isNaN(n)) return "—";
  if (compact && Math.abs(n) >= 1000) {
    return "$" + (n / 1000).toFixed(0) + "k";
  }
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

export function formatPct(n) {
  if (n == null || isNaN(n)) return "—";
  const sign = n >= 0 ? "+" : "";
  return `${sign}${n.toFixed(1)}%`;
}

export function salaryBreakdown(annual) {
  if (!annual) return { monthly: null, weekly: null, hourly: null };
  return {
    monthly: Math.round(annual / 12),
    weekly: Math.round(annual / 52),
    hourly: Math.round(annual / 2080),
  };
}
