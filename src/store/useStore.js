import { create } from 'zustand'

// This MUST be exported as "useStore" to match your imports in App.jsx
export const useStore = create((set) => ({
  // Original Navigation Logic
  activeTool: 'predict',
  setActiveTool: (id) => set({ activeTool: id }),

  // New Community College Logic
  institutionType: '4-year', 
  setInstitutionType: (type) => set({ institutionType: type }),

  // Original Selection Logic
  selectedCollege: null,
  setSelectedCollege: (college) => set({ selectedCollege: college }),

  // Original Financial Logic
  incomeBracket: 2,
  setIncomeBracket: (index) => set({ incomeBracket: index }),
}))
