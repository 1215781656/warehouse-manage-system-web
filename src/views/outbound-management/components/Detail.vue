<template>
  <div class="outbound-detail">
    <div class="page-header">
      <el-button class="back-btn" @click="goBack">返回</el-button>
      <h1 class="page-title">出库详情</h1>
    </div>
    <el-card>
      <div v-if="detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="出货日期">{{ detail.outboundDate }}</el-descriptions-item>
          <el-descriptions-item label="货单号">{{ detail.outboundNo }}</el-descriptions-item>
          <el-descriptions-item label="编号">{{ detail.deliveryNo }}</el-descriptions-item>
          <el-descriptions-item label="客户">{{ detail.customer }}</el-descriptions-item>
          <el-descriptions-item label="品名规格">{{ detail.colorFabric?.productSpec }}</el-descriptions-item>
          <el-descriptions-item label="成分">{{ detail.colorFabric?.composition }}</el-descriptions-item>
          <el-descriptions-item label="克重">{{ detail.colorFabric?.weight }} g/m²</el-descriptions-item>
          <el-descriptions-item label="全幅宽">{{ detail.colorFabric?.width }} cm</el-descriptions-item>
          <el-descriptions-item label="颜色">{{ detail.colorFabric?.color }}</el-descriptions-item>
          <el-descriptions-item label="色号">{{ detail.colorFabric?.colorNo }}</el-descriptions-item>
          <el-descriptions-item label="匹数">{{ detail.quantity }}</el-descriptions-item>
          <el-descriptions-item label="重量(kg)">{{ Number(detail.weightKg) }}</el-descriptions-item>
          <el-descriptions-item label="单价(元)">{{ Number(detail.unitPrice) }}</el-descriptions-item>
          <el-descriptions-item label="金额(元)">¥{{ formatMoney(Number(detail.amount)) }}</el-descriptions-item>
          <el-descriptions-item label="签收人">{{ detail.consignee }}</el-descriptions-item>
          
        </el-descriptions>
        <el-form-item label="附件" :label-width="120" class="tax-upload-container">
            <div >
              <TaxInvoiceUpload
              :model-value="detail.taxAttachments || []"
              record-type="outbound"
              :record-id="detail.id"
              readonly
            />
            </div>
          </el-form-item>
        <el-divider>出库明细</el-divider>
        <div v-if="rows.length" class="detail-grid">
          <el-table :data="rows" border size="small" style="width: 100%">
            <el-table-column v-for="i in 10" :key="i" :label="String(i)" align="center">
              <template #default="{ row }">
                {{ row[i - 1] ?? '' }}
              </template>
            </el-table-column>
          </el-table>
          <div class="detail-summary">
            合计重量(kg)：<strong>{{ totalWeight }}</strong>
          </div>
        </div>
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
const rows = ref<any[]>([])
const totalWeight = ref<string>('0.00')

const formatMoney = (amount: number) => {
  return amount.toLocaleString('zh-CN', { minimumFractionDigits: 2 })
}

const goBack = () => {
  router.push('/inventory/out')
}

const loadDetail = async () => {
  try {
    const id = route.params.id as string
    const res = await inventoryAPI.getOutboundDetail(id)
    detail.value = res
    const rawDetails = (res as any)?.outboundDetails ?? []
    const arr: number[] = Array.isArray(rawDetails) ? rawDetails.map((x: any) => Number(x)) : []
    const tmp: any[] = []
    for (let i = 0; i < arr.length; i += 10) {
      tmp.push(arr.slice(i, i + 10))
    }
    rows.value = tmp
    const sum = arr.reduce((a, b) => a + Number(b || 0), 0)
    totalWeight.value = sum.toFixed(2)
  } catch (error) {
    ElMessage.error('加载详情失败')
  }
}

onMounted(() => {
  loadDetail()
})
</script>

<style scoped>
.outbound-detail {
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
.detail-summary {
  display: flex;
  justify-content: flex-end;
  margin-top: 8px;
}
.tax-upload-container {
  margin-top: 12px;
}
</style>
