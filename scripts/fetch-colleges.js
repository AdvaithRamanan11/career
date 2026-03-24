/**
 * fetch-colleges.js
 *
 * Fetches ~3,000 four-year U.S. colleges from the College Scorecard API
 * and writes src/data/colleges.json for the Vite build to bundle.
 *
 * Run manually:   node scripts/fetch-colleges.js
 * Run in CI:      called by GitHub Actions (see .github/workflows/data.yml)
 *
 * Requires:  COLLEGE_SCORECARD_API_KEY env variable
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const API_KEY = process.env.COLLEGE_SCORECARD_API_KEY

if (!API_KEY) {
  console.error('❌  COLLEGE_SCORECARD_API_KEY env variable is not set.')
  process.exit(1)
}

const BASE = 'https://api.data.gov/ed/collegescorecard/v1/schools'
const PER_PAGE = 100

// Fields we need from the API
const FIELDS = [
  'id',
  'school.name',
  'school.city',
  'school.state',
  'school.distance_only',                            // 1=fully online, filter these out after fetch
  'school.ownership',                              // 1=public, 2=private nonprofit, 3=private for-profit
  'school.locale',                                 // 11-13=city, 21-23=suburb, 31-33=town, 41-43=rural
  'latest.admissions.admission_rate.overall',      // selectivity → tier
  'latest.cost.tuition.in_state',
  'latest.cost.tuition.out_of_state',
  'latest.cost.roomboard.oncampus',
  'latest.cost.booksupply',
  'latest.cost.otherexpense',
  'latest.cost.roomboard.offcampus',             // fallback if oncampus is null
  'latest.cost.avg_net_price.overall',           // fallback when income-bracket net price is null
  // Net price by family income bracket — public schools (NPT4x_PUB, IPEDS SFA survey)
  // Net price = COA − all grant & scholarship aid. Directly answers "what does a student pay?"
  'latest.cost.net_price.public.by_income_level.0-30000',
  'latest.cost.net_price.public.by_income_level.30001-48000',
  'latest.cost.net_price.public.by_income_level.48001-75000',
  'latest.cost.net_price.public.by_income_level.75001-110000',
  'latest.cost.net_price.public.by_income_level.110001-plus',
  // Net price by family income bracket — private nonprofit schools (NPT4x_PRIV)
  'latest.cost.net_price.private.by_income_level.0-30000',
  'latest.cost.net_price.private.by_income_level.30001-48000',
  'latest.cost.net_price.private.by_income_level.48001-75000',
  'latest.cost.net_price.private.by_income_level.75001-110000',
  'latest.cost.net_price.private.by_income_level.110001-plus',
  // Earnings data for deriving tier multipliers
  'latest.earnings.10_yrs_after_entry.median',    // median earnings 10yr after entry (all majors)
].join(',')

// Filters: Title IV eligible, currently operating, not purely for-profit
// We run two passes — one for 4-year (predominant=3) and one for 2-year (predominant=2).
// The API doesn't support predominant=2,3 in a single filter, so we merge after fetching.
const FILTERS_4YEAR = [
  'school.degrees_awarded.predominant=3',   // predominantly bachelor's
  'school.operating=1',
  'school.ownership=1,2',
].join('&')

const FILTERS_2YEAR = [
  'school.degrees_awarded.predominant=2',   // predominantly associate's (community colleges)
  'school.operating=1',
  'school.ownership=1,2',
].join('&')

async function fetchPage(page, filters) {
  const url = `${BASE}?api_key=${API_KEY}&fields=${FIELDS}&${filters}&per_page=${PER_PAGE}&page=${page}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`API error ${res.status}: ${await res.text()}`)
  return res.json()
}

function inferTier(admissionRate) {
  // Derive institutional tier from admission rate (College Scorecard selectivity)
  if (admissionRate === null || admissionRate === undefined) return 3
  if (admissionRate < 0.15) return 1  // Elite: <15% admit rate
  if (admissionRate < 0.40) return 2  // Selective: 15–40%
  if (admissionRate < 0.70) return 3  // Above average: 40–70%
  return 4                             // Average/open: >70%
}

function inferArea(locale) {
  // Map IPEDS locale code to our Urban/Suburban/Rural buckets
  if (!locale) return 'Suburban'
  if (locale >= 11 && locale <= 13) return 'Urban'
  if (locale >= 21 && locale <= 23) return 'Suburban'
  return 'Rural'
}

function normalizeCollege(raw) {
  const admRate = raw['latest.admissions.admission_rate.overall']
  const tuitionIn  = raw['latest.cost.tuition.in_state']
  const tuitionOut = raw['latest.cost.tuition.out_of_state']
  const ownership  = raw['school.ownership']  // 1=public, 2=private nonprofit

  // For public schools use in-state tuition; for private use out-of-state (same rate)
  const tuition = ownership === 1 ? (tuitionIn ?? tuitionOut ?? 12000) : (tuitionOut ?? 35000)

  // Use on-campus room & board; fall back to off-campus if null
  const roomBoard  = raw['latest.cost.roomboard.oncampus'] ?? raw['latest.cost.roomboard.offcampus'] ?? 12000
  const books      = raw['latest.cost.booksupply'] ?? 1200
  const other      = raw['latest.cost.otherexpense'] ?? 2000
  const booksOther = books + other

  // Net price by family income bracket (what a student actually pays after all grant aid).
  // Public and private schools report to separate IPEDS survey fields — pick by ownership.
  // Net price can be negative for very generous schools (full ride + stipend); floor at 0.
  const np = ownership === 1 ? 'public' : 'private'
  const netPrice = {
    low:  Math.max(0, raw[`latest.cost.net_price.${np}.by_income_level.0-30000`]      ?? raw['latest.cost.avg_net_price.overall'] ?? tuition),
    mid1: Math.max(0, raw[`latest.cost.net_price.${np}.by_income_level.30001-48000`]  ?? raw['latest.cost.avg_net_price.overall'] ?? tuition),
    mid2: Math.max(0, raw[`latest.cost.net_price.${np}.by_income_level.48001-75000`]  ?? raw['latest.cost.avg_net_price.overall'] ?? tuition),
    mid3: Math.max(0, raw[`latest.cost.net_price.${np}.by_income_level.75001-110000`] ?? raw['latest.cost.avg_net_price.overall'] ?? tuition),
    high: Math.max(0, raw[`latest.cost.net_price.${np}.by_income_level.110001-plus`]  ?? raw['latest.cost.avg_net_price.overall'] ?? tuition),
  }

  return {
    id:             String(raw.id),
    name:           raw['school.name'],
    city:           raw['school.city'],
    state:          raw['school.state'],
    distanceOnly:   raw['school.distance_only'] === 1,
    schoolType:     raw['school.degrees_awarded.predominant'] === 2 ? '2-year' : '4-year',
    tier:           inferTier(admRate),
    ownership,
    locale:         inferArea(raw['school.locale']),
    tuition,
    roomBoard,
    booksOther,
    netPrice,
    earningsMedian: raw['latest.earnings.10_yrs_after_entry.median'] ?? null,
  }
}

async function fetchAllPages(filters, label) {
  const first = await fetchPage(0, filters)
  const total = first.metadata.total
  const pages = Math.ceil(total / PER_PAGE)
  console.log(`   [${label}] Found ${total} institutions across ${pages} pages`)

  const colleges = first.results.map(normalizeCollege)
  for (let page = 1; page < pages; page++) {
    process.stdout.write(`   [${label}] Page ${page + 1}/${pages}...\r`)
    const data = await fetchPage(page, filters)
    colleges.push(...data.results.map(normalizeCollege))
    await new Promise(r => setTimeout(r, 150))
  }
  return colleges
}

async function main() {
  console.log('📡  Fetching colleges from College Scorecard API...')

  const [fourYear, twoYear] = await Promise.all([
    fetchAllPages(FILTERS_4YEAR, '4-year'),
    fetchAllPages(FILTERS_2YEAR, '2-year'),
  ])

  console.log(`\n   4-year institutions: ${fourYear.length}`)
  console.log(`   2-year institutions (community colleges): ${twoYear.length}`)

  const colleges = [...fourYear, ...twoYear]

  // Filter out any with missing names or states, and fully online-only institutions
  const clean = colleges.filter(c => c.name && c.state && !c.distanceOnly)

  // Sort alphabetically by name
  clean.sort((a, b) => a.name.localeCompare(b.name))

console.log(`\n✅  Fetched ${clean.length} colleges`)

  // ─── Per-college earnings multipliers ──────────────────────────────────────
  // Each college gets its own multiplier = its Scorecard median earnings divided
  // by the national median across all colleges with earnings data.
  //
  // This replaces the previous tier-grouped approach, which was skewed by
  // specialized institutions (pharmacy colleges, maritime academies, engineering
  // institutes) that have high field-specific earnings but open admission rates,
  // causing Tier 4 median to exceed Tier 3 in practice.
  //
  // Colleges missing Scorecard earnings data fall back to their tier's median
  // as a proxy. All multipliers are capped to [0.75, 1.60] to prevent outliers.
  //
  // Data source: College Scorecard latest.earnings.10_yrs_after_entry.median

  function median(arr) {
    if (!arr.length) return null
    const sorted = [...arr].sort((a, b) => a - b)
    const mid = Math.floor(sorted.length / 2)
    return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
  }

  const withEarnings = clean.filter(c => c.earningsMedian && c.earningsMedian > 0)
  const overallMedian = median(withEarnings.map(c => c.earningsMedian))
  console.log(`📊  National median earnings (baseline): $${overallMedian?.toLocaleString()}`)
  console.log(`     ${withEarnings.length}/${clean.length} colleges have Scorecard earnings data`)

  // Tier fallback medians — used only for the ~7% of colleges missing earnings data
  const tierEarnings = { 1: [], 2: [], 3: [], 4: [] }
  for (const c of withEarnings) tierEarnings[c.tier]?.push(c.earningsMedian)
  const tierFallback = {}
  for (const tier of [1, 2, 3, 4]) {
    tierFallback[tier] = median(tierEarnings[tier]) ?? overallMedian
  }

  const MIN_MULT = 0.75
  const MAX_MULT = 1.60
  let fallbackCount = 0

  const output = clean.map(({ distanceOnly, earningsMedian, ...rest }) => {
    let raw
    if (earningsMedian && earningsMedian > 0 && overallMedian) {
      raw = earningsMedian / overallMedian
    } else {
      raw = tierFallback[rest.tier] / overallMedian
      fallbackCount++
    }
    const earningsMultiplier = Math.round(Math.min(MAX_MULT, Math.max(MIN_MULT, raw)) * 1000) / 1000
    return { ...rest, earningsMultiplier }
  })

  console.log(`     ${output.length - fallbackCount} colleges use individual Scorecard multipliers`)
  console.log(`     ${fallbackCount} colleges use tier-median fallback (no Scorecard data)`)

  // Write colleges.json — Vite imports this at build time
  const jsonPath = path.join(__dirname, '../src/data/colleges.json')
  fs.writeFileSync(jsonPath, JSON.stringify({
    _meta: {
      computedAt: new Date().toISOString(),
      overallMedianEarnings: overallMedian,
      multiplierRange: [MIN_MULT, MAX_MULT],
      scorecardsWithEarnings: withEarnings.length,
      fallbackCount,
      counts: {
        total: output.length,
        fourYear: output.filter(c => c.schoolType === '4-year').length,
        twoYear: output.filter(c => c.schoolType === '2-year').length,
      },
    },
    colleges: output,
  }, null, 2))
  const kb = Math.round(fs.statSync(jsonPath).size / 1024)
  console.log(`💾  Written src/data/colleges.json (${kb}KB, ${output.length} colleges)`)
}

main().catch(err => {
  console.error('❌  Fetch failed:', err.message)
  process.exit(1)
})

// Note: After running this script, also inject into colleges.js
// by running: node scripts/inject-colleges.js
