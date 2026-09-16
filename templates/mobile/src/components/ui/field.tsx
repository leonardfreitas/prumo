import { cva } from 'class-variance-authority'
import { forwardRef } from 'react'
import { Text, TextInput, type TextInputProps, View } from 'react-native'

const inputVariants = cva('h-11 rounded-lg border px-3 text-base text-neutral-900', {
  variants: {
    invalid: { true: 'border-red-600', false: 'border-neutral-300' },
  },
  defaultVariants: { invalid: false },
})

type FieldProps = TextInputProps & { label: string; error: string | undefined }

export const Field = forwardRef<TextInput, FieldProps>(function Field(
  { label, error, className, ...props },
  ref,
) {
  return (
    <View testID={`field-${label}`} className="gap-1.5">
      <Text className="text-sm font-medium text-neutral-900">{label}</Text>
      <TextInput
        ref={ref}
        accessibilityLabel={label}
        className={inputVariants({ invalid: error !== undefined, className })}
        {...props}
      />
      {error === undefined ? null : <Text className="text-sm text-red-600">{error}</Text>}
    </View>
  )
})
