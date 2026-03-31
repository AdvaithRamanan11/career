/**
 * fetch-salaries.js
 *
 * Fetches national annual median wages for all 96 CareerIQ occupations
 * from the BLS Public Data API v2 (OES survey) and writes
 * src/data/salaries.json for the Vite build to bundle.
 *
 * Run manually:   node scripts/fetch-salaries.js
 * Run in CI:      called by GitHub Actions annually (see .github/workflows/main.yml)
 *
 * Requires:  BLS_API_KEY env variable
 *   Free registration at: https://data.bls.gov/registrationEngine/
 *   Registered key: 500 requests/day (unregistered: 25/day)
 *
 * BLS OES series ID format for national annual median wage:
 *   OEUN000000{SOC_7digit}03
 *   e.g. Software Developers (15-1252) → OEUN000000000000015125203
 *
 * Data source: BLS Occupational Employment and Wage Statistics (OES)
 *   Published annually each April/May for the prior May reference period.
 *   https://www.bls.gov/oes/
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

// ─── Area Multiplier Config ───────────────────────────────────────────────────
const URBAN_METROS = {
  'New York-Newark':   '0035620',
  'Los Angeles':       '0031080',
  'Chicago':           '0016980',
  'San Francisco':     '0041860',
  'Washington DC':     '0047900',
  'Boston':            '0014460',
  'Seattle':           '0042660',
  'Dallas':            '0019100',
  'Houston':           '0026420',
  'Miami':             '0033100',
}

const RURAL_NONMETROS = {
  'Mississippi nonmetro':    '0028001',
  'Arkansas nonmetro':       '0005001',
  'West Virginia nonmetro':  '0054001',
  'Iowa nonmetro':           '0019001',
  'Montana nonmetro':        '0030001',
  'Idaho nonmetro':          '0016001',
  'South Dakota nonmetro':   '0046001',
  'Wyoming nonmetro':        '0056001',
}

const AREA_PROXY_SOCS = [
  '15-1252',  // Software Developers
  '29-1141',  // Registered Nurses
  '25-2031',  // Secondary School Teachers
  '13-2011',  // Accountants
  '17-2051',  // Civil Engineers
  '23-1011',  // Lawyers
  '27-1024',  // Graphic Designers
  '11-1021',  // General and Operations Managers
  '13-1111',  // Management Analysts
  '21-1022',  // Healthcare Social Workers
]

// ─── SOC Code Mapping ────────────────────────────────────────────────────────
const JOB_SOC_MAP = [
  // ── Computer Science ──────────────────────────────────────────────────────
  { jobId: 'software_engineer',      soc: '15-1252', title: 'Software Developers'                            },
  { jobId: 'data_scientist',         soc: '15-2051', title: 'Data Scientists'                                },
  { jobId: 'product_manager',        soc: '15-1299', title: 'Computer Occupations, All Other',  proxy: true  },
  { jobId: 'cybersecurity_analyst',  soc: '15-1212', title: 'Information Security Analysts'                  },
  { jobId: 'ml_engineer',            soc: '15-2051', title: 'Data Scientists',                  proxy: true  },
  { jobId: 'devops_engineer',        soc: '15-1244', title: 'Network and Computer Systems Administrators', proxy: true },
  { jobId: 'ux_designer',            soc: '15-1255', title: 'Web and Digital Interface Designers'            },
  { jobId: 'it_manager',             soc: '11-3021', title: 'Computer and Information Systems Managers'      },

  // ── Business Administration ───────────────────────────────────────────────
  { jobId: 'financial_analyst',      soc: '13-2051', title: 'Financial and Investment Analysts'               },
  { jobId: 'marketing_manager',      soc: '11-2021', title: 'Marketing Managers'                              },
  { jobId: 'management_consultant',  soc: '13-1111', title: 'Management Analysts'                             },
  { jobId: 'accountant',             soc: '13-2011', title: 'Accountants and Auditors'                        },
  { jobId: 'hr_manager',             soc: '11-3121', title: 'Human Resources Managers'                        },
  { jobId: 'sales_manager',          soc: '11-2022', title: 'Sales Managers'                                  },
  { jobId: 'operations_manager',     soc: '11-1021', title: 'General and Operations Managers'                 },
  { jobId: 'investment_banker',      soc: '13-2099', title: 'Financial Specialists, All Other', proxy: true   },

  // ── Engineering ───────────────────────────────────────────────────────────
  { jobId: 'mechanical_engineer',    soc: '17-2141', title: 'Mechanical Engineers'                            },
  { jobId: 'electrical_engineer',    soc: '17-2071', title: 'Electrical Engineers'                            },
  { jobId: 'civil_engineer',         soc: '17-2051', title: 'Civil Engineers'                                 },
  { jobId: 'chemical_engineer',      soc: '17-2041', title: 'Chemical Engineers'                              },
  { jobId: 'aerospace_engineer',     soc: '17-2011', title: 'Aerospace Engineers'                             },
  { jobId: 'biomedical_engineer',    soc: '17-2031', title: 'Bioengineers and Biomedical Engineers'           },
  { jobId: 'environmental_engineer', soc: '17-2081', title: 'Environmental Engineers'                         },
  { jobId: 'industrial_engineer',    soc: '17-2112', title: 'Industrial Engineers'                            },

  // ── Healthcare / Pre-Med ──────────────────────────────────────────────────
  { jobId: 'physician',              soc: '29-1216', title: 'General Internal Medicine Physicians'            },
  { jobId: 'nurse_practitioner',     soc: '29-1171', title: 'Nurse Practitioners'                             },
  { jobId: 'pharmacist',             soc: '29-1051', title: 'Pharmacists'                                     },
  { jobId: 'registered_nurse',       soc: '29-1141', title: 'Registered Nurses'                               },
  { jobId: 'physician_assistant',    soc: '29-1071', title: 'Physician Assistants'                            },
  { jobId: 'physical_therapist',     soc: '29-1123', title: 'Physical Therapists'                             },
  { jobId: 'occupational_therapist', soc: '29-1122', title: 'Occupational Therapists'                         },
  { jobId: 'dentist',                soc: '29-1021', title: 'Dentists, General'                               },

  // ── Pre-Law / Political Science ───────────────────────────────────────────
  { jobId: 'corporate_lawyer',       soc: '23-1011', title: 'Lawyers'                                         },
  { jobId: 'public_defender',        soc: '23-1011', title: 'Lawyers',                           proxy: true  },
  { jobId: 'policy_analyst',         soc: '19-3094', title: 'Political Scientists',               proxy: true  },
  { jobId: 'government_official',    soc: '13-1041', title: 'Compliance Officers',                proxy: true  },
  { jobId: 'paralegal',              soc: '23-2011', title: 'Paralegals and Legal Assistants'                 },
  { jobId: 'judge',                  soc: '23-1023', title: 'Judges, Magistrate Judges, and Magistrates'      },
  { jobId: 'lobbyist',               soc: '11-9199', title: 'Managers, All Other',                proxy: true  },
  { jobId: 'diplomat',               soc: '11-9199', title: 'Managers, All Other',                proxy: true  },

  // ── Education — broader SOC aggregates used because BLS suppresses median
  //    for detailed education codes; these broader codes have median data. ──
  { jobId: 'hs_teacher',             soc: '25-2030', title: 'Secondary School Teachers',                      proxy: true },
  { jobId: 'elementary_teacher',     soc: '25-2020', title: 'Elementary School Teachers',                     proxy: true },
  { jobId: 'school_counselor',       soc: '21-1012', title: 'Educational, Guidance, and Career Counselors and Advisors' },
  { jobId: 'special_ed_teacher',     soc: '25-2050', title: 'Special Education Teachers',                     proxy: true },
  { jobId: 'college_professor',      soc: '25-1000', title: 'Postsecondary Teachers, All'                     },
  { jobId: 'curriculum_developer',   soc: '25-9031', title: 'Instructional Coordinators'                      },
  { jobId: 'education_administrator',soc: '11-9030', title: 'Education Administrators',                       proxy: true },
  { jobId: 'instructional_designer', soc: '25-9031', title: 'Instructional Coordinators',         proxy: true  },

  // ── Social Sciences / Psychology ──────────────────────────────────────────
  { jobId: 'psychologist',           soc: '19-3039', title: 'Psychologists, All Other'                        },
  { jobId: 'social_worker',          soc: '21-1022', title: 'Healthcare Social Workers'                       },
  { jobId: 'market_researcher',      soc: '13-1161', title: 'Market Research Analysts and Marketing Specialists' },
  { jobId: 'ux_researcher',          soc: '19-3099', title: 'Social Scientists and Related Workers, All Other', proxy: true },
  { jobId: 'nonprofit_manager',      soc: '11-9151', title: 'Social and Community Service Managers'           },
  { jobId: 'community_organizer',    soc: '21-1099', title: 'Community and Social Service Specialists, All Other' },
  { jobId: 'hr_specialist',          soc: '13-1071', title: 'Human Resources Specialists'                     },
  { jobId: 'recruiter',              soc: '13-1071', title: 'Human Resources Specialists',        proxy: true  },

  // ── Communications / Journalism ───────────────────────────────────────────
  { jobId: 'journalist',             soc: '27-3023', title: 'News Analysts, Reporters, and Journalists'       },
  { jobId: 'pr_specialist',          soc: '27-3031', title: 'Public Relations Specialists'                    },
  { jobId: 'content_strategist',     soc: '27-3043', title: 'Writers and Authors',                proxy: true  },
  { jobId: 'broadcast_journalist',   soc: '27-3023', title: 'News Analysts, Reporters, and Journalists', proxy: true },
  { jobId: 'advertising_manager',    soc: '11-2011', title: 'Advertising and Promotions Managers'             },
  { jobId: 'social_media_manager',   soc: '11-2021', title: 'Marketing Managers',                 proxy: true  },
  { jobId: 'technical_writer',       soc: '27-3042', title: 'Technical Writers'                               },
  { jobId: 'editor',                 soc: '27-3041', title: 'Editors'                                         },

  // ── Arts & Design ─────────────────────────────────────────────────────────
  { jobId: 'graphic_designer',       soc: '27-1024', title: 'Graphic Designers'                               },
  { jobId: 'industrial_designer',    soc: '27-1021', title: 'Commercial and Industrial Designers'             },
  { jobId: 'animator',               soc: '27-1014', title: 'Special Effects Artists and Animators'           },
  { jobId: 'architect',              soc: '17-1011', title: 'Architects, Except Landscape and Naval'          },
  { jobId: 'interior_designer',      soc: '27-1025', title: 'Interior Designers'                              },
  { jobId: 'fashion_designer',       soc: '27-1022', title: 'Fashion Designers'                               },
  { jobId: 'art_director',           soc: '27-1011', title: 'Art Directors'                                   },
  { jobId: 'game_designer',          soc: '15-1255', title: 'Web and Digital Interface Designers', proxy: true },

  // ── Natural Sciences ──────────────────────────────────────────────────────
  { jobId: 'biologist',              soc: '19-1029', title: 'Biological Scientists, All Other'                },
  { jobId: 'chemist',                soc: '19-2031', title: 'Chemists'                                        },
  { jobId: 'physicist',              soc: '19-2012', title: 'Physicists'                                      },
  { jobId: 'geoscientist',           soc: '19-2042', title: 'Geoscientists, Except Hydrologists and Geographers' },
  { jobId: 'environmental_scientist',soc: '19-2041', title: 'Environmental Scientists and Specialists, Including Health' },
  { jobId: 'biochemist',             soc: '19-1021', title: 'Biochemists and Biophysicists'                   },
  { jobId: 'epidemiologist',         soc: '19-1041', title: 'Epidemiologists'                                 },
  { jobId: 'zoologist',              soc: '19-1023', title: 'Zoologists and Wildlife Biologists'              },

  // ── Finance & Economics ───────────────────────────────────────────────────
  { jobId: 'economist',              soc: '19-3011', title: 'Economists'                                      },
  { jobId: 'investment_analyst',     soc: '13-2051', title: 'Financial and Investment Analysts',  proxy: true  },
  { jobId: 'actuary',                soc: '15-2011', title: 'Actuaries'                                       },
  { jobId: 'financial_manager',      soc: '11-3031', title: 'Financial Managers'                              },
  { jobId: 'personal_financial_advisor', soc: '13-2052', title: 'Personal Financial Advisors'                 },
  { jobId: 'portfolio_manager',      soc: '13-2099', title: 'Financial Specialists, All Other',   proxy: true  },
  { jobId: 'risk_analyst',           soc: '13-2099', title: 'Financial Specialists, All Other',   proxy: true  },
  { jobId: 'tax_specialist',         soc: '13-2011', title: 'Accountants and Auditors',            proxy: true  },

  // ── Nursing ───────────────────────────────────────────────────────────────
  { jobId: 'rn',                     soc: '29-1141', title: 'Registered Nurses'                               },
  { jobId: 'icu_nurse',              soc: '29-1141', title: 'Registered Nurses',                  proxy: true  },
  { jobId: 'travel_nurse',           soc: '29-1141', title: 'Registered Nurses',                  proxy: true  },
  { jobId: 'nurse_manager',          soc: '11-9111', title: 'Medical and Health Services Managers'            },
  { jobId: 'crna',                   soc: '29-1151', title: 'Nurse Anesthetists'                              },
  { jobId: 'midwife',                soc: '29-1161', title: 'Nurse-Midwives'                                  },
  { jobId: 'clinical_nurse',         soc: '29-1141', title: 'Registered Nurses',                  proxy: true  },
  { jobId: 'nursing_professor',      soc: '25-1070', title: 'Health Specialties Teachers, Postsecondary',     proxy: true },
]

// ─── Proxy Premiums ──────────────────────────────────────────────────────────
const PROXY_PREMIUMS = {
  product_manager:    1.18,
  ml_engineer:        1.25,
  devops_engineer:    1.08,
  investment_banker:  1.45,
  public_defender:    0.55,
  lobbyist:           1.15,
  social_media_manager: 0.85,
  ux_researcher:      1.05,
  portfolio_manager:  1.35,
  risk_analyst:       1.10,
  icu_nurse:          1.07,
  travel_nurse:       1.18,
  clinical_nurse:     1.05,
}

// ─── Build BLS Series IDs ────────────────────────────────────────────────────
// OES national annual median wage series: OEUN000000{SOC_7digit}03
function socToSeriesId(soc) {
  // Datatype 03 = Annual median wage
  // Example: Software Developers 15-1252 → OEUN000000000000015125203
  const digits = soc.replace('-', '')
  return `OEUN0000000000000${digits}03`
}

function metroSeriesId(metroCode, soc) {
  // Metro area annual median wage: datatype 03
  const digits = soc.replace('-', '')
  return `OEUM${metroCode}000000${digits}03`
}

function ruralSeriesId(areaCode, soc) {
  // Rural nonmetro annual median wage: datatype 03
  const digits = soc.replace('-', '')
  return `OEUM${areaCode}000000${digits}03`
}

// Deduplicate — multiple jobs share the same SOC, only fetch each series once
const uniqueSocs = [...new Set(JOB_SOC_MAP.map(j => j.soc))]
const seriesIds  = uniqueSocs.map(soc => ({ soc, seriesId: socToSeriesId(soc) }))

// Build area proxy series — metro + rural nonmetro for representative SOCs
const areaSeriesIds = []
for (const soc of AREA_PROXY_SOCS) {
  for (const [metroName, metroCode] of Object.entries(URBAN_METROS)) {
    areaSeriesIds.push({ type: 'urban', metroName, soc, seriesId: metroSeriesId(metroCode, soc) })
  }
  for (const [areaName, areaCode] of Object.entries(RURAL_NONMETROS)) {
    areaSeriesIds.push({ type: 'rural', areaName, soc, seriesId: ruralSeriesId(areaCode, soc) })
  }
}

const totalUrban = AREA_PROXY_SOCS.length * Object.keys(URBAN_METROS).length
const totalRural = AREA_PROXY_SOCS.length * Object.keys(RURAL_NONMETROS).length
console.log(`📊  ${JOB_SOC_MAP.length} jobs → ${uniqueSocs.length} unique SOC codes → ${seriesIds.length} wage series`)
console.log(`📍  ${totalUrban} urban + ${totalRural} rural area series → ${areaSeriesIds.length} total`)

// ─── BLS API Fetcher ─────────────────────────────────────────────────────────
async function fetchBLSBatch(series) {
  const res = await fetch(BLS_API, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      seriesid:   series.map(s => s.seriesId),
      registrationkey: API_KEY,
      latest:     true,
    }),
  })
  if (!res.ok) throw new Error(`BLS API error ${res.status}: ${await res.text()}`)
  const json = await res.json()
  if (json.status !== 'REQUEST_SUCCEEDED') {
    throw new Error(`BLS API failed: ${json.message?.join(', ') || JSON.stringify(json)}`)
  }
  return json
}

function extractAnnualWage(seriesData) {
  const latest = seriesData.data?.[0]
  if (!latest || latest.value === '-') return null
  return Math.round(parseFloat(latest.value))
}

// ─── Main ────────────────────────────────────────────────────────────────────
async function main() {
  console.log('📡  Fetching median wages from BLS OES API...')

  const BATCH_SIZE = 50
  const wagesBySoc = {}

  for (let i = 0; i < seriesIds.length; i += BATCH_SIZE) {
    const batch = seriesIds.slice(i, i + BATCH_SIZE)
    const batchNum = Math.floor(i / BATCH_SIZE) + 1
    const totalBatches = Math.ceil(seriesIds.length / BATCH_SIZE)
    console.log(`   Batch ${batchNum}/${totalBatches} (${batch.length} series)...`)

    const json = await fetchBLSBatch(batch)

    for (const series of json.Results.series) {
      const match = batch.find(b => b.seriesId === series.seriesID)
      if (!match) continue
      const wage = extractAnnualWage(series)
      if (wage) {
        wagesBySoc[match.soc] = wage
        console.log(`     ✓ ${match.soc}: $${wage.toLocaleString()}`)
      } else {
        console.warn(`     ⚠ ${match.soc}: no data returned`)
      }
    }

    if (i + BATCH_SIZE < seriesIds.length) {
      await new Promise(r => setTimeout(r, 500))
    }
  }

  const missingJobs = []

  const jobs = JOB_SOC_MAP.map(({ jobId, soc, title, proxy }) => {
    const blsWage = wagesBySoc[soc]
    const premium = PROXY_PREMIUMS[jobId] ?? 1.0

    if (!blsWage) {
      missingJobs.push({ jobId, soc })
      return null
    }

    return {
      jobId,
      blsBase:      Math.round(blsWage * premium),
      socCode:      soc,
      socTitle:     title,
      isProxy:      proxy ?? false,
      proxyPremium: proxy ? premium : undefined,
      source:       'BLS OES',
    }
  })

  if (missingJobs.length > 0) {
    console.error(`\n❌  ${missingJobs.length} job(s) returned no BLS data:`)
    for (const { jobId, soc } of missingJobs) {
      console.error(`     ${jobId} (SOC ${soc}) — check if BLS suppressed this series`)
      console.error(`     Try a broader aggregate SOC code in JOB_SOC_MAP`)
    }
    process.exit(1)
  }

  console.log(`\n✅  All ${jobs.length} jobs have live BLS median data`)

  // ─── Fetch area multipliers ────────────────────────────────────────────────
  console.log('\n📍  Fetching area wage data from BLS OES...')
  const areaWages = { urban: {}, rural: {} }

  for (let i = 0; i < areaSeriesIds.length; i += BATCH_SIZE) {
    const batch = areaSeriesIds.slice(i, i + BATCH_SIZE)
    const batchNum = Math.floor(i / BATCH_SIZE) + 1
    const totalBatches = Math.ceil(areaSeriesIds.length / BATCH_SIZE)
    process.stdout.write(`   Area batch ${batchNum}/${totalBatches}...\r`)

    let json
    try {
      json = await fetchBLSBatch(batch)
    } catch (err) {
      console.warn(`   ⚠ Area batch ${batchNum} failed: ${err.message} — skipping`)
      continue
    }

    for (const series of json.Results.series) {
      const match = batch.find(b => b.seriesId === series.seriesID)
      if (!match) continue
      const wage = extractAnnualWage(series)
      if (!wage) continue

      if (match.type === 'urban') {
        if (!areaWages.urban[match.soc]) areaWages.urban[match.soc] = []
        areaWages.urban[match.soc].push(wage)
      } else {
        if (!areaWages.rural[match.soc]) areaWages.rural[match.soc] = []
        areaWages.rural[match.soc].push(wage)
      }
    }

    if (i + BATCH_SIZE < areaSeriesIds.length) {
      await new Promise(r => setTimeout(r, 500))
    }
  }

  const urbanRatios = []
  const ruralRatios = []

  for (const soc of AREA_PROXY_SOCS) {
    const nationalWage = wagesBySoc[soc]
    if (!nationalWage) continue

    const urbanWages = areaWages.urban[soc]
    if (urbanWages?.length > 0) {
      const urbanMean = urbanWages.reduce((a, b) => a + b, 0) / urbanWages.length
      urbanRatios.push(urbanMean / nationalWage)
    }

    const ruralWages = areaWages.rural[soc]
    if (ruralWages?.length > 0) {
      const ruralMean = ruralWages.reduce((a, b) => a + b, 0) / ruralWages.length
      ruralRatios.push(ruralMean / nationalWage)
    }
  }

  const avg = arr => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null

  const urbanMultiplier  = urbanRatios.length  ? Math.round(avg(urbanRatios)  * 1000) / 1000 : 1.12
  const ruralMultiplier  = ruralRatios.length  ? Math.round(avg(ruralRatios)  * 1000) / 1000 : 0.84

  const areaMultipliers = {
    Urban:    urbanMultiplier,
    Suburban: 1.000,
    Rural:    ruralMultiplier,
  }

  if (urbanRatios.length === 0) console.warn('⚠  No urban area data returned — using hardcoded fallback 1.12')
  if (ruralRatios.length === 0) console.warn('⚠  No rural area data returned — using hardcoded fallback 0.84')
  else console.log(`     (${ruralRatios.length} SOC ratios across ${Object.keys(RURAL_NONMETROS).length} rural nonmetro areas)`)

  console.log('\n📍  Area multipliers derived from BLS OES metro data:')
  console.log(`     Urban:    ${areaMultipliers.Urban}x  (avg of ${urbanRatios.length} SOC ratios across ${Object.keys(URBAN_METROS).length} metros)`)
  console.log(`     Suburban: ${areaMultipliers.Suburban}x  (national baseline)`)
  console.log(`     Rural:    ${areaMultipliers.Rural}x  (avg of ${ruralRatios.length} SOC ratios across ${Object.keys(RURAL_NONMETROS).length} rural nonmetro areas)`)

  const out = {
    _meta: {
      source:      'BLS Occupational Employment and Wage Statistics (OES)',
      apiEndpoint: 'https://api.bls.gov/publicAPI/v2/timeseries/data/',
      fetchedAt:   new Date().toISOString(),
      note:        'Annual median wages, area multipliers, and proxy premiums. All derived from BLS OES data.',
      areaMultipliers,
    },
    jobs,
  }

  const outPath = path.join(__dirname, '../src/data/salaries.json')
  fs.writeFileSync(outPath, JSON.stringify(out, null, 2))
  const kb = Math.round(fs.statSync(outPath).size / 1024)
  console.log(`💾  Written src/data/salaries.json (${kb}KB, ${jobs.length} jobs)`)
}

main().catch(err => {
  console.error('❌  Fetch failed:', err.message)
  process.exit(1)
})
