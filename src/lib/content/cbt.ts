import patternsData from '../../content/cbt/cognitive_patterns.json'
import interventionsData from '../../content/cbt/interventions.json'
import questionsData from '../../content/cbt/reflection_questions.json'
import safetyData from '../../content/cbt/safety_rules.json'
import { getEmotionById } from './emotions'

export interface CognitivePattern {
  id: string
  name: string
  english: string
  description: string
  common_expressions: string[]
  related_emotions: string[]
  interventions: string[]
  reflection_questions: string[]
}

export interface SafetyRules {
  role: string
  output_schema: Record<string, string>
  output_limits: Record<string, number | string>
  banned_diagnosis: string[]
  banned_labels: string[]
  hedging_phrases: string[]
  banned_absolute_phrases: string[]
  emotion_response_principle: Record<string, unknown>
  crisis: { keywords: string[]; stop_cbt: boolean; response: string[] }
}

export function getCognitivePatterns(): CognitivePattern[] {
  return patternsData as CognitivePattern[]
}

export function getCognitivePatternById(id: string): CognitivePattern | undefined {
  return getCognitivePatterns().find((p) => p.id === id)
}

/** 调整方法目录：{ 认知模式id: string[] } */
export function getInterventions(): Record<string, string[]> {
  return interventionsData as Record<string, string[]>
}

/** 反思问题目录：{ 认知模式id: string[] } */
export function getReflectionQuestions(): Record<string, string[]> {
  return questionsData as Record<string, string[]>
}

export function getSafetyRules(): SafetyRules {
  return safetyData as unknown as SafetyRules
}

/** 情绪 → 相关认知模式（依据 emotions.json 的映射） */
export function getPatternsForEmotion(emotionId: string): CognitivePattern[] {
  const emotion = getEmotionById(emotionId)
  if (!emotion) return []
  return emotion.related_cognitive_patterns
    .map((id) => getCognitivePatternById(id))
    .filter((p): p is CognitivePattern => Boolean(p))
}

/** 检测高风险内容（自伤/自杀/他伤/即时危险） */
export function detectCrisis(content: string): boolean {
  const rules = getSafetyRules()
  const text = (content || '').toLowerCase()
  return rules.crisis.keywords.some((k) => text.toLowerCase().includes(k))
}

/** 危机安全兜底回复（停止普通 CBT 流程） */
export function getCrisisResponse(): string[] {
  return getSafetyRules().crisis.response
}
