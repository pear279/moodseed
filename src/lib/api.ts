import type {
  AiAnalysis,
  Bottle,
  CheckinToday,
  DayActivity,
  ProgressOverview,
  RecordItem,
  User,
  UserStats,
} from './types'

// Cloudinary 图片直传配置（unsigned upload preset，无需后端/R2）
const CLOUDINARY_CLOUD_NAME = 'fhxppzq9'
const CLOUDINARY_UPLOAD_PRESET = 'moodseed_upload'

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  })
  if (!res.ok) {
    let msg = `请求失败 (${res.status})`
    try {
      const body = await res.json()
      if (body?.error) msg = body.error
    } catch {
      /* ignore */
    }
    throw new Error(msg)
  }
  return res.json() as Promise<T>
}

export interface CreateRecordPayload {
  userId: string
  title?: string
  content: string
  emotionTags: string[]
  images: string[]
  analyze?: boolean
}

export interface CreateRecordResponse {
  record: RecordItem
  analysis: AiAnalysis | null
  pieceAwarded: number
  unlockedCount: number
}

export interface ExchangeResponse {
  points: number
  pieceAwarded: number
  unlockedCount: number
  plantId: string
}

export const api = {
  // —— 用户 ——
  ensureUser: (id: string) =>
    request<User>('/api/user', { method: 'POST', body: JSON.stringify({ id }) }),
  updateUser: (id: string, patch: Partial<Pick<User, 'nickname' | 'birthday' | 'mbti'>>) =>
    request<User>(`/api/user/${id}`, { method: 'PATCH', body: JSON.stringify(patch) }),
  getUser: (id: string) =>
    request<User & { stats: UserStats; activity: DayActivity[] }>(`/api/user/${id}`),

  // —— 签到 ——
  checkin: (userId: string) =>
    request<CheckinToday>('/api/checkin', { method: 'POST', body: JSON.stringify({ userId }) }),
  todayCheckin: (userId: string) =>
    request<CheckinToday>(`/api/checkin/today?userId=${encodeURIComponent(userId)}`),

  // —— 记录 ——
  createRecord: (payload: CreateRecordPayload) =>
    request<CreateRecordResponse>('/api/records', { method: 'POST', body: JSON.stringify(payload) }),
  listRecords: (userId: string) =>
    request<RecordItem[]>(`/api/records?userId=${encodeURIComponent(userId)}`),
  getRecord: (id: string) => request<RecordItem>(`/api/records/${id}`),
  updateRecord: (id: string, payload: Omit<CreateRecordPayload, 'userId'>) =>
    request<{ record: RecordItem }>(`/api/records/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteRecord: (id: string) => request<{ ok: boolean }>(`/api/records/${id}`, { method: 'DELETE' }),
  analyzeRecord: (id: string) =>
    request<AiAnalysis>(`/api/records/${id}/analyze`, { method: 'POST' }),

  // —— 进度 / 兑换 ——
  progress: (userId: string) =>
    request<ProgressOverview>(`/api/progress?userId=${encodeURIComponent(userId)}`),
  exchange: (userId: string) =>
    request<ExchangeResponse>('/api/exchange', { method: 'POST', body: JSON.stringify({ userId }) }),

  // —— 漂流瓶 ——
  randomBottle: (userId: string, plantId: string) =>
    request<Bottle | null>(
      `/api/bottles/random?userId=${encodeURIComponent(userId)}&plantId=${encodeURIComponent(plantId)}`,
    ),
  publishBottle: (payload: { userId: string; plantId: string; content: string; emotionTags: string[] }) =>
    request<Bottle>('/api/bottles', { method: 'POST', body: JSON.stringify(payload) }),
  getBottle: (id: string, userId: string) =>
    request<Bottle>(`/api/bottles/${id}?userId=${encodeURIComponent(userId)}`),
  likeBottle: (id: string, userId: string) =>
    request<{ liked: boolean; likes_count: number }>(`/api/bottles/${id}/like`, {
      method: 'POST',
      body: JSON.stringify({ userId }),
    }),
  commentBottle: (id: string, userId: string, content: string) =>
    request<{ ok: boolean }>(`/api/bottles/${id}/comments`, {
      method: 'POST',
      body: JSON.stringify({ userId, content }),
    }),
  reportBottle: (id: string, userId: string) =>
    request<{ ok: boolean }>(`/api/bottles/${id}/report`, {
      method: 'POST',
      body: JSON.stringify({ userId }),
    }),
  deleteBottle: (id: string, userId: string) =>
    request<{ ok: boolean }>(`/api/bottles/${id}`, {
      method: 'DELETE',
      body: JSON.stringify({ userId }),
    }),

  // —— 图片上传（Cloudinary 直传，unsigned preset）——
  uploadImage: async (file: File): Promise<string> => {
    const form = new FormData()
    form.append('file', file)
    form.append('upload_preset', CLOUDINARY_UPLOAD_PRESET)
    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
      { method: 'POST', body: form },
    )
    if (!res.ok) throw new Error('图片上传失败')
    const data = (await res.json()) as { secure_url: string }
    return data.secure_url
  },

  // —— 情绪搭子对话 ——
  chat: (messages: { role: 'user' | 'assistant'; content: string }[]) =>
    request<{ reply: string }>(`/api/chat`, {
      method: 'POST',
      body: JSON.stringify({ messages }),
    }),
}
