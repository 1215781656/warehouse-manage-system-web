// 类型定义

export interface ColorFabric {
  id: string
  colorFabricNo: string
  productSpec: string
  composition: string
  weight: number
  width: number
  color: string
  colorNo: string
  batchNo: string
  createdAt: string
  updatedAt: string
}

export interface InboundOrder {
  id: string
  colorFabricId: string
  colorFabric?: ColorFabric
  inboundBatchId?: string
  inboundNo: string
  inboundDate: string
  supplier: string
  quantity: number
  weightKg: number
  unitPrice: number
  amount: number
  operator: string
  createdAt: string
}

export interface InboundBatch {
  id: string
  inboundNo: string
  inboundDate: string
  supplier: string
  operator: string
  createdAt: string
  updatedAt: string
}

export interface InboundBatchDetail {
  batch: InboundBatch
  items: InboundOrder[]
}

export interface OutboundOrder {
  id: string
  colorFabricId: string
  colorFabric?: ColorFabric
  outboundNo: string
  outboundDate: string
  customer: string
  quantity: number
  weightKg: number
  unitPrice: number
  amount: number
  consignee: string
  deliveryNo: string
  craft?: string
  customerNote?: string
  createdAt: string
}

export interface Inventory {
  id: string
  colorFabricId: string
  colorFabric?: ColorFabric
  totalInboundQuantity: number
  totalOutboundQuantity: number
  currentQuantity: number
  totalInboundWeight: number
  totalOutboundWeight: number
  currentWeight: number
  safetyStock: number
  updatedAt: string
}

export interface Receivable {
  id: string
  outboundOrderId: string
  outboundOrder?: OutboundOrder
  customer: string
  receivableAmount: number
  receivedAmount: number
  unpaidAmount: number
  createdAt: string
  taxInvoiceAmount?: number
  source?: 'manual' | 'outbound'
  sourceId?: string
  deletedAt?: string
  updatedAt?: string
  createdBy?: string
  updatedBy?: string
}

export interface Payable {
  id: string
  inboundOrderId: string
  inboundOrder?: InboundOrder
  supplier: string
  payableAmount: number
  paidAmount: number
  unpaidAmount: number
  createdAt: string
  taxInvoiceAmount?: number
  source?: 'manual' | 'inbound'
  sourceId?: string
  deletedAt?: string
  updatedAt?: string
  createdBy?: string
  updatedBy?: string
}

export interface User {
  id: string
  username: string
  name: string
  email?: string
  phone?: string
  role: 'admin' | 'warehouse' | 'finance'
  permissions: string[]
  status: 'active' | 'inactive'
  createdAt: string
  updatedAt: string
}

export interface Role {
  id: string
  name: string
  description: string
  permissions: string[]
  status: 'active' | 'inactive'
  createdAt: string
  updatedAt: string
}

export interface PaginationParams {
  page: number
  pageSize: number
  keyword?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface ApiResponse<T = any> {
  code: number
  message: string
  data: T
  timestamp: string
}

export interface PageResponse<T = any> {
  list: T[]
  total: number
  page: number
  pageSize: number
  pages: number
}

// 搜索表单类型
export interface InboundSearchForm {
  dateRange?: string[]
  supplier?: string
  colorNo?: string
  status?: string
}

export interface OutboundSearchForm {
  dateRange?: string[]
  customer?: string
  colorNo?: string
  status?: string
}

export interface StockSearchForm {
  colorNo?: string
  productSpec?: string
  color?: string
  stockStatus?: 'normal' | 'low' | 'danger'
}

export interface FinanceSearchForm {
  dateRange?: string[]
  customer?: string
}

export interface TaxInvoiceAttachment {
  id: string
  refId: string
  path: string
  uploadedAt: string
}

export interface OtherAttachment {
  id: string
  refId: string
  path: string
  originalName: string
  mimeType: string
  uploadedAt: string
}

// 枚举类型
export enum StockStatus {
  NORMAL = 'normal',
  LOW = 'low',
  DANGER = 'danger'
}

// 已移除财务状态枚举

export enum UserRole {
  ADMIN = 'admin',
  WAREHOUSE = 'warehouse',
  FINANCE = 'finance'
}

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive'
}
