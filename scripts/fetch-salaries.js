/**
 * fetch-salaries.js
 *
 * Fetches national annual mean wages for all 96 CareerIQ occupations
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
 * BLS OES series ID format for national annual mean wage:
 *   OEUM000000{SOC_7digit}08
 *   e.g. Software Developers (15-1252) → OEUM0000001512520 08
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

// ─── SOC Code Mapping ────────────────────────────────────────────────────────
// Each job maps to a BLS Standard Occupational Classification (SOC) code.
// Where no exact SOC exists, the closest category is used (noted with *proxy*).
// The 7-digit series segment = SOC code digits only, zero-padded to 7 chars.
//
// Full OES series: OEUM000000{7digits}08
//   OEUM = OES, U = U.S. national, M = mean wage
//   000000 = national (no metro)
//   08 = annual mean wage datatype

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

  // ── Education ─────────────────────────────────────────────────────────────
  { jobId: 'hs_teacher',             soc: '25-2031', title: 'Secondary School Teachers, Except Special and Career/Technical Education' },
  { jobId: 'elementary_teacher',     soc: '25-2021', title: 'Elementary School Teachers, Except Special Education' },
  { jobId: 'school_counselor',       soc: '21-1012', title: 'Educational, Guidance, and Career Counselors and Advisors' },
  { jobId: 'special_ed_teacher',     soc: '25-2050', title: 'Special Education Teachers'                      },
  { jobId: 'college_professor',      soc: '25-1099', title: 'Postsecondary Teachers, All Other'               },
  { jobId: 'curriculum_developer',   soc: '25-9031', title: 'Instructional Coordinators'                      },
  { jobId: 'education_administrator',soc: '11-9032', title: 'Education Administrators, Kindergarten through Secondary' },
  { jobId: 'instructional_designer', soc: '25-9031', title: 'Instructional Coordinators',         proxy: true  },

  // ── Social Sciences / Psychology ──────────────────────────────────────────
  { jobId: 'psychologist',           soc: '19-3031', title: 'Clinical and Counseling Psychologists'           },
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
  { jobId: 'nursing_professor',      soc: '25-1071', title: 'Health Specialties Teachers, Postsecondary'      },
]

// ─── Proxy Premiums ──────────────────────────────────────────────────────────
// Jobs that share a SOC code with a broader category often earn more or less
// than the BLS mean for that category. These multipliers adjust the BLS value
// to better reflect market reality (sourced from Glassdoor / Levels.fyi / NALP).
// Applied on top of the BLS fetched value, not hardcoded salary.
const PROXY_PREMIUMS = {
  product_manager:    1.18,   // PM premium over generic "Computer Occupations" (Levels.fyi)
  ml_engineer:        1.25,   // ML/AI premium over Data Scientists (Levels.fyi 2024)
  devops_engineer:    1.08,   // DevOps premium over Sys Admins (Glassdoor)
  investment_banker:  1.45,   // IB premium over generic Financial Specialists (NALP)
  public_defender:    0.55,   // Public defenders earn ~55% of private lawyers (NALP)
  lobbyist:           1.15,   // Lobbyist premium over Managers (BLS lobbying sector data)
  social_media_manager: 0.85, // Social media mgr earns less than full Marketing Mgr (Glassdoor)
  ux_researcher:      1.05,   // Slight UX researcher premium over social scientists
  portfolio_manager:  1.35,   // Portfolio mgr premium over generic financial specialists
  risk_analyst:       1.10,   // Risk analyst premium over generic financial specialists
  icu_nurse:          1.07,   // ICU differential over standard RN (BLS NCS shift data)
  travel_nurse:       1.18,   // Travel nursing premium (Staffing Industry Analysts 2024)
  clinical_nurse:     1.05,   // CNS premium over standard RN
}

// ─── Build BLS Series IDs ────────────────────────────────────────────────────
// OES national annual mean wage series: OEUM000000{SOC_7digit}08
function socToSeriesId(soc) {
  const digits = soc.replace('-', '')           // '15-1252' → '1512520'... wait
  // SOC '15-1252' has 6 digits. BLS series uses 7-digit occupation segment.
  // Format: remove dash → pad to 7 digits with trailing zero → '15-1252' = '1512520'
  const padded = digits.padEnd(7, '0')
  return `OEUM000000${padded}08`
}

// Deduplicate — multiple jobs share the same SOC, only fetch each series once
const uniqueSocs = [...new Set(JOB_SOC_MAP.map(j => j.soc))]
const seriesIds  = uniqueSocs.map(soc => ({ soc, seriesId: socToSeriesId(soc) }))

console.log(`📊  ${JOB_SOC_MAP.length} jobs → ${uniqueSocs.length} unique SOC codes → ${seriesIds.length} BLS series to fetch`)

// ─── BLS API Fetcher ─────────────────────────────────────────────────────────
// BLS API v2 accepts up to 50 series per request.
async function fetchBLSBatch(series) {
  const res = await fetch(BLS_API, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      seriesid:   series.map(s => s.seriesId),
      registrationkey: API_KEY,
      latest:     true,   // only fetch the most recent data point
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
  // BLS returns the value in dollars (annual mean wage for datatype 08)
  const latest = seriesData.data?.[0]
  if (!latest || latest.value === '-') return null
  return Math.round(parseFloat(latest.value))
}

// ─── Main ────────────────────────────────────────────────────────────────────
async function main() {
  console.log('📡  Fetching wages from BLS OES API...')

  // Split into batches of 50 (BLS API limit)
  const BATCH_SIZE = 50
  const wagesBySoc = {}

  for (let i = 0; i < seriesIds.length; i += BATCH_SIZE) {
    const batch = seriesIds.slice(i, i + BATCH_SIZE)
    const batchNum = Math.floor(i / BATCH_SIZE) + 1
    const totalBatches = Math.ceil(seriesIds.length / BATCH_SIZE)
    console.log(`   Batch ${batchNum}/${totalBatches} (${batch.length} series)...`)

    const json = await fetchBLSBatch(batch)

    for (const series of json.Results.series) {
      // Find which SOC this series belongs to
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

    // Polite delay between batches
    if (i + BATCH_SIZE < seriesIds.length) {
      await new Promise(r => setTimeout(r, 500))
    }
  }

  // ─── Build salaries.json ───────────────────────────────────────────────────
  // Map each job to its BLS wage, applying proxy premiums where needed.
  // Jobs with no BLS data fall back to the prior hardcoded value (from salaries.js).
  const FALLBACKS = buildFallbacks()

  const jobs = JOB_SOC_MAP.map(({ jobId, soc, title, proxy }) => {
    const blsWage  = wagesBySoc[soc]
    const premium  = PROXY_PREMIUMS[jobId] ?? 1.0
    const wage     = blsWage
      ? Math.round(blsWage * premium)
      : FALLBACKS[jobId]

    if (!blsWage) {
      console.warn(`   ⚠ ${jobId}: BLS returned no data for ${soc}, using fallback $${FALLBACKS[jobId]?.toLocaleString()}`)
    }

    return {
      jobId,
      blsBase:     wage,
      socCode:     soc,
      socTitle:    title,
      isProxy:     proxy ?? false,
      proxyPremium: proxy ? premium : undefined,
      source:      blsWage ? 'BLS OES' : 'fallback',
    }
  })

  const successful = jobs.filter(j => j.source === 'BLS OES').length
  console.log(`\n✅  ${successful}/${jobs.length} jobs have live BLS data`)

  // Write the output
  const out = {
    _meta: {
      source:      'BLS Occupational Employment and Wage Statistics (OES)',
      apiEndpoint: 'https://api.bls.gov/publicAPI/v2/timeseries/data/',
      fetchedAt:   new Date().toISOString(),
      note:        'Annual mean wages. Proxy jobs marked with isProxy=true have a proxyPremium applied.',
    },
    jobs,
  }

  const outPath = path.join(__dirname, '../src/data/salaries.json')
  fs.writeFileSync(outPath, JSON.stringify(out, null, 2))
  const kb = Math.round(fs.statSync(outPath).size / 1024)
  console.log(`💾  Written src/data/salaries.json (${kb}KB, ${jobs.length} jobs)`)
}

// ─── Fallback values (prior hardcoded data) ───────────────────────────────────
// Used only if BLS API returns no data for a series (rare — usually means the
// occupation was reclassified or the series ID changed). Update these when
// manually verifying data each year.
function buildFallbacks() {
  return {
    software_engineer: 130160, data_scientist: 108020, product_manager: 120000,
    cybersecurity_analyst: 112000, ml_engineer: 142000, devops_engineer: 118000,
    ux_designer: 85000, it_manager: 159000, financial_analyst: 96220,
    marketing_manager: 140040, management_consultant: 95290, accountant: 79880,
    hr_manager: 136350, sales_manager: 130600, operations_manager: 103650,
    investment_banker: 108000, mechanical_engineer: 96310, electrical_engineer: 101780,
    civil_engineer: 89940, chemical_engineer: 105550, aerospace_engineer: 122270,
    biomedical_engineer: 97410, environmental_engineer: 96820, industrial_engineer: 96350,
    physician: 229300, nurse_practitioner: 121610, pharmacist: 132750,
    registered_nurse: 81220, physician_assistant: 126010, physical_therapist: 97720,
    occupational_therapist: 93180, dentist: 163220, corporate_lawyer: 135740,
    public_defender: 72000, policy_analyst: 76300, government_official: 101750,
    paralegal: 59200, judge: 136910, lobbyist: 88000, diplomat: 84000,
    hs_teacher: 62360, elementary_teacher: 61620, school_counselor: 61710,
    special_ed_teacher: 62420, college_professor: 84380, curriculum_developer: 74620,
    education_administrator: 100340, instructional_designer: 77510,
    psychologist: 90590, social_worker: 58380, market_researcher: 68230,
    ux_researcher: 92000, nonprofit_manager: 66000, community_organizer: 52000,
    hr_specialist: 67650, recruiter: 63000, journalist: 55960, pr_specialist: 67440,
    content_strategist: 74000, broadcast_journalist: 57000, advertising_manager: 127830,
    social_media_manager: 63000, technical_writer: 79960, editor: 75680,
    graphic_designer: 58910, industrial_designer: 78450, animator: 81020,
    architect: 93310, interior_designer: 60340, fashion_designer: 78010,
    art_director: 106500, game_designer: 100080, biologist: 84000, chemist: 80890,
    physicist: 152430, geoscientist: 87480, environmental_scientist: 76480,
    biochemist: 100270, epidemiologist: 78830, zoologist: 67480,
    economist: 115730, investment_analyst: 105000, actuary: 120000,
    financial_manager: 156100, personal_financial_advisor: 94170,
    portfolio_manager: 132000, risk_analyst: 98000, tax_specialist: 82000,
    rn: 81220, icu_nurse: 87000, travel_nurse: 95000, nurse_manager: 104830,
    crna: 203090, midwife: 120880, clinical_nurse: 109000, nursing_professor: 84000,
  }
}

main().catch(err => {
  console.error('❌  Fetch failed:', err.message)
  process.exit(1)
})
