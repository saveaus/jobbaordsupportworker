import { siteConfig } from "@/config/site"
import { emailLayout, sendEmail } from "./send"

function link(href: string, label: string) {
  return `<p><a href="${href}" style="color:#0B110F;font-weight:600;">${label}</a></p>`
}

export async function sendWelcomeApplicant(to: string) {
  const body = `
    <p>Your ${siteConfig.name} account is ready. Complete your profile so you can apply in one click.</p>
    ${link(`${siteConfig.url}/profile`, "Complete your profile")}
  `
  return sendEmail({
    to,
    subject: `Your ${siteConfig.name} account`,
    template: "welcome_applicant",
    html: emailLayout(body, to),
  })
}

export async function sendWelcomeProvider(to: string) {
  const body = `
    <p>Your provider account on ${siteConfig.name} is ready. Post a job after the trial is set up.</p>
    ${link(`${siteConfig.url}/jobs/new`, "Post a job")}
  `
  return sendEmail({
    to,
    subject: `Your ${siteConfig.name} provider account`,
    template: "welcome_provider",
    html: emailLayout(body, to),
  })
}

export async function sendApplicationSent(to: string, jobTitle: string, jobUrl: string) {
  const body = `
    <p>Your application for ${jobTitle} has been sent. The provider can now see your profile and CV.</p>
    ${link(jobUrl, "View the job")}
  `
  return sendEmail({
    to,
    subject: `Application sent: ${jobTitle}`,
    template: "application_sent",
    relatedId: jobUrl,
    html: emailLayout(body, to),
  })
}

export async function sendNewApplicant(to: string, jobTitle: string, applicantsUrl: string) {
  const body = `
    <p>A new applicant has applied for ${jobTitle}.</p>
    ${link(applicantsUrl, "View applicants")}
  `
  return sendEmail({
    to,
    subject: `New applicant for ${jobTitle}`,
    template: "new_applicant",
    relatedId: applicantsUrl,
    html: emailLayout(body, to),
  })
}

export async function sendJobApproved(to: string, jobTitle: string, jobUrl: string) {
  const body = `
    <p>${jobTitle} is now live on ${siteConfig.name}.</p>
    ${link(jobUrl, "View the listing")}
  `
  return sendEmail({
    to,
    subject: `Job live: ${jobTitle}`,
    template: "job_approved",
    relatedId: jobUrl,
    html: emailLayout(body, to),
  })
}

export async function sendJobExpiring(to: string, jobTitle: string, renewUrl: string) {
  const body = `
    <p>${jobTitle} expires in 3 days. Renew it for another 30 days.</p>
    ${link(renewUrl, "Renew for 30 days")}
  `
  return sendEmail({
    to,
    subject: `${jobTitle} expires in 3 days`,
    template: "job_expiring",
    relatedId: renewUrl,
    html: emailLayout(body, to),
  })
}

export async function sendTrialEnding(to: string, billingUrl: string) {
  const body = `
    <p>Your 14-day ${siteConfig.name} trial ends in 3 days. After that the card on file is charged $249 a month plus GST. Cancel anytime from billing.</p>
    ${link(billingUrl, "Manage billing")}
  `
  return sendEmail({
    to,
    subject: "Your trial ends in 3 days",
    template: "trial_ending",
    html: emailLayout(body, to),
    essential: true,
  })
}

export async function sendPaymentFailed(to: string, billingUrl: string) {
  const body = `
    <p>We could not charge your card for ${siteConfig.name}. Stripe will retry automatically. If it is still unpaid in 3 days, your jobs will be unpublished (not deleted).</p>
    ${link(billingUrl, "Update your card")}
  `
  return sendEmail({
    to,
    subject: "Payment failed",
    template: "payment_failed",
    html: emailLayout(body, to),
    essential: true,
  })
}

export async function sendJobsUnpublished(to: string, billingUrl: string) {
  const body = `
    <p>Your jobs on ${siteConfig.name} have been unpublished because payment is still outstanding. Paying again republishes them with the remaining days intact.</p>
    ${link(billingUrl, "Update payment")}
  `
  return sendEmail({
    to,
    subject: "Your jobs have been unpublished",
    template: "jobs_unpublished",
    html: emailLayout(body, to),
    essential: true,
  })
}

export async function sendClaimApproved(to: string, jobTitle: string, jobUrl: string) {
  const body = `
    <p>Your claim for ${jobTitle} has been approved. Applications now come to you on ${siteConfig.name}.</p>
    ${link(jobUrl, "View the job")}
  `
  return sendEmail({
    to,
    subject: `Claim approved: ${jobTitle}`,
    template: "claim_approved",
    relatedId: jobUrl,
    html: emailLayout(body, to),
  })
}

export async function sendClaimNeedsReview(to: string) {
  const body = `
    <p>We have received your claim. An admin will review it and email you when it is decided.</p>
    ${link(`${siteConfig.url}/dashboard`, "Go to your dashboard")}
  `
  return sendEmail({
    to,
    subject: "Your listing claim is being reviewed",
    template: "claim_needs_review",
    html: emailLayout(body, to),
  })
}

export async function sendJobAlert(
  to: string,
  jobs: { title: string; href: string; location: string }[]
) {
  const items = jobs
    .map((job) => `<li><a href="${job.href}" style="color:#212121;">${job.title}</a> — ${job.location}</li>`)
    .join("")
  const body = `
    <p>New support work jobs matching your alert.</p>
    <ul>${items}</ul>
    ${link(`${siteConfig.url}/alerts`, "Manage alerts")}
  `
  return sendEmail({
    to,
    subject: "New support work jobs",
    template: "job_alert",
    from: "alerts",
    html: emailLayout(body, to),
  })
}

export async function sendDailyDigest(
  to: string,
  jobTitle: string,
  count: number,
  applicantsUrl: string
) {
  const body = `
    <p>${count === 1 ? "1 new applicant" : `${count} new applicants`} for ${jobTitle} since yesterday.</p>
    ${link(applicantsUrl, "View applicants")}
  `
  return sendEmail({
    to,
    subject: `Applicants yesterday: ${jobTitle}`,
    template: "daily_digest",
    relatedId: applicantsUrl,
    from: "alerts",
    html: emailLayout(body, to),
  })
}
