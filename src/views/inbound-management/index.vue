<template>
  <div class="inbound">
      <div class="page-header">
      <h1 class="page-title">入库管理</h1>
      <div class="header-actions">
        <el-button type="primary" @click="handleAdd" v-if="userStore.can(P => P.Inventory.In.Add)">
          <el-icon><Plus /></el-icon>
          新增入库
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
          v-if="userStore.can(P => P.Inventory.In.Export)"
        >
          <el-icon v-if="!serverExporting"><Download /></el-icon>
          {{ serverExporting ? '导出中...' : '导出' }}
        </el-button>
      </div>
    </div>

    <el-card class="search-card mb-4 search-bar">
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="入库日期">
          <el-date-picker
            v-model="searchForm.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            size="small"
            value-format="YYYY-MM-DD"
            @change="onFilterChange"
          />
        </el-form-item>
        <el-form-item label="货单编号">
          <el-input v-model="searchForm.inboundNo" placeholder="请输入货单编号" size="small" @change="onFilterChange" />
        </el-form-item>
        <el-form-item label="供应商">
          <RemoteSelect 
          v-model="searchForm.supplier"
           type="supplier" 
           placeholder="请选择供应商"
            @update:modelValue="onFilterChange" />
        </el-form-item>
        <el-form-item label="品名规格">
          <RemoteSelect 
          v-model="searchForm.productSpec" 
          type="productSpec" 
          placeholder="请选择品名规格"
          @update:modelValue="onFilterChange" />
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

    <el-card>
      <ExportSelectionTable
        ref="exportTableRef"
        :dataSource="tableData"
        selectionType="all"
        :onSelectionChange="ids => selectedIds = ids as any"
        rowKey="id"
        storageKey="inbound-export-selection"
        :queryParams="searchForm"
        :fetchAllIds="fetchAllInboundIds"
        :fetchItemsByIds="fetchInboundByIds"
        v-loading="loading"
      >
        <template #columns>
          <el-table-column label="入库日期" width="120">
            <template #default="{ row }">
              {{ formatDate(row.inboundDate) }}
            </template>
          </el-table-column>
          <el-table-column prop="inboundNo" label="货单编号" width="150" />
          <el-table-column prop="supplier" label="供应商" width="120" />
          <el-table-column prop="productSpec" label="品名规格" min-width="150" />
          <el-table-column prop="composition" label="成分" width="120" />
          <el-table-column prop="weight" label="克重(g/m²)" width="100" />
          <el-table-column prop="width" label="全幅宽(cm)" width="100" />
          <el-table-column prop="color" label="颜色" width="80" />
          <el-table-column prop="colorNo" label="色号" width="100" />
          <el-table-column prop="batchNo" label="缸号" width="100" />
          <el-table-column prop="quantity" label="匹数" width="80" />
          <el-table-column prop="weightKg" label="重量(kg)" width="100" />
          <el-table-column prop="unitPrice" label="单价(元)" width="100" />
          <el-table-column prop="amount" label="金额(元)" width="120">
            <template #default="{ row }">
              ¥{{ formatMoney(row.amount) }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="180" fixed="right">
            <template #default="{ row }">
              <ResponsiveActions :items="getInboundActions(row)" />
            </template>
          </el-table-column>
        </template>
      </ExportSelectionTable>

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
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Search, Download } from '@element-plus/icons-vue'
import { inventoryAPI, reportAPI } from '@/api'
import { formatDate, rangeToDayBounds } from '@/helpers/date'
import ResponsiveActions from '@/components/ResponsiveActions.vue'
import ExportSelectionTable from '@/components/ExportSelectionTable/ExportSelectionTable.vue'
import { useAutoSearch } from '@/hooks/useAutoSearch'
import RemoteSelect from '@/components/RemoteSelect/index.vue'
import { useUserStore, useOptionStore } from '@/stores'
import { P } from '@/constants/permissions'

const router = useRouter()
const userStore = useUserStore()
const optionStore = useOptionStore()

const searchForm = reactive({
  dateRange: '',
  inboundNo: '',
  supplier: '',
  productSpec: ''
})

const tableData = ref([])
const loading = ref(false)
let selectedIds: any[] = []
const exportTableRef = ref()
const serverExporting = ref(false)
const serverExportProgress = ref(0)
const serverExportError = ref(false)

const pagination = reactive({
  currentPage: 1,
  pageSize: 10,
  total: 0
})

// const supplierOptions = ref<string[]>([]) // Removed
// const productSpecOptions = ref<string[]>([]) // Removed

// 已移除“当前筛选”展示，相关计算删除

const formData = reactive({
  id: '',
  inboundDate: new Date(),
  inboundNo: '',
  supplier: '',
  productSpec: '',
  composition: '',
  weight: 0,
  width: 0,
  color: '',
  colorNo: '',
  batchNo: '',
  quantity: 0,
  weightKg: 0,
  unitPrice: 0,
  amount: 0
})

const rules = {
  inboundDate: [{ required: true, message: '请选择入库日期', trigger: 'change' }],
  inboundNo: [{ required: true, message: '请输入货单编号', trigger: 'blur' }],
  supplier: [{ required: true, message: '请输入供应商', trigger: 'blur' }],
  productSpec: [{ required: true, message: '请输入品名规格', trigger: 'blur' }],
  composition: [{ required: true, message: '请输入成分', trigger: 'blur' }],
  weight: [{ required: true, message: '请输入克重', trigger: 'blur' }],
  width: [{ required: true, message: '请输入全幅宽', trigger: 'blur' }],
  color: [{ required: true, message: '请输入颜色', trigger: 'blur' }],
  colorNo: [{ required: true, message: '请输入色号', trigger: 'blur' }],
  batchNo: [{ required: true, message: '请输入缸号', trigger: 'blur' }],
  quantity: [{ required: true, message: '请输入匹数', trigger: 'blur' }],
  weightKg: [{ required: true, message: '请输入重量', trigger: 'blur' }],
  unitPrice: [{ required: true, message: '请输入单价', trigger: 'blur' }]
}

const computedAmount = computed(() => {
  const amount = formData.weightKg * formData.unitPrice
  return amount.toFixed(2)
})

const formatMoney = (amount: number) => {
  return amount.toLocaleString('zh-CN', { minimumFractionDigits: 2 })
}

const handleSearch = () => {
  loadData()
}

const handleReset = () => {
  searchForm.dateRange = ''
  searchForm.inboundNo = ''
  searchForm.supplier = ''
  searchForm.productSpec = ''
  loadData()
}

const loadData = async () => {
  if ((loadData as any).signal instanceof AbortSignal) {
    return await loadDataCancelable((loadData as any).signal)
  }
  loading.value = true
  try {
    const params: any = {}
    if (searchForm.inboundNo) params.inboundNo = searchForm.inboundNo
    if (searchForm.supplier) params.supplier = searchForm.supplier
    if (searchForm.productSpec) params.productSpec = searchForm.productSpec
    if (searchForm.dateRange) {
      const { start, end } = rangeToDayBounds(searchForm.dateRange as any)
      if (start) params.dateStart = start
      if (end) params.dateEnd = end
    }
    const list = await inventoryAPI.getInboundList(params)
    tableData.value = (list || []).map((x: any) => ({
      id: x.id,
      inboundDate: x.inboundDate,
      inboundNo: x.inboundNo,
      supplier: x.supplier,
      productSpec: x.colorFabric?.productSpec,
      composition: x.colorFabric?.composition,
      weight: x.colorFabric?.weight,
      width: x.colorFabric?.width,
      color: x.colorFabric?.color,
      colorNo: x.colorFabric?.colorNo,
      batchNo: x.colorFabric?.batchNo,
      quantity: x.quantity,
      weightKg: Number(x.weightKg),
      unitPrice: Number(x.unitPrice),
      amount: Number(x.amount),
    }))
    // Options logic removed
    pagination.total = tableData.value.length
  } catch (error) {
    ElMessage.error('加载数据失败')
  } finally {
    loading.value = false
  }
}

const loadDataCancelable = async (signal?: AbortSignal) => {
  loading.value = true
  try {
    const params: any = {}
    if (searchForm.inboundNo) params.inboundNo = searchForm.inboundNo
    if (searchForm.supplier) params.supplier = searchForm.supplier
    if (searchForm.productSpec) params.productSpec = searchForm.productSpec
    if (searchForm.dateRange) {
      const { start, end } = rangeToDayBounds(searchForm.dateRange as any)
      if (start) params.dateStart = start
      if (end) params.dateEnd = end
    }
    const list = await inventoryAPI.getInboundList(params, { signal })
    tableData.value = (list || []).map((x: any) => ({
      id: x.id,
      inboundDate: x.inboundDate,
      inboundNo: x.inboundNo,
      supplier: x.supplier,
      productSpec: x.colorFabric?.productSpec,
      composition: x.colorFabric?.composition,
      weight: x.colorFabric?.weight,
      width: x.colorFabric?.width,
      color: x.colorFabric?.color,
      colorNo: x.colorFabric?.colorNo,
      batchNo: x.colorFabric?.batchNo,
      quantity: x.quantity,
      weightKg: Number(x.weightKg),
      unitPrice: Number(x.unitPrice),
      amount: Number(x.amount),
    }))
    // Options logic removed
    pagination.total = tableData.value.length
  } catch (error: any) {
    if (!(error?.name === 'CanceledError' || error?.code === 'ERR_CANCELED')) {
      ElMessage.error('加载数据失败')
    }
  } finally {
    loading.value = false
  }
}

const { trigger: onFilterChange } = useAutoSearch(
  () => ({
    dateRange: searchForm.dateRange,
    inboundNo: searchForm.inboundNo,
    supplier: searchForm.supplier,
    productSpec: searchForm.productSpec
  }),
  (signal?: AbortSignal) => loadDataCancelable(signal)
)

const handleSizeChange = (val: number) => {
  pagination.pageSize = val
  loadData()
}

const handleCurrentChange = (val: number) => {
  pagination.currentPage = val
  loadData()
}

const handleEdit = (row: any) => {
  router.push({ name: 'InventoryInEdit', params: { id: row.id } })
}

const handleDetail = (row: any) => {
  router.push({ name: 'InventoryInDetail', params: { id: row.id } })
}

const handleDelete = (row: any) => {
  ElMessageBox.confirm('确定要删除这条入库记录吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    await inventoryAPI.deleteInbound(row.id, { operator: 'admin' })
    ElMessage.success('删除成功')
    optionStore.invalidate()
    loadData()
  })
}

const getInboundActions = (row: any) => {
  const actions = [
    { label: '详情', onClick: () => handleDetail(row) },
  ]
  if (userStore.can(P => P.Inventory.In.Edit)) {
    actions.push({ label: '编辑', onClick: () => handleEdit(row) })
  }
  if (userStore.can(P => P.Inventory.In.Delete)) {
    actions.push({ label: '删除', onClick: () => handleDelete(row), danger: true })
  }
  return actions
}
const handleAdd = () => {
  router.push({ name: 'InventoryInAdd' })
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
      inboundNo: (searchForm as any).inboundNo || undefined,
      supplier: (searchForm as any).supplier || undefined,
      productSpec: (searchForm as any).productSpec || undefined,
      dateStart: (searchForm as any).dateRange && (searchForm as any).dateRange[0] ? (searchForm as any).dateRange[0] : undefined,
      dateEnd: (searchForm as any).dateRange && (searchForm as any).dateRange[1] ? (searchForm as any).dateRange[1] : undefined
    }
    const res = await reportAPI.exportReport('inbound', params, (e: ProgressEvent) => {
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
    a.download = '入库导出.xlsx'
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

const buildInboundParams = (queryParams: any) => {
  const params: any = {}
  if (queryParams?.inboundNo) params.inboundNo = queryParams.inboundNo
  if (queryParams?.supplier) params.supplier = queryParams.supplier
  if (queryParams?.productSpec) params.productSpec = queryParams.productSpec
  if (queryParams?.dateRange) {
    const { start, end } = rangeToDayBounds(queryParams.dateRange as any)
    if (start) params.dateStart = start
    if (end) params.dateEnd = end
  }
  return params
}

const fetchAllInboundIds = async (queryParams: any) => {
  const res = await inventoryAPI.getInboundList(buildInboundParams(queryParams))
  const list = (res || []).map((x: any) => ({
    id: x.id,
    inboundDate: x.inboundDate,
    inboundNo: x.inboundNo,
    supplier: x.supplier,
    productSpec: x.colorFabric?.productSpec,
    composition: x.colorFabric?.composition,
    weight: x.colorFabric?.weight,
    width: x.colorFabric?.width,
    color: x.colorFabric?.color,
    colorNo: x.colorFabric?.colorNo,
    batchNo: x.colorFabric?.batchNo,
    quantity: x.quantity,
    weightKg: Number(x.weightKg),
    unitPrice: Number(x.unitPrice),
    amount: Number(x.amount),
  }))
  cachedAllList = list
  cachedAllMap.clear()
  for (const r of list) cachedAllMap.set(r.id, r)
  return list.map((r: any) => r.id)
}

const fetchInboundByIds = async (ids: Array<string | number>) => {
  if (!cachedAllList) {
    const res = await inventoryAPI.getInboundList(buildInboundParams(searchForm))
    cachedAllList = (res || []).map((x: any) => ({
      id: x.id,
      inboundDate: x.inboundDate,
      inboundNo: x.inboundNo,
      supplier: x.supplier,
      productSpec: x.colorFabric?.productSpec,
      composition: x.colorFabric?.composition,
      weight: x.colorFabric?.weight,
      width: x.colorFabric?.width,
      color: x.colorFabric?.color,
      colorNo: x.colorFabric?.colorNo,
      batchNo: x.colorFabric?.batchNo,
      quantity: x.quantity,
      weightKg: Number(x.weightKg),
      unitPrice: Number(x.unitPrice),
      amount: Number(x.amount),
    }))
    cachedAllMap.clear()
    for (const r of cachedAllList) cachedAllMap.set(r.id, r)
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
.inbound {
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
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
</style>
