<template>
  <div class="inbound-add">
    <div class="page-header">
      <el-button class="back-btn" @click="goBack">返回</el-button>
      <h1 class="page-title">{{ isEdit ? '编辑入库' : '新增入库' }}</h1>
    </div>
    <transition name="fade">
      <div class="content-scroll" :style="{ paddingBottom: fixedPadding }">
      <el-card v-loading="loading">
      <el-form :model="formData" :rules="rules" ref="formRef" label-width="100px">
        <h3 class="section-title">批次共用信息</h3>
        <el-row :gutter="16">
          <el-col :xs="24" :sm="12">
            <el-form-item label="入库日期" prop="inboundDate">
              <el-date-picker v-model="formData.inboundDate" type="date" value-format="YYYY-MM-DD" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12">
            <el-form-item label="货单编号" prop="inboundNo">
              <el-input v-model="formData.inboundNo" placeholder="请输入货单编号" />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="16">
          <el-col :xs="24" :sm="12">
            <el-form-item label="供应商" prop="supplier">
              <el-input v-model="formData.supplier"  placeholder="请输入或选择供应商" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-divider />
        <h3 class="section-title">色布明细</h3>
        <div class="item-cards">
          <div class="item-row" v-for="(row, idx) in formData.items" :key="row.id || idx">
            <el-card class="item-card" shadow="hover">
              <div class="item-card-header">
                <div class="item-card-title">色布明细 {{ idx + 1 }}</div>
              </div>
              <el-row :gutter="12">
                <el-col :xs="24" :sm="12">
                <el-form-item :prop="`items.${idx}.productSpec`" :rules="requiredRules" label="品名规格">
                  <el-input v-model="row.productSpec" placeholder="品名规格" />
                </el-form-item>
              </el-col>
              <el-col :xs="24" :sm="12">
                <el-form-item :prop="`items.${idx}.composition`" :rules="requiredRules" label="成分">
                  <el-input v-model="row.composition" placeholder="成分" />
                </el-form-item>
              </el-col>
              <el-col :xs="24" :sm="12">
                <el-form-item :prop="`items.${idx}.weight`" :rules="requiredRules" label="克重(g/m²)">
                  <el-input-number v-model="row.weight" :min="1" style="width: 100%" />
                </el-form-item>
              </el-col>
              <el-col :xs="24" :sm="12">
                <el-form-item :prop="`items.${idx}.width`" :rules="requiredRules" label="全幅宽(cm)">
                  <el-input-number v-model="row.width" :min="1" style="width: 100%" />
                </el-form-item>
              </el-col>
              <el-col :xs="24" :sm="12">
                <el-form-item :prop="`items.${idx}.color`" :rules="requiredRules" label="颜色">
                  <el-input v-model="row.color" />
                </el-form-item>
              </el-col>
              <el-col :xs="24" :sm="12">
                <el-form-item :prop="`items.${idx}.colorNo`" :rules="requiredRules" label="色号">
                  <el-input v-model="row.colorNo" />
                </el-form-item>
              </el-col>
              <el-col :xs="24" :sm="12">
                <el-form-item :prop="`items.${idx}.batchNo`" :rules="requiredRules" label="缸号">
                  <el-input v-model="row.batchNo" />
                </el-form-item>
              </el-col>
              <el-col :xs="24" :sm="12">
                <el-form-item :prop="`items.${idx}.quantity`" :rules="requiredRules" label="匹数">
                  <el-input-number v-model="row.quantity" :min="1" style="width: 100%" />
                </el-form-item>
              </el-col>
              <el-col :xs="24" :sm="12">
                <el-form-item :prop="`items.${idx}.weightKg`" :rules="requiredRules" label="重量(kg)">
                  <el-input-number v-model="row.weightKg" :min="0.01" :precision="2" style="width: 100%" @change="onWeightOrPriceChange(idx)" />
                </el-form-item>
              </el-col>
              <el-col :xs="24" :sm="12">
                <el-form-item :prop="`items.${idx}.unitPrice`" :rules="requiredRules" label="单价(元)">
                  <el-input-number v-model="row.unitPrice" :min="0.01" :precision="2" style="width: 100%" @change="onWeightOrPriceChange(idx)" />
                </el-form-item>
              </el-col>
              <el-col :xs="24" :sm="12">
                <el-form-item :prop="`items.${idx}.amount`" :rules="requiredRules" label="金额(元)">
                  <el-input-number v-model="row.amount" :min="0.01" :precision="2" style="width: 100%" />
                </el-form-item>
              </el-col>
              <el-col :xs="24" :sm="24">
                <el-form-item label="附件">
                  <TaxInvoiceUpload
                    :model-value="row.taxAttachments"
                    record-type="inbound"
                    :record-id="row.id"
                    @update:modelValue="(v: any)=>row.taxAttachments=v"
                  />
                </el-form-item>
              </el-col>
              </el-row>
            </el-card>
            <div class="item-row-actions">
              <el-button class="card-action-btn" size="small" type="primary" aria-label="在此卡片下方新增" @click="addAfter(idx)">新增</el-button>
              <el-button class="card-action-btn" size="small" type="danger" aria-label="删除该色布明细" :disabled="formData.items.length===1" @click="removeItem(idx)">删除</el-button>
            </div>
          </div>
        </div>
        <div class="total-amount">总金额：¥ {{ totalAmountDisplay }}</div>
        <div class="form-actions"></div>
      </el-form>
      </el-card>
      </div>
    </transition>
    <OperationBar :loading="submitting">
      <template #button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">提交</el-button>
      </template>
    </OperationBar>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { inventoryAPI } from '@/api'
import { formatDate } from '@/helpers/date'
import { generateUUID } from '@/helpers'
import OperationBar from '../../../components/OperationBar.vue'
import TaxInvoiceUpload from '@/components/TaxInvoiceUpload.vue'
import RemoteSelect from '@/components/RemoteSelect/index.vue'
import { useOptionStore } from '@/stores'


const route = useRoute()
const router = useRouter()
const optionStore = useOptionStore()
const formRef = ref()
const isEdit = ref(false)
const currentId = ref<string>('')
const loading = ref(false)
const submitting = ref(false)

const formData = reactive({
  inboundDate: formatDate(new Date()),
  inboundNo: '',
  supplier: '',
  items: [] as any[]
})

const numberValidator = (_: any, v: any, cb: any) => {
  if (v === null || v === '' || v === undefined) return cb(new Error('请输入有效数字'))
  const n = Number(v)
  if (Number.isNaN(n)) return cb(new Error('请输入有效数字'))
  cb()
}
const rules = {
  inboundDate: [{ required: true, message: '请选择入库日期', trigger: 'change' }],
  inboundNo: [{ required: true, message: '请输入货单编号', trigger: 'blur' }],
  supplier: [{ required: true, message: '请输入供应商', trigger: 'blur' }]
}
const requiredRules = [{ required: true, message: '此项为必填项', trigger: ['blur', 'change'] }]

const totalAmountDisplay = computed(() => {
  const sum = (formData.items || []).reduce((acc, it: any) => acc + Number((Number(it.weightKg || 0) * Number(it.unitPrice || 0)).toFixed(2)), 0)
  return sum.toFixed(2)
})
const fixedPadding = computed(() => `80px`)

const draftKey = computed(() => isEdit.value && currentId.value ? `draft:inbound:edit:${currentId.value}` : 'draft:inbound:add')

const goBack = () => {
  router.push('/inventory/in')
}

const addItem = () => {
  formData.items.push({
    id: generateUUID(),
    productSpec: '',
    composition: '',
    weight: null as any,
    width: null as any,
    color: '',
    colorNo: '',
    batchNo: '',
    quantity: null as any,
    weightKg: null as any,
    unitPrice: null as any,
    amountEdited: false,
    amount: null as any,
    taxAttachments: [],
  })
}
const addAfter = (idx: number) => {
  const item = {
    id: generateUUID(),
    productSpec: '',
    composition: '',
    weight: null as any,
    width: null as any,
    color: '',
    colorNo: '',
    batchNo: '',
    quantity: null as any,
    weightKg: null as any,
    unitPrice: null as any,
    amountEdited: false,
    amount: null as any,
    taxAttachments: [],
  }
  formData.items.splice(idx + 1, 0, item)
}
const removeItem = (idx: number) => {
  if (formData.items.length === 1) return
  formData.items.splice(idx, 1)
}

const onWeightOrPriceChange = (idx: number) => {
  const it = formData.items[idx]
  const w = Number(it.weightKg || 0)
  const u = Number(it.unitPrice || 0)
  if (!it.amountEdited) {
    const a = parseFloat((w * u).toFixed(2))
    it.amount = a > 0 ? a : null
  }
}

const handleSubmit = async () => {
  const valid = await (formRef.value as any).validate()
  if (!valid) return
  // 简单校验每条明细
  if (!formData.items.length) {
    ElMessage.error('请至少添加一条色布明细')
    return
  }
  for (const [idx, it] of formData.items.entries()) {
    const required = ['productSpec','composition','color','colorNo','batchNo']
    for (const k of required) {
      if (!(it as any)[k]) {
        ElMessage.error(`第${idx + 1}行 ${k} 不能为空`)
        return
      }
    }
    const nums = ['weight','width','quantity','weightKg','unitPrice']
    for (const k of nums) {
      const v = (it as any)[k]
      if (v === null || v === undefined || Number.isNaN(Number(v))) {
        ElMessage.error(`第${idx + 1}行 ${k} 需要有效数字`)
        return
      }
    }
    if ((it as any).amount === null || (it as any).amount === undefined || Number.isNaN(Number((it as any).amount))) {
      const w = Number((it as any).weightKg || 0)
      const u = Number((it as any).unitPrice || 0)
      ;(it as any).amount = Number((w * u).toFixed(2))
    }
  }
  const payload = {
    batch: {
      inboundDate: formData.inboundDate,
      inboundNo: formData.inboundNo,
      supplier: formData.supplier,
      operator: 'admin'
    },
    items: formData.items.map((it: any) => ({
      id: it.id,
      productSpec: it.productSpec,
      composition: it.composition,
      weight: Number(it.weight || 0),
      width: Number(it.width || 0),
      color: it.color,
      colorNo: it.colorNo,
      batchNo: it.batchNo,
      quantity: Number(it.quantity || 0),
      weightKg: Number(it.weightKg || 0),
      unitPrice: Number(it.unitPrice || 0),
      amount: Number(it.amount ?? (Number(it.weightKg || 0) * Number(it.unitPrice || 0))).toFixed(2)
    }))
  }
  submitting.value = true
  const res: any = await inventoryAPI.createInboundBatch(payload).finally(() => { submitting.value = false })
  ElMessage.success('新增成功')
  optionStore.invalidate()
  localStorage.removeItem(draftKey.value)
  router.push('/inventory/in')
}

onMounted(async () => {
  const edit = route.query.edit === '1'
  const id = (route.query.id as string) || ''
  if (edit && id) {
    isEdit.value = true
    currentId.value = id
    loading.value = true
    const res = await inventoryAPI.getInboundBatchDetail(id)
    formData.inboundDate = formatDate(res.batch.inboundDate)
    formData.inboundNo = res.batch.inboundNo
    formData.supplier = res.batch.supplier
    formData.items = (res.items || []).map((it: any) => ({
      id: it.id,
      productSpec: it.colorFabric?.productSpec || '',
      composition: it.colorFabric?.composition || '',
      weight: Number(it.colorFabric?.weight || 0),
      width: Number(it.colorFabric?.width || 0),
      color: it.colorFabric?.color || '',
      colorNo: it.colorFabric?.colorNo || '',
      batchNo: it.colorFabric?.batchNo || '',
      quantity: Number(it.quantity || 0),
      weightKg: Number(it.weightKg || 0),
      unitPrice: Number(it.unitPrice || 0),
      amount: Number(it.amount),
      taxAttachments: it.taxAttachments || [],
    }))
    loading.value = false
  } else {
    // 进入新增页时，强制清空表单与草稿
    isEdit.value = false
    currentId.value = ''
    localStorage.removeItem('draft:inbound:add')
    formData.inboundDate = formatDate(new Date())
    formData.inboundNo = ''
    formData.supplier = ''
    formData.items = []
    addItem()
    return
  }
  const draft = localStorage.getItem(draftKey.value)
  if (draft) Object.assign(formData, JSON.parse(draft))
  if (!formData.items.length) addItem()
})

watch(formData, () => {
  localStorage.setItem(draftKey.value, JSON.stringify(formData))
}, { deep: true })
</script>

<style scoped>
.inbound-add {
  padding: 0;
}
.page-header {
  display: flex;
  align-items: center;
  gap: 12px;
}
.content-scroll {
  overflow-y: auto;
  max-height: calc(100vh - 150px);
  padding-bottom: 12px;
}
.content-scroll::-webkit-scrollbar {
  width: 8px;
}
.content-scroll::-webkit-scrollbar-track {
  background: var(--el-border-color-light);
  border-radius: 8px;
}
.content-scroll::-webkit-scrollbar-thumb {
  background: var(--el-color-primary-light-7);
  border-radius: 8px;
}
.back-btn {
  margin-right: 8px;
}
.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 16px;
}
.section-title {
  margin: 4px 0 8px;
  font-size: 16px;
  font-weight: 600;
}
.table-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 8px;
}
.item-cards {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
  margin-top: 12px;
}
.item-row {
  display: flex;
  align-items: stretch;
  justify-content: space-between;
}
.item-card {
  border-radius: 8px;
  }
.item-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}
.item-row-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
  align-items: flex-end;
  justify-content: center;
}
.card-action-btn {
  transition: transform .1s ease, opacity .1s ease;
  min-width: 48px;
  height: 40px;
}
.card-action-btn:hover {
  transform: translateY(-1px);
}
.card-action-btn:active {
  transform: scale(.98);
}
.item-card-title {
  font-weight: 600;
}
.total-amount {
  margin-top: 20px;
  font-weight: 700;
}
.el-form-item.is-error :deep(.el-input__wrapper),
.el-form-item.is-error :deep(.el-textarea__inner),
.el-form-item.is-error :deep(.el-select__wrapper),
.el-form-item.is-error :deep(.el-input-number) {
  box-shadow: 0 0 0 1px #f56c6c inset;
}
.summary-bar {
  position: sticky;
  bottom: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  padding: 12px 8px;
  background: var(--el-bg-color);
  box-shadow: 0 -6px 14px rgba(0,0,0,0.06);
  border-radius: 8px;
  margin-top: 12px;
}
.summary-info {
  display: flex;
  align-items: center;
  gap: 8px;
}
.summary-label {
  color: var(--el-text-color-secondary);
}
.summary-value {
  font-weight: 700;
  font-size: 18px;
  color: var(--el-color-primary);
}
.summary-actions {
  display: flex;
  gap: 8px;
}
.fade-enter-active, .fade-leave-active {
  transition: opacity .2s;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>
