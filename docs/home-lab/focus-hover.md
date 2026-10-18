# 专注卡片与主题切换

2026-10-18：PR #6 引入的卡片放大和展开效果已按用户反馈删除；主题切换优化保留。删除分支：`fix/remove-focus-card-expansion-20261018`。

## 卡片交互

- 平时保持等高网格；大卡片英文说明最多两行，超出省略。
- 悬停或键盘聚焦使用原有文字提示查看完整英文说明；卡片本身保持原尺寸。
- 保留主题原有的阴影、颜色反馈和标题滚动，不新增按钮或对话框。

## 主题切换

先通过临时 Vuex 状态在当前页面立即呈现选择，再后台保存共享主题。确认成功后进入根配置；失败则撤销临时预览、恢复最后确认的主题并显示错误。临时预览不会写入本地偏好或根配置，也不会取消现有的跨设备同步。

保存期间菜单显示“同步中”，保留防重复写入和服务端所需的写入间隔。其他设备仍需等待保存成功及 KV 传播，当前页面即时预览不等于其他设备已同步。

内置主题直接替换 `data-theme`，自定义颜色只改动实际不同的属性；主题切换的两帧暂停 CSS 过渡，避免大量 `transition: all` 同时插值尺寸，随后恢复正常悬停过渡。不承诺外部主题样式表的网络加载速度。

## 验证

```bash
npx vitest run --config vitest.config.mjs tests/components/item.test.js tests/utils/shared-theme.test.js tests/utils/shared-theme-store.test.js tests/utils/theme-application.test.js tests/components/login-theme.test.js
node --test tests/shared-theme.test.mjs tests/theme-contrast.test.mjs tests/login-appearance.test.mjs
npm run build
```

自动验证覆盖链接与原有提示、即时主题预览与失败清理，以及重复主题属性写入。已删除仅针对卡片放大行为的测试。自动检查不能代替真实浏览器的视觉和帧率验收。

本地复核重点：原版质感浅色、羊皮纸和深色主题下的长/短英文说明；连续移动于相邻卡片、最后一行、滚轮、Tab/Shift+Tab、三种卡片尺寸；主题保存慢或失败时的当前页面反馈与跨设备确认。`npm run dev` 只提供前端，完整云端保存流程需要 Worker API。

PR #6 部署后曾在真实页面确认完整说明展开；用户反馈放大效果不佳，本次移除该交互。主题切换尚无帧率基准测量，不标注性能提升百分比。
