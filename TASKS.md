# Tasks — Moodseed 开发计划

> 状态：`[x]` 完成 · `[~]` 进行中/部分完成 · `[ ]` 待办。每个任务独立可验证。

## Phase 0 — 工程初始化 ✅
- [x] 0.1 脚手架：Vite + React + TS + Tailwind + react-router(HashRouter) + lunar-javascript，`pnpm build` 通过
- [x] 0.2 Cloudflare 基建：`wrangler.jsonc`（D1/R2）+ `functions/` + `migrations/0001_init.sql` + `.dev.vars.example` + `.gitignore`
- [x] 0.3 静态内容：`data/`（5 株植物、24 情绪、8 认知模式、120 幸运语、24 幸运色）
- [x] 0.4 `src/lib`：userId、types、api.ts、zodiac、constants
- [x] 0.5 植物插画（蘑菇/仙人掌/蒲公英，正方形 1:1）+ 蜘蛛网 SVG
- [x] 0.6 git init + 首提交

## Phase 1 — 静态产品骨架 ✅
- [x] 1.1 移动端外壳：底部三 Tab + 页面容器
- [x] 1.2 首次引导：昵称（随机/跳过）+ 生日选填（自动星座）
- [x] 1.3 记录页：签到卡 / 添加记录 / 历史记录
- [x] 1.4 拼图页：植物卡片 + 左右滑动
- [x] 1.5 我的页：个人信息 / 签到积分 / 数据 / 日历 / 兑换
- [x] 1.6 点击流程跑通，`pnpm build` 通过

## Phase 2 — 记录闭环 ✅
- [x] 2.1 创建记录：标题/正文/情绪标签（预设+自定义）/图片选填（R2）
- [x] 2.2 DeepSeek 分析代理：CBT Prompt + JSON 输出 + 本地兜底（`deepseek-v4-flash`）
- [x] 2.3 分析结果展示（四项）+ 失败/加载态
- [x] 2.4 历史记录：收起（日期/标题/标签/总结）+ 展开（正文/原因/建议）
- [x] 2.5 记录写库 + 列表/详情接口（curl 验证通过）

## Phase 3 — 奖励体系 ✅
- [x] 3.1 签到：幂等 +1 分 + 幸运卡（幸运语/黄历宜忌/幸运色，确定性）
- [x] 3.2 碎片奖励：每次有效记录 +1，日上限 3
- [x] 3.3 连续记录：每 7 天 +3（`reason='streak'` 防重复）
- [x] 3.4 积分兑换：21 分兑 1 块（`point_transactions` 记账）
- [x] 3.5 我的页数据：连续/累计天数、解锁植物数、积分、日历（周/月、碎片图标）
- [x] 3.6 规则校验：`pnpm test` 冒烟脚本（日3上限/签到幂等/兑换守卫/敏感词/漂流瓶）全绿

## Phase 4 — 植物拼图核心视觉 ✅（Three.js 实现）
- [x] 4.1 6×6 切片：Three.js PlaneGeometry + UV 重映射切成 36 块，锁定块灰度+压暗（参考 `references/puzzle-texture-reference.png`），解锁彩色
- [x] 4.2 三态渲染：完全未解锁 / 部分恢复 / 完整复苏
- [x] 4.3 卡片倾斜视差：Three.js 指针跟随 rotateX/rotateY
- [x] 4.4 碎片恢复动画：Shader `uReveal` 灰→彩逐块点亮 + 「🌱 获得 N 块」反馈
- [x] 4.5 完整解锁：Three.js 绕 Y 翻牌一圈 + 植物卡片 + 「收下」
- [x] 4.6 左右滑动：已完成 / 当前 / 待解锁（灰色「待解锁」）
- [~] 4.7 视觉验证（截图对照）——待浏览器可用

## Phase 5 — 漂流瓶 ✅
- [x] 5.1 发布：匿名短文本 + 情绪标签 + 敏感词过滤
- [x] 5.2 随机获取（每日限 5）+ 查看详情
- [x] 5.3 点赞 + 一级评论
- [x] 5.4 举报/删除（状态机 normal/hidden/deleted）
- [x] 5.5 空态 / 上限提示（curl 验证通过）

## Phase 6 — 打磨与部署（进行中）
- [~] 6.1 动效/页面过渡/Loading/空态/异常态（已覆盖主要流程，可继续细化）
- [~] 6.2 移动端适配与细节文案
- [~] 6.3 内容安全自查 + 移除 mock（无 mock 遗留，`ai` 兜底为正式降级逻辑）
- [x] 6.4 README（本地跑/部署步骤/环境变量）
- [ ] 6.5 `pnpm build` 全量通过 + 部署 Cloudflare Pages + 验证公网（需用户 Cloudflare 账号）
- [x] 6.6 推送 GitHub（已 `git init` + 首提交，待创建远端仓库）

## 验收清单（对照 PRODUCT.md）
- [x] 核心闭环后端完整跑通（引导→记录→AI→碎片→修复→36块→翻牌→下一株）——API 层已 curl 验证
- [~] 三页 + 引导 UI 浏览器端到端验证（浏览器因切换标签暂停，待恢复）
- [x] 奖励规则正确（日3 / 7天+3 / 21兑1 / 日5瓶）
- [ ] Cloudflare 真实部署可访问（待用户账号）
- [x] 项目文件标准化（PRODUCT/ARCHITECTURE/TASKS/AGENTS/README）+ git 提交
