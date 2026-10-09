import { config } from "@/lib/submissions/config";

export const dynamic = "force-dynamic";

// Only avatar files of user-added characters, never anything else in the repo.
const ALLOWED = /^(public\/avatars\/[a-z0-9-]+\/(avatar-(160|512|1024)|cutout-1024)\.webp|data\/avatars\/source\/[a-z0-9._-]+\.(jpg|png|webp))$/;
const TYPES: Record<string, string> = { webp: "image/webp", jpg: "image/jpeg", png: "image/png" };

/** Serves avatar files committed after the last deploy straight from GitHub. */
export async function GET(req: Request) {
  const path = new URL(req.url).searchParams.get("path") ?? "";
  if (!ALLOWED.test(path) || !config.githubToken) return new Response("Not found", { status: 404 });
  const res = await fetch(`${config.githubApi}/repos/${config.githubRepo}/contents/${path}${config.githubBase ? `?ref=${encodeURIComponent(config.githubBase)}` : ""}`, {
    headers: { authorization: `Bearer ${config.githubToken}`, accept: "application/vnd.github.raw+json" },
    cache: "no-store",
  });
  if (!res.ok) return new Response("Not found", { status: 404, headers: { "cache-control": "public, max-age=30" } });
  return new Response(res.body, {
    headers: {
      "content-type": TYPES[path.split(".").pop()!],
      // the file can be regenerated, so the CDN keeps it for a day, browsers for an hour
      "cache-control": "public, max-age=3600, s-maxage=86400",
    },
  });
}
