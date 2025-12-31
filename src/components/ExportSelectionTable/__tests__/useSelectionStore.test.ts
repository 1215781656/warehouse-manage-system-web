import { describe, it, expect, beforeEach } from 'vitest'
import { useSelectionStore } from '../useSelectionStore'

describe('useSelectionStore', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('persists and restores selection', () => {
    const store = useSelectionStore({ storageKey: 'k1' })
    store.selectId('a')
    store.selectId('b')
    store.persist()
    store.restore()
    expect(store.getSelectedIds().sort()).toEqual(['a', 'b'])
  })

  it('toggleAll uses backend ids', async () => {
    const store = useSelectionStore({
      storageKey: 'k2',
      fetchAllIds: async () => ['x', 'y', 'z']
    })
    await store.toggleAll(true, {})
    expect(store.allSelected.value).toBe(true)
    expect(store.getSelectedIds().sort()).toEqual(['x', 'y', 'z'])
  })

  it('clear resets state', () => {
    const store = useSelectionStore({ storageKey: 'k3' })
    store.selectId('1')
    store.clear()
    expect(store.getSelectedIds().length).toBe(0)
    expect(store.allSelected.value).toBe(false)
    expect(localStorage.getItem('k3')).toBeNull()
  })
})
