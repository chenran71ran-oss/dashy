# 图标加载与身份验证弹窗

2026-10-19：用户反馈未点击 Paper-LLM，只打开 Home Lab 就出现账号密码框。实际页面的卡片图片来源是 Paperless-GPT 分站的 `/favicon.ico`，并未启用该卡片的 HTTP/Ping 标记。

原因是云端图标代理失败后，原逻辑会让浏览器直接重试远程图片。受 HTTP Basic 身份验证保护的图片可能触发浏览器凭据提示；这与点击网站链接或开启状态检测是两条独立路径。

## 修复

- 代理仍是云端图片的首选路径。浏览器直接回退只允许匿名 CORS 图片请求，在设置 `src` 前应用 `crossorigin="anonymous"`，不携带跨源登录凭据，也不调用凭据式图片回退。
- 编辑器的图标解码预览遵循同一策略。远程图片不允许 CORS 或要求登录时安静失败；不会通过降低分站验证来解决图标问题。
- Paperless-GPT / Paper-LLM 增加上游官方本地图标。自动图标直接使用该资源；已保存的受保护 favicon 失败后也可退回本地品牌图标。
- 手工图标字段、网站链接和登录保护不变。普通非云端部署沿用原有行为。

浏览器的匿名回退需要图片服务器允许 CORS；不允许时使用可用的内置品牌图标或原有缺图回退，不将未经验证的图片误报为可用。

## 上游资源

`public/portal-icons/paperless-gpt.svg` 原样取自 [icereed/paperless-gpt](https://github.com/icereed/paperless-gpt/blob/1d07cedfe83b2a06994d535d2c64e256e6fd8a3e/web-app/src/assets/logo.svg)，提交 `1d07cedfe83b2a06994d535d2c64e256e6fd8a3e`。MIT 许可及 Copyright (c) 2024 Icereed 保留于同目录 `paperless-gpt.LICENSE.txt`。

## 验证范围

自动测试覆盖代理失败后的匿名属性、两次加载失败后的停止、编辑预览属性先于 URL 设置、本地品牌回退及非云端兼容行为。实际页面可确认 Paper-LLM 图标不再直接指向受保护分站。

由于当前浏览器已有分站登录状态，不能以一次无弹窗浏览证明全新未登录环境已经验收；不清理用户保存的凭据来强行重现。最终无凭据环境由用户复核。

HTTP 检测可独立配置，但不等同于自动登录；真实 ICMP Ping 仍需接入 `DASHY_BACKEND_URL` 主机探针。


## 2026-10-26：SparkFlow 与 Access 保护站点

`抖音-续火花` 对应 SparkFlow。匿名首页请求返回 Cloudflare Access 登录重定向；已登录页面未声明真实 favicon。此种站点没有可以匿名抓取的站点图标，不能将登录页图标误认为业务图标。

- 为明确的 SparkFlow 主机添加本地服务图标映射，使用现有 Fluent UI `fire.svg`（既有图标库许可），不冒称官方抓取结果，不把其他包含“抖音”字样的网站误识别为抖音官网。
- 卡片自动匹配与读取按钮共用该服务图标；手动指定的图标仍优先。读取结果明确显示“本地服务图标”。
- 对其他站点，识别 Cloudflare Access 登录重定向，停止抓取登录页并返回 `authentication-required`；编辑器解释需要登录/Access 保护的原因。
- 保持站点认证，不读取或转发访问 Cookie，不引入第三方抓取服务。

本次为已有网站在云端配置中设置该本地图标，并补充英文说明：

> Automatically maintain Douyin chat streaks and track daily sending status.

验证：37 项 Node 图标测试、12 项编辑器/匿名图片策略测试及生产构建通过。新增测试覆盖本地图标免网络返回、前端接受服务图标、Access 重定向不请求登录页。分支：`fix/site-icon-discovery-20261026`。
