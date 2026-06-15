---
name: write-a-skill
description: Scaffold a new sandbox skill with proper frontmatter, terse SKILL.md, and progressive-disclosure splits when needed. Use when the user wants to create, write, author, or "make a skill" for sandbox.
---

# write-a-skill

Author a new skill in `sandbox/.claude/skills/<name>/`. Bias toward small, narrative single-file skills. Split into reference files only when SKILL.md crosses ~150 lines.

## Usage

```
/write-a-skill A skill that scaffolds a Storybook story for an experiment
/write-a-skill A skill that interviews me about whether an experiment is ready to ship
```

## Process

### 1. Gather requirements

Ask the user briefly:

- What does the skill do? (one sentence)
- What should trigger it? (keywords, slash command, file context)
- Does it run shell commands, write files, or just provide instructions?
- Is there a reference repo or existing skill to model after?

Skip questions the user already answered in the kickoff. Don't interrogate.

### 2. Draft SKILL.md

Use the template below. Keep it terse — sandbox CLAUDE.md is explicit about that. No emojis anywhere.

```md
---
name: <kebab-case-name>
description: <one sentence: what it does>. Use when <specific triggers / keywords>.
---

# <name>

<One-sentence purpose. Optionally one more sentence on scope.>

## Usage

\`\`\`
/<name> <example argument>
/<name> <another shape>
\`\`\`

## Steps

1. <Concrete action>
2. <Concrete action>
3. <Concrete action>

## Notes

<Anything non-obvious: caveats, edge cases, what NOT to do.>
```

### 3. Decide on splits

Stay single-file by default. Split when:

- SKILL.md exceeds ~150 lines
- The skill has distinct phases (e.g. "the routing logic" vs "the deep how-to") that load at different times
- A reference is genuinely large and rarely needed every invocation

When splitting, use the progressive-disclosure pattern: SKILL.md routes ("for X, see [X.md]"), reference files explain the detail that only some invocations need.

### 4. Review with user

Present the draft. Ask only what's still unclear:

- Does the description trigger correctly for the cases you have in mind?
- Anything missing from the Steps?
- Should any section be tighter?

Iterate on the description more carefully than the body — the description is the only thing other Claude agents see when deciding whether to invoke the skill.

## Description format

Max ~1024 chars. Third person. Two sentences:

1. **What it does**, concretely.
2. **"Use when ..."** — specific triggers, keywords, or file/context patterns.

Good:

```
Generate raster images (avatars, icons, illustrations, hero art) via FAL.ai for use in design experiments. Use when the user asks to create / make / generate N images of X, with or without a reference image.
```

Bad:

```
Helps with images.
```

The bad one gives the trigger model nothing to discriminate against other image skills.

## Conventions for sandbox skills

- Frontmatter: only `name` and `description`. No other keys unless there's a concrete reason.
- Title: `# <name>` (the skill name, lowercase, kebab-case). No "Skill" suffix, no marketing language.
- No emojis anywhere — `CLAUDE.md` forbids them in all contexts.
- Voice: direct, terse, command-oriented. Match the rest of `sandbox/.claude/skills/`.
- Examples are concrete. Show real paths, real arguments, real expected output.
- If the skill writes files or runs commands, be explicit about which tools (Bash, Write, Edit, AskUserQuestion).

## When to add scripts

Add a `scripts/` directory only if:

- The operation is deterministic and identical every time (validation, formatting, image processing)
- Errors need explicit handling that an LLM would get wrong intermittently
- The same bash logic would otherwise be regenerated on every invocation

Otherwise, write the bash inline in SKILL.md.

## Checklist before declaring done

- [ ] Description includes "Use when ..." with specific triggers
- [ ] SKILL.md is under ~150 lines (split if not)
- [ ] No emojis
- [ ] Frontmatter is just `name` + `description`
- [ ] Examples are concrete
- [ ] References (if any) are one level deep — no chained `see X.md` → `see Y.md`
- [ ] Voice matches existing sandbox skills (`note`, `link`, `design-experiment`, `promote`)
