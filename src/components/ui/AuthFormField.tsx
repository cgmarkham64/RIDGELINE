import type { UseFormRegisterReturn } from 'react-hook-form'

interface AuthFormFieldProps {
  label: string
  type: string
  autoComplete: string
  registration: UseFormRegisterReturn
  error?: string
}

export function AuthFormField({ label, type, autoComplete, registration, error }: AuthFormFieldProps) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs text-text-mid uppercase tracking-widest">{label}</label>
      <input
        {...registration}
        type={type}
        autoComplete={autoComplete}
        className="bg-surface-2 border border-border rounded-[5px] px-3 py-2 text-sm text-text placeholder:text-text-dim focus:outline-none focus:border-amber"
      />
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
}
