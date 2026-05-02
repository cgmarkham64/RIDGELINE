import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate, Link } from '@tanstack/react-router'
import { register as registerUser } from '../lib/auth'
import { useAuthStore } from '../store/auth'
import { AuthLayout } from '../components/layout/AuthLayout'

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.email('Invalid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

type FormValues = z.infer<typeof schema>

export function RegisterPage() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  const onSubmit = async (values: FormValues) => {
    try {
      const { token, user } = await registerUser(values)
      setAuth(token, user)
      await navigate({to: '/'})
    } catch (err) {
      setError('root', { message: err instanceof Error ? err.message : 'Registration failed' })
    }
  }

  return (
    <AuthLayout>
      <form onSubmit={handleSubmit(onSubmit)} className="auth-form">
        <h1>Create account</h1>

        <div className="field">
          <label htmlFor="name">Name</label>
          <input id="name" type="text" autoComplete="name" {...register('name')} />
          {errors.name && <span className="error">{errors.name.message}</span>}
        </div>

        <div className="field">
          <label htmlFor="email">Email</label>
          <input id="email" type="email" autoComplete="email" {...register('email')} />
          {errors.email && <span className="error">{errors.email.message}</span>}
        </div>

        <div className="field">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            {...register('password')}
          />
          {errors.password && <span className="error">{errors.password.message}</span>}
        </div>

        {errors.root && <p className="error">{errors.root.message}</p>}

        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Creating account…' : 'Create account'}
        </button>

        <p>
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </form>
    </AuthLayout>
  )
}
