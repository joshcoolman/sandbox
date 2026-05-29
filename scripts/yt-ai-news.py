#!/usr/bin/env python3
"""Fetch recent AI/ML videos from YouTube.

Primary source: your subscribed channels (OAuth).
Secondary source: general AI search queries (API key).

Usage:
  python3 yt-ai-news.py [days_back]   # default: 2 days
  python3 yt-ai-news.py --reset-auth  # clear saved tokens
"""

import os
import sys
import json
import urllib.request
import urllib.parse
import http.server
import webbrowser
from datetime import datetime, timedelta, timezone
from pathlib import Path

# Credentials
API_KEY = os.environ.get("YOUTUBE_API_KEY")
CLIENT_ID = os.environ.get("YOUTUBE_CLIENT_ID")
CLIENT_SECRET = os.environ.get("YOUTUBE_CLIENT_SECRET")

TOKEN_FILE = Path.home() / ".config" / "yt-ai-news" / "tokens.json"
SCOPE = "https://www.googleapis.com/auth/youtube.readonly"
REDIRECT_URI = "http://localhost:8080"

# General search queries (used as secondary/discovery source)
DISCOVERY_QUERIES = [
    "AI image generation tutorial",
    "AI video generation tutorial",
    "AI paper explained",
    "large language model research",
    "AI agent framework tutorial",
    "Claude GPT Gemini announcement",
]


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
    # Bootstrap from env var when running in CI (no token file present)
    refresh_tok_env = os.environ.get("YOUTUBE_REFRESH_TOKEN")
    if refresh_tok_env and not TOKEN_FILE.exists():
        save_tokens({
            "access_token": "synthetic",
            "expires_at": 0,
            "refresh_token": refresh_tok_env,
        })

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
        pub_dt = datetime.fromisoformat(pub.replace("Z", "+00:00"))
        videos.append({
            "id": vid_id,
            "title": snippet["title"],
            "channel": channel_title,
            "published": pub,
            "published_relative": pub_dt.strftime("%b %d, %Y"),
            "description": snippet.get("description", "")[:250].strip(),
            "url": f"https://youtube.com/watch?v={vid_id}",
            "source": "subscription",
        })
    return videos


def search_youtube(query, published_after):
    """General search using API key (no auth needed)."""
    params = {
        "part": "snippet",
        "q": query,
        "type": "video",
        "publishedAfter": published_after,
        "maxResults": 15,
        "order": "date",
        "relevanceLanguage": "en",
        "videoDuration": "medium",
        "key": API_KEY,
    }
    url = "https://www.googleapis.com/youtube/v3/search?" + urllib.parse.urlencode(params)
    try:
        result = api_get(url)
        videos = []
        for item in result.get("items", []):
            if item["id"].get("kind") != "youtube#video":
                continue
            snippet = item["snippet"]
            pub = snippet["publishedAt"]
            pub_dt = datetime.fromisoformat(pub.replace("Z", "+00:00"))
            videos.append({
                "id": item["id"]["videoId"],
                "title": snippet["title"],
                "channel": snippet["channelTitle"],
                "published": pub,
                "published_relative": pub_dt.strftime("%b %d, %Y"),
                "description": snippet["description"][:250].strip(),
                "url": f"https://youtube.com/watch?v={item['id']['videoId']}",
                "source": "discovery",
            })
        return videos
    except Exception as e:
        print(f"Search error for '{query}': {e}", file=sys.stderr)
        return []


# --- Main ---

def main():
    if "--reset-auth" in sys.argv:
        if TOKEN_FILE.exists():
            TOKEN_FILE.unlink()
            print("Tokens cleared.")
        else:
            print("No tokens found.")
        return

    days_back = 2
    for arg in sys.argv[1:]:
        if arg.isdigit():
            days_back = int(arg)

    published_after = (datetime.now(timezone.utc) - timedelta(days=days_back)).strftime("%Y-%m-%dT%H:%M:%SZ")

    # --- Subscribed channels (primary) ---
    access_token = get_access_token()
    print("Fetching subscriptions...", file=sys.stderr)
    subscriptions = get_subscriptions(access_token)
    print(f"Found {len(subscriptions)} subscribed channels.", file=sys.stderr)

    channel_ids = [c["id"] for c in subscriptions]
    channel_titles = {c["id"]: c["title"] for c in subscriptions}

    print("Fetching uploads playlists...", file=sys.stderr)
    playlist_map = get_uploads_playlists(channel_ids, access_token)

    seen = set()
    videos = []

    print("Fetching recent videos from subscriptions...", file=sys.stderr)
    for channel_id, playlist_id in playlist_map.items():
        title = channel_titles.get(channel_id, "Unknown")
        recent = get_recent_from_playlist(playlist_id, title, access_token, published_after)
        for v in recent:
            if v["id"] not in seen:
                seen.add(v["id"])
                videos.append(v)

    # --- Discovery search (secondary) ---
    if API_KEY:
        print("Running discovery searches...", file=sys.stderr)
        for query in DISCOVERY_QUERIES:
            for v in search_youtube(query, published_after):
                if v["id"] not in seen:
                    seen.add(v["id"])
                    videos.append(v)

    videos.sort(key=lambda x: x["published"], reverse=True)
    print(f"Total: {len(videos)} videos ({sum(1 for v in videos if v['source']=='subscription')} from subscriptions, {sum(1 for v in videos if v['source']=='discovery')} from discovery).", file=sys.stderr)
    print(json.dumps(videos, indent=2))


if __name__ == "__main__":
    main()
