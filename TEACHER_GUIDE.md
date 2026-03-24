# CareerIQ — Teacher Guide

**For W!SE Financial Literacy Certification program teachers**  
**Version 1.0 · Grade levels 9–12**

---

## What Is CareerIQ?

CareerIQ is a free, interactive financial literacy tool that helps students explore the real financial consequences of their college and career decisions. Using national data from the Bureau of Labor Statistics, College Scorecard, and IPEDS, it lets students estimate starting salaries, project student loan burdens, and assess whether their expected income can realistically cover their debt and living expenses.

It is designed to complement — not replace — W!SE curriculum instruction. It works best as an interactive activity during or after income, debt, and budgeting units.

---

## Quick Setup (Under 5 Minutes)

**No account. No software. No student data collected.**

Embed CareerIQ on any class website or LMS with one line of HTML:

```html
<iframe
  src="https://advaithramanan11.github.io/career"
  width="100%"
  height="750"
  style="border: none; border-radius: 12px; display: block;"
  title="CareerIQ Financial Literacy Tool"
  loading="lazy"
></iframe>
```

Works with: Google Sites, Canvas, Schoology, Blackboard, WordPress, and any page that accepts HTML. See `EMBED_GUIDE.md` for full instructions including WordPress and Squarespace.

**Alternatively**, students can access it directly at: **advaithramanan11.github.io/career**

---

## The Six Tools — What Each One Does

### 1. Predict Income
Students select a college, major, job title, area of work (Urban/Suburban/Rural), and experience level to generate an estimated annual salary. Updates in real time as they change inputs.

**W!SE topics covered:** Sources of income, factors affecting wages, gross income

---

### 2. Loan Estimator
Students select a college and their family income bracket to see a full cost-of-attendance breakdown, estimated financial aid, and projected 4-year loan burden at graduation — including monthly payment and total interest paid.

**W!SE topics covered:** Compound interest, loan terms, federal loan caps, cost of borrowing

---

### 3. Compare Schools
Students pick two colleges and a career path to see side-by-side salary estimates and 30-year lifetime earnings, with a percentage difference and dollar gap.

**W!SE topics covered:** Opportunity cost, time value of money, decision-making with data

---

### 4. Loan ROI
Students enter their projected loan amount and living expenses alongside their salary estimate to see a month-by-month budget: gross income → taxes → loan payment → living expenses → disposable income. Produces a **Comfortable / Manageable / Tight / At Risk** verdict.

**W!SE topics covered:** Discretionary income, debt-to-income ratio, budgeting, net vs. gross income

---

### 5. What-If Scenarios
Displays all 12 combinations of experience level (Entry, Early Career, Experienced, Veteran) × location (Urban, Suburban, Rural) in a single grid, with percentage change from the Entry/Suburban baseline.

**W!SE topics covered:** Career progression, geographic cost of living, opportunity cost

---

### 6. Export Report
Generates a printable one-page summary of a student's college, major, job title, and salary estimate. Designed for **counseling sessions** and **parent meetings**.

---

## Suggested Classroom Activities

### Activity 1: "What Will I Actually Make?" (20–30 min)
**Best for:** Predict Income, individual use  
**W!SE unit:** Income & Careers

1. Have each student open CareerIQ and navigate to **Predict Income**.
2. Ask them to enter their "dream college" and "dream job."
3. Then have them change *only* the location from Urban to Rural. Discuss: *Why does location change your salary? What would you have to give up to live somewhere cheaper?*
4. Change experience from Entry to Veteran. Discuss: *What does it take to get from Entry to Veteran earnings? What's the trade-off in time?*

**Discussion questions:**
- Did the salary surprise you — higher or lower than you expected?
- If you moved to a rural area to save on cost of living, would that actually help? How would you find out?
- What is the "opportunity cost" of choosing a lower-paying major you love over a higher-paying one you're less passionate about?

---

### Activity 2: "Can You Afford That Loan?" (30–40 min)
**Best for:** Loan Estimator → Loan ROI (connected flow), pairs or individual  
**W!SE unit:** Loans & Debt

1. Have students open **Loan Estimator**, pick a college and their family income bracket.
2. Walk them through the breakdown: What is the total cost of attendance? What does financial aid cover? What's left?
3. Ask: *What does it mean that the federal government only caps loans at $27,000 over four years? Where does the rest come from?*
4. Click **"Use This Estimate in Loan ROI Calculator"** to auto-fill their loan details.
5. In **Loan ROI**, have them enter a realistic monthly living expense ($1,500–$2,500 depending on city) and their salary from Activity 1.
6. Look at the verdict together.

**Discussion questions:**
- Did you end up Comfortable, Manageable, Tight, or At Risk? What would need to change to move one category up?
- If your salary can't cover the loan payment, what are your real options? (Higher-paying job, smaller loan, cheaper school, income-driven repayment)
- The tool estimates taxes using a national average. Why might your actual take-home be different? (State income taxes, deductions, retirement contributions)

**Teacher note:** This is a good moment to introduce income-driven repayment (IDR) plans and Public Service Loan Forgiveness — the tool models only standard 10-year repayment. Mention that students who work in public service jobs (teachers, social workers, government employees) may qualify for loan forgiveness after 10 years.

---

### Activity 3: "Dream School vs. Safety School" (20–30 min)
**Best for:** Compare Schools  
**W!SE unit:** Decision-Making & Financial Planning

1. Have students open **Compare Schools** and enter their top-choice school vs. a less expensive alternative.
2. Use the same major and job title for both.
3. Look at the salary difference and the 30-year lifetime earnings gap.

**Discussion questions:**
- The tool shows School A earns $X more per year than School B. But what does School A *cost* more per year? Is the salary premium worth the extra debt?
- What is the "break-even point" — how many years before the higher salary from the more expensive school pays off the extra debt?
- What does "lifetime earnings" mean? Why does the difference look so much bigger over 30 years than over 1 year?

---

### Activity 4: Counseling Session Export (15 min)
**Best for:** Export Report, individual use  
**W!SE unit:** Capstone / Review

1. Have each student complete their inputs (college, major, job, location, experience).
2. Navigate to **Export Report** and click **Print / Save as PDF**.
3. Students keep a copy for their portfolio, college application folder, or to share with parents.

This works well as a unit closer or as preparation for a parent-teacher night where families discuss post-secondary planning.

---

## Pacing Guide

| Class Period | Activity | Tools Used |
|---|---|---|
| Period 1 (income unit) | "What Will I Actually Make?" | Predict Income |
| Period 2 (debt unit) | "Can You Afford That Loan?" | Loan Estimator + Loan ROI |
| Period 3 (decision-making) | "Dream School vs. Safety School" | Compare Schools + What-If |
| Period 4 (capstone) | Export and debrief | Export Report |

All four activities can also be condensed into a single 60–90 min computer lab session.

---

## Frequently Asked Questions

**Can students use this on their phones?**  
Yes. CareerIQ is fully responsive and works on any screen down to 320px. Most features work well on a phone; the Compare Schools side-by-side view is best on a larger screen.

**What if a student's college isn't in the database?**  
The tool includes 1,805 U.S. colleges and universities sourced from the College Scorecard. If a school isn't found, students can search for the closest comparable institution. Community colleges are not currently included in the salary multiplier data, but cost-of-attendance data is available for two-year schools.

**Does the tool save student data?**  
No. Nothing is stored between sessions. Students start fresh each time they open the tool. This means there are no privacy or FERPA concerns.

**Are the salary figures accurate?**  
Salary estimates are based on BLS national occupational wage data blended with College Scorecard median earnings data. They represent national estimates — actual salaries vary by employer, region, and negotiation. The tool is designed for educational illustration, not financial advice. All figures are clearly labeled as estimates.

**What about income-driven repayment (IDR)?**  
The Loan Estimator models only standard 10-year repayment. IDR plans (IBR, SAVE, PAYE) can significantly reduce monthly payments for lower-income borrowers. Encourage students who are interested to visit **studentaid.gov/idr** to learn more. This is a valuable classroom discussion point.

**What if I want to project a scenario as a whole class?**  
The tool works well projected from a teacher workstation. Walk through a scenario together using a "class persona" (e.g., "Let's say our student wants to be a nurse in a suburban area and attends a mid-tier public university") and then have students build their own scenarios individually.

---

## Technical Requirements

| Requirement | Detail |
|---|---|
| Device | Any device with a modern browser (Chromebook, laptop, phone, tablet) |
| Browser | Chrome 90+, Firefox 88+, Safari 14+, Edge 90+ |
| Login | None required |
| Internet | Required (tool is hosted externally) |
| LMS compatibility | Works in any LMS that accepts iFrame or HTML embeds |

---

## Data Sources & Disclosures

| Data | Source |
|---|---|
| Salary estimates | BLS National Occupational Employment and Wage Statistics (OES) |
| College earnings multipliers | College Scorecard API (median earnings 10 years after entry) |
| Cost of attendance | IPEDS Institutional Characteristics Survey |
| Financial aid / net price | IPEDS Student Financial Aid Survey (SFA) |
| Federal loan rates | Federal Student Aid (2024–25 academic year actuals) |
| Wage growth rate (lifetime earnings) | BLS Employment Cost Index (10-year rolling average) |

All figures are educational estimates. Tax calculations use a national average effective rate — actual take-home varies significantly by state. For educational purposes only; not financial or career advice.

---

## License & Attribution

CareerIQ is released under **CC BY 4.0** (Creative Commons Attribution 4.0 International).  
Free for nonprofit and classroom use with attribution to **Advaith Ramanan**.  
Attribution is displayed within the widget. You do not need to add additional credit on your page.

Standalone URL: **advaithramanan11.github.io/career**

---

*Questions about classroom integration? Contact the CareerIQ team via the project repository.*
