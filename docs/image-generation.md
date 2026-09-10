---
id: image-generation
title: Image generation
description: Image-capable models, the dedicated imagen and images provider types, /edit and /redo.
sidebar_label: Image generation
---

# Image generation

Image-capable models generate straight into the conversation: with a Gemini image
model (e.g. `gemini-3.1-flash-image`) just ask — the picture renders inline
as ANSI half-block art (capped well below a screenful, indented like other
blocks), and is saved INSIDE the session bundle (`<session>/images/` —
deleted with the session; ephemeral and `-m` runs fall back to
`~/.iota/images/`). The printed path is an OSC 8 hyperlink — clickable
in terminals that support it (⌘-click in Ghostty/iTerm2; Terminal.app has no
OSC 8 support). Generated images round-trip into the conversation, so
follow-ups like "make the circle blue" edit the previous image in place.
Sessions persist them losslessly (attachments), and `-m` single-shot runs
print the saved path instead of rasterizing into a pipe.

Two ways to switch generation on where it needs an explicit request-side
opt-in: the per-provider `image: true` config key, or the `/model` surface's
**Image** tab at runtime (shown for capable providers; persisted with the
session). On `openresponses` it advertises the `image_generation` built-in
tool (works with gpt-5-family models); on Google it adds
`responseModalities: ["TEXT","IMAGE"]` for official-API models that require
the opt-in — relays like zenmux generate without it.

## Dedicated image models — the `imagen` and `images` provider types

Models that ONLY generate images — Doubao Seedream, official Imagen, and the
other pure image models relay stations host — have no chat endpoint at all;
they speak Google's Imagen `:predict` protocol instead. The `imagen` provider
type carries them: **every message is a fresh generation** (your text is the
prompt; `/file` attachments ride along as reference images for
image-to-image), matching how stateless image tools conventionally work.
Editing is explicit: `/edit add a robot` re-sends the last generated image as
the reference, and consecutive `/edit`s chain naturally. To edit an *earlier*
picture, run `/edit` with no prompt: a picker opens with the image previewed
beside a newest-first list of everything this session generated (each row
labeled by the prompt that made it, with the file's clickable path below);
pick one and type your prompt. Unhappy with what came back? `/redo` rolls
again from the same canvas and prompt, and `/redo <reworded prompt>` retries
from that canvas with new wording — so a rejected picture never becomes the
input to the next attempt. Images render and persist exactly like
conversational generation, sessions keep the whole iteration history, and
`-m` does one-shot generation.

```yaml
providers:
  seedream:
    type: imagen
    key: ${env:ZENMUX_API_KEY}
    url: https://zenmux.ai/api/vertex-ai  # omit for the official Gemini API

models:
  seedream:
    provider: seedream
    id: bytedance/doubao-seedream-5.0-pro
    aspect_ratio: "3:2"                   # optional generation defaults,
    image_size: "2K"                      # passed through verbatim
    negative_prompt: "blurry, watermark"
```

The same knobs are adjustable mid-session: `/model` grows **Aspect**, **Size**,
and **Negative** tabs for image providers (a "default" row omits the
parameter), persisted with the session and replayed on resume. Only the tabs
a dialect actually has appear.

`type: images` is the sibling for the OpenAI Images protocol
(`/v1/images/generations` + multipart `/v1/images/edits`) — gpt-image
models, DALL·E, and the relays that mirror the endpoints. Same session
shape (`/edit`, `/file` references, one image per call); the dialect folds
dimensions into a single **Size** knob (e.g. `image_size: "1536x1024"`)
and has no aspect-ratio or negative-prompt parameters. DALL·E's URL-form
responses are fetched automatically.

Interactive turns ask for **progressive frames**: a refining thumbnail
appears in the generation widget and the finished picture replaces it in
place, exactly like conversational generation. Verified live on OpenAI and
zenmux, which both stream; xAI ignores the flags and answers with the plain
body — the same request serves both, so nothing is generated twice and a
non-streaming backend simply shows the elapsed clock. `imagen` has no
streaming form at all, so those turns show only the elapsed clock.

The edit endpoint comes in two wire flavors: OpenAI's native
`/images/edits` is multipart, while some backends (xAI) accept only a JSON
body and reject multipart outright. Set `json_edits: true` for those, or
flip the **JSON edits** tab on `/model` mid-session (persisted with the
session). Generation is unaffected either way.

Parameter and editing support varies by backend: relays map the full set
(seedream's aspect ratio, size, negative prompt, and reference-image editing
are live-verified), while the official Gemini API hosts generate-only Imagen
models that ignore reference images and the negative prompt — unknown
parameters are dropped server-side, so a knob with no visible effect means
that backend doesn't support it. A custom `url` is addressed in the vertex
`publishers/{vendor}/models` form (the relay convention); omitting `url`
targets the official Gemini API form. Results arrive either inline or as an
expiring signed URL (some relay-hosted models, e.g. Kling, answer that way) —
both land in the session the same, the link being fetched right away.

:::warning

Generation is billed per call, so failures are never auto-retried — an error
surfaces immediately and you decide whether to spend again.

:::

These models have no tokens, no temperature, and no reasoning, so the
corresponding machinery disappears for such sessions: `/model` shows no
Context/Effort/Temperature tabs, the status bar drops its context meter, and
`/compact` does not apply. `/model` still picks models — filtered to
image-capable ones when the server provides capability metadata.
