import { create } from 'zustand'

export const useGame = create((set, get) => ({
  phase: 'playing',
  room: 'island',            // 'island' | 'about'——棧道底轉場切換的空間
  aboutSection: null,        // 進「關於我」空間時要捲到哪一段（頁面錨點 id）
  movementLocked: false,
  activePopup: null,
  soundOn: true,
  say: null,
  nearbyId: null,
  setPhase: (phase) => set({ phase }),
  setRoom: (room) => set({ room }),
  setAboutSection: (aboutSection) => set({ aboutSection }),
  lockMovement: () => set({ movementLocked: true }),
  unlockMovement: () => set({ movementLocked: false }),
  openPopup: (id) => set({ activePopup: id, movementLocked: true }),
  closePopup: () => set({ activePopup: null, movementLocked: get().phase !== 'playing' }),
  toggleSound: () => set((st) => ({ soundOn: !st.soundOn })),
  setSay: (say) => set({ say }),
  setNearbyId: (nearbyId) => set({ nearbyId }),
}))
