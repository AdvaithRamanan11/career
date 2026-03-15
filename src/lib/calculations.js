import { AREA_MULTIPLIERS, EXPERIENCE_MULTIPLIERS, TIER_MULTIPLIERS } from '../data/salaries.js';

// ─── Salary Calculator ──────────────────────────────────────────────────────
export function calculateSalary({ college, job, area, experience }) {
  if (!college || !job || !area || !experience) return null;
  const base = job.blsBase;
  const tierMult = TIER_MULTIPLIERS[college.tier] ?? 1.0;
  const areaMult = AREA_MULTIPLIERS[area] ?? 1.0;
  const expMult = EXPERIENCE_MULTIPLIERS[experience] ?? 1.0;
  return Math.round(base * tierMult * areaMult * expMult);
}

// ─── Loan Calculator ────────────────────────────────────────────────────────
export function calculateLoan({ college, incomeKey }) {
  if (!college || !incomeKey) return null;
  const tuition = college.tuition;
  const roomBoard = college.roomBoard;
  const booksOther = college.booksOther;
  const totalCOA = tuition + roomBoard + booksOther;
  const grantPerYear = college.grants[incomeKey] ?? 0;

  const federalLoanCapYear1 = 5500;
  const loanNeededPerYear = Math.max(0, totalCOA - grantPerYear);
  const totalLoan4Year = loanNeededPerYear * 4;

  // Blended rate: federal 6.53% up to federal cap, then 9.08% for remainder
  const federalRate = 0.0653;
  const plusRate = 0.0908;
  const federalTotal = Math.min(totalLoan4Year, federalLoanCapYear1 * 4);
  const plusTotal = Math.max(0, totalLoan4Year - federalTotal);
  const blendedRate = totalLoan4Year > 0
    ? (federalTotal * federalRate + plusTotal * plusRate) / totalLoan4Year
    : federalRate;

  const monthlyPayment = calcMonthlyPayment(totalLoan4Year, blendedRate, 10);
  const totalPaid = monthlyPayment * 120;
  const totalInterest = totalPaid - totalLoan4Year;

  return {
    tuition,
    roomBoard,
    booksOther,
    totalCOA,
    grantPerYear,
    federalLoanCapYear1,
    loanNeededPerYear,
    totalLoan4Year,
    blendedRate,
    monthlyPayment: Math.round(monthlyPayment),
    totalInterest: Math.round(totalInterest),
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
export function compareSchools({ collegeA, collegeB, job, area, experience }) {
  if (!collegeA || !collegeB || !job) return null;
  const salaryA = calculateSalary({ college: collegeA, job, area, experience });
  const salaryB = calculateSalary({ college: collegeB, job, area, experience });
  const lifetimeA = salaryA * 30;
  const lifetimeB = salaryB * 30;
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
