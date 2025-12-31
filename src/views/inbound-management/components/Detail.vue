<template>
  <div class="inbound-detail">
    <div class="page-header">
      <el-button class="back-btn" @click="goBack">返回</el-button>
      <h1 class="page-title">入库详情</h1>
    </div>
      <el-card v-loading="loading">
      <div v-if="detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="入库日期">{{ detail.inboundDate }}</el-descriptions-item>
          <el-descriptions-item label="货单编号">{{ detail.inboundNo }}</el-descriptions-item>
          <el-descriptions-item label="供应商">{{ detail.supplier }}</el-descriptions-item>
          <el-descriptions-item label="品名规格">{{ detail.colorFabric?.productSpec }}</el-descriptions-item>
          <el-descriptions-item label="成分">{{ detail.colorFabric?.composition }}</el-descriptions-item>
          <el-descriptions-item label="克重">{{ detail.colorFabric?.weight }} g/m²</el-descriptions-item>
          <el-descriptions-item label="全幅宽">{{ detail.colorFabric?.width }} cm</el-descriptions-item>
          <el-descriptions-item label="颜色">{{ detail.colorFabric?.color }}</el-descriptions-item>
          <el-descriptions-item label="色号">{{ detail.colorFabric?.colorNo }}</el-descriptions-item>
          <el-descriptions-item label="缸号">{{ detail.colorFabric?.batchNo }}</el-descriptions-item>
          <el-descriptions-item label="匹数">{{ detail.quantity }}</el-descriptions-item>
          <el-descriptions-item label="重量(kg)">{{ Number(detail.weightKg) }}</el-descriptions-item>
          <el-descriptions-item label="单价(元)">{{ Number(detail.unitPrice) }}</el-descriptions-item>
          <el-descriptions-item label="金额(元)">¥{{ formatMoney(Number(detail.amount)) }}</el-descriptions-item>
          <el-descriptions-item label="附件" :span="2">
            <TaxInvoiceUpload
              :model-value="detail.taxAttachments || []"
              record-type="inbound"
              :record-id="detail.id"
              readonly
            />
          </el-descriptions-item>
        </el-descriptions>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { inventoryAPI } from '@/api'
import TaxInvoiceUpload from '@/components/TaxInvoiceUpload.vue'

const route = useRoute()
const router = useRouter()
const detail = ref<any>(null)
const loading = ref(false)

const formatMoney = (amount: number) => {
  return amount.toLocaleString('zh-CN', { minimumFractionDigits: 2 })
}

const goBack = () => {
  router.push('/inventory/in')
}

const loadDetail = async () => {
  try {
    loading.value = true
    const id = route.params.id as string
    const res = await inventoryAPI.getInboundDetail(id)
    detail.value = res
  } catch (error) {
    ElMessage.error('加载详情失败')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadDetail()
})
</script>

<style scoped>
.inbound-detail {
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
</style>
