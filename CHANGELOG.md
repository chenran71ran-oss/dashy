# Home Lab 变更日志

[项目首页](README.md) · [完整提交索引](docs/home-lab/history.md) · [维护与回滚](docs/home-lab/maintenance.md)

此日志记录本 fork 的定制工作。日期按 Asia/Shanghai；条目依据真实 GitHub 提交整理，合并日期与开发日期分别标注。不为已有改动重新制造旧提交，也不将包版本 `4.7.17` 当作本 fork 的发布编号。代码已合并不代表对应版本已完成线上部署。

## 2026-10-23 · 统一网站编辑弹窗与工作台编辑入口

- 网站编辑弹窗不再固定为单列：桌面并排显示名称/网址、说明/打开方式，图标选择器保留整行；手机及缩窄的弹窗自动改为单列。
- 总站、专注模式共用同一套弹窗与配置草稿。工作台进入编辑模式时复用总站编辑界面，提供网站编辑和保存栏，退出后恢复此前选择的网站或组件。
- 使用方式与保存边界见[使用指南](docs/home-lab/usage.md)。线上视觉效果仍需登录后验收。

## 2026-10-19 · 修复打开总站时的分站认证弹窗

- 修正远程图标代理失败后的浏览器重试：云端跨源图片及编辑预览均使用匿名 CORS 加载，避免受保护 favicon 自动触发 HTTP 身份验证。
- 内置 Paperless-GPT 官方图标供 Paper-LLM 自动识别和失败回退，保留上游来源及 MIT 许可。
- 不取消分站登录验证，不改动网站地址和手工图标配置。[原因及验证范围](docs/home-lab/icon-auth.md)。

## 2026-10-18 · 删除专注卡片放大功能

- 按用户反馈删除 PR #6 的悬停放大、卡片高度展开及绝对定位浮层，清理对应动画和状态代码。
- 卡片保持等高与英文说明截断，恢复原有文字提示查看全文；保留主题切换即时反馈、菜单整行高亮及配色联动。

## 分支测试 · 2026-10-18 主题切换菜单配色

- 将悬停、键盘聚焦及选中背景应用到整行，完整覆盖主题名称与收藏星标；收藏仍为独立操作。
- 菜单、搜索框、按钮、提示、滚动条与高亮改用当前主题派生配色，处理透明面板，并为文字及焦点保留对比度。
- 新增全部 54 个内置主题的菜单配色自动检查；[实现与验证说明](docs/home-lab/theme-selector.md)。分支未合并，真实视觉效果待复核。

## 分支测试 · 2026-10-18 专注悬停与主题切换

- 默认保留专注卡片等高与英文说明两行截断；鼠标悬停或键盘聚焦时，原链接卡片轻微放大并展开完整说明，原网格单元保持尺寸。超长说明可在卡片内滚动，移出后收回；没有新增按钮或对话框。
- 高度变化使用 180ms 动画，快速移入移出会取消旧动画；遵循减少动态效果的系统设置。
- 云端主题选择先即时预览，后台完成共享保存；保存失败撤销预览，保留已确认的跨设备主题。同步期间保留写入保护与提示。
- 避免内置主题切换时先清空主题再设置、重复写入相同颜色；切换的两帧暂停过渡，避免大量 `transition: all` 同时动画布局。
- 此条目记录分支方案，真实浏览器流畅度及手机效果仍需复核，不代表已部署。

## 2026-10-18 · 回退专注模式额外交互，保留说明截断

- 按用户反馈回退 PR #4 的说明按钮、对话框、专属浮层及主题/卡片外观改动，恢复原有悬停交互和主题样式。
- 仅在专注视图截断超出的英文说明（大卡片最多两行），用等高网格和铺满单元格的链接保持卡片对齐；小/中尺寸延续原有不展示行内说明的设计。
- 不改写历史提交，使用回退及修正提交保留可追踪记录；真实浏览器视觉效果由用户本地复核。

## 2026-10-18 · 登录界面布局确认与合并

- 补齐此前 48 条定制提交的中文历史索引，更新双语 README、主题同步说明与维护/回滚文档。该项属于当日文档整理，不改写早期提交。
- 手机端将像素高达、品牌、标题和主要按钮居中，页脚紧随表单组成同一内容组。
- 桌面收紧左右栏的宽度和间距，删除“使用管理员密码登录 Home Lab”的重复说明。
- [e0a8205](https://github.com/chenran71ran-oss/dashy/commit/e0a8205342b6a96463f929a1ce542a4c606b5f27) 完成布局调整，[PR #2](https://github.com/chenran71ran-oss/dashy/pull/2) 经确认合并；合并提交 [71db6db](https://github.com/chenran71ran-oss/dashy/commit/71db6db2ff5ea43ad9ce1c387b425e84665923a2)。

## 2026-10-17 · 登录主题共享与图标可靠性

### 登录与主题

- 登录页复用总站的页面、内容卡片和强调色，背景加入柔和主题色光；保留原密码验证方式。
- 正常浏览模式选择的内置主题，以及保存/重置的自定义配色，写入根配置供电脑、手机和分页面共同读取；旧浏览器设置不会覆盖共享外观。
- 新增受限的匿名外观读取接口与鉴权主题保存接口；添加错误处理、忙碌状态、密码显示与聚焦刷新。
- 修复独立预览打包残留 `process` 变量导致的空白页。设计预览拦截请求，不提交真实密码；预览工具栏不进入部署组件。
- 主要提交：[9410df7](https://github.com/chenran71ran-oss/dashy/commit/9410df7162d2e5fb1f39d968651e693b7930f687)、[c443e5a](https://github.com/chenran71ran-oss/dashy/commit/c443e5a24b507edb7ba110822e961585db9c25df)、[44ffedc](https://github.com/chenran71ran-oss/dashy/commit/44ffedc19f5f9f17054cc7c420340ff688b63f2f)；次日经 PR #2 合并。

### 图标

- 改进带应用路径的公开网站图标发现、抓取失败处理和卡片/编辑预览/工作台等路径的一致显示。
- 强化已验证图片、缓存与回退的处理，避免失败结果误报为成功，保留手工图标选择。
- 提交 [666940e](https://github.com/chenran71ran-oss/dashy/commit/666940e53238fba3f8afd614b2b8ced5fb0e49fe)、[bc06391](https://github.com/chenran71ran-oss/dashy/commit/bc06391cf6ecb6a69f7a5286c4d52849ac74bbfb)，经 [PR #1](https://github.com/chenran71ran-oss/dashy/pull/1) 合并为 [0fdefbd](https://github.com/chenran71ran-oss/dashy/commit/0fdefbdff9c01c10228ef1acc57118fb4cd5a481)。

## 2026-10-14—15 · DeepSeek 图标及部署重试

- 使用核验的内置 DeepSeek 图标资源，完善网站拒绝访问时的 HTTP 提示：[f492203](https://github.com/chenran71ran-oss/dashy/commit/f49220340490487a7826d374fe66b0600a54a793)。
- 增加已验证图标修复的 Cloudflare 部署重试提交：[6c30411](https://github.com/chenran71ran-oss/dashy/commit/6c3041107ac7d3940a857303e367379e992443eb)。重试提交本身不作为部署成功证明。

## 2026-10-11—12 · 应用图标与双语文档

- 支持当前应用路径、相对地址、PWA 清单，以及以下载响应返回的有效 favicon；增加可识别 Komari 页面的核验图标回退。
- 增加 NodeSeek 官方资源回退，清理良心云标识的背景与显示。
- 整理中英文 README 和 Cloudflare 专项指南，突出中文本地化、前端布局与移动适配工作。
- 完善状态动画、核验图标和指标布局，并移除验证用临时公开页面。
- 代表提交：[8815975](https://github.com/chenran71ran-oss/dashy/commit/881597585b4fbc34944cf76661ceb31866e2fc79)、[a660a5a](https://github.com/chenran71ran-oss/dashy/commit/a660a5a814cfdd39b8d5f3738ab643bc107a4f6b)、[6c668d6](https://github.com/chenran71ran-oss/dashy/commit/6c668d6a78d080409cf61a30c3e4672af11b8eca)、[2b7f317](https://github.com/chenran71ran-oss/dashy/commit/2b7f317a6ce0738743b2f2cf7163e78e6c26a1d0)。

## 2026-10-08—09 · 三视图、小组件与响应式修复

- 恢复 Dashy 配置与组件能力，同时保留 Home Lab 的 UI 定制。
- 修复专注与工作台的小组件布局、主题样式和键盘操作，增加小组件中文说明。
- 小组件适配尺寸、布局、容器宽度与主题；统一时钟天气的信息组织，加入 329 个分类彩色图标。
- 调整手机标题/搜索比例、44px 配置触控入口、主题对比度与检测成功状态动画。
- 临时布局检查页面在验证后移除，不作为产品入口。
- 代表提交：[ebef247](https://github.com/chenran71ran-oss/dashy/commit/ebef24716ccf9f0e716599f09dfbf979dc9c0d6b)、[c7971e7](https://github.com/chenran71ran-oss/dashy/commit/c7971e73ac1e7a440b9ca5fcaf268da2037f01c4)、[ed4ac22](https://github.com/chenran71ran-oss/dashy/commit/ed4ac22df34921e12de4fc6d1ad5ed5dfe97b4cb)、[211c15f](https://github.com/chenran71ran-oss/dashy/commit/211c15f7da6d7bc7259c2ab8ac34dd9b2e49c065)。

## 2026-10-07 · 工具栏、天气和图标回退

- 保留图标手动选择，修复图标选择器重复项、移动搜索对齐及标题大小写。
- 调整主题菜单可读性、响应式工具栏与收藏/图标同步；图标服务失败时尽量保留品牌标识。
- 恢复不同尺寸的卡片排版与移动端全宽工具栏。
- 接入服务端 OpenWeather 密钥，增加武汉/青岛及武昌/黄岛地点，修复 Worker 重定向兼容问题；温度保留一位小数并显示来源时间/坐标。
- 对齐时钟和天气组件的边框与响应式数值行。
- 代表提交：[100151d](https://github.com/chenran71ran-oss/dashy/commit/100151d11ef74fad5bb167a40a7ee770238819a5)、[5d27c52](https://github.com/chenran71ran-oss/dashy/commit/5d27c528c3b5cb61e82911e5d4e11add4a8ba0b3)、[a098a86](https://github.com/chenran71ran-oss/dashy/commit/a098a86d139610bffab744b48ebc6566ffef9cd5)、[2d05b03](https://github.com/chenran71ran-oss/dashy/commit/2d05b03623df209278e5866d562054af99e67b11)。

## 2026-10-06 · Cloudflare 版本起点与 Home Lab 定制

- 以 Dashy `4.7.17` 为基础加入 Worker 入口、KV 配置与管理员密码认证。
- 改造导航、图标选择器、编辑器和响应式视图，保留探针设置并恢复基础组件。
- 增加 QX 品牌图标、分类图标资源、收藏主题选择与随主题变化的像素机甲标识。
- 完善卡片布局、图标元数据回退和图标 DNS 检查的重定向处理。
- 起点提交：[7307663](https://github.com/chenran71ran-oss/dashy/commit/7307663279feff50a932988f49833ba52a1a4c27)；上游基础：[988b466](https://github.com/chenran71ran-oss/dashy/commit/988b466dd585131096ae990aab4eb98175c5bd16)。

## 运维补记：代码之外的变更

2026-10-17 的维护会话完成总站向 `home.chenran71ran.cc` 子域名迁移，并验证旧根域名的 GET/HEAD 请求以 301 保留路径与查询参数跳转。该操作属于 Cloudflare 的域名和重定向规则，不对应单独的 Git 代码提交。本条记录的是当时的验证结果，不作为后续线上状态证明。

运行时 Secrets、KV 网站配置与 Cloudflare 域名规则不自动进入 Git。今后操作按 [维护指南](docs/home-lab/maintenance.md) 分别留下代码 SHA、构建结果与运维说明，敏感值不写入公开文档。
