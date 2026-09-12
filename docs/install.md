---
id: install
title: Installation
description: Homebrew, a curl one-liner, cargo, or a build from source. macOS and Linux.
sidebar_label: Installation
---

# Installation

iota is a single binary. Pick whichever of the routes below you already have a
package manager for — the first two download a prebuilt binary, the last two
build it.

## Homebrew

```bash
brew install iotash/tap/iota
```

## Shell

```bash
curl --proto '=https' --tlsv1.2 -LsSf https://github.com/iotash/iota/releases/latest/download/iota-installer.sh | sh
```

Fetches the prebuilt binary for your platform from the latest release, verifies
its checksum and puts it in `~/.cargo/bin` (or `$CARGO_HOME/bin`), adding that
directory to your `PATH` if it is not there already. No Rust toolchain needed.

## Cargo

```bash
cargo install --git https://github.com/iotash/iota
```

Requires Rust 1.98 or newer.

## Build from source

```bash
git clone https://github.com/iotash/iota.git
cd iota
cargo build --release
```

The binary is at `target/release/iota`. The toolchain is pinned by
`rust-toolchain.toml`, which `rustup` picks up automatically; building with
another toolchain needs Rust 1.98 or newer.

## Platforms

macOS, Linux and Windows, Apple Silicon and x86-64 alike. Every release carries
`aarch64-apple-darwin`, `x86_64-apple-darwin`, `aarch64-unknown-linux-gnu` and
`x86_64-unknown-linux-gnu` binaries; Windows builds and is tested in CI but has
no release binary yet, so there it means building from source for now.

Two things differ on Windows, both about the `shell` toolset:

- **It runs the shell the machine has** — iota embeds no interpreter. The first
  of these wins: `IOTA_SHELL`; **Git Bash** (`IOTA_GIT_BASH_PATH`, else the
  `bin\bash.exe` of the Git installation that owns the `git.exe` on your
  `PATH`, else the default install locations); **PowerShell** (`pwsh.exe`, then
  `powershell.exe`); and finally **`cmd.exe`**. The `shell` tool's description
  names the winner in its first sentence and teaches that shell's dialect, so a
  machine with Git for Windows behaves like Unix and one without it gets
  PowerShell instructions instead of POSIX ones.
- **There is no OS sandbox.** Seatbelt and bubblewrap have no Windows
  equivalent iota is willing to ship, so commands run with your full
  permissions and every call asks for confirmation unless `auto_run: true`
  waives it.

Everything else is the same everywhere: reading, writing and editing files,
skills, MCP servers, the whole TUI. WSL remains a fine way to get the Unix
behaviour exactly.

## First run

iota runs agents, and an agent lives in the config file — so the first thing to
do after installing is write one. `iota config init` does it for you:

```bash
iota config init          # writes ~/.iota.yaml with one provider, one model and agents.default
export OPENAI_API_KEY=…   # or put `key:` in the file
iota                      # runs agents.default
```

`iota config check` tells you whether the file says what you think it says, and
`iota config path` which files a run actually reads. `init` refuses to
overwrite an existing config.

From there, [your first run](./quick-start.md) has the commands and the flags,
and [the config file](./config-file.md) has the three layers you will edit.
