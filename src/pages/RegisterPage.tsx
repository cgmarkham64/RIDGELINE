import { useEffect } from 'react'
import { keycloak } from '../lib/keycloak'
import { MoonLoader } from '../components/ui/MoonLoader'

export function RegisterPage() {
  useEffect(() => {
    keycloak.register({ redirectUri: window.location.origin })
  }, [])

  return <MoonLoader />
}