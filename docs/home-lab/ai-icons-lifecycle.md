# AI 图标与资源生命周期优化

基线：master `422dea5`（PR #16）。本分支未包含其他待合并 PR。

## 图标排查与修复

- GPT、Claude、Gemini 原本已经在图标库中，但使用的是 108 × 108 QX PNG。手工保存的远程官网 favicon 会绕过本地图标；旧 `si-openai` 会触发约 5 MB 的整个 Simple Icons 动态包。
- 三个品牌改用独立 SVG，默认尺寸 512 × 512，缩放不损失矢量清晰度；文件分别约 1.7、2.0、2.8 KB。现有 `portal-*` 和自动匹配直接使用新资源。
- 旧 `si-openai` / `si-chatgpt` 及这三个品牌官网的 favicon、Apple touch icon 地址转为对应内置资源。自定义头像、非官网图片及其他品牌保持原配置。没有读取或修改私人 KV 配置。
- 成功的 `/portal-icons/` 图片响应添加一小时 HTTP 缓存；不设置 immutable，避免固定文件名长期无法更新。404 和 HTML 不应用此策略。前一版的远程代理私有缓存和自动发现缓存仍保留。
- 由于浏览器当前无法连接，尚未核实实际卡片是否使用上述旧配置，不能把源码推断等同于生产抓包结论。

## 内存、任务与进程审查

这是 Vue 前端与 Cloudflare Worker 项目。生产 Worker 的实例调度由 Cloudflare 管理；网页进程与图像解码由浏览器管理，不通过修改 PM2 或添加“清内存”进程来优化。

已检查的清理机制：卡片销毁时清除 HTTP/Ping 定时器、标题动画、ResizeObserver；本地 URL 探测会中止请求并解除 visibilitychange 监听；专注视图销毁时断开标签栏观察器。图标发现缓存有 512 条上限及过期时间，DNS 缓存有 64 条上限及一分钟有效期。

本次修复小组件共用 Mixin：

- 重启连续更新时先清除已有 interval，避免同一组件重复轮询。
- 进度完成延时只保留一个，卸载时清除。
- 进度条实例使用 Vue `markRaw`，避免第三方内部计时器和 DOM 状态被深度响应式代理。
- 卸载时立即结束进度条，清理库内部动画，不再启动退场定时器；迟到的 loading 完成不会重新创建任务。

边界：本次没有做生产浏览器 heap/CPU 分析，不能声称已量化内存下降。组件网络请求的全面取消、后台轮询暂停未在本分支改写；部分已经发出的请求仍可能等到响应或超时。避免为了缓存视图而把所有分栏组件永久保存在内存中。

## 图标来源

- OpenAI、Gemini：Lobe Icons，固定提交 `8b7bbc433d38437fa2b0cca58ae896917162b812`，`packages/static-svg/icons/openai.svg` 与 `gemini-color.svg`。保留几何形状，OpenAI 使用绿色；MIT 许可见 `public/portal-icons/LOBE-ICONS-LICENSE.txt`。
- Claude：项目已安装的 Simple Icons 16.33.0 `siClaude`，来源标注为 `https://claude.ai`；CC0，品牌标识的商标权仍属于各自权利人。

## 验证

验证独立 SVG 不含外部图片/脚本、官网 favicon 迁移、自定义图标保留、静态缓存边界，以及小组件重复轮询、卸载和迟到回调；同时复查分栏图标缓存、匿名加载和现有小组件行为。具体通过数量见 PR。未宣称线上耗时或内存改善百分比。
