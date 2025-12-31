import axios from 'axios'
import { ElMessage } from 'element-plus'

// 创建axios实例
const api = axios.create({
  baseURL: '/api/v1',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    // 添加认证token
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    console.log('[API Request]', {
      method: config.method,
      url: config.url,
      params: config.params,
      data: config.data,
      headers: config.headers
    })
    return config
  },
  (error) => {
    console.error('[API Request Error]', error)
    return Promise.reject(error)
  }
)

// 响应拦截器
api.interceptors.response.use(
  (response) => {
    console.log('[API Response]', {
      url: response.config?.url,
      status: response.status,
      data: response.data
    })
    return response.data
  },
  (error) => {
    console.error('[API Response Error]', {
      url: error.config?.url,
      message: error.message,
      response: {
        status: error.response?.status,
        data: error.response?.data
      }
    })
    if (error.response) {
      const { status, data } = error.response
      
      switch (status) {
        case 401:
          // 未授权，跳转到登录页
          localStorage.removeItem('token')
          window.location.href = '/login'
          break
        case 403:
          ElMessage.error('没有权限访问该资源')
          break
        case 404:
          ElMessage.error('请求的资源不存在')
          break
        case 500:
          ElMessage.error('服务器内部错误')
          break
        default:
          ElMessage.error(data.message || '请求失败')
      }
    } else if (error.request) {
      ElMessage.error('网络错误，请检查网络连接')
    } else {
      ElMessage.error('请求配置错误')
    }
    
    return Promise.reject(error)
  }
)

// API接口定义
export const inventoryAPI = {
  // 入库管理
  getInboundList: (params: any, options?: { signal?: AbortSignal }) => api.get('/inventory/in', { params, signal: options?.signal }),
  createInbound: (data: any) => api.post('/inventory/in', data),
  updateInbound: (id: string, data: any) => api.put(`/inventory/in/${id}`, data),
  deleteInbound: (id: string, data?: any) => api.delete(`/inventory/in/${id}`, { data }),
  getInboundDetail: (id: string) => api.get(`/inventory/in/${id}`),
  // 入库批次
  createInboundBatch: (data: any) => api.post('/inventory/in/batch', data),
  updateInboundBatch: (id: string, data: any) => api.put(`/inventory/in/batch/${id}`, data),
  getInboundBatchDetail: (id: string) => api.get(`/inventory/in/batch/${id}`),
  
  // 出库管理
  getOutboundList: (params: any) => api.get('/inventory/out', { params }),
  createOutbound: (data: any) => api.post('/inventory/out', data),
  createOutboundBatch: (data: any) => api.post('/inventory/out/batch', data),
  updateOutbound: (id: string, data: any) => api.put(`/inventory/out/${id}`, data),
  deleteOutbound: (id: string) => api.delete(`/inventory/out/${id}`),
  getOutboundDetail: (id: string) => api.get(`/inventory/out/${id}`),
  
  // 库存查询
  getStockList: (params: any) => api.get('/inventory/stock', { params }),
  getStockDetail: (id: string) => api.get(`/inventory/stock/${id}`),
  
  // 色布管理
  getColorFabricList: (params: any) => api.get('/inventory/color-fabric', { params }),
  createColorFabric: (data: any) => api.post('/inventory/color-fabric', data),
  updateColorFabric: (id: string, data: any) => api.put(`/inventory/color-fabric/${id}`, data),
  deleteColorFabric: (id: string) => api.delete(`/inventory/color-fabric/${id}`)
}

export const financeAPI = {
  // 应收管理
  getReceivableList: (params: any) => api.get('/finance/receivable', { params }),
  getReceivableDetail: (id: string) => api.get(`/finance/receivable/${id}`),
  createReceivable: (data: any) => api.post('/finance/receivable', data),
  updateReceivable: (id: string, data: any) => api.put(`/finance/receivable/${id}`, data),
  receivePayment: (id: string, data: any) => api.post(`/finance/receivable/${id}/payment`, data),
  
  // 应付管理
  getPayableList: (params: any) => api.get('/finance/payable', { params }),
  getPayableDetail: (id: string) => api.get(`/finance/payable/${id}`),
  createPayable: (data: any) => api.post('/finance/payable', data),
  updatePayable: (id: string, data: any) => api.put(`/finance/payable/${id}`, data),
  makePayment: (id: string, data: any) => api.post(`/finance/payable/${id}/payment`, data),
  
  // 附件
  uploadTaxInvoiceAttachmentsForReceivable: (id: string, files: File[]) => {
    const form = new FormData()
    files.forEach((f) => form.append('files', f))
    return api.post(`/finance/receivable/${id}/attachments/tax-invoice`, form, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },
  uploadOtherAttachmentsForReceivable: (id: string, files: File[]) => {
    const form = new FormData()
    files.forEach((f) => form.append('files', f))
    return api.post(`/finance/receivable/${id}/attachments/other`, form, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },
  uploadTaxInvoiceAttachmentsForPayable: (id: string, files: File[]) => {
    const form = new FormData()
    files.forEach((f) => form.append('files', f))
    return api.post(`/finance/payable/${id}/attachments/tax-invoice`, form, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },
  uploadTaxInvoiceAttachmentsForInbound: (id: string, files: File[]) => {
    const form = new FormData()
    files.forEach((f) => form.append('files', f))
    return api.post(`/finance/inbound/${id}/attachments/tax-invoice`, form, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },
  uploadTaxInvoiceAttachmentsForOutbound: (id: string, files: File[]) => {
    const form = new FormData()
    files.forEach((f) => form.append('files', f))
    return api.post(`/finance/outbound/${id}/attachments/tax-invoice`, form, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },
  uploadOtherAttachmentsForPayable: (id: string, files: File[]) => {
    const form = new FormData()
    files.forEach((f) => form.append('files', f))
    return api.post(`/finance/payable/${id}/attachments/other`, form, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },
  deleteAttachment: (type: 'tax' | 'other', attachmentId: string) =>
    api.delete(`/finance/attachments/${type}/${attachmentId}`),
  // 通过文件名下载（后端下载接口以文件名为参数）
  downloadAttachmentByPath: (path: string) => {
    const fileBase = (import.meta as any)?.env?.VITE_FILE_BASE || 'http://localhost:3001'
    const url = `${fileBase}/api/v1/${path.replace(/^\/+/, '')}/download`
    return axios.get(url, { responseType: 'blob', headers: { Authorization: `Bearer ${localStorage.getItem('token') || ''}` } })
  },
  
  // 汇总
  getFinanceSummary: (params: any) => api.get('/financials/summary', { params })
}

export const reportAPI = {
  // 库存报表
  getInventoryReport: (params: any) => api.get('/report/inventory', { params }),
  
  // 财务报表
  getFinanceReport: (params: any) => api.get('/report/finance', { params }),
  
  // 业务分析
  getBusinessReport: (params: any) => api.get('/report/business', { params }),
  
  // 导出报表
  exportReport: (type: string, params: any, onProgress?: (e: ProgressEvent) => void) =>
    api.get(`/report/export/${type}`, { params, responseType: 'blob', onDownloadProgress: onProgress })
}

export const systemAPI = {
  // 用户管理
  getUserList: (params?: any) => api.get('/users', { params }),
  getUserDetail: (id: string) => api.get(`/users/${id}`),
  createUser: (data: any) => api.post('/users', data),
  updateUser: (id: string, data: any) => api.put(`/users/${id}`, data),
  deleteUser: (id: string) => api.delete(`/users/${id}`),
  assignPermissions: (userId: string, permissionIds: string[]) => api.post(`/users/${userId}/permissions`, { permissionIds }),

  // 角色管理
  getRoleList: () => api.get('/roles'),

  // 权限管理 (元数据)
  getPermissionList: () => api.get('/permissions'),
  createPermission: (data: any) => api.post('/permissions', data),
  updatePermission: (id: string, data: any) => api.put(`/permissions/${id}`, data),
  deletePermission: (id: string) => api.delete(`/permissions/${id}`),

  // 系统配置
  getSystemConfig: () => api.get('/system/config'),
  updateSystemConfig: (data: any) => api.put('/system/config', data)
}

export const authAPI = {
  login: (data: any) => api.post('/auth/login', data),
  getProfile: () => api.get('/auth/me'),
}

export default api
