// Waitlist tasks, points and rewards. Edit freely: the page and the API read
// everything from here. Set NEXT_PUBLIC_X_HANDLE (the account to follow) and
// NEXT_PUBLIC_X_POST (link to the post to like and repost) on the host.

export const X_HANDLE = (process.env.NEXT_PUBLIC_X_HANDLE ?? "").replace(/^@/, "");
export const X_POST_ID = (process.env.NEXT_PUBLIC_X_POST ?? "").match(/status\/(\d+)/)?.[1] ?? "";

export type TaskId = "follow" | "like" | "repost" | "post";

export interface Task {
  id: TaskId;
  label: string;
  points: number;
  /** null when the task is not configured yet (no X account / post set). */
  url: (refLink: string) => string | null;
}

const enc = encodeURIComponent;

export const TASKS: Task[] = [
  {
    id: "follow",
    label: X_HANDLE ? `Follow @${X_HANDLE} on X` : "Follow us on X",
    points: 100,
    url: () => (X_HANDLE ? `https://x.com/intent/follow?screen_name=${enc(X_HANDLE)}` : null),
  },
  {
    id: "like",
    label: "Like the launch post",
    points: 50,
    url: () => (X_POST_ID ? `https://x.com/intent/like?tweet_id=${X_POST_ID}` : null),
  },
  {
    id: "repost",
    label: "Repost the launch post",
    points: 100,
    url: () => (X_POST_ID ? `https://x.com/intent/retweet?tweet_id=${X_POST_ID}` : null),
  },
  {
    id: "post",
    label: "Post about the index (with your invite link)",
    points: 150,
    url: (refLink) =>
      `https://x.com/intent/tweet?text=${enc(
        `Who owns the internet today? The live ranking of AI celebrities${X_HANDLE ? ` by @${X_HANDLE}` : ""}. I'm on the waitlist:`,
      )}&url=${enc(refLink)}`,
  },
];

export const JOIN_POINTS = 100;
export const REFERRAL_POINTS = 250;
/** Seconds a task link must be open before it counts. */
export const TASK_WAIT = 5;

/** What the waitlist earns. Only promise things the site will really deliver. */
export const REWARDS: { rank: string; title: string; text: string }[] = [
  { rank: "Everyone", title: "Early access", text: "Doors open in waitlist order: the higher you rank, the sooner you are in." },
  { rank: "Top 500", title: "Founding Fan badge", text: "A permanent Founding Fan badge next to your handle on the site." },
  { rank: "Top 100", title: "The Founding Fans wall", text: "Your X handle on the Founding Fans wall, and a vote on which AI characters join the index next." },
  { rank: "Top 10", title: "Your pick goes first", text: "Name one AI character: the editors review it first and it can make the home cover." },
];

/** "@Name", "x.com/Name", "https://twitter.com/Name?s=1" -> "Name" (X rules: 1-15 letters, digits, _). */
export function parseXHandle(input: string): string | null {
  const s = input.trim().replace(/^https?:\/\//i, "").replace(/^(www\.)?(x|twitter)\.com\//i, "").replace(/^@/, "").split(/[/?#]/)[0];
  return /^[A-Za-z0-9_]{1,15}$/.test(s) ? s : null;
}
