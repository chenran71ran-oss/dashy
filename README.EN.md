<div align="center">

<img src="public/mech/blue.png" alt="Home Lab pixel mecha mark" width="96">

# Home Lab

**One place for the websites, self-hosted services and information you use every day.**

A Chinese-first start page built on [Dashy](https://github.com/Lissy93/dashy) 4.10 · Runs on Cloudflare Workers, so your desktop and phone share one configuration

[![MIT License](https://img.shields.io/badge/License-MIT-2563eb?style=flat-square)](LICENSE)
[![Cloudflare Workers](https://img.shields.io/badge/Deploy-Cloudflare_Workers-f38020?style=flat-square&logo=cloudflare&logoColor=white)](docs/home-lab/deployment.md)
[![Vue 3](https://img.shields.io/badge/Vue-3-42b883?style=flat-square&logo=vuedotjs&logoColor=white)](docs/home-lab/architecture.md)
[![Themes](https://img.shields.io/badge/Built--in_themes-62-8b5cf6?style=flat-square)](docs/home-lab/theme-readability.md)
[![Based on Dashy 4.10](https://img.shields.io/badge/Based_on-Dashy_4.10-0ea5e9?style=flat-square)](https://github.com/Lissy93/dashy)

[Quick start](#-quick-start) · [Features](#-features) · [Usage](docs/home-lab/usage.md) · [FAQ](docs/home-lab/faq.md) · [Changelog](CHANGELOG.md) · [中文](README.md)

<img src="docs/assets/home-lab/overview.webp" alt="Home Lab overview: website cards with English descriptions grouped by category, Liquid Glass theme" width="900">

</div>

> [!NOTE]
> The interface and the linked guides are written in Chinese. This page summarizes them in English.

## ✨ Features

### 🧭 Three views, one set of bookmarks

| Overview `/home` | Focus `/minimal` | Workspace `/workspace` |
| --- | --- | --- |
| Every category, website and widget on one page | Switch categories with tabs and see only that one | Navigation on the left, the website or widget opens on the right |

<p align="center">
  <img src="docs/assets/home-lab/focus.png" alt="Focus view with category tabs, Nord Frost theme" width="560">
  &nbsp;
  <img src="docs/assets/home-lab/mobile.webp" alt="Focus view on a phone, Catppuccin theme" width="180">
</p>
<p align="center">
  <img src="docs/assets/home-lab/workspace.png" alt="Workspace with the expanded sidebar listing websites by category, Tokyo Night theme" width="560">
</p>

The workspace uses the new sidebar from upstream 4.10: collapse it to an icon rail, or expand it to search and browse by category.

### 🎨 62 themes, each checked for readability

- **Liquid Glass**: colour glows over a dark base, with frosted panels, cards and buttons that have lit edges. Four sliders set the glow, panel, card and button transparency; when the system asks for reduced transparency, solid surfaces are used instead.
- All upstream Dashy themes are included, each with a Chinese name. Starred themes sync across devices.
- Every theme passes a contrast audit: site names, descriptions, category tabs, the search box and the workspace sidebar reach at least 4.5:1 in all themes.
- The login page, theme menu, context menu and pixel mecha mark follow the current theme's colours.

### 🖼️ Icons: transparent, sharp, and never left blank

- **Official vector marks for brands**: nearly 50 brands, including GitHub, Telegram, TikTok, ChatGPT, Claude, DeepSeek, Apple Music and Alibaba Cloud. Transparent backgrounds, sharp at any size. Saved copies of a brand's favicon are shown as the vector mark.
- **Single-colour marks follow the theme**: black-and-white logos such as GitHub, X, OpenAI and Manus turn light on dark themes and dark on light themes.
- **White backgrounds removed automatically**: a white-background favicon is cleaned up in a background thread (Web Worker). Photos and avatars are left as they are.
- **A fallback for every card**: icons load through the Worker's proxy, then from the site's root favicon, and finally as a theme-coloured glyph for the kind of site (monitoring, speed test, server, shop, academic…), instead of a bare initial.
- **Built-in icon library**: more than 2,200 icons (387 in colour), searchable by category and by Chinese or English keyword.

### ⚡ Fast, and recovers by itself after a deployment

- Start-up JavaScript is halved, and the session check and configuration load share a single request.
- Categories you have visited stay mounted, so switching back is instant; while the browser is idle, icons of other categories are processed ahead of time.
- Static assets are cached long-term by content hash, so a second visit downloads almost nothing.
- After a new version is deployed, tabs that are still open refresh to it automatically; if you are editing, you are asked to save first, so nothing is lost.

### ✍️ Manage everything without writing YAML

- Add, edit and drag to reorder websites and categories on the page, and preview before saving.
- **Fill in icons and descriptions**: find websites that are missing an icon or a description, read each site's own icon and English description, then review and apply.
- Every cloud save backs up the previous version, which you can restore from the configuration history for 30 days.

### 📡 Service status and widgets

- HTTP checks run in the Worker; ICMP ping and system information can use your own host backend.
- All 94 upstream widgets (weather, calendar, RSS, custom API and more) are kept, with Chinese guidance on their data sources.

### ☁️ One configuration across devices

- Configuration, theme and favourites are stored in Cloudflare KV, so your desktop and phone open the same start page.
- Admin password sign-in; the admin password and widget API keys are kept in Worker Secrets, never in frontend code.

> [!NOTE]
> Some features need more than the Worker: ICMP ping and host information require an optional backend; whether the workspace can embed a website depends on that site allowing iframes; widgets need their own services and credentials. See [feature boundaries](docs/home-lab/features.md) (Chinese).

## 🚀 Quick start

All you need is a Cloudflare account. No server of your own is required.

1. **Fork** this repository, then create a Workers project in Cloudflare and connect it to the repository.
2. **Create a KV namespace** and put its ID in the build variable `HOME_KV_NAMESPACE_ID`.
3. **Set the admin password** by adding the runtime Secret `ADMIN_TOKEN`.
4. **Deploy**, and optionally bind a custom domain.
5. **Sign in**, add categories and websites, click "保存到云端" (Save to cloud), then refresh on another device to see them.

Full steps, build commands and variables are in the [deployment guide](docs/home-lab/deployment.md) (Chinese).

> [!TIP]
> Do not commit your personal website list, cookies or API keys to a public repository. They belong in your own KV and Worker Secrets.

<details>
<summary><b>Local development</b></summary>

```bash
npm ci
npm run dev      # Vite dev server (frontend only), http://localhost:8080
npm run build    # Production build into dist/
npx eslint .     # Lint
npx vitest run && node --test tests/*.test.mjs   # Frontend and Worker tests
node scripts/theme-audit/audit.mjs --fixed       # Contrast audit for all 62 themes
```

The full save and sign-in flow needs the Worker API; see the [maintenance guide](docs/home-lab/maintenance.md) (Chinese).

</details>

## 📚 Documentation

The guides below are in Chinese.

| I want to… | Read |
| --- | --- |
| Deploy, set up KV and a custom domain | [Deployment guide](docs/home-lab/deployment.md) |
| Add websites, change icons, use widgets | [Usage guide](docs/home-lab/usage.md) |
| Know whether a feature needs an API or backend | [Feature boundaries](docs/home-lab/features.md) |
| Troubleshoot saving, icons, weather or embedding | [FAQ](docs/home-lab/faq.md) |
| Understand icon transparency, loading order and fallbacks | [Icon transparency and sharpness](docs/home-lab/icon-transparency.md) · [Icon loading and authentication](docs/home-lab/icon-auth.md) |
| See the theme contrast audit | [Theme readability audit](docs/home-lab/theme-readability.md) |
| See how start-up speed was measured | [Start-up performance](docs/home-lab/startup-performance.md) |
| Understand the code layout | [Architecture and file map](docs/home-lab/architecture.md) |
| Branch, verify, release and roll back | [Maintenance guide](docs/home-lab/maintenance.md) |
| Look up every change | [Changelog](CHANGELOG.md) · [Commit index](docs/home-lab/history.md) |
| Look up Dashy's original configuration fields | [Upstream docs index](docs/readme.md) (English) |

## 🧱 Tech stack and layout

**Vue 3 + Vite (rolldown)** frontend · **Cloudflare Workers + KV** backend and storage · **Vitest + node:test** tests

| Path | Contents |
| --- | --- |
| `src/` | Frontend: three views, themes, widgets, editor, icon processing |
| `cloud/` | Worker: sign-in, KV configuration and history, icon discovery and proxy, site descriptions, weather, probes |
| `public/portal-icons/` | Bundled brand icons and icon packs (sources in [SOURCES.md](public/portal-icons/SOURCES.md)) |
| `scripts/` | Brand icon generation, icon pack sync, theme audit |
| `tests/` | Frontend component, Worker API and utility tests |
| `docs/home-lab/` | User and maintenance guides for this project |

## 🤝 Contributing

Issues and pull requests are welcome. Work on a separate branch and run the checks and tests above before submitting; the pull request template lists what to describe about your verification. See the [contributing guide](CONTRIBUTING.md).

## 🙏 Acknowledgements

- [Dashy](https://github.com/Lissy93/dashy) is the foundation of this project. Navigation, themes, widgets and the configuration system come from Alicia Sykes and the upstream contributors; the original introduction is kept in [README_UPSTREAM.md](README_UPSTREAM.md).
- Icon sources: [Simple Icons](https://simpleicons.org/), [Lobe Icons](https://github.com/lobehub/lobe-icons), [Lucide](https://lucide.dev/), [Microsoft Fluent Emoji](https://github.com/microsoft/fluentui-emoji), [Icons8 Flat Color](https://github.com/icons8/flat-color-icons) and [QX-icons](https://github.com/chenran71ran-oss/QX-icons).

## 📄 License

[MIT](LICENSE), with the upstream copyright notice retained. Third-party icons, fonts and trademarks remain under their own licences and ownership. This is an independent fork of Dashy maintained by Kenneth ([@chenran71ran-oss](https://github.com/chenran71ran-oss)) and is not an official Dashy release.
