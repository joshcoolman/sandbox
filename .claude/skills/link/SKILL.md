---
name: link
description: Add a link to the Link Worthy (recommended) page. Parses URL and comment, detects source type, creates markdown file with auto-fetched thumbnail.
---

# link

Add a link to the Link Worthy page.

## Usage

```
/link https://youtube.com/watch?v=abc123 Great breakdown of how agents actually work
/link https://github.com/user/repo I use this as a reference for building skills
/link https://some-tool.com Amazing tool for voice dictation
/link https://example.com/whitepaper.pdf Excellent guide to building agents
```

Everything after the URL is your comment. URL must come first.

## What It Does

1. Parses the URL and comment from the arguments
2. Detects the source type: `youtube`, `github`, `pdf`, or `web`
3. Creates a markdown file in `app/(blog)/recommended/items/`
4. For **web** links: uses `agent-browser` to take a screenshot (1200x630 viewport) and saves it to `public/screenshots/recommended/`
5. For **pdf** links: no screenshot needed -- the PDF badge serves as the visual indicator
6. Runs `npm run build` to trigger automatic thumbnail downloads for YouTube and GitHub links (oEmbed and OG image)
7. Commits the new file and pushes to main
8. Reports back with what was created

## File Format

```markdown
---
url: https://example.com
date: YYYY-MM-DD
---
The user's comment exactly as typed.
```

For web links that need a manual title (non-YouTube, non-GitHub), also include:
```markdown
---
title: Page Title Here
url: https://example.com
date: YYYY-MM-DD
---
```

## Filename Convention

`YYYY-MM-DD-slug.md` where slug is derived from:
- **YouTube**: slugified video title from oEmbed (fetch via `curl -s 'https://www.youtube.com/oembed?url=URL&format=json'`)
- **GitHub**: repo name (e.g., `superpowers`)
- **PDF**: slugified title or filename from the URL
- **Web**: domain name or a few words from the title

If a file with that name already exists, append `-2`, `-3`, etc.

## Screenshot Workflow (web links only, not PDFs)

YouTube and GitHub thumbnails are downloaded automatically during build. PDF links don't need screenshots. Only web links need a manual screenshot:

```bash
agent-browser open <url> --viewport 1200x630
agent-browser wait --load networkidle
agent-browser screenshot public/screenshots/recommended/YYYY-MM-DD-slug.png
agent-browser close
```

## Title Resolution

- **YouTube**: auto-resolved from oEmbed at build time -- do NOT add title to frontmatter
- **GitHub**: auto-resolved from GitHub API at build time -- do NOT add title to frontmatter
- **PDF**: add title to frontmatter (can't extract from PDF URL)
- **Web**: fetch the page title (curl + grep for `<title>`) and add it to frontmatter

## Rules

- URL must be the first argument, comment is everything after
- No editing the comment -- write it exactly as the user said it
- No confirmation needed -- just create and report back
- Always use today's date (run `date +"%Y-%m-%d"` to get it)
- After creating the file, run `npm run build` to verify and trigger thumbnail downloads
- After a successful build, commit the new file and push to main: `git add <file> && git commit -m "Add link: <slug>" && git push origin main`
- Keep it fast -- this is for capturing links in the moment
