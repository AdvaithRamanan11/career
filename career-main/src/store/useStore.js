import { create } from 'zustand';

export const useStore = create((set) => ({
  // Shared profile inputs
  college: null,
  major: null,
  job: null,
  area: "Suburban",
  experience: "Entry",
  incomeKey: "mid1",

  // Loan estimator snapshot for Smart Auto-Fill
  loanSnapshot: null,

  // Navigation
  activeTool: "predict",

  setCollege: (college) => set({ college }),
  setMajor: (major) => set({ major, job: null }),
  setJob: (job) => set({ job }),
  setArea: (area) => set({ area }),
  setExperience: (experience) => set({ experience }),
  setIncomeKey: (incomeKey) => set({ incomeKey }),
  setActiveTool: (activeTool) => set({ activeTool }),
  setLoanSnapshot: (loanSnapshot) => set({ loanSnapshot }),
}));
