export interface User {
  id: string
  email: string
  name: string
  avatarUrl?: string
}

export interface LoginInput {
  email: string
  password: string
}

export interface RegisterInput {
  name: string
  email: string
  password: string
}

export interface AuthResponse {
  token: string
  user: User
}
