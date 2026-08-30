# Moodseed 架构设计

## Tech stack

| 层 | 选型 | 说明 |
| --- | --- | --- |
| 前端 | React 18 + Vite + TypeScript | 页面与组件 |
| 样式 | Tailwind CSS | 移动端布局/样式/简单动画 |
| 视觉 | Three.js（仅空间效果）+ CSS 揭示 | 卡片倾斜视差、碎片恢复、翻牌、光晕 |
| 路由 | react-router-dom（HashRouter） | SPA 零配置、Pages 无需 `_redirects` |
| 农历/星座 | lunar-javascript | 黄历宜忌、星座、干支（本地，不调付费 API） |
| 后端 | Cloudflare Pages Functions（基于 Workers） | 一体化承载 API |
| 数据库 | Cloudflare D1（SQLite） | 用户/记录/签到/进度/漂流瓶 |
| 存储 | Cloudflare R2 | 用户上传的记录图片 |
| AI | DeepSeek API（OpenAI 兼容，`deepseek-v4-flash`，Non-Thinking） | 单条记录分析；模型名可配，缺 Key 走本地兜底 |
| 部署 | Cloudflare Pages | 前端静态 + Functions API 一次部署 |

> 选型原则：**Cloudflare 一套跑完**，服务数量最少、无跨平台运维。Pages Functions 与单独 Workers 是同一运行时，用 `functions/` 目录即可在同一项目内绑定 D1 + R2，省掉独立 Worker 的部署与域名管理。

## System / components

```
浏览器 (React SPA, HashRouter)
  ├─ 页面: 首次引导 / 记录 / 拼图 / 我的 + 子屏(写记录/漂流瓶/日历)
  ├─ lib/api.ts  →  fetch('/api/*')
  └─ 本地: userId (localStorage) + 幸运卡确定性生成

Cloudflare Pages
  ├─ 静态资源 (React build)
  └─ functions/api/[[path]].ts  →  路由分发
        ├─ D1 (数据库)
        ├─ R2 (图片存储)
        └─ DeepSeek API (记录分析代理)
```

- 用户体系：无登录。首次打开生成 `anonymous_user_id`（UUID）存 LocalStorage 并 upsert 到 D1。
- 植物拼图视觉：一张完整植物插画（SVG/PNG）在 6×8 DOM 网格上按 `background-position` 切片；未解锁格 `filter: grayscale` + 蜘蛛网 SVG 覆盖，解锁格恢复彩色。Three.js 仅渲染整张插画平面做指针跟随的轻倾斜视差，完整解锁时翻转（CSS 3D + 光晕）。

## Data model（D1，8 张表）

`plants` 为静态配置（`data/plants.json`），非用户数据，不进 DB（减少 seed 复杂度）。

```sql
users(id TEXT PK, nickname TEXT DEFAULT '小种子', birthday TEXT, mbti TEXT,
      points INTEGER DEFAULT 0, created_at TEXT, updated_at TEXT)

records(id TEXT PK, user_id TEXT, title TEXT, content TEXT NOT NULL,
        image_url TEXT, emotion_tags TEXT /*JSON*/, ai_emotion_tags TEXT /*JSON*/,
        ai_summary TEXT, ai_reason TEXT, ai_suggestion TEXT,
        ai_status TEXT /*pending|done|failed|skipped*/, piece_awarded INTEGER,
        created_at TEXT)

checkins(id TEXT PK, user_id TEXT, checkin_date TEXT /*YYYY-MM-DD*/,
         points INTEGER, lucky TEXT /*JSON 幸运卡快照*/, created_at TEXT,
         UNIQUE(user_id, checkin_date))

puzzle_progress(user_id TEXT, plant_id TEXT, unlocked_count INTEGER DEFAULT 0,
                positions TEXT /*JSON 已解锁格下标*/, status TEXT /*active|completed*/,
                completed_at TEXT, created_at TEXT, updated_at TEXT,
                PRIMARY KEY(user_id, plant_id))

point_transactions(id TEXT PK, user_id TEXT, delta INTEGER /*+1/-21*/,
                   reason TEXT /*checkin|exchange*/, created_at TEXT)

bottles(id TEXT PK, user_id TEXT, plant_id TEXT, content TEXT,
        emotion_tags TEXT /*JSON*/, status TEXT /*normal|hidden|deleted*/,
        likes_count INTEGER DEFAULT 0, created_at TEXT)

bottle_likes(bottle_id TEXT, user_id TEXT, created_at TEXT,
             PRIMARY KEY(bottle_id, user_id))

comments(id TEXT PK, bottle_id TEXT, user_id TEXT, content TEXT,
         status TEXT /*normal|hidden|deleted*/, created_at TEXT)
```

> 相对草案的说明：草案 8 表含 `plants`，此处把 `plants` 换成 `point_transactions`（积分流水，保证兑换不重复扣分、可审计），植物配置改为静态 JSON。表数仍为 8。

## API surface（`/api/*`，Pages Functions）

| 方法 | 路径 | 作用 |
| --- | --- | --- |
| POST | `/api/user` | get-or-create 匿名用户（本地无 userId 时） |
| PATCH | `/api/user/:id` | 更新资料（昵称/生日/MBTI） |
| GET | `/api/user/:id` | 资料 + 统计（连续/累计天数、解锁植物数、积分） |
| POST | `/api/checkin` | 签到（幂等/天）+1 分 + 幸运卡 |
| GET | `/api/checkin/today?userId=` | 今日签到状态 + 幸运卡 |
| POST | `/api/records` | 创建记录（含 AI 分析触发与碎片奖励） |
| GET | `/api/records?userId=` | 历史记录列表 |
| GET | `/api/records/:id` | 记录详情 |
| POST | `/api/records/:id/analyze` | 重新触发 AI 分析 |
| GET | `/api/progress?userId=` | 全部植物进度（当前/已完成/下一株） |
| POST | `/api/exchange` | 21 积分兑 1 块 |
| POST | `/api/upload` | R2 上传（返回图片 URL） |
| GET | `/api/bottles/random?userId=&plantId=` | 随机漂流瓶（每日限 5） |
| POST | `/api/bottles` | 发布漂流瓶 |
| GET | `/api/bottles/:id` | 漂流瓶 + 一级评论 |
| POST | `/api/bottles/:id/like` | 点赞/取消 |
| POST | `/api/bottles/:id/comments` | 一级评论 |
| POST | `/api/bottles/:id/report` | 举报（置 hidden） |
| DELETE | `/api/bottles/:id` | 删除自己内容（置 deleted） |

> 图片上传：R2 直传或经 `/api/upload` 中转（demo 用中转，上传后返回公开 URL）。内容安全：敏感词本地过滤 + 举报置 `hidden` + 删除置 `deleted`。

## Key interactions

1. **记录闭环**：提交记录 → 写 `records`（piece_awarded 依当日已奖励数）→ 若当天已奖励 <3 且为有效记录，更新 `puzzle_progress.unlocked_count`/`positions` → 返回新增碎片位置 → 前端播放恢复动画。
2. **AI 分析**：`/api/records/:id/analyze` → worker 拼 System Prompt（CBT 规则库）+ 用户输入 → 调 DeepSeek → 落库 `ai_*` → 返回四项。失败/无 Key → 本地规则兜底（关键词→情绪标签 + 模板建议）。

> **DeepSeek 调用要点**（调研确认）：endpoint `{DEEPSEEK_BASE_URL}/chat/completions`，OpenAI 兼容；`model=deepseek-v4-flash`；Non-Thinking 用 `thinking: { type: "disabled" }`；结构化输出用 `response_format: { type: "json_object" }`（Prompt 内必须出现 "json" 字样并给出字段样例）；鉴权 `Authorization: Bearer <key>`。
3. **签到**：`checkins` 按 `UNIQUE(user_id, checkin_date)` 幂等；+1 分写 `users.points` + `point_transactions`；幸运卡按 `date+userId` 确定性生成（lunar-javascript 取宜忌，hash 取幸运语/色）。
4. **连续记录**：由 `records` 按天去重计算连续天数，命中 7 的倍数当天额外 +3 块（记录到 `point_transactions`/进度）。
5. **碎片位置**：确定性伪随机洗牌（seed = hash(userId + plantId)），保证同一用户同一株恢复顺序一致且有机分布。

## Directory structure

```
moodseed/
├── PRODUCT.md / ARCHITECTURE.md / TASKS.md / AGENTS.md / README.md
├── package.json / vite.config.ts / tsconfig*.json / tailwind.config.js
├── wrangler.jsonc / .dev.vars.example / .gitignore / index.html
├── data/            # 静态内容配置（plants/emotions/cognitive-patterns/lucky-*）
├── functions/api/   # Pages Functions 路由（D1/R2/DeepSeek 代理）
├── migrations/      # D1 迁移 SQL
├── scripts/         # 种子/工具脚本
├── public/          # favicon、静态资源
└── src/             # React 前端
    ├── pages/       # Record/Puzzle/Me/Onboarding + 子屏
    ├── components/  # 复用组件
    ├── three/       # Three.js 拼图场景
    ├── lib/         # api.ts / userId / luck / zodiac / lunar / types
    └── assets/      # SVG 插画、蜘蛛网、漂流瓶图标
```

## Edge cases & failure modes

- **AI 失败/超时/无 Key**：本地规则兜底，`ai_status=failed`，记录不因 AI 失败而丢失；可「重新分析」。
- **图片上传失败**：图片选填，失败不阻塞记录保存，提示可重试。
- **签到幂等**：并发/重复点击由 `UNIQUE(user_id, checkin_date)` 兜底。
- **碎片日上限 3**：以「当日已奖励有效记录数」为准，第 4 条照常保存但 `piece_awarded=0`，前端提示「今天 3 块碎片已集齐 🌱」。
- **积分兑换**：用事务扣分，余额不足拒绝；兑换碎片直接进当前植物。
- **跨时区**：统一按 `Asia/Shanghai` 计算「天」（用户为中国用户）。
- **离线/无网**：前端 Loading + 错误态；核心 UI 不白屏。
- **内容安全**：敏感词本地过滤 + 举报/删除状态机（normal→hidden/deleted），不展示 hidden/deleted 内容。
