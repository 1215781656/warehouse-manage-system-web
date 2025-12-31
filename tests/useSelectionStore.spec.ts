import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useSelectionStore } from '../src/components/ExportSelectionTable/useSelectionStore'

const createMockLocalStorage = () => {
  const store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => {
      Object.keys(store).forEach(k => delete store[k])
    }
  } as Storage
}

describe('useSelectionStore', () => {
  beforeEach(() => {
    // @ts-expect-error override
    globalThis.localStorage = createMockLocalStorage()
  })

  it('select/deselect ids across pages', () => {
    const store = useSelectionStore({ storageKey: 't1', rowKey: 'id' })
    store.selectId(1)
    store.selectId(2)
    store.selectId(3)
    expect(store.getSelectedIds().sort()).toEqual([1, 2, 3])
    store.deselectId(2)
    expect(store.getSelectedIds().sort()).toEqual([1, 3])
    store.setPageSelections([{ id: 3 }, { id: 4 }], true)
    expect(store.getSelectedIds().sort()).toEqual([1, 3, 4])
    store.setPageSelections([{ id: 1 }], false)
    expect(store.getSelectedIds().sort()).toEqual([3, 4])
  })

  it('persist and restore selection', async () => {
    const store = useSelectionStore({ storageKey: 't2' })
    store.selectId('a')
    store.selectId('b')
    await new Promise(r => setTimeout(r, 250))
    const store2 = useSelectionStore({ storageKey: 't2' })
    store2.restore()
    expect(store2.getSelectedIds().sort()).toEqual(['a', 'b'])
  })

  it('toggle all on and off with fetchAllIds', async () => {
    const fetchAllIds = vi.fn(async () => Array.from({ length: 1000 }, (_, i) => i + 1))
    const store = useSelectionStore({ storageKey: 't3', fetchAllIds })
    await store.toggleAll(true, { customer: 'X' })
    expect(fetchAllIds).toHaveBeenCalled()
    expect(store.allSelected.value).toBe(true)
    expect(store.getSelectedIds().length).toBe(1000)
    await store.toggleAll(false)
    expect(store.allSelected.value).toBe(false)
    expect(store.getSelectedIds().length).toBe(0)
  })

  it('large selection performance sanity', async () => {
    const ids = Array.from({ length: 20000 }, (_, i) => i + 1)
    const fetchAllIds = vi.fn(async () => ids)
    const store = useSelectionStore({ storageKey: 't4', fetchAllIds })
    const t0 = performance.now()
    await store.toggleAll(true)
    const t1 = performance.now()
    expect(store.getSelectedIds().length).toBe(20000)
    expect(t1 - t0).toBeLessThan(1500)
  })
})
