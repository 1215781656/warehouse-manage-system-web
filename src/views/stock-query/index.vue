<template>
  <div class="stock">
    <div class="page-header">
      <h1 class="page-title">库存查询</h1>
      <div class="header-actions">
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
          v-if="userStore.can(P => P.Inventory.Stock.Export)"
        >
          <el-icon v-if="!serverExporting"><Download /></el-icon>
          {{ serverExporting ? '导出中...' : '导出' }}
        </el-button>
      </div>
    </div>

    <el-card class="search-card mb-4 search-bar">
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="品名规格">
          <RemoteSelect v-model="searchForm.productSpec" type="productSpec" placeholder="请选择品名规格" @update:modelValue="handleSearch" />
        </el-form-item>
        <el-form-item label="成分">
          <RemoteSelect v-model="searchForm.composition" type="composition" placeholder="请选择成分" @update:modelValue="handleSearch" />
        </el-form-item>
        <el-form-item label="克重">
          <el-input-number v-model="searchForm.weight" :min="0" size="small" controls-position="right" />
        </el-form-item>
        <el-form-item label="全幅">
          <el-input-number v-model="searchForm.width" :min="0" size="small" controls-position="right" />
        </el-form-item>
        <el-form-item label="颜色">
          <el-input v-model="searchForm.color" placeholder="请输入颜色" size="small" />
        </el-form-item>
        <el-form-item label="色号">
          <el-input v-model="searchForm.colorNo" placeholder="请输入色号" size="small" />
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
        storageKey="stock-export-selection"
        :queryParams="searchForm"
        :fetchAllIds="fetchAllStockIds"
        :fetchItemsByIds="fetchStockByIds"
        v-loading="loading"
      >
        <template #columns>
          <el-table-column prop="productSpec" label="品名规格" min-width="150" />
          <el-table-column prop="composition" label="成分" width="100" />
          <el-table-column prop="weight" label="克重(g/m²)" width="100"  />
          <el-table-column prop="width" label="全幅宽(cm)" width="100"  />
          <el-table-column prop="color" label="颜色" width="100" />
          <el-table-column prop="colorNo" label="色号" width="100" />
          <el-table-column prop="inboundQuantity" label="入库匹数" width="120"  />
          <el-table-column prop="inboundWeight" label="入库重量(kg)" width="140"  />
          <el-table-column prop="outboundQuantity" label="出库匹数" width="120"  />
          <el-table-column prop="outboundWeight" label="出库重量(kg)" width="140"  />
          <el-table-column prop="currentQuantity" label="库存匹数" width="120"  />
          <el-table-column prop="currentWeight" label="库存重量(kg)" width="140"  />
          <!-- <el-table-column label="操作" width="120" fixed="right">
            <template #default="{ row }">
              <ResponsiveActions :items="[{ label: '详情', onClick: () => handleDetail(row) }]"/>
            </template>
          </el-table-column> -->
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

    <el-dialog
      v-model="showDetailDialog"
      title="库存详情"
      width="600px"
    >
      <div v-if="selectedRow">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="色号">{{ selectedRow.colorNo }}</el-descriptions-item>
          <el-descriptions-item label="品名规格">{{ selectedRow.productSpec }}</el-descriptions-item>
          <el-descriptions-item label="成分">{{ selectedRow.composition }}</el-descriptions-item>
          <el-descriptions-item label="克重">{{ selectedRow.weight }} g/m²</el-descriptions-item>
          <el-descriptions-item label="全幅宽">{{ selectedRow.width }} cm</el-descriptions-item>
          <el-descriptions-item label="颜色">{{ selectedRow.color }}</el-descriptions-item>
          <el-descriptions-item label="缸号">{{ selectedRow.batchNo }}</el-descriptions-item>
        </el-descriptions>
        <el-divider />
        <h4>库存变动记录</h4>
        <el-table :data="stockHistory" style="width: 100%" max-height="300">
          <el-table-column prop="date" label="日期" width="120" />
          <el-table-column prop="type" label="类型" width="80">
            <template #default="{ row }">
              <el-tag :type="row.type === 'in' ? 'success' : 'danger'" size="small">
                {{ row.type === 'in' ? '入库' : '出库' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="quantity" label="数量(匹)" width="100" />
          <el-table-column prop="weight" label="重量(kg)" width="100" />
          <el-table-column prop="note" label="备注" />
        </el-table>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Search, Download } from '@element-plus/icons-vue'
import { inventoryAPI, reportAPI } from '@/api'
import ResponsiveActions from '@/components/ResponsiveActions.vue'
import ExportSelectionTable from '@/components/ExportSelectionTable/ExportSelectionTable.vue'
import RemoteSelect from '@/components/RemoteSelect/index.vue'
import { useUserStore, useOptionStore } from '@/stores'
import { P } from '@/constants/permissions'

const userStore = useUserStore()
const optionStore = useOptionStore()

const searchForm = reactive({
  productSpec: '',
  composition: '',
  weight: null as any,
  width: null as any,
  color: '',
  colorNo: ''
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

const showDetailDialog = ref(false)
const selectedRow = ref<any>(null)
const stockHistory = ref<any[]>([])

const totalStats = reactive({
  totalTypes: 0,
  totalQuantity: 0,
  totalWeight: 0
})

// const productSpecOptions = ref<string[]>([])
// const compositionOptions = ref<string[]>([])

const loadData = async (params?: any) => {
  loading.value = true
  try {
    const stocks = await inventoryAPI.getStockList(params || {})
    tableData.value = (stocks || []).map((s: any) => ({
      id: s.id,
      colorNo: s.colorFabric?.colorNo,
      productSpec: s.colorFabric?.productSpec,
      composition: s.colorFabric?.composition,
      weight: s.colorFabric?.weight,
      width: s.colorFabric?.width,
      color: s.colorFabric?.color,
      batchNo: s.colorFabric?.batchNo,
      inboundQuantity: s.totalInboundQuantity,
      inboundWeight: Number(s.totalInboundWeight),
      outboundQuantity: s.totalOutboundQuantity,
      outboundWeight: Number(s.totalOutboundWeight),
      currentQuantity: s.currentQuantity,
      currentWeight: Number(s.currentWeight)
    }))
    // const specs = new Set<string>()
    // const comps = new Set<string>()
    // tableData.value.forEach((row: any) => {
    //   if (row.productSpec) specs.add(row.productSpec)
    //   if (row.composition) comps.add(row.composition)
    // })
    // productSpecOptions.value = Array.from(specs)
    // compositionOptions.value = Array.from(comps)
    totalStats.totalTypes = tableData.value.length
    totalStats.totalQuantity = tableData.value.reduce((sum, item) => sum + item.currentQuantity, 0)
    totalStats.totalWeight = tableData.value.reduce((sum, item) => sum + item.currentWeight, 0)
    pagination.total = tableData.value.length
  } catch (error) {
    ElMessage.error('加载数据失败')
  } finally {
    loading.value = false
  }
}

 

const handleSearch = () => {
  const params: any = {}
  if (searchForm.productSpec) params.productSpec = searchForm.productSpec
  if (searchForm.composition) params.composition = searchForm.composition
  if (searchForm.weight !== null && searchForm.weight !== undefined && searchForm.weight !== '') params.weight = searchForm.weight
  if (searchForm.width !== null && searchForm.width !== undefined && searchForm.width !== '') params.width = searchForm.width
  if (searchForm.color) params.color = searchForm.color
  if (searchForm.colorNo) params.colorNo = searchForm.colorNo
  loadData(params)
}
const handleReset = () => {
  searchForm.productSpec = ''
  searchForm.composition = ''
  searchForm.weight = null
  searchForm.width = null
  searchForm.color = ''
  searchForm.colorNo = ''
  loadData({})
}

const handleSizeChange = (val: number) => {
  pagination.pageSize = val
}
const handleCurrentChange = (val: number) => {
  pagination.currentPage = val
}

const handleDetail = (row: any) => {
  selectedRow.value = row
  stockHistory.value = [
    { date: '2024-12-20', type: 'in', quantity: 50, weight: 750.5, note: '入库' },
    { date: '2024-12-21', type: 'out', quantity: 5, weight: 75.05, note: '出库给上海服装厂' }
  ]
  showDetailDialog.value = true
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
      productSpec: searchForm.productSpec || undefined,
      composition: searchForm.composition || undefined,
      weight: searchForm.weight ?? undefined,
      width: searchForm.width ?? undefined,
      color: searchForm.color || undefined,
      colorNo: searchForm.colorNo || undefined
    }
    const res = await reportAPI.exportReport('stock', params, (e: ProgressEvent) => {
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
    a.download = '库存导出.xlsx'
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

const buildStockParams = (queryParams: any) => {
  const params: any = {}
  if (queryParams?.productSpec) params.productSpec = queryParams.productSpec
  if (queryParams?.composition) params.composition = queryParams.composition
  if (queryParams?.weight !== null && queryParams?.weight !== undefined && queryParams?.weight !== '') params.weight = queryParams.weight
  if (queryParams?.width !== null && queryParams?.width !== undefined && queryParams?.width !== '') params.width = queryParams.width
  if (queryParams?.color) params.color = queryParams.color
  if (queryParams?.colorNo) params.colorNo = queryParams.colorNo
  return params
}

const fetchAllStockIds = async (queryParams: any) => {
  const stocks = await inventoryAPI.getStockList(buildStockParams(queryParams))
  const list = (stocks || []).map((s: any) => ({
    id: s.id,
    colorNo: s.colorFabric?.colorNo,
    productSpec: s.colorFabric?.productSpec,
    composition: s.colorFabric?.composition,
    weight: s.colorFabric?.weight,
    width: s.colorFabric?.width,
    color: s.colorFabric?.color,
    batchNo: s.colorFabric?.batchNo,
    inboundQuantity: s.totalInboundQuantity,
    inboundWeight: Number(s.totalInboundWeight),
    outboundQuantity: s.totalOutboundQuantity,
    outboundWeight: Number(s.totalOutboundWeight),
    currentQuantity: s.currentQuantity,
    currentWeight: Number(s.currentWeight)
  }))
  cachedAllList = list
  cachedAllMap.clear()
  for (const r of list) cachedAllMap.set(r.id, r)
  return list.map((r: any) => r.id)
}

const fetchStockByIds = async (ids: Array<string | number>) => {
  if (!cachedAllList) {
    const stocks = await inventoryAPI.getStockList(buildStockParams(searchForm))
    cachedAllList = (stocks || []).map((s: any) => ({
      id: s.id,
      colorNo: s.colorFabric?.colorNo,
      productSpec: s.colorFabric?.productSpec,
      composition: s.colorFabric?.composition,
      weight: s.colorFabric?.weight,
      width: s.colorFabric?.width,
      color: s.colorFabric?.color,
      batchNo: s.colorFabric?.batchNo,
      inboundQuantity: s.totalInboundQuantity,
      inboundWeight: Number(s.totalInboundWeight),
      outboundQuantity: s.totalOutboundQuantity,
      outboundWeight: Number(s.totalOutboundWeight),
      currentQuantity: s.currentQuantity,
      currentWeight: Number(s.currentWeight)
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
.stock {
  padding: 0;
}
.header-actions {
  display: flex;
  gap: 8px;
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
.trend-danger {
  color: #ff4d4f;
}
:deep(.danger-row) {
  background-color: #fff1f0 !important;
}
:deep(.warning-row) {
  background-color: #fffbe6 !important;
}
</style>
