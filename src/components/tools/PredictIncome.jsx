import React, { useMemo, useState } from 'react'
import { useStore } from '../../store/useStore'
import data from '../../data/colleges.json'
import Fuse from 'fuse.js'

export default function PredictIncome() {
  const { institutionType, setInstitutionType, setSelectedCollege } = useStore()
  const [query, setQuery] = useState('')

  // Filters the data by degreeType (1/2 for CC, 3 for Univ)
  const filteredColleges = useMemo(() => {
    return data.colleges.filter(c => 
      institutionType === '4-year' ? c.degreeType === 3 : c.degreeType < 3
    )
  }, [institutionType])

  const fuse = useMemo(() => new Fuse(filteredColleges, {
    keys: ['name', 'city'],
    threshold: 0.35
  }), [filteredColleges])

  const results = query ? fuse.search(query).slice(0, 6) : []

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <label className="section-title">Step 1: Path Selection</label>
        <div className="grid grid-cols-2 gap-3 mt-3">
          {['4-year', '2-year'].map((t) => (
            <button
              key={t}
              onClick={() => { setInstitutionType(t); setSelectedCollege(null); setQuery(''); }}
              className={`py-3 rounded-xl font-bold text-sm transition-all ${
                institutionType === t ? 'bg-teal-500 text-white' : 'bg-gray-50 text-gray-500'
              }`}
            >
              {t === '4-year' ? 'University' : 'Community College'}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm relative">
        <label className="section-title">Step 2: Find Your School</label>
        <input 
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search institutions..."
          className="input-field mt-3" 
        />
        {results.length > 0 && (
          <div className="absolute left-6 right-6 mt-1 bg-white border border-gray-100 rounded-xl shadow-xl z-50 overflow-hidden">
            {results.map(({ item }) => (
              <button
                key={item.id}
                onClick={() => { setSelectedCollege(item); setQuery(item.name); }}
                className="w-full p-4 text-left hover:bg-teal-50 border-b border-gray-50 last:border-0"
              >
                <div className="font-bold text-gray-800 text-sm">{item.name}</div>
                <div className="text-[10px] text-gray-400 uppercase">{item.city}, {item.state}</div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
