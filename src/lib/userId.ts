import { USER_ID_KEY } from './constants'

function uuid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  // 兜底
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

export function getUserId(): string {
  let id = localStorage.getItem(USER_ID_KEY)
  if (!id) {
    id = uuid()
    localStorage.setItem(USER_ID_KEY, id)
  }
  return id
}
