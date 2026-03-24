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

const FIELDS = [
  'id',
  'school.name',
  'school.city',
  'school.state',
  'school.distance_only',
  'school.ownership',
  'school.locale',
  'school.degrees_awarded.predominant', // Added for CC support
  'latest.admissions.admission_rate.overall',
  'latest.cost.tuition.in_state',
  'latest.cost.tuition.out_of_state',
  'latest.cost.roomboard.oncampus',
  'latest.cost.booksupply',
  'latest.cost.otherexpense',
  'latest.cost.roomboard.offcampus',
  'latest.cost.avg_net_price.overall',
  'latest.cost.net_price.public.by_income_level.0-30000',
  'latest.cost.net_price.public.by_income_level.30001-48000',
  'latest.cost.net_price.public.by_income_level.48001-75000',
  'latest.cost.net_price.public.by_income_level.75001-110000',
  'latest.cost.net_price.public.by_income_level.110001-plus',
  'latest.cost.net_price.private.by_income_level.0-30000',
  'latest.cost.net_price.private.by_income_level.30001-48000',
  'latest.cost.net_price.private.by_income_level.48001-75000',
  'latest.cost.net_price.private.by_income_level.75001-110000',
  'latest.cost.net_price.private.by_income_level.110001-plus',
  'latest.earnings.10_yrs_after_entry.median',
].join(',')

const FILTERS = [
  'school.degrees_awarded.predominant=1,2,3', // Now includes CCs
  'school.operating=1',
  'school.ownership=1,2',
].join('&')

async function fetchPage(page) {
  const url = `${BASE}?api_key=${API_KEY}&fields=${FIELDS}&${FILTERS}&per_page=${PER_PAGE}&page=${page}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`API error ${res.status}: ${await res.text()}`)
  return res.json()
}

function inferTier(admissionRate) {
  if (admissionRate === null || admissionRate === undefined) return 3
  if (admissionRate < 0.15) return 1
  if (admissionRate < 0.40) return 2
  if (admissionRate < 0.70) return 3
  return 4
}

function inferArea(locale) {
  if (!locale) return 'Suburban'
  if (locale >= 11 && locale <= 13) return 'Urban'
  if (locale >= 21 && locale <= 23) return 'Suburban'
  return 'Rural'
}

function normalizeCollege(raw) {
  const admRate = raw['latest.admissions.admission_rate.overall']
  const tuitionIn  = raw['latest.cost.tuition.in_state']
  const tuitionOut = raw['latest.cost.tuition.out_of_state']
  const ownership  = raw['school.ownership']

  const tuition = ownership === 1 ? (tuitionIn ?? tuitionOut ?? 12000) : (tuitionOut ?? 35000)
  const roomBoard  = raw['latest.cost.roomboard.oncampus'] ?? raw['latest.cost.roomboard.offcampus'] ?? 12000
  const books      = raw['latest.cost.booksupply'] ?? 1200
  const other      = raw['latest.cost.otherexpense'] ?? 2000
  const booksOther = books + other

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
    degreeType:     raw['school.degrees_awarded.predominant'], // Saved for filtering
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

async function main() {
  console.log('📡  Fetching colleges...')
  const first = await fetchPage(0)
  const total = first.metadata.total
  const pages = Math.ceil(total / PER_PAGE)
  const colleges = first.results.map(normalizeCollege)

  for (let page = 1; page < pages; page++) {
    process.stdout.write(`   Page ${page + 1}/${pages}...\r`)
    const data = await fetchPage(page)
    colleges.push(...data.results.map(normalizeCollege))
    await new Promise(r => setTimeout(r, 150))
  }

  const clean = colleges.filter(c => c.name && c.state && !c.distanceOnly)
  clean.sort((a, b) => a.name.localeCompare(b.name))

  function median(arr) {
    if (!arr.length) return null
    const sorted = [...arr].sort((a, b) => a - b)
    const mid = Math.floor(sorted.length / 2)
    return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
  }

  const withEarnings = clean.filter(c => c.earningsMedian && c.earningsMedian > 0)
  const overallMedian = median(withEarnings.map(c => c.earningsMedian))
  
  const tierEarnings = { 1: [], 2: [], 3: [], 4: [] }
  for (const c of withEarnings) tierEarnings[c.tier]?.push(c.earningsMedian)
  const tierFallback = {}
  for (const tier of [1, 2, 3, 4]) {
    tierFallback[tier] = median(tierEarnings[tier]) ?? overallMedian
  }

  const output = clean.map(({ distanceOnly, earningsMedian, ...rest }) => {
    let raw = (earningsMedian && earningsMedian > 0 && overallMedian) 
      ? earningsMedian / overallMedian 
      : tierFallback[rest.tier] / overallMedian
    const earningsMultiplier = Math.round(Math.min(1.60, Math.max(0.75, raw)) * 1000) / 1000
    return { ...rest, earningsMultiplier }
  })

  fs.writeFileSync(path.join(__dirname, '../src/data/colleges.json'), JSON.stringify({
    _meta: { computedAt: new Date().toISOString(), total: output.length, overallMedianEarnings: overallMedian },
    colleges: output,
  }, null, 2))
  console.log(`\n💾 Saved ${output.length} colleges.`)
}
main().catch(console.error)
