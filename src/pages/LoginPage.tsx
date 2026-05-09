import { useEffect } from 'react'
import { keycloak } from '../lib/keycloak'
import { MoonLoader } from '../components/ui/MoonLoader'

export function LoginPage() {
  useEffect(() => {
    keycloak.login({ redirectUri: window.location.origin })
  }, [])

  return <MoonLoader />
}