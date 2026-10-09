// Server-side configuration for paid submissions. All optional: when a key
// is missing the feature reports itself as not configured instead of faking it.

export const config = {
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
  githubBase: process.env.GITHUB_BASE_BRANCH ?? "main",
};

export function missingConfig(): string[] {
  const missing: string[] = [];
  if (!config.stripeSecret) missing.push("STRIPE_SECRET_KEY");
  if (!config.stripeWebhookSecret) missing.push("STRIPE_WEBHOOK_SECRET");
  if (!config.apifyToken) missing.push("APIFY_TOKEN");
  if (!config.githubToken) missing.push("GITHUB_TOKEN");
  return missing;
}
