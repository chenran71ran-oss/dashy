# 官网图标校准 · 2026-10-28

基线：master `677b7ee`（PR #17）。本次仅校准图标，不修改站点标题、网址或私人云端配置。

## 官网核验

| 站点 | 依据 | 处理 |
| --- | --- | --- |
| ChatGPT | OpenAI 品牌指南明确要求不为 Blossom 增添颜色；OpenAI 官方 cookbook 提供黑白 logomark | 撤销上一版自行添加的绿色，使用官方仓库 SVG；新文件路径避免已缓存绿色资源继续显示 |
| NotebookLM | `https://notebooklm.google/` 当前重定向到 `https://notebook.google/`；页面声明 v6 彩色 favicon | 原样内置官网 512×512 SVG，保留蓝紫配色；兼容旧 `si-notebooklm` 和官网 favicon 配置；不擅自改导航标题 |
| DeepSeek API | `https://platform.deepseek.com/` 声明 `https://fe-static.deepseek.com/platform/favicon.svg`，其中路径填充为 `#000` | 保留 API 官网的黑色鲸鱼，取消主题前景色蒙版，按真实图片呈现 |

特别区别：聊天端 `https://fe-static.deepseek.com/chat/favicon.svg` 及 API 文档 `/img/favicon.svg` 使用 `#4D6BFE`。API 平台 favicon 则为黑色。此处按用户截图的 API 平台校准，不把它与聊天端混用。

## 来源与保真

- OpenAI 指南：`https://openai.com/brand/`。
- ChatGPT SVG：`https://raw.githubusercontent.com/openai/openai-cookbook/a8132ca2f7a5de3a6cf15d9e79d172787b42b697/examples/agents_sdk/deployment_manager/frontend/src/openai-logomark.svg`。不重绘几何；保留 `currentColor`，作为独立图片时默认黑色。
- Notebook SVG：`https://notebook.google/_/static/branding/v6/light_mode/favicon/favicon.svg`，保存原始 SVG；未压缩为低分辨率图片。
- DeepSeek 原有资源与 API 平台返回的 SVG 内容相同（仅末尾换行不同），问题在显示方式，不是鲸鱼几何。
- 黑白品牌图片提供固定白底，避免深色主题把黑色标识吞掉。品牌图片不参与主题滤镜或前景色蒙版；UI 线性图标仍按原方式适配主题。
- 旧 GPT 文件路径也更新为官方图形，兼容旧配置；新目录条目使用 `chatgpt-official.svg`。此前文档中的绿色处理已由本次校准替代。

## 验证范围

检查旧配置迁移、自定义图片保留、Notebook 彩色路径、DeepSeek 图片渲染与白底类别，以及原有缓存、匿名回退和发现验证回归；生产构建通过后提交。没有连接到用户浏览器逐主题验收，不声称完成线上截图对比。
