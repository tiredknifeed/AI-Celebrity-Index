// Server-side configuration for submissions. All optional: when a key is
// missing the feature reports itself as not configured instead of faking it.
//
// SUBMISSIONS_FREE (default "true"): anyone can submit for free, no Stripe.
// Set it to "false" to switch to paid submissions through Stripe Checkout.

export const config = {
  free: (process.env.SUBMISSIONS_FREE ?? "true").toLowerCase() !== "false",
  /** Free mode: submissions per IP per hour (best effort, per server instance). */
  perIpHourly: Number(process.env.SUBMISSION_IP_HOURLY ?? 3),
  /** Free mode: stop accepting new submissions while this many are waiting for review. */
  queueLimit: Number(process.env.SUBMISSION_QUEUE_LIMIT ?? 40),
  priceCents: Number(process.env.SUBMISSION_PRICE_CENTS ?? 4900),
  currency: (process.env.SUBMISSION_CURRENCY ?? "usd").toLowerCase(),
  siteUrl: (process.env.SITE_URL ?? "http://localhost:3000").replace(/\/$/, ""),
  stripeSecret: process.env.STRIPE_SECRET_KEY ?? "",
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET ?? "",
  apifyToken: process.env.APIFY_TOKEN ?? "",
  apifyProfileActor: process.env.APIFY_PROFILE_ACTOR ?? "apify~instagram-profile-scraper",
  apifyPostsActor: process.env.APIFY_POSTS_ACTOR ?? "apify~instagram-post-scraper",
  postsLimit: Number(process.env.SUBMISSION_POSTS_LIMIT ?? 60),
  githubToken: process.env.GITHUB_TOKEN ?? "",
  githubRepo: process.env.GITHUB_REPO ?? "tiredknifeed/AI-Celebrity-Index",
  /** Empty: use the repository's default branch. */
  githubBase: process.env.GITHUB_BASE_BRANCH ?? "",
  // API endpoints; overridable only to point tests at a local mock.
  githubApi: process.env.GITHUB_API_BASE ?? "https://api.github.com",
  apifyApi: process.env.APIFY_API_BASE ?? "https://api.apify.com",
};

export function missingConfig(): string[] {
  const missing: string[] = [];
  if (!config.free && !config.stripeSecret) missing.push("STRIPE_SECRET_KEY");
  if (!config.free && !config.stripeWebhookSecret) missing.push("STRIPE_WEBHOOK_SECRET");
  if (!config.apifyToken) missing.push("APIFY_TOKEN");
  if (!config.githubToken) missing.push("GITHUB_TOKEN");
  return missing;
}
