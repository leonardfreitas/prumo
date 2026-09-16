import { createMMKV } from 'react-native-mmkv'

export const storage = createMMKV({ id: 'app' })

export const USER_KEYS = { queryCache: 'user.query-cache' } as const

export function clearUserData(): void {
  for (const key of Object.values(USER_KEYS)) {
    storage.remove(key)
  }
}
