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
].join(',')

// Filters: four-year, Title IV eligible, currently operating, not purely for-profit
const FILTERS = [
  'school.degrees_awarded.predominant=3',   // predominantly bachelor's
  'school.operating=1',                      // currently operating
  'school.ownership=1,2',                    // public or private nonprofit (exclude for-profit)
].join('&')

async function fetchPage(page) {
  const url = `${BASE}?api_key=${API_KEY}&fields=${FIELDS}&${FILTERS}&per_page=${PER_PAGE}&page=${page}`
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
    id:          String(raw.id),
    name:        raw['school.name'],
    city:        raw['school.city'],
    state:       raw['school.state'],
    distanceOnly: raw['school.distance_only'] === 1,
    tier:        inferTier(admRate),
    ownership,
    locale:      inferArea(raw['school.locale']),
    tuition,
    roomBoard,
    booksOther,
    netPrice,
  }
}

async function main() {
  console.log('📡  Fetching colleges from College Scorecard API...')

  // First request to get total count
  const first = await fetchPage(0)
  const total = first.metadata.total
  const pages = Math.ceil(total / PER_PAGE)
  console.log(`   Found ${total} institutions across ${pages} pages`)

  const colleges = first.results.map(normalizeCollege)

  // Fetch remaining pages
  for (let page = 1; page < pages; page++) {
    process.stdout.write(`   Page ${page + 1}/${pages}...\r`)
    const data = await fetchPage(page)
    colleges.push(...data.results.map(normalizeCollege))
    // Polite delay to avoid rate limiting
    await new Promise(r => setTimeout(r, 150))
  }

  // Filter out any with missing names or states, and fully online-only institutions
  const clean = colleges.filter(c => c.name && c.state && !c.distanceOnly)

  // Sort alphabetically by name
  clean.sort((a, b) => a.name.localeCompare(b.name))

  console.log(`\n✅  Fetched ${clean.length} colleges`)

  // Write colleges.json — Vite imports this at build time
  const jsonPath = path.join(__dirname, '../src/data/colleges.json')
  fs.writeFileSync(jsonPath, JSON.stringify(clean, null, 2))
  const kb = Math.round(fs.statSync(jsonPath).size / 1024)
  console.log(`💾  Written src/data/colleges.json (${kb}KB, ${clean.length} colleges)`)

  if (kb > 500) console.warn(`⚠️  ${kb}KB — consider trimming fields`)
}

main().catch(err => {
  console.error('❌  Fetch failed:', err.message)
  process.exit(1)
})

// Note: After running this script, also inject into colleges.js
// by running: node scripts/inject-colleges.js
