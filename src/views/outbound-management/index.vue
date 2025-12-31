<template>
  <div class="outbound">
    <div class="page-header">
      <h1 class="page-title">出库管理</h1>
      <div class="header-actions">
        <el-button type="primary" @click="handleAdd" v-if="userStore.can(P => P.Inventory.Out.Add)">
          <el-icon><Minus /></el-icon>
          新增出库
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
          v-if="userStore.can(P => P.Inventory.Out.Export)"
        >
          <el-icon v-if="!serverExporting"><Download /></el-icon>
          {{ serverExporting ? '导出中...' : '导出' }}
        </el-button>
      </div>
    </div>

    <el-card class="search-card mb-4 search-bar">
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="出货日期">
          <el-date-picker
            v-model="searchForm.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            size="small"
            value-format="YYYY-MM-DD"
            @change="handleSearch"
          />
        </el-form-item>
        <el-form-item label="货单号">
          <el-input v-model="searchForm.outboundNo" placeholder="请输入货单号" size="small" />
        </el-form-item>
        <el-form-item label="编号">
          <el-input v-model="searchForm.deliveryNo" placeholder="请输入编号" size="small" />
        </el-form-item>
        <el-form-item label="客户">
          <RemoteSelect v-model="searchForm.customer" type="customer" placeholder="请选择客户" @update:modelValue="handleSearch" />
        </el-form-item>
        <el-form-item label="品名规格">
          <RemoteSelect v-model="searchForm.productSpec" type="productSpec" placeholder="请选择品名规格" @update:modelValue="handleSearch" />
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
        storageKey="outbound-export-selection"
        :queryParams="searchForm"
        :fetchAllIds="fetchAllOutboundIds"
        :fetchItemsByIds="fetchOutboundByIds"
        v-loading="loading"
      >
        <template #columns>
          <el-table-column prop="outboundDate" label="出货日期" width="120" />
          <el-table-column prop="outboundNo" label="货单号" width="150" />
          <el-table-column prop="deliveryNo" label="编号" width="150" />
          <el-table-column prop="customer" label="客户" width="120" />
          <el-table-column prop="productSpec" label="品名规格" min-width="150" />
          <el-table-column prop="composition" label="成分" width="120" />
          <el-table-column prop="color" label="颜色" width="80" />
          <el-table-column prop="craft" label="工艺" width="100" />
          <el-table-column prop="weight" label="克重(g/m²)" width="100" />
          <el-table-column prop="customerNote" label="客户备注" width="100" />
          <el-table-column prop="quantity" label="匹数" width="80" />
          <el-table-column prop="weightKg" label="重量(kg)" width="100" />
          <el-table-column prop="unitPrice" label="单价(元)" width="100" />
          <el-table-column prop="amount" label="金额(元)" width="120">
            <template #default="{ row }">
              ¥{{ formatMoney(row.amount) }}
            </template>
          </el-table-column>
          <el-table-column prop="consignee" label="签收人" width="100" />
          <el-table-column prop="remark" label="备注" width="120" />
          <el-table-column label="操作" width="160" fixed="right">
            <template #default="{ row }">
              <ResponsiveActions :items="getOutboundActions(row)" />
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
import { ElMessage, ElMessageBox } from 'element-plus'
import { useRouter } from 'vue-router'
import { Minus, Search, Download } from '@element-plus/icons-vue'
import { inventoryAPI, reportAPI } from '@/api'
import ResponsiveActions from '@/components/ResponsiveActions.vue'
import ExportSelectionTable from '@/components/ExportSelectionTable/ExportSelectionTable.vue'
import { rangeToDayBounds } from '@/helpers/date'
import RemoteSelect from '@/components/RemoteSelect/index.vue'
import { useUserStore, useOptionStore } from '@/stores'
import { P } from '@/constants/permissions'

const router = useRouter()
const userStore = useUserStore()
const optionStore = useOptionStore()

const searchForm = reactive({
  dateRange: '',
  outboundNo: '',
  deliveryNo: '',
  customer: '',
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

const showAddDialog = ref(false)
const isEdit = ref(false)
const formRef = ref()

const formData = reactive({
  id: '',
  outboundDate: new Date(),
  outboundNo: '',
  deliveryNo: '',
  colorFabricId: '',
  customer: '',
  quantity: 0,
  weightKg: 0,
  unitPrice: 0,
  amount: 0,
  consignee: '',
  craft: '',
  customerNote: ''
})

const colorFabricOptions = ref([])
// const customerOptions = ref<string[]>([])
// const productSpecOptions = ref<string[]>([])

 

const selectedColorFabric = ref(null)

const rules = {
  outboundDate: [{ required: true, message: '请选择出库日期', trigger: 'change' }],
  outboundNo: [{ required: true, message: '请输入货单编号', trigger: 'blur' }],
  colorFabricId: [{ required: true, message: '请选择色布', trigger: 'change' }],
  customer: [{ required: true, message: '请输入客户名称', trigger: 'blur' }],
  quantity: [{ required: true, message: '请输入匹数', trigger: 'blur' }],
  weightKg: [{ required: true, message: '请输入重量', trigger: 'blur' }],
  unitPrice: [{ required: true, message: '请输入单价', trigger: 'blur' }],
  consignee: [{ required: true, message: '请输入签收人', trigger: 'blur' }]
}

const currentStockInfo = computed(() => {
  if (!selectedColorFabric.value) return ''
  return `库存: ${selectedColorFabric.value.currentStock}匹, 约${(selectedColorFabric.value.currentStock * selectedColorFabric.value.weight / 1000).toFixed(2)}kg`
})

const maxStockQuantity = computed(() => {
  return (selectedColorFabric.value as any)?.currentStock || 0
})

const computedAmount = computed(() => {
  const amount = formData.weightKg * formData.unitPrice
  return amount.toFixed(2)
})

const canSubmit = computed(() => {
  return formData.colorFabricId && 
         formData.quantity > 0 && 
         formData.quantity <= maxStockQuantity.value &&
         formData.customer &&
         formData.consignee
})

const formatMoney = (amount: number) => {
  return amount.toLocaleString('zh-CN', { minimumFractionDigits: 2 })
}

const handleSearch = () => {
  loadData()
}

const handleReset = () => {
  searchForm.dateRange = ''
  searchForm.outboundNo = ''
  searchForm.deliveryNo = ''
  searchForm.customer = ''
  searchForm.productSpec = ''
  loadData()
}

const loadData = async () => {
  loading.value = true
  try {
    const params: any = {}
    if (searchForm.outboundNo) params.outboundNo = searchForm.outboundNo
    if (searchForm.deliveryNo) params.deliveryNo = searchForm.deliveryNo
    if (searchForm.customer) params.customer = searchForm.customer
    if (searchForm.productSpec) params.productSpec = searchForm.productSpec
    if (searchForm.dateRange) {
      const { start, end } = rangeToDayBounds(searchForm.dateRange as any)
      if (start) params.dateStart = start
      if (end) params.dateEnd = end
    }
    const list = await inventoryAPI.getOutboundList(params)
    tableData.value = (list || []).map((x: any) => ({
      id: x.id,
      outboundDate: x.outboundDate,
      outboundNo: x.outboundNo,
      deliveryNo: x.deliveryNo,
      customer: x.customer,
      productSpec: x.colorFabric?.productSpec,
      composition: x.composition || x.colorFabric?.composition,
      color: x.color || x.colorFabric?.color,
      craft: x.process || '',
      weight: x.gramWeight || x.colorFabric?.weight,
      customerNote: x.customerNote || '',
      quantity: x.quantity,
      weightKg: Number(x.weightKg),
      unitPrice: Number(x.unitPrice),
      amount: Number(x.amount),
      consignee: x.consignee,
      remark: x.remark || '',
    }))
    // 移除无关的库存接口调用，避免搜索时触发额外请求
    // const customers = new Set<string>()
    // const specs = new Set<string>()
    // tableData.value.forEach((row: any) => {
    //   if (row.customer) customers.add(row.customer)
    //   if (row.productSpec) specs.add(row.productSpec)
    // })
    // customerOptions.value = Array.from(customers)
    // productSpecOptions.value = Array.from(specs)
    pagination.total = tableData.value.length
  } catch (error) {
    ElMessage.error('加载数据失败')
  } finally {
    loading.value = false
  }
}

const handleColorFabricChange = (value: string) => {
  selectedColorFabric.value = colorFabricOptions.value.find(item => item.id === value) || null
  if (selectedColorFabric.value) {
    formData.quantity = 0
    formData.weightKg = 0
    formData.unitPrice = 0
    formData.amount = 0
  }
}

const calculateWeightAndAmount = () => {
  if (selectedColorFabric.value && formData.quantity > 0) {
    formData.weightKg = parseFloat((formData.quantity * (selectedColorFabric.value as any).weight / 1000).toFixed(2))
    calculateAmount()
  }
}

const calculateAmount = () => {
  formData.amount = parseFloat((formData.weightKg * formData.unitPrice).toFixed(2))
}

const handleSizeChange = (val: number) => {
  pagination.pageSize = val
  loadData()
}

const handleCurrentChange = (val: number) => {
  pagination.currentPage = val
  loadData()
}

const handleEdit = (row: any) => {
  router.push({ name: 'InventoryOutEdit', params: { id: row.id } })
}

const handleDelete = (row: any) => {
  ElMessageBox.confirm('确定要删除这条出库记录吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    return inventoryAPI.deleteOutbound(row.id)
      .then(() => {
        ElMessage.success('删除成功')
        optionStore.invalidate()
        loadData()
      })
      .catch(() => {
        ElMessage.error('删除失败')
      })
  })
}

const getOutboundActions = (row: any) => {
  const actions = [
    { label: '详情', onClick: () => handleDetail(row) },
  ]
  if (userStore.can(P => P.Inventory.Out.Edit)) {
    actions.push({ label: '编辑', onClick: () => handleEdit(row) })
  }
  if (userStore.can(P => P.Inventory.Out.Delete)) {
    actions.push({ label: '删除', onClick: () => handleDelete(row), danger: true })
  }
  return actions
}
const handleDetail = (row: any) => {
  router.push({ name: 'InventoryOutDetail', params: { id: row.id } })
}

const handleSubmit = async () => {
  const valid = await (formRef.value as any).validate()
  if (!valid) return
  if (formData.quantity > maxStockQuantity.value) {
    ElMessage.error('出库数量不能大于库存数量')
    return
  }
  if (isEdit.value) {
    ElMessage.success('编辑成功')
  } else {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const customerCode = formData.customer.substring(0, 2).toUpperCase()
    const serial = String(Math.floor(Math.random() * 1000)).padStart(3, '0')
    formData.deliveryNo = `HD_${year}${month}_${customerCode}${serial}`
    await inventoryAPI.createOutbound({
      outboundDate: formData.outboundDate,
      outboundNo: formData.outboundNo,
      deliveryNo: formData.deliveryNo,
      colorFabricId: formData.colorFabricId,
      customer: formData.customer,
      quantity: formData.quantity,
      weightKg: formData.weightKg,
      unitPrice: formData.unitPrice,
      amount: computedAmount.value,
      consignee: formData.consignee,
    })
    ElMessage.success('新增出库成功')
  }
  
  showAddDialog.value = false
  loadData()
}

onMounted(() => {
  loadData()
})

const handleAdd = () => {
  router.push({ name: 'InventoryOutAdd' })
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
      outboundNo: (searchForm as any).outboundNo || undefined,
      deliveryNo: (searchForm as any).deliveryNo || undefined,
      customer: (searchForm as any).customer || undefined,
      productSpec: (searchForm as any).productSpec || undefined,
      dateStart: (searchForm as any).dateRange && (searchForm as any).dateRange[0] ? (searchForm as any).dateRange[0] : undefined,
      dateEnd: (searchForm as any).dateRange && (searchForm as any).dateRange[1] ? (searchForm as any).dateRange[1] : undefined
    }
    const res = await reportAPI.exportReport('outbound', params, (e: ProgressEvent) => {
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
    a.download = '出库导出.xlsx'
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

const buildOutboundParams = (queryParams: any) => {
  const params: any = {}
  if (queryParams?.outboundNo) params.outboundNo = queryParams.outboundNo
  if (queryParams?.deliveryNo) params.deliveryNo = queryParams.deliveryNo
  if (queryParams?.customer) params.customer = queryParams.customer
  if (queryParams?.productSpec) params.productSpec = queryParams.productSpec
  if (queryParams?.dateRange) {
    const { start, end } = rangeToDayBounds(queryParams.dateRange as any)
    if (start) params.dateStart = start
    if (end) params.dateEnd = end
  }
  return params
}

const fetchAllOutboundIds = async (queryParams: any) => {
  const res = await inventoryAPI.getOutboundList(buildOutboundParams(queryParams))
  const list = (res || []).map((x: any) => ({
    id: x.id,
    outboundDate: x.outboundDate,
    outboundNo: x.outboundNo,
    deliveryNo: x.deliveryNo,
    customer: x.customer,
    productSpec: x.colorFabric?.productSpec,
    composition: x.composition || x.colorFabric?.composition,
    color: x.color || x.colorFabric?.color,
    craft: x.process || '',
    weight: x.gramWeight || x.colorFabric?.weight,
    customerNote: x.customerNote || '',
    quantity: x.quantity,
    weightKg: Number(x.weightKg),
    unitPrice: Number(x.unitPrice),
    amount: Number(x.amount),
    consignee: x.consignee,
    remark: x.remark || '',
  }))
  cachedAllList = list
  cachedAllMap.clear()
  for (const r of list) cachedAllMap.set(r.id, r)
  return list.map((r: any) => r.id)
}

const fetchOutboundByIds = async (ids: Array<string | number>) => {
  if (!cachedAllList) {
    const res = await inventoryAPI.getOutboundList(buildOutboundParams(searchForm))
    cachedAllList = (res || []).map((x: any) => ({
      id: x.id,
      outboundDate: x.outboundDate,
      outboundNo: x.outboundNo,
      deliveryNo: x.deliveryNo,
      customer: x.customer,
      productSpec: x.colorFabric?.productSpec,
      composition: x.composition || x.colorFabric?.composition,
      color: x.color || x.colorFabric?.color,
      craft: x.process || '',
      weight: x.gramWeight || x.colorFabric?.weight,
      quantity: x.quantity,
      weightKg: Number(x.weightKg),
      unitPrice: Number(x.unitPrice),
      amount: Number(x.amount),
      consignee: x.consignee,
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
</script>

<style scoped>
.outbound {
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
