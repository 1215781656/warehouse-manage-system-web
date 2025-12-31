<template>
  <div class="outbound-add">
    <div class="page-header">
      <el-button class="back-btn" @click="goBack">返回</el-button>
      <h1 class="page-title">新增出库</h1>
    </div>
    <transition name="fade">
      <div class="content-scroll" :style="{ paddingBottom: fixedPadding }">
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
             </el-row>
            <el-row :gutter="16">
            <el-col :xs="24" :sm="12">
              <el-form-item label="编号" prop="code">
                <el-input v-model="formData.code" placeholder="请输入编号" />
              </el-form-item>
            </el-col>
            <el-col :xs="24" :sm="12">
              <el-form-item label="客户" prop="customer">
                <RemoteSelect v-model="formData.customer" type="customer" :allow-create="true" placeholder="请输入客户" />
              </el-form-item>
            </el-col>
            </el-row>
            <el-col :xs="24" :sm="12">
              <el-form-item label="签收人" prop="consignee">
                <el-input v-model="formData.consignee" placeholder="请输入签收人" />
              </el-form-item>
            </el-col>
          

          <el-divider>色布模块</el-divider>
          <div class="item-cards">
            <div class="item-row" v-for="(m, mi) in formData.modules" :key="m.uid">
              <el-card class="item-card" shadow="hover">
                <div class="item-card-header">
                  <div class="item-card-title">色布 {{ mi + 1 }}</div>
                </div>
                <el-row :gutter="12">
                  <el-col :xs="24" :sm="12">
                    <el-form-item :prop="`modules.${mi}.colorFabricId`" :rules="requiredRules" label="品名规格">
                      <el-select v-model="m.colorFabricId" filterable placeholder="请选择品名规格" @change="onSpecChange(mi)" style="width: 100%">
                        <el-option v-for="opt in colorFabricOptions" :key="opt.id" :label="`${opt.productSpec} (${opt.currentStock}匹)`" :value="opt.id" />
                      </el-select>
                    </el-form-item>
                  </el-col>
                  <el-col :xs="24" :sm="12">
                    <el-form-item label="成分">
                      <el-input v-model="m.composition" />
                    </el-form-item>
                  </el-col>
                  <el-col :xs="24" :sm="12">
                    <el-form-item label="颜色">
                      <div class="color-field">
                        <el-input v-model="m.color" placeholder="颜色名称" />
                        <el-color-picker v-model="m.colorCard" />
                      </div>
                    </el-form-item>
                  </el-col>
                  <el-col :xs="24" :sm="12">
                    <el-form-item label="工艺">
                      <el-input v-model="m.craft" />
                    </el-form-item>
                  </el-col>
                  <el-col :xs="24" :sm="12">
                    <el-form-item :prop="`modules.${mi}.weight`" :rules="numberRules" label="克重(g/m²)">
                      <el-input-number v-model="m.weight" :min="1" :precision="0" style="width: 100%" @change="onQtyChange(mi)" />
                    </el-form-item>
                  </el-col>
                  <el-col :xs="24" :sm="12">
                    <el-form-item label="客户备注">
                      <el-input v-model="m.customerNote" type="textarea" :rows="2" />
                    </el-form-item>
                  </el-col>
                  
                  
                  <el-col :xs="24" :sm="12">
                    <el-form-item :prop="`modules.${mi}.quantity`" :rules="integerRules" label="匹数">
                      <el-input-number v-model="m.quantity" :min="1" :precision="0" style="width: 100%" @change="onQtyChange(mi)" />
                    </el-form-item>
                  </el-col>
                  <el-col :xs="24" :sm="12">
                    <el-form-item :prop="`modules.${mi}.weightKg`" :rules="decimalRules" label="重量(kg)">
                      <el-input-number v-model="m.weightKg" :min="0.01" :precision="2" style="width: 100%" @change="onWeightOrPriceChange(mi)" />
                    </el-form-item>
                  </el-col>
                  <el-col :xs="24" :sm="12">
                    <el-form-item :prop="`modules.${mi}.unitPrice`" :rules="decimalRules" label="单价(元)">
                      <el-input-number v-model="m.unitPrice" :min="0.01" :precision="2" style="width: 100%" @change="onWeightOrPriceChange(mi)" />
                    </el-form-item>
                  </el-col>
                  <el-col :xs="24" :sm="12">
                    <el-form-item :prop="`modules.${mi}.amount`" :rules="decimalRules" label="金额(元)">
                      <el-input v-model="m.amountDisplay" @input="onAmountInput(mi)">
                        <template #prefix>¥</template>
                      </el-input>
                    </el-form-item>
                  </el-col>

                  <el-col :xs="24" :sm="12">
                    <el-form-item label="备注">
                      <el-input v-model="m.remark" type="textarea" :rows="2" />
                    </el-form-item>
                  </el-col>
                  <el-col :xs="24" :sm="24">
                    <el-form-item label="附件">
                      <TaxInvoiceUpload
                        :model-value="m.taxAttachments"
                        record-type="outbound"
                        :record-id="m.uid"
                        @update:modelValue="(v: any)=>m.taxAttachments=v"
                      />
                    </el-form-item>
                  </el-col>
                </el-row>

                
              </el-card>
              <div class="item-row-actions">
                <el-button class="card-action-btn" type="primary" @click="addModuleAfter(mi)">新增</el-button>
                <el-button class="card-action-btn" type="danger" @click="removeModule(mi)">删除</el-button>
              </div>
            </div>
          </div>

          <el-divider>出库明细模块</el-divider>
          <div class="detail-cards">
            <div class="item-row" v-for="(sec, si) in formData.detailSections" :key="sec.uid">
              <el-card class="item-card" shadow="hover">
                <div class="item-card-header">
                  <div class="item-card-title">明细模块 {{ si + 1 }}</div>
                </div>
                <div class="detail-rows">
                   <el-row :gutter="8" align="middle">
                    <el-col :xs="24" :sm="3" style="margin-top: 28px;">
                      <el-input v-model="sec.color" placeholder="颜色" class="detail-color-input" />
                    </el-col>
                     <el-col :xs="24" :sm="21">
                  <el-row :gutter="8" align="middle" style="margin-bottom: 8px;">
                    
                    <el-col :xs="24" :sm="22">
                      <div class="grid-labels">
                        <span v-for="n in 10" :key="n" class="grid-label">{{ n }}</span>
                      </div>
                    </el-col>
                    <el-col :xs="24" :sm="2" />
                  </el-row>
                  <div class="detail-row" v-for="(r, ri) in sec.rows" :key="r.uid">
                    <el-row :gutter="8" align="middle">
                      <el-col :xs="24" :sm="22">
                        <div class="grid-10">
                          <el-input v-for="(v, ci) in r.cells" :key="ci" v-model="r.cells[ci]" inputmode="numeric" style="width: 100%" />
                        </div>
                      </el-col>
                      <el-col :xs="24" :sm="2" class="row-actions">
                        <el-button class="circle-btn" @click="addDetailRowAfter(si, ri)">+</el-button>
                        <el-button class="circle-btn danger" @click="removeDetailRow(si, ri)">-</el-button>
                      </el-col>
                    </el-row>
                  </div>
                   </el-col>
                  </el-row>
                </div>
              </el-card>
            </div>
          </div>

          <div class="summary-bar">
            <div class="summary-info">
              <span class="summary-label">总金额</span>
              <span class="summary-value">¥{{ totalAmountDisplay }}</span>
            </div>
            <div class="summary-actions">
              <OperationBar :loading="submitting">
                <template #button>
                  <el-button @click="goBack">返回</el-button>
                  <el-button @click="saveDraft">保存草稿</el-button>
                  <el-button @click="clearDraft" type="danger">清除草稿</el-button>
                  <el-button type="primary" :loading="submitting" @click="handleSubmit">提交</el-button>
                </template>
              </OperationBar>
            </div>
          </div>
        </el-form>
      </el-card>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { inventoryAPI } from '@/api'
import { formatDate } from '@/helpers/date'
import OperationBar from '@/components/OperationBar.vue'
import TaxInvoiceUpload from '@/components/TaxInvoiceUpload.vue'
import RemoteSelect from '@/components/RemoteSelect/index.vue'
import { useOptionStore } from '@/stores'

const router = useRouter()
const optionStore = useOptionStore()
const formRef = ref()
const loading = ref(false)
const submitting = ref(false)
const goBack = () => {
  router.back()
}
const fixedPadding = computed(() => `80px`)

const formData = reactive<any>({
  outboundDate: formatDate(new Date()),
  outboundNo: '',
  code: '',
  customer: '',
  consignee: '',
  modules: [] as any[],
  detailSections: [] as any[]
})

const requiredRules = [{ required: true, message: '此项为必填项', trigger: ['blur','change'] }]
const numberRules = [{ required: true, trigger: ['blur','change'], validator: (_: any, v: any, cb: any) => {
  if (v === null || v === '' || v === undefined) return cb(new Error('请输入有效数字'))
  const n = Number(v)
  if (Number.isNaN(n) || n <= 0) return cb(new Error('请输入有效数字'))
  cb()
}}]
const integerRules = numberRules
const decimalRules = numberRules

const rules = {
  outboundDate: [{ required: true, message: '请选择出货日期', trigger: 'change' }],
  outboundNo: [{ required: true, message: '请输入货单号', trigger: 'blur' }],
  code: [{ required: true, message: '请输入编号', trigger: 'blur' }],
  customer: [{ required: true, message: '请输入客户', trigger: 'blur' }],
  consignee: [{ required: true, message: '请输入签收人', trigger: 'blur' }]
}

const colorFabricOptions = ref<any[]>([])

const addEmptyModule = () => {
  const mod = {
    uid: cryptoRandom(),
    colorFabricId: '',
    composition: '',
    color: '',
    colorCard: '',
    craft: '',
    weight: null as any,
    customerNote: '',
    quantity: null as any,
    weightKg: null as any,
    unitPrice: null as any,
    amount: null as any,
    amountEdited: false,
    amountDisplay: '',
    remark: '',
    taxAttachments: []
  }
  formData.modules.push(mod)
  addDetailSectionForModule(mod.uid)
}
const addModuleAfter = (idx: number) => {
  const m = {
    uid: cryptoRandom(),
    colorFabricId: '',
    composition: '',
    color: '',
    colorCard: '',
    craft: '',
    weight: null as any,
    customerNote: '',
    quantity: null as any,
    weightKg: null as any,
    unitPrice: null as any,
    amount: null as any,
    amountEdited: false,
    amountDisplay: '',
    remark: '',
    taxAttachments: []
  }
  formData.modules.splice(idx + 1, 0, m)
  addDetailSectionForModule(m.uid, idx + 1)
}
const removeModule = (idx: number) => {
  formData.modules.splice(idx, 1)
  formData.detailSections.splice(idx, 1)
  if (!formData.modules.length) addEmptyModule()
}

const addEmptyDetailSection = () => {
  formData.detailSections.push({
    uid: cryptoRandom(),
    moduleUid: formData.modules[formData.modules.length - 1]?.uid || '',
    color: '',
    rows: [{
      uid: cryptoRandom(),
      cells: Array(10).fill('')
    }]
  })
}
const addDetailSectionAfter = (idx: number) => {
  formData.detailSections.splice(idx + 1, 0, {
    uid: cryptoRandom(),
    moduleUid: formData.modules[idx + 1]?.uid || '',
    color: '',
    rows: [{
      uid: cryptoRandom(),
      cells: Array(10).fill('')
    }]
  })
}
const addDetailSectionForModule = (moduleUid: string, insertIndex?: number) => {
  const sec: any = {
    uid: cryptoRandom(),
    moduleUid,
    color: '',
    rows: [{
      uid: cryptoRandom(),
      cells: Array(10).fill('')
    }]
  }
  if (insertIndex !== undefined) {
    formData.detailSections.splice(insertIndex, 0, sec)
  } else {
    formData.detailSections.push(sec)
  }
}
const removeDetailSection = (idx: number) => {
  formData.detailSections.splice(idx, 1)
  if (!formData.detailSections.length) addEmptyDetailSection()
}
const addDetailRow = (si: number) => {
  formData.detailSections[si].rows.push({
    uid: cryptoRandom(),
    cells: Array(10).fill('')
  })
}
const removeDetailRow = (si: number, ri: number) => {
  formData.detailSections[si].rows.splice(ri, 1)
  if (!formData.detailSections[si].rows.length) addDetailRow(si)
}
const addDetailRowAfter = (si: number, ri: number) => {
  formData.detailSections[si].rows.splice(ri + 1, 0, {
    uid: cryptoRandom(),
    cells: Array(10).fill('')
  })
}

const onSpecChange = (mi: number) => {
  const m = formData.modules[mi]
  const opt = colorFabricOptions.value.find((o: any) => o.id === m.colorFabricId)
  if (opt) {
    m.composition = opt.composition || ''
    m.color = opt.color || ''
    m.weight = Number(opt.weight || 0)
    m.amountEdited = false
    m.amountDisplay = ''
    m.quantity = null
    m.weightKg = null
    m.unitPrice = null
    m.amount = null
  }
}
const onQtyChange = (mi: number) => {
  const m = formData.modules[mi]
  const opt = colorFabricOptions.value.find((o: any) => o.id === m.colorFabricId)
  const weightVal = m.weight || opt?.weight || 0
  if (opt && m.quantity && m.quantity > 0) {
    m.weightKg = parseFloat(((m.quantity * weightVal) / 1000).toFixed(2))
    onWeightOrPriceChange(mi)
  }
}
const onWeightOrPriceChange = (mi: number) => {
  const m = formData.modules[mi]
  if (!m.amountEdited) {
    const w = Number(m.weightKg || 0)
    const u = Number(m.unitPrice || 0)
    const a = parseFloat((w * u).toFixed(2))
    m.amount = a
    m.amountDisplay = a ? a.toFixed(2) : ''
  }
}
const onAmountInput = (mi: number) => {
  const m = formData.modules[mi]
  m.amountEdited = true
  const n = Number(m.amountDisplay || 0)
  m.amount = Number.isNaN(n) ? 0 : n
}

const totalAmountDisplay = computed(() => {
  const sum = formData.modules.reduce((acc: number, m: any) => acc + Number(m.amount || 0), 0)
  return sum.toFixed(2)
})

const saveDraft = () => {
  localStorage.setItem(draftKey, JSON.stringify(formData))
  ElMessage.success('草稿已保存')
}
const clearDraft = async () => {
  try {
    await ElMessageBox.confirm('确定清除当前草稿并重置所有表单数据？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    localStorage.removeItem(draftKey)
    Object.assign(formData, {
      outboundDate: formatDate(new Date()),
      outboundNo: '',
      code: '',
      customer: '',
      consignee: '',
      modules: [],
      detailSections: []
    })
    addEmptyModule()
    addEmptyDetailSection()
    ElMessage.success('草稿已清除')
  } catch {}
}

const draftKey = 'draft:outbound:add:batch'

const cryptoRandom = () => self.crypto.randomUUID()

const sanitizeDetailSections = () => {
  formData.detailSections = (formData.detailSections || []).map((sec: any) => ({
    uid: sec.uid,
    moduleUid: sec.moduleUid || '',
    color: sec.color || '',
    rows: (sec.rows || []).map((r: any) => ({
      uid: r.uid,
      cells: (r.cells || Array(10).fill('')).map((x: any) => (x === 0 ? '' : x))
    }))
  }))
  if (formData.detailSections.length !== formData.modules.length) {
    const aligned: any[] = []
    formData.modules.forEach((m: any, i: number) => {
      const found = formData.detailSections.find((s: any) => s.moduleUid === m.uid) || formData.detailSections[i]
      if (found) aligned.push(found)
      else aligned.push({
        uid: cryptoRandom(),
        moduleUid: m.uid,
        color: '',
        rows: [{ uid: cryptoRandom(), cells: Array(10).fill('') }]
      })
    })
    formData.detailSections = aligned
  }
}

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
 

const validateModules = () => {
  if (!formData.modules.length) return false
  for (const [i, m] of formData.modules.entries()) {
    if (!m.colorFabricId) {
      ElMessage.error(`第${i + 1}个色布未选择品名规格`)
      return false
    }
    const opt = colorFabricOptions.value.find((o: any) => o.id === m.colorFabricId)
    const nums = ['quantity','weightKg','unitPrice']
    for (const k of nums) {
      const v = (m as any)[k]
      if (v === null || v === undefined || Number.isNaN(Number(v)) || Number(v) <= 0) {
        ElMessage.error(`第${i + 1}个色布 ${k} 需要有效数字`)
        return false
      }
    }
    if (opt && Number(m.quantity || 0) > Number(opt.currentStock || 0)) {
      ElMessage.error(`第${i + 1}个色布出库匹数不能大于库存(${opt.currentStock})`)
      return false
    }
  }
  return true
}

const handleSubmit = async () => {
  const valid = await (formRef.value as any).validate()
  if (!valid) return
  if (!validateModules()) return
  try {
    submitting.value = true
    const getDetailsByModule = (uid: string) => {
      const sec = formData.detailSections.find((s: any) => s.moduleUid === uid) as any
      if (!sec) return []
      const flat = (sec.rows || []).flatMap((r: any) => (r.cells || []))
      return flat.filter((x: any) => x !== '' && x !== null && !Number.isNaN(Number(x))).map((x: any) => Number(x))
    }
    const items = formData.modules.map((m: any) => {
      const details = getDetailsByModule(m.uid)
      const detailsTotal = details.reduce((a: number, b: number) => a + Number(b || 0), 0)
      const finalWeightKg = details.length ? Number(detailsTotal.toFixed(2)) : Number(m.weightKg || 0)
      const finalQuantity = details.length ? details.length : Number(m.quantity || 0)
      return {
        id: m.uid,
        colorFabricId: m.colorFabricId,
        quantity: finalQuantity,
        weightKg: finalWeightKg,
        unitPrice: Number(m.unitPrice || 0),
        amount: Number(m.amountDisplay || m.amount || 0).toFixed(2),
        outboundDetails: details,
        composition: m.composition,
        color: m.color,
        process: m.craft,
        gramWeight: m.weight,
        customerNote: m.customerNote,
        remark: m.remark
      }
    })
    await inventoryAPI.createOutboundBatch({
      common: {
        outboundDate: formData.outboundDate,
        outboundNo: formData.outboundNo,
        code: formData.code,
        customer: formData.customer,
        consignee: formData.consignee
      },
      items
    })
    localStorage.removeItem(draftKey)
    ElMessage.success('批量出库成功')
    optionStore.invalidate()
    router.push('/inventory/out')
  } catch (e: any) {
    ElMessage.error(e?.message || '提交失败')
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  loadOptions()
  if (!formData.modules.length) addEmptyModule()
  if (!formData.detailSections.length) addEmptyDetailSection()
  const draft = localStorage.getItem(draftKey)
  if (draft) {
    try {
      const j = JSON.parse(draft)
      Object.assign(formData, j)
    } catch {}
  }
  sanitizeDetailSections()
})
</script>

<style scoped>
.outbound-add {
  padding: 0;
}
.content-scroll {
  width: 100%;
}
.item-cards, .detail-cards {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
  margin-top: 12px;
}
.item-row {
  display: flex;
  align-items: stretch;
}
.item-card {
  border-radius: 8px;
  flex: 1;
}
.item-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}
.item-card-title {
  font-weight: 600;
}
.item-row-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
  align-items: flex-end;
  justify-content: center;
}
.card-action-btn {
  min-width: 48px;
  min-height: 48px;
}
.color-field {
  display: flex;
  gap: 8px;
  align-items: center;
}
.detail-color-input {
  width: 120px;
}
.detail-rows {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.detail-row:not(:last-child) {
  margin-bottom: 8px;
}
.detail-row-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 4px;
}
.row-actions {
  display: flex;
  justify-content: flex-end;
  align-items: center;
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
  margin-bottom: 4px;
}
.grid-label {
  text-align: center;
  font-size: 15px;
  line-height: 1.2;
  color: var(--el-text-color-regular);
}
.summary-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 12px;
  padding-top: 8px;
  border-top: 1px solid var(--el-border-color);
}
.summary-info {
  display: flex;
  gap: 8px;
  align-items: baseline;
}
.summary-label {
  color: var(--el-text-color-secondary);
}
.summary-value {
  font-weight: 600;
}
.page-header {
  display: flex;
  align-items: center;
  gap: 12px;
}
.back-btn {
  margin-right: 8px;
}
.fade-enter-active, .fade-leave-active {
  transition: opacity .2s;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
.circle-btn {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 1px solid var(--el-border-color);
  padding: 0 15px;
  font-size: 24px;
  line-height: 26px;
  text-align: center;
  background-color: transparent;
}
.circle-btn.danger {
  color: var(--el-color-danger);
  border-color: var(--el-color-danger);
}
</style>
