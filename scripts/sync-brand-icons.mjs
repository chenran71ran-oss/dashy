// Builds transparent brand marks from simple-icons (CC0) official paths.
// Monochrome marks are drawn in black and rendered with a theme-colour CSS mask;
// colour marks keep their brand colours. Trademark rights remain with each owner.
import fs from 'node:fs';
import * as icons from 'simple-icons';

const out = new URL('../public/portal-icons/brand/', import.meta.url);
fs.mkdirSync(out, { recursive: true });
const path = slug => {
  const icon = Object.values(icons).find(entry => entry?.slug === slug);
  if (!icon) throw new Error(`simple-icons has no ${slug}`);
  return icon.path;
};
const svg = (body, defs = '') => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">${defs ? `<defs>${defs}</defs>` : ''}${body}</svg>\n`;
const files = {
  // Theme-colour masks: the official single-colour marks.
  'github.svg': svg(`<path d="${path('github')}"/>`),
  'x.svg': svg(`<path d="${path('x')}"/>`),
  'speedtest.svg': svg(`<path d="${path('speedtest')}"/>`),
  'tiktok.svg': svg(`<path d="${path('tiktok')}"/>`),
  // TikTok's cyan and red offset layers sit under the theme-colour note.
  'tiktok-under.svg': svg(`<path fill="#25F4EE" transform="translate(-0.55 -0.55)" d="${path('tiktok')}"/><path fill="#FE2C55" transform="translate(0.55 0.55)" d="${path('tiktok')}"/>`),
  // Brand marks whose official artwork is a coloured disc with a white figure:
  // a white disc under the cut-out restores the figure on any background.
  'telegram.svg': svg(`<circle cx="12" cy="12" r="10.8" fill="#fff"/><path fill="#26A5E4" d="${path('telegram')}"/>`),
  'reddit.svg': svg(`<circle cx="12" cy="12" r="10.8" fill="#fff"/><path fill="#FF4500" d="${path('reddit')}"/>`),
  'emby.svg': svg(`<circle cx="12" cy="12" r="6.2" fill="#fff"/><path fill="#52B54B" d="${path('emby')}"/>`),
  // Spotify's official icon has black sound waves on the green disc.
  'spotify.svg': svg(`<circle cx="12" cy="12" r="10.8" fill="#000"/><path fill="#1ED760" d="${path('spotify')}"/>`),
  'netflix.svg': svg(`<path fill="#E50914" d="${path('netflix')}"/>`),
  'deepseek.svg': svg(`<path fill="#4D6BFE" d="${path('deepseek')}"/>`),
  'instagram.svg': svg(`<path fill="url(#ig)" d="${path('instagram')}"/>`,
    '<radialGradient id="ig" cx="6.4" cy="25.9" r="25.6" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#FFDD55"/><stop offset=".1" stop-color="#FFDD55"/><stop offset=".5" stop-color="#FF543E"/><stop offset="1" stop-color="#C837AB"/></radialGradient>'),
  // Four-colour Google "G" in Google's brand colours.
  'google.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="4 4 40 40"><path fill="#FBBC05" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/><path fill="#EA4335" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"/><path fill="#34A853" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"/><path fill="#4285F4" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"/></svg>\n`,
};
for (const [name, content] of Object.entries(files)) fs.writeFileSync(new URL(name, out), content);
console.log(`Wrote ${Object.keys(files).length} brand icons to public/portal-icons/brand/`);
