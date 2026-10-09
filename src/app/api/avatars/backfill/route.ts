import { NextResponse } from "next/server";
import { portraitOf } from "@/data/portraits";
import { getData } from "@/lib/live";
import { config, missingConfig } from "@/lib/submissions/config";
import { commitFile } from "@/lib/submissions/github";
import { fetchProfilePictures } from "@/lib/submissions/instagram";
import { downloadImage } from "@/lib/submissions/process";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const BATCH = 5;
// handles Apify returned no picture for, so a retry loop does not pay for them twice
const failed = new Set<string>();

async function sourcePictures(): Promise<Set<string>> {
  const res = await fetch(`${config.githubApi}/repos/${config.githubRepo}/contents/data/avatars/source${config.githubBase ? `?ref=${encodeURIComponent(config.githubBase)}` : ""}`, {
    headers: { authorization: `Bearer ${config.githubToken}`, accept: "application/vnd.github+json" },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`GitHub listing HTTP ${res.status}`);
  const files = (await res.json()) as { name: string }[];
  return new Set(files.map((f) => f.name.replace(/\.(jpg|jpeg|png|webp)$/i, "").toLowerCase()));
}

/**
 * Fetches Instagram profile pictures for ranked characters that still have no
 * avatar, a few per call, and commits them to data/avatars/source/ ([skip
 * netlify]); the "Submission avatars" action restyles them and the site picks
 * them up without a rebuild. Idempotent: characters with a picture are skipped.
 */
export async function POST() {
  const missing = missingConfig().filter((k) => k !== "STRIPE_SECRET_KEY" && k !== "STRIPE_WEBHOOK_SECRET");
  if (missing.length) return NextResponse.json({ error: "Not configured", missing }, { status: 503 });
  try {
    const data = await getData();
    const have = await sourcePictures();
    const todo = data.ranked.filter((c) => !portraitOf(c.slug).avatar && !have.has(c.handle.toLowerCase()) && !failed.has(c.handle));
    const batch = todo.slice(0, BATCH);
    const urls = await fetchProfilePictures(batch.map((c) => c.handle));
    const added: string[] = [];
    const skipped: string[] = [];
    for (const c of batch) {
      const url = urls.get(c.handle.toLowerCase());
      const pic = url ? await downloadImage(url) : null;
      if (!pic) {
        failed.add(c.handle);
        skipped.push(c.handle);
        continue;
      }
      await commitFile(`data/avatars/source/${c.handle}.${pic.ext}`, pic.base64, `Add Instagram profile picture for @${c.handle}`);
      added.push(c.handle);
    }
    return NextResponse.json({ added, skipped, remaining: todo.length - batch.length });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message.replace(/token=[^&\s]+/g, "token=***") }, { status: 502 });
  }
}
