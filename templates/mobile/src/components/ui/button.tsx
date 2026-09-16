import { cva, type VariantProps } from 'class-variance-authority'
import { Pressable, type PressableProps, Text } from 'react-native'

const buttonVariants = cva('h-11 items-center justify-center rounded-lg px-4', {
  variants: {
    variant: {
      default: 'bg-neutral-900',
      outline: 'border border-neutral-300 bg-transparent',
    },
    disabled: { true: 'opacity-50', false: '' },
  },
  defaultVariants: { variant: 'default', disabled: false },
})

const labelVariants = cva('text-base font-medium', {
  variants: {
    variant: { default: 'text-white', outline: 'text-neutral-900' },
  },
  defaultVariants: { variant: 'default' },
})

type ButtonProps = Omit<PressableProps, 'children'> &
  VariantProps<typeof buttonVariants> & { label: string }

export function Button({ label, variant, disabled, className, ...props }: ButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled === true}
      className={buttonVariants({ variant, disabled: disabled === true, className })}
      {...props}
    >
      <Text className={labelVariants({ variant })}>{label}</Text>
    </Pressable>
  )
}
