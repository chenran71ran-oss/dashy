# Home Lab 提交历史索引

[项目首页](../../README.md) · [变更日志](../../CHANGELOG.md) · [维护指南](maintenance.md)

本页于 2026-10-18 根据 GitHub `master` 的真实提交回溯整理。范围从最初的 Cloudflare 定制 `7307663` 到登录页合并 `71db6db`，共 48 条记录（含合并提交），不计本轮文档整理自身。下列日期取 GitHub 提交作者时间并换算为 Asia/Shanghai，按仓库历史的新到旧顺序排列。

中文说明是对已有提交的补记；链接保留真实 SHA、原始作者、时间和 diff。上游 Dashy 的更早历史仍保留在仓库中，本索引不重复收录。本地浅克隆、旧工作分支或等价但 SHA 不同的本地提交，不用于替代 GitHub 主分支记录。

| 日期（上海） | GitHub 提交 | 中文变更摘要 |
| --- | --- | --- |
| 2026-10-18 | [`71db6db`](https://github.com/chenran71ran-oss/dashy/commit/71db6db2ff5ea43ad9ce1c387b425e84665923a2) | 合并 PR #2：主题联动登录页、共享外观和响应式布局 |
| 2026-10-18 | [`e0a8205`](https://github.com/chenran71ran-oss/dashy/commit/e0a8205342b6a96463f929a1ce542a4c606b5f27) | 手机登录居中、页脚随表单布局并收紧桌面间距 |
| 2026-10-17 | [`44ffedc`](https://github.com/chenran71ran-oss/dashy/commit/44ffedc19f5f9f17054cc7c420340ff688b63f2f) | 共享总站主题与配色，调整登录背景及内容卡片 |
| 2026-10-17 | [`c443e5a`](https://github.com/chenran71ran-oss/dashy/commit/c443e5a24b507edb7ba110822e961585db9c25df) | 修复独立登录预览中 Node 全局变量导致的空白 |
| 2026-10-17 | [`9410df7`](https://github.com/chenran71ran-oss/dashy/commit/9410df7162d2e5fb1f39d968651e693b7930f687) | 新增主题联动登录组件、外观接口和独立预览 |
| 2026-10-17 | [`0fdefbd`](https://github.com/chenran71ran-oss/dashy/commit/0fdefbdff9c01c10228ef1acc57118fb4cd5a481) | 合并 PR #1：网站图标可靠性修复 |
| 2026-10-17 | [`bc06391`](https://github.com/chenran71ran-oss/dashy/commit/bc06391cf6ecb6a69f7a5286c4d52849ac74bbfb) | 修复多个应用路径中的图标发现与一致渲染 |
| 2026-10-17 | [`666940e`](https://github.com/chenran71ran-oss/dashy/commit/666940e53238fba3f8afd614b2b8ced5fb0e49fe) | 修复公开商店应用的运行时图标发现 |
| 2026-10-15 | [`6c30411`](https://github.com/chenran71ran-oss/dashy/commit/6c3041107ac7d3940a857303e367379e992443eb) | 触发已验证 DeepSeek 图标修复的 Cloudflare 部署重试 |
| 2026-10-14 | [`f492203`](https://github.com/chenran71ran-oss/dashy/commit/f49220340490487a7826d374fe66b0600a54a793) | 核验并内置 DeepSeek 图标，完善 HTTP 拒绝访问提示 |
| 2026-10-12 | [`2b7f317`](https://github.com/chenran71ran-oss/dashy/commit/2b7f317a6ce0738743b2f2cf7163e78e6c26a1d0) | 使用 NodeSeek 官方资源并清理良心云标识 |
| 2026-10-12 | [`21a129b`](https://github.com/chenran71ran-oss/dashy/commit/21a129b3bb15e0172a9b98713d0ed035b2ed478d) | 文档突出中文本地化、前端重构与响应式工作 |
| 2026-10-11 | [`51169c6`](https://github.com/chenran71ran-oss/dashy/commit/51169c6aec345742342818f2b12e0c061d72ca78) | 整理双语 README 和本 fork 的 Cloudflare 指南 |
| 2026-10-11 | [`6c668d6`](https://github.com/chenran71ran-oss/dashy/commit/6c668d6a78d080409cf61a30c3e4672af11b8eca) | 为可识别 Komari 页面增加核验图标回退 |
| 2026-10-11 | [`a660a5a`](https://github.com/chenran71ran-oss/dashy/commit/a660a5a814cfdd39b8d5f3738ab643bc107a4f6b) | 通过图片签名识别下载响应形式的有效 favicon |
| 2026-10-11 | [`8815975`](https://github.com/chenran71ran-oss/dashy/commit/881597585b4fbc34944cf76661ceb31866e2fc79) | 修复带路径的网站图标发现与 PWA 清单图标 |
| 2026-10-11 | [`9f4eefb`](https://github.com/chenran71ran-oss/dashy/commit/9f4eefb5bb1d09d8b0d93ef7393a1fd9067018b3) | 移除临时公开的小组件布局检查页 |
| 2026-10-11 | [`56bf466`](https://github.com/chenran71ran-oss/dashy/commit/56bf466f183165c15e10475be2b9e487a2642405) | 使用当前组件作用域刷新静态布局验证资源 |
| 2026-10-11 | [`a2b4e65`](https://github.com/chenran71ran-oss/dashy/commit/a2b4e65c36c7fa01b6c671f14570c770f70f416c) | 修复探针动画一致性、核验图标与指标组件对齐 |
| 2026-10-09 | [`314bb93`](https://github.com/chenran71ran-oss/dashy/commit/314bb9355712dbd153a62dcefc6b1911065161ff) | 完成检查后移除临时响应式验证页面 |
| 2026-10-09 | [`a84c6b2`](https://github.com/chenran71ran-oss/dashy/commit/a84c6b2c55e412deb7417e67cfc9c20cf3d4c42d) | 添加脱敏的响应式布局检查资源 |
| 2026-10-09 | [`bc0da58`](https://github.com/chenran71ran-oss/dashy/commit/bc0da58b0d780dc8b1395dce4d22d216308927c9) | 修复手机标题/搜索比例、主题控件对比及成功状态动画 |
| 2026-10-09 | [`3066710`](https://github.com/chenran71ran-oss/dashy/commit/30667107911a791c950cfa441144247a633ceee0) | 保持手机搜索工具栏配置按钮 44px 触控尺寸 |
| 2026-10-09 | [`bd80a38`](https://github.com/chenran71ran-oss/dashy/commit/bd80a38ec41f4775527078b3325f95084a50609e) | 保留工作台主题和键盘操作，清理临时检查页 |
| 2026-10-09 | [`211c15f`](https://github.com/chenran71ran-oss/dashy/commit/211c15f7da6d7bc7259c2ab8ac34dd9b2e49c065) | 修复专注/工作台组件布局并补充中文用途说明 |
| 2026-10-09 | [`ed4ac22`](https://github.com/chenran71ran-oss/dashy/commit/ed4ac22df34921e12de4fc6d1ad5ed5dfe97b4cb) | 恢复 Dashy 能力并保留 Home Lab 的界面定制 |
| 2026-10-08 | [`c7971e7`](https://github.com/chenran71ran-oss/dashy/commit/c7971e73ac1e7a440b9ca5fcaf268da2037f01c4) | 统一时钟天气信息布局，加入 329 个分类彩色图标 |
| 2026-10-08 | [`ebef247`](https://github.com/chenran71ran-oss/dashy/commit/ebef24716ccf9f0e716599f09dfbf979dc9c0d6b) | 组件适配尺寸、布局、容器宽度与主题配色 |
| 2026-10-08 | [`4bfbaa0`](https://github.com/chenran71ran-oss/dashy/commit/4bfbaa0458f8db81de7f6162755c11b26dd260e7) | 收紧时钟天气边框，将组件操作保留在内部 |
| 2026-10-07 | [`2d05b03`](https://github.com/chenran71ran-oss/dashy/commit/2d05b03623df209278e5866d562054af99e67b11) | 对齐时钟天气组件边框与响应式数值行 |
| 2026-10-07 | [`9482019`](https://github.com/chenran71ran-oss/dashy/commit/94820198aa49c443d81305235ef9946e142f8663) | 天气保留一位小数，显示来源时间与坐标 |
| 2026-10-07 | [`058be44`](https://github.com/chenran71ran-oss/dashy/commit/058be4407565a68aa6445ffde6b6672bbfd33bbd) | 修复 Cloudflare Worker 天气抓取的重定向兼容 |
| 2026-10-07 | [`7456e34`](https://github.com/chenran71ran-oss/dashy/commit/7456e34090d3bead408783beda0b46e3aca5e82d) | 增加武昌、黄岛天气地点 |
| 2026-10-07 | [`a098a86`](https://github.com/chenran71ran-oss/dashy/commit/a098a86d139610bffab744b48ebc6566ffef9cd5) | 使用服务端 OpenWeather 密钥接入武汉和青岛天气 |
| 2026-10-07 | [`e0eddc2`](https://github.com/chenran71ran-oss/dashy/commit/e0eddc20a242ee616f35d10313694376c337cc6a) | 恢复按尺寸区分的卡片布局与移动端全宽工具栏 |
| 2026-10-07 | [`42ab885`](https://github.com/chenran71ran-oss/dashy/commit/42ab885349380b8462a7391b5f04db7f186241af) | 图标服务抓取失败时保留可用品牌标识 |
| 2026-10-07 | [`5d27c52`](https://github.com/chenran71ran-oss/dashy/commit/5d27c528c3b5cb61e82911e5d4e11add4a8ba0b3) | 统一响应式工具栏控件及收藏、图标同步 |
| 2026-10-07 | [`d0d03e3`](https://github.com/chenran71ran-oss/dashy/commit/d0d03e385f4e3080da3fb08d4da0baee246b2917) | 修复移动搜索对齐、标题大小写和主题选择可读性 |
| 2026-10-07 | [`100151d`](https://github.com/chenran71ran-oss/dashy/commit/100151d11ef74fad5bb167a40a7ee770238819a5) | 保留手工用途图标并去重图标选择结果 |
| 2026-10-06 | [`ba431e8`](https://github.com/chenran71ran-oss/dashy/commit/ba431e8f8b36644a6898ccc907c03137eb301e10) | 统一 Home Lab 图标、分类资源与收藏主题菜单 |
| 2026-10-06 | [`602e8bc`](https://github.com/chenran71ran-oss/dashy/commit/602e8bc8680e0fa20eecb8cbba284043e78cbe57) | 图标 DNS 检查拒绝不安全重定向 |
| 2026-10-06 | [`5f30b70`](https://github.com/chenran71ran-oss/dashy/commit/5f30b70f27e7781643e2f8aeca65303be9ea23f5) | 中性主题的标识跟随页眉强调色并区分元数据回退 |
| 2026-10-06 | [`4761cdf`](https://github.com/chenran71ran-oss/dashy/commit/4761cdfc9a9c3b0f3e583a1c7d76fe7f09588821) | 调整卡片并同步随主题变化的 Home Lab 标识 |
| 2026-10-06 | [`448274c`](https://github.com/chenran71ran-oss/dashy/commit/448274ca34e0dd4e2745120c988fc3fbf5d9dd35) | 修复响应式布局，加入 QX 品牌图标 |
| 2026-10-06 | [`43119f8`](https://github.com/chenran71ran-oss/dashy/commit/43119f876bf03dfb26d7d1498d5728b09fe026cf) | 保留探针设置，恢复基础 Home Lab 小组件 |
| 2026-10-06 | [`46732eb`](https://github.com/chenran71ran-oss/dashy/commit/46732eb6414abbcbd952cd1cb61fdda78c5df7a2) | 调整导航、图标选择器、编辑器与响应式视图 |
| 2026-10-06 | [`3b41dc0`](https://github.com/chenran71ran-oss/dashy/commit/3b41dc076ec723325123957c35b136fab9338de2) | 记录首次 Cloudflare 构建触发与生产部署设置 |
| 2026-10-06 | [`7307663`](https://github.com/chenran71ran-oss/dashy/commit/7307663279feff50a932988f49833ba52a1a4c27) | 加入 Dashy 风格门户、Cloudflare Worker 和 KV 认证入口 |

## 查阅方式

点击 SHA 查看当次改动；按功能阅读请使用 [变更日志](../../CHANGELOG.md)。在完整克隆中也可运行 `git log --first-parent master` 查看主线，或 `git log --graph --oneline --all` 查看分支与合并关系。浅克隆可能只显示一部分；以 GitHub 提交页和仓库远端为准。

2026-10-17 的总站子域名/301 迁移是 Cloudflare 运维操作，单独记在变更日志的“运维补记”，没有伪造对应代码 SHA。私人网站说明、KV 内容和运行时 Secret 不在本索引中公开。

