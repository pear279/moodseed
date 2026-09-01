# AGENTS.md — 工作规则

## 开始任何任务前
1. 读 `PRODUCT.md`（意图与范围）、`ARCHITECTURE.md`（技术方案）、`TASKS.md`（进度）。
2. 确认当前任务在 TASKS.md 中的位置，避免偏离产品范围（尤其「首版不做」清单）。
3. 每个任务：**计划 → 实现 → 验证 → 更新 TASKS.md**。

## 命令
```bash
pnpm install          # 装依赖
pnpm dev              # Vite 前端本地开发
pnpm dev:api          # wrangler pages dev（本地 D1/Functions）
pnpm build            # tsc + vite build
pnpm preview          # 预览构建产物
pnpm test             # API 冒烟测试（需先 pnpm dev:api）
pnpm db:migrate:local # 本地 D1 迁移
pnpm db:migrate:prod  # 线上 D1 迁移（需 Cloudflare 登录）
```

## 约定
- 所有产品文案、常量（奖励规则、植物、情绪标签、幸运语）收敛到 `data/` 或 `src/lib/`，**不硬编码散落**。
- API 通过 `src/lib/api.ts` 统一调用，不直接 fetch。
- 用户身份用 `localStorage` 的 `moodseed_uid`，首屏确保已 get-or-create。
- 时区统一 `Asia/Shanghai`。
- 敏感信息（DeepSeek Key、Cloudinary Secret 等）只进 `.dev.vars` / Cloudflare secrets，**绝不提交**；`.gitignore` 必须排除。
- 移动端优先：一切页面先过 375px 宽度。

## 每个任务完成前（Product Quality Gate）
1. 用户看得懂吗？2. 入口明显吗？3. 步骤是否最少？4. 有空状态？5. 有错误状态？6. 有加载反馈？7. 有成功反馈？8. 移动端 OK？

## 验证（没有输出不算完成）
- 每个任务跑 `pnpm build`（或对应测试命令），贴出通过输出。
- UI 任务：实现后截图与意图对照，2~3 轮迭代属正常。
- 报「完成」前必须展示验证证据，不得只凭「应该能跑」。

## 部署前（Ship 门禁）
- 对照 `PRODUCT.md` 检查漂移；检查安全（无泄漏 Key、无注入、内容安全状态机）；错误/空/加载态；移动端适配；移除临时代码与 mock。
- 跑 `pnpm build` 通过后再 `wrangler pages deploy`。
