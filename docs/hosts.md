---
id: hosts
title: Terminal hosts
description: What iota tells the terminal it runs in — the plain terminal's progress and notification sequences, herdr's pane lifecycle, cmux's status row — and what the host tells the model back.
sidebar_label: Terminal hosts
---

# Terminal hosts

A chat has a state — a turn is running, the model needs you, it is your move,
the last turn failed — and iota tells the terminal it runs in about it, so the
tab, the pane or the sidebar shows what the chat is doing while you look
elsewhere. Nothing here is configured: the host is recognised from the
environment it injects, and a plain terminal gets the plain-terminal treatment.
The one knob is `notify` on the agent, which gates the attention ping only.

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
| a turn is running | OSC 9;4 with state 3 | an indeterminate progress indicator on the tab |
| the model needs you (an approval, a question) | OSC 9;4 with state 4 at 100 | a warning-coloured, full bar |
| the last turn failed | OSC 9;4 with state 2 at 100 | an error-coloured, full bar |
| your move | OSC 9;4 with state 0 | nothing |

And the attention ping: when the model needs you, or a turn ends while the
terminal is not focused, one OSC 9 notification carries a short line: which
tool wants to modify files, the failed turn's headline, or the reply's first
words. It is silent while the terminal is
focused — whoever is already watching needs no bell — and `notify: false` on
the agent silences it entirely. The progress indicator is not gated: it is
what the tab looks like, not an interruption.

The terminal's background colour is also asked once, at start-up (OSC 11), to
pick the light or dark palette. A multiplexer that draws its own panes answers
this itself — herdr does — so the answer describes what you actually see.

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
| a turn is running | `working` |
| the model needs you — an approval banner, an `ask` question | `blocked` |
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

## cmux

[cmux](https://cmux.dev) is a macOS terminal with a sidebar. Inside one —
`CMUX_SURFACE_ID` set and the `cmux` command on `PATH` — the chat's state
becomes a sidebar status row keyed `iota` and the workspace's loading
indicator:

| The chat | The status row |
|---|---|
| a turn is running | `Running`, blue, and the workspace loading indicator on |
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
inside out — herdr, then cmux — and the first match is kept, with the plain
terminal behind it: a herdr pane inside a cmux window reports to herdr, never
runs a `cmux` command, and tells the model `host: herdr` alone. The plain
terminal still carries what the detected host does not — the ping, the
background answer — which is the per-capability split the host layer was
designed around.

## What the model is told

A detected host adds its lines to the end of the system prompt's
`<environment>` block: `host: herdr`, `herdr pane: w1:p2`, the workspace and
tab when the pane has them; `host: cmux`, `cmux surface: <id>`. The model can
then drive that host's own CLI from the `shell` tool — split a pane next to
the one it runs in, list the tab's panes, run a command in a sibling — with
the right ids. The lines, their order and their wording are in the
[system prompt reference](./system-prompt.md#the-hosts-lines).
