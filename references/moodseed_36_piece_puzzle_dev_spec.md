# Moodseed 36 片成长拼图开发实现文档

> 用途：直接交给开发 Agent / Codex / Claude Code 执行  
> 版本：V1.0  
> 优先级：移动端优先，兼容桌面 Web / H5  
> 拼图规格：1:1 原图、6×6、固定 36 块

---

## 0. 开发目标

实现一套可复用的 36 片成长拼图系统，覆盖两种核心模式：

1. **收集模式**：用户完成任务后逐块解锁拼图，未解锁碎片显示半透明/米白占位，已解锁碎片显示原图对应区域。
2. **自由拼图模式**：当 36 块全部收集后，用户可主动打乱拼图，在自由画布中拖动碎片重新拼合；正确相邻碎片接近时自动吸附，已连接碎片组成 Group 并整体移动，最终完成整张拼图。

技术上优先采用：

- React
- TypeScript
- SVG（Scalable Vector Graphics，可缩放矢量图形）
- SVG Path + ClipPath
- Pointer Events API（Pointer Events Application Programming Interface，指针事件应用程序接口）
- LocalStorage（V1 持久化）

暂不使用大型游戏引擎、WebGL、PixiJS、Three.js。

---

# 1. 已有素材

开发时请使用以下 3 张 1:1 拼图原图：

- 蘑菇：`/mnt/data/蘑菇.png`
- 蒲公英：`/mnt/data/蒲公英.png`
- 仙人掌：`/mnt/data/仙人掌.png`

建议复制到项目后重命名为：

```text
src/assets/puzzles/mushroom.png
src/assets/puzzles/dandelion.png
src/assets/puzzles/cactus.png
```

参考交互：

- Jigsaw Planet 自由画布：`/mnt/data/jigsawplanet .png`

拼图形状参考：

- `/mnt/data/4a9b49615e911552f219bb0903802f9d.jpg`
- `/mnt/data/cc1526dc4af2829a600c1a176994a1b5.jpg`
- `/mnt/data/download (1).png`
- `/mnt/data/download (2).png`
- `/mnt/data/download (3).png`
- `/mnt/data/download.png`
- `/mnt/data/e2c025de5174725ddfec3f0357793908.jpg`

拼图形状要求：

- 经典规则型 Jigsaw Puzzle
- 圆润凸榫 / 凹槽
- 外边框四边保持直边
- 内部相邻边必须严格互补
- 不采用过度不规则、尖锐或异形拼图
- 36 块模板固定，所有主题共用同一套 SVG Path

---

# 2. 产品规则

## 2.1 基础规格

```text
6 columns × 6 rows = 36 pieces
```

固定编号：

```text
01 02 03 04 05 06
07 08 09 10 11 12
13 14 15 16 17 18
19 20 21 22 23 24
25 26 27 28 29 30
31 32 33 34 35 36
```

每个位置永久拥有：

```text
id
row
column
path
neighbors
correctX
correctY
```

更换主题时只替换 `imageUrl`。

---

## 2.2 收集规则

- 初始状态：0 / 36
- 每日完成一次有效记录获得 1 块拼图
- 每日最多获得 1 块
- 解锁顺序采用**预设随机顺序**
- 重复操作不能重复领取
- 收集状态与后续自由拼图状态必须分离

建议预设随机序列由代码生成一次后固化，禁止运行时每次重新随机。

示例：

```ts
const unlockOrder = [17, 3, 26, 10, 31, 7, ...]
```

---

## 2.3 未解锁状态

未解锁碎片：

- 显示米白 / 浅色半透明拼图块
- 保留拼图轮廓
- 不显示原图内容
- 不使用 Ghost Picture
- 可使用轻微纸张质感或纯色占位

建议视觉：

```css
fill: rgba(248, 245, 237, 0.65);
stroke: rgba(90, 90, 90, 0.12);
```

---

## 2.4 已解锁状态

已解锁碎片：

- 显示对应原图区域
- 通过 SVG ClipPath 实现
- 不提前生成 36 张 PNG/JPG
- 原图只保留 1 张

解锁动画建议：

```text
opacity: 0 → 1
scale: 0.94 → 1.04 → 1
duration: 500ms 左右
```

动画风格柔和，避免抽卡式强反馈。

---

## 2.5 全部收集完成

条件：

```ts
unlockedPieces.length === 36
```

完成后：

1. 显示完整植物图片
2. 第一次完成时播放轻量完成动画
3. 解锁按钮：`重新拼图`
4. 点击后进入自由拼图模式
5. 收藏进度始终保持 36 / 36，不被打乱状态影响

---

# 3. 技术方案

## 3.1 推荐技术栈

```text
React
TypeScript
SVG
SVG Path
SVG ClipPath
Pointer Events
LocalStorage
```

### React
负责页面、状态、组件生命周期、交互触发。

### TypeScript
负责拼图数据结构和复杂状态约束。

### SVG
负责拼图轮廓、图片裁切、描边、阴影、拖动显示。

### Pointer Events
统一处理鼠标、触摸屏、触控笔。

---

## 3.2 不要真的切 36 张图片

仅保留完整原图，通过：

```text
SVG Path + ClipPath + <image>
```

让每一块显示原图对应区域。

示意：

```html
<svg>
  <defs>
    <clipPath id="piece-17">
      <path d="..." />
    </clipPath>
  </defs>

  <image
    href={theme.imageUrl}
    clipPath="url(#piece-17)"
  />
</svg>
```

注意：拼块凸榫可能延伸到基础格子外，因此 SVG viewBox / image mapping / clipPath 坐标系必须统一，避免图片错位与拼接缝隙。

---

# 4. 拼图模板生成

## 4.1 目标

生成固定 6×6 共 36 个 SVG Path。

相邻边必须满足：

```text
Piece A.right === inverse(Piece B.left)
Piece A.bottom === inverse(Piece C.top)
```

建议定义 Edge：

```ts
type EdgeType = 'flat' | 'tab' | 'blank'
```

- `flat`：外边缘直边
- `tab`：凸榫
- `blank`：凹槽

外框规则：

- row === 0 → top = flat
- row === 5 → bottom = flat
- col === 0 → left = flat
- col === 5 → right = flat

内部边：

- 邻边必须严格互补
- 曲线参数完全一致
- 只改变方向

建议一旦模板生成并通过视觉验收，将 36 个 Path 固化，不要每次启动随机重建。

---

# 5. 状态机

建议状态：

```text
LOCKED
↓
COLLECTING
↓
COMPLETED
↓
PUZZLE_READY
↓
PUZZLING
↓
PUZZLE_COMPLETED
```

推荐拆成两套独立状态：

## Collection State

记录：

- 已解锁碎片
- 当前主题
- 当前解锁序列位置
- 是否已收集完成
- 今日是否已经领取

## Puzzle Game State

记录：

- 每块当前位置
- 每块所属 Group
- 当前 Group 列表
- 是否在拼图中
- 是否完成

收藏状态与游戏状态严禁共用“完成”字段。

---

# 6. 数据结构

## 6.1 PuzzleTheme

```ts
type PuzzleTheme = {
  id: 'mushroom' | 'dandelion' | 'cactus'
  name: string
  imageUrl: string
  totalPieces: 36
}
```

---

## 6.2 PuzzleCollection

```ts
type PuzzleCollection = {
  themeId: string
  unlockedPieces: number[]
  currentIndex: number
  completed: boolean
  lastRewardDate?: string
}
```

---

## 6.3 PuzzlePiece

```ts
type PuzzlePiece = {
  id: number
  row: number
  column: number
  path: string

  neighbors: {
    top: number | null
    bottom: number | null
    left: number | null
    right: number | null
  }

  correctX: number
  correctY: number

  x: number
  y: number

  groupId: string
}
```

---

## 6.4 PuzzleGroup

建议从一开始就把单片视为 1-piece Group，统一逻辑。

```ts
type PuzzleGroup = {
  id: string
  pieceIds: number[]
  x: number
  y: number
  zIndex: number
}
```

---

## 6.5 PuzzleGame

```ts
type PuzzleGame = {
  themeId: string
  status: 'idle' | 'playing' | 'completed'
  pieces: PuzzlePiece[]
  groups: PuzzleGroup[]
  updatedAt: number
}
```

---

# 7. 收集模式实现

## 7.1 初始页面

- 展示完整 6×6 拼图外形
- 所有块固定在正确位置
- 未解锁块显示占位色
- 已解锁块显示真实原图
- 该模式不可拖动

## 7.2 解锁流程

```text
完成有效任务
↓
检查 lastRewardDate
↓
今日未领取
↓
读取 unlockOrder[currentIndex]
↓
加入 unlockedPieces
↓
currentIndex + 1
↓
播放碎片解锁动画
↓
保存状态
```

必须保证幂等：同一天重复触发不能重复发放。

---

# 8. 自由拼图模式

## 8.1 进入条件

只有：

```text
36 / 36
```

时允许点击 `重新拼图`。

点击后显示确认：

```text
开始拼图？
你的收藏进度不会受到影响。
```

确认后：

- 初始化 Puzzle Game State
- 断开所有 Group
- 36 块全部变为独立 Group
- 生成散落坐标
- 进入 `playing`

---

# 9. 自由画布

参考 Jigsaw Planet 的自由桌面感，但保持 Moodseed 的视觉风格。

推荐使用逻辑坐标：

```text
1200 × 1200
```

所有位置保存逻辑坐标，真实屏幕通过 scale 映射。

这样能够保证：

- 手机与桌面一致
- 浏览器 resize 不破坏进度
- 横竖屏切换后可恢复

移动端画布区域使用：

```css
touch-action: none;
```

避免拖动拼图时触发页面滚动。

---

# 10. Scatter 散落算法

禁止给 36 块直接使用完全随机坐标。

采用：**分区随机 + 重叠约束**。

## 10.1 区域

将逻辑画布分成：

```text
Top
Bottom
Left
Right
Center（主要拼图区）
```

初始化时将碎片优先分布在四周，中央预留较大操作区域。

## 10.2 约束

每个候选位置必须检查：

- 拼片不得超出画布
- 与已有拼片重叠面积尽量 < 30%
- 避免连续编号大量聚集
- 最大重试次数后允许轻微重叠，避免死循环

已连接 Group 在“整理碎片”时保持原位，仅重新排列单片 / 未连接 Group。

---

# 11. 拖动

使用 Pointer Events：

```text
pointerdown
↓
选中 Group
↓
提升 zIndex
↓
setPointerCapture
↓
pointermove
↓
更新 Group 位置
↓
pointerup
↓
释放 capture
↓
执行 Snap 检测
```

视觉反馈：

```text
scale: 1 → 1.025
shadow: 轻微增强
```

释放恢复。

V1 禁止旋转：

```ts
rotation = 0
```

---

# 12. Neighbor 邻接关系

每块预存：

```ts
neighbors: {
  top,
  bottom,
  left,
  right
}
```

例如 Piece 17：

```ts
{
  top: 11,
  bottom: 23,
  left: 16,
  right: 18
}
```

边缘没有邻居时为 `null`。

---

# 13. Snap 自动吸附算法

每块同时保存：

```text
correctX / correctY
x / y
```

其中：

- correctX / correctY：完整拼图中的理论坐标
- x / y：当前画布坐标

判断两块是否应吸附时，比较：

```text
当前相对位移
vs
正确相对位移
```

例如右邻块：

```text
expectedDx = neighbor.correctX - piece.correctX
expectedDy = neighbor.correctY - piece.correctY

actualDx = neighbor.x - piece.x
actualDy = neighbor.y - piece.y
```

满足：

```text
abs(expectedDx - actualDx) < threshold
abs(expectedDy - actualDy) < threshold
```

则触发 Snap。

建议阈值：

```text
Desktop：12–16px
Mobile：16–24px
```

如使用逻辑坐标，请把视觉像素阈值换算成逻辑坐标阈值。

吸附动画：

```text
120–180ms
```

带极轻微 spring 即可。

---

# 14. Group 合并

连接之后组成 Group。

例如：

```text
17 + 18 → Group A
23 + 24 → Group B
```

Group A 与 Group B 正确接近：

```text
Group A + Group B → Group C
```

合并后：

- Group 内所有拼片保持正确相对位置
- 拖任意拼片实际移动整个 Group
- Group 统一管理 zIndex

注意：Snap 检测要基于 Group 中所有“开放边”，而不只检测用户直接按下的那一块。

---

# 15. 完成判断

满足：

```ts
groups.length === 1 && groups[0].pieceIds.length === 36
```

触发：

```text
PUZZLE_COMPLETED
```

只允许触发一次完成事件。

---

# 16. 完成动画

最后一次 Snap 后：

```text
等待约 200ms
↓
完整 Group 平滑居中
↓
拼缝/阴影逐渐弱化
↓
完整图片成为主视觉
↓
显示「拼图完成啦」
```

总时长建议：

```text
800–1200ms
```

按钮：

- 再次拼图
- 返回

---

# 17. 辅助功能

## 17.1 查看原图

自由拼图模式提供：`查看原图`

点击后使用 Modal 显示完整图片，关闭继续拼。

不要长期显示 Ghost Picture。

## 17.2 整理碎片

- 已连接 Group 不动
- 未连接单片重新排列到画布四周
- 不改变任何正确连接关系

## 17.3 重新打乱

点击确认后：

- 清空 Puzzle Game 的连接状态
- 36 块重新散落
- Collection State 保持 36/36

---

# 18. 状态持久化

V1 使用 LocalStorage。

至少保存：

## Collection

- themeId
- unlockedPieces
- currentIndex
- completed
- lastRewardDate

## Puzzle Game

- themeId
- status
- 每个 Group 的位置
- 每个 Group 的 pieceIds
- zIndex（可选）
- updatedAt

页面刷新后必须恢复。

后续数据库接入时，保留 Storage Adapter 层，避免组件直接调用 LocalStorage。

建议：

```ts
interface PuzzleStorage {
  loadCollection(themeId: string): Promise<PuzzleCollection | null>
  saveCollection(data: PuzzleCollection): Promise<void>
  loadGame(themeId: string): Promise<PuzzleGame | null>
  saveGame(data: PuzzleGame): Promise<void>
}
```

V1 实现 `LocalPuzzleStorage`，未来可换数据库实现。

---

# 19. 推荐项目结构

```text
src/
├── components/
│   └── puzzle/
│       ├── CollectionPuzzleBoard.tsx
│       ├── PuzzleCanvas.tsx
│       ├── PuzzlePiece.tsx
│       ├── PuzzleGroup.tsx
│       ├── PuzzleToolbar.tsx
│       ├── PuzzleReferenceModal.tsx
│       └── PuzzleComplete.tsx
│
├── engine/
│   └── puzzle/
│       ├── template.ts
│       ├── shapes.ts
│       ├── neighbors.ts
│       ├── geometry.ts
│       ├── scatter.ts
│       ├── snap.ts
│       ├── groups.ts
│       └── completion.ts
│
├── hooks/
│   └── puzzle/
│       ├── usePuzzleCollection.ts
│       ├── usePuzzleGame.ts
│       └── usePuzzleDrag.ts
│
├── storage/
│   └── puzzleStorage.ts
│
├── types/
│   └── puzzle.ts
│
└── assets/
    └── puzzles/
        ├── mushroom.png
        ├── dandelion.png
        └── cactus.png
```

不要强行照搬目录结构；如果现有项目已有 store / hooks / services 规范，应融入现有工程架构。

---

# 20. Puzzle Engine 职责

算法层不要散落在 UI 组件里。

建议 Puzzle Engine 至少包含：

```text
createTemplate
createNeighbors
initializeCollection
unlockNextPiece
initializeGame
scatterPieces
moveGroup
findSnapCandidates
snapGroups
mergeGroups
organizeLoosePieces
resetGame
isPuzzleComplete
serializeGame
restoreGame
```

所有纯几何计算尽量写成纯函数，便于单元测试。

---

# 21. 开发阶段与顺序

严禁一次性写完整系统后再调试。

## Phase 1：静态 36 块模板

完成：

- 6×6
- 36 个 Path
- 邻边严格互补
- 组合后为完整 1:1 正方形

验收后再继续。

## Phase 2：图片 ClipPath

完成：

- 三张主题图片任意切换
- 组合后与原图视觉一致
- 凸榫区域图片映射正确
- 无明显错位 / 裂缝

## Phase 3：收集模式

完成：

- locked / unlocked
- 0/36 → 36/36
- 预设随机顺序
- 每日最多 1 块
- LocalStorage

## Phase 4：解锁与完成动画

完成：

- 单片 reveal
- 36/36 完成反馈
- 重新拼图入口

## Phase 5：自由画布 + Drag

完成：

- scatter
- pointer drag
- zIndex
- responsive logical canvas

此阶段先不要写 Snap。

## Phase 6：Snap

完成：

- neighbor 判断
- 正确相对坐标判断
- 阈值
- 自动吸附
- 错误拼块绝不吸附

## Phase 7：Group

完成：

- 单片 Group
- Group 合并
- Group 整体拖动
- 多 Group 相互吸附

## Phase 8：完成、整理、恢复

完成：

- completion
- 查看原图
- 整理碎片
- 重新打乱
- save / restore

## Phase 9：移动端与视觉优化

完成：

- touch-action
- 手机吸附阈值
- 横竖屏 / resize
- 动画
- 阴影
- 边界

---

# 22. 测试要求

至少覆盖：

1. 0 / 36 初始状态
2. 每日第一次领取
3. 当天重复领取
4. 第 35 → 36 块
5. 页面刷新恢复
6. 切换主题
7. 36 块静态拼合无缝
8. 散落时不大量堆叠
9. 单片拖动
10. 拖出画布边界
11. 错误邻块靠近
12. 正确邻块 Snap
13. 两个 2-piece Group 合并
14. 大 Group 拖动
15. Group 同时靠近多个候选边
16. 35 + 1 最后合并
17. 完成事件只触发一次
18. 退出页面后恢复 Group / 位置
19. 手机触摸拖动
20. 浏览器 resize
21. 横竖屏切换
22. 重新打乱后收藏仍为 36 / 36

---

# 23. 验收标准

## 模板

- [ ] 固定 36 块
- [ ] 固定 6×6
- [ ] 比例 1:1
- [ ] 外框平直
- [ ] 内部邻边严格互补
- [ ] 组合无明显裂缝

## 图片

- [ ] 每主题仅使用 1 张完整原图
- [ ] 不生成 36 张切图
- [ ] ClipPath 显示区域正确
- [ ] 更换主题只替换 imageUrl

## 收集

- [ ] 未解锁无原图
- [ ] 已解锁显示正确区域
- [ ] 预设随机序列
- [ ] 每日最多 1 块
- [ ] 刷新后状态保留

## 自由拼图

- [ ] 36 块可散落
- [ ] 鼠标可拖动
- [ ] 触摸可拖动
- [ ] 禁止旋转
- [ ] 正确邻块自动 Snap
- [ ] 错误邻块不 Snap
- [ ] 连块整体拖动
- [ ] 多 Group 可继续合并

## 完成

- [ ] 36 块组成单 Group 后判定完成
- [ ] 拼图完成动画正常
- [ ] 可再次拼图
- [ ] Collection State 不受影响

## 辅助

- [ ] 查看原图
- [ ] 整理碎片
- [ ] 重新打乱
- [ ] Puzzle Game 自动保存/恢复

---

# 24. V1 明确不做

以下功能禁止在 V1 主动扩展：

- 拼图旋转
- 拼图数量切换
- 难度系统
- 排行榜
- 计时竞技
- 多人拼图
- Ghost Picture
- 用户上传自定义图片
- WebGL
- Three.js
- 复杂粒子系统
- 复杂音效系统

如现有项目没有这些需求，不要自行添加。

---

# 25. 开发执行原则

1. **先阅读现有项目代码与架构，再决定具体实现位置。**
2. 优先复用项目现有组件、状态管理、样式系统。
3. 不要为了本功能重构整个项目。
4. Puzzle Engine 与 UI 分离。
5. 纯算法必须尽量可测试。
6. 每个 Phase 完成后先运行、测试，再进入下一阶段。
7. 遇到现有实现与本文档冲突时，优先保证本文档中的产品行为，并尽量保持工程一致性。
8. 如果必须做产品取舍或缺少关键上下文，暂停编码并明确列出问题；不要擅自改变核心规则。
9. 所有新逻辑保证移动端优先。
10. 最终提交时说明：新增文件、修改文件、核心算法、测试结果、仍存在的问题。

---

# 26. 最终交付要求

开发完成后必须输出：

## A. 实现摘要

说明：

- 收集模式如何实现
- ClipPath 如何实现
- Scatter 如何实现
- Snap 如何实现
- Group 如何实现
- Storage 如何实现

## B. 文件改动清单

逐项列出新增 / 修改的文件。

## C. 测试结果

按本文档“测试要求”逐项说明。

## D. 已知问题

有则明确列出；没有则写“当前未发现阻断性问题”。

---

# 27. 核心定义（一句话）

> 基于 React + TypeScript + SVG 实现固定 6×6、共 36 块的成长拼图系统：使用单张 1:1 原图配合 SVG Path + ClipPath 动态生成碎片，支持任务逐块解锁、未解锁占位、36 块完成态，以及完成后的自由画布打乱、Pointer Events 拖动、邻块 Snap 自动吸附、Group 连块整体移动、自动整理与进度持久化。

