# Home Lab bundled icon sources

- Lucide: https://github.com/lucide-icons/lucide — official `lucide-static@1.52.0` package, ISC + included Feather MIT notice. SVGs are copied without visual changes. Only canonical tagged icons are included.
- Microsoft Fluent Emoji: https://github.com/microsoft/fluentui-emoji — MIT; Flat SVG variants, revision 1ffb34c752ecf5d402f04cfb4b392c77f57c54bc. Original SVG files are preserved.
- Icons8 Flat Color: https://github.com/icons8/flat-color-icons — 329 original SVGs, revision 1bf90d5ff118bc6690120ff9fdfe234565b7e414. The upstream project offers MIT or Good Boy License; these files are distributed under its MIT option. The upstream license notice is preserved in `flat-color/LICENSE.md`.
- Each pack's complete license is stored in its own directory.
- All packs are served by Home Lab; no runtime request to GitHub is needed. Lucide SVGs use a CSS mask to follow the current theme text color. Fluent and Icons8 preserve their original flat colors and transparent backgrounds, without a card-level drop shadow.
- `scripts/sync-flat-color-icons.mjs` can refresh the committed Icons8 assets from the pinned upstream revision. The catalog keeps each icon's category, bilingual names where available, and searchable keywords.
- QX brand sources and the existing portal registry remain unchanged.
