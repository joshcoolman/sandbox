#!/usr/bin/env python3
"""Fetch recent AI/ML videos from YouTube — a search tool driven by the caller.

Sources:
  - Your subscribed channels (OAuth), unless --no-subs.
  - Discovery searches for whatever queries you pass (API key).

Every result is enriched with quality signals (views, view velocity, like
ratio, channel subscriber count, duration, language) so the caller can rank
and vet instead of trusting raw search order.

Usage:
  python3 yt-ai-news.py [options] "query one" "query two" ...
  echo "query" | python3 yt-ai-news.py [options]      # queries from stdin
  python3 yt-ai-news.py --reset-auth                  # clear saved tokens

Options:
  --days N         lookback window in days (default 2)
  --order ORDER    search order: viewCount | date | relevance (default viewCount)
  --max N          results per query, 1-50 (default 15)
  --min-seconds N  drop videos shorter than N seconds, 0 disables (default 90)
  --no-subs        skip subscriptions (pure discovery; no OAuth needed)
"""

import os
import re
import sys
import json
import argparse
import urllib.request
import urllib.parse
import http.server
import webbrowser
from datetime import datetime, timedelta, timezone
from pathlib import Path


def _load_dotenv():
    """Load KEY=VALUE pairs from the repo's .env.local so the script runs straight
    from a checkout. Uses setdefault, so anything already exported in your shell
    wins — this only fills gaps, never overrides."""
    env_file = Path(__file__).resolve().parent.parent / ".env.local"
    if not env_file.exists():
        return
    for line in env_file.read_text().splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, value = line.partition("=")
        os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))


_load_dotenv()

# Credentials
API_KEY = os.environ.get("YOUTUBE_API_KEY")
CLIENT_ID = os.environ.get("YOUTUBE_CLIENT_ID")
CLIENT_SECRET = os.environ.get("YOUTUBE_CLIENT_SECRET")

TOKEN_FILE = Path.home() / ".config" / "yt-ai-news" / "tokens.json"
SCOPE = "https://www.googleapis.com/auth/youtube.readonly"
REDIRECT_URI = "http://localhost:8080"


# --- OAuth helpers ---

def load_tokens():
    if TOKEN_FILE.exists():
        return json.loads(TOKEN_FILE.read_text())
    return None


def save_tokens(tokens):
    TOKEN_FILE.parent.mkdir(parents=True, exist_ok=True)
    TOKEN_FILE.write_text(json.dumps(tokens, indent=2))


def refresh_token(refresh_tok):
    data = urllib.parse.urlencode({
        "client_id": CLIENT_ID,
        "client_secret": CLIENT_SECRET,
        "refresh_token": refresh_tok,
        "grant_type": "refresh_token",
    }).encode()
    req = urllib.request.Request("https://oauth2.googleapis.com/token", data=data)
    with urllib.request.urlopen(req, timeout=10) as resp:
        return json.loads(resp.read())


def do_auth_flow():
    """Open browser, catch OAuth callback on localhost:8080, return tokens."""
    code_holder = [None]

    class Handler(http.server.BaseHTTPRequestHandler):
        def do_GET(self):
            params = urllib.parse.parse_qs(urllib.parse.urlparse(self.path).query)
            code_holder[0] = params.get("code", [None])[0]
            self.send_response(200)
            self.end_headers()
            self.wfile.write(b"<h2>Authorized! You can close this tab.</h2>")

        def log_message(self, *args):
            pass

    auth_url = "https://accounts.google.com/o/oauth2/v2/auth?" + urllib.parse.urlencode({
        "client_id": CLIENT_ID,
        "redirect_uri": REDIRECT_URI,
        "response_type": "code",
        "scope": SCOPE,
        "access_type": "offline",
        "prompt": "consent",
    })

    print("Opening browser for YouTube authorization...", file=sys.stderr)
    webbrowser.open(auth_url)

    server = http.server.HTTPServer(("localhost", 8080), Handler)
    server.handle_request()
    server.server_close()

    if not code_holder[0]:
        print("ERROR: No authorization code received.", file=sys.stderr)
        sys.exit(1)

    data = urllib.parse.urlencode({
        "client_id": CLIENT_ID,
        "client_secret": CLIENT_SECRET,
        "code": code_holder[0],
        "grant_type": "authorization_code",
        "redirect_uri": REDIRECT_URI,
    }).encode()
    req = urllib.request.Request("https://oauth2.googleapis.com/token", data=data)
    with urllib.request.urlopen(req, timeout=10) as resp:
        tokens = json.loads(resp.read())

    tokens["expires_at"] = datetime.now(timezone.utc).timestamp() + tokens["expires_in"]
    save_tokens(tokens)
    print("Authorization saved.", file=sys.stderr)
    return tokens["access_token"]


def get_access_token():
    tokens = load_tokens()
    if tokens:
        expires_at = tokens.get("expires_at", 0)
        if expires_at - 60 > datetime.now(timezone.utc).timestamp():
            return tokens["access_token"]
        result = refresh_token(tokens["refresh_token"])
        tokens["access_token"] = result["access_token"]
        tokens["expires_at"] = datetime.now(timezone.utc).timestamp() + result["expires_in"]
        save_tokens(tokens)
        return tokens["access_token"]
    return do_auth_flow()


# --- YouTube API helpers ---

def api_get(url, access_token=None):
    headers = {"Accept": "application/json"}
    if access_token:
        headers["Authorization"] = f"Bearer {access_token}"
    req = urllib.request.Request(url, headers=headers)
    with urllib.request.urlopen(req, timeout=15) as resp:
        return json.loads(resp.read())


def get_subscriptions(access_token):
    """Return list of {id, title} for all subscribed channels."""
    channels = []
    page_token = None
    while True:
        params = {"part": "snippet", "mine": "true", "maxResults": 50}
        if page_token:
            params["pageToken"] = page_token
        url = "https://www.googleapis.com/youtube/v3/subscriptions?" + urllib.parse.urlencode(params)
        result = api_get(url, access_token=access_token)
        for item in result.get("items", []):
            channels.append({
                "id": item["snippet"]["resourceId"]["channelId"],
                "title": item["snippet"]["title"],
            })
        page_token = result.get("nextPageToken")
        if not page_token:
            break
    return channels


def get_uploads_playlists(channel_ids, access_token):
    """Return {channel_id: uploads_playlist_id} map."""
    playlist_map = {}
    for i in range(0, len(channel_ids), 50):
        batch = channel_ids[i:i + 50]
        params = {"part": "contentDetails", "id": ",".join(batch), "maxResults": 50}
        url = "https://www.googleapis.com/youtube/v3/channels?" + urllib.parse.urlencode(params)
        result = api_get(url, access_token=access_token)
        for item in result.get("items", []):
            playlist_map[item["id"]] = item["contentDetails"]["relatedPlaylists"]["uploads"]
    return playlist_map


def get_recent_from_playlist(playlist_id, channel_title, access_token, published_after):
    params = {"part": "snippet", "playlistId": playlist_id, "maxResults": 10}
    url = "https://www.googleapis.com/youtube/v3/playlistItems?" + urllib.parse.urlencode(params)
    try:
        result = api_get(url, access_token=access_token)
    except Exception:
        return []
    videos = []
    for item in result.get("items", []):
        snippet = item["snippet"]
        pub = snippet.get("publishedAt", "")
        if pub < published_after:
            continue
        vid_id = snippet.get("resourceId", {}).get("videoId")
        if not vid_id or vid_id == "Private video":
            continue
        videos.append(_base_video(vid_id, snippet["title"], channel_title, pub, snippet.get("description", ""), "subscription"))
    return videos


def search_youtube(query, published_after, order, max_results):
    """General search using API key (no auth needed)."""
    params = {
        "part": "snippet",
        "q": query,
        "type": "video",
        "publishedAfter": published_after,
        "maxResults": max(1, min(max_results, 50)),
        "order": order,
        "relevanceLanguage": "en",
        "key": API_KEY,
    }
    url = "https://www.googleapis.com/youtube/v3/search?" + urllib.parse.urlencode(params)
    try:
        result = api_get(url)
    except Exception as e:
        print(f"Search error for '{query}': {e}", file=sys.stderr)
        return []
    videos = []
    for item in result.get("items", []):
        if item["id"].get("kind") != "youtube#video":
            continue
        snippet = item["snippet"]
        videos.append(_base_video(
            item["id"]["videoId"], snippet["title"], snippet["channelTitle"],
            snippet["publishedAt"], snippet.get("description", ""), "discovery", query,
        ))
    return videos


def _base_video(vid_id, title, channel, published, description, source, query=None):
    pub_dt = datetime.fromisoformat(published.replace("Z", "+00:00"))
    v = {
        "id": vid_id,
        "title": title,
        "channel": channel,
        "published": published,
        "published_relative": pub_dt.strftime("%b %d, %Y"),
        "description": (description or "")[:250].strip(),
        "url": f"https://youtube.com/watch?v={vid_id}",
        "source": source,
    }
    if query:
        v["query"] = query
    return v


# --- Quality-signal enrichment ---

_DUR_RE = re.compile(r"PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?")


def parse_duration(iso):
    """ISO-8601 duration (PT#H#M#S) -> seconds, or None if unparseable (e.g. live)."""
    if not iso:
        return None
    m = _DUR_RE.fullmatch(iso)
    if not m:
        return None
    h, mn, s = (int(x) if x else 0 for x in m.groups())
    return h * 3600 + mn * 60 + s


# --- Linked-resource extraction (from the video description) ---

_URL_RE = re.compile(r"https?://[^\s<>()\[\]]+")
_TRACKING_PARAMS = {"si", "el", "fbclid", "ref", "feature"}
_GH_REPO_RE = re.compile(r"^(?:github|gitlab)\.com/([^/\s]+/[^/\s]+)", re.I)


def _normalize_host_pattern(pat):
    """A blockedLinks entry → a bare host suffix. Tolerant of scheme, `*.`, `www.`,
    and a trailing path, so 'https://n8n.io', '*.gumroad.com', and 'bit.ly' all
    reduce to the host. Each entry means 'this domain and all its subdomains'."""
    p = (pat or "").strip().lower()
    if "://" in p:
        p = p.split("://", 1)[1]
    p = p.split("/", 1)[0]
    if p.startswith("*."):
        p = p[2:]
    if p.startswith("www."):
        p = p[4:]
    return p.strip(".")


def _host_is_blocked(url, blocked_hosts):
    """True if the URL's host equals or is a subdomain of any blocked host suffix."""
    if not blocked_hosts:
        return False
    host = urllib.parse.urlsplit(url).netloc.lower()
    if host.startswith("www."):
        host = host[4:]
    return any(host == s or host.endswith("." + s) for s in blocked_hosts)


def _clean_url(url):
    """Strip trailing punctuation and noise/tracking query params; return cleaned url."""
    url = url.rstrip(").,;:!?'\"")
    parsed = urllib.parse.urlsplit(url)
    if parsed.query:
        kept = [
            (k, v)
            for k, v in urllib.parse.parse_qsl(parsed.query, keep_blank_values=True)
            if k.lower() not in _TRACKING_PARAMS and not k.lower().startswith("utm_")
        ]
        parsed = parsed._replace(query=urllib.parse.urlencode(kept))
    return urllib.parse.urlunsplit(parsed)


def _label_for(url, preceding_text):
    """Derive a short chip label: owner/repo for GitHub, else nearby text, else bare domain."""
    parsed = urllib.parse.urlsplit(url)
    host_path = (parsed.netloc + parsed.path).lstrip("www.").rstrip("/")
    gh = _GH_REPO_RE.match(host_path)
    if gh:
        return gh.group(1)
    text = (preceding_text or "").strip().strip(":-•·|—>").strip()
    if text and len(text) <= 32 and re.search(r"[A-Za-z]", text):
        return text
    domain = parsed.netloc.lstrip("www.")
    return domain.rsplit(".", 1)[0] if domain.count(".") >= 1 else domain


def extract_links(description, self_id=None, cap=12, blocked_hosts=()):
    """Pull a deduped, liberally-filtered list of {url, label, kind} from a description.

    Dev-phase liberal: keeps social/sponsor/newsletter links so the user can observe
    noise. Drops self-youtube links, tracking params, exact dupes, and any URL whose
    host matches the ledger's blockedLinks list.
    """
    if not description:
        return []
    links = []
    seen = set()
    for line in description.splitlines():
        for m in _URL_RE.finditer(line):
            url = _clean_url(m.group(0))
            host = urllib.parse.urlsplit(url).netloc.lower().lstrip("www.")
            # Drop the video's own youtube self-links.
            if host in ("youtube.com", "youtu.be", "m.youtube.com"):
                if self_id and self_id in url:
                    continue
                if "youtu.be/" in url or "watch?v=" in url or "/shorts/" in url:
                    continue
            if _host_is_blocked(url, blocked_hosts):
                continue
            if url in seen:
                continue
            seen.add(url)
            preceding = line[: m.start()]
            host_path = (host + urllib.parse.urlsplit(url).path).rstrip("/")
            kind = "github" if _GH_REPO_RE.match(host_path) else "other"
            links.append({"url": url, "label": _label_for(url, preceding), "kind": kind})
            if len(links) >= cap:
                return links
    return links


def enrich_videos(videos, blocked_hosts=()):
    """Add views, likes, comments, duration_sec, channel_id, language, links via videos.list."""
    if not API_KEY:
        return
    by_id = {v["id"]: v for v in videos}
    ids = list(by_id.keys())
    for i in range(0, len(ids), 50):
        batch = ids[i:i + 50]
        params = {"part": "statistics,contentDetails,snippet", "id": ",".join(batch), "key": API_KEY}
        url = "https://www.googleapis.com/youtube/v3/videos?" + urllib.parse.urlencode(params)
        try:
            result = api_get(url)
        except Exception as e:
            print(f"Enrich error: {e}", file=sys.stderr)
            continue
        for item in result.get("items", []):
            v = by_id.get(item["id"])
            if not v:
                continue
            stats = item.get("statistics", {})
            cd = item.get("contentDetails", {})
            sn = item.get("snippet", {})
            v["views"] = int(stats["viewCount"]) if "viewCount" in stats else None
            v["likes"] = int(stats["likeCount"]) if "likeCount" in stats else None
            v["comments"] = int(stats["commentCount"]) if "commentCount" in stats else None
            v["duration_sec"] = parse_duration(cd.get("duration"))
            v["channel_id"] = sn.get("channelId")
            v["language"] = sn.get("defaultAudioLanguage") or sn.get("defaultLanguage")
            # Full description is only available here (the snippet); _base_video truncates
            # to 250 chars. Use it for link extraction only — never store the full text
            # (token bloat), just the extracted links.
            v["links"] = extract_links(sn.get("description", ""), self_id=v["id"], blocked_hosts=blocked_hosts)


def enrich_channels(videos):
    """Add subs (subscriber count) per video via channels.list."""
    if not API_KEY:
        return
    ch_ids = list({v.get("channel_id") for v in videos if v.get("channel_id")})
    subs_map = {}
    for i in range(0, len(ch_ids), 50):
        batch = ch_ids[i:i + 50]
        params = {"part": "statistics", "id": ",".join(batch), "key": API_KEY}
        url = "https://www.googleapis.com/youtube/v3/channels?" + urllib.parse.urlencode(params)
        try:
            result = api_get(url)
        except Exception as e:
            print(f"Channel enrich error: {e}", file=sys.stderr)
            continue
        for item in result.get("items", []):
            st = item.get("statistics", {})
            if st.get("hiddenSubscriberCount"):
                subs_map[item["id"]] = None
            elif "subscriberCount" in st:
                subs_map[item["id"]] = int(st["subscriberCount"])
    for v in videos:
        v["subs"] = subs_map.get(v.get("channel_id"))


def add_derived(videos):
    """Compute age_hours, views_per_day (velocity), like_ratio."""
    now = datetime.now(timezone.utc)
    for v in videos:
        pub_dt = datetime.fromisoformat(v["published"].replace("Z", "+00:00"))
        age_h = max((now - pub_dt).total_seconds() / 3600, 0.1)
        v["age_hours"] = round(age_h, 1)
        views = v.get("views")
        if views is not None:
            v["views_per_day"] = round(views / (age_h / 24), 1)
            likes = v.get("likes")
            v["like_ratio"] = round(likes / views, 4) if likes is not None and views > 0 else None


# --- Blocked-channel filter (from the ledger) ---

LEDGER_FILE = Path(__file__).resolve().parent.parent / "news" / ".ledger.json"


def load_blocked_channels():
    """Read blockedChannels from the ledger → (lowercased name set, channelId set).

    Tolerates a missing/malformed ledger (returns empty sets). The script doesn't
    otherwise touch the ledger — the agent owns dedupe and logging."""
    names, ids = set(), set()
    try:
        data = json.loads(LEDGER_FILE.read_text())
    except (FileNotFoundError, ValueError):
        return names, ids
    for c in data.get("blockedChannels", []):
        if c.get("name"):
            names.add(c["name"].strip().lower())
        if c.get("channelId"):
            ids.add(c["channelId"])
    return names, ids


def load_blocked_link_hosts():
    """Read blockedLinks from the ledger → set of normalized host suffixes. Each
    entry blocks that domain and all its subdomains in extracted resource links."""
    hosts = set()
    try:
        data = json.loads(LEDGER_FILE.read_text())
    except (FileNotFoundError, ValueError):
        return hosts
    for pat in data.get("blockedLinks", []):
        h = _normalize_host_pattern(pat)
        if h:
            hosts.add(h)
    return hosts


# --- Main ---

def main():
    parser = argparse.ArgumentParser(add_help=True)
    parser.add_argument("queries", nargs="*", help="discovery search queries")
    parser.add_argument("--days", type=int, default=2)
    parser.add_argument("--order", choices=["viewCount", "date", "relevance"], default="viewCount")
    parser.add_argument("--max", type=int, default=15, dest="max_results")
    parser.add_argument("--min-seconds", type=int, default=90, dest="min_seconds")
    parser.add_argument("--no-subs", action="store_true")
    parser.add_argument("--reset-auth", action="store_true")
    args = parser.parse_args()

    if args.reset_auth:
        if TOKEN_FILE.exists():
            TOKEN_FILE.unlink()
            print("Tokens cleared.")
        else:
            print("No tokens found.")
        return

    queries = args.queries
    if not queries and not sys.stdin.isatty():
        queries = [ln.strip() for ln in sys.stdin if ln.strip()]

    if args.no_subs and not queries:
        print("Nothing to do: --no-subs with no queries.", file=sys.stderr)
        sys.exit(1)

    published_after = (datetime.now(timezone.utc) - timedelta(days=args.days)).strftime("%Y-%m-%dT%H:%M:%SZ")

    blocked_names, blocked_ids = load_blocked_channels()
    blocked_link_hosts = load_blocked_link_hosts()
    skipped_blocked = 0

    seen = set()
    videos = []

    # --- Subscribed channels ---
    if not args.no_subs:
        access_token = get_access_token()
        print("Fetching subscriptions...", file=sys.stderr)
        subscriptions = get_subscriptions(access_token)
        print(f"Found {len(subscriptions)} subscribed channels.", file=sys.stderr)
        channel_ids = [c["id"] for c in subscriptions]
        channel_titles = {c["id"]: c["title"] for c in subscriptions}
        print("Fetching uploads playlists...", file=sys.stderr)
        playlist_map = get_uploads_playlists(channel_ids, access_token)
        print("Fetching recent videos from subscriptions...", file=sys.stderr)
        for channel_id, playlist_id in playlist_map.items():
            title = channel_titles.get(channel_id, "Unknown")
            for v in get_recent_from_playlist(playlist_id, title, access_token, published_after):
                if v["id"] not in seen:
                    seen.add(v["id"])
                    videos.append(v)

    # --- Discovery search ---
    if queries:
        if not API_KEY:
            print("WARNING: no YOUTUBE_API_KEY; skipping discovery searches.", file=sys.stderr)
        else:
            print(f"Running {len(queries)} discovery search(es) [order={args.order}]...", file=sys.stderr)
            for query in queries:
                for v in search_youtube(query, published_after, args.order, args.max_results):
                    if v["id"] not in seen:
                        seen.add(v["id"])
                        videos.append(v)

    # --- Drop blocked channels by name (pre-enrichment, saves quota) ---
    if blocked_names:
        before = len(videos)
        videos = [v for v in videos if (v.get("channel") or "").strip().lower() not in blocked_names]
        skipped_blocked += before - len(videos)

    # --- Enrich with quality signals ---
    print("Enriching with quality signals...", file=sys.stderr)
    enrich_videos(videos, blocked_link_hosts)
    enrich_channels(videos)
    add_derived(videos)

    # --- Drop blocked channels by channelId (post-enrichment; catches renames) ---
    if blocked_ids:
        before = len(videos)
        videos = [v for v in videos if v.get("channel_id") not in blocked_ids]
        skipped_blocked += before - len(videos)
    if skipped_blocked:
        print(f"Skipped {skipped_blocked} from blocked channels.", file=sys.stderr)

    # --- Light gating (caller does the real curation) ---
    kept = []
    dropped_short = dropped_lang = 0
    for v in videos:
        dur = v.get("duration_sec")
        if args.min_seconds and dur is not None and 0 < dur < args.min_seconds:
            dropped_short += 1
            continue
        lang = v.get("language")
        if lang and not lang.lower().startswith("en"):
            dropped_lang += 1
            continue
        kept.append(v)

    # Most momentum first; unknown velocity sinks to the bottom.
    kept.sort(key=lambda x: x.get("views_per_day") or -1, reverse=True)

    subs_n = sum(1 for v in kept if v["source"] == "subscription")
    disc_n = sum(1 for v in kept if v["source"] == "discovery")
    print(
        f"Total: {len(kept)} videos ({subs_n} subscription, {disc_n} discovery); "
        f"dropped {dropped_short} short, {dropped_lang} non-English.",
        file=sys.stderr,
    )
    print(json.dumps(kept, indent=2))


if __name__ == "__main__":
    main()
