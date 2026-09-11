# iota — website design

Design source: `iota-website.pen` (Pencil / pen.dev). Open it with the Pencil app; every frame
listed below lives in that one file. Exported logo assets are in `design/logo/`.

Target implementation: Docusaurus. Colors are expressed as Infima variables, the type scale as a
plain CSS scale, and the components map onto Docusaurus' own swizzle points (navbar, footer, docs
sidebar, TOC, admonitions, code blocks, pagination).

---

## 1. Logo

Five directions were drawn, each with a colored, mono and dark version, favicon sizes and a
horizontal wordmark.

| Frame | Direction | Idea |
|---|---|---|
| `01 Logo / A 纯字形` | Pure glyph | ι set in Source Serif 4 — the letter as-is |
| `01 Logo / B 字形+光标` | Glyph + cursor | Bold sans ι followed by a terminal block cursor in amber |
| `01 Logo / C 几何极简` | Geometric | ι reduced to one round-capped stroke: stem into a quarter-circle hook |
| `01 Logo / D 等宽提示符` | Monospace prompt | ι› set in JetBrains Mono — the mark is a prompt line |
| `01 Logo / E 徽标+文字标` | Badge + wordmark | The hook knocked out of a filled squircle, with an accent tittle |

### Recommended: D — the prompt mark ι›

**Superseded:** the first round recommended C, the one-stroke geometric ι. That decision was
reversed. C is still drawn in `01 Logo / C 几何极简`, and its old recommendation frame is kept as
`zz Superseded / 推荐 C（第一版）`; its exported assets are kept under `design/logo/superseded-c/`.
Nothing in the current design references them.

The refinement lives in `01 Logo / ★ 推荐 D 精修`, in six studies.

Why D:

- It is the product, not a metaphor for it. The mark is a prompt line — the Greek letter the tool
  is named after, followed by the character that invites you to type. A geometric abstraction of ι
  says "some brand"; `ι›` says "this thing runs in a terminal" before you read a word.
- It is set in the face the product actually prints in. The site's mono is JetBrains Mono, so the
  logo, the install command and the terminal transcript on the homepage are all the same voice.
- It survives being outlined. Every shipped file carries paths, never `<text>`, so the site never
  waits on a webfont to draw its own logo and there is no font-licensing question at all.

#### The four studies

1. **Prompt character.** `›` (U+203A) chosen over `❯` (U+276F), `>` and `$`. The single guillemet
   sits inside the iota's own x-height band, so the pair reads as one word-shaped mark. `❯` is full
   cap height and outweighs the ι until the mark reads as "chevron". `>` reads as shell
   redirection. `$` has both an ascender and a descender, which is two storeys against a one-storey
   letter.
2. **Tracking.** −80 units (−0.08em). A monospace advance leaves 184 units between the two glyphs,
   which is a word space; −80 closes it to 104 units, bound but not touching. −160 crowds the
   iota's tail and fills its counter at small sizes.
3. **Weight.** Bold (700), stem 125 units — it holds its counter to 16 px and matches Inter Tight
   700 beside it. ExtraBold is heavier than anything else on the page.
4. **Baseline.** No adjustment. The ι spans 250–800 in the em box and the › spans 280–760, so their
   optical centres are already within 5 units. Both stay on the baseline, which is what keeps the
   mark identical to what the terminal prints.

#### Small sizes — the two-favicon answer

The first round's objection to D was that it goes ambiguous when small. It does, and the fix is not
to avoid the size but to ship two files, which is what the `sizes` attribute is for. Both are
measured at true pixel size in the study, not scaled down from a large one.

| Size | Form | Why |
|---|---|---|
| 32 px and up | Filled squircle, white `ι›`, glyph width 74 % of the tile | The tile carries the brand colour, so the mark never depends on the page ground. Both glyphs still hold their counters. |
| 16 px | Same squircle, same colour, chevron dropped — white `ι` alone at 56 % of the tile height | Two x-height glyphs inside 16 px is 7 px of ink each and they mush. One glyph gets 9 px and stays readable. |

Bare forms were tested too and rejected: a bare `ι›` shrinks fastest because it has to fit by width,
and a bare `ι` on its own reads as a lowercase L.

```html
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="icon" href="/favicon-32.png" sizes="32x32">
<link rel="icon" href="/favicon-16.png" sizes="16x16">
<link rel="apple-touch-icon" href="/favicon-180.png">
```

#### Wordmark

`ι› iota`, the whole line in JetBrains Mono Bold — literally what the terminal shows when you type
the command. One font, one weight, one outline. The alternative (the mono mark plus "iota" in Inter
Tight) is drawn in the same frame and rejected: it introduces a second voice into a mark that is
about a prompt.

The glyphs are pulled straight from JetBrains Mono Bold (`/Library/Fonts/JetBrainsMono-Bold.ttf`,
1000 upm) with fontTools, flipped to a y-down space with the baseline at y=800, and the `ι›` pair
tracked −80. The wordmark inserts one full mono advance (600 units) as the space between the mark
and the name.

### Exported assets — `design/logo/`

Everything is outlined. No file contains a `<text>` element.

| File | What |
|---|---|
| `iota-mark.svg` | The bare `ι›` mark, `fill="currentColor"` — use this in the site |
| `iota-mark-primary.svg` / `.png` | Light-mode mark, `#0D7680`, 824×512 PNG with alpha |
| `iota-mark-dark.svg` / `.png` | Dark-mode mark, `#3FC7C0`, 824×512 PNG with alpha |
| `iota-wordmark.svg` | `ι› iota`, `fill="currentColor"` |
| `iota-wordmark-light.svg` / `.png` | Wordmark in `#0F1720`, 1169×256 PNG with alpha |
| `iota-wordmark-dark.svg` / `.png` | Wordmark in `#E6EAEF`, 1169×256 PNG with alpha |
| `favicon.svg` | 32 px form — squircle `rx=7`, white `ι›` on `#0D7680` |
| `favicon-16.svg` | 16 px form — squircle `rx=4`, white `ι` alone |
| `favicon-16/32/48/128/180.png` | Rasters; 16 is the chevron-less form, the rest keep it |
| `iota-app-icon.svg` / `.png` | 512 / 1024 px squircle app icon, white `ι›` on `#0D7680` |
| `superseded-c/` | The whole first-round C asset set, kept for reference, referenced by nothing |

Note on rendering: Pencil's own `Export` returns PNGs at ~52 % alpha and has no SVG format at all
(`png`, `jpeg`, `webp`, `pdf`, `html-tailwind`, `html-css` only). The SVGs here are generated from
the font outlines directly, and the PNGs are rasterised from those same outlines with an even-odd
fill at 8× supersampling — so the files, the canvas and the font agree exactly.

---

## 2. Color

Frame `02 Color`. Primary is a deep teal: it reads as "terminal" beside a monospace face without
being the green every CLI site already uses, and `#0D7680` is dark enough to clear 4.5:1 on white
while its dark-mode twin `#3FC7C0` clears 9:1 on ink. Amber is the only accent, reserved for the
cursor, the copy-command affordance and inline highlights — never for a second call to action.

All ratios below were measured, not estimated. Body text clears AAA in both modes; every semantic
color and the primary clear AA against their own background.

### Brand ramp

| Step | Light | Dark |
|---|---|---|
| darkest | `#09535A` | `#298E89` |
| darker | `#0B646D` | `#32ACA6` |
| dark | `#0C6A73` | `#35B7B0` |
| **primary** | **`#0D7680`** | **`#3FC7C0`** |
| light | `#0E828D` | `#53CDC7` |
| lighter | `#0F8893` | `#5DD0CA` |
| lightest | `#1199A6` | `#7CD9D4` |
| soft (tint) | `#E3F3F5` | `#12303A` |
| on-primary | `#FFFFFF` (5.36:1) | `#0B0F14` (9.28:1) |

### Neutrals

| Token | Light | Dark | Contrast on bg |
|---|---|---|---|
| bg | `#FFFFFF` | `#0B0F14` | — |
| surface | `#F6F8FA` | `#11171F` | — |
| surface-2 | `#ECF0F3` | `#171F29` | — |
| code-bg | `#F1F4F7` | `#151C25` | — |
| border | `#DDE3E8` | `#232C36` | — |
| border-strong | `#C3CCD4` | `#34404D` | — |
| text | `#0F1720` | `#E6EAEF` | 18.05 / 15.91 — AAA |
| text-2 | `#4A5461` | `#A7B0BA` | 7.69 / 8.75 — AAA |
| text-3 | `#616C79` | `#7E8894` | 5.28 / 5.34 — AA |

### Semantic + accent

| Token | Light | on bg | Dark | on bg | Soft light | Soft dark |
|---|---|---|---|---|---|---|
| accent | `#B45309` | 5.02 | `#F5B841` | 10.81 | `#FDF1DC` | `#3A2C12` |
| success | `#15803D` | 5.02 | `#4AD38A` | 10.05 | `#E6F6EC` | `#0F2E1E` |
| warning | `#9A6700` | 4.87 | `#F2B33D` | 10.33 | `#FFF4D6` | `#332A10` |
| error | `#C93C3C` | 5.01 | `#F47B7B` | 7.29 | `#FDE8E8` | `#3A1717` |
| info | `#2B6CD9` | 4.94 | `#74A8FF` | 8.04 | `#E7EFFD` | `#14243F` |

### Infima mapping

Drop this into `src/css/custom.css`.

```css
:root {
  --ifm-color-primary:          #0D7680;
  --ifm-color-primary-dark:     #0C6A73;
  --ifm-color-primary-darker:   #0B646D;
  --ifm-color-primary-darkest:  #09535A;
  --ifm-color-primary-light:    #0E828D;
  --ifm-color-primary-lighter:  #0F8893;
  --ifm-color-primary-lightest: #1199A6;

  --ifm-background-color:         #FFFFFF;
  --ifm-background-surface-color: #F6F8FA;
  --ifm-font-color-base:          #0F1720;
  --ifm-color-content-secondary:  #4A5461;
  --ifm-toc-border-color:         #DDE3E8;
  --ifm-code-background:          #F1F4F7;
  --ifm-pre-background:           #F1F4F7;

  --ifm-color-success: #15803D;
  --ifm-color-warning: #9A6700;
  --ifm-color-danger:  #C93C3C;
  --ifm-color-info:    #2B6CD9;

  --iota-accent:        #B45309;
  --iota-primary-soft:  #E3F3F5;
  --iota-surface-2:     #ECF0F3;
  --iota-border-strong: #C3CCD4;
  --iota-text-3:        #616C79;
}

[data-theme='dark'] {
  --ifm-color-primary:          #3FC7C0;
  --ifm-color-primary-dark:     #35B7B0;
  --ifm-color-primary-darker:   #32ACA6;
  --ifm-color-primary-darkest:  #298E89;
  --ifm-color-primary-light:    #53CDC7;
  --ifm-color-primary-lighter:  #5DD0CA;
  --ifm-color-primary-lightest: #7CD9D4;

  --ifm-background-color:         #0B0F14;
  --ifm-background-surface-color: #11171F;
  --ifm-font-color-base:          #E6EAEF;
  --ifm-color-content-secondary:  #A7B0BA;
  --ifm-toc-border-color:         #232C36;
  --ifm-code-background:          #151C25;
  --ifm-pre-background:           #151C25;

  --ifm-color-success: #4AD38A;
  --ifm-color-warning: #F2B33D;
  --ifm-color-danger:  #F47B7B;
  --ifm-color-info:    #74A8FF;

  --iota-accent:        #F5B841;
  --iota-primary-soft:  #12303A;
  --iota-surface-2:     #171F29;
  --iota-border-strong: #34404D;
  --iota-text-3:        #7E8894;
}
```

Terminal windows keep the dark palette in both themes — they are a picture of the product, not a
surface of the site. Their internal colors are the dark-mode tokens plus `#F5B841` for the cursor.

---

## 3. Type

Frame `03 Type`. One superfamily for the interface, one mono for everything the product actually
prints. All three are on Google Fonts with variable weights.

| Role | Family | Stack |
|---|---|---|
| Display & headings | Inter Tight | `"Inter Tight", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif` |
| Body, UI, nav | Inter | `"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif` |
| Code, terminal | JetBrains Mono | `"JetBrains Mono", ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace` |

JetBrains Mono was chosen over the alternatives for its tall x-height and unambiguous `0 O l 1` —
a transcript of a real session is the site's main image, so the mono has to survive being read.

### Scale — 16 px base, desktop

| Token | Size / line-height | Weight | Tracking | Use |
|---|---|---|---|---|
| Display | 56 / 1.05 | 700 | -0.03em | Hero headline only |
| H1 | 40 / 1.15 | 700 | -0.022em | Page title, docs h1 |
| H2 | 30 / 1.25 | 600 | -0.017em | Section heading |
| H3 | 22 / 1.35 | 600 | -0.01em | Sub-section |
| H4 | 18 / 1.4 | 600 | 0 | Card title, sidebar group |
| Lead | 20 / 1.6 | 400 | 0 | Hero subhead, docs intro |
| Body | 16 / 1.7 | 400 | 0 | Default paragraph |
| Body S | 14 / 1.6 | 400 | 0 | Captions, table cells, footer |
| Caption | 13 / 1.5 | 400 | 0 | Figure captions, meta |
| Overline | 12 / 1.4 | 600 | +0.08em | Section eyebrow, uppercase |
| Code inline | 14.5 / 1.6 | 500 | 0 | `0.9em` of body |
| Code block | 14 / 1.65 | 400 | 0 | Fenced code |
| Terminal | 13.5 / 1.7 | 400 | 0 | Terminal transcript |

Mobile (≤ 640 px): display 56→36, h1 40→30, h2 30→24, h3 22→19, lead 20→17, code block 14→13.
Body never drops below 16 px. Line length caps at 72ch for docs prose and 62ch for marketing copy.

---

## 4. Style

Frame `04 Style`. Three moods were drawn; **B · Quiet engineering** is chosen and everything else in
the file is built on it. A (terminal native — dark, mono-only, zero radius) and C (soft product —
rounded, shadowed, gradient) stay in the frame as alternates.

B in one sentence: a light documentation surface where the only high-contrast element is the dark
terminal block, separated by hairlines rather than shadows, with mono reserved for what the product
prints.

- **Spacing** — 4 px base: 4, 8, 12, 16, 24, 32, 48, 64, 96, 128. Section padding 96 desktop / 48
  mobile. Content column 1120 px inside a 1440 page.
- **Radius** — `sm 4` badges and chips; `md 8` buttons, inputs, cards, code blocks; `lg 12` panels,
  terminal window, modals; `pill 999` version pill and filter chips.
- **Borders & elevation** — static content is separated by 1 px hairlines, never by shadow. Exactly
  two shadows exist: `sm` (0 2 8 -2, 12 % ink) for dropdowns and popovers, `md` (0 12 32 -8, 16 %)
  for modals and the mobile drawer. Focus ring is 2 px primary with 2 px offset, on everything
  interactive.
- **Icons** — Lucide, outline only, 1.5 px stroke, never filled. 16 px inline with text, 20 px in
  buttons and nav, 24 px in doc link cards. Icons inherit the surrounding text color, except
  card icons, which take primary.
- **Voice** — lowercase product name always. Sentence case headings, no title case. No exclamation
  marks, no "blazingly fast", no rocket emoji. Claims name the provider, the flag or the file path.

---

## 5. Components

Frame `05 Components`. Every component is drawn once from themed variables; the left panel of each
pair renders under `mode=light`, the right under `mode=dark`, from the same nodes.

Buttons (primary / secondary / ghost, three sizes, hover / focus / disabled / text link) · badges
and tags · tabs · search box with ⌘K hint · pagination · breadcrumb · code block with filename
header and copy button · install command box · inline code chip · terminal window (title bar, body
with tool calls and streaming reply, status line with context meter) · admonitions (note / tip /
warning / danger) · doc link card · table · docs sidebar · TOC · navbar · footer.

The marketing feature-card grid was removed in the second round, along with the provider strip,
stat block and secondary hero — none of them survive on the new homepage, and a component library
that carries them invites them back. What is left is what Docusaurus actually needs plus the two
things that are ours: the install command box and the terminal window.

`component/Navbar`, `component/Footer`, `component/Navbar Mobile` and `component/Footer Mobile` are
real reusable components (frame `Components (reusable)`), instanced by every page frame — editing
one propagates everywhere. All four carry the `ι› iota` wordmark as an outlined path.

---

## 6. Pages

Desktop frames are 1440 wide, mobile 390.

### The homepage

Rebuilt in the second round. The first version was a conventional SaaS landing page — big gradient
hero, six-card feature grid, provider logo strip, toolset cards, a second call to action — and it
argued with the product: iota is the smallest thing that does the job, and the page was the largest
thing that could be built out of it. The v1 frames are kept as `zz Superseded / Home …` for
comparison.

The replacement is a single column 680 px wide inside the 1440 page, and it reads top to bottom
like a well-typeset README:

1. A 56 px top bar: the wordmark, then `docs` `install` `source` as plain mono text links.
2. The positioning sentence at 38 px, then one sentence of explanation. No eyebrow, no gradient.
3. The install command in a copyable box, with the cargo one-liner under it as small mono.
4. Four facts on one line: `v0.1.0 · 10.25 MiB · MIT · macOS and Linux`.
5. A terminal transcript — the only picture on the page. It is a real agent-mode session
   (`iota run coder`, an agent with `workspace: true`): a bash call, its result, an answer that
   names a function and shows the two-line fix.
6. `# why it is small` — the philosophy paragraph (section 7 below has the copy).
7. `# what it is, and is not` — two honest lists, five items each.
8. Three text links out: documentation, source, changelog. Each with a half-line of context.
9. A 56 px footer: `MIT licensed · joyqi` and `iota.sh`.

There is exactly one button on the page and it copies the install command. Everything else is a
text link. Headline is 38 px desktop / 29 px mobile, so nothing shouts. Mobile is the same column
at 390 px with the two lists stacked instead of side by side; no layout is re-thought.

### All frames

| Frame | Notes |
|---|---|
| `06 Pages / Home (Light)` | The single-column page described above |
| `06 Pages / Home (Dark)` | Same nodes under `mode=dark` |
| `06 Pages / Docs Article (Light)` | Sidebar + prose + TOC, with table, tip and warning admonitions, code block, pagination |
| `06 Pages / Docs Home (Light)` | Overview with nine section cards and a quick-install box |
| `06 Pages / Install (Light)` | Tabbed installer (Homebrew / Cargo / Binary / Source), the other three as cards, a verification terminal, next-step cards |
| `06 Pages / Changelog List (Light)` | Release entries with version pill and breaking/feature/fix labels, pagination, subscribe sidebar |
| `06 Pages / Changelog Post (Light)` | Article header, prose, list, code, warning, a change table, prev/next, TOC with share |
| `06 Pages / 404 (Light)` | Terminal-styled joke that also answers the most likely dead link, plus four recovery cards |
| `06 Pages / Home Mobile (Light)` | 390 wide, same single column |
| `06 Pages / Home Mobile (Dark)` | Same nodes under `mode=dark` |
| `06 Pages / Docs Article Mobile (Light)` | Collapsed sidebar as a "Docs menu" bar, TOC as a collapsible card |
| `06 Pages / Docs Home Mobile (Light)` | Section cards as full-width rows |
| `06 Pages / Install Mobile (Light)` | Four-tab installer, commands wrap without horizontal scroll |
| `06 Pages / Changelog List Mobile (Light)` | — |
| `06 Pages / Changelog Post Mobile (Light)` | — |
| `06 Pages / 404 Mobile (Light)` | — |
| `zz Superseded / …` | First-round homepage (desktop and mobile, both themes) and the C logo recommendation |

The docs, install, changelog and 404 pages were not rebuilt. They already had the restrained tone
the homepage was missing; the second round only touched their version strings.

Copy is drawn from `/Users/joyqi/Work/iota/README.md` — the flags, toolsets, config shape and
release notes are the real ones, not lorem. Version numbers across every frame are `v0.1.0`, which
is what `Cargo.toml` says today; the changelog entries below it run `v0.0.9`, `v0.0.8`, `v0.0.7`.
The binary size on the homepage, 10.25 MiB, is the stripped `target/release/iota` on arm64 as
`scripts/size.sh` reports it (10748048 bytes; the iota repo's `target/size.md` is the source).

---

## 7. Philosophy — homepage copy, final

This is the shipping English copy. It is set on the page exactly as written here.

### Positioning

> **The smallest thing between your terminal and a model.**
>
> iota is an agent CLI written in Rust. You configure agents — a model, a prompt, a set of tools —
> and run them: `iota run <agent>`.

### Install

> `$ brew install iotash/tap/iota`
>
> or `cargo install --git https://github.com/iotash/iota`

### Facts

> `v0.1.0  ·  10.25 MiB  ·  MIT  ·  macOS and Linux`

### Terminal caption

> An actual session — agent mode, one bash call, one answer. No cuts.

### `# why it is small`

> The terminal is already an interface: it has scrollback, a clipboard, pipes and a shell. We did
> not want to rebuild any of that in a window, so iota adds the one thing the terminal is missing —
> a model that can use your tools — and stops there. Nothing it does is hidden from you: a session
> is a directory holding meta.json and messages.jsonl, one JSON record per line, appended as you
> talk, and /debug shows the exact request and response bodies that went over the wire. The config
> is one YAML file with three maps in it. There is no account, no daemon and no telemetry. And there
> is nothing to be locked into — any endpoint that speaks OpenAI, Anthropic or Gemini works,
> including one you run yourself, and a child agent is just `iota run <agent> -m "<task>"` run from
> bash, like anything else.

### `# what it is, and is not`

> **it does**
> - run an agent you named in the config — its model, its prompt, its tools
> - call MCP tools, and run bash inside an OS sandbox
> - stream a reply, and let you keep typing while it arrives
> - render markdown, tables and math as ANSI, inline
> - save every session as plain text you can resume, grep or delete
>
> **it does not**
> - run before you configure an agent — iota config init writes the first one
> - run a daemon or a server, or leave anything running after you quit
> - ask you to sign in, or phone home
> - write outside the project root unless you say so
> - wrap the model in a framework you have to learn first

### Links out

> → **Read the documentation** — install, configure, and the three layers of ~/.iota.yaml
> → **Source on GitHub** — MIT, ~70k lines of Rust, issues welcome
> → **Changelog** — what changed, and what it breaks

### Footer

> `MIT licensed · joyqi` … `iota.sh`

### Rules the copy follows

Lowercase product name. Sentence case, never title case. No exclamation marks, no "blazingly", no
"supercharge", no "unlock", no rocket. Every claim names a file, a flag or a protocol, so it can be
checked: `meta.json`, `messages.jsonl`, `/debug`, `iota run`, `~/.iota.yaml`. "We" appears once, in
the sentence about not rebuilding the terminal, because that is the one place a decision is being
explained rather than a fact stated.

One claim worth re-checking before launch: the **10.25 MiB** binary size is the stripped arm64
`target/release/iota` (10748048 bytes) as the iota repo's `scripts/size.sh` measures it — MiB to two
decimals, the same unit that repo uses — and an x86_64 build will differ. The line count is `src/` only — 71k lines,
rounded down to ~70k; the 32k lines under `tests/` are not counted in it.

The "it does not" list says *leave anything running after you quit* rather than *run anything in the
background*, because the `bash` toolset does run background jobs — they are killed when iota exits,
which is the honest form of the claim.

Both lists were re-cut when iota became agent-first (2026-09-11). "it does" now leads with the thing
you actually run — a configured agent — and dropped *take images, PDFs and text files as
attachments*, which is a chat nicety the docs still carry. "it does not" gained *run before you
configure an agent*: the zero-config start was given up on purpose, `iota config init` is where it
went, and a page that hid that would be selling the old product. It lost *try to be an IDE*, the
least informative line of the ten.

---

## 8. Open questions

1. **Is teal still the right primary?** It was picked to read as "terminal" without being the usual
   CLI green, and it still clears every contrast bar (section 2). On the new, quieter homepage it
   appears in exactly four places: the wordmark, the `$` in the install box, the three link arrows,
   and the copy button. That is little enough that a more neutral brand — ink-on-paper with the
   colour only in the terminal block — would also work. My recommendation is to keep it: one hue
   doing four jobs is not a lot of colour, and the favicon needs a ground.
2. **Does amber still earn its place?** `#B45309` / `#F5B841` now survives only inside the terminal
   transcript, on the cursor and the `⏺ bash` tool marker. That is defensible — it is the one place
   on the page where a second colour carries meaning rather than decoration — but if you want a
   strictly single-hue brand, the cursor can take the teal and amber disappears with no other edits.
   Slight preference for keeping it: a blinking teal cursor on a teal-accented page reads as a
   rendering artefact.
3. **Blog or changelog?** The list and article pages are built as a changelog (version pills,
   breaking/feature/fix labels). If the site also wants an editorial blog, the same layout works
   with the version pill swapped for an author and a reading time.
4. **Search.** The docs navbar shows a ⌘K box. Docusaurus needs either Algolia DocSearch (free for
   open source, needs an application) or a local search plugin. The homepage has no search at all,
   deliberately.
5. **Two navbars.** The homepage uses a minimal top bar (wordmark + three mono links); the docs
   pages keep the fuller `component/Navbar` with search, version pill and theme toggle. That is a
   deliberate split, and Docusaurus supports it, but it does mean the site has two headers. Say the
   word if you would rather the docs navbar were also stripped back.
6. **Social preview image.** Not drawn. The existing `og.png` is from the old single-page site and
   matches neither this palette nor the D logo. It should be regenerated — the obvious version is
   the wordmark and the positioning sentence on the dark ground, nothing else.
