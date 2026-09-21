---
id: install
title: Installation
description: A curl one-liner, Homebrew, a PowerShell one-liner, cargo, or a build from source. macOS, Linux and Windows.
sidebar_label: Installation
---

# Installation

iota is a single binary. Pick whichever of the routes below you already have a
package manager for — the first three download a prebuilt binary, the last two
build it.

## Shell

```bash
curl -fsSL https://iota.sh/install.sh | sh
```

`iota.sh/install.sh` is the shell installer of the latest release — the same
`iota-installer.sh` that sits beside the archives on the GitHub release, served
from this domain so the line stays short and never names a version. It fetches
the prebuilt binary for your platform, verifies its checksum and puts it in
`~/.cargo/bin` (or `$CARGO_HOME/bin`), adding that directory to your `PATH` if
it is not there already. No Rust toolchain needed. To read it before running it:

```bash
curl -fsSL https://iota.sh/install.sh
```

## Homebrew

```bash
brew install iotash/tap/iota
```

## PowerShell (Windows)

```powershell
powershell -ExecutionPolicy Bypass -c "irm https://iota.sh/install.ps1 | iex"
```

The same thing for Windows — `iota.sh/install.ps1` is the latest release's `iota-installer.ps1`: it fetches `iota-x86_64-pc-windows-msvc.zip`, checks
its SHA-256 and puts `iota.exe` in `%USERPROFILE%\.cargo\bin` (or
`%CARGO_HOME%\bin`), adding that directory to your `PATH` if it is not there
already. No Rust toolchain needed.

:::warning

**The Windows binaries are not code-signed.** Authenticode signing needs a
certificate bought from a signing service, and iota does not have one — so
`iota.exe` ships unsigned. Your browser may flag the download, and SmartScreen
may warn the first time you run it. What you *can* check is that the file is the
one the release published: every asset comes with a `.sha256` beside it, and the
release also carries a combined `sha256.sum`.

```powershell
Get-FileHash .\iota-x86_64-pc-windows-msvc.zip -Algorithm SHA256
```

Compare that against the published `iota-x86_64-pc-windows-msvc.zip.sha256`. The
PowerShell installer above already does this check for you — the warning is
about provenance, not integrity.

The macOS binaries are signed (ad-hoc, by the linker) and a release is blocked
if that signature does not verify. Linux binaries carry no signature either;
ELF has nowhere to put one.

:::

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
`aarch64-apple-darwin`, `x86_64-apple-darwin`, `aarch64-unknown-linux-gnu`,
`x86_64-unknown-linux-gnu` and `x86_64-pc-windows-msvc` binaries. ARM Windows
(`aarch64-pc-windows-msvc`) is not a release target and nothing tests it, so
there it means building from source.

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

iota runs agents, and an agent lives in the config file — and a first run
writes that file for you:

```bash
export OPENAI_API_KEY=…   # or put `key:` in the file afterwards
iota                      # writes ~/.iota.yaml (one provider, one model, agents.default) and runs it
```

With no `.iota.yaml` in your home or the project, a run writes the starter
config, says so on stderr, and goes on with it. `iota config check` tells you
whether the file says what you think it says, and `iota config path` which
files a run actually reads. `iota config init` writes the same starter without
running anything, and refuses to overwrite an existing config.

From there, [your first run](./quick-start.md) has the commands and the flags,
and [the config file](./config-file.md) has the three layers you will edit.
