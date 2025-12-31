import { defineStore } from 'pinia'
import { ref } from 'vue'
import api, { financeAPI, authAPI } from '@/api'
import { P } from '@/constants/permissions'

// 用户状态管理
export * from './options'

export const useUserStore = defineStore('user', () => {
  const userInfo = ref<any>(null)

  const isLoggedIn = ref(!!localStorage.getItem('token'))

  const fetchUserInfo = async () => {
    try {
      const res = await authAPI.getProfile()
      userInfo.value = res
      return res
    } catch (error) {
      console.error('Failed to fetch user info', error)
      return null
    }
  }

  const login = async (username: string, password: string) => {
    const res = await authAPI.login({ username, password })
    if (res?.access_token) {
      localStorage.setItem('token', res.access_token)
      isLoggedIn.value = true
      await fetchUserInfo()
      return { success: true }
    }
    return { success: false, message: '登录失败' }
  }

  const logout = () => {
    isLoggedIn.value = false
    userInfo.value = null
    localStorage.removeItem('token')
    location.href = '/login'
  }

  const hasPermission = (permission: string) => {
    if (!userInfo.value || !userInfo.value.permissions) return false
    // If user is admin (check by role code), maybe grant all?
    // Requirement says "Role type only 'Admin' and 'Employee'". 
    // Usually Admin has full access, but here permissions are assigned explicitly.
    // Let's check explicitly.
    return userInfo.value.permissions.some((p: any) => p.code === permission)
  }

  const can = (selector: (p: typeof P) => string) => {
    const permission = selector(P);
    return hasPermission(permission);
  }

  // Auto fetch if logged in but no user info
  if (isLoggedIn.value && !userInfo.value) {
    fetchUserInfo()
  }

  return {
    userInfo,
    isLoggedIn,
    login,
    logout,
    hasPermission,
    can,
    fetchUserInfo
  }
})

// 库存状态管理
export const useInventoryStore = defineStore('inventory', () => {
  const currentStock = ref({})
  const stockWarning = ref([])

  const updateStock = (colorFabricId: string, quantity: number) => {
    if (currentStock.value[colorFabricId]) {
      currentStock.value[colorFabricId] += quantity
    } else {
      currentStock.value[colorFabricId] = quantity
    }
  }

  const checkStockWarning = (colorFabricId: string, safetyStock: number) => {
    const currentQuantity = currentStock.value[colorFabricId] || 0
    if (currentQuantity <= safetyStock) {
      const warning = {
        colorFabricId,
        currentQuantity,
        safetyStock,
        status: currentQuantity <= safetyStock * 0.5 ? 'danger' : 'warning'
      }
      stockWarning.value.push(warning)
    }
  }

  return {
    currentStock,
    stockWarning,
    updateStock,
    checkStockWarning
  }
})

// 财务状态管理
export const useFinanceStore = defineStore('finance', () => {
  const receivables = ref([])
  const payables = ref([])
  const receivableCache = ref({} as Record<string, { list: any[]; total: number; ts: number }>)
  const payableCache = ref({} as Record<string, { list: any[]; total: number; ts: number }>)
  const CACHE_TTL = 5 * 60 * 1000
  const operationLogs = ref([] as Array<{ module: 'receivable' | 'payable'; action: string; id?: string; payload?: any; at: string }>)

  const addReceivable = (receivable: any) => {
    receivables.value.push(receivable)
  }

  const addPayable = (payable: any) => {
    payables.value.push(payable)
  }

  const updateReceivablePayment = (id: string, amount: number) => {
    const item = receivables.value.find(r => r.id === id)
    if (item) {
      item.receivedAmount += amount
      item.unpaidAmount = item.receivableAmount - item.receivedAmount
    }
  }

  const updatePayablePayment = (id: string, amount: number) => {
    const item = payables.value.find(p => p.id === id)
    if (item) {
      item.paidAmount += amount
      item.unpaidAmount = item.payableAmount - item.paidAmount
    }
  }
  
  const logOperation = (module: 'receivable' | 'payable', action: string, id?: string, payload?: any) => {
    operationLogs.value.push({ module, action, id, payload, at: new Date().toISOString() })
  }

  const fetchReceivableList = async (params: any) => {
    const key = JSON.stringify(params || {})
    const cached = receivableCache.value[key]
    const now = Date.now()
    if (cached && now - cached.ts < CACHE_TTL && params?.cache !== false) {
      return cached
    }
    const res = await financeAPI.getReceivableList(params)
    const list = res?.data?.list || res?.list || []
    const total = res?.data?.total || res?.total || 0
    const summary = res?.data?.summary || res?.summary
    const updatedAt = res?.data?.updatedAt || res?.updatedAt
    const globalSummary = res?.data?.globalSummary || res?.globalSummary
    receivableCache.value[key] = { list, total, ts: now, summary, globalSummary, updatedAt } as any
    return receivableCache.value[key] as any
  }

  const fetchPayableList = async (params: any) => {
    const key = JSON.stringify(params || {})
    const cached = payableCache.value[key]
    const now = Date.now()
    if (cached && now - cached.ts < CACHE_TTL && params?.cache !== false) {
      return cached
    }
    const res = await financeAPI.getPayableList(params)
    const list = res?.data?.list || res?.list || []
    const total = res?.data?.total || res?.total || 0
    const summary = res?.data?.summary || res?.summary
    const updatedAt = res?.data?.updatedAt || res?.updatedAt
    const globalSummary = res?.data?.globalSummary || res?.globalSummary
    payableCache.value[key] = { list, total, ts: now, summary, globalSummary, updatedAt } as any
    return payableCache.value[key] as any
  }

  return {
    receivables,
    payables,
    operationLogs,
    addReceivable,
    addPayable,
    updateReceivablePayment,
    updatePayablePayment,
    fetchReceivableList,
    fetchPayableList,
    logOperation
  }
})
