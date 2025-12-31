<template>
  <div class="edit-page">
    <div class="page-header">
      <el-button @click="$router.back()">返回</el-button>
       <h3>编辑应付</h3>
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
             :model-value="taxAttachments"
             record-type="payable"
             :record-id="id"
             @update:modelValue="(v:any)=>taxAttachments=v"
           />
        </el-form-item>
        <el-form-item label="其他附件">
           <GeneralFileUpload
             :model-value="otherAttachments"
             record-type="payable"
             :record-id="id"
             @update:modelValue="(v:any)=>otherAttachments=v"
           />
        </el-form-item>
      </el-form>
    </el-card>

    <OperationBar>
      <template #button>
            <el-button @click="$router.back()">返回</el-button>
            <el-button type="primary" @click="save">保存</el-button>
      </template>
    </OperationBar>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import TaxInvoiceUpload from '@/components/TaxInvoiceUpload.vue'
import GeneralFileUpload from '@/components/GeneralFileUpload.vue'
import { financeAPI } from '@/api'
import OperationBar from '@/components/OperationBar.vue'
import type { TaxInvoiceAttachment, OtherAttachment } from '@/types'

const route = useRoute()
const router = useRouter()

const id = String(route.params.id || '')
const formRef = ref()
const form = ref<any>({})
const taxAttachments = ref<TaxInvoiceAttachment[]>([])
const otherAttachments = ref<OtherAttachment[]>([])

const unpaidAmount = computed(() => {
  const r = Number(form.value.payableAmount || 0)
  const g = Number(form.value.paidAmount || 0)
  return (r - g).toFixed(2)
})

const load = async () => {
  try {
    const res = await financeAPI.getPayableDetail(id)
    const d = res?.data || res
    form.value = {
      inboundDate: d.inboundDate,
      inboundNo: d.inboundNo,
      code: d.code,
      supplier: d.supplier,
      productSpec: d.productSpec,
      composition: d.composition,
      color: d.color,
      craft: d.craft,
      fabricWeight: d.fabricWeight,
      customerRemark: d.customerRemark,
      pieceCount: d.pieceCount,
      totalWeight: d.totalWeight,
      unitPrice: d.unitPrice,

      payableAmount: d.payableAmount,
      paidAmount: d.paidAmount,
      taxInvoiceAmount: d.taxInvoiceAmount,
      remark: d.remark
    }
    taxAttachments.value = d?.taxAttachments || []
    otherAttachments.value = d?.otherAttachments || []
  } catch {
    ElMessage.error('加载失败')
  }
}

const save = async () => {
  try {
    await financeAPI.updatePayable(id, form.value)
    ElMessage.success('保存成功')
    router.back()
  } catch {
    ElMessage.error('保存失败')
  }
}

onMounted(load)
</script>

<style scoped>
.edit-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.page-header {
  display: flex;
  align-items: center;
  gap: 12px;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
