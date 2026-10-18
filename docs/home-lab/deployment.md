# 部署 Home Lab

[文档首页](../readme.md) · [使用指南](usage.md) · [FAQ](faq.md)

本指南针对 **Cloudflare Workers + KV**。GitHub 保存代码，Cloudflare 执行构建和运行，KV 保存配置；无需在自己的电脑长期运行 Docker 或 Node 服务。

## 连接仓库与 KV

Fork 本仓库，在 Workers & Pages 中创建 Workers 项目并连接 GitHub。已有 Worker 可在构建设置中连接。生产分支为 `master`，自己的 fork 如使用其他分支，应对应选择。默认 Worker 名称是 `home`。

创建 KV 命名空间并复制 32 位十六进制 **Namespace ID**，不要填命名空间名称或账号 ID。

| 构建设置 | 值 |
| --- | --- |
| 根目录 | 仓库根目录，留空或 `/` |
| Build command | `npm ci --ignore-scripts --no-audit --no-fund && npm run build` |
| Deploy command | `npm run deploy` |
| `NODE_VERSION` | 满足 `package.json` engines 的版本，例如 24.15.0 或更高的 24.x；与已验证构建保持一致 |
| `SKIP_DEPENDENCY_INSTALL` | `1`，安装由构建命令执行 |
| `HOME_KV_NAMESPACE_ID` | 自己的 KV Namespace ID |
| `WORKER_NAME` | 可选；目标名称不同于 `home` 时填写 |

`cloud/prepare-deploy.mjs` 生成临时部署配置，把指定命名空间绑定为 `HOME_KV`，不会提交个人 ID 回 GitHub。

## 运行时变量与 Secrets

| 名称 | 类型 | 用途 |
| --- | --- | --- |
| `ADMIN_TOKEN` | Secret，必需 | 管理员登录密码 |
| `OPENWEATHER_API_KEY` | Secret，可选 | 默认 OpenWeather API Key |
| `DASHY_BACKEND_URL` | Variable，可选 | 主机探针后端公开 HTTPS 地址 |
| `DASHY_BACKEND_AUTH` 或 `DASHY_BACKEND_TOKEN` | Secret，可选 | 可选后端认证 |

在 Worker 的 Variables & Secrets 中添加。构建变量和运行时 Secret 是不同设置，不要创建 `VITE_ADMIN_TOKEN` 或把真实密钥写入 YAML；`VITE_*` 变量可能进入前端。

首次部署后确认有 `HOME_KV` 和 `ASSETS` 绑定。配置中的 `keep_vars: true` 用于保留面板变量，更新后仍应核对绑定。

## 自定义域名

在 Domains & Routes 添加 **Custom Domain**，例如 `home.example.com`。Cloudflare 管理的域名可通过该流程处理 DNS 与证书；不要另建冲突的灰云记录。

本仓库没有固定域名或 routes，域名由面板管理。`workers_dev` 默认关闭，需完成自定义域名配置。

总站卡片不改变分站 DNS、路由或认证；分站仍各自管理。

## 登录、保存与更新

部署成功后输入 `ADMIN_TOKEN`，创建分类并添加网站。表单的 **保存** 是编辑预览，最后点击 **保存到云端**，在另一台设备刷新验证。KV 传播可能存在短暂延迟。

提交到生产分支后由 Workers Builds 构建部署。更新前可导出 YAML；每次云端保存前备份上一版，保留最近 20 条目录记录，备份内容保存 30 天。历史记录不代替长期离线备份。

以上自动构建需要先连接 GitHub 与 Workers Builds，并将生产分支指向 `master`。PR 合并只确认代码进入主分支，仍需核对 Cloudflare 构建对应的 SHA、部署结果和生产页面。代码、KV 内容与面板设置分开维护；完整流程和回滚方法见 [维护指南](maintenance.md)。

继承的 Docker、镜像发布等 GitHub Actions 不用于当前 Worker 部署；请查看 Workers Builds 的结果。

## 官方参考

- [Workers Builds](https://developers.cloudflare.com/workers/ci-cd/builds/configuration/)
- [Custom Domains](https://developers.cloudflare.com/workers/configuration/routing/custom-domains/)
- [静态资源绑定](https://developers.cloudflare.com/workers/static-assets/binding/)
- [Secrets](https://developers.cloudflare.com/workers/configuration/secrets/)
