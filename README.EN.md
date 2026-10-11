<div align="center">

<img src="public/mech/blue.png" alt="Home Lab pixel mecha mark" width="96">

# Home Lab

**Your websites, services and useful information. One personal entry point.**

A Dashy-based portal for Cloudflare Workers + KV

[中文](README.md) · [Deployment](docs/home-lab/deployment.md) · [Features](docs/home-lab/features.md) · [MIT](LICENSE)

</div>

---

## Overview

Maintained by Kenneth (`chenran71ran-oss`), Home Lab builds on Dashy's open-source frontend with a Cloudflare Worker adapter, KV persistence, Chinese interface improvements, pixel mecha branding and icon management.

The repository retains the name `dashy` to preserve its fork relationship. This is a community derivative, not an official Dashy release.

## Highlights

- Three views: dashboard, category-focused navigation and workspace.
- Editable websites, sections, subsections, descriptions and launch methods.
- GitHub-connected builds through Cloudflare Workers Builds.
- Administrator password login, KV storage and configuration history.
- Themes, synchronized theme favorites and desktop/mobile adaptations.
- QX and brand icons, 387 colored SVGs and public website icon discovery.
- Dashy widget types, HTTP checks, YAML import/export and multiple pages.

Widgets require their own APIs and credentials. ICMP Ping and host information need an optional backend. Websites may block iframe embedding; use a new tab in those cases.

## Documentation

| Guide | Purpose |
| --- | --- |
| [Deployment](docs/home-lab/deployment.md) | Workers Builds, KV, Secrets and domains |
| [Usage](docs/home-lab/usage.md) | Websites, icons, widgets, themes and saving |
| [Features](docs/home-lab/features.md) | Functionality and data requirements |
| [Architecture](docs/home-lab/architecture.md) | Frontend, Worker and file structure |
| [FAQ](docs/home-lab/faq.md) | Common problems |
| [Contributing](CONTRIBUTING.md) | Development and review |

Detailed guides are currently in Chinese. Do not commit personal configuration, cookies or API keys.

## Credits and license

Based on [Dashy](https://github.com/Lissy93/dashy), created by Alicia Sykes and upstream contributors. Its original introduction is preserved in [README_UPSTREAM.md](README_UPSTREAM.md).

The upstream [MIT License](LICENSE) is retained. Third-party assets and trademarks follow their own licenses and ownership; see [icon sources](public/portal-icons/SOURCES.md).
