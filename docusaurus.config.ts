import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';
import {themes as prismThemes} from 'prism-react-renderer';

// Code block grounds follow design/DESIGN.md §2 (code-bg light / dark).
const codeThemeLight = {
  ...prismThemes.github,
  plain: {...prismThemes.github.plain, backgroundColor: '#F1F4F7', color: '#0F1720'},
};
const codeThemeDark = {
  ...prismThemes.vsDark,
  plain: {...prismThemes.vsDark.plain, backgroundColor: '#151C25', color: '#E6EAEF'},
};

const config: Config = {
  title: 'iota',
  tagline: 'The smallest thing between your terminal and a model.',
  favicon: 'img/favicon.svg',

  url: 'https://iota.sh',
  baseUrl: '/',
  trailingSlash: false,

  organizationName: 'iotash',
  projectName: 'iota-website',

  onBrokenLinks: 'throw',
  onBrokenAnchors: 'throw',

  markdown: {
    // `.md` is CommonMark, `.mdx` is MDX — so prose lifted from the README can
    // contain angle brackets and braces without being read as JSX.
    format: 'detect',
    hooks: {
      onBrokenMarkdownLinks: 'throw',
      onBrokenMarkdownImages: 'throw',
    },
  },

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  headTags: [
    {tagName: 'link', attributes: {rel: 'icon', href: '/img/favicon-32.png', sizes: '32x32'}},
    {tagName: 'link', attributes: {rel: 'icon', href: '/img/favicon-16.png', sizes: '16x16'}},
    {tagName: 'link', attributes: {rel: 'apple-touch-icon', href: '/img/favicon-180.png'}},
  ],

  presets: [
    [
      'classic',
      {
        docs: {
          path: 'docs',
          routeBasePath: 'docs',
          sidebarPath: './sidebars.ts',
          editUrl: undefined,
          breadcrumbs: true,
          showLastUpdateTime: false,
        },
        blog: {
          // The blog plugin, configured as a changelog: one post per release.
          path: 'changelog',
          routeBasePath: 'changelog',
          blogTitle: 'Changelog',
          blogDescription: 'Every tagged release, what changed, and what it breaks.',
          blogSidebarTitle: 'Releases',
          blogSidebarCount: 'ALL',
          showReadingTime: false,
          postsPerPage: 20,
          onInlineAuthors: 'ignore',
          onUntruncatedBlogPosts: 'ignore',
          feedOptions: {
            type: ['rss', 'atom'],
            title: 'iota changelog',
            description: 'Every tagged release, what changed, and what it breaks.',
            xslt: true,
          },
        },
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  plugins: [
    [
      '@easyops-cn/docusaurus-search-local',
      {
        hashed: true,
        indexBlog: true,
        docsDir: 'docs',
        blogDir: 'changelog',
        docsRouteBasePath: '/docs',
        blogRouteBasePath: '/changelog',
        highlightSearchTermsOnTargetPage: true,
        searchResultLimits: 8,
      },
    ],
  ],

  themeConfig: {
    image: 'img/og.png',
    metadata: [
      {
        name: 'description',
        content:
          'iota is an agent CLI written in Rust. You configure agents — a model, a prompt, a set of tools — and run them: iota run <agent>.',
      },
    ],
    colorMode: {
      defaultMode: 'light',
      disableSwitch: false,
      respectPrefersColorScheme: true,
    },
    navbar: {
      title: undefined,
      logo: {
        alt: 'iota',
        src: 'img/wordmark-teal-light.svg',
        srcDark: 'img/wordmark-teal-dark.svg',
        width: 84,
        height: 18,
      },
      items: [
        {to: '/docs', label: 'Docs', position: 'left'},
        {to: '/changelog', label: 'Changelog', position: 'left'},
        {
          href: 'https://github.com/iotash/iota',
          position: 'right',
          className: 'navbar__item--github',
          'aria-label': 'Source on GitHub',
        },
      ],
    },
    footer: {
      style: 'light',
      links: [],
      copyright:
        '<span class="footer__note">MIT licensed</span><span class="footer__host">iota.sh</span>',
    },
    docs: {
      sidebar: {hideable: false, autoCollapseCategories: false},
    },
    tableOfContents: {minHeadingLevel: 2, maxHeadingLevel: 3},
    prism: {
      theme: codeThemeLight,
      darkTheme: codeThemeDark,
      additionalLanguages: ['bash', 'yaml', 'toml', 'json', 'rust', 'diff'],
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
