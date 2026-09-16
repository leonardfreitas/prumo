import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import { Controller, useForm } from 'react-hook-form'
import { View } from 'react-native'
import { z } from 'zod'
import { ApiError } from '@/api-contract'
import { Button } from '@/components/ui/button'
import { Field } from '@/components/ui/field'
import { FormError } from '@/features/forms/form-error'
import { applyServerError } from '@/features/forms/server-errors'
import type { SessionAuth } from './auth-client'
import { sessionQuery } from './session'

const schema = z.object({
  name: z.string().min(1).max(80),
  email: z.email(),
  password: z.string().min(8),
})

type SignUpValues = z.infer<typeof schema>

export function SignUpForm({ auth, onSignedUp }: { auth: SessionAuth; onSignedUp: () => void }) {
  const queryClient = useQueryClient()
  const form = useForm<SignUpValues>({
    resolver: zodResolver(schema),
    mode: 'onTouched',
    reValidateMode: 'onChange',
    defaultValues: { name: '', email: '', password: '' },
  })
  const { errors, isSubmitting } = form.formState

  async function onSubmit(values: SignUpValues) {
    const { error } = await auth.signUp.email(values)

    if (error !== null) {
      applyServerError(ApiError.fromAuthError(error), ['name', 'email', 'password'], form.setError)
      return
    }

    await queryClient.invalidateQueries({ queryKey: sessionQuery(auth).queryKey })
    onSignedUp()
  }

  return (
    <View className="gap-6">
      <FormError errors={errors} />
      <Controller
        control={form.control}
        name="name"
        render={({ field }) => (
          <Field
            label="Name"
            autoComplete="name"
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={errors.name?.message}
          />
        )}
      />
      <Controller
        control={form.control}
        name="email"
        render={({ field }) => (
          <Field
            label="Email"
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={errors.email?.message}
          />
        )}
      />
      <Controller
        control={form.control}
        name="password"
        render={({ field }) => (
          <Field
            label="Password"
            secureTextEntry
            autoComplete="new-password"
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={errors.password?.message}
          />
        )}
      />
      <Button
        label="Create account"
        disabled={isSubmitting}
        onPress={form.handleSubmit(onSubmit)}
      />
    </View>
  )
}
