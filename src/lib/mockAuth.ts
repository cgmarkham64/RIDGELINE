import type { AuthResponse, LoginInput, RegisterInput } from '../types/auth'

const MOCK_DELAY = 500

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

// Not a real JWT — just a mock token for dev purposes
const mockToken = (email: string) =>
  btoa(JSON.stringify({ sub: email, exp: Date.now() + 86_400_000 }))

export async function mockLogin({ email, password }: LoginInput): Promise<AuthResponse> {
  await delay(MOCK_DELAY)
  if (password.length < 6) throw new Error('Invalid credentials')
  return {
    token: mockToken(email),
    user: { id: '1', email, name: email.split('@')[0] },
  }
}

export async function mockRegister({
  name,
  email,
  password,
}: RegisterInput): Promise<AuthResponse> {
  await delay(MOCK_DELAY)
  if (password.length < 6) throw new Error('Password must be at least 6 characters')
  return {
    token: mockToken(email),
    user: { id: '1', email, name },
  }
}
