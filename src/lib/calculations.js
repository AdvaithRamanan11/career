/**
 * calculations.js - Integrated 2-year vs 4-year Logic
 */
export function calculateFinancials(college, incomeBracketIndex, institutionType) {
  // Matches your 5-bracket net price logic
  const bracketKeys = ['low', 'mid1', 'mid2', 'mid3', 'high'];
  const selectedBracket = bracketKeys[incomeBracketIndex] || 'mid2';
  const annualNetPrice = college.netPrice[selectedBracket] || 15000;

  // Logic: 4-year = 4 years of debt; 2-year = 2 years of debt
  const isFourYear = institutionType === '4-year';
  const yearsOfStudy = isFourYear ? 4 : 2;
  
  // W!SE Federal Loan Caps: [Freshman, Sophomore, Junior, Senior]
  const federalCaps = [5500, 6500, 7500, 7500].slice(0, yearsOfStudy);

  const totalLoanPrincipal = federalCaps.reduce((total, cap) => {
    return total + Math.min(annualNetPrice, cap);
  }, 0);

  // Preserves your original 10-year repayment multiplier
  const monthlyPayment = Math.round(totalLoanPrincipal * 0.0108);

  // ROI: Community college students enter the workforce 2 years earlier
  const ageAtEntry = 18 + yearsOfStudy;
  const careerDuration = 65 - ageAtEntry;

  return {
    annualNetPrice,
    totalLoanPrincipal,
    monthlyPayment,
    yearsOfStudy,
    projectedStartingSalary: Math.round(45000 * college.earningsMultiplier),
    careerDuration,
    ageAtEntry
  };
}
