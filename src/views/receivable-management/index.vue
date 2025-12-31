<template>
  <div class="receivable">
    <div class="page-header">
      <h1 class="page-title">应收管理</h1>
      <div class="header-actions">
        <el-button type="primary" @click="openCreate" v-if="userStore.can(P => P.Finance.Receivable.Add)">新增</el-button>
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
          v-if="userStore.can(P => P.Finance.Receivable.Export)"
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
          <div class="data-card-title">应收总额</div>
          <div class="data-card-value">¥{{ formatMoney(globalStats.totalReceivable) }}</div>
          <div class="data-card-trend">
            <span class="trend-stable">来自全部数据</span>
          </div>
        </div>
      </el-col>
      <el-col :span="8">
        <div class="data-card">
          <div class="data-card-title">已收金额</div>
          <div class="data-card-value">¥{{ formatMoney(globalStats.totalReceived) }}</div>
          <div class="data-card-trend">
            <span class="trend-up">↑ {{ globalStats.receivedPercent }}%</span>
            收款率
          </div>
        </div>
      </el-col>
      <el-col :span="8">
        <div class="data-card">
          <div class="data-card-title">未收金额</div>
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
        :onSelectionChange="ids => selectedIds = ids"
        rowKey="id"
        storageKey="receivable-export-selection"
        :queryParams="searchForm"
        :fetchAllIds="fetchAllReceivableIds"
        :fetchItemsByIds="fetchReceivableByIds"
        v-loading="loading"
      >
        <template #columns>
          <el-table-column prop="outboundDate" label="出货日期" width="120">
            <template #default="{ row }">
              {{ row.outboundDate?.substring(0, 10) }}
            </template>
          </el-table-column>
          <el-table-column prop="outboundNo" label="货单号" width="150" />
          <el-table-column prop="deliveryNo" label="编号" width="150" />
          <el-table-column prop="customer" label="客户" width="120" />
          <el-table-column prop="productSpec" label="品名规格" min-width="150" />
          <el-table-column prop="quantity" label="匹数" width="80" />
          <el-table-column prop="weightKg" label="重量(kg)" width="100" />
          <el-table-column prop="unitPrice" label="单价(元)" width="100" />
          <el-table-column prop="receivableAmount" label="应收金额(元)" width="120">
            <template #default="{ row }">
              ¥{{ formatMoney(row.receivableAmount) }}
            </template>
          </el-table-column>
          <el-table-column prop="receivedAmount" label="已收金额(元)" width="120">
            <template #default="{ row }">
              ¥{{ formatMoney(row.receivedAmount) }}
            </template>
          </el-table-column>
          <el-table-column prop="taxInvoiceAmount" label="税票金额(元)" width="120">
            <template #default="{ row }">
              ¥{{ formatMoney(row.taxInvoiceAmount || 0) }}
            </template>
          </el-table-column>
          <el-table-column prop="unpaidAmount" label="未收金额(元)" width="120">
            <template #default="{ row }">
              <span :class="{ 'text-danger': row.unpaidAmount > 0 }">
                ¥{{ formatMoney(row.unpaidAmount) }}
              </span>
            </template>
          </el-table-column>
          <el-table-column prop="remark" label="备注" min-width="120" show-overflow-tooltip />
          <el-table-column label="操作" width="200" fixed="right">
            <template #default="{ row }">
              <ResponsiveActions :items="getReceivableActions(row)"/>
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

    <div class="summary-bar">
        <div class="summary-bar__meta">
          <span class="summary-bar__meta-dot"></span>
          <span class="summary-bar__meta-text">汇总（来自搜索数据）</span>
        </div>
        <div class="summary-bar__items">
          <div class="summary-bar__item">
            <span class="summary-bar__label">应收总额</span>
            <span class="summary-bar__value">¥{{ formatMoney(stats.totalReceivable) }}</span>
          </div>
          <div class="summary-bar__item">
            <span class="summary-bar__label">已收金额</span>
            <span class="summary-bar__value">¥{{ formatMoney(stats.totalReceived) }}</span>
          </div>
          <div class="summary-bar__item">
            <span class="summary-bar__label">未收金额</span>
            <span class="summary-bar__value summary-bar__value--danger">¥{{ formatMoney(stats.totalUnpaid) }}</span>
          </div>
        </div>
      </div>

    <!-- 收款对话框 -->
    <el-dialog
      v-model="showReceiveDialog"
      title="收款登记"
      width="1000px"
    >
      <el-form :model="receiveForm" :rules="receiveRules" ref="receiveFormRef" label-width="100px">
        <el-row :gutter="24">
          <el-col :span="12">
            <el-divider content-position="left">基础信息</el-divider>
            <el-form-item label="客户名称">
              <el-input :value="currentRow?.customer" readonly />
            </el-form-item>
            <el-form-item label="应收金额">
              <el-input :value="`¥${formatMoney(currentRow?.receivableAmount || 0)}`" readonly />
            </el-form-item>
            <el-form-item label="已收金额">
              <el-input :value="`¥${formatMoney(currentRow?.receivedAmount || 0)}`" readonly />
            </el-form-item>
            <el-form-item label="未收金额">
              <el-input :value="`¥${formatMoney(currentRow?.unpaidAmount || 0)}`" readonly style="color: #ff4d4f;" />
            </el-form-item>
            <el-form-item label="本次收款" prop="amount">
              <el-input-number 
                v-model="receiveForm.amount" 
                :min="0" 
                :max="currentRow?.unpaidAmount || 0"
                :precision="2"
                style="width: 100%"
              />
            </el-form-item>
            <el-form-item label="备注" prop="remark">
              <el-input v-model="receiveForm.remark" type="textarea" :rows="3" placeholder="请输入备注信息" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-divider content-position="left">税务与附件</el-divider>
            <el-form-item label="税票金额" prop="taxInvoiceAmount">
              <el-input-number 
                v-model="receiveForm.taxInvoiceAmount" 
                :min="0" 
                :precision="2"
                style="width: 100%"
              />
            </el-form-item>
            <el-form-item label="税票附件">
              <TaxInvoiceUpload
                v-model="receiveForm.taxAttachments"
                record-type="receivable"
                :record-id="currentRow?.id"
              />
            </el-form-item>
            <el-form-item label="其他附件">
              <GeneralFileUpload
                v-model="receiveForm.otherAttachments"
                record-type="receivable"
                :record-id="currentRow?.id"
              />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showReceiveDialog = false">取消</el-button>
          <el-button type="primary" @click="handleReceiveSubmit">确定</el-button>
        </span>
      </template>
    </el-dialog>

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
  totalReceivable: 0,
  totalReceived: 0,
  totalUnpaid: 0,
  receivedPercent: 0,
  unpaidPercent: 0,
  
})
const globalStats = reactive({
  totalReceivable: 0,
  totalReceived: 0,
  totalUnpaid: 0,
  receivedPercent: 0,
  unpaidPercent: 0,
  
})

// 收款对话框
const showReceiveDialog = ref(false)
const currentRow = ref(null)
const receiveFormRef = ref()
const router = useRouter()

const receiveForm = reactive({
  amount: null as any,
  remark: '',
  taxInvoiceAmount: null as any,
  taxAttachments: [] as any[],
  otherAttachments: [] as any[]
})

const receiveRules = {
  amount: [{ required: true, message: '请输入收款金额', trigger: 'blur' }],
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
    const res = await store.fetchReceivableList(params)
    const list = res?.list || []
    const total = res?.total || 0
    tableData.value = list
    pagination.total = total
    const rec = (res?.summary?.receivable) || {}
    stats.totalReceivable = rec.totalReceivable || 0
    stats.totalReceived = rec.totalReceived || 0
    stats.totalUnpaid = rec.totalUnpaid || 0
    stats.receivedPercent = stats.totalReceivable ? Number(((stats.totalReceived / stats.totalReceivable) * 100).toFixed(1)) : 0
    stats.unpaidPercent = stats.totalReceivable ? Number(((stats.totalUnpaid / stats.totalReceivable) * 100).toFixed(1)) : 0
    const grec = (res?.globalSummary?.receivable) || {}
    if (grec && Object.keys(grec).length) {
      globalStats.totalReceivable = grec.totalReceivable || 0
      globalStats.totalReceived = grec.totalReceived || 0
      globalStats.totalUnpaid = grec.totalUnpaid || 0
      globalStats.receivedPercent = globalStats.totalReceivable ? Number(((globalStats.totalReceived / globalStats.totalReceivable) * 100).toFixed(1)) : 0
      globalStats.unpaidPercent = globalStats.totalReceivable ? Number(((globalStats.totalUnpaid / globalStats.totalReceivable) * 100).toFixed(1)) : 0
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

const openCreate = () => {
  router.push('/finance/receivable/add')
}

const handleReceive = async (row: any) => {
  currentRow.value = row
  try {
    const detail = await financeAPI.getReceivableDetail(row.id)
    if ((detail?.unpaidAmount || 0) <= 0) {
      ElMessage.warning('该记录已全部收款，无需再次收款')
      return
    }
    receiveForm.amount = detail?.unpaidAmount
    receiveForm.remark = ''
    receiveForm.taxInvoiceAmount = detail?.taxInvoiceAmount
    receiveForm.taxAttachments = detail?.taxAttachments || []
    receiveForm.otherAttachments = detail?.otherAttachments || []
    showReceiveDialog.value = true
  } catch (e) {
    ElMessage.error('获取详情失败')
  }
}

const handleEdit = (row: any) => {
  router.push(`/finance/receivable/edit/${row.id}`)
}

// 收款提交
const handleReceiveSubmit = () => {
  receiveFormRef.value.validate((valid: boolean) => {
    if (valid) {
      ;(async () => {
        try {
          await financeAPI.updateReceivable(currentRow.value.id, {
            receivedAmount: Number(currentRow.value.receivedAmount || 0) + Number(receiveForm.amount || 0),
            taxInvoiceAmount: receiveForm.taxInvoiceAmount,
            remark: receiveForm.remark || undefined
          })
          ElMessage.success(`收款成功：¥${formatMoney(receiveForm.amount)}`)
          showReceiveDialog.value = false
          loadData()
        } catch (e) {
          ElMessage.error('收款提交失败')
        }
      })()
    }
  })
}

// 新增/编辑提交逻辑由路由页面负责

const handleDelete = (row: any) => {
  ElMessageBox.confirm('确定要删除该记录吗？该操作为软删除。', '删除确认', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      await financeAPI.updateReceivable(row.id, { deletedAt: new Date().toISOString() })
      useFinanceStore().logOperation('receivable', 'soft_delete', row.id)
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

const getReceivableActions = (row: any) => {
  const items: any[] = []
  items.push({ label: '详情', onClick: () => router.push(`/finance/receivable/detail/${row.id}`) })
  if (userStore.can(P => P.Finance.Receivable.Payment)) {
    items.push({ label: '收款', onClick: () => handleReceive(row) })
  }
  if (canEdit(row)) {
    if (userStore.can(P => P.Finance.Receivable.Edit)) {
      items.push({ label: '编辑', onClick: () => handleEdit(row) })
    }
    if (userStore.can(P => P.Finance.Receivable.Delete)) {
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
    const res = await reportAPI.exportReport('receivable', params, (e: ProgressEvent) => {
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
    a.download = '应收导出.xlsx'
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

const fetchAllReceivableIds = async (queryParams: any) => {
  const params: any = {
    page: 1,
    pageSize: 100000,
    customer: queryParams?.customer || undefined,
    startDate: Array.isArray(queryParams?.dateRange) && queryParams?.dateRange[0] ? new Date(new Date(queryParams.dateRange[0]).getTime() - new Date(queryParams.dateRange[0]).getTimezoneOffset() * 60000).toISOString().substring(0,10) : undefined,
      endDate: Array.isArray(queryParams?.dateRange) && queryParams?.dateRange[1] ? new Date(new Date(queryParams.dateRange[1]).getTime() - new Date(queryParams.dateRange[1]).getTimezoneOffset() * 60000).toISOString().substring(0,10) : undefined,
    cache: false
  }
  const store = useFinanceStore()
  const res = await store.fetchReceivableList(params)
  const list = res?.list || []
  cachedAllList = list
  cachedAllMap.clear()
  for (const r of list) cachedAllMap.set(r.id, r)
  return list.map((r: any) => r.id)
}

const fetchReceivableByIds = async (ids: Array<string | number>) => {
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
    const res = await store.fetchReceivableList(params)
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
.receivable {
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
  --summary-accent: #10b981;
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
  box-shadow: 0 0 0 4px rgba(16,185,129,0.12);
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
