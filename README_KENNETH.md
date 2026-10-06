# Home Lab 总站 · Dashy 原版前端 / Cloudflare 云构建版

这是一份真实复用 Dashy 前端的改造项目，不是按截图重写的单文件页面。
原始项目：https://github.com/Lissy93/dashy
源码基准：4.7.17 / 988b466dd585131096ae990aab4eb98175c5bd16。
保留 MIT 许可证与原作者 Alicia Sykes 的版权声明。

保留原版 Vue 页面、Nord Frost 主题、卡片、分类折叠、搜索、布局选择、图标、导出与配置编辑器；补充像素机甲标识、中文字体、小分类表单与云端密码登录。

## 已实现

- 默认网站列表为空，你自己添加自建 Worker 分站或任意 HTTP/HTTPS 外部网站。
- 管理员只输入 ADMIN_TOKEN 密码，不填用户名，不再登录第二次。
- 原版分类与小分类；小分类内网站支持编辑名称、网址和图标。
- 原版搜索、分类折叠、多种布局、卡片大小、主题与跳转方式。
- 点击卡片跳转；默认新标签页。本站不代理分站、不代替分站自身登录。
- “保存到云端”写入现有 HOME_KV；其他设备重新读取同一配置。KV 分布式缓存可能导致新配置短暂延迟。
- 保留原版 YAML 编辑与导出，可备份配置。
- 会话为签名 HttpOnly Cookie，有效期12小时；改变 ADMIN_TOKEN 后旧会话失效。

## 范围说明

本项目是基础导航站，未搬运 Dashy 的 Node/Express 服务。服务器监控、ping、状态检测、代理请求、监控小组件及多 YAML 子页面不在此版范围内。不会显示编造的在线状态。
旧版本网站如已存入 `kenneth-home:config:v1`，首次读取时转换为分类与小分类；原键保持不动。保存新版本后使用 `kenneth-home:dashy:v1`。隐藏入口转换为 Dashy 的 hideFromHomepage：默认首页隐藏，但搜索或编辑模式可显示；置顶转换为所在分类靠前排列。

## 部署：只需在 Cloudflare 面板操作

改造源码已提交到 https://github.com/chenran71ran-oss/dashy 的 master 分支，不需要下载源码或在电脑运行命令。

1. 在 Cloudflare 打开现有 **home** Worker → Settings → Build，连接上述 GitHub 仓库，生产分支选择 **master**。
2. 填写下表。这里的命令均由 Cloudflare 云端执行。

| 设置 | 值 |
| --- | --- |
| 根目录 | 仓库根目录，留空或 `/` |
| Build command | `npm ci --ignore-scripts --no-audit --no-fund && npm run build` |
| Deploy command | `npm run deploy` |
| Build variable: NODE_VERSION | `24.19.0` |
| Build variable: SKIP_DEPENDENCY_INSTALL | `1` |
| Build variable: HOME_KV_NAMESPACE_ID | 现有 HOME_KV 的32位 Namespace ID |
| Build variable: WORKER_NAME | 仅当目标 Worker 不是 home 时填写实际名称 |

3. KV ID 可在 Storage & databases → KV 中找到现有绑定对应的命名空间查看。填 Namespace ID，不填命名空间名称或账号 ID。构建脚本会把 ID 写入临时部署配置，不会写入前端或提交回 GitHub。
4. 在 home → Settings → Variables & Secrets 确认已有运行时 **ADMIN_TOKEN** 存在。它不是 Build variable；不要添加 VITE_ADMIN_TOKEN，不要把密码提交到源码。keep_vars 保留面板变量；正常部署也不删除现有 secret。
5. 连接已有 Worker 后，通过向 master 分支提交更新触发首次构建；在 Deployments → Go to build history 查看记录。保存构建变量本身不会启动构建。暂时关闭 Enable Preview builds，本项目的部署配置由 npm run deploy 生成。成功后确认绑定有 **HOME_KV** 和 **ASSETS**，并检查 Domains & Routes 中的总站域名。此项目未声明 route/routes 且 workers_dev=false，继续由面板管理域名。
6. 打开总站，输入管理员密码。首次空白首页点击“开始添加网站”，添加分类和网站。表单“保存”暂存编辑，最后点击“保存到云端”。

Cloudflare 的 GitHub 应用和当前 ChatGPT 的 GitHub 连接是两项授权；如果 CF 面板看不到 dashy，请在 CF 的仓库连接流程授权该仓库。
Fork 原版附带的 Docker、文档发布和其他 GitHub Actions 不用于此 Worker 部署，无需启用它们；实际构建由 Cloudflare Workers Builds 完成。

## 小分类与图标

添加网站时，在更多字段中选“小分类”，然后“＋ 添加网站”。父级填分类名称，网址留空；组内每个网站填写名称与完整网址。进入编辑模式后，小分类标题旁有“编辑小分类”。

图标支持 Dashy 原生形式：`si-jellyfin`、`si-github`、`si-cloudflare` 等 Simple Icons，emoji，及 HTTP/HTTPS 图片地址。部分第三方图标来源依赖其 CDN 可用性。自定义图片使用你有权使用的资源。页面自身打包了像素机甲标识，并保留 Dashy 原版字体；中文额外提供 Noto Sans SC，字体许可证见 src/assets/fonts/NotoSansSC-LICENSE.txt。

## 文件说明

- `src/`：原版前端与上述小幅改造。
- `cloud/worker.mjs`：密码会话、配置接口、KV 与 Assets。
- `cloud/build-validator.mjs`：构建期生成配置验证器，避免 Worker 运行时动态执行代码。
- `cloud/config-validator.cjs`：生成的静态验证器；每次 npm run build 都重新生成。
- `wrangler.jsonc`：部署目标、KV 和 Assets 配置。
- `package-lock.json`：锁定构建依赖。
- `LICENSE`：原版 MIT 许可证。
- 完整源码包只包含构建前端和 Worker 所需源码，不包含 node_modules、原版 Node 后端或服务器监控服务。

## 已验证与限制

已通过生产构建、Wrangler 部署打包检查、workerd 运行时登录/读取/保存检查，以及浏览器中的密码登录、空列表、原版编辑新增网站、小分类修改、保存刷新恢复、旧数据转换、退出和接口保护。检查了320、390、430、768、1440、1920像素宽度的页面溢出情况。

测试使用隔离的内存/本地 KV 与测试密码；预览卡片仅来自测试数据，不包含在默认配置中。没有更改或部署到你的线上账户。桌面与手机验证使用 Chromium，尚未在真实 Windows、iPhone Safari 上逐项实测。

Cloudflare 官方参考：
- https://developers.cloudflare.com/workers/ci-cd/builds/configuration/
- https://developers.cloudflare.com/workers/ci-cd/builds/build-image/
- https://developers.cloudflare.com/workers/static-assets/binding/
- https://developers.cloudflare.com/workers/wrangler/configuration/

## Home Lab 交互修订

- 旧默认标题在读取配置时更新为 Home Lab，已有分类、网站和图标保留；替换像素机甲标识。
- 常用工具栏直接展开：主题、布局、卡片尺寸、编辑和视图；小屏自动换行，也可收起。
- 网站与分类使用简洁中文表单，提供可搜索的本地图标库与预览。高级服务器探测字段不出现在导航表单。
- 弹窗只保留内容区滚动，支持 Escape、键盘焦点约束；取消小分类编辑不会更改原数据。
- 专注视图改为紧凑的分类筛选和卡片网格；工作台未选择站点时显示导航首页。小分类内同时显示图标与名称。

## 数据与公开仓库

仓库仅保存程序源码。通过后台添加的网站配置由 Worker 写入 HOME_KV，不写回 GitHub；ADMIN_TOKEN 只从 Cloudflare 运行时绑定读取，不嵌入前端。管理员会话使用带 Secure/HttpOnly/SameSite=Strict 标记的 Cookie（本地 HTTP 测试不加 Secure），只绑定本站主机，且配置接口要求有效会话并禁用缓存。密码与 Cookie 不记录到日志。

请将 ADMIN_TOKEN 保存为 Cloudflare 运行时 Secret，不要使用 VITE_ 或 DASHY_ 前缀来保存凭证，也不要将敏感数据粘贴到仓库、截图、公开构建日志或前端资源。本站的 KV、账户和已登录设备仍需保护，公开源码不等于零风险保证。本地图标不向第三方查询；自行填写的远程图标或背景网址仍会向相应服务器发起请求。本次检查覆盖本站改造代码，其他 Worker 的数据接口不在本次审查范围内。

搜索框仅筛选本站入口，按 Enter 打开首个可见结果，不把搜索关键词交给外部搜索引擎。
