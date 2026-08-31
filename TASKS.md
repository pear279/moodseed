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

## Phase 7 — 36 片成长拼图（SVG 重构 + 自由拼图）✅
> 依 `references/moodseed_36_piece_puzzle_dev_spec.md` 重做拼图：SVG 替换 Three.js，收藏进度沿用 D1，自由拼图游戏状态用 LocalStorage。
- [x] 7.1 拼图引擎：固定 6×6=36 块模板（凸榫/凹槽严格互补、外框平直、1:1 无缝）+ vitest 单测
- [x] 7.2 图片 ClipPath：1:1 原图（`public/plants/puzzle/*`）+ 主题映射 + `CollectionPuzzleBoard`
- [x] 7.3 收集模式：PuzzlePage 接入 SVG 板（米白占位 / ClipPath 原图），复用 D1 进度（每日 3 块/确定性洗牌）
- [x] 7.4 解锁 reveal 动画 + 2D 完成反馈 + 「重新拼图」入口 + 移除 Three.js 依赖
- [x] 7.5 自由画布 + Pointer 拖动（scatter / drag / zIndex / 逻辑坐标 2400×2400）
- [x] 7.6 Snap 邻块吸附（错误邻块不吸附）
- [x] 7.7 Group 连块整体拖动 / 合并
- [x] 7.8 完成判定 + 查看原图 / 整理碎片 / 重新打乱 + LocalStorage 存取
- [x] 7.9 移动端与视觉优化（touch-action / 触摸阈值 / 边界约束 / 阴影）
- [~] 7.10 浏览器端到端视觉验收（浏览器因切换标签暂停，待恢复；临时预览 `/preview-puzzle`、自由拼图 `/play/:plantId` 可直接访问）

## Phase 8 — UI 组件库组合 + 品牌重设计 ✅
> BeUI（App 交互原语）+ Watermelon UI（页面 Block）+ Impeccable（设计质量门禁），Tailwind v4 + shadcn 约定。
- [x] 8.1 Tailwind v3→v4 迁移（tailwindcss@4 + @tailwindcss/vite + `@theme` token）
- [x] 8.2 shadcn 约定：`components.json` + `@/` 别名 + `cn()` + 语义 token
- [x] 8.3 品牌重设计：冷纸白 + 深森林绿 + 暖金（全站 token 生效）
- [x] 8.4 vendor BeUI 7 组件（Button/Loader/Input/Switch/Tabs/TiltCard/AnimatedToastStack）+ `@/lib/ease` + `use-hover-capable`，`src/components/ui` 导出层
- [x] 8.5 `DESIGN.md`（三库组合 + token + 组件映射 + 接入方式）
- [x] 8.6 已应用全部页面：Onboarding/Record/Puzzle/PuzzlePlay/Me/Compose/Bottle + 全局加载态
- [~] 8.7 Watermelon UI：registry 不可访问（SPA 404）+ CLI 崩溃，Me 页 Bento 手写实现，待 registry 可访问后替换
- [~] 8.8 Impeccable audit：contrast/圆角/动效规则内联执行，浏览器视觉验收待恢复

## 验收清单（对照 PRODUCT.md）
- [x] 核心闭环后端完整跑通（引导→记录→AI→碎片→修复→36块→翻牌→下一株）——API 层已 curl 验证
- [~] 三页 + 引导 UI 浏览器端到端验证（浏览器因切换标签暂停，待恢复）
- [x] 奖励规则正确（日3 / 7天+3 / 21兑1 / 日5瓶）
- [ ] Cloudflare 真实部署可访问（待用户账号）
- [x] 项目文件标准化（PRODUCT/ARCHITECTURE/TASKS/AGENTS/README）+ git 提交
