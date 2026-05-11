import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate } from '@tanstack/react-router'
import { keycloak, LOCAL_AUTH } from '../lib/keycloak'
import { localRegister } from '../lib/auth'
import { useAuthStore } from '../store/auth'
import { MoonLoader } from '../components/ui/MoonLoader'
import { extractApiError } from '../lib/utils'

const schema = z.object({
  name: z.string().min(1, 'Name required'),
  email: z.string().email('Valid email required'),
  password: z.string().min(8, 'At least 8 characters'),
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

          <div className="flex flex-col gap-1">
            <label className="text-xs text-text-mid uppercase tracking-widest">Name</label>
            <input
              {...register('name')}
              type="text"
              autoComplete="name"
              className="bg-surface-2 border border-border rounded-[5px] px-3 py-2 text-sm text-text placeholder:text-text-dim focus:outline-none focus:border-amber"
            />
            {errors.name && <p className="text-xs text-red-400">{errors.name.message}</p>}
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-text-mid uppercase tracking-widest">Email</label>
            <input
              {...register('email')}
              type="email"
              autoComplete="email"
              className="bg-surface-2 border border-border rounded-[5px] px-3 py-2 text-sm text-text placeholder:text-text-dim focus:outline-none focus:border-amber"
            />
            {errors.email && <p className="text-xs text-red-400">{errors.email.message}</p>}
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-text-mid uppercase tracking-widest">Password</label>
            <input
              {...register('password')}
              type="password"
              autoComplete="new-password"
              className="bg-surface-2 border border-border rounded-[5px] px-3 py-2 text-sm text-text placeholder:text-text-dim focus:outline-none focus:border-amber"
            />
            {errors.password && <p className="text-xs text-red-400">{errors.password.message}</p>}
          </div>

          {errors.root && (
            <p className="text-xs text-red-400">{errors.root.message}</p>
          )}

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