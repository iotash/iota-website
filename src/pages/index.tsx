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

// The install box is a tab strip over one command line (design/DESIGN.md §7): the
// curl one-liner leads — https://iota.sh/install.sh serves the latest release's
// installer — and Homebrew, PowerShell and cargo are one click away. Each entry
// is the whole command, with the prompt character the shell would show.
const INSTALLS: {id: string; label: string; prompt: string; command: string}[] = [
  {id: 'curl', label: 'curl', prompt: '$', command: 'curl -fsSL https://iota.sh/install.sh | sh'},
  {id: 'brew', label: 'Homebrew', prompt: '$', command: 'brew install iotash/tap/iota'},
  {
    id: 'powershell',
    label: 'PowerShell',
    prompt: '>',
    command: 'powershell -ExecutionPolicy Bypass -c "irm https://iota.sh/install.ps1 | iex"',
  },
  {id: 'cargo', label: 'cargo', prompt: '$', command: 'cargo install --git https://github.com/iotash/iota'},
];

const DOES = [
  'run an agent you named in one YAML file — its model, its prompt, its tools',
  'talk to OpenAI, Anthropic, Gemini, or any endpoint that speaks their APIs — yours included',
  'run bash under an OS sandbox, edit code, call MCP tools — and ask before it writes',
  'stream a reply while you keep typing; render markdown, tables and math inline',
  'save every session as plain files you can resume, grep or export',
  'run child agents from bash: iota run <agent> -m "<task>"',
];

const DOES_NOT = [
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
  const [active, setActive] = useState(0);
  const [copied, setCopied] = useState(false);
  const current = INSTALLS[active];
  const copy = useCallback(() => {
    navigator.clipboard?.writeText(current.command).then(() => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    });
  }, [current.command]);
  const onKey = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      e.preventDefault();
      const step = e.key === 'ArrowRight' ? 1 : INSTALLS.length - 1;
      setActive((i) => (i + step) % INSTALLS.length);
      setCopied(false);
    },
    [],
  );

  return (
    <div className={styles.installBox}>
      <div className={styles.tabs} role="tablist" aria-label="Install with" onKeyDown={onKey}>
        {INSTALLS.map((entry, i) => (
          <button
            key={entry.id}
            type="button"
            role="tab"
            id={`install-tab-${entry.id}`}
            aria-selected={i === active}
            aria-controls="install-command"
            tabIndex={i === active ? 0 : -1}
            className={i === active ? styles.tabActive : styles.tab}
            onClick={() => {
              setActive(i);
              setCopied(false);
            }}>
            {entry.label}
          </button>
        ))}
      </div>
      <div
        className={styles.install}
        id="install-command"
        role="tabpanel"
        aria-labelledby={`install-tab-${current.id}`}>
        <span className={styles.prompt}>{current.prompt}</span>
        <code className={styles.command}>{current.command}</code>
        <button
          type="button"
          className={styles.copy}
          onClick={copy}
          aria-label={`Copy the ${current.label} install command`}>
          <Copy size={13} />
          {copied ? 'copied' : 'copy'}
        </button>
      </div>
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
          {/* The platform fact is the one place the homepage names Windows; the
              PowerShell line itself is a tab in the box above (design/DESIGN.md §7). */}
          <p className={styles.facts}>
            v0.4.0&nbsp; · &nbsp;MIT&nbsp; · &nbsp;macOS, Linux and{' '}
            <Link className={styles.factLink} to="/docs/install">
              Windows
            </Link>
          </p>

          <Terminal />
          <p className={styles.caption}>
            An actual session — agent mode, one bash call, one answer. No cuts.
          </p>

          <h2 className={styles.sectionMark}># what it does</h2>
          <div className={styles.list}>
            {DOES.map((item) => (
              <p className={styles.item} key={item}>
                <Check size={14} className={styles.iconDoes} />
                <span>{item}</span>
              </p>
            ))}
          </div>

          <h2 className={styles.sectionMarkTight}># what it does not</h2>
          <div className={styles.list}>
            {DOES_NOT.map((item) => (
              <p className={styles.item} key={item}>
                <Minus size={14} className={styles.iconNot} />
                <span>{item}</span>
              </p>
            ))}
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
          <span>MIT licensed</span>
          <span>iota.sh</span>
        </footer>
      </div>
    </LayoutProvider>
  );
}
