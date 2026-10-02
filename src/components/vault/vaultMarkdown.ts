import { defaultUrlTransform } from 'react-markdown';

// Wikilinks are handled by the reader's click handler. Keep its internal href
// while retaining react-markdown's default filtering for every other URL.
export const vaultUrlTransform = (url: string, key: string): string => (
  key === 'href' && url.startsWith('vault:') ? url : defaultUrlTransform(url)
);
