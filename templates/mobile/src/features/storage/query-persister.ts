import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister'
import { storage, USER_KEYS } from './storage'

export const QUERY_CACHE_MAX_AGE = 24 * 60 * 60 * 1000

export const queryPersister = createSyncStoragePersister({
  key: USER_KEYS.queryCache,
  storage: {
    getItem: (key) => storage.getString(key) ?? null,
    setItem: (key, value) => storage.set(key, value),
    removeItem: (key) => {
      storage.remove(key)
    },
  },
})
