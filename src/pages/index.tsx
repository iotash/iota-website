import React, {useCallback, useState} from 'react';
import Link from '@docusaurus/Link';
import LayoutProvider from '@theme/Layout/Provider';
import {PageMetadata} from '@docusaurus/theme-common';
import Wordmark from '@site/src/components/Wordmark';
import {Check, Copy, Minus} from '@site/src/components/Icons';
import styles from './index.module.css';

// The homepage is deliberately outside the theme's Layout: it has its own
// 56 px top bar and footer and shows neither the docs navbar nor the site
// footer (design/DESIGN.md §6, §8.5). LayoutProvider still gives it colour
// mode, so the page follows the system theme.

// Homebrew leads, as the design puts it (design/DESIGN.md §7): the tap is
// iotash/homebrew-tap and a release writes Formula/iota.rb into it.
const INSTALL_COMMAND = 'brew install iotash/tap/iota';
const ALT_INSTALL_COMMAND = 'cargo install --git https://github.com/iotash/iota';

const DOES = [
  'run an agent you named in the config — its model, its prompt, its tools',
  'call MCP tools, and run bash inside an OS sandbox (macOS and Linux)',
  'stream a reply, and let you keep typing while it arrives',
  'render markdown, tables and math as ANSI, inline',
  'save every session as plain text you can resume, grep or delete',
];

const DOES_NOT = [
  'run before you configure an agent — iota config init writes the first one',
  'run a daemon or a server, or leave anything running after you quit',
  'ask you to sign in, or phone home',
  'write outside the project root unless you say so',
  'wrap the model in a framework you have to learn first',
];

const LINKS: {to: string; label: string; note: string}[] = [
  {
    to: '/docs',
    label: 'Read the documentation',
    note: 'install, configure, and the three layers of ~/.iota.yaml',
  },
  {
    to: 'https://github.com/iotash/iota',
    label: 'Source on GitHub',
    note: 'MIT, ~70k lines of Rust, issues welcome',
  },
  {
    to: '/changelog',
    label: 'Changelog',
    note: 'what changed, and what it breaks',
  },
];

function InstallBox() {
  const [copied, setCopied] = useState(false);
  const copy = useCallback(() => {
    navigator.clipboard?.writeText(INSTALL_COMMAND).then(() => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    });
  }, []);

  return (
    <div className={styles.install}>
      <span className={styles.prompt}>$</span>
      <code className={styles.command}>{INSTALL_COMMAND}</code>
      <button
        type="button"
        className={styles.copy}
        onClick={copy}
        aria-label="Copy the install command">
        <Copy size={13} />
        {copied ? 'copied' : 'copy'}
      </button>
    </div>
  );
}

function Terminal() {
  return (
    <div className={styles.terminal}>
      <div className={styles.termTitle}>
        <span>~/work/iota</span>
        <span>claude-sonnet-4</span>
      </div>
      <div className={styles.termBody}>
        <div className={styles.termLine}>
          <span className={styles.dim}>$ </span>iota run coder
        </div>
        <div className={styles.termLine}>
          <span className={styles.green}>✓ </span>
          <span className={styles.dim}>AGENTS.md · 3 skills · 2 mcp servers · sandbox on</span>
        </div>
        <div className={styles.termGap} />
        <div className={styles.termLine}>
          <span className={styles.caretMark}>› </span>why does the resume test hang on linux?
        </div>
        <div className={styles.termGap} />
        <div className={styles.termLine}>
          <span className={styles.amber}>⏺ </span>
          <span className={styles.amberBold}>bash</span>
          <span className={styles.dim}>{'  cargo test --test session resume'}</span>
        </div>
        <div className={styles.termLine}>
          <span className={styles.faint}>{'  └ '}</span>
          <span className={styles.dim}>hung after 60s · exit 101</span>
        </div>
        <div className={styles.termGap} />
        <div className={styles.termLine}>The child keeps the write end of the pipe open.</div>
        <div className={styles.termLine}>
          <span className={styles.teal}>session::writer</span> drops its handle only after the
        </div>
        <div className={styles.termLine}>
          bundle flushes, so <span className={styles.teal}>read_to_end</span> never returns.
        </div>
        <div className={styles.termGapSm} />
        <pre className={styles.termCode}>
          <span>let (rx, tx) = pipe()?;</span>
          <span className={styles.green}>drop(tx);{'  '}// ← before the await</span>
        </pre>
        <div className={styles.termGap} />
        <div className={styles.termLine}>
          <span className={styles.caretMark}>› </span>
          <span className={styles.caret} />
        </div>
      </div>
      <div className={styles.termStatus}>
        <span className={styles.teal}>⠹ thinking</span>
        <span>24.3k / 200k</span>
      </div>
    </div>
  );
}

export default function Home(): React.ReactElement {
  return (
    <LayoutProvider>
      <PageMetadata
        title="iota — the smallest thing between your terminal and a model"
        description="iota is an agent CLI written in Rust. You configure agents — a model, a prompt, a set of tools — and run them: iota run <agent>."
      />
      <div className={styles.page}>
        <header className={styles.topbar}>
          <Link to="/" className={styles.topbarLogo} aria-label="iota">
            <Wordmark height={16} />
          </Link>
          <nav className={styles.topbarLinks}>
            <Link to="/docs">docs</Link>
            <Link to="/docs/install">install</Link>
            <Link to="https://github.com/iotash/iota">source</Link>
          </nav>
        </header>

        <main className={styles.column}>
          <h1 className={styles.headline}>
            The smallest thing between your terminal and a model.
          </h1>
          <p className={styles.lead}>
            iota is an agent CLI written in Rust. You configure agents — a model, a prompt, a set
            of tools — and run them: iota run &lt;agent&gt;.
          </p>

          <InstallBox />
          <p className={styles.alt}>
            <span>or</span>
            <code>{ALT_INSTALL_COMMAND}</code>
          </p>
          {/* The platform fact is the one place the homepage mentions Windows: the
              install box stays two commands (design/DESIGN.md §7), and the third
              one — the PowerShell line — lives in the docs behind this link. */}
          <p className={styles.facts}>
            v0.2.1&nbsp; · &nbsp;7.72 MiB&nbsp; · &nbsp;MIT&nbsp; · &nbsp;macOS, Linux and{' '}
            <Link className={styles.factLink} to="/docs/install">
              Windows
            </Link>
          </p>

          <Terminal />
          <p className={styles.caption}>
            An actual session — agent mode, one bash call, one answer. No cuts.
          </p>

          <h2 className={styles.sectionMark}># why it is small</h2>
          <p className={styles.philosophy}>
            The terminal is already an interface: it has scrollback, a clipboard, pipes and a
            shell. We did not want to rebuild any of that in a window, so iota adds the one thing
            the terminal is missing — a model that can use your tools — and stops there. Nothing it
            does is hidden from you: a session is a directory holding meta.json and messages.jsonl,
            one JSON record per line, appended as you talk, and /debug shows the exact request and
            response bodies that went over the wire. The config is one YAML file with three maps in
            it. There is no account, no daemon and no telemetry. And there is nothing to be locked
            into — any endpoint that speaks OpenAI, Anthropic or Gemini works, including one you run
            yourself, and a child agent is just iota run &lt;agent&gt; -m &quot;&lt;task&gt;&quot;
            run from bash, like anything else.
          </p>

          <h2 className={styles.sectionMarkTight}># what it is, and is not</h2>
          <div className={styles.lists}>
            <div className={styles.list}>
              <p className={styles.listHeadDoes}>it does</p>
              {DOES.map((item) => (
                <p className={styles.item} key={item}>
                  <Check size={14} className={styles.iconDoes} />
                  <span>{item}</span>
                </p>
              ))}
            </div>
            <div className={styles.list}>
              <p className={styles.listHeadNot}>it does not</p>
              {DOES_NOT.map((item) => (
                <p className={styles.item} key={item}>
                  <Minus size={14} className={styles.iconNot} />
                  <span>{item}</span>
                </p>
              ))}
            </div>
          </div>

          <div className={styles.links}>
            {LINKS.map(({to, label, note}) => (
              <p className={styles.linkRow} key={label}>
                <span className={styles.arrow}>→</span>
                <Link to={to}>{label}</Link>
                <span className={styles.linkNote}>{note}</span>
              </p>
            ))}
          </div>
        </main>

        <footer className={styles.footer}>
          <span>MIT licensed · joyqi</span>
          <span>iota.sh</span>
        </footer>
      </div>
    </LayoutProvider>
  );
}
