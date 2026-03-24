import { AREA_MULTIPLIERS, EXPERIENCE_MULTIPLIERS } from '../data/salaries.js';
import ratesData from '../data/rates.json' with { type: 'json' };

// Annual wage growth rate — 10-year rolling average from BLS Employment Cost Index.
// Updated annually at build time by scripts/fetch-rates.js.
// Used for lifetime earnings projections (geometric series sum over 30 years).
export const ANNUAL_WAGE_GROWTH = ratesData.annualWageGrowthRate;

// ─── Tax Constants (sourced from rates.json — update each fall) ──────────────
// FICA: 6.2% Social Security + 1.45% Medicare = 7.65%. Unchanged since 1990.
// SS wage base and standard deduction adjust annually for inflation via IRS Rev. Proc.
// Update rates.json each fall when IRS publishes the new-year Revenue Procedure.
export const FICA_RATE          = ratesData.tax.ficaRate;               // 0.0765
export const SS_WAGE_BASE       = ratesData.tax.socialSecurityWageBase; // $168,600 (2024)
export const STANDARD_DEDUCTION = ratesData.tax.standardDeduction;      // $14,600 (2024)
export const TAX_YEAR           = ratesData.tax._meta.taxYear;          // 2024

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
  const netPricePerYear = college.netPrice?.[incomeKey] ?? totalCOA;

  // Determine program length from schoolType field (added in fetch-colleges.js v2).
  // Community colleges (2-year) have a shorter program and different federal loan caps.
  const is2Year = college.schoolType === '2-year';
  const programYears = is2Year ? 2 : 4;

  // Federal Direct Loan annual caps for dependent undergraduates (Title IV, 2024-25):
  //   4-year: Year 1 $5,500 | Year 2 $6,500 | Years 3-4 $7,500 each → Total $27,000
  //   2-year: Year 1 $5,500 | Year 2 $6,500                         → Total $12,000
  const federalCapTotal = is2Year ? 12000 : 27000;
  const federalCapYear1 = 5500;

  const totalLoan = Math.max(0, netPricePerYear * programYears);

  // Blended rate: federal 6.53% on the capped portion, then 9.08% (PLUS) on any remainder
  const federalRate = 0.0653;
  const plusRate    = 0.0908;
  const federalPortion = Math.min(totalLoan, federalCapTotal);
  const plusPortion    = Math.max(0, totalLoan - federalPortion);
  const blendedRate = totalLoan > 0
    ? (federalPortion * federalRate + plusPortion * plusRate) / totalLoan
    : federalRate;

  const monthlyPayment = calcMonthlyPayment(totalLoan, blendedRate, 10);
  const totalPaid      = monthlyPayment * 120;
  const totalInterest  = totalPaid - totalLoan;

  return {
    tuition,
    roomBoard,
    booksOther,
    totalCOA,
    netPricePerYear,
    federalCapYear1,
    programYears,
    is2Year,
    totalLoan4Year: totalLoan,  // kept for backward compat with LoanROI auto-fill
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
  const taxes = estimateTaxes(annualSalary);
  const monthlyGross = annualSalary / 12;
  const monthlyTakeHome = monthlyGross - taxes.monthlyTotal;
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
    taxes,
    verdict,
    color,
    ratio,
  };
}

// ─── Tax Estimator ───────────────────────────────────────────────────────────
// Returns a breakdown of federal income tax, FICA, and average state income tax.
// All rates reflect 2024 tax year for a single filer with standard deduction.

// 2024 federal income tax brackets (single filer, standard deduction $14,600)
const FEDERAL_BRACKETS = [
  { upTo: 11600,  rate: 0.10 },
  { upTo: 47150,  rate: 0.12 },
  { upTo: 100525, rate: 0.22 },
  { upTo: 191950, rate: 0.24 },
  { upTo: 243725, rate: 0.32 },
  { upTo: 609350, rate: 0.35 },
  { upTo: Infinity, rate: 0.37 },
];

// Average effective state income tax rate by income band.
// Derived from Tax Foundation 2024 state individual income tax data,
// population-weighted across all 50 states + DC.
// Students landing in a zero-tax state (TX, FL, etc.) will pay less;
// those in CA, NY, NJ will pay more — the disclaimer notes this.
const STATE_EFFECTIVE_RATES = [
  { upTo: 30000,   rate: 0.020 },
  { upTo: 50000,   rate: 0.030 },
  { upTo: 75000,   rate: 0.038 },
  { upTo: 100000,  rate: 0.043 },
  { upTo: 150000,  rate: 0.048 },
  { upTo: Infinity, rate: 0.053 },
];

// FICA: Social Security (6.2%, capped at SS_WAGE_BASE from rates.json) + Medicare (1.45%, uncapped)
// Additional 0.9% Medicare surtax kicks in above $200k — negligible for this audience.
// SS_WAGE_BASE and STANDARD_DEDUCTION are imported from rates.json and update annually each fall.
const SS_RATE       = 0.062;
const MEDICARE_RATE = 0.0145;

export function estimateTaxes(annualSalary) {
  // STANDARD_DEDUCTION and SS_WAGE_BASE come from rates.json (module-level exports above).
  // Update rates.json each fall when IRS publishes the new-year Revenue Procedure.

  // Federal income tax (marginal brackets on taxable income)
  const taxableIncome = Math.max(0, annualSalary - STANDARD_DEDUCTION);
  let federalTax = 0;
  let prev = 0;
  for (const { upTo, rate } of FEDERAL_BRACKETS) {
    if (taxableIncome <= prev) break;
    const slice = Math.min(taxableIncome, upTo) - prev;
    federalTax += slice * rate;
    prev = upTo;
  }

  // FICA
  const ssTax       = Math.min(annualSalary, SS_WAGE_BASE) * SS_RATE;
  const medicareTax = annualSalary * MEDICARE_RATE;
  const ficaTax     = ssTax + medicareTax;

  // State income tax (population-weighted national average effective rate)
  const stateRate = STATE_EFFECTIVE_RATES.find(b => annualSalary <= b.upTo)?.rate ?? 0.053;
  const stateTax  = annualSalary * stateRate;

  const totalTax        = federalTax + ficaTax + stateTax;
  const effectiveTotal  = totalTax / annualSalary;

  return {
    federalTax:    Math.round(federalTax),
    ficaTax:       Math.round(ficaTax),
    stateTax:      Math.round(stateTax),
    totalTax:      Math.round(totalTax),
    monthlyFederal: Math.round(federalTax / 12),
    monthlyFica:    Math.round(ficaTax / 12),
    monthlyState:   Math.round(stateTax / 12),
    monthlyTotal:   Math.round(totalTax / 12),
    effectiveTotal,
    ficaRate:       ficaTax / annualSalary,
    federalEffective: federalTax / annualSalary,
    stateRate,
  };
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

  // Community college grads enter the workforce up to 2 years earlier.
  // To compare on equal footing (same retirement age ~65), extend their earning
  // window by 2 years so the lifetime projection covers the same career span.
  const yearsA = collegeA.schoolType === '2-year' ? 32 : 30;
  const yearsB = collegeB.schoolType === '2-year' ? 32 : 30;

  const lifetimeA = lifetimeEarnings(salaryA, yearsA);
  const lifetimeB = lifetimeEarnings(salaryB, yearsB);
  const pctDiff = salaryA > 0 ? ((salaryB - salaryA) / salaryA) * 100 : 0;
  const lifetimeDiff = lifetimeB - lifetimeA;
  return { salaryA, salaryB, lifetimeA, lifetimeB, pctDiff, lifetimeDiff, yearsA, yearsB };
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
