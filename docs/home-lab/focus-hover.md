# 专注悬停与主题切换分支

分支：`fix/focus-hover-theme-performance-20261018`。基于 `master` 的 `66473c6`，本说明不代表已合并或部署。

## 卡片交互

- 平时保持等高网格；大卡片英文说明最多两行，超出省略。
- 精细指针悬停，或键盘 Tab 聚焦原网站链接时，卡片上移 3px、放大至 1.025 倍并展开完整说明。原位置保持原高度，其他卡片不移动。
- 高度动画为 180ms；快速移入移出取消旧动画。指针移出且键盘焦点也离开后收回。
- 接近视口底部或说明过长时限制展开高度，完整内容可在原卡片内滚动；不增加说明按钮、对话框或重复说明浮层。
- 小/中尺寸在聚焦时也可读全文；触屏浏览保留原有点击导航方式。系统开启“减少动态效果”时取消缩放与高度动画。

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

自动验证覆盖占位高度、聚焦展开、快速移入移出、减少动态效果、即时预览与失败清理，以及重复主题属性写入。它不能代替真实浏览器的视觉和帧率验收。

本地复核重点：原版质感浅色、羊皮纸和深色主题下的长/短英文说明；连续移动于相邻卡片、最后一行、滚轮、Tab/Shift+Tab、三种卡片尺寸；主题保存慢或失败时的当前页面反馈与跨设备确认。`npm run dev` 只提供前端，完整云端保存流程需要 Worker API。

连接的桌面浏览器此前无法访问工作环境 localhost；本分支尚未完成真实浏览器视觉验收与帧率测量，因此不标注性能提升百分比。
