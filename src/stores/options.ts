import { defineStore } from 'pinia'
import { ref } from 'vue'
import { inventoryAPI } from '@/api'

interface OptionState {
  list: string[]
  page: number
  hasMore: boolean
  loading: boolean
  total: number
}

export const useOptionStore = defineStore('option', () => {
  // State for each type
  const supplierState = ref<OptionState>({ list: [], page: 1, hasMore: true, loading: false, total: 0 })
  const productSpecState = ref<OptionState>({ list: [], page: 1, hasMore: true, loading: false, total: 0 })
  const compositionState = ref<OptionState>({ list: [], page: 1, hasMore: true, loading: false, total: 0 })
  const customerState = ref<OptionState>({ list: [], page: 1, hasMore: true, loading: false, total: 0 })

  // Helper to get state by type
  const getState = (type: 'supplier' | 'productSpec' | 'composition' | 'customer') => {
    switch (type) {
      case 'supplier': return supplierState
      case 'productSpec': return productSpecState
      case 'composition': return compositionState
      case 'customer': return customerState
    }
  }

  // Field mapping
  const getField = (type: 'supplier' | 'productSpec' | 'composition' | 'customer', row: any) => {
    switch (type) {
      case 'supplier': return row.supplier
      case 'productSpec': return row.colorFabric?.productSpec
      case 'composition': return row.colorFabric?.composition
      case 'customer': return row.customer
    }
  }

  // Query key mapping
  const getQueryKey = (type: 'supplier' | 'productSpec' | 'composition' | 'customer') => {
    switch (type) {
      case 'supplier': return 'supplier'
      case 'productSpec': return 'productSpec'
      case 'composition': return 'composition' 
      case 'customer': return 'customer'
    }
  }

  // Load data action
  const loadData = async (type: 'supplier' | 'productSpec' | 'composition' | 'customer', query: string, reset = false) => {
    const state = getState(type)
    if (!state.value) return // Fix potential undefined
    if (state.value.loading && !reset) return // Prevent duplicate load unless reset

    if (reset) {
      state.value.page = 1
      state.value.list = []
      state.value.hasMore = true
      state.value.total = 0
    }

    if (!state.value.hasMore && !reset) return

    state.value.loading = true
    try {
      const params: any = {
        page: state.value.page,
        pageSize: 20, 
      }
      
      const queryKey = getQueryKey(type)
      if (query) {
        params[queryKey] = query
      }

      // For customer, we should fetch outbound list? Or Inbound?
      // Customer is usually on Outbound.
      // Supplier is on Inbound.
      // ProductSpec/Composition is on Inbound (and Outbound via colorFabric).
      // Let's decide source based on type.
      
      let apiCall = inventoryAPI.getInboundList
      if (type === 'customer') {
        apiCall = inventoryAPI.getOutboundList
      } else {
        // supplier, productSpec, composition -> InboundList
        // Note: productSpec/composition also exists in Outbound, but Inbound is the source of truth for "Entry" usually.
        // However, if we want ALL productSpecs ever used, maybe we need both?
        // For now, sticking to Inbound for product info as per original request ("数据来源入库管理表").
        // But for Customer, it must be Outbound or a Customer API (if exists). System has no Customer API, so Outbound list.
        apiCall = inventoryAPI.getInboundList
      }
      
      const res = await apiCall(params)
      const list = res?.list || res || [] 
      const total = res?.total || 0

      // Extract unique values
      const newValues = new Set<string>()
      list.forEach((row: any) => {
        const val = getField(type, row)
        if (val) newValues.add(val)
      })

      // Merge with existing
      if (state.value.page === 1) {
        state.value.list = Array.from(newValues)
      } else {
        const currentSet = new Set(state.value.list)
        newValues.forEach(v => {
          if (!currentSet.has(v)) {
            state.value.list.push(v)
          }
        })
      }

      state.value.total = total
      if (list.length < params.pageSize) {
        state.value.hasMore = false
      } else {
        state.value.page++
      }

    } catch (e) {
      console.error(`Failed to load ${type}`, e)
    } finally {
      state.value.loading = false
    }
  }

  // Reset/Invalidate
  const invalidate = () => {
    supplierState.value = { list: [], page: 1, hasMore: true, loading: false, total: 0 }
    productSpecState.value = { list: [], page: 1, hasMore: true, loading: false, total: 0 }
    compositionState.value = { list: [], page: 1, hasMore: true, loading: false, total: 0 }
    customerState.value = { list: [], page: 1, hasMore: true, loading: false, total: 0 }
  }

  return {
    supplierState,
    productSpecState,
    compositionState,
    customerState,
    loadData,
    invalidate
  }
})
