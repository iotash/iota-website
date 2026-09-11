# iota-website

The website for [iota](https://github.com/iotash/iota) — `iota.sh`. Built with
Docusaurus 3 and TypeScript.

```bash
pnpm install
pnpm start     # dev server on http://localhost:3000
pnpm build     # static build into ./build
pnpm serve     # serve the build
```

## What is where

| Path | What |
|---|---|
| `src/pages/index.tsx` | The homepage — its own top bar and footer, no theme navbar |
| `docs/` | User documentation, derived from the iota README |
| `changelog/` | One post per tagged release (the blog plugin, configured as a changelog) |
| `src/css/custom.css` | The whole theme: colour, type, spacing, components |
| `src/theme/NotFound/` | The 404 page |
| `static/img/` | Favicons, wordmarks, app icon, `og.png` |

## Design

The design contract is `design/DESIGN.md` — colour, type, style, components and
every page, section by section. The source of truth for the drawings is
`iota-website.pen`, a [pen.dev](https://pen.dev) file; open it with the Pencil
app. Exported logo assets are in `design/logo/`.

`static/img/og.png` (1200×630) is generated from `design/logo/iota-wordmark.svg`
plus Inter Tight 700; regenerate it if the positioning sentence changes.

## Deployment

Cloudflare Pages builds every push to `main` through its Git integration —
`pnpm build`, output directory `build`, `NODE_VERSION=24` — and serves it at
`iota.sh`. There is no deploy workflow in this repository.
