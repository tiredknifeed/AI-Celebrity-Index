import { config } from "@/lib/submissions/config";

export const dynamic = "force-dynamic";

// Only avatar files of characters, never anything else in the repo.
const ALLOWED = /^(public\/avatars\/[a-z0-9-]+\/(avatar-(160|512|1024)|cutout-1024)\.webp|data\/avatars\/source\/[a-z0-9._-]+\.(jpg|png|webp))$/;
const TYPES: Record<string, string> = { webp: "image/webp", jpg: "image/jpeg", png: "image/png" };

/**
 * Serves avatar files committed after the last deploy straight from GitHub:
 * /api/live-asset/<blob sha>/<repo path>. The sha makes every version its own
 * URL, so the response is cached as immutable (CDNs ignore query strings, which
 * is why nothing here uses one).
 */
export async function GET(_req: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const [version, ...rest] = (await params).path;
  const path = rest.join("/");
  if (!/^[0-9a-f]{7,40}$/.test(version ?? "") || !ALLOWED.test(path) || !config.githubToken) return new Response("Not found", { status: 404 });
  const res = await fetch(`${config.githubApi}/repos/${config.githubRepo}/contents/${path}${config.githubBase ? `?ref=${encodeURIComponent(config.githubBase)}` : ""}`, {
    headers: { authorization: `Bearer ${config.githubToken}`, accept: "application/vnd.github.raw+json" },
    cache: "no-store",
  });
  if (!res.ok) return new Response("Not found", { status: 404, headers: { "cache-control": "no-store" } });
  const immutable = "public, max-age=31536000, immutable";
  return new Response(res.body, {
    headers: { "content-type": TYPES[path.split(".").pop()!], "cache-control": immutable, "netlify-cdn-cache-control": immutable },
  });
}
