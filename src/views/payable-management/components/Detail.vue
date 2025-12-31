<template>
  <div class="detail-page">
    <div class="page-header">
      <el-button @click="$router.back()">返回</el-button>
       <h3>应付详情</h3>
    </div>
    <el-card class="mb-4">
      <el-descriptions :column="2" border>
        <el-descriptions-item label="入库日期">{{ detail.inboundDate }}</el-descriptions-item>
        <el-descriptions-item label="入库编号">{{ detail.inboundNo }}</el-descriptions-item>
        <!-- <el-descriptions-item label="编号">{{ detail.code }}</el-descriptions-item> -->
        <el-descriptions-item label="供应商">{{ detail.supplier }}</el-descriptions-item>
        <el-descriptions-item label="品名规格">{{ detail.productSpec }}</el-descriptions-item>
        <el-descriptions-item label="成分">{{ detail.composition }}</el-descriptions-item>
        <el-descriptions-item label="颜色">{{ detail.color }}</el-descriptions-item>
        <!-- <el-descriptions-item label="工艺">{{ detail.craft }}</el-descriptions-item> -->
        <el-descriptions-item label="克重">{{ detail.fabricWeight }}</el-descriptions-item>
        <!-- <el-descriptions-item label="客户备注">{{ detail.customerRemark }}</el-descriptions-item> -->
        <el-descriptions-item label="色号">{{ detail.colorNo }}</el-descriptions-item>
        <el-descriptions-item label="缸号">{{ detail.batchNo }}</el-descriptions-item>
        <el-descriptions-item label="匹数">{{ detail.pieceCount }}</el-descriptions-item>
        <el-descriptions-item label="重量">{{ detail.totalWeight }}</el-descriptions-item>
        <el-descriptions-item label="单价">{{ detail.unitPrice }}</el-descriptions-item>
        <el-descriptions-item label="应付金额">¥{{ formatMoney(detail.payableAmount || 0) }}</el-descriptions-item>
        <el-descriptions-item label="已付金额">¥{{ formatMoney(detail.paidAmount || 0) }}</el-descriptions-item>
        <el-descriptions-item label="税票金额">¥{{ formatMoney(detail.taxInvoiceAmount || 0) }}</el-descriptions-item>
        <el-descriptions-item label="未付金额">¥{{ formatMoney(detail.unpaidAmount || 0) }}</el-descriptions-item>
        <el-descriptions-item label="备注" :span="2">{{ detail.remark }}</el-descriptions-item>
      </el-descriptions>
    </el-card>
    <el-card class="mb-4">
      <template #header>
        <div class="card-header">
          <span>税票附件</span>
        </div>
      </template>
      <TaxInvoiceUpload
        :model-value="taxAttachments"
        record-type="payable"
        :record-id="id"
        :readonly="true"
      />
    </el-card>
    <el-card>
      <template #header>
        <div class="card-header">
          <span>其他附件</span>
        </div>
      </template>
      <GeneralFileUpload
        :model-value="otherAttachments"
        record-type="payable"
        :record-id="id"
        :readonly="true"
      />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import TaxInvoiceUpload from '@/components/TaxInvoiceUpload.vue'
import GeneralFileUpload from '@/components/GeneralFileUpload.vue'
import { financeAPI } from '@/api'
import type { TaxInvoiceAttachment, OtherAttachment } from '@/types'

const route = useRoute()
const id = String(route.params.id || '')

const detail = ref<any>({})
const taxAttachments = ref<TaxInvoiceAttachment[]>([])
const otherAttachments = ref<OtherAttachment[]>([])

const formatMoney = (n: number) => n.toLocaleString('zh-CN', { minimumFractionDigits: 2 })

const load = async () => {
  try {
    const res = await financeAPI.getPayableDetail(id)
    detail.value = res?.data || res
    taxAttachments.value = detail.value?.taxAttachments || []
    otherAttachments.value = detail.value?.otherAttachments || []
  } catch {
    ElMessage.error('加载详情失败')
  }
}

onMounted(load)
</script>

<style scoped>
.detail-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.mb-4 {
  margin-bottom: 16px;
}
.page-header {
  display: flex;
  align-items: center;
  gap: 12px;
}
</style>
