import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate } from '@tanstack/react-router'
import { keycloak, LOCAL_AUTH } from '../lib/keycloak'
import { localRegister } from '../lib/auth'
import { useAuthStore } from '../store/auth'
import { MoonLoader } from '../components/ui/MoonLoader'
import { AuthFormField } from '../components/ui/AuthFormField'
import { extractApiError } from '../lib/utils'

const MIN_PASSWORD_LENGTH = 8

const schema = z.object({
  name: z.string().min(1, 'Name required'),
  email: z.string().email('Valid email required'),
  password: z.string().min(MIN_PASSWORD_LENGTH, `At least ${MIN_PASSWORD_LENGTH} characters`),
})
type Fields = z.infer<typeof schema>

function KeycloakRedirect() {
  useEffect(() => {
    keycloak.register({ redirectUri: window.location.origin })
  }, [])
  return <MoonLoader />
}

function LocalRegisterForm() {
  const { setAuth } = useAuthStore()
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<Fields>({ resolver: zodResolver(schema) })

  async function onSubmit(values: Fields) {
    try {
      const { token, user } = await localRegister(values.name, values.email, values.password)
      setAuth(token, user)
      navigate({ to: '/' })
    } catch (err) {
      setError('root', { message: extractApiError(err) ?? 'Registration failed' })
    }
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <span className="font-heading text-2xl font-extrabold tracking-[0.18em] text-amber">RIDGELINE</span>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="bg-surface border border-border rounded-lg p-6 flex flex-col gap-4"
        >
          <h1 className="font-heading text-lg font-bold tracking-wide text-text">Create account</h1>

          <AuthFormField
            label="Name"
            type="text"
            autoComplete="name"
            registration={register('name')}
            error={errors.name?.message}
          />

          <AuthFormField
            label="Email"
            type="email"
            autoComplete="email"
            registration={register('email')}
            error={errors.email?.message}
          />

          <AuthFormField
            label="Password"
            type="password"
            autoComplete="new-password"
            registration={register('password')}
            error={errors.password?.message}
          />

          {errors.root && <p className="text-xs text-red-400">{errors.root.message}</p>}

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-1 bg-amber text-bg font-heading font-bold text-sm tracking-widest uppercase py-2 rounded-[5px] hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {isSubmitting ? 'Creating account…' : 'Create account'}
          </button>

          <p className="text-center text-xs text-text-mid">
            Already have an account?{' '}
            <Link to="/login" className="text-amber hover:underline">
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}

export function RegisterPage() {
  if (!LOCAL_AUTH) return <KeycloakRedirect />
  return <LocalRegisterForm />
}