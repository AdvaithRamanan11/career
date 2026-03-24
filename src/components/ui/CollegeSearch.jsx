import { useState, useRef, useEffect, useMemo } from "react";
import Fuse from "fuse.js";
import { COLLEGES } from "../../data/colleges.js";
import { TIER_LABELS } from "../../data/salaries.js";

const fuse = new Fuse(COLLEGES, {
  keys: ["name", "city", "state"],
  threshold: 0.35,
  minMatchCharLength: 2,
});

// School type filter options
const TYPE_FILTERS = [
  { value: "all",    label: "All Schools" },
  { value: "4-year", label: "4-Year" },
  { value: "2-year", label: "Community College" },
];

export default function CollegeSearch({ value, onChange, label = "College", placeholder = "Search college name or city..." }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(0);
  const [typeFilter, setTypeFilter] = useState("all");
  const inputRef = useRef(null);
  const listRef = useRef(null);

  const results = useMemo(() => {
    if (!query || query.length < 2) return [];
    const raw = fuse.search(query).map((r) => r.item);
    const filtered = typeFilter === "all" ? raw : raw.filter(c => c.schoolType === typeFilter);
    return filtered.slice(0, 20);
  }, [query, typeFilter]);

  useEffect(() => { setHighlighted(0); }, [results]);

  function selectCollege(college) {
    onChange(college);
    setQuery("");
    setOpen(false);
  }

  function handleKey(e) {
    if (!open || results.length === 0) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setHighlighted((h) => Math.min(h + 1, results.length - 1)); }
    if (e.key === "ArrowUp") { e.preventDefault(); setHighlighted((h) => Math.max(h - 1, 0)); }
    if (e.key === "Enter") { e.preventDefault(); if (results[highlighted]) selectCollege(results[highlighted]); }
    if (e.key === "Escape") { setOpen(false); setQuery(""); }
  }

  useEffect(() => {
    if (open && listRef.current) {
      const el = listRef.current.children[highlighted];
      if (el) el.scrollIntoView({ block: "nearest" });
    }
  }, [highlighted, open]);

  const tierColors = { 1: "bg-violet-100 text-violet-700", 2: "bg-teal-100 text-teal-700", 3: "bg-blue-100 text-blue-700", 4: "bg-gray-100 text-gray-600" };
  const typeColors = { "4-year": "bg-indigo-100 text-indigo-700", "2-year": "bg-amber-100 text-amber-700" };
  const typeLabel  = { "4-year": "4-yr", "2-year": "CC" };

  return (
    <div className="relative">
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">{label}</label>

      {/* School type filter chips */}
      <div className="flex gap-1.5 mb-2">
        {TYPE_FILTERS.map(opt => (
          <button
            key={opt.value}
            onClick={() => setTypeFilter(opt.value)}
            className={`text-xs font-medium px-2.5 py-1 rounded-full border transition-colors ${
              typeFilter === opt.value
                ? "bg-teal-500 text-white border-teal-500"
                : "bg-white text-gray-500 border-gray-200 hover:border-teal-300"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {value && !open ? (
        <button
          onClick={() => { setOpen(true); setTimeout(() => inputRef.current?.focus(), 0); }}
          className="w-full text-left px-4 py-3 rounded-xl border-2 border-teal-200 bg-teal-50 flex items-center justify-between group hover:border-teal-400 transition-colors"
        >
          <div>
            <div className="font-semibold text-gray-800 text-sm leading-tight">{value.name}</div>
            <div className="text-xs text-gray-500 mt-0.5">{value.city}, {value.state}</div>
          </div>
          <div className="flex items-center gap-2">
            {value.schoolType && (
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${typeColors[value.schoolType] ?? "bg-gray-100 text-gray-600"}`}>
                {typeLabel[value.schoolType] ?? value.schoolType}
              </span>
            )}
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${tierColors[value.tier]}`}>{TIER_LABELS[value.tier]}</span>
            <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
          </div>
        </button>
      ) : (
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
            onFocus={() => setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 150)}
            onKeyDown={handleKey}
            placeholder={value ? `Currently: ${value.name}` : placeholder}
            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 bg-white focus:border-teal-400 focus:outline-none text-sm transition-colors"
            aria-label={label}
            aria-autocomplete="list"
            aria-expanded={open && results.length > 0}
          />
          <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      )}
      {open && results.length > 0 && (
        <ul
          ref={listRef}
          role="listbox"
          className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-xl max-h-72 overflow-auto"
        >
          {results.map((college, i) => (
            <li
              key={college.id}
              role="option"
              aria-selected={i === highlighted}
              onMouseDown={() => selectCollege(college)}
              onMouseEnter={() => setHighlighted(i)}
              className={`px-4 py-3 flex items-center justify-between cursor-pointer transition-colors ${i === highlighted ? "bg-teal-50" : "hover:bg-gray-50"} ${i < results.length - 1 ? "border-b border-gray-100" : ""}`}
            >
              <div>
                <div className="text-sm font-medium text-gray-800">{college.name}</div>
                <div className="text-xs text-gray-500">{college.city}, {college.state}</div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0 ml-2">
                {college.schoolType && (
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${typeColors[college.schoolType] ?? "bg-gray-100 text-gray-600"}`}>
                    {typeLabel[college.schoolType]}
                  </span>
                )}
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${tierColors[college.tier]}`}>{TIER_LABELS[college.tier]}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
      {open && query.length >= 2 && results.length === 0 && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-xl px-4 py-3 text-sm text-gray-500">
          No {typeFilter === "all" ? "" : typeFilter === "2-year" ? "community colleges" : "4-year colleges"} found for "{query}"
        </div>
      )}
    </div>
  );
}

  useEffect(() => { setHighlighted(0); }, [results]);

  function selectCollege(college) {
    onChange(college);
    setQuery("");
    setOpen(false);
  }

  function handleKey(e) {
    if (!open || results.length === 0) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setHighlighted((h) => Math.min(h + 1, results.length - 1)); }
    if (e.key === "ArrowUp") { e.preventDefault(); setHighlighted((h) => Math.max(h - 1, 0)); }
    if (e.key === "Enter") { e.preventDefault(); if (results[highlighted]) selectCollege(results[highlighted]); }
    if (e.key === "Escape") { setOpen(false); setQuery(""); }
  }

  useEffect(() => {
    if (open && listRef.current) {
      const el = listRef.current.children[highlighted];
      if (el) el.scrollIntoView({ block: "nearest" });
    }
  }, [highlighted, open]);

  const tierColors = { 1: "bg-violet-100 text-violet-700", 2: "bg-teal-100 text-teal-700", 3: "bg-blue-100 text-blue-700", 4: "bg-gray-100 text-gray-600" };

  return (
    <div className="relative">
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">{label}</label>
      {value && !open ? (
        <button
          onClick={() => { setOpen(true); setTimeout(() => inputRef.current?.focus(), 0); }}
          className="w-full text-left px-4 py-3 rounded-xl border-2 border-teal-200 bg-teal-50 flex items-center justify-between group hover:border-teal-400 transition-colors"
        >
          <div>
            <div className="font-semibold text-gray-800 text-sm leading-tight">{value.name}</div>
            <div className="text-xs text-gray-500 mt-0.5">{value.city}, {value.state}</div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${tierColors[value.tier]}`}>{TIER_LABELS[value.tier]}</span>
            <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
          </div>
        </button>
      ) : (
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
            onFocus={() => setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 150)}
            onKeyDown={handleKey}
            placeholder={value ? `Currently: ${value.name}` : placeholder}
            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 bg-white focus:border-teal-400 focus:outline-none text-sm transition-colors"
            aria-label={label}
            aria-autocomplete="list"
            aria-expanded={open && results.length > 0}
          />
          <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      )}
      {open && results.length > 0 && (
        <ul
          ref={listRef}
          role="listbox"
          className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-xl max-h-72 overflow-auto"
        >
          {results.map((college, i) => (
            <li
              key={college.id}
              role="option"
              aria-selected={i === highlighted}
              onMouseDown={() => selectCollege(college)}
              onMouseEnter={() => setHighlighted(i)}
              className={`px-4 py-3 flex items-center justify-between cursor-pointer transition-colors ${i === highlighted ? "bg-teal-50" : "hover:bg-gray-50"} ${i < results.length - 1 ? "border-b border-gray-100" : ""}`}
            >
              <div>
                <div className="text-sm font-medium text-gray-800">{college.name}</div>
                <div className="text-xs text-gray-500">{college.city}, {college.state}</div>
              </div>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ml-2 ${tierColors[college.tier]}`}>{TIER_LABELS[college.tier]}</span>
            </li>
          ))}
        </ul>
      )}
      {open && query.length >= 2 && results.length === 0 && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-xl px-4 py-3 text-sm text-gray-500">
          No colleges found for "{query}"
        </div>
      )}
    </div>
  );
}
