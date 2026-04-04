---
name: replace
description: Replace a blog post's hero image from natural language. Fuzzy-matches the post title, crops the source image to 1.87:1 aspect ratio, and swaps the hero.
---

# replace

Replace a blog post's hero image from natural language.

## Usage

```
/replace The Memoirs of an Agent with @public/new-image.jpg
/replace Design as Dialogue @public/some-photo.png
/replace its happening with @public/replacement.jpg
```

## What It Does

1. Parse the args to extract: **blog reference** (natural language title or slug) and **source image path** (the `@`-prefixed file path)
2. Fuzzy match the blog reference against filenames in `blog/*.md` -- strip quotes, punctuation, compare lowercase words. Confirm with the user if ambiguous.
3. Locate the existing hero image at `public/blog/{slug}.jpg` (or `.png`)
4. Get the source image dimensions with `sips`
5. Crop the source to **1.87:1 aspect ratio** (the blog hero standard):
   - If source is too tall: crop height from top (`width / 1.87`)
   - If source is too wide: crop width centered (`height * 1.87`)
6. Output the cropped image to `public/blog/{slug}.jpg`, overwriting the existing hero
7. Delete the source image from `public/`
8. Report what was done: old dimensions, new dimensions, files affected

## Aspect Ratio

Blog hero target ratio is **1.87:1** (derived from the established 1179x630 standard). Always crop to this ratio. Use `sips --cropToHeightWidth` for the crop.

## Rules

- Always prefer cropping from the top (keep the top of the image) when reducing height
- Keep the original file extension for the hero (usually `.jpg`)
- Delete the source file after successful replacement
- No confirmation needed for the crop -- just do it
- If no matching blog post is found, list available posts and ask
- The word "with" between the title and `@` reference is optional -- handle both forms
