// Re-scores every researched character with src/lib/scoring.ts and compares
// against the workbook's own Fame / Momentum. Run: npx tsx scripts/check_scoring.ts
import data from "../src/data/generated/index.json";
import { score } from "../src/lib/scoring";

const ASOF = Date.parse(data.meta.asOf);
let worst = 0;
let n = 0;
for (const c of data.characters as any[]) {
  if (c.inclusion !== "INCLUDED") continue;
  const days = c.firstPost ? Math.round((ASOF - Date.parse(c.firstPost)) / 86400000) : null;
  const s = score({
    followers: c.followers,
    posts: c.posts ?? 0,
    avgLikes12: c.avgLikes,
    avgLikes14d: c.avgLikes14d,
    maxLikes: c.maxLikes,
    top14dLikes: c.topPost14d?.likes ?? null,
    posts14d: c.posts14d ?? 0,
    posts30d: c.posts30d ?? 0,
    daysSinceFirst: days,
    daysSinceLast: c.daysSinceLastPost,
    analysedShare: c.posts ? (c.postsAnalysed ?? 0) / c.posts : 0,
    verified: c.verifiedBadge,
    recognizability: c.scores.recognizabilityInput,
  });
  const df = Math.abs(s.fame - c.scores.fame);
  const dm = Math.abs(s.momentum - c.scores.momentum);
  worst = Math.max(worst, df, dm);
  n++;
  if (df > 0.15 || dm > 0.15) console.log(`${c.slug.padEnd(30)} fame ${s.fame} vs ${c.scores.fame}   momentum ${s.momentum} vs ${c.scores.momentum}`);
}
console.log(`checked ${n} characters, worst difference ${worst.toFixed(2)}`);
process.exit(worst > 0.15 ? 1 : 0);
