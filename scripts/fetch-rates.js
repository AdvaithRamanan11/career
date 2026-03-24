/**
 * fetch-rates.js
 *
 * Fetches the 10-year rolling average annual wage growth rate from the
 * BLS Employment Cost Index (ECI) and writes src/data/rates.json for
 * the Vite build to bundle.
 *
 * The ECI measures quarterly percent changes in wages and salaries for
 * civilian workers. We compute the 10-year rolling average because a
 * single quarter is too noisy for a 30-year lifetime earnings projection,
 * while the long-run average is stable and methodologically defensible.
 *
 * Run manually:   node scripts/fetch-rates.js
 * Run in CI:      called by GitHub Actions annually (see .github/workflows/main.yml)
 *
 * Requires:  BLS_API_KEY env variable
 *   Free registration at: https://data.bls.gov/registrationEngine/
 *
 * BLS ECI series used:
 *   CIU2010000000000A — Wages and salaries, civilian workers, 12-month percent change
 *   Published quarterly. We fetch the last 40 quarters (10 years) and average them.
 */

import fs   from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const API_KEY   = process.env.BLS_API_KEY

if (!API_KEY) {
  console.error('❌  BLS_API_KEY env variable is not set.')
  console.error('    Register free at https://data.bls.gov/registrationEngine/')
  process.exit(1)
}

const BLS_API = 'https://api.bls.gov/publicAPI/v2/timeseries/data/'

// ECI: Wages and salaries, all civilian workers, 12-month percent change
// Series CIU2010000000000A — annual percent change, not seasonally adjusted
// Published quarterly. Each data point is the 12-month % change to that quarter.
const ECI_SERIES = 'CIU2010000000000A'

// How many years of history to average for the long-run rate
const ROLLING_YEARS = 10

// Fallback rate if BLS API is unavailable — based on BLS ECI 1980–2024 historical average
const FALLBACK_RATE = 0.034

async function main() {
  console.log('📡  Fetching ECI wage growth data from BLS...')

  const currentYear = new Date().getFullYear()
  const startYear   = currentYear - ROLLING_YEARS - 1  // extra year buffer

  let data
  try {
    const res = await fetch(BLS_API, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        seriesid:        [ECI_SERIES],
        startyear:       String(startYear),
        endyear:         String(currentYear),
        registrationkey: API_KEY,
      }),
    })

    if (!res.ok) throw new Error(`BLS API error ${res.status}: ${await res.text()}`)
    data = await res.json()
    if (data.status !== 'REQUEST_SUCCEEDED') {
      throw new Error(`BLS API failed: ${data.message?.join(', ') || JSON.stringify(data)}`)
    }
  } catch (err) {
    console.warn(`⚠  BLS API unavailable: ${err.message}`)
    console.warn(`   Using fallback rate: ${(FALLBACK_RATE * 100).toFixed(1)}%`)
    writeFallback()
    return
  }

  const series = data.Results?.series?.[0]
  if (!series?.data?.length) {
    console.warn('⚠  No ECI data returned — using fallback rate')
    writeFallback()
    return
  }

  // Each data point is already a 12-month percent change (annual rate)
  // Filter to last ROLLING_YEARS * 4 quarters (4 quarters per year)
  const allPoints = series.data
    .filter(d => d.value !== '-' && d.value !== null)
    .map(d => ({
      year:    parseInt(d.year),
      quarter: d.period,   // Q01, Q02, Q03, Q04
      value:   parseFloat(d.value) / 100,  // convert from percent to decimal
    }))
    .sort((a, b) => a.year !== b.year ? a.year - b.year : a.quarter.localeCompare(b.quarter))

  // Take the most recent ROLLING_YEARS * 4 quarters
  const recentPoints = allPoints.slice(-ROLLING_YEARS * 4)

  if (recentPoints.length < 8) {
    console.warn(`⚠  Only ${recentPoints.length} ECI data points returned — using fallback rate`)
    writeFallback()
    return
  }

  const avg = recentPoints.reduce((sum, d) => sum + d.value, 0) / recentPoints.length
  const annualGrowthRate = Math.round(avg * 10000) / 10000  // 4 decimal places

  const oldest = recentPoints[0]
  const newest = recentPoints[recentPoints.length - 1]

  console.log(`✅  ECI data: ${recentPoints.length} quarters (${oldest.year} ${oldest.quarter} → ${newest.year} ${newest.quarter})`)
  console.log(`📊  ${ROLLING_YEARS}-year rolling average annual wage growth: ${(annualGrowthRate * 100).toFixed(2)}%`)

  writeRates({
    annualWageGrowthRate: annualGrowthRate,
    rollingYears:         ROLLING_YEARS,
    quarterCount:         recentPoints.length,
    periodStart:          `${oldest.year} ${oldest.quarter}`,
    periodEnd:            `${newest.year} ${newest.quarter}`,
    isFallback:           false,
  })
}

function writeFallback() {
  writeRates({
    annualWageGrowthRate: FALLBACK_RATE,
    rollingYears:         ROLLING_YEARS,
    quarterCount:         null,
    periodStart:          null,
    periodEnd:            null,
    isFallback:           true,
    fallbackNote:         'BLS ECI API unavailable at build time. Rate based on 1980–2024 historical average.',
  })
}

function writeRates(rates) {
  const out = {
    _meta: {
      source:      'BLS Employment Cost Index (ECI), Wages and Salaries, Civilian Workers',
      seriesId:    ECI_SERIES,
      apiEndpoint: 'https://api.bls.gov/publicAPI/v2/timeseries/data/',
      computedAt:  new Date().toISOString(),
    },
    ...rates,
  }

  const outPath = path.join(__dirname, '../src/data/rates.json')
  fs.writeFileSync(outPath, JSON.stringify(out, null, 2))
  console.log(`💾  Written src/data/rates.json (annualWageGrowthRate: ${(out.annualWageGrowthRate * 100).toFixed(2)}%)`)
}

main().catch(err => {
  console.error('❌  fetch-rates.js failed:', err.message)
  console.warn('    Writing fallback rate to rates.json')
  writeFallback()
})
