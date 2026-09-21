/**
 * Staging seed: postcodes, sample providers and jobs, one applicant,
 * one provider account and one admin. Run with:
 *
 *   npm run seed
 *
 * Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.
 * The admin user here is STAGING ONLY — production admins are created
 * by migration or service role, never by seed or sign-up.
 */
import { readFileSync } from "node:fs"
import { createClient } from "@supabase/supabase-js"

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !serviceKey) {
  console.error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY first.")
  process.exit(1)
}

const db = createClient(url, serviceKey, { auth: { persistSession: false } })

async function seedPostcodes() {
  const { count } = await db.from("postcodes").select("*", { count: "exact", head: true })
  if (count && count > 10_000) {
    console.log(`postcodes: already seeded (${count})`)
    return
  }
  const lines = readFileSync("data/postcodes.csv", "utf8").trim().split("\n").slice(1)
  const rows = lines.map(function parseLine(line) {
    const [postcode, suburb, state, lat, lng] = line.split(",")
    return { postcode, suburb, state, lat: Number(lat), lng: Number(lng) }
  })
  for (let i = 0; i < rows.length; i += 2000) {
    const { error } = await db.from("postcodes").insert(rows.slice(i, i + 2000))
    if (error) throw error
  }
  console.log(`postcodes: inserted ${rows.length}`)
}

async function createUser(email: string) {
  const { data, error } = await db.auth.admin.createUser({
    email,
    email_confirm: true,
  })
  if (error) {
    if (error.message.includes("already been registered")) {
      const { data: list } = await db.auth.admin.listUsers()
      const existing = list.users.find((u) => u.email === email)
      if (existing) return existing.id
    }
    throw error
  }
  return data.user.id
}

function normaliseProviderName(name: string) {
  return name
    .toLowerCase()
    .replace(/\b(pty|ltd|limited|inc|co)\b\.?/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
}

async function seedAccounts() {
  const adminId = await createUser("admin@staging.supportwork.au")
  await db.from("admins").upsert({ user_id: adminId })

  const applicantId = await createUser("applicant@staging.supportwork.au")
  await db.from("profiles").upsert({
    user_id: applicantId,
    full_name: "Maree Callaghan",
    email: "applicant@staging.supportwork.au",
    phone: "0400 118 220",
    postcode: "6163",
    suburb: "Hamilton Hill",
    state: "WA",
    lat: -32.0851,
    lng: 115.7801,
    work_types: ["casual", "part_time"],
    requirements: ["drivers_licence", "own_vehicle", "ndis_screening", "first_aid"],
    about:
      "Support worker with four years of experience in supported independent living and community access. Comfortable with personal care, medication prompts and overnight shifts.",
  })

  const providerOwnerId = await createUser("provider@staging.supportwork.au")
  const { data: provider, error } = await db
    .from("providers")
    .upsert(
      {
        owner_user_id: providerOwnerId,
        business_name: "Banksia Community Care",
        normalised_name: normaliseProviderName("Banksia Community Care"),
        abn: "51824753556",
        contact_name: "Dean Whitfield",
        email: "provider@staging.supportwork.au",
        phone: "08 9430 5510",
        website_domain: "banksiacommunitycare.au",
        is_employer_attested: true,
        first_job_approved: true,
        stripe_subscription_status: "trialing",
        trial_end: new Date(Date.now() + 14 * 86_400_000).toISOString(),
      },
      { onConflict: "owner_user_id" }
    )
    .select()
    .single()
  if (error) throw error
  console.log("accounts: admin, applicant, provider ready")
  return provider.id as string
}

interface SeedJob {
  title: string
  category: string
  suburb: string
  state: string
  postcode: string
  workType: string
  payMin?: number
  payMax?: number
  requirements: string[]
  daysAgo: number
  description: string
}

function jobDescription(intro: string, duties: string[], extra?: string) {
  const lines = [intro, "", "## What the work involves", ...duties.map((d) => `- ${d}`)]
  if (extra) lines.push("", extra)
  return lines.join("\n")
}

const seedJobs: SeedJob[] = [
  { title: "Disability support worker - casual, SIL", category: "disability_support", suburb: "Hamilton Hill", state: "WA", postcode: "6163", workType: "casual", payMin: 38, payMax: 43, requirements: ["drivers_licence", "ndis_screening", "first_aid"], daysAgo: 2, description: jobDescription("Casual shifts across two supported independent living homes in Hamilton Hill and Spearwood.", ["Personal care and medication prompts", "Community access and appointments", "Shift notes in our app"], "Penalty rates apply for weekend and overnight shifts.") },
  { title: "Aged care support worker - mornings", category: "aged_care", suburb: "Fremantle", state: "WA", postcode: "6160", workType: "part_time", payMin: 34, payMax: 38, requirements: ["drivers_licence", "own_vehicle", "first_aid"], daysAgo: 4, description: jobDescription("Morning home-care runs supporting older clients in the Fremantle area.", ["Domestic assistance and meal preparation", "Transport to appointments", "Social support"]) },
  { title: "Home care assistant - northern suburbs", category: "home_care", suburb: "Joondalup", state: "WA", postcode: "6027", workType: "casual", payMin: 33, payMax: 36, requirements: ["drivers_licence", "own_vehicle"], daysAgo: 1, description: jobDescription("Join a small team supporting clients to stay independent at home.", ["Cleaning, laundry and shopping support", "Companionship visits", "Flexible weekday hours"]) },
  { title: "Mental health support worker", category: "mental_health_support", suburb: "Midland", state: "WA", postcode: "6056", workType: "part_time", payMin: 39, payMax: 45, requirements: ["ndis_screening", "qualification"], daysAgo: 6, description: jobDescription("Psychosocial recovery support for participants in the Midland area.", ["One-on-one community outreach", "Goal tracking with recovery plans", "Liaison with clinical teams"], "Certificate IV in Mental Health or equivalent required.") },
  { title: "SIL support worker - overnight shifts", category: "sil", suburb: "Cannington", state: "WA", postcode: "6107", workType: "casual", payMin: 41, payMax: 48, requirements: ["ndis_screening", "first_aid", "qualification"], daysAgo: 9, description: jobDescription("Active overnight shifts in a two-participant SIL home.", ["Evening routines and morning starts", "Manual handling (training provided)", "Incident reporting"]) },
  { title: "Disability support worker - female participants", category: "disability_support", suburb: "Parramatta", state: "NSW", postcode: "2150", workType: "casual", payMin: 37, payMax: 42, requirements: ["ndis_screening", "wwcc", "first_aid"], daysAgo: 3, description: jobDescription("Supporting two female participants with community access in Western Sydney.", ["Swimming and library programs", "Travel training", "Family liaison"]) },
  { title: "Aged care worker - dementia support", category: "aged_care", suburb: "Blacktown", state: "NSW", postcode: "2148", workType: "full_time", payMin: 35, payMax: 39, requirements: ["drivers_licence", "first_aid", "qualification"], daysAgo: 8, description: jobDescription("Full-time in-home dementia support role with a consistent client list.", ["Routine-based personal care", "Respite for family carers", "Careful notes and handovers"]) },
  { title: "Home care support worker - inner west", category: "home_care", suburb: "Marrickville", state: "NSW", postcode: "2204", workType: "part_time", payMin: 34, payMax: 37, requirements: ["drivers_licence"], daysAgo: 12, description: jobDescription("Regular weekly clients across the inner west.", ["Domestic assistance", "Shopping and errands", "Wellbeing checks"]) },
  { title: "Support worker - autism specialist", category: "disability_support", suburb: "Penrith", state: "NSW", postcode: "2750", workType: "casual", payMin: 38, payMax: 44, requirements: ["ndis_screening", "wwcc"], daysAgo: 5, description: jobDescription("Working with school-aged participants on structured after-school programs.", ["Behaviour support plan implementation", "Skill-building activities", "Parent handovers"]) },
  { title: "Mental health peer worker", category: "mental_health_support", suburb: "Newcastle", state: "NSW", postcode: "2300", workType: "part_time", payMin: 36, payMax: 41, requirements: ["qualification"], daysAgo: 15, description: jobDescription("Lived-experience peer support role within a community recovery program.", ["Group facilitation", "One-on-one peer support", "Community linkage"]) },
  { title: "Disability support worker - weekend shifts", category: "disability_support", suburb: "Footscray", state: "VIC", postcode: "3011", workType: "casual", payMin: 40, payMax: 46, requirements: ["ndis_screening", "first_aid"], daysAgo: 2, description: jobDescription("Weekend community access shifts across Melbourne's west.", ["Sport and social programs", "Public transport travel", "Meal support"]) },
  { title: "SIL house support worker", category: "sil", suburb: "Broadmeadows", state: "VIC", postcode: "3047", workType: "full_time", payMin: 39, payMax: 44, requirements: ["ndis_screening", "first_aid", "drivers_licence"], daysAgo: 7, description: jobDescription("Full-time roster in an established three-participant SIL home.", ["Daily living skills coaching", "Medication administration (trained)", "House routines and outings"]) },
  { title: "Aged care support - regional visits", category: "aged_care", suburb: "Ballarat", state: "VIC", postcode: "3350", workType: "part_time", payMin: 34, payMax: 38, requirements: ["drivers_licence", "own_vehicle", "first_aid"], daysAgo: 11, description: jobDescription("Home visits across Ballarat and surrounds with paid travel time.", ["Personal care", "Medication prompts", "Light domestic support"]) },
  { title: "Home care worker - eastern suburbs", category: "home_care", suburb: "Ringwood", state: "VIC", postcode: "3134", workType: "casual", requirements: ["drivers_licence", "own_vehicle"], daysAgo: 14, description: jobDescription("Casual pool supporting our eastern suburbs team during a busy period.", ["Domestic assistance", "Transport support", "Companionship"]) },
  { title: "Mental health support worker - outreach", category: "mental_health_support", suburb: "Geelong", state: "VIC", postcode: "3220", workType: "casual", payMin: 38, payMax: 43, requirements: ["ndis_screening", "drivers_licence"], daysAgo: 10, description: jobDescription("Outreach support for participants living independently around Geelong.", ["Wellbeing visits", "Appointment support", "Crisis plan awareness"]) },
  { title: "Disability support worker - complex care", category: "disability_support", suburb: "Woolloongabba", state: "QLD", postcode: "4102", workType: "full_time", payMin: 42, payMax: 48, requirements: ["ndis_screening", "first_aid", "qualification"], daysAgo: 4, description: jobDescription("High-intensity supports for a participant with complex health needs.", ["PEG feeding (training provided)", "Hoist transfers", "Allied health program follow-through"], "Experience with complex care strongly preferred.") },
  { title: "Aged care support worker - north side", category: "aged_care", suburb: "Chermside", state: "QLD", postcode: "4032", workType: "part_time", payMin: 33, payMax: 37, requirements: ["drivers_licence", "first_aid"], daysAgo: 6, description: jobDescription("Part-time home care visits across Brisbane's north side.", ["Showering and dressing support", "Meal preparation", "Escorted outings"]) },
  { title: "Home care assistant - Gold Coast", category: "home_care", suburb: "Southport", state: "QLD", postcode: "4215", workType: "casual", payMin: 32, payMax: 35, requirements: ["drivers_licence", "own_vehicle"], daysAgo: 16, description: jobDescription("Casual home care work with flexible availability windows.", ["Domestic assistance", "Shopping runs", "Social support"]) },
  { title: "SIL support worker - sleepover shifts", category: "sil", suburb: "Toowoomba", state: "QLD", postcode: "4350", workType: "casual", payMin: 38, payMax: 42, requirements: ["ndis_screening", "first_aid"], daysAgo: 13, description: jobDescription("Sleepover and active-night shifts in a supportive SIL environment.", ["Evening and morning routines", "Overnight safety checks", "Weekend day shifts available"]) },
  { title: "Disability support worker", category: "disability_support", suburb: "Cairns", state: "QLD", postcode: "4870", workType: "casual", payMin: 36, payMax: 40, requirements: ["ndis_screening"], daysAgo: 19, description: jobDescription("Community access support across Cairns for a small participant group.", ["Beach and market outings", "Skill building", "Transport in company vehicle"]) },
  { title: "Aged care support worker", category: "aged_care", suburb: "Glenelg", state: "SA", postcode: "5045", workType: "part_time", payMin: 34, payMax: 38, requirements: ["drivers_licence", "first_aid"], daysAgo: 3, description: jobDescription("Supporting older clients along the bay with consistent weekly rosters.", ["Personal care", "Domestic assistance", "Wellbeing visits"]) },
  { title: "Disability support worker - community access", category: "disability_support", suburb: "Salisbury", state: "SA", postcode: "5108", workType: "casual", payMin: 37, payMax: 41, requirements: ["ndis_screening", "drivers_licence"], daysAgo: 9, description: jobDescription("Community access shifts across Adelaide's north.", ["Recreation programs", "Shopping and errands", "Reporting in our app"]) },
  { title: "Home care worker - Adelaide Hills", category: "home_care", suburb: "Mount Barker", state: "SA", postcode: "5251", workType: "casual", requirements: ["drivers_licence", "own_vehicle"], daysAgo: 21, description: jobDescription("Casual visits through the Hills with paid travel between clients.", ["Domestic support", "Garden safety checks", "Companionship"]) },
  { title: "Mental health support worker", category: "mental_health_support", suburb: "Hobart", state: "TAS", postcode: "7000", workType: "part_time", payMin: 37, payMax: 42, requirements: ["ndis_screening", "qualification"], daysAgo: 5, description: jobDescription("Psychosocial support role within our Hobart community team.", ["Recovery-focused outreach", "Group program support", "Care team coordination"]) },
  { title: "Disability support worker - Launceston", category: "disability_support", suburb: "Launceston", state: "TAS", postcode: "7250", workType: "casual", payMin: 36, payMax: 40, requirements: ["ndis_screening", "first_aid"], daysAgo: 17, description: jobDescription("Casual shifts supporting participants at home and in the community.", ["Personal care", "Community outings", "Meal support"]) },
  { title: "Aged care support worker - home visits", category: "aged_care", suburb: "Belconnen", state: "ACT", postcode: "2617", workType: "part_time", payMin: 35, payMax: 39, requirements: ["drivers_licence", "first_aid"], daysAgo: 7, description: jobDescription("Regular home-care clients across Belconnen and Gungahlin.", ["Personal care", "Transport to appointments", "Medication prompts"]) },
  { title: "Disability support worker - Darwin", category: "disability_support", suburb: "Darwin", state: "NT", postcode: "0800", workType: "casual", payMin: 40, payMax: 46, requirements: ["ndis_screening", "drivers_licence"], daysAgo: 8, description: jobDescription("Community and in-home supports across Darwin and Palmerston.", ["Community access", "Daily living support", "Wet season flexibility"]) },
  { title: "Support worker - school leaver employment supports", category: "other", suburb: "Bendigo", state: "VIC", postcode: "3550", workType: "part_time", payMin: 36, payMax: 40, requirements: ["ndis_screening", "wwcc"], daysAgo: 12, description: jobDescription("Helping young people build work readiness through structured programs.", ["Workplace visits", "Skills coaching", "Progress notes"]) },
  { title: "Overnight support worker - very long shift titles are tested here to make sure nothing in the layout breaks when a provider writes a title that runs well past a sensible length", category: "sil", suburb: "Ipswich", state: "QLD", postcode: "4305", workType: "casual", payMin: 39, payMax: 44, requirements: ["ndis_screening", "first_aid"], daysAgo: 1, description: jobDescription("Edge-case seed row: long title, used to test wrapping on every screen.", ["Active overnight support", "Morning routines", "Handover notes"]) },
  { title: "Community support worker", category: "other", suburb: "Rockingham", state: "WA", postcode: "6168", workType: "casual", requirements: [], daysAgo: 22, description: jobDescription("Edge-case seed row: no pay range and no requirements ticked.", ["Community access", "Transport support", "Social programs"]) },
]

const seedProviders = [
  "Banksia Community Care",
  "Coastline Home Support",
  "Tarralea Disability Services",
  "Harbourline Care",
  "Wattle Grove Support Services",
  "Stringybark Community Services",
]

async function seedJobsAndProviders(ownedProviderId: string) {
  const { count } = await db.from("jobs").select("*", { count: "exact", head: true })
  if (count && count > 0) {
    console.log(`jobs: already seeded (${count})`)
    return
  }

  const providerIds: Record<string, string> = { "Banksia Community Care": ownedProviderId }
  for (const name of seedProviders.slice(1)) {
    const { data, error } = await db
      .from("providers")
      .insert({
        business_name: name,
        normalised_name: normaliseProviderName(name),
        is_employer_attested: false,
      })
      .select("id")
      .single()
    if (error) throw error
    providerIds[name] = data.id
  }

  const rows = seedJobs.map(function toRow(job, index) {
    const providerName = seedProviders[index % seedProviders.length]
    const publishedAt = new Date(Date.now() - job.daysAgo * 86_400_000)
    return {
      provider_id: providerIds[providerName],
      provider_name: providerName,
      slug:
        job.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) +
        "-" + Math.random().toString(36).slice(2, 10),
      title: job.title,
      role_category: job.category,
      suburb: job.suburb,
      state: job.state,
      postcode: job.postcode,
      work_type: job.workType,
      pay_min: job.payMin ?? null,
      pay_max: job.payMax ?? null,
      pay_period: job.payMin ? "hour" : null,
      requirements: job.requirements,
      description: job.description,
      status: "live",
      source: "posted",
      published_at: publishedAt.toISOString(),
      expires_at: new Date(publishedAt.getTime() + 30 * 86_400_000).toISOString(),
    }
  })

  // Resolve coordinates from the postcodes table.
  for (const row of rows) {
    const { data } = await db
      .from("postcodes")
      .select("lat,lng")
      .eq("postcode", row.postcode)
      .ilike("suburb", row.suburb)
      .limit(1)
      .maybeSingle()
    if (data) Object.assign(row, { lat: data.lat, lng: data.lng })
  }

  const { error } = await db.from("jobs").insert(rows)
  if (error) throw error
  console.log(`jobs: inserted ${rows.length}`)
}

async function main() {
  await seedPostcodes()
  const providerId = await seedAccounts()
  await seedJobsAndProviders(providerId)
  console.log("Seed complete.")
}

main().catch(function onError(error) {
  console.error(error)
  process.exit(1)
})
