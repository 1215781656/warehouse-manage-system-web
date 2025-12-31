<template>
  <div class="payable">
    <div class="page-header">
      <h1 class="page-title">应付管理</h1>
      <div class="header-actions">
        <el-button type="primary" @click="openCreate" v-if="userStore.can(P => P.Finance.Payable.Add)">
          新增
        </el-button>
        <el-progress
          v-if="serverExporting"
          :percentage="serverExportProgress"
          :status="serverExportError ? 'exception' : undefined"
          style="width: 160px"
        />
        <el-button
          @click="handleServerExport"
          :loading="serverExporting"
          :disabled="serverExporting"
          type="primary"
          v-if="userStore.can(P => P.Finance.Payable.Export)"
        >
          <el-icon v-if="!serverExporting"><Download /></el-icon>
          {{ serverExporting ? '导出中...' : '导出' }}
        </el-button>
      </div>
    </div>

    <!-- 统计卡片 -->
    <el-row :gutter="16" class="mb-4">
      <el-col :span="8">
        <div class="data-card">
          <div class="data-card-title">应付总额</div>
          <div class="data-card-value">¥{{ formatMoney(globalStats.totalPayable) }}</div>
          <div class="data-card-trend">
            <span class="trend-stable">来自全部数据</span>
          </div>
        </div>
      </el-col>
      <el-col :span="8">
        <div class="data-card">
          <div class="data-card-title">已付金额</div>
          <div class="data-card-value">¥{{ formatMoney(globalStats.totalPaid) }}</div>
          <div class="data-card-trend">
            <span class="trend-up">↑ {{ globalStats.paidPercent }}%</span>
            付款率
          </div>
        </div>
      </el-col>
      <el-col :span="8">
        <div class="data-card">
          <div class="data-card-title">未付金额</div>
          <div class="data-card-value" style="color: #ff4d4f;">¥{{ formatMoney(globalStats.totalUnpaid) }}</div>
          <div class="data-card-trend">
            <span class="trend-danger">●</span>
            占比 {{ globalStats.unpaidPercent }}%
          </div>
        </div>
      </el-col>
    </el-row>

    <!-- 搜索栏 -->
    <el-card class="search-card mb-4 search-bar">
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="客户">
          <el-input v-model="searchForm.customer" placeholder="请输入客户名称" size="small" />
        </el-form-item>
        <el-form-item label="日期">
          <el-date-picker
            v-model="searchForm.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            size="small"
            @change="handleSearch"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch" size="small">
            <el-icon><Search /></el-icon>
            搜索
          </el-button>
          <el-button @click="handleReset" size="small">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 数据表格（可导出选择组件封装） -->
    <el-card>
      <ExportSelectionTable
        ref="exportTableRef"
        :dataSource="tableData"
        selectionType="all"
        :onSelectionChange="ids => selectedIds = ids as any"
        rowKey="id"
        storageKey="payable-export-selection"
        :queryParams="searchForm"
        :fetchAllIds="fetchAllPayableIds"
        :fetchItemsByIds="fetchPayableByIds"
        v-loading="loading"
      >
        <template #columns>
          <el-table-column prop="inboundDate" label="入库日期" width="120" />
          <el-table-column prop="inboundNo" label="货单编号" width="150" />
          <el-table-column prop="supplier" label="客户" width="120" />
          <el-table-column prop="productSpec" label="品名规格" min-width="150" />
          <el-table-column prop="quantity" label="匹数" width="80" />
          <el-table-column prop="weightKg" label="重量(kg)" width="100" />
          <el-table-column prop="unitPrice" label="单价(元)" width="100" />
          <el-table-column prop="payableAmount" label="应付金额(元)" width="120">
            <template #default="{ row }">
              ¥{{ formatMoney(row.payableAmount) }}
            </template>
          </el-table-column>
          <el-table-column prop="paidAmount" label="已付金额(元)" width="120">
            <template #default="{ row }">
              ¥{{ formatMoney(row.paidAmount) }}
            </template>
          </el-table-column>
          <el-table-column prop="taxInvoiceAmount" label="税票金额(元)" width="120">
            <template #default="{ row }">
              ¥{{ formatMoney(row.taxInvoiceAmount || 0) }}
            </template>
          </el-table-column>
          <el-table-column prop="unpaidAmount" label="未付金额(元)" width="120">
            <template #default="{ row }">
              <span :class="{ 'text-danger': row.unpaidAmount > 0 }">
                ¥{{ formatMoney(row.unpaidAmount) }}
              </span>
            </template>
          </el-table-column>
          <el-table-column prop="remark" label="备注" min-width="120" show-overflow-tooltip />
          <el-table-column label="操作" width="200" fixed="right">
            <template #default="{ row }">
              <ResponsiveActions :items="getPayableActions(row)"/>
            </template>
          </el-table-column>
        </template>
      </ExportSelectionTable>
      
      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="pagination.currentPage"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 付款对话框 -->
    <el-dialog
      v-model="showPayDialog"
      title="付款登记"
      width="1000px"
    >
      <el-form :model="payForm" :rules="payRules" ref="payFormRef" label-width="100px">
        <el-row :gutter="24">
          <el-col :span="12">
            <el-divider content-position="left">基础信息</el-divider>
            <el-form-item label="供应商">
              <el-input :value="currentRow?.supplier" disabled />
            </el-form-item>
            <el-form-item label="应付金额">
              <el-input :value="`¥${formatMoney(currentRow?.payableAmount || 0)}`" disabled />
            </el-form-item>
            <el-form-item label="已付金额">
              <el-input :value="`¥${formatMoney(currentRow?.paidAmount || 0)}`" disabled />
            </el-form-item>
            <el-form-item label="未付金额">
              <el-input :value="`¥${formatMoney(currentRow?.unpaidAmount || 0)}`" disabled style="color: #ff4d4f;" />
            </el-form-item>
            <el-form-item label="本次付款" prop="amount">
              <el-input-number 
                v-model="payForm.amount" 
                :min="0.01" 
                :max="currentRow?.unpaidAmount || 0"
                :precision="2"
                style="width: 100%"
              />
            </el-form-item>
            <el-form-item label="备注" prop="remark">
              <el-input v-model="payForm.remark" type="textarea" :rows="3" placeholder="请输入备注信息" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-divider content-position="left">税务与附件</el-divider>
            <el-form-item label="税票金额" prop="taxInvoiceAmount">
              <el-input-number 
                v-model="payForm.taxInvoiceAmount" 
                :min="0" 
                :precision="2"
                style="width: 100%"
              />
            </el-form-item>
            <el-form-item label="税票附件">
              <TaxInvoiceUpload
                v-model="payForm.taxAttachments"
                record-type="payable"
                :record-id="currentRow?.id"
              />
            </el-form-item>
            <el-form-item label="其他附件">
              <GeneralFileUpload
                v-model="payForm.otherAttachments"
                record-type="payable"
                :record-id="currentRow?.id"
              />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showPayDialog = false">取消</el-button>
          <el-button type="primary" @click="handlePaySubmit">确定</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 表格汇总（来自搜索数据） -->
    <div class="summary-bar">
      <div class="summary-bar__meta">
        <span class="summary-bar__meta-dot"></span>
        <span class="summary-bar__meta-text">汇总（来自搜索数据）</span>
      </div>
      <div class="summary-bar__items">
        <div class="summary-bar__item">
          <span class="summary-bar__label">应付总额</span>
          <span class="summary-bar__value">¥{{ formatMoney(stats.totalPayable) }}</span>
        </div>
        <div class="summary-bar__item">
          <span class="summary-bar__label">已付金额</span>
          <span class="summary-bar__value">¥{{ formatMoney(stats.totalPaid) }}</span>
        </div>
        <div class="summary-bar__item">
          <span class="summary-bar__label">未付金额</span>
          <span class="summary-bar__value summary-bar__value--danger">¥{{ formatMoney(stats.totalUnpaid) }}</span>
        </div>
      </div>
    </div>
    
    <!-- 新增/编辑对话框已替换为路由页面 -->
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Download } from '@element-plus/icons-vue'
import ResponsiveActions from '@/components/ResponsiveActions.vue'
import TaxInvoiceUpload from '@/components/TaxInvoiceUpload.vue'
import GeneralFileUpload from '@/components/GeneralFileUpload.vue'
import ExportSelectionTable from '@/components/ExportSelectionTable/ExportSelectionTable.vue'
import { financeAPI, reportAPI } from '@/api'
import { useFinanceStore, useUserStore } from '@/stores'
import { useRouter } from 'vue-router'
import { P } from '@/constants/permissions'

const userStore = useUserStore()

// 搜索表单
const searchForm = reactive({
  customer: '',
  dateRange: []
} as any)

// 表格数据
const tableData = ref([])
const loading = ref(false)
const selectedRows = ref([])
let selectedIds: any[] = []
const exportTableRef = ref()
const serverExporting = ref(false)
const serverExportProgress = ref(0)
const serverExportError = ref(false)

// 分页配置
const pagination = reactive({
  currentPage: 1,
  pageSize: 10,
  total: 0
})

// 统计信息
const stats = reactive({
  totalPayable: 0,
  totalPaid: 0,
  totalUnpaid: 0,
  paidPercent: 0,
  unpaidPercent: 0,
  
})
const globalStats = reactive({
  totalPayable: 0,
  totalPaid: 0,
  totalUnpaid: 0,
  paidPercent: 0,
  unpaidPercent: 0,
  
})

// 付款对话框
const showPayDialog = ref(false)
const currentRow = ref(null)
const payFormRef = ref()
const router = useRouter()

const payForm = reactive({
  amount: null as any,
  remark: '',
  taxInvoiceAmount: null as any,
  taxAttachments: [] as any[],
  otherAttachments: [] as any[]
})

const payRules = {
  amount: [{ required: true, message: '请输入付款金额', trigger: 'blur' }],
}


// 格式化金额
const formatMoney = (amount: number) => {
  return amount.toLocaleString('zh-CN', { minimumFractionDigits: 2 })
}

// 搜索
const handleSearch = () => {
  loadData()
}

// 重置搜索
const handleReset = () => {
  searchForm.customer = ''
  searchForm.dateRange = []
  loadData()
}

// 加载数据
const loadData = async () => {
  loading.value = true
  try {
    const params: any = {
      page: pagination.currentPage,
      pageSize: pagination.pageSize,
      customer: searchForm.customer || undefined,
      startDate: Array.isArray(searchForm.dateRange) && searchForm.dateRange[0] ? new Date(new Date(searchForm.dateRange[0]).getTime() - new Date(searchForm.dateRange[0]).getTimezoneOffset() * 60000).toISOString().substring(0,10) : undefined,
      endDate: Array.isArray(searchForm.dateRange) && searchForm.dateRange[1] ? new Date(new Date(searchForm.dateRange[1]).getTime() - new Date(searchForm.dateRange[1]).getTimezoneOffset() * 60000).toISOString().substring(0,10) : undefined
    , cache: false }
    const store = useFinanceStore()
    const res = await store.fetchPayableList(params)
    const list = res?.list || []
    const total = res?.total || 0
    tableData.value = list
    pagination.total = total
    const pay = (res?.summary?.payable) || {}
    stats.totalPayable = pay.totalPayable || 0
    stats.totalPaid = pay.totalPaid || 0
    stats.totalUnpaid = pay.totalUnpaid || 0
    stats.paidPercent = stats.totalPayable ? Number(((stats.totalPaid / stats.totalPayable) * 100).toFixed(1)) : 0
    stats.unpaidPercent = stats.totalPayable ? Number(((stats.totalUnpaid / stats.totalPayable) * 100).toFixed(1)) : 0
    const gpay = (res?.globalSummary?.payable) || {}
    if (gpay && Object.keys(gpay).length) {
      globalStats.totalPayable = gpay.totalPayable || 0
      globalStats.totalPaid = gpay.totalPaid || 0
      globalStats.totalUnpaid = gpay.totalUnpaid || 0
      globalStats.paidPercent = globalStats.totalPayable ? Number(((globalStats.totalPaid / globalStats.totalPayable) * 100).toFixed(1)) : 0
      globalStats.unpaidPercent = globalStats.totalPayable ? Number(((globalStats.totalUnpaid / globalStats.totalPayable) * 100).toFixed(1)) : 0
    }
  } catch (error) {
    ElMessage.error('加载数据失败')
  } finally {
    loading.value = false
  }
}

// 选择变化
const handleSelectionChange = (_selection: any[]) => {}

// 分页处理
const handleSizeChange = (val: number) => {
  pagination.pageSize = val
  loadData()
}

const handleCurrentChange = (val: number) => {
  pagination.currentPage = val
  loadData()
}

// 已移除账龄与状态相关逻辑

// 付款
const handlePay = async (row: any) => {
  currentRow.value = row
  try {
    const detail = await financeAPI.getPayableDetail(row.id)
    if ((detail?.unpaidAmount || 0) <= 0) {
      ElMessage.warning('该记录已全部付款，无需再次付款')
      return
    }
    payForm.amount = detail?.unpaidAmount
    payForm.remark = ''
    payForm.taxInvoiceAmount = detail?.taxInvoiceAmount
    payForm.taxAttachments = detail?.taxAttachments || []
    payForm.otherAttachments = detail?.otherAttachments || []
    showPayDialog.value = true
  } catch (e) {
    ElMessage.error('获取详情失败')
  }
}

const openCreate = () => {
  router.push('/finance/payable/add')
}

// 付款提交
const handlePaySubmit = () => {
  payFormRef.value.validate((valid: boolean) => {
    if (valid) {
      ;(async () => {
        try {
          await financeAPI.updatePayable(currentRow.value.id, {
            paidAmount: Number(currentRow.value.paidAmount || 0) + Number(payForm.amount || 0),
            taxInvoiceAmount: payForm.taxInvoiceAmount,
            remark: payForm.remark || undefined
          })
          ElMessage.success(`付款成功：¥${formatMoney(payForm.amount)}`)
          showPayDialog.value = false
          loadData()
        } catch (e) {
          ElMessage.error('付款提交失败')
        }
      })()
    }
  })
}


const handleEdit = (row: any) => {
  router.push(`/finance/payable/edit/${row.id}`)
}
// 新增/编辑提交逻辑由路由页面负责
const handleDelete = (row: any) => {
  ElMessageBox.confirm('确定要删除该记录吗？该操作为软删除。', '删除确认', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      await financeAPI.updatePayable(row.id, { deletedAt: new Date().toISOString() })
      useFinanceStore().logOperation('payable', 'soft_delete', row.id)
      ElMessage.success('删除成功')
      loadData()
    } catch (e) {
      ElMessage.error('删除失败')
    }
  })
}
const canEdit = (row: any) => {
  return !row.source || row.source === 'manual'
}

const getPayableActions = (row: any) => {
  const items: any[] = []
  items.push({ label: '详情', onClick: () => router.push(`/finance/payable/detail/${row.id}`) })
  if (userStore.can(P => P.Finance.Payable.Payment)) {
    items.push({ label: '付款', onClick: () => handlePay(row) })
  }
  if (canEdit(row)) {
    if (userStore.can(P => P.Finance.Payable.Edit)) {
      items.push({ label: '编辑', onClick: () => handleEdit(row) })
    }
    if (userStore.can(P => P.Finance.Payable.Delete)) {
      items.push({ label: '删除', onClick: () => handleDelete(row), danger: true })
    }
  }
  return items
}
const handleServerExport = async () => {
  if (!selectedIds || selectedIds.length === 0) {
    ElMessage.warning('请勾选数据')
    return
  }
  serverExportError.value = false
  serverExporting.value = true
  serverExportProgress.value = 5
  try {
    const isAll = exportTableRef.value?.isAllSelected?.() ? 'Y' : 'N'
    const params: any = {
      ids: isAll === 'Y' ? null : selectedIds,
      isAll,
      customer: searchForm.customer || undefined,
      startDate: Array.isArray(searchForm.dateRange) && searchForm.dateRange[0] ? new Date(searchForm.dateRange[0]).toISOString().substring(0,10) : undefined,
      endDate: Array.isArray(searchForm.dateRange) && searchForm.dateRange[1] ? new Date(searchForm.dateRange[1]).toISOString().substring(0,10) : undefined
    }
    const res = await reportAPI.exportReport('payable', params, (e: ProgressEvent) => {
      if (e && typeof e.loaded === 'number') {
        const total = (e as any).total || 0
        if (total > 0) {
          const pct = Math.min(90, Math.max(10, Math.floor((e.loaded / total) * 90)))
          serverExportProgress.value = pct
        }
      }
    })
    const blob = new Blob([res], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = '应付导出.xlsx'
    a.click()
    URL.revokeObjectURL(url)
    serverExportProgress.value = 100
    exportTableRef.value?.clearSelection()
    ElMessage.success('导出成功')
  } catch (e) {
    serverExportError.value = true
    ElMessage.error('导出失败')
  } finally {
    serverExporting.value = false
    setTimeout(() => {
      serverExportProgress.value = 0
      serverExportError.value = false
    }, 400)
  }
}

const cachedAllMap = new Map<string, any>()
let cachedAllList: any[] | null = null

const fetchAllPayableIds = async (queryParams: any) => {
  const params: any = {
    page: 1,
    pageSize: 100000,
    customer: queryParams?.customer || undefined,
    startDate: Array.isArray(queryParams?.dateRange) && queryParams?.dateRange[0] ? new Date(new Date(queryParams.dateRange[0]).getTime() - new Date(queryParams.dateRange[0]).getTimezoneOffset() * 60000).toISOString().substring(0,10) : undefined,
    endDate: Array.isArray(queryParams?.dateRange) && queryParams?.dateRange[1] ? new Date(new Date(queryParams.dateRange[1]).getTime() - new Date(queryParams.dateRange[1]).getTimezoneOffset() * 60000).toISOString().substring(0,10) : undefined,
    cache: false
  }
  const store = useFinanceStore()
  const res = await store.fetchPayableList(params)
  const list = res?.list || []
  cachedAllList = list
  cachedAllMap.clear()
  for (const r of list) cachedAllMap.set(r.id, r)
  return list.map((r: any) => r.id)
}

const fetchPayableByIds = async (ids: Array<string | number>) => {
  if (!cachedAllList) {
    const params: any = {
      page: 1,
      pageSize: 100000,
      customer: searchForm.customer || undefined,
      startDate: Array.isArray(searchForm.dateRange) && searchForm.dateRange[0] ? new Date(new Date(searchForm.dateRange[0]).getTime() - new Date(searchForm.dateRange[0]).getTimezoneOffset() * 60000).toISOString().substring(0,10) : undefined,
      endDate: Array.isArray(searchForm.dateRange) && searchForm.dateRange[1] ? new Date(new Date(searchForm.dateRange[1]).getTime() - new Date(searchForm.dateRange[1]).getTimezoneOffset() * 60000).toISOString().substring(0,10) : undefined,
      cache: false
    }
    const store = useFinanceStore()
    const res = await store.fetchPayableList(params)
    const list = res?.list || []
    cachedAllList = list
    cachedAllMap.clear()
    for (const r of list) cachedAllMap.set(r.id, r)
  }
  const out: any[] = []
  for (const id of ids) {
    const item = cachedAllMap.get(id as any)
    if (item) out.push(item)
  }
  return out
}
onMounted(() => {
  loadData()
})
</script>

<style scoped>
.payable {
  padding: 0;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
}
.header-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 16px;
  flex-wrap: wrap;
}

.summary-bar {
  --summary-bg: #f8fafc;
  --summary-border: #e5e7eb;
  --summary-text: #334155;
  --summary-muted: #64748b;
  --summary-accent: #3b82f6;
  --summary-danger: #ef4444;
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;
  gap: 12px 16px;
  padding: 12px 16px;
  margin-top: 12px;
  background: var(--summary-bg);
  border: 1px solid var(--summary-border);
  border-radius: 12px;
  box-shadow: 0 2px 6px rgba(0,0,0,0.04);
  transition: box-shadow .2s ease, border-color .2s ease, background-color .2s ease;
}
.summary-bar:hover {
  box-shadow: 0 6px 16px rgba(0,0,0,0.06);
  border-color: #d1d5db;
}
.summary-bar__meta {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: var(--summary-muted);
  font-size: 13px;
  font-weight: 500;
  letter-spacing: .2px;
}
.summary-bar__meta-dot {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: var(--summary-accent);
  box-shadow: 0 0 0 4px rgba(59,130,246,0.12);
}
.summary-bar__items {
  display: flex;
  align-items: center;
  gap: 24px;
  flex-wrap: wrap;
}
.summary-bar__item {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  background: #ffffff;
  border: 1px solid var(--summary-border);
  border-radius: 10px;
  transition: transform .15s ease, box-shadow .15s ease, border-color .2s ease;
}
.summary-bar__item:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 10px rgba(0,0,0,0.05);
  border-color: #dbe1e8;
}
.summary-bar__label {
  color: var(--summary-muted);
  font-size: 13px;
  font-weight: 500;
}
.summary-bar__value {
  color: var(--summary-text);
  font-size: 16px;
  font-weight: 600;
}
.summary-bar__value--danger {
  color: var(--summary-danger);
}
@media (max-width: 768px) {
  .summary-bar {
    grid-template-columns: 1fr;
    gap: 10px 0;
    padding: 10px 12px;
  }
  .summary-bar__items {
    gap: 12px;
  }
  .summary-bar__item {
    padding: 6px 10px;
  }
  .summary-bar__value {
    font-size: 15px;
  }
}

.search-card {
  margin-bottom: 16px;
}

.search-form {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

.pagination-container {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}

.text-danger {
  color: #ff4d4f;
  font-weight: bold;
}

.trend-up {
  color: #52c41a;
  font-weight: 600;
}

.trend-stable {
  color: #909399;
}

.trend-danger {
  color: #ff4d4f;
}

.trend-warning {
  color: #faad14;
}
</style>
