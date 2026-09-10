import React, {useCallback} from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import Heading from '@theme/Heading';
import styles from './styles.module.css';

// design/DESIGN.md §6 — "06 Pages / 404": a terminal-styled joke that also
// answers the most likely dead link, plus four recovery cards.

const RECOVERY = [
  {to: '/docs/install', title: 'Installation', note: 'brew, cargo, binaries'},
  {to: '/docs/config-file', title: 'Configuration', note: 'the three layers'},
  {to: '/docs/builtin-toolsets', title: 'Toolsets', note: 'shell, code, skills, ask'},
  {to: '/changelog', title: 'Changelog', note: 'what changed and when'},
];

export default function NotFoundContent({className}: {className?: string}): React.ReactElement {
  const focusSearch = useCallback((event: React.MouseEvent) => {
    const input = document.querySelector<HTMLInputElement>('.navbar__search-input');
    if (input) {
      event.preventDefault();
      input.focus();
    }
  }, []);

  return (
    <main className={clsx('container margin-vert--xl', styles.page, className)}>
      <p className={styles.code}>404</p>
      <Heading as="h1" className={styles.title}>
        No such file or directory
      </Heading>
      <p className={styles.lead}>
        The page you asked for is not on this host. It may have moved with the docs restructure, or
        the link may have been written from memory.
      </p>

      <div className={styles.terminal}>
        <div className={styles.termTitle}>
          <span className={styles.dotRed} />
          <span className={styles.dotAmber} />
          <span className={styles.dotGreen} />
          <span className={styles.termName}>iota</span>
        </div>
        <div className={styles.termBody}>
          <div className={styles.teal}>$ iota --help-me-find /docs/delegate-toolset</div>
          <div>&nbsp;</div>
          <div className={styles.amber}>{'⏺ grep  "delegate" docs/'}</div>
          <div className={styles.dim}>{'  └ 0 matches · retired in v0.1.0'}</div>
          <div>&nbsp;</div>
          <div>The delegate toolset was removed. A child agent is a</div>
          <div>bash subprocess now — see the shell toolset instead.</div>
          <div>&nbsp;</div>
          <div className={styles.teal}>›&nbsp;</div>
        </div>
      </div>

      <div className={styles.buttons}>
        <Link className="button button--primary" to="/">
          Back to the homepage
        </Link>
        <Link className={clsx('button', styles.secondary)} to="/docs" onClick={focusSearch}>
          Search the docs
        </Link>
      </div>

      <p className={styles.overline}>Where people usually meant to go</p>
      <div className={styles.recovery}>
        {RECOVERY.map(({to, title, note}) => (
          <Link className={styles.card} to={to} key={to}>
            <span className={styles.cardTitle}>{title}</span>
            <span className={styles.cardNote}>{note}</span>
          </Link>
        ))}
      </div>
    </main>
  );
}
