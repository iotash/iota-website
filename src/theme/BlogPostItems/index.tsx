import React from 'react';
import BlogPostItems from '@theme-original/BlogPostItems';
import type BlogPostItemsType from '@theme/BlogPostItems';
import type {WrapperProps} from '@docusaurus/types';
import {useLocation} from '@docusaurus/router';
import styles from './styles.module.css';

type Props = WrapperProps<typeof BlogPostItemsType>;

// design/DESIGN.md §6, "Changelog List": the list page opens with an eyebrow,
// the page title and one line saying what the list is.
export default function BlogPostItemsWrapper(props: Props): React.ReactElement {
  const {pathname} = useLocation();
  const isChangelogRoot = pathname.replace(/\/$/, '') === '/changelog';

  return (
    <>
      {isChangelogRoot && (
        <header className={styles.header}>
          <p className={styles.eyebrow}>Releases</p>
          <h1 className={styles.title}>Changelog</h1>
          <p className={styles.lead}>
            Every tagged release, what changed, and what it breaks. Subscribe via RSS or watch the
            repo.
          </p>
        </header>
      )}
      <BlogPostItems {...props} />
    </>
  );
}
