// Whether visitors can add characters. Closed ("coming soon") unless
// NEXT_PUBLIC_SUBMISSIONS_OPEN is "true". Public so the client UI can show the
// same state; changing it needs a redeploy because the client value is built in.
export const SUBMISSIONS_OPEN = (process.env.NEXT_PUBLIC_SUBMISSIONS_OPEN ?? "").toLowerCase() === "true";
