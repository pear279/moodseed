# Moodseed 内容知识库开发任务 Prompt

请阅读本目录中的全部 Markdown 文件，并基于这些内容为 Moodseed 搭建「内容知识库与内容调用层」。

本次任务只负责：

1. 植物内容库
2. CBT 内容库
3. 情绪与植物映射
4. AI 安全边界
5. 幸运卡内容库
6. 内容读取与调用逻辑

不要擅自增加新的产品功能。

---

# 一、产品背景

Moodseed 是一个：

> **情绪记录 + CBT 认知行为疗法 + 植物拼图成长**

的轻量移动端产品。

CBT 全称：

**Cognitive Behavioral Therapy**

即认知行为疗法。

核心闭环：

> 记录 → AI 理解 → 获得拼图碎片 → 修复植物 → 获得植物卡片 → 继续记录

AI 首版只负责单条情绪记录分析。

不做 AI 聊天。

---

# 二、先阅读以下文件

请先完整阅读：

1. `01_PLANTS.md`
2. `02_EMOTIONS.md`
3. `03_CBT_PATTERNS_AND_INTERVENTIONS.md`
4. `04_EMOTION_PLANT_MAPPING.md`
5. `05_AI_SAFETY_AND_OUTPUT.md`
6. `06_FORTUNE_CARD.md`

这些文件是本次实现的内容源。

不得擅自修改核心规则。

---

# 三、植物内容库

首版只有 3 株植物，按固定顺序：

1. 薄荷-平静
2. 仙人掌-边界
3. 蒲公英-放下

建议创建：

`src/content/plants/plants.json`

每株植物至少包含：

```text
id
order
plant_name
card_name
emotion_theme
related_emotions
related_cognitive_patterns
quote
image_path
puzzle_piece_count
```

其中：

`puzzle_piece_count = 48`

植物卡前端只展示：

- 植物名称
- 情绪关键词
- 一句话情绪表达

不要增加植物百科、长篇 CBT 知识或学习课程。

---

# 四、CBT 内容库

建议建立：

```text
src/content/cbt/
├── emotions.json
├── cognitive_patterns.json
├── interventions.json
├── reflection_questions.json
└── safety_rules.json
```

或者在不增加无意义复杂度的前提下，根据现有项目结构适当合并。

需要完整录入：

- 28 个情绪标签
- 12 个常见认知模式
- 每个模式的简短说明
- 常见表达
- 调整方法
- 反思问题
- AI 安全边界

每个认知模式至少包含：

```text
id
name
description
common_expressions
related_emotions
interventions
reflection_questions
```

---

# 五、植物与情绪映射

将 `04_EMOTION_PLANT_MAPPING.md` 中的数据结构化。

建立：

> 情绪 → 可能认知模式 → 调整方向 → 植物主题

的映射。

重要规则：

**用户当前植物不能根据单条记录情绪自动切换。**

例如当前正在解锁：

> 薄荷-平静

即使某条记录识别为：

> 委屈

奖励仍进入薄荷。

只有当前 48 块拼图全部完成，才进入下一株植物。

---

# 六、AI 分析

模型：

**DeepSeek-V4-Flash**

AI 只分析用户的一条记录。

输入：

```text
title
content
user_selected_emotions
```

处理逻辑：

```text
用户记录
↓
识别 1 个主情绪 + 最多 2 个辅助情绪
↓
判断是否存在明显 CBT 认知模式
↓
证据不足时不强行判断
↓
选择最相关的 1 个调整方向
↓
生成自然语言回复
```

最终只返回：

```json
{
  "emotion_tags": [],
  "summary": "",
  "reason": "",
  "suggestion": ""
}
```

要求：

- emotion_tags 最多 3 个。
- summary 30～60 字。
- reason 60～100 字。
- suggestion 60～120 字。
- 输出必须为合法结构化 JSON。

---

# 七、AI 展示原则

CBT 模式只作为内部生成依据。

前端不要直接显示：

> “你存在灾难化认知。”

推荐转换为：

> “你似乎提前想到了几个可能出现的问题，也因此把还没有发生的结果想得更严重了一些。”

当证据不足时：

不要为了使用 CBT 知识库强行套模式。

---

# 八、AI 安全

严格遵循：

`05_AI_SAFETY_AND_OUTPUT.md`

禁止：

- 心理疾病诊断
- 医疗诊断
- 人格病理标签
- 绝对化判断
- 声称代替心理治疗

涉及明确自伤、自杀、他伤或即时严重危险时：

停止普通 CBT 生成流程，进入安全兜底逻辑。

---

# 九、幸运卡内容库

建议建立：

```text
src/content/fortune/
├── messages.json
├── colors.json
├── foods.json
├── activities.json
└── fortune-config.json
```

完整录入：

- 120 条幸运语
- 24 个幸运颜色与 HEX
- 30 个幸运食物
- 建议事项池
- 避免事项池

全部来源：

`06_FORTUNE_CARD.md`

---

# 十、幸运卡生成

不要调用 DeepSeek 或其他 AI 实时生成幸运卡。

每天通过：

```text
date + anonymous_user_id
```

产生稳定随机 Seed。

要求：

同一用户同一天：

> 无论刷新多少次，结果必须相同。

第二天：

> 生成新内容。

每日生成：

```text
lucky_color：1 个
lucky_numbers：1～9 中 2 个不重复数字
lucky_food：1 个
daily_message：1 条
recommended：2 条不重复
avoid：2 条不重复
```

---

# 十一、幸运卡 UI 数据

前端结构参考现有设计。

顶部保留：

- 幸运颜色
- 幸运数字
- 幸运食物

删除第二行说明文字：

- 「幸运色」
- 「幸运数字」
- 「幸运食物」

例如顶部直接展示：

```text
🟩 鼠尾草绿 | 3、7 | 🍌 香蕉
```

中间：

一条 `daily_message`

底部：

```text
建议：2 项
避免：2 项
```

不要额外增加模块。

---

# 十二、内容目录建议

最终建议：

```text
src/content/
├── plants/
│   └── plants.json
├── cbt/
│   ├── emotions.json
│   ├── cognitive_patterns.json
│   ├── interventions.json
│   ├── reflection_questions.json
│   └── safety_rules.json
└── fortune/
    ├── messages.json
    ├── colors.json
    ├── foods.json
    ├── activities.json
    └── fortune-config.json
```

同时建立：

```text
src/lib/content/
```

负责统一内容读取和规则调用。

不要让 React 页面组件直接承担大量内容映射逻辑。

---

# 十三、技术原则

当前只是需要稳定部署的 Demo。

优先：

- 简单
- 稳定
- 低成本
- 易维护
- 易替换

不要引入：

- CMS
- 向量数据库
- RAG
- 复杂知识图谱
- 推荐算法
- 重型内容管理服务

RAG 全称：

**Retrieval-Augmented Generation**

即检索增强生成。

当前内容规模使用本地 JSON / TypeScript 配置已经足够。

---

# 十四、执行步骤

请严格按照下面顺序执行：

1. 阅读现有项目代码和目录结构。
2. 阅读本目录全部 Markdown 内容文件。
3. 判断如何在不破坏现有架构的情况下接入。
4. 先输出准备新增和修改的文件清单。
5. 再开始编码。
6. 将 Markdown 内容转换为结构化 JSON / TypeScript 数据。
7. 建立统一内容读取层。
8. 接入 DeepSeek 单条记录分析。
9. 接入幸运卡稳定随机逻辑。
10. 检查 TypeScript 类型。
11. 检查 JSON 格式。
12. 检查 AI JSON Schema。
13. 检查幸运卡同日刷新结果是否一致。
14. 检查不存在无必要的页面硬编码。
15. 检查没有修改本任务以外的产品功能。

完成后请汇报：

- 新增文件
- 修改文件
- 数据结构
- AI 调用链路
- 幸运卡生成逻辑
- 测试结果
- 当前仍需我提供的素材
