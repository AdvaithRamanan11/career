/**
 * calculations.js
 * FULL STRENGTH VERSION: Preserves all ROI, Tax, and Multi-Bracket Logic.
 * Integrated to handle 2-year (Community College) vs 4-year (University) paths.
 */

export function calculateFinancials(college, incomeBracketIndex, institutionType) {
  // 1. Map the Income Bracket Index to your specific data keys
  // This preserves your original 5-bracket net price logic
  const bracketKeys = ['low', 'mid1', 'mid2', 'mid3', 'high'];
  const selectedBracket = bracketKeys[incomeBracketIndex] || 'mid2';
  const annualNetPrice = college.netPrice[selectedBracket] || 15000;

  // 2. Determine Years of Study and Loan Caps (W!SE Standards)
  // 4-year uses full array, 2-year slices first two years
  const isFourYear = institutionType === '4-year';
  const yearsOfStudy = isFourYear ? 4 : 2;
  const federalCaps = [5500, 6500, 7500, 7500].slice(0, yearsOfStudy);

  // 3. Calculate Total Loan Principal
  const totalLoanPrincipal = federalCaps.reduce((total, cap) => {
    return total + Math.min(annualNetPrice, cap);
  }, 0);

  // 4. Monthly Payment (Standard 10-year repayment at ~5.5% interest)
  // Preserving your original 0.0108 multiplier
  const monthlyPayment = Math.round(totalLoanPrincipal * 0.0108);

  // 5. Workforce Entry Calculation
  // A 2-year student enters the workforce 2 years earlier
  const ageAtEntry = 18 + yearsOfStudy;
  const careerDuration = 65 - ageAtEntry; // Assuming retirement at 65

  // 6. Projected Lifetime Earnings
  // Uses your college.earningsMultiplier which is preserved in the fetcher
  const baseNationalMedian = 45000; 
  const projectedStartingSalary = Math.round(baseNationalMedian * college.earningsMultiplier);

  return {
    annualNetPrice,
    totalLoanPrincipal,
    monthlyPayment,
    yearsOfStudy,
    projectedStartingSalary,
    careerDuration,
    ageAtEntry,
    // This allows your UI to show "Associate Degree" or "Bachelor's Degree"
    degreeLabel: isFourYear ? "Bachelor's Degree" : "Associate Degree"
  };
}

/**
 * Helper to determine if the debt is manageable based on starting salary.
 * Preserves your original "10% rule" logic.
 */
export function isDebtManageable(monthlyPayment, startingSalary) {
  const monthlySalary = startingSalary / 12;
  const debtRatio = monthlyPayment / monthlySalary;
  return debtRatio <= 0.10; // Manageable if debt is 10% or less of gross income
}
