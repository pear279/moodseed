// 情绪搭子头像选择 + 用户自定义头像（均存 localStorage，客户端偏好）

const BUDDY_KEY = 'moodseed_buddy_avatar'
const USER_AVATAR_KEY = 'moodseed_user_avatar'

export type BuddyId = 'boy' | 'girl'

export const BUDDY_AVATARS: Record<BuddyId, string> = {
  boy: '/avatars/boy.jpeg',
  girl: '/avatars/girl.jpeg',
}

export function getBuddyId(): BuddyId {
  try {
    return localStorage.getItem(BUDDY_KEY) === 'girl' ? 'girl' : 'boy'
  } catch {
    return 'boy'
  }
}

export function getBuddyAvatar(): string {
  return BUDDY_AVATARS[getBuddyId()]
}

export function toggleBuddyId(): BuddyId {
  const next: BuddyId = getBuddyId() === 'boy' ? 'girl' : 'boy'
  try {
    localStorage.setItem(BUDDY_KEY, next)
  } catch {
    /* ignore */
  }
  return next
}

export function getUserAvatar(): string | null {
  try {
    return localStorage.getItem(USER_AVATAR_KEY) || null
  } catch {
    return null
  }
}

export function setUserAvatar(url: string | null): void {
  try {
    if (url) localStorage.setItem(USER_AVATAR_KEY, url)
    else localStorage.removeItem(USER_AVATAR_KEY)
  } catch {
    /* ignore */
  }
}
