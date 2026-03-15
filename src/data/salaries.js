// Salary data sourced from BLS OES National, Glassdoor, Levels.fyi, NALP, Salary.com
// Annual Release: BLS November 2024 final data

export const MAJORS = [
  {
    id: "computer_science",
    name: "Computer Science",
    jobs: [
      { id: "software_engineer", title: "Software Engineer", blsBase: 130160 },
      { id: "data_scientist", title: "Data Scientist", blsBase: 108020 },
      { id: "product_manager", title: "Product Manager", blsBase: 120000 },
      { id: "cybersecurity_analyst", title: "Cybersecurity Analyst", blsBase: 112000 },
      { id: "ml_engineer", title: "Machine Learning Engineer", blsBase: 142000 },
      { id: "devops_engineer", title: "DevOps Engineer", blsBase: 118000 },
      { id: "ux_designer", title: "UX Designer", blsBase: 85000 },
      { id: "it_manager", title: "IT Manager", blsBase: 159000 },
    ],
  },
  {
    id: "business",
    name: "Business Administration",
    jobs: [
      { id: "financial_analyst", title: "Financial Analyst", blsBase: 96220 },
      { id: "marketing_manager", title: "Marketing Manager", blsBase: 140040 },
      { id: "management_consultant", title: "Management Consultant", blsBase: 95290 },
      { id: "accountant", title: "Accountant / CPA", blsBase: 79880 },
      { id: "hr_manager", title: "HR Manager", blsBase: 136350 },
      { id: "sales_manager", title: "Sales Manager", blsBase: 130600 },
      { id: "operations_manager", title: "Operations Manager", blsBase: 103650 },
      { id: "investment_banker", title: "Investment Banker", blsBase: 108000 },
    ],
  },
  {
    id: "engineering",
    name: "Engineering",
    jobs: [
      { id: "mechanical_engineer", title: "Mechanical Engineer", blsBase: 96310 },
      { id: "electrical_engineer", title: "Electrical Engineer", blsBase: 101780 },
      { id: "civil_engineer", title: "Civil Engineer", blsBase: 89940 },
      { id: "chemical_engineer", title: "Chemical Engineer", blsBase: 105550 },
      { id: "aerospace_engineer", title: "Aerospace Engineer", blsBase: 122270 },
      { id: "biomedical_engineer", title: "Biomedical Engineer", blsBase: 97410 },
      { id: "environmental_engineer", title: "Environmental Engineer", blsBase: 96820 },
      { id: "industrial_engineer", title: "Industrial Engineer", blsBase: 96350 },
    ],
  },
  {
    id: "healthcare",
    name: "Healthcare / Pre-Med",
    jobs: [
      { id: "physician", title: "Physician (MD)", blsBase: 229300 },
      { id: "nurse_practitioner", title: "Nurse Practitioner", blsBase: 121610 },
      { id: "pharmacist", title: "Pharmacist", blsBase: 132750 },
      { id: "registered_nurse", title: "Registered Nurse", blsBase: 81220 },
      { id: "physician_assistant", title: "Physician Assistant", blsBase: 126010 },
      { id: "physical_therapist", title: "Physical Therapist", blsBase: 97720 },
      { id: "occupational_therapist", title: "Occupational Therapist", blsBase: 93180 },
      { id: "dentist", title: "Dentist", blsBase: 163220 },
    ],
  },
  {
    id: "law",
    name: "Pre-Law / Political Science",
    jobs: [
      { id: "corporate_lawyer", title: "Corporate Lawyer", blsBase: 135740 },
      { id: "public_defender", title: "Public Defender", blsBase: 72000 },
      { id: "policy_analyst", title: "Policy Analyst", blsBase: 76300 },
      { id: "government_official", title: "Government Administrator", blsBase: 101750 },
      { id: "paralegal", title: "Paralegal", blsBase: 59200 },
      { id: "judge", title: "Judge / Magistrate", blsBase: 136910 },
      { id: "lobbyist", title: "Lobbyist / Advocate", blsBase: 88000 },
      { id: "diplomat", title: "Diplomat / Foreign Service", blsBase: 84000 },
    ],
  },
  {
    id: "education",
    name: "Education",
    jobs: [
      { id: "hs_teacher", title: "High School Teacher", blsBase: 62360 },
      { id: "elementary_teacher", title: "Elementary School Teacher", blsBase: 61620 },
      { id: "school_counselor", title: "School Counselor", blsBase: 61710 },
      { id: "special_ed_teacher", title: "Special Education Teacher", blsBase: 62420 },
      { id: "college_professor", title: "College Professor", blsBase: 84380 },
      { id: "curriculum_developer", title: "Curriculum Developer", blsBase: 74620 },
      { id: "education_administrator", title: "School Administrator", blsBase: 100340 },
      { id: "instructional_designer", title: "Instructional Designer", blsBase: 77510 },
    ],
  },
  {
    id: "social_sciences",
    name: "Social Sciences / Psychology",
    jobs: [
      { id: "psychologist", title: "Psychologist", blsBase: 90590 },
      { id: "social_worker", title: "Social Worker", blsBase: 58380 },
      { id: "market_researcher", title: "Market Research Analyst", blsBase: 68230 },
      { id: "ux_researcher", title: "UX Researcher", blsBase: 92000 },
      { id: "nonprofit_manager", title: "Nonprofit Program Manager", blsBase: 66000 },
      { id: "community_organizer", title: "Community Organizer", blsBase: 52000 },
      { id: "hr_specialist", title: "HR Specialist", blsBase: 67650 },
      { id: "recruiter", title: "Corporate Recruiter", blsBase: 63000 },
    ],
  },
  {
    id: "communications",
    name: "Communications / Journalism",
    jobs: [
      { id: "journalist", title: "Journalist / Reporter", blsBase: 55960 },
      { id: "pr_specialist", title: "Public Relations Specialist", blsBase: 67440 },
      { id: "content_strategist", title: "Content Strategist", blsBase: 74000 },
      { id: "broadcast_journalist", title: "Broadcast Journalist", blsBase: 57000 },
      { id: "advertising_manager", title: "Advertising Manager", blsBase: 127830 },
      { id: "social_media_manager", title: "Social Media Manager", blsBase: 63000 },
      { id: "technical_writer", title: "Technical Writer", blsBase: 79960 },
      { id: "editor", title: "Editor / Publications Manager", blsBase: 75680 },
    ],
  },
  {
    id: "arts_design",
    name: "Arts & Design",
    jobs: [
      { id: "graphic_designer", title: "Graphic Designer", blsBase: 58910 },
      { id: "industrial_designer", title: "Industrial Designer", blsBase: 78450 },
      { id: "animator", title: "Animator / Motion Designer", blsBase: 81020 },
      { id: "architect", title: "Architect", blsBase: 93310 },
      { id: "interior_designer", title: "Interior Designer", blsBase: 60340 },
      { id: "fashion_designer", title: "Fashion Designer", blsBase: 78010 },
      { id: "art_director", title: "Art Director", blsBase: 106500 },
      { id: "game_designer", title: "Game Designer", blsBase: 100080 },
    ],
  },
  {
    id: "natural_sciences",
    name: "Natural Sciences",
    jobs: [
      { id: "biologist", title: "Biologist / Research Scientist", blsBase: 84000 },
      { id: "chemist", title: "Chemist", blsBase: 80890 },
      { id: "physicist", title: "Physicist", blsBase: 152430 },
      { id: "geoscientist", title: "Geoscientist", blsBase: 87480 },
      { id: "environmental_scientist", title: "Environmental Scientist", blsBase: 76480 },
      { id: "biochemist", title: "Biochemist", blsBase: 100270 },
      { id: "epidemiologist", title: "Epidemiologist", blsBase: 78830 },
      { id: "zoologist", title: "Zoologist / Wildlife Biologist", blsBase: 67480 },
    ],
  },
  {
    id: "finance_economics",
    name: "Finance & Economics",
    jobs: [
      { id: "economist", title: "Economist", blsBase: 115730 },
      { id: "investment_analyst", title: "Investment Analyst", blsBase: 105000 },
      { id: "actuary", title: "Actuary", blsBase: 120000 },
      { id: "financial_manager", title: "Financial Manager", blsBase: 156100 },
      { id: "personal_financial_advisor", title: "Personal Financial Advisor", blsBase: 94170 },
      { id: "portfolio_manager", title: "Portfolio Manager", blsBase: 132000 },
      { id: "risk_analyst", title: "Risk Analyst", blsBase: 98000 },
      { id: "tax_specialist", title: "Tax Specialist / CPA", blsBase: 82000 },
    ],
  },
  {
    id: "nursing",
    name: "Nursing",
    jobs: [
      { id: "rn", title: "Registered Nurse (RN)", blsBase: 81220 },
      { id: "icu_nurse", title: "ICU / Critical Care Nurse", blsBase: 87000 },
      { id: "travel_nurse", title: "Travel Nurse", blsBase: 95000 },
      { id: "nurse_manager", title: "Nurse Manager", blsBase: 104830 },
      { id: "crna", title: "Certified Nurse Anesthetist", blsBase: 203090 },
      { id: "midwife", title: "Nurse-Midwife", blsBase: 120880 },
      { id: "clinical_nurse", title: "Clinical Nurse Specialist", blsBase: 109000 },
      { id: "nursing_professor", title: "Nursing Educator", blsBase: 84000 },
    ],
  },
];

// Area multipliers based on BLS metro-tier data + BEA regional cost adjustments
export const AREA_MULTIPLIERS = {
  Urban: 1.12,
  Suburban: 1.0,
  Rural: 0.84,
};

// Experience multipliers
export const EXPERIENCE_MULTIPLIERS = {
  Entry: 1.0,
  "Early Career": 1.15,
  Experienced: 1.45,
  Veteran: 1.85,
};

// School tier multipliers based on College Scorecard institutional selectivity
export const TIER_MULTIPLIERS = {
  1: 1.35,  // Elite: Harvard, MIT, Stanford, etc.
  2: 1.18,  // Selective: UVA, Michigan, UCLA, etc.
  3: 1.05,  // Above average
  4: 0.92,  // Average
};

export const TIER_LABELS = {
  1: "Elite",
  2: "Selective",
  3: "Above Average",
  4: "Average",
};
