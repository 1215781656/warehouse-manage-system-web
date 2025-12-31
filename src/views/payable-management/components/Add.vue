<template>
  <div class="add-page">
    <div class="page-header">
      <el-button @click="$router.back()">返回</el-button>
       <h3>新增应付</h3>
    </div>
    <el-card>
      <el-form :model="form" label-width="100px" ref="formRef">
        <el-row :gutter="24">
          <el-col :span="12">
            <el-form-item label="入库日期">
              <el-date-picker v-model="form.inboundDate" style="width: 100%" />
            </el-form-item>
            <el-form-item label="货单编号">
              <el-input v-model="form.inboundNo" />
            </el-form-item>
            <!-- <el-form-item label="编号">
              <el-input v-model="form.code" />
            </el-form-item> -->
            <el-form-item label="供应商">
              <el-input v-model="form.supplier" />
            </el-form-item>
            <el-form-item label="品名规格">
              <el-input v-model="form.productSpec" />
            </el-form-item>
            <!-- <el-form-item label="成分">
              <el-input v-model="form.composition" />
            </el-form-item>
            <el-form-item label="颜色">
              <el-input v-model="form.color" />
            </el-form-item>
            <el-form-item label="工艺">
              <el-input v-model="form.craft" />
            </el-form-item>
            <el-form-item label="克重">
              <el-input v-model="form.fabricWeight" />
            </el-form-item> -->
          </el-col>
          <el-col :span="12">
            <!-- <el-form-item label="客户备注">
              <el-input v-model="form.customerRemark" />
            </el-form-item>
            <el-form-item label="匹数">
              <el-input-number v-model="form.pieceCount" style="width: 100%" />
            </el-form-item>
            <el-form-item label="重量">
              <el-input-number v-model="form.totalWeight" :min="0" :precision="2" style="width: 100%" />
            </el-form-item>
            <el-form-item label="单价">
              <el-input-number v-model="form.unitPrice" :min="0" :precision="2" style="width: 100%" />
            </el-form-item> -->
            <el-form-item label="应付金额">
              <el-input-number v-model="form.payableAmount" :min="0" :precision="2" style="width: 100%" />
            </el-form-item>
            <el-form-item label="已付金额">
              <el-input-number v-model="form.paidAmount" :min="0" :precision="2" style="width: 100%" />
            </el-form-item>
            <el-form-item label="税票金额">
              <el-input-number v-model="form.taxInvoiceAmount" :min="0" :precision="2" style="width: 100%" />
            </el-form-item>
            <el-form-item label="未付金额">
               <el-input :value="unpaidAmount" disabled />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="备注">
          <el-input v-model="form.remark" type="textarea" :rows="3" />
        </el-form-item>

        <el-divider content-position="left">附件</el-divider>
        <el-form-item label="税票附件">
           <TaxInvoiceUpload
             ref="taxUploadRef"
             v-model="taxAttachments"
             record-type="payable"
             :record-id="createdId || ''"
             deferred
           />
        </el-form-item>
        <el-form-item label="其他附件">
           <GeneralFileUpload
             ref="otherUploadRef"
             v-model="otherAttachments"
             record-type="payable"
             :record-id="createdId || ''"
             deferred
           />
        </el-form-item>
      </el-form>
    </el-card>

     <OperationBar>
      <template #button>
            <el-button @click="$router.back()">返回</el-button>
            <el-button type="primary" @click="save" :loading="saving">保存</el-button>
      </template>
    </OperationBar>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'
import { financeAPI } from '@/api'
import OperationBar from '@/components/OperationBar.vue'
import TaxInvoiceUpload from '@/components/TaxInvoiceUpload.vue'
import GeneralFileUpload from '@/components/GeneralFileUpload.vue'

const router = useRouter()
const formRef = ref()
const taxUploadRef = ref()
const otherUploadRef = ref()
const saving = ref(false)

const form = ref<any>({
  inboundDate: new Date(),
  inboundNo: '',
  code: '',
  supplier: '',
  productSpec: '',
  composition: '',
  color: '',
  craft: '',
  fabricWeight: '',
  customerRemark: '',
  pieceCount: 0,
  totalWeight: 0,
  unitPrice: 0,
  payableAmount: 0,
  paidAmount: 0,
  taxInvoiceAmount: 0,
  remark: ''
})

const taxAttachments = ref([])
const otherAttachments = ref([])
const createdId = ref<string | null>(null)

const unpaidAmount = computed(() => {
  const r = Number(form.value.payableAmount || 0)
  const g = Number(form.value.paidAmount || 0)
  return (r - g).toFixed(2)
})

const save = async () => {
  try {
    saving.value = true
    const resp = await financeAPI.createPayable({
      inboundDate: form.value.inboundDate,
      inboundNo: form.value.inboundNo,
      supplier: form.value.supplier,
      code: form.value.code,
      productSpec: form.value.productSpec,
      composition: form.value.composition,
      color: form.value.color,
      craft: form.value.craft,
      fabricWeight: form.value.fabricWeight,
      customerRemark: form.value.customerRemark,
      pieceCount: form.value.pieceCount,
      totalWeight: form.value.totalWeight,
      unitPrice: form.value.unitPrice,

      payableAmount: form.value.payableAmount,
      paidAmount: form.value.paidAmount,
      taxInvoiceAmount: Number(form.value.taxInvoiceAmount || 0),
      remark: form.value.remark,
      source: 'manual'
    })
    const id = (resp?.id) || (resp?.data?.id)
    createdId.value = String(id || '')
    
    // Trigger deferred uploads
    if (taxUploadRef.value) taxUploadRef.value.submit()
    if (otherUploadRef.value) otherUploadRef.value.submit()
    
    await new Promise(r => setTimeout(r, 1000))
    
    ElMessage.success('新增成功')
    router.back()
  } catch (e) {
    console.error(e)
    ElMessage.error('保存失败')
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.page-header {
  display: flex;
  align-items: center;
  gap: 12px;
}
.tips {
  margin-top: 8px;
  color: #909399;
}
</style>
