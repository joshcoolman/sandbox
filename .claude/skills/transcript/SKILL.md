---
name: transcript
description: Fetch a YouTube video's transcript, save it as a self-contained HTML file, and open it immediately. Run with no URL to instead open the existing transcripts index. Use when the user runs /transcript (with or without a URL), or asks to pull/grab/save/read a video transcript.
---

# transcript

Fetches a YouTube video's transcript via `youtube_transcript_api` and saves it as a
standalone, self-styled `.html` file at a location the user specifies — no dev server,
no route, no build step — then opens it immediately in the browser. Run with no URL to
skip the fetch entirely and just open the existing index of everything saved so far.

## Usage

```
/transcript https://www.youtube.com/watch?v=dDmJLezy-M4
/transcript https://youtu.be/dDmJLezy-M4 brief, high-level bullet points
/transcript
```

URL must be first when present. Everything after it is optional steering — what the user
is actually looking for from this transcript, if anything. With no arguments at all, jump
straight to "Opening the index (no URL given)" below and stop — don't run the fetch steps.

## Requirements

Requires the `youtube_transcript_api` CLI, installed globally via pipx (user-level — works
from any repo, in any terminal). If missing:

```bash
pipx install youtube-transcript-api
```

## Opening the index (no URL given)

1. Determine the directory: `transcripts/` at the repo root when run inside the sandbox
   repo (the established convention); otherwise ask the user where their saved
   transcripts live.
2. If `<directory>/index.html` doesn't exist yet, say so plainly (no transcripts saved
   there yet) instead of erroring.
3. Otherwise open it directly — no server involved:
   ```bash
   open "<directory>/index.html"
   ```

## Steps (URL given)

1. Extract the video ID from the URL (handles `youtube.com/watch?v=`, `youtu.be/`, and
   `youtube.com/shorts/`).
2. Fetch the title via oEmbed:
   ```bash
   curl -s "https://www.youtube.com/oembed?url=<url>&format=json"
   ```
3. Fetch chapters, best-effort (skip silently on any failure — this is optional
   enrichment, never a blocker). YouTube embeds chapter markers, when the creator added
   any, directly in the watch page's `ytInitialData` blob — no API key needed:
   ```bash
   curl -s -A "Mozilla/5.0" "https://www.youtube.com/watch?v=<video-id>" -o /tmp/<video-id>_watch.html
   perl -0777 -ne 'while (/"chapterRenderer":\{"title":\{"simpleText":"([^"]*)"\},"timeRangeStartMillis":(\d+)/g) { print "$2\t$1\n" }' /tmp/<video-id>_watch.html
   ```
   This prints `<start-millis>\t<chapter title>` pairs in order, one per line. If it prints
   nothing, the video has no chapters — proceed without them (this is the common case, not
   an error). Chapter titles come straight out of embedded JSON, so unescape JSON string
   escapes (`&` → `&`, etc.) before using them, then HTML-escape as normal. Delete the
   temp HTML file when done with it.
4. Fetch the raw transcript **with timestamps**, since aligning to chapters needs them:
   ```bash
   youtube_transcript_api <video-id> --languages en --format json
   ```
   If English isn't available, drop `--languages en` and use whatever language the tool
   returns — note the language in the saved page if it isn't English. Each entry has
   `text` and `start` (seconds). This raw output is caption-chunk text — each cue often cut
   mid-sentence. It's an intermediate artifact, not what gets saved.
5. Turn the raw transcript into the saved body, written directly as HTML (no markdown
   pass): wrap each paragraph in `<p>...</p>`, using `<code>` for inline code/short literal
   spans. Escape `&`, `<`, `>` in all text content first.
   - **If chapters were found in step 3**: convert each chapter's `start-millis` to seconds
     (÷1000) and use those as section boundaries. Walk the transcript cues in order; every
     time a cue's `start` crosses into the next chapter's start time, close the current
     section and open a new one headed by `<h2>chapter title</h2>`. Within each section,
     reflow that chapter's cues into paragraphs using the same rule as the no-chapters case
     below — verbatim, natural line breaks, no summarizing.
   - **No steering given (the default, and the common case)**: this is a transcript, not an
     article — preserve the actual words as spoken. The only edit is where to put line
     breaks: group caption fragments into natural paragraphs by sentence/topic instead of
     by caption timing, drop pure disfluency filler ("uh," stutter-repeats) if trivial to
     spot, and that's it. Do **not** summarize, condense, paraphrase, or add a topic-summary
     intro paragraph — the saved page opens straight from title/date into the actual
     transcript text, no preamble (chapter headers from real chapter data are fine; inventing
     your own section headers when there are no real chapters is not). For multi-speaker
     content (interviews, podcasts), do **not** guess at or label who said what — YouTube's
     auto-captions carry no speaker diarization, so attribution is a guess, and a wrong
     guess actively misinforms. Just keep the words in spoken order as plain paragraphs.
   - **Steering given** (e.g. "brief, high-level bullet points"): shape the body to match
     that request instead of a verbatim reflow (use `<ul>`/`<li>` for bullets). This is the
     one case where condensing is appropriate — because the user explicitly asked for it.
     Real chapters, if found, are still good section boundaries to summarize within.
   Either way, save one body — never a raw dump alongside a refined version.
6. Ask the user where to save it — a directory. Don't guess a default location, except
   when run inside the sandbox repo, where `transcripts/` at the repo root is the
   established convention and can be offered as the default.
7. Slugify the title (lowercase, hyphenated, punctuation stripped) for the filename, e.g.
   `where-is-the-moat.html`. If the target file already exists, append `-2`, `-3`, etc.
8. Read the template at `template.html` (same directory as this file) and fill in:
   - `{{TITLE}}` — video title
   - `{{URL}}` — the YouTube URL
   - `{{DATE_ISO}}` — today, `YYYY-MM-DD`
   - `{{DATE_DISPLAY}}` — today, human-formatted (e.g. `Jul 6, 2026`)
   - `{{BODY}}` — the HTML body from step 5
   Write the filled result to `<directory>/<slug>.html`.
9. Regenerate `<directory>/index.html` so the folder stays browsable:
   - List every `*.html` file in the directory except `index.html`.
   - For each, `grep` its `<title>...</title>` and `<time datetime="...">` to get the title
     and ISO date without re-reading the whole file.
   - Sort by date descending.
   - Read `index-template.html` (same directory as this file), fill `{{ENTRIES}}` with
     either the `<ul class="list">...</ul>` of entries (each
     `<li><a href="<slug>.html"><span class="entry-title"><title></span><span class="entry-date"><date></span></a></li>`)
     or, if the directory has no transcripts, a `<p class="empty">No transcripts yet.</p>`.
   - Write the result to `<directory>/index.html`. This is a full regenerate each time —
     if a file was deleted since the last run, it simply won't appear; no error.
10. Open the new page directly in the user's default browser — no server involved:
    ```bash
    open "<directory>/<slug>.html"
    ```
11. Report the saved file path back to the user, noting whether real chapters were found
    and used as section headers, or whether it saved as one flat reflow.

## Notes

- The chapter fetch (step 3) is a page scrape of embedded JSON, not a documented public
  API — YouTube could change the page structure and break the regex. Treat any failure
  here as "no chapters," not an error to surface to the user.
- Do **not** commit or push. The file is left local for review — a plain `commit` picks it
  up when the user asks for one, per the repo's default git workflow.
- This skill has a duplicate copy in `~/.claude/skills/transcript/` (global, for use in any
  repo). Keep `SKILL.md`, `template.html`, and `index-template.html` identical across both —
  if you edit one, port the change to the other.
- Use plain `open` (macOS), not `agent-browser` — `agent-browser` drives an isolated
  automation browser for screenshots/verification, not something the user would actually
  see. `open` hits the real default browser.
