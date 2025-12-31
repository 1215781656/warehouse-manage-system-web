<template>
  <div class="dashboard">
    <div class="page-header">
      <h1 class="page-title">仪表盘</h1>
      <el-date-picker
        v-model="dateRange"
        type="daterange"
        range-separator="至"
        start-placeholder="开始日期"
        end-placeholder="结束日期"
        size="small"
      />
    </div>

    <!-- 数据概览卡片 -->
    <el-row :gutter="16">
      <el-col :span="6">
        <div class="data-card">
          <div class="data-card-title">今日入库量</div>
          <div class="data-card-value">{{ todayStats.inbound }}</div>
          <div class="data-card-trend">
            <span :class="todayStats.inboundTrend > 0 ? 'trend-up' : 'trend-down'">
              {{ todayStats.inboundTrend > 0 ? '↑' : '↓' }} {{ Math.abs(todayStats.inboundTrend) }}%
            </span>
            较昨日
          </div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="data-card">
          <div class="data-card-title">今日出库量</div>
          <div class="data-card-value">{{ todayStats.outbound }}</div>
          <div class="data-card-trend">
            <span :class="todayStats.outboundTrend > 0 ? 'trend-up' : 'trend-down'">
              {{ todayStats.outboundTrend > 0 ? '↑' : '↓' }} {{ Math.abs(todayStats.outboundTrend) }}%
            </span>
            较昨日
          </div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="data-card">
          <div class="data-card-title">库存总量</div>
          <div class="data-card-value">{{ totalStats.totalStock }}</div>
          <div class="data-card-trend">
            <span class="trend-stable">●</span>
            个品种
          </div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="data-card">
          <div class="data-card-title">库存价值</div>
          <div class="data-card-value">¥{{ formatMoney(totalStats.totalValue) }}</div>
          <div class="data-card-trend">
            <span class="trend-stable">●</span>
            总计
          </div>
        </div>
      </el-col>
    </el-row>

    <!-- 财务概览 -->
    <el-row :gutter="16" class="mt-4">
      <el-col :span="12">
        <div class="data-card">
          <div class="data-card-title">应收总额</div>
          <div class="data-card-value">¥{{ formatMoney(financeStats.receivable) }}</div>
          <el-progress 
            :percentage="financeStats.receivablePercent" 
            :color="'#ff4d4f'"
            :show-text="false"
          />
          <div class="data-card-trend">
            未收占比 {{ financeStats.receivablePercent }}%
          </div>
        </div>
      </el-col>
      <el-col :span="12">
        <div class="data-card">
          <div class="data-card-title">应付总额</div>
          <div class="data-card-value">¥{{ formatMoney(financeStats.payable) }}</div>
          <el-progress 
            :percentage="financeStats.payablePercent" 
            :color="'#52c41a'"
            :show-text="false"
          />
          <div class="data-card-trend">
            未付占比 {{ financeStats.payablePercent }}%
          </div>
        </div>
      </el-col>
    </el-row>

    <!-- 库存预警 -->
    <div class="mt-4">
      <div class="page-header">
        <h3 class="page-title">库存预警</h3>
        <el-button type="primary" size="small" @click="viewAllWarnings">查看全部</el-button>
      </div>
      <el-table :data="warningData" style="width: 100%">
        <el-table-column prop="colorNo" label="色号" width="120" />
        <el-table-column prop="productSpec" label="品名规格" />
        <el-table-column prop="currentStock" label="当前库存" width="100" />
        <el-table-column prop="safetyStock" label="安全库存" width="100" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'danger' ? 'danger' : 'warning'" size="small">
              {{ row.status === 'danger' ? '严重不足' : '库存偏低' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120">
          <template #default="{ row }">
            <el-button type="text" @click="handleReplenish(row)">补货建议</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 快捷操作 -->
    <div class="mt-4">
      <div class="page-header">
        <h3 class="page-title">快捷操作</h3>
      </div>
      <el-row :gutter="16">
        <el-col :span="6">
          <el-button class="quick-btn" type="primary" @click="quickInbound">
            <el-icon><Plus /></el-icon>
            快速入库
          </el-button>
        </el-col>
        <el-col :span="6">
          <el-button class="quick-btn" type="success" @click="quickOutbound">
            <el-icon><Minus /></el-icon>
            快速出库
          </el-button>
        </el-col>
        <el-col :span="6">
          <el-button class="quick-btn" type="warning" @click="quickStockCheck">
            <el-icon><Search /></el-icon>
            库存盘点
          </el-button>
        </el-col>
        <el-col :span="6">
          <el-button class="quick-btn" type="info" @click="quickReport">
            <el-icon><Document /></el-icon>
            生成报表
          </el-button>
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { Plus, Minus, Search, Document } from '@element-plus/icons-vue'

const router = useRouter()
const dateRange = ref('')

// 今日统计数据
const todayStats = reactive({
  inbound: 156,
  outbound: 89,
  inboundTrend: 12.5,
  outboundTrend: -3.2
})

// 总计统计数据
const totalStats = reactive({
  totalStock: 1248,
  totalValue: 2847500
})

// 财务统计数据
const financeStats = reactive({
  receivable: 156800,
  payable: 89200,
  receivablePercent: 35.2,
  payablePercent: 28.7
})

// 库存预警数据
const warningData = ref([
  {
    colorNo: 'CB2024120001',
    productSpec: '全棉斜纹布',
    currentStock: 5,
    safetyStock: 20,
    status: 'danger'
  },
  {
    colorNo: 'CB2024120002',
    productSpec: '涤棉府绸',
    currentStock: 12,
    safetyStock: 25,
    status: 'warning'
  },
  {
    colorNo: 'CB2024120003',
    productSpec: '人棉印花布',
    currentStock: 8,
    safetyStock: 15,
    status: 'danger'
  }
])

// 格式化金额
const formatMoney = (amount: number) => {
  return amount.toLocaleString('zh-CN')
}

// 查看全部预警
const viewAllWarnings = () => {
  router.push('/inventory/stock')
}

// 处理补货建议
const handleReplenish = (row: any) => {
  console.log('补货建议:', row)
}

// 快捷操作
const quickInbound = () => {
  router.push('/inventory/in')
}

const quickOutbound = () => {
  router.push('/inventory/out')
}

const quickStockCheck = () => {
  router.push('/inventory/stock')
}

const quickReport = () => {
  router.push('/report')
}
</script>

<style scoped>
.dashboard {
  padding: 0;
}

.data-card-trend {
  margin-top: 8px;
  font-size: 12px;
  color: #909399;
}

.trend-up {
  color: #52c41a;
  font-weight: 600;
}

.trend-down {
  color: #ff4d4f;
  font-weight: 600;
}

.trend-stable {
  color: #909399;
}

.quick-btn {
  width: 100%;
  height: 80px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
}
</style>
