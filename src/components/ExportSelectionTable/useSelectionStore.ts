import { ref } from 'vue'

export type Id = string | number

export interface SelectionStoreOptions {
  storageKey?: string
  rowKey?: string
  debounceMs?: number
  fetchAllIds?: (queryParams: any) => Promise<Id[]>
}

export const useSelectionStore = (options?: SelectionStoreOptions) => {
  const storageKey = options?.storageKey || 'ExportSelectionTableSelection'
  const rowKey = options?.rowKey || 'id'
  const debounceMs = options?.debounceMs ?? 200
  const selectedSet = ref(new Set<Id>())
  const allSelected = ref(false)
  const saving = ref(false)

  let timer: any = null

  const persist = () => {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      saving.value = true
      const data = {
        allSelected: allSelected.value,
        ids: Array.from(selectedSet.value),
        ts: Date.now()
      }
      localStorage.setItem(storageKey, JSON.stringify(data))
      saving.value = false
    }, debounceMs)
  }

  const restore = () => {
    const text = localStorage.getItem(storageKey)
    if (!text) return
    try {
      const data = JSON.parse(text)
      allSelected.value = !!data.allSelected
      selectedSet.value = new Set((data.ids || []) as Id[])
    } catch {}
  }

  const selectId = (id: Id) => {
    if (allSelected.value) return
    selectedSet.value.add(id)
    selectedSet.value = new Set(selectedSet.value)
    persist()
  }

  const deselectId = (id: Id) => {
    if (allSelected.value) return
    selectedSet.value.delete(id)
    selectedSet.value = new Set(selectedSet.value)
    persist()
  }

  const setPageSelections = (rows: any[], checked: boolean) => {
    if (allSelected.value) return
    for (const r of rows) {
      const id = (r as any)[rowKey]
      if (checked) selectedSet.value.add(id)
      else selectedSet.value.delete(id)
    }
    selectedSet.value = new Set(selectedSet.value)
    persist()
  }

  const getSelectedIds = () => Array.from(selectedSet.value)

  const toggleAll = async (enabled: boolean, queryParams?: any) => {
    if (!enabled) {
      selectedSet.value.clear()
      selectedSet.value = new Set()
      allSelected.value = false
      persist()
      return
    }
    if (!options?.fetchAllIds) {
      allSelected.value = false
      persist()
      return
    }
    const ids = await options.fetchAllIds(queryParams)
    selectedSet.value = new Set(ids || [])
    allSelected.value = true
    persist()
  }

  const clear = () => {
    selectedSet.value.clear()
    selectedSet.value = new Set()
    allSelected.value = false
    localStorage.removeItem(storageKey)
  }

  return {
    selectedSet,
    allSelected,
    saving,
    restore,
    persist,
    selectId,
    deselectId,
    setPageSelections,
    getSelectedIds,
    toggleAll,
    clear
  }
}
