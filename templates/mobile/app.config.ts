import type { ConfigContext, ExpoConfig } from 'expo/config'

const REQUIRED = ['EXPO_PUBLIC_API_URL'] as const

export default ({ config }: ConfigContext): ExpoConfig => {
  const missing = REQUIRED.filter((name) => !process.env[name])

  if (missing.length > 0) {
    throw new Error(`Missing environment variables: ${missing.join(', ')}`)
  }

  return config as ExpoConfig
}
