import { describe, it, expect } from 'vitest';
import {
  searchTiles,
  getSearchEngineFromBang,
  stripBangs,
  findUrlForSearchEngine,
  isUrlLike,
} from '@/utils/Search';

const tile = (over = {}) => ({
  title: 'Plex',
  description: 'Media server',
  provider: 'Plex Inc',
  url: 'https://plex.lab:32400',
  tags: ['media', 'streaming'],
  ...over,
});

describe('Search - searchTiles', () => {
  it('returns the input array for an empty or nullish term', () => {
    const tiles = [tile(), tile({ title: 'Jellyfin' })];
    expect(searchTiles(tiles, '')).toBe(tiles);
    expect(searchTiles(tiles, undefined)).toBe(tiles);
    expect(searchTiles(tiles, null)).toBe(tiles);
  });

  it('returns the input array for a whitespace-only term', () => {
    const tiles = [tile()];
    expect(searchTiles(tiles, '   ')).toBe(tiles);
    expect(searchTiles(tiles, '\t\n')).toBe(tiles);
  });

  it('returns an empty array when allTiles is missing', () => {
    expect(searchTiles(null, 'plex')).toEqual([]);
    expect(searchTiles(undefined, 'plex')).toEqual([]);
  });

  it('matches title case-insensitively', () => {
    expect(searchTiles([tile()], 'PLEX')).toHaveLength(1);
    expect(searchTiles([tile()], 'plex')).toHaveLength(1);
  });

  it('matches description', () => {
    expect(searchTiles([tile()], 'media server')).toHaveLength(1);
  });

  it('matches provider', () => {
    expect(searchTiles([tile()], 'inc')).toHaveLength(1);
  });

  it('matches tags supplied as an array', () => {
    expect(searchTiles([tile()], 'streaming')).toHaveLength(1);
  });

  it('matches tags supplied as a comma-separated string', () => {
    const t = tile({ tags: 'docker, primary' });
    expect(searchTiles([t], 'docker')).toHaveLength(1);
    expect(searchTiles([t], 'primary')).toHaveLength(1);
  });

  it('matches an item by its url alias', () => {
    const t = tile({
      title: 'Jellyfin', description: '', provider: '', url: 'https://media.lab', tags: [], alias: 'watchstuff',
    });
    expect(searchTiles([t], 'watchstuff')).toHaveLength(1);
    expect(searchTiles([t], 'WATCHSTUFF')).toHaveLength(1);
    expect(searchTiles([t], 'watchstuff media')).toHaveLength(1);
    expect(searchTiles([{ ...t, alias: undefined }], 'watchstuff')).toHaveLength(0);
  });

  it('matches across multiple fields when the query has several words', () => {
    const t = tile({ title: 'Plex', description: 'Media server', tags: [] });
    expect(searchTiles([t], 'plex media')).toHaveLength(1);
    expect(searchTiles([t], 'media plex')).toHaveLength(1);
  });

  it('requires every word to appear somewhere', () => {
    expect(searchTiles([tile()], 'plex kubernetes')).toEqual([]);
  });

  it('returns an empty array when nothing matches', () => {
    expect(searchTiles([tile()], 'kubernetes')).toEqual([]);
  });

  it('strips punctuation from the query', () => {
    expect(searchTiles([tile()], 'plex.lab')).toHaveLength(1);
    expect(searchTiles([tile()], 'plex,lab')).toHaveLength(1);
  });

  it('searches the URL hostname', () => {
    expect(searchTiles([tile()], 'plex.lab')).toHaveLength(1);
  });

  it('searches the URL port (regression)', () => {
    expect(searchTiles([tile()], '32400')).toHaveLength(1);
  });

  it('searches the URL path (regression)', () => {
    const t = tile({ url: 'https://router.lab/admin' });
    expect(searchTiles([t], 'admin')).toHaveLength(1);
  });

  it('does not match on the URL scheme', () => {
    const t = tile({ subItems: [{ title: 'Sub', url: 'http://sub.lab' }] });
    expect(searchTiles([t], 'http')).toEqual([]);
  });

  it('tolerates tiles with missing optional fields', () => {
    const t = { title: 'Plex' };
    expect(searchTiles([t], 'plex')).toHaveLength(1);
    expect(searchTiles([t], 'media')).toEqual([]);
  });

  it('filters a mixed list to only the matching tiles', () => {
    const a = tile({ title: 'Plex' });
    const b = tile({ title: 'Jellyfin' });
    const c = tile({ title: 'Sonarr' });
    expect(searchTiles([a, b, c], 'jelly')).toEqual([b]);
  });

  it('preserves tile object identity in the result', () => {
    const t = tile();
    expect(searchTiles([t], 'plex')[0]).toBe(t);
  });

  it('is stable when called repeatedly with the same tile (cache safe)', () => {
    const t = tile();
    expect(searchTiles([t], 'plex')).toHaveLength(1);
    expect(searchTiles([t], 'plex')).toHaveLength(1);
    expect(searchTiles([t], 'kubernetes')).toEqual([]);
  });

  // sub-item searchability: parent surfaces when a child matches
  it('matches a parent tile via its sub-items title or url', () => {
    const t = tile({
      title: 'Arr Stack',
      subItems: [
        { title: 'Sonarr', url: 'https://sonarr.lab' },
        { title: 'Radarr', url: 'https://radarr.lab' },
      ],
    });
    expect(searchTiles([t], 'sonarr')).toHaveLength(1);
    expect(searchTiles([t], 'radarr.lab')).toHaveLength(1);
  });

  // section-name searchability via the extraHaystack argument
  it('matches every tile when the query matches the extra haystack alone', () => {
    const a = tile({ title: 'Pi-hole' });
    const b = tile({ title: 'AdGuard' });
    const result = searchTiles([a, b], 'networking', 'Networking & VPN');
    expect(result).toHaveLength(2);
  });

  it('combines tile and extra haystacks for multi-word queries', () => {
    const a = tile({ title: 'Pi-hole' });
    const b = tile({ title: 'AdGuard' });
    expect(searchTiles([a, b], 'networking pi', 'Networking & VPN')).toEqual([a]);
  });
});

describe('Search - getSearchEngineFromBang', () => {
  const bangs = {
    '/b': 'bbc',
    '/g': 'google',
    '/w': 'wikipedia',
    '/y': 'youtube',
    '/gh': 'github',
    '/so': 'stackoverflow',
    '/wa': 'wolframalpha',
  };

  it('resolves a single-char bang', () => {
    expect(getSearchEngineFromBang('/g hello', bangs)).toBe('google');
    expect(getSearchEngineFromBang('/y kittens', bangs)).toBe('youtube');
  });

  // regression: longest bang wins so /gh isn't shadowed by /g
  it('prefers the longest matching bang', () => {
    expect(getSearchEngineFromBang('/gh react', bangs)).toBe('github');
    expect(getSearchEngineFromBang('/wa pi', bangs)).toBe('wolframalpha');
    expect(getSearchEngineFromBang('/so vue', bangs)).toBe('stackoverflow');
  });

  it('matches a bang in the middle of a query', () => {
    expect(getSearchEngineFromBang('foo /b news', bangs)).toBe('bbc');
  });

  it('matches a bang at the end of a query', () => {
    expect(getSearchEngineFromBang('news today /b', bangs)).toBe('bbc');
  });

  it('matches a bare bang on its own', () => {
    expect(getSearchEngineFromBang('/gh', bangs)).toBe('github');
  });

  it('does not match a bang embedded inside another word', () => {
    expect(getSearchEngineFromBang('foo/b bar', bangs)).toBeUndefined();
    expect(getSearchEngineFromBang('a/g/b', bangs)).toBeUndefined();
  });

  it('returns undefined when no bang is present', () => {
    expect(getSearchEngineFromBang('just searching', bangs)).toBeUndefined();
  });

  it('handles an empty or missing bang list', () => {
    expect(getSearchEngineFromBang('/g hello', {})).toBeUndefined();
    expect(getSearchEngineFromBang('/g hello', null)).toBeUndefined();
    expect(getSearchEngineFromBang('/g hello', undefined)).toBeUndefined();
  });
});

describe('Search - stripBangs', () => {
  const bangs = {
    '/b': 'bbc',
    '/g': 'google',
    '/w': 'wikipedia',
    '/gh': 'github',
    '/wa': 'wolframalpha',
  };

  it('strips a leading bang and trims', () => {
    expect(stripBangs('/g hello world', bangs)).toBe('hello world');
  });

  it('strips a trailing bang and trims', () => {
    expect(stripBangs('hello world /g', bangs)).toBe('hello world');
  });

  it('strips a mid-query bang and collapses whitespace', () => {
    expect(stripBangs('foo /b bar', bangs)).toBe('foo bar');
  });

  // regression: stripping /gh used to leave "h foo" behind
  it('strips the longest matching bang cleanly', () => {
    expect(stripBangs('/gh react hooks', bangs)).toBe('react hooks');
    expect(stripBangs('/wa pi to 50 digits', bangs)).toBe('pi to 50 digits');
  });

  it('does not strip a bang embedded inside another word', () => {
    expect(stripBangs('foo/b bar', bangs)).toBe('foo/b bar');
  });

  it('returns the query unchanged when no bang is present', () => {
    expect(stripBangs('just searching', bangs)).toBe('just searching');
  });

  it('handles an empty or null bang list', () => {
    expect(stripBangs('hello world', null)).toBe('hello world');
    expect(stripBangs('hello world', undefined)).toBe('hello world');
    expect(stripBangs('hello world', {})).toBe('hello world');
  });

  it('collapses runs of whitespace and trims edges', () => {
    expect(stripBangs('   /g   hello   world   ', bangs)).toBe('hello world');
  });

  it('strips multiple bangs in the same query', () => {
    expect(stripBangs('/gh /b mixed', bangs)).toBe('mixed');
  });
});

describe('Search - isUrlLike', () => {
  it('accepts an explicit http/https scheme', () => {
    expect(isUrlLike('https://example.com')).toBe(true);
    expect(isUrlLike('HTTP://Example.com')).toBe(true);
  });

  it('accepts a dotted hostname with or without port and path', () => {
    expect(isUrlLike('example.com')).toBe(true);
    expect(isUrlLike('example.com:8080')).toBe(true);
    expect(isUrlLike('example.com/path?q=1')).toBe(true);
    expect(isUrlLike('foo.bar.baz')).toBe(true);
  });

  it('accepts an IPv4 address with or without port and path', () => {
    expect(isUrlLike('192.168.1.1')).toBe(true);
    expect(isUrlLike('192.168.1.1:8080')).toBe(true);
    expect(isUrlLike('192.168.1.1/admin')).toBe(true);
  });

  // regression: localhost previously rejected as not URL-like
  it('accepts localhost with or without port and path', () => {
    expect(isUrlLike('localhost')).toBe(true);
    expect(isUrlLike('LocalHost')).toBe(true);
    expect(isUrlLike('localhost:8080')).toBe(true);
    expect(isUrlLike('localhost/admin')).toBe(true);
  });

  // regression: bare hostnames with an explicit port or path opened web search instead
  it('accepts a bare hostname when port or path makes intent unambiguous', () => {
    expect(isUrlLike('nas:8080')).toBe(true);
    expect(isUrlLike('nas/admin')).toBe(true);
    expect(isUrlLike('router:80/setup')).toBe(true);
  });

  it('rejects a bare ambiguous word with no URL signal', () => {
    expect(isUrlLike('nas')).toBe(false);
    expect(isUrlLike('kubernetes')).toBe(false);
    expect(isUrlLike('router')).toBe(false);
  });

  it('rejects an input containing whitespace', () => {
    expect(isUrlLike('example.com /path')).toBe(false);
    expect(isUrlLike('hello world')).toBe(false);
  });

  it('rejects empty or nullish input', () => {
    expect(isUrlLike('')).toBe(false);
    expect(isUrlLike('   ')).toBe(false);
    expect(isUrlLike(null)).toBe(false);
    expect(isUrlLike(undefined)).toBe(false);
  });

  it('rejects strings that start or end with a dot', () => {
    expect(isUrlLike('.com')).toBe(false);
    expect(isUrlLike('foo.')).toBe(false);
  });

  it('trims surrounding whitespace before classifying', () => {
    expect(isUrlLike('  example.com  ')).toBe(true);
    expect(isUrlLike('  nas  ')).toBe(false);
  });
});

describe('Search - findUrlForSearchEngine', () => {
  const engines = {
    duckduckgo: 'https://duckduckgo.com/?q=',
    google: 'https://google.com/search?q=',
  };

  it('returns the URL for a known engine key', () => {
    expect(findUrlForSearchEngine('duckduckgo', engines)).toBe(engines.duckduckgo);
  });

  it('returns the input as-is when it is already a URL', () => {
    const url = 'https://custom.example/?q=';
    expect(findUrlForSearchEngine(url, engines)).toBe(url);
  });

  it('returns undefined for an unknown key', () => {
    expect(findUrlForSearchEngine('bogus', engines)).toBeUndefined();
  });

  it('returns undefined when nothing is supplied', () => {
    expect(findUrlForSearchEngine('', engines)).toBeUndefined();
    expect(findUrlForSearchEngine(undefined, engines)).toBeUndefined();
    expect(findUrlForSearchEngine(null, engines)).toBeUndefined();
  });
});
