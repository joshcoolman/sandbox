#!/usr/bin/env node
// Validate that README links point at things that actually exist on disk.
// Deterministic, no network. Exits non-zero if any link is broken.
//
//   node scripts/check-readme-links.mjs
//
// Checks two derived-link classes (the ones that 404 silently):
//   1. "View Code" GitHub tree links  -> the path must be a real directory.
//      (The (experiments)/ route-group segment is the usual culprit.)
//   2. Screenshot image refs (./public/...) -> the file must exist.
// View Live links point at the live site and can't be checked offline — skipped.

import { existsSync, readFileSync, statSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join, resolve } from 'node:path'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const readme = readFileSync(join(root, 'README.md'), 'utf8')
const TREE_PREFIX = 'https://github.com/joshcoolman/sandbox/tree/main/'

const broken = []

// 1. View Code links: [View Code ...](<url>)** — non-greedy up to the )** terminator,
//    which is safe even though the path itself contains "(experiments)".
for (const m of readme.matchAll(/\[View Code[^\]]*\]\((https:\/\/[^\n]+?)\)\*\*/g)) {
  const url = m[1]
  if (!url.startsWith(TREE_PREFIX)) {
    broken.push(`View Code link not a github tree URL: ${url}`)
    continue
  }
  const relPath = url.slice(TREE_PREFIX.length)
  const abs = join(root, relPath)
  if (!existsSync(abs) || !statSync(abs).isDirectory()) {
    broken.push(`View Code -> missing dir: ${relPath}`)
  }
}

// 2. Screenshot image refs: ![alt](./public/....png)
for (const m of readme.matchAll(/!\[[^\]]*\]\((\.\/[^)]+)\)/g)) {
  const rel = m[1].replace(/^\.\//, '')
  if (!existsSync(join(root, rel))) {
    broken.push(`Image -> missing file: ${rel}`)
  }
}

if (broken.length) {
  console.error(`README link check FAILED — ${broken.length} broken:`)
  for (const b of broken) console.error(`  ${b}`)
  process.exit(1)
}
console.log('README link check passed.')
