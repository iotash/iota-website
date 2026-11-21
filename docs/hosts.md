---
id: hosts
title: Terminal hosts
description: What iota tells the terminal it runs in — the plain terminal's progress and notification sequences, the in-band program status (OSC 7501) a terminal that asks for it gets, herdr-core's identity, herdr's pane lifecycle, cmux's status row — and what the host tells the model back.
sidebar_label: Terminal hosts
---

# Terminal hosts

A chat has a state — a turn is running, the model needs you, it is your move,
the last turn failed — and iota tells the terminal it runs in about it, so the
tab, the pane or the sidebar shows what the chat is doing while you look
elsewhere. Nothing here is configured: the host is recognised from the
environment it injects, and a plain terminal gets the plain-terminal treatment.
The one knob is `notify` on the agent, which gates the attention ping only.

A [background job](./builtin-toolsets.md#background-jobs) counts as work: while
one runs, a chat that is otherwise waiting for you is still reported as
working — its result will bring another reply, so the host is not told the
chat is done until then. An approval pending while a job runs is still
reported as needing you.

The traffic runs one way except for a single line: the host is *told* the
state, the session and the exit; the model is told, in the
[`<environment>` block](./system-prompt.md#the-hosts-lines), which host that is
and the ids its CLI takes. Everything a host does is best-effort and bounded —
a host that is slow, absent or failing never delays or changes the chat.

## The plain terminal

Every run has this host; it is the fallback the others sit in front of. It
speaks through two escape sequences most modern terminals understand:

| State | Sequence | What the terminal shows |
|---|---|---|
| a turn is running, or a background job | OSC 9;4 with state 3 | an indeterminate progress indicator on the tab |
| the model needs you (an approval, a question) | OSC 9;4 with state 4 at 100 | a warning-coloured, full bar |
| the last turn failed | OSC 9;4 with state 2 at 100 | an error-coloured, full bar |
| your move | OSC 9;4 with state 0 | nothing |

And the attention ping: when the model needs you, or a turn ends while the
terminal is not focused, one OSC 9 notification carries a short line:
`<tool> needs approval`, the failed turn's headline, or the reply's first
words. It is silent while the terminal is
focused — whoever is already watching needs no bell — and `notify: false` on
the agent silences it entirely. The progress indicator is not gated: it is
what the tab looks like, not an interruption.

The terminal's background colour is also asked once, at start-up (OSC 11), to
pick the light or dark palette. A multiplexer that draws its own panes answers
this itself — herdr does — so the answer describes what you actually see.

## Program status (OSC 7501)

Some terminals read a program's state from the program's own output — the
Program Status Protocol, OSC 7501 — and show it on their own: a tab, a
sidebar, a `wait` command. This is a capability of the terminal, not a host:
any terminal that says it reads the protocol gets it, whichever host, or none,
was recognised. Where it is on, iota reports the chat's state in band instead
of the OSC 9;4 progress bar — one record, replaced by every report:

| The chat | The record (`ESC ] 7501 ; … ESC \`) |
|---|---|
| a turn is running, or a background job | `state=working:app=iota` |
| the model needs you — an approval, a question, any open dialog | `state=blocked:app=iota` |
| your move | `state=idle:app=iota` |
| the last turn failed | `state=error:app=iota` |
| exits | `state=clear` |

How each state looks is the terminal's choice; iota writes these four words
and nothing else — `idle`, not `done`, and `blocked` without a reason. The
attention ping is unchanged: it is still the plain terminal's OSC 9.

**One question, at start-up.** Before the screen is drawn, iota asks its
controlling terminal once whether it reads the protocol — `ESC ] 7501 ; ? ESC \`
followed by a cursor-position request (`ESC [ 6 n`), so that every terminal
answers something — and waits at most 100 ms. Reporting is on only when the
answer lists `working`, `blocked`, `idle` and `error` among its `states=` (an
answer that lists none means the protocol's default five, which do). The
question is never asked again while the run lives. A headless `-m` run asks
too, and reports to the terminal even when its output goes to a file.

**No answer, no reporting.** A terminal that answers only the cursor position,
answers something else, or answers nothing in time — and a run with no
controlling terminal, or in a background process group — gets not one report
byte, and there is no fallback: no environment variable switches reporting on
without the answer. The tab keeps the plain terminal's progress bar.

**A host with its own channel is never asked.** Inside a herdr pane or a cmux
surface the state already goes to that host — herdr's socket, cmux's status
row — so the terminal is not asked at all. One consequence is accepted: a 7501
terminal started from a herdr pane or a cmux surface inherits that pane's
environment, and the state goes to the inherited pane, not to the terminal.

**One reporter per terminal.** Every command the chat runs and every MCP
stdio server is given `IOTA_STATUS_SESSION`, the run's session id (on Unix). An `iota`
started that way — an `iota -m` from the shell tool or from an MCP server —
finds its own session id equal to the one it inherited: it is on its parent's
terminal, so it does not ask and writes nothing, and the chat's record stays.
A worker started in a terminal of its own (a new pane is a new session) asks
as usual. Not prevented: a program the model runs that writes its own OSC 7501
straight to the terminal replaces the chat's state until the chat's next
change.

Which terminals answer:

| Terminal | Answer | |
|---|---|---|
| herdr-core (`hc` 0.1.21) | `ESC]7501;?:states=idle,working,done,blocked,error:kinds=permission,question,auth ESC\`, in 0.2 ms — reports | measured |
| rex | the same bytes as hc — reports | measured, 2026-11-21 |
| tmux 3.8, alone or inside an hc terminal | the cursor position alone — the progress bar | measured |
| Terminal.app, iTerm2, Ghostty outside hc, kitty, WezTerm, Alacritty, VS Code, Windows Terminal, the Linux console | expected: drop the query and answer the cursor position alone — the progress bar | expected, not measured |

To see what yours says:

```sh
stty raw -echo min 0 time 3; printf '\033]7501;?\033\\\033[6n'; dd bs=256 count=1 2>/dev/null | od -c; stty sane
```

Anything other than `ESC [ … R` (or the answer above) in the dump, or anything
left on the screen, is worth a report. The `<environment>` block and the
banner say nothing about the protocol: a plain terminal that answers is still
a plain terminal to the model.

## herdr-core (`hc`)

herdr-core, `hc`, is the terminal core behind herdr's desktop app — a product
of its own, not a new version of the herdr multiplexer below; iota supports
both. hc reads a program's state from the program's own output: an hc
terminal answers iota's start-up question, so the chat's state reaches it as
[program status](#program-status-osc-7501) — `working`, `blocked`, `idle`,
`error`, cleared on exit. So `hc get` and `hc wait` see where the chat is, and
`hc send` refuses to type into an open approval. What the herdr-core host adds
is hc's identity: the terminal id and the message envelope.

A message a sub-agent hands over as `<hc from="worker-2">…</hc>` shows only
its inner text in your block, with `hc from:worker-2` on a teal tab just above
it, and the block's bar is teal, where a block you typed keeps a gray one
(with `NO_COLOR` only the tab tells them apart). Only herdr-core's own `hc` element is treated this way, and only inside
herdr-core: XML you paste yourself, `<hc>` anywhere else included, is shown and
sent exactly as you typed it.

iota recognises hc by `HC_TERMINAL_ID` and the terminal's answer to that same
question, asked once for both: inside a tmux in an hc terminal the answer does
not come, the host is not hc, and the tab keeps the plain terminal's progress
bar. When the terminal cannot be asked at all, `HC_TERMINAL_ID` with a
`TERM_PROGRAM` other than `herdr` still names the host — the model reads
`host: herdr-core` and its terminal id — but nothing is reported. An hc
terminal started from a herdr pane reports to hc, not to that pane.

## herdr

[herdr](https://herdr.dev) organises terminals into workspaces, tabs and panes
and recognises the coding agent in each pane. For most agents it does so by
watching the screen. iota reports instead: inside a herdr pane — `HERDR_ENV=1`
plus the pane id and the socket path herdr injects — iota tells herdr what the
chat is doing over that socket, and herdr treats iota as the pane's lifecycle
authority from the first report on — which is sent as soon as the chat is ready,
so the pane shows `iota` before you type anything. In herdr's own terms:

| The chat | The pane's lifecycle |
|---|---|
| a turn is running, or a background job | `working` |
| the model needs you — an approval banner, an `ask` question, a [message from another program](./quick-start.md#messaging-a-running-chat) waiting for your yes, or any open picker or confirmation (`/model`, `/new`, `/export`…) | `blocked` |
| your move — from the moment the chat is ready for input, and after a failed turn too | `idle` |
| exits | released — herdr goes back to screen recognition for whatever runs next |

The agent name herdr shows is `iota`. Two more things go over the same socket:
the session the chat writes into (its id and bundle directory — at start-up,
after `/save`, after a `/session` switch), so herdr's session view lists it;
and, at exit, the release. A headless `iota run <agent> -m …` in a pane
reports too: `working` from the start, `idle` with the reply, released on exit.

What is deliberately *not* sent: the notification — herdr words its own from
the state it is given, and the pane's OSC 9 stays the terminal's — and a
`blocked` message; the pane itself shows what is being asked. The `blocked`
state is what `herdr agent wait --until blocked` and herdr's own notifications
key on.

Every request is one JSON line with a strictly increasing sequence number that
starts at the process start time, so a restarted iota in the same pane never
sends a number herdr has already seen. Requests are queued and sent by a
worker off the chat loop, each bounded to half a second; a failure is a debug
log line and nothing else. On a platform without Unix sockets the same
reports go through the `herdr` binary's `pane report-agent` command.

### What the chat's children inherit

herdr keeps one lifecycle authority per pane, and the hooks it installs for
other agents report into the pane they find in their environment whenever
`HERDR_ENV=1`. So inside a herdr pane, **the shell tool's commands and the MCP
stdio servers start without `HERDR_ENV`**: an agent the model runs from the
shell — `claude -p …`, say — leaves the pane to iota instead of claiming it,
which until v0.7.3 left the pane showing `working` with the chat idle until it
was closed. `HERDR_PANE_ID` and `HERDR_SOCKET_PATH` stay, so the `herdr`
command line works as before (`herdr pane split --current`), and a pane the
model opens with it gets its own herdr identity from herdr — an agent started
in a pane of its own reports there as it should. An MCP server whose `env:`
sets `HERDR_ENV` itself keeps it. The model is told this in its
[environment](./system-prompt.md#the-hosts-lines), so a `test "$HERDR_ENV" = 1`
that fails in its shell does not surprise it.

## cmux

[cmux](https://cmux.dev) is a macOS terminal with a sidebar. Inside one —
`CMUX_SURFACE_ID` set and the `cmux` command on `PATH` — the chat's state
becomes a sidebar status row keyed `iota` and the workspace's loading
indicator:

| The chat | The status row |
|---|---|
| a turn is running, or a background job | `Running`, blue, and the workspace loading indicator on |
| the model needs you | `Needs input`, a bell icon, the indicator off |
| the last turn failed | `Failed`, red |
| your move | `Idle`, grey |
| exits | the row cleared, the indicator off |

cmux is also asked for the workspace's background colour before the terminal
is. It does not take the notification either: the OSC 9 ping goes through the
terminal as everywhere else.

## Nesting

Hosts nest — herdr runs inside a cmux window — and a pane inherits its
environment from the process that spawned it, not from the surface you see it
in. A herdr pane carries the `CMUX_SURFACE_ID` the herdr *server* was started
with: right while the server's first window is the one you look at, stale or
another window's after that, and shared by every pane, so a status row set
through it would land on one row for all of them.

iota therefore talks to the innermost host only. Detection runs from the
inside out — herdr-core, then herdr, then cmux — and the first match is kept, with the plain
terminal behind it (and [program status](#program-status-osc-7501) in front of
the plain terminal, when the terminal answered and the host has no channel of
its own): a herdr pane inside a cmux window reports to herdr, never
runs a `cmux` command, and tells the model `host: herdr` alone. The plain
terminal still carries what the detected host does not — the ping, the
background answer — which is the per-capability split the host layer was
designed around.

## What the model is told

A detected host adds its lines to the end of the system prompt's
`<environment>` block: `host: herdr-core`, `hc terminal: t4`; `host: herdr`,
`herdr pane: w1:p2`, the workspace and tab when the pane has them;
`host: cmux`, `cmux surface: <id>`. The model can
then drive that host's own CLI from the `shell` tool — split a pane next to
the one it runs in, list the tab's panes, run a command in a sibling — with
the right ids. The lines, their order and their wording are in the
[system prompt reference](./system-prompt.md#the-hosts-lines).
