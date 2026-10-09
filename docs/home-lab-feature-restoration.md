# Home Lab 功能与 CF 部署

本次在现有 Home Lab UI 上恢复 Dashy 功能。Home Lab 标题、高达主题联动、网站卡片、图标库、主题收藏、手机端工具栏与时间/天气样式继续保留。

## 三种视图

| 视图 | 行为 |
| --- | --- |
| 总站 `/` | 当前分类卡片、小分类与小组件，保留布局和尺寸选项。 |
| 专注 `/minimal` | 居中标题和搜索、可横向滚动的分类标签；显示当前分类的网站与小组件，搜索时跨分类查找。 |
| 工作台 `/workspace` | 左侧导航、右侧网页或小组件区域。选择“工作台内打开”可嵌入网页；配置 `enableMultiTasking: true` 可保留已打开网页。网站自己的打开方式优先。 |

对方网站如果禁止 iframe 嵌入，工作台无法绕过其策略；可将该网站设为新标签页。

## 已恢复的功能

- 全部 94 种上游小组件与原版类型别名；组件参数、刷新间隔、超时、代理、错误提示等选项。
- 网站 HTTP 检测、内网地址探测、全部网站打开方式、快捷键、别名和高级字段。
- 多页面及独立 KV 配置文件；本地保存、YAML 导入/导出、CF 云端保存。
- Font Awesome、Material Design Icons、网页搜索、更新检查等遵循配置，不再强制覆盖。
- 可选 PWA，只有 `enableServiceWorker: true` 时注册。静态资源可以缓存，登录/API/配置请求走网络，私有 KV 配置不进入 Service Worker 缓存。
- 每次云端保存前自动备份该文件上一版，保留最近 20 条目录记录、备份 30 天。配置面板的备份页可以下载或载入编辑预览，再手动保存。

原有明确关闭的设置保持原值，恢复的是开启和运行能力；不会擅自打开所有探针或修改收藏的网站。

## 小组件与数据来源

添加小组件后，选择类型并按 [上游文档](https://dashy.to/docs/widgets/) 填写参数。公共 API、RSS、日历等可直接请求；跨域受限的接口可打开“使用 CF 服务端代理”。Pi-hole、Proxmox、Uptime Kuma 等需要用户提供相应服务的地址与认证；恢复类型不代表已有这些服务。

密钥可放在 CF Secrets 中，用 `DASHY_` 开头的占位符填写配置，然后打开代理。代理会在服务端解析占位符，且不会把总站会话 Cookie 转发给数据服务。公共 Worker 代理校验目标域名及重定向，不访问私有 IP。浏览器直接访问内网地址仍取决于浏览器和网络环境。

天气保留武汉、青岛、武昌、黄岛的已有坐标与一位小数显示，同时支持原版城市名、城市 ID、经纬度。默认使用现有 `OPENWEATHER_API_KEY` Secret，也可以指定其他密钥占位符。

## 主机侧后端（可选）

普通 HTTP 检测与公开 API 代理直接由 CF Worker 执行，无需新增服务器。

以下功能的真实数据需要主机侧后端：

- ICMP Ping：上游由 Node 后端运行 `pingman`。
- `system-info`：上游读取运行 Dashy 的主机 CPU、内存、负载及运行时间。
- 忽略 TLS 证书验证：由支持该选项的独立后端执行。

可连接一套已有 Dashy Node 后端或兼容的探针服务，在 CF 设置：

| 类型 | 名称 | 内容 |
| --- | --- | --- |
| Variable | `DASHY_BACKEND_URL` | 后端公共 HTTPS 地址，例如 `https://probe.example.com`，需提供 `/ping-check`、`/system-info` 等相应接口。 |
| Secret | `DASHY_BACKEND_AUTH` | 后端需要的完整 Authorization 值，如 `Basic …`。 |
| Secret | `DASHY_BACKEND_TOKEN` | 若未设置上项，用该 Token 发送 `Bearer …`。 |

未接入时，Ping 显示“需要接入后端”而不会伪造离线或延迟；系统信息显示具体配置提示。主机侧服务不会由本项目自动创建。当前管理员登录继续使用已有 `ADMIN_TOKEN`。

## 多页面

在编辑模式的“页面”入口添加名称与文件路径，例如 `work.yml`。保存云端后，新的本地路径会创建一个空白配置文件。切换页面后独立添加分类并保存，子页面保存不会覆盖总站。原版远程 HTTPS YAML 页面也可以读取，但不能写回外部网站。

## 验证

```sh
node --test tests/cloud-functions.test.mjs tests/cloud-ui-sync.test.mjs tests/icon-discovery.test.mjs
npx vitest run tests/components/feature-restoration.test.js tests/components/widgets/widget-adaptation.test.js tests/components/editor/color-icons.test.js tests/unit/config-helpers.test.js tests/unit/search.test.js
npm run build
```

测试覆盖配置选项保留、全部组件目录、三视图行为、多任务切换、编辑参数、分页面保存与备份、服务鉴权、HTTP 状态、代理密钥解析、私有地址和跨域重定向，以及天气坐标兼容。
