import {
  detectCrisis,
  getCrisisResponse,
  getCognitivePatterns,
  getSafetyRules,
} from '../../src/lib/content/cbt'
import { getEmotionNames } from '../../src/lib/content/emotions'

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
  /** 用户自选情绪（可为空数组） */
  user_selected_emotions: string[]
}

const EMOTION_NAMES = getEmotionNames()
const SAFETY = getSafetyRules()
const PATTERN_REF = getCognitivePatterns()
  .map((p) => `- ${p.name}：${p.description}（调整方向如：${p.interventions[0]}）`)
  .join('\n')

const SYSTEM_PROMPT = `你是${SAFETY.role}。

你的任务：对用户的一条情绪记录做一次简短分析，帮助用户理解自己的情绪。

输入包含：标题、正文、用户自选情绪。

输出必须是严格的 JSON 对象，不要输出 JSON 之外的任何文字：
{"emotion_tags":["焦虑","紧张"],"summary":"一句话总结发生了什么","reason":"可能的情绪原因","suggestion":"具体可执行的调整建议"}

要求：
1. emotion_tags 最多 3 个，优先从下列情绪词中选择：${EMOTION_NAMES}。不要把疾病名、人格标签或精神医学术语作为情绪标签。
2. summary 30～60 字；reason 60～100 字；suggestion 60～120 字。整体短、轻、自然、容易读完。
3. 情绪原因可以温和地结合以下认知模式作为【内部分析依据】，但不要把模式名直接贴给用户（不要说「你存在灾难化认知」），要转成自然表达，例如「你似乎提前想到了几个可能出现的问题，也因此把还没有发生的结果想得更严重了一些」。
${PATTERN_REF}
4. 当证据不足时，不要强行套用认知模式；可以只做情绪识别和普通支持。

安全边界（必须遵守）：
- 禁止心理疾病诊断、医疗诊断、人格病理标签、绝对化判断。
- 信息不足时优先使用：${SAFETY.hedging_phrases.join('、')}；避免：${SAFETY.banned_absolute_phrases.join('、')}。
- 情绪可以先被看见，再进行调整；先共情，再给一个小建议。避免「你应该积极一点」「不要想太多」「这没什么」。
- 用中文回答，语气温和、克制、有陪伴感。`

function normalize(raw: unknown): AiAnalysis {
  const r = (raw ?? {}) as Record<string, unknown>
  const banned = SAFETY.banned_diagnosis
  const tags = Array.isArray(r.emotion_tags)
    ? (r.emotion_tags as unknown[])
        .filter((t): t is string => typeof t === 'string' && t.trim().length > 0)
        .filter((t) => !banned.some((b) => t.includes(b)))
        .slice(0, 3)
    : []
  const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '')
  return {
    emotion_tags: tags,
    summary: str(r.summary),
    reason: str(r.reason),
    suggestion: str(r.suggestion),
  }
}

/** 高风险内容：停止普通 CBT 流程，进入安全兜底 */
function crisisFallback(): AiAnalysis {
  const lines = getCrisisResponse()
  return {
    emotion_tags: [],
    summary: lines[0] ?? '',
    reason: lines[1] ?? '',
    suggestion: [lines[2], lines[3]].filter(Boolean).join(' '),
  }
}

async function callDeepSeek(env: EnvLike, input: AnalyzeInput): Promise<AiAnalysis> {
  const base = env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com'
  const model = env.DEEPSEEK_MODEL || 'deepseek-v4-flash'
  const userPrompt = [
    input.title ? `标题：${input.title}` : '',
    `正文：${input.content}`,
    input.user_selected_emotions.length
      ? `用户自选情绪：${input.user_selected_emotions.join('、')}`
      : '',
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

// —— 本地规则兜底：关键词 → 情绪标签 + 温和模板（无 API Key 时）——
const KEYWORDS: [string, string[]][] = [
  ['焦虑', ['焦虑', '担心', '不安', '忐忑']],
  ['紧张', ['紧张', '考试', '面试']],
  ['压力', ['压力', '忙', '任务多', '喘不过气']],
  ['疲惫', ['累', '疲倦', '没力气', '困', '疲惫']],
  ['烦躁', ['烦', '烦躁', '不耐烦']],
  ['愤怒', ['生气', '愤怒', '气死', '火大']],
  ['害怕', ['害怕', '恐惧', '怕']],
  ['难过', ['难过', '伤心', '哭', '失落']],
  ['失望', ['失望', '落空']],
  ['孤独', ['孤独', '一个人', '寂寞']],
  ['无力', ['无力', '无能为力', '没办法']],
  ['挫败', ['挫败', '失败', '没做好']],
  ['内疚', ['内疚', '愧疚', '对不起']],
  ['委屈', ['委屈', '冤枉']],
  ['嫉妒', ['嫉妒', '眼红', '比不上']],
  ['困惑', ['困惑', '迷茫', '不知道']],
  ['开心', ['开心', '高兴', '快乐', '喜悦']],
  ['感激', ['感激', '感谢', '谢谢']],
  ['满足', ['满足', '充实', '圆满']],
  ['放松', ['放松', '轻松', '舒服']],
]

function localFallback(input: AnalyzeInput): AiAnalysis {
  const text = `${input.title ?? ''} ${input.content} ${input.user_selected_emotions.join(' ')}`
  const tags: string[] = input.user_selected_emotions.slice(0, 3)
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
    reason:
      '从这段记录来看，你的情绪可能与这件事带来的压力或期待有关，也许可以试着区分「已经发生的事实」和「对它的解读」。',
    suggestion:
      '可以先把注意力放回此刻能做的一小步，也可以问问自己：现在担心的是已经发生的事实，还是对未来的预测？',
  }
}

export async function analyzeRecord(env: EnvLike, input: AnalyzeInput): Promise<AiAnalysis> {
  // 高风险内容优先进入安全兜底
  if (detectCrisis(input.content)) {
    return crisisFallback()
  }
  if (env.DEEPSEEK_API_KEY) {
    try {
      return await callDeepSeek(env, input)
    } catch {
      // 落到本地兜底
    }
  }
  return localFallback(input)
}
