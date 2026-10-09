// Instagram profile URL / @handle parsing. Shared by the form and the API.

const RESERVED = new Set(["p", "reel", "reels", "explore", "stories", "accounts", "direct", "tv", "about", "developer", "legal"]);

/** Returns the lower-cased handle, or null if the input is not a profile link or handle. */
export function parseInstagram(input: string): string | null {
  const s = input.trim();
  if (!s) return null;
  let handle: string | null = null;
  const m = s.match(/^(?:https?:\/\/)?(?:www\.|m\.)?instagram\.com\/([^/?#]+)\/?(?:[?#].*)?$/i);
  if (m) handle = m[1];
  else if (/^@?[A-Za-z0-9._]{1,30}$/.test(s)) handle = s.replace(/^@/, "");
  if (!handle) return null;
  handle = handle.toLowerCase();
  if (RESERVED.has(handle) || !/^[a-z0-9._]{1,30}$/.test(handle) || /^\.|\.$|\.\./.test(handle)) return null;
  return handle;
}

export function profileUrl(handle: string): string {
  return `https://www.instagram.com/${handle}/`;
}
