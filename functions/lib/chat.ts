import {
  detectCrisis,
  getCrisisResponse,
  getCognitivePatterns,
  getSafetyRules,
} from '../../src/lib/content/cbt'
import { getEmotionNames } from '../../src/lib/content/emotions'
import { hasBanned } from './security'

interface EnvLike {
  DEEPSEEK_API_KEY?: string
  DEEPSEEK_BASE_URL?: string
  DEEPSEEK_MODEL?: string
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

const SAFETY = getSafetyRules()
const EMOTION_NAMES = getEmotionNames()
const PATTERN_REF = getCognitivePatterns()
  .map((p) => `- ${p.name}：${p.description}（调整方向如：${p.interventions[0]}）`)
  .join('\n')

const SYSTEM_PROMPT = `你是「情绪搭子」，一位温和、克制、有陪伴感的情绪倾听伙伴，帮助用户看见并理解自己的情绪。你是${SAFETY.role}

你的任务：和用户自然对话，先共情、接纳用户的情绪，再结合认知行为疗法(CBT)的思路，温和地分析情绪可能的原因，最后委婉地给出一个具体可执行的小建议。

要求：
1. 先共情，再引导；不要说教，不要急于给建议，语气温和克制有陪伴感。
2. 情绪原因可以结合下列认知模式作为内部分析依据，但不要贴标签（不说"你存在灾难化认知"），要转成自然表达，例如"你似乎提前想到了几个可能出现的问题，也因此把还没发生的结果想得更严重了一些"：
${PATTERN_REF}
3. 建议要具体、轻量、可执行，一次只给一个；篇幅适中，不要长篇大论。
4. 优先从这些情绪词理解用户的情绪（不要用疾病名、人格标签或精神医学术语）：${EMOTION_NAMES}。
5. 信息不足时用"可能/似乎/或许/听起来"等委婉表达；避免"一定/肯定/你就是/显然"等绝对化判断。
6. 不诊断心理疾病、不使用医疗判断；避免"你应该积极一点""不要想太多""这没什么"。
7. 用中文回答。`

// 敏感词委婉兜底（不进入 AI，避免相关风险）
const SENSITIVE_REPLY =
  '这个话题我可能不太擅长。我们可以聊聊你最近的心情，或是一件让你在意的小事，好吗？'

// 无 Key / 调用失败时的本地兜底
function localFallback(lastUser: string): string {
  if (detectCrisis(lastUser)) {
    return getCrisisResponse().join('\n')
  }
  return '我在这里听着。可以多和我说说，这件事让你有什么样的感受吗？'
}

async function callDeepSeek(env: EnvLike, messages: ChatMessage[]): Promise<string> {
  const base = env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com'
  const model = env.DEEPSEEK_MODEL || 'deepseek-v4-flash'
  const res = await fetch(`${base}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.DEEPSEEK_API_KEY}`,
    },
    body: JSON.stringify({
      model,
      thinking: { type: 'disabled' },
      temperature: 0.7,
      max_tokens: 600,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...messages.map((m) => ({ role: m.role, content: m.content })),
      ],
    }),
  })
  if (!res.ok) throw new Error(`DeepSeek HTTP ${res.status}`)
  const data = (await res.json()) as { choices?: { message?: { content?: string } }[] }
  return data.choices?.[0]?.message?.content?.trim() ?? ''
}

export async function chat(env: EnvLike, messages: ChatMessage[]): Promise<string> {
  const lastUser = [...messages].reverse().find((m) => m.role === 'user')?.content ?? ''

  // 1. 危机内容优先（自伤/自杀/他伤 → 安全兜底）
  if (detectCrisis(lastUser)) {
    return getCrisisResponse().join('\n')
  }

  // 2. 敏感词委婉提示（不进 AI）
  if (hasBanned(lastUser)) {
    return SENSITIVE_REPLY
  }

  // 3. 调 DeepSeek（有 Key）
  if (env.DEEPSEEK_API_KEY) {
    try {
      const reply = await callDeepSeek(env, messages)
      if (reply) return reply
    } catch {
      // 落到本地兜底
    }
  }

  // 4. 本地兜底
  return localFallback(lastUser)
}
