import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  docs: [
    'index',
    {
      type: 'category',
      label: 'Getting started',
      collapsed: false,
      items: ['install', 'quick-start'],
    },
    {
      type: 'category',
      label: 'Configuration',
      collapsed: false,
      items: ['config-file', 'image-generation'],
    },
    {
      type: 'category',
      label: 'Tools',
      collapsed: false,
      items: ['builtin-toolsets', 'mcp'],
    },
    'agent-mode',
    'slash-commands',
    'examples',
  ],
};

export default sidebars;
