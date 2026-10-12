<div align="center">

<img src="public/mech/blue.png" alt="Home Lab 像素机甲标识" width="96">

# Home Lab

**把常用网站、分站和服务状态，放进一个属于自己的入口。**

基于 Dashy 的中文前端改造 · 布局重构 · PC / 移动端适配

[![MIT License](https://img.shields.io/badge/License-MIT-2563eb?style=flat-square)](LICENSE)
[![Workers](https://img.shields.io/badge/Cloudflare-Workers-f38020?style=flat-square)](docs/home-lab/deployment.md)
[![Vue 3](https://img.shields.io/badge/Frontend-Vue_3-42b883?style=flat-square)](docs/home-lab/architecture.md)
[![Dashy](https://img.shields.io/badge/Based_on-Dashy-8b5cf6?style=flat-square)](https://github.com/Lissy93/dashy)

[快速部署](docs/home-lab/deployment.md) · [使用指南](docs/home-lab/usage.md) · [功能边界](docs/home-lab/features.md) · [English](README.EN.md)

</div>

---

## 项目定位

Home Lab 将日常书签、自建服务和需要查看的信息集中在一起。打开浏览器后，可以搜索网站、按分类跳转，也可以在工作台里切换支持嵌入的服务。

由 **Kenneth（chenran71ran-oss）** 维护，基于 Dashy 持续进行前端改造。主要工作集中在 **中文本地化、布局与管理交互重构、PC / 移动端适配、HTTP / Ping 状态展示，以及网站图标抓取与统一渲染**。Cloudflare Workers + KV 是配套部署与数据适配方案。

项目名称是 **Home Lab**；仓库保留 fork 名称 `dashy`，便于追踪上游。Dashy 提供原有的导航、主题、小组件与配置基础，本项目在此基础上改进中文使用体验和前端交互。

## 核心改造

### 中文本地化与配置说明

补充主题中文标注、小组件用途与数据源说明，以及探针、高级设置和编辑表单的中文提示。让你在选择组件、配置接口和查看异常时，能理解选项的作用及前置条件。

### 布局、卡片与管理交互重构

围绕总站、专注、工作台三视图调整页面结构、分类与小分类、卡片排版、搜索和配置工具栏。针对不同布局与小 / 中 / 大尺寸分别调整文字、图标和说明的组织方式，并优化小组件的信息密度与内部刷新入口。

### PC 与移动端分别适配

桌面端保留更完整的导航和操作空间；移动端重点调整标题与搜索比例、配置按钮对齐、分类切换及工具栏排列。结合主题、布局、尺寸与视图变化处理换行、间距、溢出和颜色对比问题，而不是只缩放桌面界面。

### HTTP / Ping 状态展示与交互

在 Dashy 原有检测能力上，改进状态点、在线呼吸动画、响应信息提示和 HTTP / Ping 标识，区分两项独立检测，减少两个状态点同时出现时的歧义。补充未接入后端、超时与失败等状态的说明，并适配桌面和触屏查看。

HTTP 检测可由 Worker 执行；真实 ICMP Ping 仍需兼容的主机后端。呼吸动画是显示效果，不代表每次动画都发起检测。

### 网站图标抓取与统一显示

改进“读取当前网站图标”：支持自定义网站路径、相对地址、`base` 地址与 PWA 应用清单，检查图片实际格式，并为可识别品牌提供核实的图标回退。读取失败保留原图标，避免把首字母占位误当成成功结果。

结合 QX / 品牌目录与分类图标选择器，统一卡片、工作台侧栏和编辑预览的图标显示；补充 387 个彩色 SVG，让没有专用标识的网站也能按用途选择图标。

### 主题与像素机甲风格

加入 Home Lab 标识与像素机甲主题联动，调整主题菜单的当前项定位、中文名称、收藏排序及可读性。主题收藏通过 KV 同步，桌面和移动端读取同一份收藏。

## 一个入口，三种使用方式

| 总站 | 专注 | 工作台 |
| --- | --- | --- |
| 分类卡片、小分类和小组件集中展示 | 分类标签切换，查看当前分类的网站与小组件 | 左侧导航，右侧打开网页或小组件 |
| 浏览完整导航和服务信息 | 快速找到这一类入口 | 在支持嵌入的服务之间切换 |
| `/home` | `/minimal` | `/workspace` |

## 保留的基础能力与部署支持

- 保留 Dashy 的网站管理、小分类、打开方式、YAML 编辑与导入导出、多页面及小组件目录。
- 配套 Cloudflare Workers Builds 云端构建、管理员密码登录、KV 配置保存与历史备份。
- 外部网站和自建分站都可添加，默认不预填私人网站；组件按各自的数据源与授权配置。

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
