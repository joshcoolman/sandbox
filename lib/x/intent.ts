// X Web Intent — opens X's own pre-filled composer for the logged-in user.
// Officially supported, no API, no auth, no cost. Pure function, safe to import
// in client components (no fs / server-only deps).
export function tweetIntentUrl(text: string): string {
  return `https://x.com/intent/post?text=${encodeURIComponent(text.trim())}`
}
