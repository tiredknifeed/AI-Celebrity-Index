// Waitlist tasks, points and rewards. Edit freely: the page and the API read
// everything from here. NEXT_PUBLIC_X_POST (link to the post to like and
// repost) can be set on the host; until then those tasks open the profile.

export const X_HANDLE = (process.env.NEXT_PUBLIC_X_HANDLE || "AIFameIndex").replace(/^@/, "");
export const X_PROFILE = `https://x.com/${X_HANDLE}`;
export const X_POST_ID = (process.env.NEXT_PUBLIC_X_POST ?? "").match(/status\/(\d+)/)?.[1] ?? "";

export type TaskId = "follow" | "like" | "repost" | "post";

export interface Task {
  id: TaskId;
  label: string;
  hint: string;
  points: number;
  url: (refLink: string) => string;
}

const enc = encodeURIComponent;

export const TASKS: Task[] = [
  {
    id: "follow",
    label: `Follow @${X_HANDLE}`,
    hint: "Get the daily AI fame moves first",
    points: 100,
    url: () => `https://x.com/intent/follow?screen_name=${enc(X_HANDLE)}`,
  },
  {
    id: "like",
    label: "Like the launch post",
    hint: X_POST_ID ? "One tap on X" : `Like the pinned post on @${X_HANDLE}`,
    points: 50,
    url: () => (X_POST_ID ? `https://x.com/intent/like?tweet_id=${X_POST_ID}` : X_PROFILE),
  },
  {
    id: "repost",
    label: "Repost the launch post",
    hint: X_POST_ID ? "Share it with your followers" : `Repost the pinned post on @${X_HANDLE}`,
    points: 100,
    url: () => (X_POST_ID ? `https://x.com/intent/retweet?tweet_id=${X_POST_ID}` : X_PROFILE),
  },
  {
    id: "post",
    label: "Post about the index",
    hint: "Your invite link is added for you",
    points: 150,
    url: (refLink) =>
      `https://x.com/intent/tweet?text=${enc(`Who owns the internet today? The live ranking of AI celebrities by @${X_HANDLE}. I'm on the waitlist:`)}&url=${enc(refLink)}`,
  },
];

export const JOIN_POINTS = 100;
export const REFERRAL_POINTS = 250;
/** Seconds a task link must be open before it counts. */
export const TASK_WAIT = 5;

/** What the waitlist earns. Keep it to what will really be delivered. */
export const REWARDS: { rank: string; title: string; text: string; highlight?: boolean }[] = [
  {
    rank: "Everyone",
    title: "Airdrop points",
    text: "Every point you collect here counts toward the AI Fame Index community airdrop. More points, bigger share.",
    highlight: true,
  },
  { rank: "Everyone", title: "Early access", text: "Doors open in waitlist order: the higher you rank, the sooner you are in." },
  { rank: "Top 500", title: "Founding Fan badge", text: "A permanent Founding Fan badge next to your handle on the site." },
  { rank: "Top 100", title: "Founding Fans wall + vote", text: "Your handle on the Founding Fans wall and a vote on which AI characters join the index next." },
  { rank: "Top 10", title: "Your pick goes first", text: "Name one AI character: the editors review it first and it can make the home cover." },
];

/** Shown under the rewards; the airdrop is planned, not promised. */
export const AIRDROP_NOTE =
  "The airdrop is planned. Eligibility, amounts and timing will be announced on X before anything is distributed; points are not money and can change if we find fake accounts or abuse. Not financial advice.";

/** "@Name", "x.com/Name", "https://twitter.com/Name?s=1" -> "Name" (X rules: 1-15 letters, digits, _). */
export function parseXHandle(input: string): string | null {
  const s = input.trim().replace(/^https?:\/\//i, "").replace(/^(www\.)?(x|twitter)\.com\//i, "").replace(/^@/, "").split(/[/?#]/)[0];
  return /^[A-Za-z0-9_]{1,15}$/.test(s) ? s : null;
}
