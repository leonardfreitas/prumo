import type { FieldErrors } from 'react-hook-form'
import { Text } from 'react-native'

export function FormError({ errors }: { errors: FieldErrors }) {
  const message = errors.root?.server?.message

  if (message === undefined) {
    return null
  }

  return (
    <Text accessibilityRole="alert" className="text-sm text-red-600">
      {message}
    </Text>
  )
}
