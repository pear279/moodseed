# DESIGN.md — Moodseed 设计系统与组件库组合

> 本文档定义 Moodseed 前端的设计语言、组件来源与三库组合用法。实现前先读本文档与 `PRODUCT.md` / `ARCHITECTURE.md`。

## 1. 三库组合（核心约定）

Moodseed 的 UI 由三个来源组合而成，各司其职：

| 角色 | 库 | 职责 | 来源 |
| --- | --- | --- | --- |
| **组件素材库** | BeUI（`@beui`） | 移动端交互原语：`Button` / `BottomSheet` / `Tabs` / `Input` / `AnimatedToastStack` / `TiltCard` / `Loader` / `Switch` / `Select` / `Modal` | [beui.dev](https://beui.dev) |
| **页面整体搭建** | Watermelon UI | 页面级 UI Blocks（Bento 数据块、CTA、Announcement 等整块 section），用于 Me 页数据区等「整块页面段落」 | [ui.watermelon.sh](https://ui.watermelon.sh) |
| **设计质量门禁** | Impeccable skill | 颜色对比（WCAG AA）、排版、层级、动效（reduced-motion）、anti-slop 审查；`audit`/`polish`/`layout`/`typeset` 等命令 | 本地 skill |
| **动效原语** | motion-primitives | 效果型动效组件：`Spotlight` / `Magnetic` / `Tilt` / `GlowEffect` / `AnimatedNumber` / `TextEffect`（vendor 于 `src/components/core/`） | [motion-primitives.com](https://motion-primitives.com) |

**分工原则**：App 内的单个控件（按钮、输入、弹层、toast）一律用 BeUI；需要「整块页面段落」复用（如数据 Bento、营销式区块）时用 Watermelon UI；每次改动后用 Impeccable 的规则自查。领域自研组件（拼图 SVG 引擎、`CollectionPuzzleBoard`、`PuzzleCanvas`）不被替换，只被 BeUI 组件「环绕」。

## 2. 技术栈与基础设施

- **样式**：Tailwind CSS v4（`@import "tailwindcss"` + `@theme`），Vite 插件 `@tailwindcss/vite`。
- **动效**：`motion`（framer-motion 后继，导入 `motion/react`）+ `@/lib/ease`（共享缓动/弹簧 token）。
- **组合类名**：`cn()`（`@/lib/utils`，`clsx` + `tailwind-merge`）。
- **路径别名**：`@/*` → `src/*`（tsconfig + vite）。
- **shadcn 约定**：`components.json`（style=new-york，rsc=false，iconLibrary=lucide），语义 token 见 `@theme`。

### 组件接入方式

beUI / Watermelon UI 均无运行时 npm 包，是 copy-paste 源码。优先用 shadcn CLI：

```bash
pnpm dlx shadcn@latest add @beui/bottom-sheet   # BeUI 组件
```

> 注意：本仓库当前环境 shadcn CLI 因 zod/MCP SDK 版本冲突会崩溃（`zod ./v3 not exported`）。fallback 方案为手动 vendor：把组件源码与 `@/lib/ease`、`@/lib/presence-gate`、`@/lib/touch`、`@/lib/hooks/*` 一并复制进 `src/components/motion/*` 与 `src/lib/*`，并保持 `@/lib/*` 导入不变（不要改写内部逻辑）。

> **Watermelon UI 接入状态（待后续）**：Watermelon UI 是 shadcn blocks 库（[CTA](https://ui.watermelon.sh/blocks/CTA) / [Bento](https://ui.watermelon.sh/blocks/Bento) / [Announcement](https://ui.watermelon.sh/blocks/Announcement) 等整块 section，偏落地页/营销）。本环境无法访问其 registry（SPA，标准 `/r/*.json` 均 404），且 shadcn CLI 崩溃，故未 vendor 其源码。对 App UI 其价值有限；Me 页「三项数据」采用同款 Bento 网格手写实现。待 registry 可访问或 CLI 修复后，可 `pnpm dlx shadcn@latest add <watermelon-block-url>` 替换为官方 block。

## 3. 品牌 Token（情绪植物 · 温室/森林方向）

设计取向：冷调纸白底 + 深森林绿主色 + 单一暖金「奖励/生命」强调色。避免 AI 默认的「暖奶油 + 陶土」家庭。

### 颜色（`src/index.css` 的 `@theme`）

| Token | 值 | 用途 |
| --- | --- | --- |
| `cream` | `#f4f7f3` | 页面底（冷调纸白，略偏绿） |
| `sand` | `#e8efe6` | 弱化面 / 输入底色 |
| `ink` | `#172019` | 正文（深森林黑） |
| `stone` | `#5f7263` | 弱化文字（≥4.5:1） |
| `soil` | `#8a7455` | 暖棕（泥土，点缀） |
| `moss` | `#2f5d3e` | 主色（深森林绿，primary） |
| `leaf` | `#3e7a4e` | 中绿 |
| `sprout` | `#6faf6f` | 新芽绿（accent / active / ring） |
| `lime` | `#d9e8d3` | 浅绿（选中 / 浅底） |
| `gold` | `#d9a441` | 暖金（奖励 / 签到 / 生命恢复，唯一第二强调色） |

shadcn 语义映射：`--background=cream`、`--foreground=ink`、`--card=#fff`、`--primary=moss`、`--accent=sprout`、`--muted=sand`、`--muted-foreground=stone`、`--border=#dbe5d9`、`--ring=sprout`、`--destructive=#b5543a`。

### 圆角系统（Shape Consistency Lock）

- 交互控件 / 按钮 / 标签 / 输入：**full-pill**（`rounded-full`）。
- 卡片 / 弹层 / 面板：**16px**（`rounded-2xl`），封顶 16px。
- 图标钮：**12px**（`rounded-xl`）。
- 不得混用 24/28/32px 大圆角卡片。

### 动效

- 按压：`SPRING_PRESS`（stiffness 500 / damping 30）。
- 面板/抽屉：`EASE_DRAWER` / `SPRING_PANEL`。
- 所有动画必须尊重 `prefers-reduced-motion`（组件内 `useReducedMotion()`）。
- 只动画 `transform` / `opacity`，不动画布局属性。

## 4. 组件映射（页面 → BeUI / Watermelon UI）

| 页面 | 采用组件 |
| --- | --- |
| Onboarding 引导 | `Button` · `Input` · `WheelPicker`（生日） |
| Record 记录 | `Button`/`StatefulButton`（签到/提交） · `Input` · `AnimatedToastStack`（获得碎片） · `Loader` · `BottomSheet`（写记录） |
| Puzzle 拼图 | `TiltCard`（植物卡） · `Tabs`/`ExpandableTabs`（已完成/当前/待解锁） · `Modal`（完成/查看原图） |
| PuzzlePlay 自由拼图 | `Button` · `AnimatedToastStack`（吸附/完成） · `BottomSheet`（查看原图） |
| Me 我的 | `Tabs`（周/月） · `AnimatedNumber`（积分/天数） · Watermelon UI `Bento`（三项数据） · `Switch` |
| Compose 写记录 | `Input` · `Select`（情绪） · `Button` · `FileUpload`（图片） |
| Bottle 漂流瓶 | `MessageBubble` · `BottomSheet`（发布） · `SwipeableList`（点赞/评论/举报） |

## 5. 设计质量门禁（Impeccable / taste）

提交 UI 前自查：

- 正文对比度 ≥ 4.5:1；大字号/粗体 ≥ 3:1；占位符同正文标准。
- 单一强调色（金）与主色（绿）锁定，不跨页漂移。
- 移动端 375px 起步；`min-h-[100dvh]`，禁用 `h-screen`。
- 空态 / 加载态 / 错误态齐全。
- 无 AI slop：渐变文字、描边卡+宽阴影同元素、无意义大写 eyebrow、编号 eyebrow、装饰点、`border-l-4` 侧条。
- 圆角 / 阴影 / 动效遵循本文档 token，不临时起值。

## 6. 进度（当前）

- [x] Tailwind v4 + shadcn 约定（`components.json` + `@/` + `cn()` + `@theme` token）
- [x] 品牌色重设计（冷纸白 + 森林绿 + 暖金）
- [x] `src/components/ui` 导出层 + 已 vendor：`Button`/`ButtonLink`、`Loader`、`Input`、`Switch`、`Tabs`、`TiltCard`、`AnimatedToastStack`、`BottomSheet` + `@/lib/ease` + `@/lib/hooks/use-hover-capable` + `@/lib/presence-gate` + `@/lib/touch`
- [x] 已应用全部页面：Onboarding（Input/Button/Magnetic/TextEffect）· Record（Button/Spotlight/TextEffect）· Puzzle（TiltCard/TextEffect）· PuzzlePlay（Button 工具栏 + BottomSheet 查看原图）· Me（Input/Button/Tabs/Toast/AnimatedNumber）· Compose（Input/Button/Switch）· Bottle（Button）· 全局/Puzzle/Compose 加载态（Loader）
- [x] motion-primitives：vendor `Spotlight`/`Magnetic`/`Tilt`/`GlowEffect`/`AnimatedNumber`/`TextEffect` 到 `src/components/core/`，应用到 Record/Me/Onboarding/Puzzle
- [ ] 待 vendor（可选，后续按需）：BeUI `Select` / `Modal`；motion-primitives 其余组件（GlowEffect 应用等）
- [~] Watermelon UI：registry 不可访问，Me 页 Bento 手写实现（见 §2 接入状态）
- [~] Impeccable audit：contrast/圆角/动效/reduced-motion 规则已内联执行，待浏览器可用后补视觉验收
