# 贡献 Home Lab

先阅读 [架构](docs/home-lab/architecture.md) 与 [功能边界](docs/home-lab/features.md)。

## 报告问题

本 fork 的 Worker、KV、中文 UI 与定制图标问题请提交到 [本仓库 Issues](https://github.com/chenran71ran-oss/dashy/issues)，不要交给上游作者处理。提供系统、浏览器、视图、主题、布局、尺寸和最短复现步骤，截图与配置先脱敏。

## 开发与验证

使用 Node 24：

```sh
npm ci --ignore-scripts --no-audit --no-fund
npm run dev
```

前端开发服务器不等于完整 Worker 环境。登录、KV 和代理需 Worker 测试环境；使用隔离配置，不写入个人生产 KV。

按影响选择检查：

```sh
node --test tests/cloud-functions.test.mjs tests/cloud-ui-sync.test.mjs tests/icon-discovery.test.mjs
npx vitest run tests/components/feature-restoration.test.js tests/components/widgets/widget-adaptation.test.js tests/components/editor/site-icon-read.test.js
npm run build
```

纯文档检查事实、相对链接与示例即可。说明实际执行的检查，不声称未执行的测试通过。

PR 描述具体问题、最终行为、验证和限制。保留上游版权与资源许可，不顺带删除功能或修改用户配置。UI 变更说明桌面/移动端和三视图覆盖。

[安全说明](.github/SECURITY.md) · [上游贡献参考](docs/contributing.md)
