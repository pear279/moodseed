# Moodseed CBT 情绪标签库

CBT = Cognitive Behavioral Therapy，认知行为疗法。

首版情绪标签共 28 个。

AI 每次最多输出：

> **1 个主情绪 + 0～2 个辅助情绪**

不要一次返回大量情绪标签。

---

# 1. 正向 / 舒适情绪

| ID | 情绪 | 英文语义 | 简短定义 |
|---|---|---|---|
| happy | 开心 | Happy | 感受到愉快和积极 |
| excited | 兴奋 | Excited | 因期待或好消息产生较高能量 |
| calm | 平静 | Calm | 内心稳定，没有明显紧张感 |
| relaxed | 放松 | Relaxed | 身心压力有所下降 |
| satisfied | 满足 | Satisfied | 对当前状态或结果感到满意 |
| grateful | 感激 | Grateful | 感受到他人、生活或经历带来的善意 |
| hopeful | 期待 | Hopeful | 对接下来可能发生的事情抱有积极预期 |
| proud | 自豪 | Proud | 对自己的行为或成果产生认可 |

---

# 2. 压力 / 高唤醒情绪

| ID | 情绪 | 英文语义 | 简短定义 |
|---|---|---|---|
| anxious | 焦虑 | Anxious | 对未来不确定性产生担忧 |
| nervous | 紧张 | Nervous | 面对具体事情时感到不安 |
| stressed | 压力 | Stressed | 感到事情、责任或要求超出当前承受范围 |
| irritable | 烦躁 | Irritable | 容易不耐烦或被小事情影响 |
| angry | 愤怒 | Angry | 感觉自己的需求、边界或公平受到侵犯 |
| scared | 害怕 | Afraid | 对可能的危险、失败或损失产生担忧 |
| overwhelmed | 不堪重负 | Overwhelmed | 同时面对太多事情而难以处理 |

---

# 3. 低落 / 失去类情绪

| ID | 情绪 | 英文语义 | 简短定义 |
|---|---|---|---|
| sad | 难过 | Sad | 因失去、受挫或不如预期而低落 |
| disappointed | 失望 | Disappointed | 现实与原本期待产生落差 |
| lonely | 孤独 | Lonely | 感到缺乏连接、理解或陪伴 |
| helpless | 无力 | Helpless | 感觉自己很难改变目前的情况 |
| frustrated | 挫败 | Frustrated | 努力后仍未达到目标 |
| empty | 空落 | Empty | 缺乏明确情绪但感到空缺 |

---

# 4. 自我评价 / 人际情绪

| ID | 情绪 | 英文语义 | 简短定义 |
|---|---|---|---|
| guilty | 内疚 | Guilty | 认为自己的行为影响了别人或违背自己的标准 |
| ashamed | 羞愧 | Ashamed | 对自己产生较强负面评价 |
| wronged | 委屈 | Wronged | 感觉自己的付出、感受或处境没有被理解 |
| jealous | 嫉妒 | Jealous | 因比较或害怕失去而产生不舒服 |
| insecure | 不安 | Insecure | 对自己的能力、关系或价值缺乏确定感 |
| confused | 困惑 | Confused | 面对信息或选择时难以判断 |
| tired | 疲惫 | Tired | 心理或身体能量下降 |

---

# 5. AI 标签输出规则

推荐结构：

```json
{
  "primary_emotion": "焦虑",
  "secondary_emotions": ["紧张", "不安"]
}
```

要求：

- `primary_emotion` 必须且只能有 1 个。
- `secondary_emotions` 最多 2 个。
- 如果只有一种情绪，不需要强行增加辅助标签。
- 优先选择用户能够理解的日常情绪词。
- 用户自定义标签可以保留，但 AI 标准情绪分析仍优先映射到本库。
- 不把疾病名、人格标签或精神医学术语作为情绪标签。
