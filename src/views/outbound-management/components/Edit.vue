<template>
  <div class="outbound-edit">
    <div class="page-header">
      <el-button class="back-btn" @click="goBack">返回</el-button>
      <h1 class="page-title">编辑出库</h1>
    </div>
    <transition name="fade">
      <el-card v-loading="loading">
        <el-form :model="formData" :rules="rules" ref="formRef" label-width="100px">
          <el-row :gutter="16">
            <el-col :xs="24" :sm="12">
              <el-form-item label="出货日期" prop="outboundDate">
                <el-date-picker v-model="formData.outboundDate" type="date" value-format="YYYY-MM-DD" style="width: 100%" />
              </el-form-item>
            </el-col>
            <el-col :xs="24" :sm="12">
              <el-form-item label="货单号" prop="outboundNo">
                <el-input v-model="formData.outboundNo" placeholder="请输入货单号" />
              </el-form-item>
            </el-col>
            <el-col :xs="24" :sm="12">
            <el-form-item label="编号" prop="deliveryNo">
                <el-input v-model="formData.deliveryNo" />
              </el-form-item>
            </el-col>
          </el-row>

          <el-row :gutter="16">
            <el-col :xs="24" :sm="12">
              <el-form-item label="客户" prop="customer">
                <RemoteSelect v-model="formData.customer" type="customer" :allow-create="true" placeholder="请输入客户名称" />
              </el-form-item>
            </el-col>
            <el-col :xs="24" :sm="12">
              <el-form-item label="签收人" prop="consignee">
                <el-input v-model="formData.consignee" placeholder="请输入签收人" />
              </el-form-item>
            </el-col>
          </el-row>

          <el-divider>色布信息</el-divider>
          <el-row :gutter="16">
            <el-col :xs="24" :sm="12">
              <el-form-item label="品名规格" prop="colorFabricId">
                <el-select 
                  v-model="formData.colorFabricId" 
                  filterable 
                  placeholder="请选择品名规格" 
                  @change="onSpecChange"
                  style="width: 100%"
                >
                  <el-option 
                    v-for="opt in colorFabricOptions" 
                    :key="opt.id" 
                    :label="`${opt.productSpec} (${opt.currentStock}匹)`" 
                    :value="opt.id" 
                  />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :xs="24" :sm="12">
              <el-form-item label="成分" prop="composition">
                <el-input v-model="formData.composition" />
              </el-form-item>
            </el-col>
            <el-col :xs="24" :sm="12">
              <el-form-item label="颜色" prop="color">
                <el-input v-model="formData.color" />
              </el-form-item>
            </el-col>
            <el-col :xs="24" :sm="12">
              <el-form-item label="工艺" prop="process">
                <el-input v-model="formData.process" />
              </el-form-item>
            </el-col>
            <el-col :xs="24" :sm="12">
              <el-form-item label="克重" prop="gramWeight">
                <el-input-number v-model="formData.gramWeight" style="width: 100%" />
              </el-form-item>
            </el-col>
            <el-col :xs="24" :sm="12">
              <el-form-item label="客户备注" prop="customerNote">
                <el-input v-model="formData.customerNote" type="textarea" :rows="1" />
              </el-form-item>
            </el-col>
             <el-col :xs="24" :sm="24">
              <el-form-item label="备注" prop="remark">
                <el-input v-model="formData.remark" type="textarea" :rows="2" />
              </el-form-item>
            </el-col>
          </el-row>

          <el-row :gutter="16">
            <el-col :xs="24" :sm="12">
              <el-form-item label="匹数" prop="quantity">
                <el-input-number 
                  v-model="formData.quantity" 
                  :min="1" 
                  style="width: 100%"
                  @change="calculateAmount"
                />
              </el-form-item>
            </el-col>
            <el-col :xs="24" :sm="12">
              <el-form-item label="重量(kg)" prop="weightKg">
                <el-input-number 
                  v-model="formData.weightKg" 
                  :min="0.1" 
                  :precision="2" 
                  style="width: 100%"
                  @change="calculateAmount"
                />
              </el-form-item>
            </el-col>
            <el-col :xs="24" :sm="12">
              <el-form-item label="单价(元)" prop="unitPrice">
                <el-input-number 
                  v-model="formData.unitPrice" 
                  :min="0.01" 
                  :precision="2" 
                  style="width: 100%"
                  @change="calculateAmount"
                />
              </el-form-item>
            </el-col>
          </el-row>

          <el-form-item label="金额(元)" prop="amount">
            <el-input v-model="computedAmount" readonly>
              <template #prefix>¥</template>
            </el-input>
          </el-form-item>

          <el-form-item label="附件">
            <TaxInvoiceUpload
              :model-value="formData.taxAttachments"
              record-type="outbound"
              :record-id="(route.params.id as string)"
              @update:modelValue="(v: any)=>formData.taxAttachments=v"
            />
          </el-form-item>

          <el-divider>出库明细</el-divider>
          <el-table
            :data="detailSection.rows"
            border
            highlight-current-row
            height="360"
            style="width: 100%"
          >
            <el-table-column
              v-for="i in 10"
              :key="i"
              :label="String(i)"
              :min-width="80"
              align="center"
            >
              <template #default="{ row }">
                <el-input v-model="row.cells[i - 1]" inputmode="numeric" />
              </template>
            </el-table-column>
            <el-table-column label="操作" fixed="right" :min-width="120" align="center">
              <template #default="{ $index }">
                <el-button class="circle-btn" @click="addRowAfter($index)">+</el-button>
                <el-button class="circle-btn danger" @click="removeRow($index)">-</el-button>
              </template>
            </el-table-column>
          </el-table>

        <div class="form-actions">
          <OperationBar :loading="submitting">
            <template #button>
              <el-button @click="goBack">返回</el-button>
              <el-button type="primary" :loading="submitting" @click="handleSubmit">保存</el-button>
            </template>
          </OperationBar>
        </div>
      </el-form>
      </el-card>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { inventoryAPI } from '@/api'
import { formatDate } from '@/helpers/date'
import OperationBar from '@/components/OperationBar.vue'
import TaxInvoiceUpload from '@/components/TaxInvoiceUpload.vue'
import RemoteSelect from '@/components/RemoteSelect/index.vue'
import { useOptionStore } from '@/stores'

const route = useRoute()
const router = useRouter()
const optionStore = useOptionStore()
const loading = ref(false)
const formRef = ref()
const submitting = ref(false)

const formData = reactive<any>({
  outboundDate: formatDate(new Date()),
  outboundNo: '',
  deliveryNo: '',
  customer: '',
  quantity: null,
  weightKg: null,
  unitPrice: null,
  amount: null,
  consignee: '',
  taxAttachments: [],
  colorFabricId: '',
  composition: '',
  color: '',
  process: '',
  gramWeight: null,
  customerNote: '',
  remark: ''
})
const colorFabricOptions = ref<any[]>([])

const loadOptions = async () => {
  const stocks = await inventoryAPI.getStockList({})
  colorFabricOptions.value = (stocks || []).map((s: any) => ({
    id: s.colorFabric?.id,
    productSpec: s.colorFabric?.productSpec,
    composition: s.colorFabric?.composition,
    color: s.colorFabric?.color,
    weight: s.colorFabric?.weight,
    currentStock: s.currentQuantity
  }))
}

const onSpecChange = () => {
  const opt = colorFabricOptions.value.find((o: any) => o.id === formData.colorFabricId)
  if (opt) {
    formData.composition = opt.composition || ''
    formData.color = opt.color || ''
    formData.gramWeight = Number(opt.weight || 0)
    // Clear quantity/weight if stock changes? Maybe better to keep them unless user changes.
    // But since we are switching stock, maybe we should warn or reset if qty > stock?
    // For now, let's just update the fabric details.
  }
}
const detailSection = reactive<any>({
  color: '',
  rows: [] as any[]
})
const addRowAfter = (ri: number) => {
  detailSection.rows.splice(ri + 1, 0, {
    uid: Math.random().toString(36).slice(2),
    cells: Array(10).fill('')
  })
}
const removeRow = (ri: number) => {
  detailSection.rows.splice(ri, 1)
  if (!detailSection.rows.length) addRowAfter(-1)
}

const numberValidator = (_: any, v: any, cb: any) => {
  if (v === null || v === '' || v === undefined) return cb(new Error('请输入有效数字'))
  const n = Number(v)
  if (Number.isNaN(n)) return cb(new Error('请输入有效数字'))
  cb()
}
const rules = {
  outboundDate: [{ required: true, message: '请选择出货日期', trigger: 'change' }],
  outboundNo: [{ required: true, message: '请输入货单号', trigger: 'blur' }],
  customer: [{ required: true, message: '请输入客户名称', trigger: 'blur' }],
  quantity: [{ required: true, validator: numberValidator, trigger: 'blur' }],
  weightKg: [{ required: true, validator: numberValidator, trigger: 'blur' }],
  unitPrice: [{ required: true, validator: numberValidator, trigger: 'blur' }],
  consignee: [{ required: true, message: '请输入签收人', trigger: 'blur' }]
}

const computedAmount = computed(() => {
  const amount = Number(formData.weightKg || 0) * Number(formData.unitPrice || 0)
  return amount.toFixed(2)
})

const draftKey = computed(() => `draft:outbound:edit:${route.params.id}`)

const loadDetail = async () => {
  try {
    loading.value = true
  const id = route.params.id as string
  if (!id) throw new Error('ID无效')
    const res: any = await inventoryAPI.getOutboundDetail(id)
    Object.assign(formData, {
      outboundDate: res.outboundDate ? formatDate(res.outboundDate) : formatDate(new Date()),
      outboundNo: res.outboundNo,
      deliveryNo: res.deliveryNo,
      customer: res.customer,
      quantity: res.quantity,
      weightKg: Number(res.weightKg),
      unitPrice: Number(res.unitPrice),
      amount: Number(res.amount),
      consignee: res.consignee,
      taxAttachments: res.taxAttachments || [],
      colorFabricId: res.colorFabric?.id || '',
      composition: res.composition || res.colorFabric?.composition || '',
      color: res.color || res.colorFabric?.color || '',
      process: res.process || '',
      gramWeight: res.gramWeight || res.colorFabric?.weight || null,
      customerNote: res.customerNote || '',
      remark: res.remark || ''
    })
    const rawDetails = (res as any)?.outboundDetails ?? []
    const arr: number[] = Array.isArray(rawDetails) ? rawDetails.map((x: any) => Number(x)) : []
    detailSection.rows = []
    for (let i = 0; i < arr.length; i += 10) {
      detailSection.rows.push({ uid: Math.random().toString(36).slice(2), cells: arr.slice(i, i + 10).map((x: any) => String(x)) })
    }
    const draft = localStorage.getItem(draftKey.value)
    if (draft) Object.assign(formData, JSON.parse(draft))
  } catch (e) {
    ElMessage.error('加载详情失败')
  } finally {
    loading.value = false
  }
}

const goBack = () => {
  router.back()
}

const calculateAmount = () => {
  formData.amount = parseFloat((formData.weightKg * formData.unitPrice).toFixed(2))
}

const handleSubmit = async () => {
  const valid = await (formRef.value as any).validate()
  if (!valid) return
  const id = route.params.id as string
  try {
    submitting.value = true
    const details = (detailSection.rows || []).flatMap((r: any) => (r.cells || [])).filter((x: any) => x !== '' && x !== null && !Number.isNaN(Number(x))).map((x: any) => Number(x))
    const detailsTotal = details.reduce((a: number, b: number) => a + Number(b || 0), 0)
    const finalWeightKg = details.length ? Number(detailsTotal.toFixed(2)) : Number(formData.weightKg || 0)
    const finalQuantity = details.length ? details.length : Number(formData.quantity || 0)
    await inventoryAPI.updateOutbound(id, {
      outboundDate: formData.outboundDate,
      outboundNo: formData.outboundNo,
      deliveryNo: formData.deliveryNo,
      customer: formData.customer,
      quantity: finalQuantity,
      weightKg: finalWeightKg,
      unitPrice: Number(formData.unitPrice || 0),
      amount: computedAmount.value,
      consignee: formData.consignee,
      outboundDetails: details,
      colorFabricId: formData.colorFabricId,
      composition: formData.composition,
      color: formData.color,
      process: formData.process,
      gramWeight: formData.gramWeight,
      customerNote: formData.customerNote,
      remark: formData.remark
    })
    localStorage.removeItem(draftKey.value)
    ElMessage.success('保存成功')
    optionStore.invalidate()
    router.push('/inventory/out')
  } catch (e: any) {
    ElMessage.error(e?.message || '保存失败')
  } finally {
    submitting.value = false
  }
}

watch(formData, () => {
  localStorage.setItem(draftKey.value, JSON.stringify(formData))
}, { deep: true })

onMounted(() => {
  loadOptions()
  loadDetail()
  if (!detailSection.rows.length) addRowAfter(-1)
})
</script>

<style scoped>
.outbound-edit {
  padding: 0;
}
.page-header {
  display: flex;
  align-items: center;
  gap: 12px;
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
.fade-enter-active, .fade-leave-active {
  transition: opacity .2s;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
.detail-top {
  display: flex;
  gap: 16px;
  align-items: flex-start;
  margin: 12px 0 8px;
}
.detail-left {
  width: 120px;
  padding: 8px;
  border: 1px solid var(--el-border-color);
  border-radius: 6px;
  box-shadow: 0 1px 3px rgba(0,0,0,.06);
  background: var(--el-fill-color-blank);
}
.detail-right {
  flex: 1;
  padding: 8px;
  border: 1px solid var(--el-border-color);
  border-radius: 6px;
  box-shadow: 0 1px 3px rgba(0,0,0,.06);
  background: var(--el-fill-color-blank);
  margin-right: 120px;
}
.detail-rows {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.grid-10 {
  display: grid;
  grid-template-columns: repeat(10, 1fr);
  gap: 6px;
}
.grid-labels {
  display: grid;
  grid-template-columns: repeat(10, 1fr);
  gap: 6px;
}
.grid-label {
  text-align: center;
  font-size: 15px;
}
.row-actions {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 8px;
}
.circle-btn {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 1px solid var(--el-border-color);
  padding: 0;
  font-size: 18px;
  line-height: 26px;
  text-align: center;
  background-color: transparent;
}
.circle-btn.danger {
  color: var(--el-color-danger);
  border-color: var(--el-color-danger);
}
</style>
