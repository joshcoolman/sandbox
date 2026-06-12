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
  --max N          results per query, 1-50 (default 25)
  --min-seconds N  drop videos shorter than N seconds, 0 disables (default 0)
  --english-only   drop non-English videos (off by default — show everything)
  --no-subs        skip subscriptions (pure discovery; no OAuth needed)
  --html PATH      write a self-contained interactive review page to PATH
  --out PATH       write the full candidate JSON to PATH (for the commit step)

By default the script casts wide: no Shorts filter, no language filter, no
quality gating. It just fetches, enriches with signals, sorts by velocity, and
hands the caller everything. Curation happens visually in the --html page; the
caller commits only what the user keeps.
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
FEED_FILE = Path(__file__).resolve().parent.parent / "news" / "feed.md"

_VIDEO_ID_RE = re.compile(r"(?:vi/|watch\?v=)([A-Za-z0-9_-]{6,})")


def load_published_ids():
    """Video ids already in the public feed (news/feed.md) — so the review page can
    mark them PUBLISHED and non-selectable. feed.md is the source of truth: a video
    removed via the /news Edit button drops out here and becomes selectable again."""
    try:
        return set(_VIDEO_ID_RE.findall(FEED_FILE.read_text()))
    except FileNotFoundError:
        return set()


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


def load_channel_keep_rates():
    """Read the ledger's videos[] → per-channel posted/deleted tallies.

    Keyed by channelId when a record has one, else by lowercased channel name
    (historical records carry only the name; newer ones also carry channel_id,
    so accuracy improves over time). Returns { key: {"posted": n, "deleted": m} }.
    Tolerates a missing/malformed ledger (returns {})."""
    tally = {}
    try:
        data = json.loads(LEDGER_FILE.read_text())
    except (FileNotFoundError, ValueError):
        return tally
    for rec in data.get("videos", []):
        status = rec.get("status")
        if status not in ("posted", "deleted"):
            continue
        keys = []
        if rec.get("channel_id"):
            keys.append(rec["channel_id"])
        if rec.get("channel"):
            keys.append(rec["channel"].strip().lower())
        for key in keys:
            t = tally.setdefault(key, {"posted": 0, "deleted": 0})
            t[status] += 1
    return tally


def attach_keep_rates(videos, tally):
    """Attach keep_posted/keep_deleted/channel_keep_rate to each candidate.

    Match by channel_id, falling back to lowercased channel name. keep_rate is
    posted/(posted+deleted) only when there are >=2 prior appearances — a single
    appearance is noise, not a track record — else None."""
    for v in videos:
        t = None
        cid = v.get("channel_id")
        if cid and cid in tally:
            t = tally[cid]
        else:
            name = (v.get("channel") or "").strip().lower()
            t = tally.get(name)
        posted = t["posted"] if t else 0
        deleted = t["deleted"] if t else 0
        total = posted + deleted
        v["keep_posted"] = posted
        v["keep_deleted"] = deleted
        v["channel_keep_rate"] = round(posted / total, 2) if total >= 2 else None


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


# --- Interactive review page ---

_HTML_TEMPLATE = r"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>__TITLE__</title>
<style>
  :root { color-scheme: dark; }
  * { box-sizing: border-box; }
  body { margin: 0; background: #0d0d0f; color: #e7e7ea;
    font: 14px/1.4 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
  header { position: sticky; top: 0; z-index: 5; background: #0d0d0fee;
    backdrop-filter: blur(8px); border-bottom: 1px solid #26262c; padding: 14px 16px; }
  header h1 { margin: 0 0 4px; font-size: 16px; font-weight: 600; }
  header .sub { color: #9a9aa2; font-size: 12px; }
  header .sub b { color: #5ad17f; }
  .controls { margin-top: 10px; display: flex; flex-wrap: wrap; gap: 10px 18px; align-items: center; }
  #filter { flex: 1; min-width: 200px; max-width: 360px; padding: 7px 10px;
    background: #17171b; color: #e7e7ea; border: 1px solid #34343c; border-radius: 7px; font-size: 13px; }
  .slider { display: flex; align-items: center; gap: 8px; font-size: 11px;
    text-transform: uppercase; letter-spacing: .05em; user-select: none; }
  .slider input[type=range] { width: 150px; accent-color: #5ad17f; cursor: pointer; }
  .slider .lbl-noise { color: #6a6a72; }
  .slider .lbl-signal { color: #5ad17f; }
  main#grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: 14px; padding: 16px; padding-bottom: 230px; }
  .card { position: relative; background: #17171b; border: 1px solid #26262c; border-radius: 10px;
    overflow: hidden; cursor: pointer; transition: border-color .12s, transform .12s; }
  .card:hover { border-color: #44444e; }
  .card:hover img { opacity: .82; }
  .card.kept { border-color: #5ad17f; box-shadow: 0 0 0 1px #5ad17f inset; }
  /* Transient "last viewed" marker — helps you find your place after closing a video tab. */
  .card.last { border-color: #f5c518; box-shadow: 0 0 0 1px #f5c518 inset; }
  .card .lastlabel { position: absolute; top: 0; left: 0; z-index: 2; display: none;
    background: #f5c518; color: #0d0d0f; font-size: 10px; font-weight: 700; letter-spacing: .04em;
    padding: 3px 7px; border-bottom-right-radius: 7px; }
  .card.last .lastlabel { display: block; }
  /* Already in the public feed — shown for context, dimmed, and not selectable. */
  .card.published img { opacity: .45; }
  .card.published { cursor: default; }
  .card .publabel { position: absolute; top: 0; left: 0; z-index: 2; background: #4aa3df;
    color: #0d0d0f; font-size: 10px; font-weight: 700; letter-spacing: .04em; padding: 3px 7px;
    border-bottom-right-radius: 7px; }
  .card img { display: block; width: 100%; aspect-ratio: 16/9; object-fit: cover; background: #000;
    transition: opacity .12s; }
  /* The check circle is the ONLY toggle — clicking the card opens the video. */
  .card .check { position: absolute; top: 8px; right: 8px; width: 30px; height: 30px; border-radius: 50%;
    background: #0d0d0fd9; border: 1.5px solid #6a6a74; color: transparent; cursor: pointer;
    display: flex; align-items: center; justify-content: center; font-size: 15px; font-weight: 700;
    transition: transform .1s, background .1s, border-color .1s; }
  .card .check:hover { transform: scale(1.12); border-color: #5ad17f; color: #5ad17f88; }
  .card.kept .check { background: #5ad17f; border-color: #5ad17f; color: #0d0d0f; }
  .meta { padding: 10px 11px 12px; }
  .title { font-weight: 600; font-size: 13px; display: -webkit-box; -webkit-line-clamp: 2;
    -webkit-box-orient: vertical; overflow: hidden; }
  .chan { color: #9a9aa2; font-size: 12px; margin-top: 5px; }
  .badges { margin-top: 9px; display: flex; flex-wrap: wrap; gap: 5px; }
  .badge { font-size: 10.5px; background: #222228; color: #c7c7cf; border-radius: 5px; padding: 2px 6px; }
  #tray { position: fixed; left: 0; right: 0; bottom: 0; z-index: 6; background: #111114;
    border-top: 1px solid #26262c; padding: 11px 16px 14px; }
  .tray-head { display: flex; align-items: center; gap: 10px; font-size: 12px; color: #9a9aa2; margin-bottom: 7px; }
  .tray-head b { color: #e7e7ea; }
  .tray-head .spacer { flex: 1; }
  button { background: #23232a; color: #e7e7ea; border: 1px solid #34343c; border-radius: 6px;
    padding: 5px 13px; font-size: 12px; cursor: pointer; }
  button:hover { border-color: #55555f; }
  button.done { background: #5ad17f; color: #0d0d0f; border-color: #5ad17f; }
  #prompt { width: 100%; height: 110px; background: #0d0d0f; color: #e7e7ea; border: 1px solid #26262c;
    border-radius: 8px; padding: 9px; font: 12px/1.45 ui-monospace, SFMono-Regular, Menlo, monospace; resize: vertical; }
  .hint { margin-top: 6px; font-size: 11px; color: #6a6a72; }
</style>
</head>
<body>
<header>
  <h1>__TITLE__</h1>
  <div class="sub">Click a card to open the video. Click the circle to keep it.
    <b id="count">0</b> kept · <span id="shown">0</span>/<span id="total">0</span> shown ·
    <span id="pub">0</span> already published. Copy the list below and paste it back into the chat.</div>
  <div class="controls">
    <input id="filter" placeholder="Filter by title or channel…" autocomplete="off">
    <div class="slider" title="Drag right to hide lower-signal videos (low like-ratio, low velocity, non-English, weak track record). Kept cards always stay visible.">
      <span class="lbl-noise">Noise</span>
      <input id="signal" type="range" min="0" max="100" value="0">
      <span class="lbl-signal">Signal</span>
    </div>
  </div>
</header>
<main id="grid"></main>
<aside id="tray">
  <div class="tray-head"><b>Keep list</b><span class="spacer"></span>
    <button id="clear">Clear picks</button><button id="copy">Copy</button></div>
  <textarea id="prompt" readonly placeholder="Nothing kept yet — click some cards above."></textarea>
  <div class="hint">These are the only videos that will be added to the public feed.</div>
</aside>
<script>
const CANDIDATES = __DATA__;
const fmt = n => n == null ? "—" : (n >= 1e6 ? (n/1e6).toFixed(1)+"M" : n >= 1e3 ? (n/1e3).toFixed(1)+"k" : String(n));
const dur = s => s == null ? "live" : (s >= 3600 ? Math.floor(s/3600)+"h"+Math.round(s%3600/60)+"m" : Math.round(s/60)+"m");
// Composite "signal" score [0,1] from the same signals shown on the card. Higher = more
// signal. Only used by the Noise→Signal slider to thin the view; never drops data.
function signalScore(v) {
  let s = 0;
  const lr = v.like_ratio == null ? 0.02 : v.like_ratio;       // engagement quality
  s += 0.45 * Math.min(lr / 0.08, 1);
  const vpd = v.views_per_day || 0;                            // momentum (log-scaled)
  s += 0.30 * Math.min(Math.log(vpd + 1) / Math.log(1e6), 1);
  s += 0.15 * (v.channel_keep_rate == null ? 0.5 : v.channel_keep_rate);  // track record (neutral if unknown)
  s += 0.10 * (v.views != null ? 1 : 0);                       // has real stats at all
  const lang = (v.language || "").toLowerCase();               // non-English reads as noise
  if (lang && !lang.startsWith("en")) s *= 0.4;
  return s;
}
const kept = new Set();
const grid = document.getElementById("grid");
document.getElementById("total").textContent = CANDIDATES.length;
document.getElementById("pub").textContent = CANDIDATES.filter(v => v.in_feed).length;

CANDIDATES.forEach(v => {
  const card = document.createElement("div");
  card.className = "card";
  card.dataset.id = v.id;
  card.dataset.search = ((v.title || "") + " " + (v.channel || "")).toLowerCase();
  card.dataset.score = signalScore(v).toFixed(5);

  const img = document.createElement("img");
  img.loading = "lazy"; img.alt = "";
  img.src = "https://img.youtube.com/vi/" + v.id + "/mqdefault.jpg";

  const check = document.createElement("div");
  check.className = "check"; check.textContent = "✓";
  check.title = "Keep / unkeep";

  const lastLabel = document.createElement("div");
  lastLabel.className = "lastlabel"; lastLabel.textContent = "LAST VIEWED";

  const meta = document.createElement("div"); meta.className = "meta";
  const t = document.createElement("div"); t.className = "title"; t.textContent = v.title || "";
  const c = document.createElement("div"); c.className = "chan";
  c.textContent = (v.channel || "") + (v.published_relative ? " · " + v.published_relative : "");

  const badges = document.createElement("div"); badges.className = "badges";
  const add = txt => { const b = document.createElement("span"); b.className = "badge"; b.textContent = txt; badges.appendChild(b); };
  add(fmt(v.views_per_day) + "/day");
  add(fmt(v.views) + " views");
  add(fmt(v.subs) + " subs");
  add(dur(v.duration_sec));
  if (v.like_ratio != null) add(Math.round(v.like_ratio * 100) + "% likes");
  if (v.source) add(v.source);
  if (v.channel_keep_rate != null) add("keep " + v.channel_keep_rate);

  meta.append(t, c, badges);
  if (v.in_feed) {
    // Already in the public feed — visible for context, dimmed, and NOT selectable.
    card.classList.add("published");
    const pub = document.createElement("div");
    pub.className = "publabel"; pub.textContent = "PUBLISHED"; pub.title = "Already in /news";
    card.append(img, pub, meta);
    card.addEventListener("click", () => window.open(v.url, "_blank", "noopener"));
  } else {
    card.append(img, check, lastLabel, meta);
    // Whole card opens the video and becomes "last viewed"; only the circle toggles keep.
    card.addEventListener("click", () => {
      document.querySelectorAll(".card.last").forEach(c => c.classList.remove("last"));
      card.classList.add("last");
      window.open(v.url, "_blank", "noopener");
    });
    check.addEventListener("click", e => { e.stopPropagation(); toggle(v.id, card); });
  }
  grid.appendChild(card);
});

function toggle(id, card) {
  if (kept.has(id)) { kept.delete(id); card.classList.remove("kept"); }
  else { kept.add(id); card.classList.add("kept"); }
  updatePrompt();
  applyFilters();
}

function updatePrompt() {
  const lines = CANDIDATES.filter(v => kept.has(v.id))
    .map(v => "- " + v.id + " — " + (v.title || "") + " — " + (v.channel || ""));
  document.getElementById("prompt").value = lines.length
    ? "Keep these in the AI News feed:\n" + lines.join("\n") : "";
  document.getElementById("count").textContent = kept.size;
}

document.getElementById("copy").addEventListener("click", () => {
  const ta = document.getElementById("prompt");
  if (!ta.value) return;
  ta.select();
  let ok = false;
  try { ok = document.execCommand("copy"); } catch (e) {}
  if (navigator.clipboard) navigator.clipboard.writeText(ta.value).catch(() => {});
  const btn = document.getElementById("copy");
  btn.textContent = "Copied"; btn.classList.add("done");
  setTimeout(() => { btn.textContent = "Copy"; btn.classList.remove("done"); }, 1200);
});

document.getElementById("clear").addEventListener("click", () => {
  kept.clear();
  document.querySelectorAll(".card.kept").forEach(c => c.classList.remove("kept"));
  updatePrompt();
  applyFilters();
});

// --- Text filter + Noise→Signal slider (view-only; kept cards always stay visible) ---
const cards = Array.from(grid.children);
const sortedScores = cards.map(c => +c.dataset.score).sort((a, b) => a - b);
const filterEl = document.getElementById("filter");
const signalEl = document.getElementById("signal");

function cutoff() {
  // 0 = show everything; pulling right raises the score floor up to the ~92nd percentile.
  const t = (+signalEl.value / 100) * 0.92;
  if (t <= 0) return -Infinity;
  return sortedScores[Math.floor(t * (sortedScores.length - 1))];
}

function applyFilters() {
  const q = filterEl.value.toLowerCase().trim();
  const cut = cutoff();
  let shown = 0;
  cards.forEach(c => {
    const isKept = c.classList.contains("kept");
    const passText = !q || c.dataset.search.includes(q);
    const passSignal = (+c.dataset.score) >= cut;
    const vis = isKept || (passText && passSignal);
    c.style.display = vis ? "" : "none";
    if (vis) shown++;
  });
  document.getElementById("shown").textContent = shown;
}

filterEl.addEventListener("input", applyFilters);
signalEl.addEventListener("input", applyFilters);
applyFilters();
</script>
</body>
</html>
"""


def render_review_html(videos, title="AI News review"):
    """Build a self-contained interactive contact sheet from enriched candidates.

    The page embeds the candidate list, renders a thumbnail grid, lets the user
    click to keep, and builds a copy-paste 'keep list' the caller acts on. No
    build step, no external deps — just open the file in a browser."""
    data = json.dumps(videos, ensure_ascii=False).replace("</", "<\\/")
    safe_title = (title or "AI News review").replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
    return _HTML_TEMPLATE.replace("__TITLE__", safe_title).replace("__DATA__", data)


# --- Main ---

def main():
    parser = argparse.ArgumentParser(add_help=True)
    parser.add_argument("queries", nargs="*", help="discovery search queries")
    parser.add_argument("--days", type=int, default=2)
    parser.add_argument("--order", choices=["viewCount", "date", "relevance"], default="viewCount")
    parser.add_argument("--max", type=int, default=25, dest="max_results")
    parser.add_argument("--min-seconds", type=int, default=0, dest="min_seconds")
    parser.add_argument("--english-only", action="store_true")
    parser.add_argument("--no-subs", action="store_true")
    parser.add_argument("--reset-auth", action="store_true")
    parser.add_argument("--html", dest="html_path", help="write interactive review page here")
    parser.add_argument("--out", dest="out_path", help="write full candidate JSON here")
    parser.add_argument("--fresh", action="store_true",
                        help="start a clean board (overwrite); default merges into the existing --out set")
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
    keep_rate_tally = load_channel_keep_rates()
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
    attach_keep_rates(videos, keep_rate_tally)

    # --- Drop blocked channels by channelId (post-enrichment; catches renames) ---
    if blocked_ids:
        before = len(videos)
        videos = [v for v in videos if v.get("channel_id") not in blocked_ids]
        skipped_blocked += before - len(videos)
    if skipped_blocked:
        print(f"Skipped {skipped_blocked} from blocked channels.", file=sys.stderr)

    # --- Optional gating (off by default — caller curates visually) ---
    kept = []
    dropped_short = dropped_lang = 0
    for v in videos:
        dur = v.get("duration_sec")
        if args.min_seconds and dur is not None and 0 < dur < args.min_seconds:
            dropped_short += 1
            continue
        if args.english_only:
            lang = v.get("language")
            if lang and not lang.lower().startswith("en"):
                dropped_lang += 1
                continue
        kept.append(v)

    # Most momentum first; unknown velocity sinks to the bottom.
    kept.sort(key=lambda x: x.get("views_per_day") or -1, reverse=True)

    # Additive board: unless --fresh, merge this run's results into the existing review
    # set (dedup by id, this run's fresher records win). Lets several /ai-news runs
    # accumulate onto one review page until the user clears it.
    review = kept
    if not args.fresh and args.out_path and Path(args.out_path).exists():
        try:
            prior = json.loads(Path(args.out_path).read_text())
        except (ValueError, OSError):
            prior = []
        seen_now = {v["id"] for v in kept}
        merged = kept + [v for v in prior if v.get("id") not in seen_now]
        merged.sort(key=lambda x: x.get("views_per_day") or -1, reverse=True)
        added = len(merged) - len(prior)
        print(f"Additive: {len(kept)} fetched, {added} net-new -> {len(merged)} on the board.", file=sys.stderr)
        review = merged

    # Flag videos already in the public feed so the review page marks them PUBLISHED.
    published_ids = load_published_ids()
    for v in review:
        v["in_feed"] = v["id"] in published_ids

    subs_n = sum(1 for v in kept if v["source"] == "subscription")
    disc_n = sum(1 for v in kept if v["source"] == "discovery")
    print(
        f"Total: {len(kept)} videos ({subs_n} subscription, {disc_n} discovery); "
        f"dropped {dropped_short} short, {dropped_lang} non-English.",
        file=sys.stderr,
    )

    # --- Output (the review set = this run merged with the existing board) ---
    if args.out_path:
        Path(args.out_path).parent.mkdir(parents=True, exist_ok=True)
        Path(args.out_path).write_text(json.dumps(review, indent=2))
        print(f"Wrote {len(review)} candidates -> {args.out_path}", file=sys.stderr)
    if args.html_path:
        title = "AI News review"
        if queries:
            title = "AI News review — " + ", ".join(queries[:4]) + ("…" if len(queries) > 4 else "")
        Path(args.html_path).parent.mkdir(parents=True, exist_ok=True)
        Path(args.html_path).write_text(render_review_html(review, title))
        print(f"Wrote review page ({len(review)} candidates) -> {args.html_path}", file=sys.stderr)
    if not args.html_path and not args.out_path:
        # Legacy: dump JSON to stdout for direct piping (this run only).
        print(json.dumps(kept, indent=2))
    else:
        # Keep stdout terse so the page path is the takeaway, not a wall of JSON.
        print(args.html_path or args.out_path)


if __name__ == "__main__":
    main()
