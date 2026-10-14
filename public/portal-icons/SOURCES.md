# Home Lab bundled icon sources

- Lucide: https://github.com/lucide-icons/lucide — official `lucide-static@1.52.0` package, ISC + included Feather MIT notice. SVGs are copied without visual changes. Only canonical tagged icons are included.
- Microsoft Fluent Emoji: https://github.com/microsoft/fluentui-emoji — MIT; Flat SVG variants, revision 1ffb34c752ecf5d402f04cfb4b392c77f57c54bc. Original SVG files are preserved.
- Icons8 Flat Color: https://github.com/icons8/flat-color-icons — 329 original SVGs, revision 1bf90d5ff118bc6690120ff9fdfe234565b7e414. The upstream project offers MIT or Good Boy License; these files are distributed under its MIT option. The upstream license notice is preserved in `flat-color/LICENSE.md`.
- Each pack's complete license is stored in its own directory.
- Bundled packs are served by Home Lab without runtime GitHub requests. Remote website and official fallback icons may still require their public host. Lucide SVGs use a CSS mask to follow the theme text color. Fluent and Icons8 preserve their flat colors and transparent backgrounds.
- `scripts/sync-flat-color-icons.mjs` can refresh the committed Icons8 assets from the pinned upstream revision. The catalog keeps each icon's category, bilingual names where available, and searchable keywords.
- Original QX source assets are retained; selected brand variants are documented below.
- NodeSeek: official apple-touch icon declared by https://www.nodeseek.com/ at /static/image/favicon/android-chrome-512x512.png, mirrored without modification as `nodeseek.png` to avoid runtime source availability issues. Trademark rights remain with NodeSeek.
- DeepSeek: official favicon declared by https://platform.deepseek.com/ at https://fe-static.deepseek.com/platform/favicon.svg, mirrored without modification as `deepseek.svg`. Its monochrome silhouette is rendered with a theme-foreground CSS mask to remain legible on light and dark backgrounds. Trademark rights remain with DeepSeek.
- Liangxinyun: public logo from https://xn--9kqz23b19z.com/images/logo.png. `liangxin-transparent.png` is a background-extraction edit made with the built-in image tool, preserving the yellow/cyan mark and wording. The original QX asset is retained. Trademark rights remain with its owner.
- AWS console fallback: public AWS Architecture Icons from https://github.com/awslabs/aws-icons-for-plantuml — the General/AWSManagementConsole.png resource is referenced remotely. Follow the upstream project's icon terms and trademark notices.
- Komari fallback: official project favicon referenced by https://github.com/komari-monitor/komari in its README, pinned to komari-monitor/komari-web revision d54ce1288df41ead08aa19f8700186e68028a889. This is a remote project asset, not an original Home Lab logo.
