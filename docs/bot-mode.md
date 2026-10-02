---
id: bot-mode
title: Bots
description: mode bot — one conversation that never ends, a MEMORY.md you can read and edit, and compaction that saves what matters first.
sidebar_label: Bots
---

# Bots

A bot is an agent with **one conversation that never ends**. You start it with
`iota run <name>`, talk to it, close the pane; tomorrow `iota run <name>` opens
the same conversation where you left it. There is no `/new`, no session picker
and no `iota resume` to remember — the bot has exactly one session, and every
start goes back to it.

Beside that conversation sits a **memory**: a short Markdown file the model
writes to, you can read and edit, and every request carries. When the
conversation grows past what the model can hold, the bot first saves what
should outlive it to that memory, then compacts by itself.

## Set one up

A bot is an `agents:` entry with `mode: bot`. The entry's name is the bot's
name:

```yaml title="~/.iota.yaml"
agents:
  coder:
    mode: bot
    model: gpt
    tools:
      code:
      shell:
```

```bash
iota run coder
```

`mode: bot` is everything [`mode: agent`](./agent-mode.md) is — the
AGENTS.md chain and the skills catalog of the project you start it in — plus
the never-ending session and the memory. `iota config init`'s starter carries
a commented-out bot entry you can uncomment; the startup card's mode row says
`bot`.

### What it needs

Checked before a single file is created, so a refused bot leaves nothing
behind:

- **A context window of at least 32k.** The window is the agent's
  `context_window`, else the model's, else the built-in 128k. Below 32k the
  memory and the room a bot keeps free for compaction would fill the window
  within a few turns, so it is refused:
  `bot "coder" needs a context window of at least 32k, this one is 8.2k (context_window: in its config)`.
- **A chat model that reports token usage and can call tools** — the bot
  needs the first to know when to compact and the second to write its memory.
- **A name that can be a directory**: letters, digits, `.`, `_` and `-`, at
  most 64 characters, starting with a letter or digit.

The full list, with every message, is under [Bots in the configuration
reference](./config-reference.md#bots).

## Coming back

The bot's directory is `~/.iota/bots/<name>/`. It holds a pointer to the
session, the memory, and a lock; the session itself is a bundle under
`~/.iota/sessions/` like any other. You never have to name it:

- **`iota run <name>` is the whole story.** Close the terminal, reboot, start
  it from another directory — it opens the same conversation.
- **It knows how long it has been, and where it is.** A bot that has been away
  for an hour or more is told so when it resumes (`Resumed after 3 days (last
  activity 2026-09-29 18:04)`), and so is one started in a different project
  (`Resumed in a different project: /work/iota → /work/herdr`). The AGENTS.md
  chain, the skills and the tools' working directory are always those of the
  project you start it in.
- **Config edits take effect on the next start.** The model, the context
  window, effort, temperature, `top_p` and the system prompt come from the
  config every time the bot starts. A change made with `/model` lasts for that
  process only.
- **One process at a time.** A second `iota run <name>` while the first is
  still open is refused (`bot coder is open in another iota process (pid
  4242)`) rather than writing the conversation twice.

What a bot does not do, because it has one session and it runs interactively:

| You try | You get |
|---|---|
| `iota run coder -m "…"` | `bot agents are interactive-only for now; run iota run coder` |
| `iota resume <id>` of the bot's session | `session <id> belongs to bot coder; run iota run coder` |
| `--no-save`, or `no_save: true` on the entry | `--no-save contradicts mode: bot` / `agents.coder: no_save contradicts mode: bot` |
| `/session` inside the bot | not a command there; and other agents' `/session` neither offers the bot's session nor deletes it |

To start over, give the entry a new name — a new name is a new bot, with a
new directory and a new conversation. The old one stays on disk.

## Memory

The memory is `~/.iota/bots/<name>/MEMORY.md`: **plain Markdown, at most
8 KiB**, that goes out with every request. It is yours as much as the
model's — open it in an editor, change it, delete lines, keep it in git.

```markdown title="~/.iota/bots/coder/MEMORY.md"
---
bot: coder
updated: 2026-10-02
---

## User
- [user] Reply in Chinese, keep technical terms as they are (2026-09-30)
- Never rebase

## Project: iota
- [inferred] Releases are tagged from main after ci.sh passes (2026-09-28)

## Open threads
- [user] Waiting on the two retention runs before changing the flush (2026-09-30)
```

- **Three sections, and the section is the scope.** `## User` is about you and
  goes out everywhere. `## Project: <name>` is about one project — named after
  the project's directory — and goes out in full only in that project;
  elsewhere the bot sees just its heading and line count. `## Open threads` is
  what is still in progress, and goes out everywhere. A section you add by hand
  is kept, and treated as global.
- **One entry is one line**, at most 500 bytes. A line the model writes starts
  with `[user]` (you said it) or `[inferred]` (the model concluded it, or read
  it in a tool's output) and ends with the date.
- **A line without a tag is yours.** The model can add lines, and change or
  remove the ones it tagged, but a line you wrote by hand — no `[user]` or
  `[inferred]` — is one it may not touch: it is told to ask you instead.
- **Edits reach the next request.** Change the file while the bot runs and the
  next message carries your version, with a dim `MEMORY.md reloaded` notice.
- **The front matter names the bot.** iota writes `bot:` and `updated:` when it
  creates the file; a file whose `bot:` names another bot is refused whole —
  the model is shown no memory — until you fix it.
- **Don't keep secrets in it.** It is plain text, sent with every request, and
  you may commit it.

### `remember`

The model writes the memory through one tool, `remember`, which a bot always
has and which needs no approval: it can **add** a line to a section,
**replace** the one line containing a piece of text, or **remove** it. The
tool's description tells the model to call it when you state a preference,
when a decision is made, or when it learns a fact it will need again.

Because nobody approves these writes, every one is visible and reversible:

- each write is shown in full in the transcript, and recorded in the
  conversation as `memory: MEMORY.md ## User +1 line: …`;
- before each write, the previous file is kept as `MEMORY.md.prev`;
- past 6 KiB the model is told to consolidate (merge lines with replace, drop
  stale ones with remove); a write that would pass 8 KiB is refused and the
  file is left as it was. A file you made longer than 8 KiB by hand is sent
  cut short, with a warning, and never changed for you.

A line removed from `MEMORY.md` only stops going out from then on; the
conversation it came from is still in the session's log.

## Compaction and the memory flush

An ordinary agent asks before it compacts. A bot cannot assume anyone is
there to answer, so it **compacts by itself** — and it does so earlier, to
leave room for the extra turn below: it keeps 25% of the window or 32k
free, whichever is larger, but never more than half the window (a 200k window
compacts at 150k, 128k at 96k, 32k at 16k).

When a turn ends past that point:

1. **The memory flush.** The bot gets one short turn of its own, with only
   `remember` available, to save what should outlive the compaction —
   preferences, decisions and their reasons, facts it will need again. It
   sends no notification, and anything you typed meanwhile waits for it.
2. **The compaction.** The older conversation is replaced by a summary; your
   last message and everything after it are kept word for word. The summary
   carries an earlier summary forward rather than summarizing it again.
3. The memory is re-read, and the conversation goes on.

If your next message was already waiting when the threshold was passed, the
bot compacts straight away, without the flush, and says so:
`⚠ Compacted without a memory flush`. A compaction that fails is retried
before the next message; one that fails twice in a row tells the host — herdr,
cmux or the terminal — as `bot <name>: compaction failing — …`, and is tried
again once the context has grown further. Ctrl+C interrupts a flush or a
compaction like any other turn.

## Running it unattended

A bot still stops at every approval gate and waits for you, and the host shows
it as waiting. What lets it carry on with nobody there is the same pair of keys
any agent has — the starter's commented-out bot sets both:

```yaml
agents:
  coder:
    mode: bot
    model: gpt
    tools:
      code: { auto_write: true }                 # writes and edits land without a yes
      shell: { sandbox: auto, auto_run: true }   # commands run confined, none waits for a yes
```

This hands the brakes to the sandbox: files are written and commands run
without asking, and anything the model gets wrong you find afterwards in git
and in the conversation. Where no sandbox is available — Windows, or Linux
without the sandbox binary — `auto_run` runs every command unconfined, so don't
use this there. Dropping `auto_write` and keeping `auto_run` is the cautious
half-way. See [Built-in toolsets](./builtin-toolsets.md) for both keys.

## Limits worth knowing

- **A bot lives as long as its process.** It is an interactive run in a
  terminal pane, not a service: when the pane is closed it is offline, and it
  picks up again when you start it.
- **The first start writes the session** even if you say nothing, so it shows
  up in `iota list sessions` from then on.
- **Two bots in the same project** share the files: two bots with the `code`
  set can overwrite each other's edits, and each starts its own MCP servers.
- **Keep `~/.iota/sessions` off a synced drive** (iCloud, Dropbox): the lock
  that keeps one writer per session does not reach across machines. The bot's
  own directory, `~/.iota/bots/<name>/`, is fine to sync or commit.
- **A filesystem that cannot lock** (some NFS and SMB mounts) cannot hold a
  session: iota refuses to open one there rather than write without the lock.
