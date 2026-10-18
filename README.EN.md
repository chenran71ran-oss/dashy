<div align="center">

<img src="public/mech/blue.png" alt="Home Lab pixel mecha mark" width="96">

# Home Lab

**Your websites, services and useful information. One personal entry point.**

A Dashy frontend customization focused on Chinese localization, redesigned layouts and desktop/mobile usability

[中文](README.md) · [Deployment](docs/home-lab/deployment.md) · [Changelog](CHANGELOG.md) · [Maintenance](docs/home-lab/maintenance.md) · [MIT](LICENSE)

</div>

---

## Overview

Maintained by Kenneth (`chenran71ran-oss`), Home Lab builds on Dashy's frontend. The main work is Chinese localization, layout and management interaction redesign, desktop/mobile adaptation, HTTP/Ping status presentation, and website icon discovery with consistent rendering. Cloudflare Workers + KV provides supporting deployment and data services.

The repository retains the name `dashy` to preserve its fork relationship. This is a community derivative, not an official Dashy release.

The default branch is `master`, inherited from upstream; it serves the same role commonly called `main`. Icon reliability fixes and the responsive, theme-aware login have been merged through [PR #1](https://github.com/chenran71ran-oss/dashy/pull/1) and [PR #2](https://github.com/chenran71ran-oss/dashy/pull/2). A merged commit does not by itself confirm a successful Cloudflare deployment. See the [changelog](CHANGELOG.md) and [commit index](docs/home-lab/history.md) for this fork's history; package version `4.7.17` identifies its upstream base.

## Frontend customization

### Chinese localization and guidance

Chinese theme labels, widget purpose and data-source descriptions, and clearer guidance for probes, advanced settings and editing forms.

### Layouts, cards and management interactions

Reworked dashboard, focused and workspace layouts, category/subcategory presentation, search and configuration controls. Card text, icons and descriptions adapt to layout and size changes; widgets use more compact information layouts and integrated refresh controls.

### Separate desktop and mobile adaptations

Desktop retains room for navigation and controls. Mobile adjusts title/search proportions, configuration button alignment, category navigation and toolbars. Work covers wrapping, spacing, overflow and theme contrast across views, layouts and sizes.

### HTTP and Ping status presentation

Improved indicators, online breathing animations, response details and HTTP/Ping labels on top of Dashy's existing checks. Independent checks are distinguished, with guidance for timeouts, failures and missing backend configuration. Presentation is adapted for desktop and touch interaction.

HTTP checks can run in the Worker. Real ICMP Ping still requires a compatible host backend; animations do not represent individual network requests.

### Website icon discovery and consistent rendering

Explicit discovery supports application paths, relative URLs, base URLs and PWA manifests, validates image formats, and provides verified fallbacks for recognized brands. Failed reads preserve the previous icon rather than reporting a monogram as a successful result.

Cards, workspace navigation and editing previews share icon rendering. QX/brand assets and categorized selection include 387 colored SVGs for websites without dedicated branding.

### Themes and pixel mecha identity

Home Lab branding and theme-aware pixel mecha styling, improved current-theme positioning, Chinese labels, favorite ordering and readability. Theme favorites are stored in KV for retrieval across devices.

The login page uses the portal's theme palette. In cloud mode, normal theme selections and saved custom colors update shared root configuration rather than being overridden by stale browser or subpage themes. Visible login pages check every 15 seconds; authenticated pages check every 30 seconds and protect active edits. Focus also triggers refresh. KV propagation can add delay. Mobile branding is centered and its footer stays with the form; desktop columns use tighter spacing. Preview controls are excluded from the deployed login component.

## Retained capabilities and deployment support

Dashy's navigation, widget catalog, launch methods, YAML import/export and multiple pages remain the foundation. Supporting additions include GitHub-connected Workers Builds, administrator password login, KV storage and configuration history.

Widgets require their own APIs and credentials. ICMP Ping and host information need an optional backend. Websites may block iframe embedding; use a new tab in those cases.

## Documentation

| Guide | Purpose |
| --- | --- |
| [Deployment](docs/home-lab/deployment.md) | Workers Builds, KV, Secrets and domains |
| [Usage](docs/home-lab/usage.md) | Websites, icons, widgets, themes and saving |
| [Features](docs/home-lab/features.md) | Functionality and data requirements |
| [Architecture](docs/home-lab/architecture.md) | Frontend, Worker and file structure |
| [FAQ](docs/home-lab/faq.md) | Common problems |
| [Changelog](CHANGELOG.md) / [History](docs/home-lab/history.md) | Milestones and verified commit references |
| [Maintenance](docs/home-lab/maintenance.md) | Branches, checks, deployment and rollback |
| [Contributing](CONTRIBUTING.md) | Development and review |

Detailed guides are currently in Chinese. Do not commit personal configuration, cookies or API keys.

## Credits and license

Based on [Dashy](https://github.com/Lissy93/dashy), created by Alicia Sykes and upstream contributors. Its original introduction is preserved in [README_UPSTREAM.md](README_UPSTREAM.md).

The upstream [MIT License](LICENSE) is retained. Third-party assets and trademarks follow their own licenses and ownership; see [icon sources](public/portal-icons/SOURCES.md).
