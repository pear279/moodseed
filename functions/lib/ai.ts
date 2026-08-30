import patterns from '../../data/cognitive-patterns.json'
import emotions from '../../data/emotions.json'

export interface AiAnalysis {
  emotion_tags: string[]
  summary: string
  reason: string
  suggestion: string
}

interface EnvLike {
  DEEPSEEK_API_KEY?: string
  DEEPSEEK_BASE_URL?: string
  DEEPSEEK_MODEL?: string
}

interface AnalyzeInput {
  title?: string
  content: string
  tags: string[]
}

const EMOTION_NAMES = emotions.map((e) => e.name).join('、')
const PATTERN_REF = patterns.map((p) => `${p.name}（${p.explanation}）`).join('；')

const SYSTEM_PROMPT = `你是一个温和、克制的情绪记录辅助工具，基于认知行为疗法（CBT）帮助用户识别情绪及可能存在的认知模式。

你的任务：对用户的一条情绪记录做一次简短分析，帮助用户理解自己的情绪。

要求：
1. 识别主要情绪，输出 1～3 个情绪标签（优先从下列情绪中选择，可补充相近词）。
2. 用一句话总结发生了什么。
3. 分析可能的情绪原因，可温和地提及可能的认知模式（如：${PATTERN_REF}），但只做提醒、不下诊断。
4. 给出简单、具体、可执行的调整建议。

输出必须是严格的 JSON 对象，不要输出 JSON 之外的任何文字：
{"emotion_tags":["焦虑","紧张"],"summary":"一句话总结发生了什么","reason":"可能的情绪原因","suggestion":"具体可执行的调整建议"}

边界（必须遵守）：
- 不进行医疗诊断、心理疾病诊断，不给用户贴病理标签。
- 不替代专业治疗，不做绝对化推断。
- 语言短、轻、容易读完，避免长篇心理分析、过度专业术语。
- 用中文回答，语气温和、有陪伴感。

可选情绪标签：${EMOTION_NAMES}`

function normalize(raw: unknown): AiAnalysis {
  const r = (raw ?? {}) as Record<string, unknown>
  const tags = Array.isArray(r.emotion_tags)
    ? r.emotion_tags.filter((t) => typeof t === 'string').slice(0, 3)
    : []
  const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '')
  return {
    emotion_tags: tags,
    summary: str(r.summary),
    reason: str(r.reason),
    suggestion: str(r.suggestion),
  }
}

async function callDeepSeek(env: EnvLike, input: AnalyzeInput): Promise<AiAnalysis> {
  const base = env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com'
  const model = env.DEEPSEEK_MODEL || 'deepseek-v4-flash'
  const userPrompt = [
    input.title ? `标题：${input.title}` : '',
    `正文：${input.content}`,
    input.tags.length ? `用户自选情绪：${input.tags.join('、')}` : '',
  ]
    .filter(Boolean)
    .join('\n')

  const res = await fetch(`${base}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.DEEPSEEK_API_KEY}`,
    },
    body: JSON.stringify({
      model,
      thinking: { type: 'disabled' },
      response_format: { type: 'json_object' },
      temperature: 0.4,
      max_tokens: 500,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
    }),
  })

  if (!res.ok) throw new Error(`DeepSeek HTTP ${res.status}`)
  const data = (await res.json()) as { choices?: { message?: { content?: string } }[] }
  const content = data.choices?.[0]?.message?.content ?? ''
  return normalize(JSON.parse(content))
}

// —— 本地规则兜底：关键词 → 情绪标签 + 温和模板 ——
const KEYWORDS: [string, string[]][] = [
  ['疲惫', ['累', '疲倦', '没力气', '困']],
  ['焦虑', ['焦虑', '担心', '不安', '忐忑']],
  ['紧张', ['紧张', '压力', '考试', '面试']],
  ['难过', ['难过', '伤心', '哭', '失落']],
  ['孤独', ['孤独', '一个人', '寂寞']],
  ['愤怒', ['生气', '愤怒', '气死', '火大']],
  ['委屈', ['委屈', '冤枉']],
  ['内疚', ['内疚', '愧疚', '对不起']],
  ['害怕', ['害怕', '恐惧', '怕']],
  ['失望', ['失望', '落空']],
  ['迷茫', ['迷茫', '不知道', '困惑']],
  ['开心', ['开心', '高兴', '快乐', '喜悦']],
  ['感激', ['感激', '感谢', '谢谢']],
  ['满足', ['满足', '充实', '圆满']],
]

function localFallback(input: AnalyzeInput): AiAnalysis {
  const text = `${input.title ?? ''} ${input.content} ${input.tags.join(' ')}`
  const tags: string[] = input.tags.slice(0, 3)
  for (const [label, kws] of KEYWORDS) {
    if (kws.some((k) => text.includes(k)) && !tags.includes(label)) {
      tags.push(label)
      if (tags.length >= 3) break
    }
  }
  if (tags.length === 0) tags.push('平静')

  return {
    emotion_tags: tags.slice(0, 3),
    summary: `你记录了一件与「${tags[0]}」相关的事情，并愿意把它写下来，这本身就是一种照顾自己。`,
    reason: '你的情绪可能来自这件事带来的压力或期待，试着区分「事实」与「你对它的解读」。',
    suggestion: '可以试着把注意力放回到「此刻能做到的一小步」，先照顾好身体，再慢慢处理这件事。',
  }
}

export async function analyzeRecord(env: EnvLike, input: AnalyzeInput): Promise<AiAnalysis> {
  if (env.DEEPSEEK_API_KEY) {
    try {
      return await callDeepSeek(env, input)
    } catch {
      // 落到本地兜底
    }
  }
  return localFallback(input)
}
