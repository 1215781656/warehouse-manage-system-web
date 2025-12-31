<template>
  <div class="inbound-edit">
    <div class="page-header">
      <el-button class="back-btn" @click="goBack">返回</el-button>
      <h1 class="page-title">编辑入库</h1>
    </div>
    <transition name="fade">
      <el-card v-loading="loading">
        <el-form :model="formData" :rules="rules" ref="formRef" label-width="100px">
          
          
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
                <RemoteSelect v-model="formData.supplier" type="supplier" :allow-create="true" placeholder="请输入供应商" />
              </el-form-item>
            </el-col>
            <el-col :xs="24" :sm="12">
              <el-form-item label="品名规格" prop="productSpec">
                <RemoteSelect v-model="formData.productSpec" type="productSpec" :allow-create="true" placeholder="请输入品名规格" />
              </el-form-item>
            </el-col>
          </el-row>

          <el-row :gutter="16">
            <el-col :xs="24" :sm="12">
              <el-form-item label="成分" prop="composition">
                <RemoteSelect v-model="formData.composition" type="composition" :allow-create="true" placeholder="如: 95%棉5%氨纶" />
              </el-form-item>
            </el-col>
            <el-col :xs="24" :sm="12">
              <el-form-item label="克重(g/m²)" prop="weight">
                <el-input-number v-model="formData.weight" :min="1" style="width: 100%" />
              </el-form-item>
            </el-col>
          </el-row>

          <el-row :gutter="16">
            <el-col :xs="24" :sm="12">
              <el-form-item label="全幅宽(cm)" prop="width">
                <el-input-number v-model="formData.width" :min="1" style="width: 100%" />
              </el-form-item>
            </el-col>
            <el-col :xs="24" :sm="12">
              <el-form-item label="颜色" prop="color">
                <el-input v-model="formData.color" placeholder="请输入颜色" />
              </el-form-item>
            </el-col>
            
          </el-row>

          <el-row :gutter="16">
            <el-col :xs="24" :sm="12">
              <el-form-item label="色号" prop="colorNo">
                <el-input v-model="formData.colorNo" placeholder="如: AB123" />
              </el-form-item>
            </el-col>
            <el-col :xs="24" :sm="12">
              <el-form-item label="缸号" prop="batchNo">
                <el-input v-model="formData.batchNo" placeholder="请输入缸号" />
              </el-form-item>
            </el-col>
          </el-row>

          <el-row :gutter="16">
            <el-col :xs="24" :sm="12">
              <el-form-item label="匹数" prop="quantity">
                <el-input-number v-model="formData.quantity" :min="1" style="width: 100%" />
              </el-form-item>
            </el-col>
            <el-col :xs="24" :sm="12">
              <el-form-item label="重量(kg)" prop="weightKg">
                <el-input-number v-model="formData.weightKg" :min="0.1" :precision="2" style="width: 100%" />
              </el-form-item>
            </el-col>
          </el-row>

          <el-row :gutter="16">
            <el-col :xs="24" :sm="12">
              <el-form-item label="单价(元)" prop="unitPrice">
                <el-input-number v-model="formData.unitPrice" :min="0.01" :precision="2" style="width: 100%" />
              </el-form-item>
            </el-col>
            <el-col :xs="24" :sm="12">
              <el-form-item label="金额(元)" prop="amount">
                <el-input v-model="computedAmount" readonly>
                  <template #prefix>¥</template>
                </el-input>
              </el-form-item>
            </el-col>
          </el-row>

          <el-row :gutter="16">
            <el-col :xs="24" :sm="24">
              <el-form-item label="附件">
                <TaxInvoiceUpload
                  :model-value="formData.taxAttachments"
                  record-type="inbound"
                  :record-id="(route.params.id as string)"
                  @update:modelValue="(v: any)=>formData.taxAttachments=v"
                />
              </el-form-item>
            </el-col>
          </el-row>

          <div class="form-actions">
            <el-button @click="goBack">返回</el-button>
            <el-button type="primary" @click="handleSubmit">保存</el-button>
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
import TaxInvoiceUpload from '@/components/TaxInvoiceUpload.vue'
import RemoteSelect from '@/components/RemoteSelect/index.vue'
import { useOptionStore } from '@/stores'

const route = useRoute()
const router = useRouter()
const optionStore = useOptionStore()
const loading = ref(false)
const formRef = ref()

const formData = reactive<any>({
  inboundDate: formatDate(new Date()),
  inboundNo: '',
  supplier: '',
  productSpec: '',
  composition: '',
  weight: null,
  width: null,
  color: '',
  colorNo: '',
  batchNo: '',
  quantity: null,
  weightKg: null,
  unitPrice: null,
  amount: null,
  operator: 'admin',
  taxAttachments: [],
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
  const amount = Number(formData.weightKg || 0) * Number(formData.unitPrice || 0)
  return amount.toFixed(2)
})

const draftKey = computed(() => `draft:inbound:edit:${route.params.id}`)

const loadDetail = async () => {
  try {
    loading.value = true
  const id = (route.params.id as string) || (route.query.id as string)
  if (!id) throw new Error('ID无效')
    const res: any = await inventoryAPI.getInboundDetail(id)
    Object.assign(formData, {
      inboundDate: res.inboundDate ? formatDate(res.inboundDate) : formatDate(new Date()),
      inboundNo: res.inboundNo,
      supplier: res.supplier,
      productSpec: res.colorFabric?.productSpec,
      composition: res.colorFabric?.composition,
      weight: Number(res.colorFabric?.weight),
      width: Number(res.colorFabric?.width),
      color: res.colorFabric?.color,
      colorNo: res.colorFabric?.colorNo,
      batchNo: res.colorFabric?.batchNo,
      quantity: Number(res.quantity),
      weightKg: Number(res.weightKg),
      unitPrice: Number(res.unitPrice),
      amount: Number(res.amount),
      operator: res.operator || 'admin',
      taxAttachments: res.taxAttachments || [],
    })
  } catch (e) {
    ElMessage.error('加载详情失败')
  } finally {
    loading.value = false
  }
}

const goBack = () => {
  router.push('/inventory/in')
}

const handleSubmit = async () => {
  const valid = await (formRef.value as any).validate()
  if (!valid) return
  const id = route.params.id as string
  formData.amount = parseFloat(computedAmount.value)
  await inventoryAPI.updateInbound(id, {
    inboundDate: formData.inboundDate,
    inboundNo: formData.inboundNo,
    supplier: formData.supplier,
    productSpec: formData.productSpec,
    composition: formData.composition,
    weight: formData.weight,
    width: formData.width,
    color: formData.color,
    colorNo: formData.colorNo,
    batchNo: formData.batchNo,
    quantity: formData.quantity,
    weightKg: formData.weightKg,
    unitPrice: formData.unitPrice,
    amount: computedAmount.value,
    operator: 'admin',
  })
  localStorage.removeItem(draftKey.value)
  ElMessage.success('保存成功')
  optionStore.invalidate()
  router.push('/inventory/in')
}


onMounted(() => {
  loadDetail()
})
</script>

<style scoped>
.inbound-edit {
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
.item-card-title {
  font-weight: 600;
}
.fade-enter-active, .fade-leave-active {
  transition: opacity .2s;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>
