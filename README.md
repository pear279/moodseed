# 🌱 Moodseed 情绪植物拼图

记录一件事，理解一种情绪，点亮一块植物。

[![CI](https://github.com/pear279/moodseed/actions/workflows/ci.yml/badge.svg)](https://github.com/pear279/moodseed/actions/workflows/ci.yml)

> 代码仓库：<https://github.com/pear279/moodseed>

Moodseed 是一款以 **情绪记录 + 认知行为疗法(CBT) + 植物拼图成长** 为核心的轻量移动端 Web 产品。每次有效记录由 AI 辅助完成情绪识别与建议，并推动一株灰暗破败的植物恢复一块生命力；48 块全部点亮后，解锁完整植物卡片。

## 已实现功能

- **轻量引导**：昵称（随机/跳过）+ 生日选填（自动星座），不收集性别，MBTI 选填
- **记录**：每日签到 + 幸运卡（黄历宜忌/幸运语/幸运色）+ 记录（图片/标题/正文/情绪标签）+ AI 四项分析 + 历史记录
- **奖励**：签到 +1 积分 · 记录日上限 3 块 · 连续 7 天 +3 块 · 21 积分兑 1 块
- **植物拼图**：48 块（6×8）三态、灰→彩逐块点亮、左右滑动、完整解锁翻牌、植物卡片
- **漂流瓶**：发布 / 每日 5 条 / 点赞 / 一级评论 / 举报 / 删除
- **我的**：资料 / MBTI / 三项数据 / 周·月日历 / 积分兑换

## 技术栈

- **前端**：React + Vite + TypeScript + Tailwind CSS + Three.js + react-router（HashRouter）
- **后端**：Cloudflare Pages Functions（Workers 运行时）
- **数据库**：Cloudflare D1（SQLite）
- **存储**：Cloudflare R2（用户上传图片）
- **AI**：DeepSeek API（`deepseek-v4-flash`，Non-Thinking + JSON 输出），缺 Key 时自动走本地规则兜底
- **黄历/星座**：`lunar-javascript`（仅后端）

一个 Cloudflare Pages 项目 + `functions/` 目录跑完全部 API，单仓库、单部署。

## 目录结构

```
moodseed/
├── PRODUCT.md / ARCHITECTURE.md / TASKS.md / AGENTS.md   # 产品与技术文档
├── src/                  # React 前端 + 内容知识库（content/）与读取层（lib/content/）
├── functions/            # Pages Functions（API + D1/R2/DeepSeek）
├── migrations/           # D1 迁移 SQL
├── public/               # 植物插画 PNG 等静态资源
├── references/           # 原始素材（内容库 Markdown、植物/纹理参考图）
└── wrangler.jsonc        # Cloudflare 绑定配置
```

## 本地开发

前置：Node 20+，pnpm，Cloudflare 账号（仅部署时需要）。

```bash
git clone https://github.com/pear279/moodseed.git
cd moodseed
pnpm install          # 安装依赖
cp .dev.vars.example .dev.vars   # 本地环境变量（可选填 DeepSeek Key）
pnpm db:migrate:local # 初始化本地 D1
pnpm build            # 构建前端到 dist/
pnpm dev:api          # 启动 wrangler pages dev（静态 + API，端口 8788）
```

浏览器打开 http://localhost:8788 即可体验完整闭环。

> 开发前端热更新：另开终端跑 `pnpm dev`（Vite，5173），已配置 `/api` 代理到 8788。

### 验证

```bash
pnpm build   # 类型检查 + 生产构建
pnpm test    # API 冒烟测试（需先 pnpm dev:api；覆盖签到幂等/日上限3/兑换/漂流瓶/图片上传等 24 项断言）
```

## 部署到 Cloudflare

```bash
pnpm build                              # 1. 构建前端
wrangler login                          # 2. 登录 Cloudflare
wrangler d1 create moodseed-db          # 3. 创建 D1，把返回的 database_id 填入 wrangler.jsonc
wrangler r2 bucket create moodseed-images  # 4. 创建 R2 桶
wrangler d1 migrations apply moodseed-db --remote   # 5. 线上执行迁移
wrangler pages secret put DEEPSEEK_API_KEY   # 6. （可选）配置 DeepSeek Key
wrangler pages deploy dist              # 7. 部署到 Pages（首次会提示项目名）
```

环境变量（可选，缺省走本地兜底）：

| 变量 | 说明 | 默认 |
| --- | --- | --- |
| `DEEPSEEK_API_KEY` | DeepSeek API Key | 空 → 本地规则兜底 |
| `DEEPSEEK_BASE_URL` | API 地址 | `https://api.deepseek.com` |
| `DEEPSEEK_MODEL` | 模型名 | `deepseek-v4-flash` |

## 核心规则（`src/lib/constants.ts`）

- 每株植物 48 块拼图（6×8）
- 每次有效记录 +1 块，**每天上限 3 块**
- 连续记录每 7 天 +3 块
- 签到 +1 积分；21 积分兑换 1 块
- 每人每天最多看 5 个漂流瓶

详见 [`PRODUCT.md`](./PRODUCT.md) 与 [`ARCHITECTURE.md`](./ARCHITECTURE.md)。
