# Kenneth 总站 · Dashy 原版前端 / Cloudflare 云构建版

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

本项目复用 Dashy 前端，后端是 Cloudflare Worker + KV，未运行原版 Node/Express 服务。HTTP、Ping、内网访问等探针选项在“编辑入口 → 探针与内网访问”中保留，并附中文说明；保存时不再把启用标志改成 false。当前这些功能尚未接入，浏览器不发起探针请求、不显示在线状态、不自动切换内网地址。

小组件已恢复添加、编辑、删除与排序入口，当前启用时钟、图片、嵌入网页三种。其余原版组件的源码和已存配置保留，但显示“尚未接入”提示，不加载 API、不假装有监控数据。`cloud/capabilities.mjs` 是前后端共用的能力列表；后续必须先实现数据接口，再开启对应能力。单纯把开关改成 true 不会实现探针后端。
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
5. 触发构建。成功后确认绑定有 **HOME_KV** 和 **ASSETS**，并检查 Domains & Routes 中的总站域名。此项目未声明 route/routes 且 workers_dev=false，继续由面板管理域名。
6. 打开总站，输入管理员密码。首次空白首页点击“开始添加网站”，添加分类和网站。表单“保存”暂存编辑，最后点击“保存到云端”。

Cloudflare 的 GitHub 应用和当前 ChatGPT 的 GitHub 连接是两项授权；如果 CF 面板看不到 dashy，请在 CF 的仓库连接流程授权该仓库。
Fork 原版附带的 Docker、文档发布和其他 GitHub Actions 不用于此 Worker 部署，无需启用它们；实际构建由 Cloudflare Workers Builds 完成。

## 小分类与图标

添加入口时，选择“网站”或“小分类”。小分类填名称，点击“＋ 添加网站”，组内每个网站填写名称与完整网址。进入编辑模式后，小分类标题旁有“编辑小分类”。

图标支持 Dashy 原生形式：`si-jellyfin`、`si-github`、`si-cloudflare` 等 Simple Icons，emoji，及 HTTP/HTTPS 图片地址。部分第三方图标来源依赖其 CDN 可用性。自定义图片使用你有权使用的资源。页面自身打包了像素机甲标识，并保留 Dashy 原版字体；中文额外提供 Noto Sans SC，字体许可证见 src/assets/fonts/NotoSansSC-LICENSE.txt。

## 探针设置的用途

| 原版选项 | 功能 | 当前 CF 版 |
| --- | --- | --- |
| HTTP 状态检测 | 请求网站或 /health 接口，按返回状态码显示状态；可设置检测间隔 | 设置可保存，检测服务待接入 |
| 检测地址 | 用专用健康接口代替网站主页，卡片跳转地址保持原值 | 设置可保存 |
| 接受的状态码 | 为登录页、跳转页等指定额外成功码，如301或401 | 设置可保存；401只表示接口响应，不证明业务正常 |
| 请求头 | 原版可给健康接口附认证或其他请求头 | 设置可保存；真实秘密应放运行时 CF Secrets，后续用专用接口读取 |
| 重定向次数 / 忽略 TLS 错误 | 原版请求的重定向与证书策略 | 设置可保存；Worker 未实现这些策略 |
| Ping | ICMP 连通性、延迟；主机能 Ping 通不等于网页正常 | 需独立探针服务或监控服务 API |
| 内网网址 / 超时 / 检测间隔 | 原版从当前浏览器探测 LAN 地址，成功后优先打开内网入口 | 设置可保存；自动切换待接入 |

检测间隔使用秒，超时使用毫秒；0通常表示仅页面加载时检测或沿用原版默认值，详见表单提示。当前设置仅预留，未在用户关闭页面后持续监控。后续若实现页面内 HTTP 检查，和24小时监控仍是两回事；持续监控可使用现有 Uptime Kuma 等服务。

## 添加小组件

1. 进入“编辑网站”，在目标分类中点击“添加小组件”。需要分类时先“添加分类”。
2. 选择类型，按表单设置，点击“保存”查看预览。
3. 最后点击“保存到云端”；修改会写入现有 KV，不会添加示例卡片或重置已有网站。

| 当前类型 | 设置方式 | 注意事项 |
| --- | --- | --- |
| 时钟 | 时区可填 Asia/Shanghai；语言可填 zh-CN；可选择12/24小时 | 使用设备时间，无需第三方请求或 API Key；可添加多时区时钟 |
| 图片 | 填 HTTPS 图片地址或本站资源路径；可设置刷新间隔 | 可显示监控服务导出的图表快照；远程图片可用性取决于源站 |
| 嵌入网页 | 填 HTTPS 网页地址，设置80至1200像素高度 | 对方 CSP / X-Frame-Options 必须允许嵌入；拒绝连接时改用普通网站卡片 |

小组件显示在首页与分类页；专注视图保持网站导航。编辑模式下可通过组件右上角按钮修改、删除，拖动排序。默认不自动添加任何小组件。

原版还有天气、RSS、ICS日历、CPU/内存/磁盘/网络、Uptime Kuma、Pi-hole、AdGuard、Proxmox与自定义 API 等。API 型组件需要提供对应服务地址、接口授权和返回格式；跨域接口可能需要后端代理。这里没有移植通用 cors-proxy，也没有实现原版 DASHY_ 环境变量替换，所以不能直接勾 useProxy 或填变量名期待它生效。后续优先按明确服务做专用、受登录保护的 Worker 接口，敏感 Key 放 CF 运行时 Secrets，前端只取展示数据；局域网监控还需有能访问内网的采集服务。所有配置都会发给已登录的浏览器，因此不要把需要对浏览器保密的 Cookie/Token 写入组件 options。

原版说明：https://dashy.to/docs/widgets/ 与 https://dashy.to/docs/status-indicators/。

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

新增功能也通过了探针设置保存后原值保留且不发请求、时钟/图片/网页添加与取消编辑、刷新恢复、删除、非法时区/网址拦截，以及320至1440像素页面和弹窗验证。

测试使用隔离的内存/本地 KV 与测试密码；预览卡片和小组件仅来自测试数据，不包含在默认配置中，没有写入线上 KV。源码提交后由已配置的 Cloudflare Workers Builds 执行部署；测试未代替线上构建结果确认。桌面与手机验证使用 Chromium，尚未在真实 Windows、iPhone Safari 上逐项实测。

Cloudflare 官方参考：
- https://developers.cloudflare.com/workers/ci-cd/builds/configuration/
- https://developers.cloudflare.com/workers/ci-cd/builds/build-image/
- https://developers.cloudflare.com/workers/static-assets/binding/
- https://developers.cloudflare.com/workers/wrangler/configuration/

## 布局与图标（2026-10-06）

四种布局共享容器尺寸计算，分类列数会受实际宽度限制。垂直布局每个分类一列卡片并自动换行；水平布局逐行显示分类；自动布局使用规整网格；瀑布布局按分类内容高度紧凑排列。卡片的小、中、大尺寸独立适配，每个分类手动设置的列数也会在窄屏收缩。

Home Lab 图标目录位于 `public/portal-icons/`。QX 品牌图标从 [QX-icons](https://github.com/chenran71ran-oss/QX-icons) 镜像，来源路径及 Git SHA 记录在 `qx-sources.json`；其他品牌 SVG 来自项目已有 Simple Icons，Dashy 使用原项目标识。图标在本站加载，正常访问不依赖 GitHub。品牌及商标属于各自权利人。

新增网站默认 `icon: auto`：先按域名或明确品牌名称匹配 QX/内置目录，再读取网站公开首页声明的图标，最后尝试 `/favicon.ico`；获取失败显示首字。前端只向登录保护的 `/api/icon-discovery` 发送网站 origin，不带书签路径、订阅 token 或 Referrer。Worker 不转发总站 Cookie、授权头或第三方登录信息，只读取公开 HTTPS 页面；不能代替用户登录网站。手动图片地址保持优先，不修改网站网址和登录信息。旧的通用占位图标对已识别品牌自动替换显示，不改 KV 的原始数据。选择器支持 `portal-chatgpt` 等 ID、原有 `si-`、emoji 和图片网址。

“读取网站图标”可在新增/编辑入口时主动读取网站的 `rel=icon` 或 `apple-touch-icon`，将图标地址写入当前草稿；最后仍需“保存到云端”。默认自动模式也会读取。网站使用非标准图标路径时无需另写脚本。浏览器按域名合并重复读取，缓存10分钟；Worker 的抓取限制为6.5秒、64 KiB HTML、最多两次重定向，并验证公开 DNS 地址。只返回图标网址，不提供通用代理、不下载用户数据。遇到登录页、验证码、访问限制、内网或自定义端口时仍可选择图库或手动填写图片地址。远程图标是否可显示取决于源站；不会执行抓取页面的脚本。

维护图标可运行 `node scripts/sync-portal-icons.mjs` 后提交资源；仅用于更新已收录的 QX 图标，用户添加网站不需要运行脚本。

新高达使用用户提供图片编辑后的透明 PNG：`public/mech/blue.png` 和 `public/mech/red.png`。内置 imagegen 编辑提示为“保留像素头像及轮廓，去除蓝底，保留透明；红色版本只将蓝色装甲改为深红、青色眼睛改为战斗红眼”。配色由当前主题实际主色、饱和度与背景明暗连续计算，支持红、橙金、绿、青、蓝、紫及银灰，也跟随自定义颜色；红色系使用红眼资源。Nord 系使用其分类配色，因为原版主色是中性的文字色。浏览器标签同步输出同一配色的64像素 PNG，保留透明像素；无需依赖 Canvas.filter。登录页及总站/专注/工作台共用标识，自定义 logo 保持优先。

顶部取消副标题，头像与 Home Lab 水平居中对齐。网站卡片沿用 Dashy 的标题和图标顺序：三种尺寸均为上方文字、下方图标，分别调整字号、图标尺寸、间距和最小高度。名称可换行，卡片随内容增高；圆角更柔和，保留主题颜色与卡片背景。垂直布局每个分类一列；其余布局按分类实际宽度填充卡片。添加网站采用独立、占满整行的按钮，不再作为示例网站卡片参与排序。移除主题施加给图片/SVG/emoji 的阴影、滤镜和图标圆角裁剪；图源本身包含的背景或阴影仍需改用更干净的图源。

验证命令：`node --test tests/*.test.mjs`、`npm run build`。测试包括域名与私密网址处理、公开图标元数据读取/重定向/失败回退、接口登录和来源保护、连续主题配色及标签矩阵。浏览器回归覆盖布局、长标题、整行添加按钮、图标预览、主动读取和原有编辑保存/小组件流程；使用隔离数据，不向线上 KV 写入测试卡片。
