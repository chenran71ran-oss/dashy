# 登录页主题分支预览

分支：`feat/login-theme-preview`。本分支不改变生产域名或密码验证规则，未经确认不合并至 master。

界面复用总站的内置主题、像素高达及颜色系统。当前浏览器的有效主题选择优先；新浏览器按云端 dayTheme / nightTheme / theme 显示。支持内置主题的安全自定义颜色，不在登录前加载外部样式或自定义脚本。

`GET /api/login-appearance` 只返回受限的主题标识和颜色。完整配置、书签、说明和后台数据仍要求管理员登录。外观读取失败不阻止密码表单使用。

## 生成独立预览

安装项目依赖后运行：

```bash
node scripts/build-login-preview.mjs /tmp/HomeLab_Login_Theme_Preview.html
```

在浏览器打开生成的 HTML，切换顶部的主题列表和“手机预览”。预览由真实 CloudLogin 组件生成，页面内拦截所有请求，不连接服务器，也不提交密码。默认使用系统字体回退；正式登录页沿用总站字体。预览内置像素高达资产，可以离线打开；可通过 LOGIN_PREVIEW_ASSETS 指定缩小后的同名 PNG 以减小文件体积。

预览采用 Vite library 模式，显式替换 `process.env.NODE_ENV` 为 `production`，避免浏览器因不存在 Node 的 `process` 全局变量而显示空白。`node --test tests/login-preview-artifact.test.mjs` 会生成并执行最终 HTML 中的组件包，覆盖挂载、主题切换、显示密码和模拟登录响应；也可通过 `LOGIN_PREVIEW_HTML` 指定已有生成文件。

## 验证范围

已覆盖外观接口字段过滤与权限边界、本地/云端/日夜优先级、显示密码、错误提示和成功登录事件，生产与预览构建均通过。当前连接的桌面浏览器无法访问工作环境的 localhost，因此实际浏览器布局、54 主题逐项视觉效果及 iPhone Safari 尚待检验；不能把自动测试等同于完成真机验收。
