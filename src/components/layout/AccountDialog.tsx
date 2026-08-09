import { useState } from 'react'
import { IconX } from '../icons'
import { Modal } from '../ui/Modal'
import { useAvatarUpload } from './account/useAvatarUpload'
import { useAccountPreferences } from './account/useAccountPreferences'
import { ProfileTab } from './account/ProfileTab'
import { PreferencesTab } from './account/PreferencesTab'

interface Props {
  onClose: () => void
}

export function AccountDialog({ onClose }: Props) {
  const [activeTab, setActiveTab] = useState<'profile' | 'preferences'>('profile')
  const avatar = useAvatarUpload()
  const preferences = useAccountPreferences()

  if (!avatar.user) return null

  const tabCls = (tab: typeof activeTab) =>
    `pb-2.5 pr-5 font-mono text-fine border-b-2 -mb-px transition-colors cursor-pointer bg-transparent border-x-0 border-t-0 ${
      activeTab === tab
        ? 'text-amber border-amber'
        : 'text-text-dim border-transparent hover:text-text-mid'
    }`

  return (
    <Modal
      onClose={onClose}
      zIndexClassName="z-1001"
      backdropClassName="bg-black/70 backdrop-blur-sm"
      panelClassName="bg-surface border border-border-mid rounded-lg w-full max-w-lg mx-4 overflow-hidden max-h-[90vh] overflow-y-auto"
    >
      {/* ── Sticky header + tab strip ────────────────────────────────────── */}
      <div className="sticky top-0 bg-surface z-1 border-b border-border">
        <div className="flex items-center justify-between px-5 pt-4 pb-3">
          <span className="font-heading text-sm font-extrabold text-text">Account</span>
          <button onClick={onClose} className="w-7 h-7 rounded-sm flex items-center justify-center bg-surface-2 border border-border cursor-pointer text-text-dim">
            <IconX size={14} />
          </button>
        </div>
        <div className="flex px-5">
          <button className={tabCls('profile')}    onClick={() => setActiveTab('profile')}>Profile</button>
          <button className={tabCls('preferences')} onClick={() => setActiveTab('preferences')}>Preferences</button>
        </div>
      </div>

      <div className="px-5 py-5 flex flex-col gap-5">
        {activeTab === 'profile' && (
          <ProfileTab
            user={avatar.user}
            fileRef={avatar.fileRef}
            avatarSaving={avatar.avatarSaving}
            avatarError={avatar.avatarError}
            onAvatarChange={avatar.handleAvatarChange}
            onRemoveAvatar={avatar.handleRemoveAvatar}
          />
        )}
        {activeTab === 'preferences' && (
          <PreferencesTab
            prefs={preferences.prefs}
            prefsSaving={preferences.prefsSaving}
            prefsError={preferences.prefsError}
            prefsSaved={preferences.prefsSaved}
            onUnitSystemChange={preferences.setUnitSystem}
            onTimePrefChange={preferences.patchTimePref}
            onWeatherToleranceChange={preferences.patchWeatherTolerance}
            onMacroTargetChange={preferences.patchMacroTarget}
            onSave={preferences.handleSavePreferences}
          />
        )}
      </div>
    </Modal>
  )
}
