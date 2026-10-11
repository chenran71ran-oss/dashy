<div align="center">

<img src="public/mech/blue.png" alt="Home Lab 像素机甲标识" width="96">

# Home Lab

**把常用网站、分站和服务状态，放进一个属于自己的入口。**

基于 Dashy 的个人导航与服务工作台 · Cloudflare Workers + KV

[![MIT License](https://img.shields.io/badge/License-MIT-2563eb?style=flat-square)](LICENSE)
[![Workers](https://img.shields.io/badge/Cloudflare-Workers-f38020?style=flat-square)](docs/home-lab/deployment.md)
[![Vue 3](https://img.shields.io/badge/Frontend-Vue_3-42b883?style=flat-square)](docs/home-lab/architecture.md)
[![Dashy](https://img.shields.io/badge/Based_on-Dashy-8b5cf6?style=flat-square)](https://github.com/Lissy93/dashy)

[快速部署](docs/home-lab/deployment.md) · [使用指南](docs/home-lab/usage.md) · [功能边界](docs/home-lab/features.md) · [English](README.EN.md)

</div>

---

## 一个入口，三种使用方式

Home Lab 将日常书签、自建服务和需要查看的信息集中在一起。打开浏览器后，可以搜索网站、按分类跳转，也可以在工作台里切换支持嵌入的服务。

由 **Kenneth（chenran71ran-oss）** 维护，复用 Dashy 的开源前端，增加 Cloudflare 云端适配、中文交互、像素机甲标识与图标管理。项目名称是 **Home Lab**；仓库保留 fork 名称 `dashy`，便于追踪上游。

| 总站 | 专注 | 工作台 |
| --- | --- | --- |
| 分类卡片、小分类和小组件集中展示 | 分类标签切换，查看当前分类的网站与小组件 | 左侧导航，右侧打开网页或小组件 |
| 浏览完整导航和服务信息 | 快速找到这一类入口 | 在支持嵌入的服务之间切换 |
| `/home` | `/minimal` | `/workspace` |

## 项目特色

- **云端构建。** 连接 GitHub 后由 Cloudflare Workers Builds 安装、构建和部署，日常使用无需本地运行服务器。
- **入口由自己管理。** 外部网站与自建分站都可添加，支持分类、小分类、说明、图标和多种打开方式，默认不预填私人网站。
- **保留 Dashy 配置能力。** YAML 编辑、导入导出、多页面、布局和卡片尺寸继续可用。
- **自己的界面风格。** Home Lab 品牌、像素机甲主题联动、中文主题标注与收藏，配合桌面和移动端适配。
- **图标可以读，也可以挑。** QX/品牌目录、387 个彩色 SVG 及其他图标类型；支持网站路径、相对地址和应用清单图标读取。
- **配置保存到 KV。** 管理员密码登录，网站配置与主题收藏云端存储；保存前保留配置历史。
- **服务信息集中展示。** 保留上游小组件目录与 HTTP 检测，天气、RSS、监控按各自数据源配置。

> [!NOTE]
> 小组件类型存在不代表相应服务已经部署。ICMP Ping、主机系统信息需要可选后端；工作台嵌入受目标网站策略限制。详见 [功能边界](docs/home-lab/features.md)。

## 开始使用

1. Fork 仓库，在 Cloudflare 创建或连接 Workers 项目。
2. 设置 `HOME_KV_NAMESPACE_ID` 构建变量、`HOME_KV` 绑定与 `ADMIN_TOKEN` 运行时 Secret。
3. 按 [部署指南](docs/home-lab/deployment.md) 填写云端构建与部署命令。
4. 绑定自定义域名，登录后添加分类与网站。
5. 网站表单保存后，点击 **保存到云端**，到另一台设备刷新验证。

已部署的用户可直接阅读 [使用指南](docs/home-lab/usage.md)。个人网站列表、Cookie 与 API 密钥不应放进公开仓库。

## 文档导航

| 我想做什么 | 文档 |
| --- | --- |
| 部署、KV 与自定义域名 | [部署指南](docs/home-lab/deployment.md) |
| 网站、图标、小组件与收藏 | [使用指南](docs/home-lab/usage.md) |
| 功能是否需要 API 或后端 | [功能边界](docs/home-lab/features.md) |
| 理解前后端与文件职责 | [架构与文件导航](docs/home-lab/architecture.md) |
| 排查保存、图标、天气与嵌入 | [常见问题](docs/home-lab/faq.md) |
| 查阅完整 Dashy 配置字段 | [文档索引](docs/readme.md) |
| 提交改进 | [贡献指南](CONTRIBUTING.md) |

## 项目结构

| 路径 | 职责 |
| --- | --- |
| `src/` | Vue 前端、三视图、主题、小组件与编辑器 |
| `cloud/` | Worker 登录、KV 配置、探针适配、天气与图标 API |
| `public/` | 静态资源、机甲标识与图标包 |
| `docs/home-lab/` | 此 fork 的现行用户文档 |
| `docs/` | 保留的上游参考与专项技术说明 |
| `tests/` | 前后端功能与适配检查 |
| `wrangler.jsonc` | Worker 与静态资源绑定声明 |

## 来源与致谢

本项目基于 [Dashy](https://github.com/Lissy93/dashy)，复用了 Alicia Sykes 与上游贡献者的前端、组件、主题和配置体系。原版介绍完整保留在 [README_UPSTREAM.md](README_UPSTREAM.md)。

感谢 [QX-icons](https://github.com/chenran71ran-oss/QX-icons)、Simple Icons、Lucide、Microsoft Fluent Emoji、Icons8 Flat Color 等资源。具体来源与许可见 [图标来源](public/portal-icons/SOURCES.md) 和各资源目录。

## 许可证

继承 [MIT License](LICENSE)，保留上游版权声明。第三方图标、字体及商标遵循各自许可和权利归属。此 fork 不代表 Dashy 官方发布。
