# Home Lab 安全说明

适用于本 fork 的 Cloudflare 适配和定制代码；上游规则见 [Dashy 安全政策](https://github.com/Lissy93/dashy/blob/master/.github/SECURITY.md)。

不要在公开 Issue 发布可利用的漏洞细节、实际密钥或私人配置。若仓库已启用 GitHub 私密漏洞报告，通过 Security 页面联系维护者；未启用时先请求私密联系渠道，不公开利用步骤。不承诺固定响应时限。

报告包含 commit、受影响文件、影响和隔离环境复现步骤。只测试自己有权测试的实例。

部署时使用运行时 Secrets，仓库只放公共代码与占位配置。普通配置字段会提供给已登录浏览器。不要把代理改为任意私有 IP 访问、任意认证转发或跳过目标检查。

[架构与数据流](../docs/home-lab/architecture.md)
