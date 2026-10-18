# 维护、发布与回滚

[项目首页](../../README.md) · [变更日志](../../CHANGELOG.md) · [历史索引](history.md) · [部署](deployment.md)

## 主分支与历史

默认分支 `master` 沿用 Dashy 上游命名，承担通常称为 `main` 的主分支职责。功能用 `feat/…`、修复用 `fix/…`、文档用 `docs/…` 分支开发，完成检查后经 PR 合并。当前不需要额外建立一条同用途的 `main`。

若将来确需改名，应一起检查 GitHub 默认分支、开放 PR 的目标、分支保护/Rulesets、Cloudflare 生产分支与 GitHub Actions 触发条件。仅推送一个 `main` 分支不会完成迁移。

历史索引依据 GitHub 上真实存在的提交补写说明。保留作者、日期与 SHA，不使用回填日期、强制推送或改写旧提交来模拟早期开发过程。缺少原始快照时新增今天的补记，写清来源和不能确认的部分。

## 三类数据分别维护

| 内容 | 位置 | 如何留档或恢复 |
| --- | --- | --- |
| Vue/Worker 源码、图标、文档 | GitHub | 提交 SHA、PR、Git revert |
| 网站、分类、页面、主题及收藏 | Cloudflare KV | YAML 导出；配置历史；收藏独立记录 |
| 密钥、绑定、域名、重定向、构建设置 | Cloudflare 面板 | 记录非敏感操作说明与验证结果，按面板恢复 |

Git 回滚不恢复 KV 内容；代码上传也不会把线上书签自动提交到仓库。不要把 Cookie、真实密码、API Key 或私人 YAML 放入公开 Git 历史。配置历史覆盖通过 `saveConfig` 保存的文件，不能当作收藏、Secrets 或 Cloudflare 规则的完整备份。

## 开始一次修改

在工作区没有未保存改动时执行以下命令；已有工作先提交或使用独立 worktree，保留其他任务的文件。

```bash
git fetch origin
git switch master
git pull --ff-only origin master
git switch -c fix/describe-the-problem
```

每次提交只处理一个明确问题，说明具体行为和原因。变更日志写用户能感知的结果；接口、同步或部署变化还要更新对应使用/架构/部署说明。沿用现有上游版权与第三方资源许可。

## 验证与独立预览

使用满足 `package.json` engines 的 Node 版本，安装与构建命令为：

```bash
npm ci --ignore-scripts --no-audit --no-fund
npm run build
git diff --check
```

本 fork 没有统一的 `npm test` 脚本，按改动直接运行已有测试。例如登录与共享主题：

```bash
node --test tests/login-appearance.test.mjs tests/shared-theme.test.mjs tests/theme-contrast.test.mjs
npx vitest run tests/components/login-theme.test.js tests/utils/login-appearance.test.js tests/utils/shared-theme.test.js tests/utils/shared-theme-store.test.js
node --test tests/login-preview-artifact.test.mjs
```

图标相关改动可运行：

```bash
node --test tests/icon-discovery.test.mjs tests/portal-icons.test.mjs tests/cloud-ui-sync.test.mjs
npx vitest run tests/utils/icon-cache.test.js tests/utils/icon-preview.test.js
```

登录页独立预览：

```bash
node scripts/build-login-preview.mjs /tmp/HomeLab_Login_Theme_Preview.html
```

用浏览器打开生成的 HTML，可切换内置主题和手机宽度。它会拦截登录请求，不能验证真实密码、线上 KV 或两台设备的同步。`npm run dev` 提供前端开发服务，不会自动提供完整 Worker API。

自动颜色检查不等于真实布局检查。发布前按改动验证：桌面和手机的标题、输入、页脚、长内容溢出与键盘操作；浅/深/彩色主题；重新聚焦与跨设备读取；保存失败是否保留原数据。按实际结果记录，未完成项明确写待验收。

## 推送与 PR

```bash
git add path/to/changed-file
git commit -m "fix: describe the resulting behavior"
git push -u origin fix/describe-the-problem
```

在 GitHub 建立指向 `master` 的 PR，写清问题、最终行为、测试与限制。确认 PR 包含预期文件和最新 SHA，通过要求的检查后合并。不要用不受保护的分支或强制更新绕开仓库规则。分支可先保留用于追溯。

上游继承的 `.github/workflows/ci.yml` 使用 Yarn 和部分本 fork 未定义的脚本，不能把文件存在等同于 CI 已可用或已通过。查看实际 Actions 运行；如需统一 CI，应单独修改、验证工作流，不在文档整理时隐式启用发布权限。

## 确认代码真的上线

1. 在 GitHub 确认 PR 为 Merged，记录合并 SHA。
2. 在 Cloudflare Workers Builds 确认生产分支为 `master`，本次构建关联正确 SHA。
3. 查看依赖安装、构建与部署结果，核对目标 Worker、`HOME_KV`、`ASSETS` 及必要 Secrets。Worker 名称或 KV ID 变化须额外核对。
4. 用生产域名访问已变更功能，确认页面资源、登录、配置读取与保存符合预期；使用独立浏览器/手机检查共享主题。KV 传播可能需要额外时间。
5. 在 PR 或发布记录注明验证时间、提交、构建结果与遗留问题。仅完成第一步时写“代码已合并，部署待确认”。

Workers Builds 是本项目的生产部署入口；GitHub Actions 的 Docker/镜像任务不是 Worker 上线证明。未连接自动构建时，合并不会自行发布。构建、绑定与 Secret 详见 [部署指南](deployment.md)。

## 回滚代码

回滚前记录当前 SHA、线上构建版本，并导出配置。优先在分支中使用 revert，保留修复与回滚的完整轨迹。普通提交与合并提交的参数不同：

```bash
git switch -c fix/revert-a-regression origin/master
git revert <ordinary-commit-sha>
```

若回滚整个 merge commit，确认第一父提交是原主分支后使用：

```bash
git revert -m 1 <merge-commit-sha>
```

两条 revert 命令按实际目标择一执行。解决冲突、验证、推送 PR，再按正常流程合并部署；不要向共享主分支 force push 来“抹掉”记录。Cloudflare 的版本回滚也只恢复相应部署内容，不等同于 Git 或 KV 回滚，之后需让仓库与生产重新对齐。

## 恢复配置

每次云端保存前，`cloud/config-storage.mjs` 备份上一版本；目录最多保留 20 条，内容有效期 30 天。恢复前导出当前 YAML，核对是根配置还是某个子页面，避免把分页面内容覆盖总站。

配置历史读取走鉴权接口 `GET /api/config-backups?filename=/conf.yml`；带返回的 `id` 可读取对应备份。历史读取本身不会恢复，需在核对内容后经正常云端保存流程重新写入。子页面使用其真实配置路径。不要在公开 issue、PR、日志里粘贴完整私人配置。

## 合并上游

上游参考是 `lissy93/dashy`。先在单独分支比较或合并，保留 Home Lab 的 Worker 入口、云端保存、安全边界、三视图、中文说明和资源许可。不要直接以整个上游目录覆盖 fork。上游更新可能包含当前 Worker 部署不提供的 Node 后端功能，应按 [功能边界](features.md) 逐项验证。

## 建议的维护记录

```text
日期与时区：
GitHub PR / 合并 SHA：
变更目的和最终行为：
代码之外的设置变更（不含密钥值）：
测试与浏览器/手机验证：
Cloudflare 构建/部署结果：
回滚到哪个提交或配置备份：
仍待处理的问题：
```
