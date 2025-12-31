<template>
  <div class="report">
    <div class="page-header">
      <h1 class="page-title">报表中心</h1>
      <div class="header-actions">
        <el-date-picker
          v-model="dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          size="small"
          @change="handleDateChange"
        />
        <el-button type="primary" @click="exportReport">
          <el-icon><Download /></el-icon>
          导出报表
        </el-button>
      </div>
    </div>

    <!-- 报表类型选择 -->
    <el-card class="mb-4">
      <el-tabs v-model="activeTab" @tab-change="handleTabChange">
        <el-tab-pane label="库存报表" name="inventory">
          <template #label>
            <span>
              <el-icon><Box /></el-icon>
              库存报表
            </span>
          </template>
        </el-tab-pane>
        <el-tab-pane label="财务报表" name="finance">
          <template #label>
            <span>
              <el-icon><Money /></el-icon>
              财务报表
            </span>
          </template>
        </el-tab-pane>
        <el-tab-pane label="业务分析" name="business">
          <template #label>
            <span>
              <el-icon><TrendCharts /></el-icon>
              业务分析
            </span>
          </template>
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <!-- 库存报表 -->
    <div v-if="activeTab === 'inventory'">
      <el-row :gutter="16">
        <el-col :span="12">
          <el-card>
            <template #header>
              <span>库存结构分析</span>
            </template>
            <div ref="inventoryPieChart" style="height: 300px;"></div>
          </el-card>
        </el-col>
        <el-col :span="12">
          <el-card>
            <template #header>
              <span>库存趋势图</span>
            </template>
            <div ref="inventoryTrendChart" style="height: 300px;"></div>
          </el-card>
        </el-col>
      </el-row>

      <el-card class="mt-4">
        <template #header>
          <span>库存周转率分析</span>
        </template>
        <el-table :data="inventoryTurnoverData" style="width: 100%">
          <el-table-column prop="productSpec" label="品名规格" min-width="150" />
          <el-table-column prop="colorNo" label="色号" width="120" />
          <el-table-column prop="currentStock" label="当前库存" width="100" />
          <el-table-column prop="monthlySales" label="月均销量" width="100" />
          <el-table-column prop="turnoverRate" label="周转率" width="100">
            <template #default="{ row }">
              <el-progress 
                :percentage="row.turnoverRate" 
                :color="getTurnoverColor(row.turnoverRate)"
              />
            </template>
          </el-table-column>
          <el-table-column prop="turnoverDays" label="周转天数" width="100" />
          <el-table-column label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="getTurnoverStatus(row.turnoverRate).type" size="small">
                {{ getTurnoverStatus(row.turnoverRate).text }}
              </el-tag>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
    </div>

    <!-- 财务报表 -->
    <div v-if="activeTab === 'finance'">
      <el-row :gutter="16">
        <el-col :span="24">
          <el-card>
            <template #header>
              <span>收支趋势</span>
            </template>
            <div ref="financeTrendChart" style="height: 300px;"></div>
          </el-card>
        </el-col>
      </el-row>

      <el-card class="mt-4">
        <template #header>
          <span>财务汇总表</span>
        </template>
        <el-table :data="financeSummaryData" style="width: 100%">
          <el-table-column prop="month" label="月份" width="120" />
          <el-table-column prop="receivable" label="应收金额" width="120">
            <template #default="{ row }">
              ¥{{ formatMoney(row.receivable) }}
            </template>
          </el-table-column>
          <el-table-column prop="received" label="已收金额" width="120">
            <template #default="{ row }">
              ¥{{ formatMoney(row.received) }}
            </template>
          </el-table-column>
          <el-table-column prop="taxInvoice" label="税票金额" width="120">
            <template #default="{ row }">
              ¥{{ formatMoney(row.taxInvoice) }}
            </template>
          </el-table-column>
          <el-table-column prop="payable" label="应付金额" width="120">
            <template #default="{ row }">
              ¥{{ formatMoney(row.payable) }}
            </template>
          </el-table-column>
          <el-table-column prop="paid" label="已付金额" width="120">
            <template #default="{ row }">
              ¥{{ formatMoney(row.paid) }}
            </template>
          </el-table-column>
          <el-table-column prop="profit" label="利润" width="120">
            <template #default="{ row }">
              <span :class="{ 'text-success': row.profit > 0, 'text-danger': row.profit < 0 }">
                ¥{{ formatMoney(row.profit) }}
              </span>
            </template>
          </el-table-column>
          <el-table-column prop="profitMargin" label="利润率" width="100">
            <template #default="{ row }">
              <span :class="{ 'text-success': row.profitMargin > 0, 'text-danger': row.profitMargin < 0 }">
                {{ row.profitMargin }}%
              </span>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
    </div>

    <!-- 业务分析 -->
    <div v-if="activeTab === 'business'">
      <el-row :gutter="16">
        <el-col :span="12">
          <el-card>
            <template #header>
              <span>出入库趋势</span>
            </template>
            <div ref="businessTrendChart" style="height: 300px;"></div>
          </el-card>
        </el-col>
        <el-col :span="12">
          <el-card>
            <template #header>
              <span>客户交易排行</span>
            </template>
            <div ref="customerRankChart" style="height: 300px;"></div>
          </el-card>
        </el-col>
      </el-row>

      <el-card class="mt-4">
        <template #header>
          <span>供应商交易排行</span>
        </template>
        <el-table :data="supplierRankData" style="width: 100%">
          <el-table-column type="index" label="排名" width="80" />
          <el-table-column prop="supplier" label="供应商" min-width="150" />
          <el-table-column prop="transactionCount" label="交易次数" width="120" />
          <el-table-column prop="totalAmount" label="交易金额" width="120">
            <template #default="{ row }">
              ¥{{ formatMoney(row.totalAmount) }}
            </template>
          </el-table-column>
          <el-table-column prop="avgAmount" label="平均金额" width="120">
            <template #default="{ row }">
              ¥{{ formatMoney(row.avgAmount) }}
            </template>
          </el-table-column>
          <el-table-column prop="lastTransaction" label="最后交易" width="120" />
          <el-table-column label="合作状态" width="100">
            <template #default="{ row }">
              <el-tag :type="row.status === 'active' ? 'success' : 'info'" size="small">
                {{ row.status === 'active' ? '活跃' : '一般' }}
              </el-tag>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, nextTick } from 'vue'
import * as echarts from 'echarts'
import { Download, Box, Money, TrendCharts } from '@element-plus/icons-vue'

const activeTab = ref('inventory')
const dateRange = ref('')

// 库存周转率数据
const inventoryTurnoverData = ref([
  {
    productSpec: '全棉斜纹布',
    colorNo: 'CB2024120001',
    currentStock: 45,
    monthlySales: 15,
    turnoverRate: 75,
    turnoverDays: 90
  },
  {
    productSpec: '涤棉府绸',
    colorNo: 'CB2024120002',
    currentStock: 18,
    monthlySales: 8,
    turnoverRate: 89,
    turnoverDays: 68
  },
  {
    productSpec: '人棉印花布',
    colorNo: 'CB2024120003',
    currentStock: 5,
    monthlySales: 3,
    turnoverRate: 42,
    turnoverDays: 50
  }
])

// 财务汇总数据
const financeSummaryData = ref([
  {
    month: '2024-12',
    receivable: 156800,
    received: 89200,
    taxInvoice: 35600,
    payable: 89200,
    paid: 45600,
    profit: 43600,
    profitMargin: 27.8
  },
  {
    month: '2024-11',
    receivable: 142300,
    received: 98500,
    taxInvoice: 42300,
    payable: 76500,
    paid: 52300,
    profit: 46200,
    profitMargin: 32.5
  },
  {
    month: '2024-10',
    receivable: 128900,
    received: 87600,
    taxInvoice: 39800,
    payable: 68900,
    paid: 44500,
    profit: 43100,
    profitMargin: 33.4
  }
])

// 供应商排行数据
const supplierRankData = ref([
  {
    supplier: '江苏纺织厂',
    transactionCount: 25,
    totalAmount: 456800,
    avgAmount: 18272,
    lastTransaction: '2024-12-20',
    status: 'active'
  },
  {
    supplier: '浙江印染厂',
    transactionCount: 18,
    totalAmount: 324500,
    avgAmount: 18028,
    lastTransaction: '2024-12-19',
    status: 'active'
  },
  {
    supplier: '山东纺织公司',
    transactionCount: 12,
    totalAmount: 234600,
    avgAmount: 19550,
    lastTransaction: '2024-12-18',
    status: 'normal'
  }
])

// 图表实例
let inventoryPieChart: echarts.ECharts | null = null
let inventoryTrendChart: echarts.ECharts | null = null
let financeTrendChart: echarts.ECharts | null = null
let businessTrendChart: echarts.ECharts | null = null
let customerRankChart: echarts.ECharts | null = null

// 格式化金额
const formatMoney = (amount: number) => {
  return amount.toLocaleString('zh-CN', { minimumFractionDigits: 2 })
}

// 获取周转率颜色
const getTurnoverColor = (rate: number) => {
  if (rate >= 80) return '#52c41a'
  if (rate >= 60) return '#faad14'
  return '#ff4d4f'
}

// 获取周转状态
const getTurnoverStatus = (rate: number) => {
  if (rate >= 80) return { text: '优秀', type: 'success' }
  if (rate >= 60) return { text: '良好', type: 'warning' }
  return { text: '需改善', type: 'danger' }
}

// 初始化库存饼图
const initInventoryPieChart = () => {
  if (!inventoryPieChart) return
  
  const option = {
    title: {
      text: '库存结构分布',
      left: 'center'
    },
    tooltip: {
      trigger: 'item'
    },
    legend: {
      orient: 'vertical',
      left: 'left'
    },
    series: [
      {
        name: '库存占比',
        type: 'pie',
        radius: '50%',
        data: [
          { value: 35, name: '全棉类' },
          { value: 28, name: '涤棉类' },
          { value: 22, name: '人棉类' },
          { value: 15, name: '其他' }
        ],
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        }
      }
    ]
  }
  
  inventoryPieChart.setOption(option)
}

// 初始化库存趋势图
const initInventoryTrendChart = () => {
  if (!inventoryTrendChart) return
  
  const option = {
    title: {
      text: '库存趋势变化'
    },
    tooltip: {
      trigger: 'axis'
    },
    legend: {
      data: ['入库量', '出库量', '库存量']
    },
    xAxis: {
      type: 'category',
      data: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        name: '入库量',
        type: 'line',
        data: [120, 132, 101, 134, 90, 230, 210, 182, 191, 234, 290, 330]
      },
      {
        name: '出库量',
        type: 'line',
        data: [220, 182, 191, 234, 290, 330, 310, 123, 442, 321, 90, 149]
      },
      {
        name: '库存量',
        type: 'line',
        data: [150, 232, 201, 154, 190, 330, 410, 320, 220, 180, 160, 140]
      }
    ]
  }
  
  inventoryTrendChart.setOption(option)
}

// 已移除应收/应付账龄图

// 初始化财务趋势图
const initFinanceTrendChart = () => {
  if (!financeTrendChart) return
  
  const option = {
    title: {
      text: '收支趋势'
    },
    tooltip: {
      trigger: 'axis'
    },
    legend: {
      data: ['收入', '支出', '利润']
    },
    xAxis: {
      type: 'category',
      data: ['10月', '11月', '12月']
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        name: '收入',
        type: 'line',
        data: [87600, 98500, 89200],
        itemStyle: {
          color: '#52c41a'
        }
      },
      {
        name: '支出',
        type: 'line',
        data: [44500, 52300, 45600],
        itemStyle: {
          color: '#ff4d4f'
        }
      },
      {
        name: '利润',
        type: 'line',
        data: [43100, 46200, 43600],
        itemStyle: {
          color: '#1890ff'
        }
      }
    ]
  }
  
  financeTrendChart.setOption(option)
}

// 初始化业务趋势图
const initBusinessTrendChart = () => {
  if (!businessTrendChart) return
  
  const option = {
    title: {
      text: '出入库趋势'
    },
    tooltip: {
      trigger: 'axis'
    },
    legend: {
      data: ['入库金额', '出库金额']
    },
    xAxis: {
      type: 'category',
      data: ['第1周', '第2周', '第3周', '第4周']
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        name: '入库金额',
        type: 'bar',
        data: [45600, 52300, 48900, 61200],
        itemStyle: {
          color: '#1890ff'
        }
      },
      {
        name: '出库金额',
        type: 'bar',
        data: [38700, 45600, 42300, 53400],
        itemStyle: {
          color: '#52c41a'
        }
      }
    ]
  }
  
  businessTrendChart.setOption(option)
}

// 初始化客户排行图
const initCustomerRankChart = () => {
  if (!customerRankChart) return
  
  const option = {
    title: {
      text: '客户交易排行'
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    xAxis: {
      type: 'value'
    },
    yAxis: {
      type: 'category',
      data: ['上海服装厂', '杭州纺织公司', '苏州制衣厂', '南京服装厂', '无锡纺织厂']
    },
    series: [
      {
        name: '交易金额',
        type: 'bar',
        data: [234500, 189200, 156800, 123400, 98700],
        itemStyle: {
          color: '#1890ff'
        }
      }
    ]
  }
  
  customerRankChart.setOption(option)
}

// 标签切换
const handleTabChange = () => {
  nextTick(() => {
    initCharts()
  })
}

// 日期变化
const handleDateChange = () => {
  console.log('日期范围:', dateRange.value)
}

// 导出报表
const exportReport = () => {
  console.log('导出报表:', activeTab.value)
}

// 初始化图表
const initCharts = () => {
  if (activeTab.value === 'inventory') {
    initInventoryPieChart()
    initInventoryTrendChart()
  } else if (activeTab.value === 'finance') {
    initFinanceTrendChart()
  } else if (activeTab.value === 'business') {
    initBusinessTrendChart()
    initCustomerRankChart()
  }
}

onMounted(() => {
  // 初始化图表
  nextTick(() => {
    // 初始化图表
    nextTick(() => {
      inventoryPieChart = echarts.init(document.querySelector('.inventory-pie-chart') as HTMLElement)
      inventoryTrendChart = echarts.init(document.querySelector('.inventory-trend-chart') as HTMLElement)
      financeTrendChart = echarts.init(document.querySelector('.finance-trend-chart') as HTMLElement)
      businessTrendChart = echarts.init(document.querySelector('.business-trend-chart') as HTMLElement)
      customerRankChart = echarts.init(document.querySelector('.customer-rank-chart') as HTMLElement)
      
      initCharts()
    })
    
    // 监听窗口大小变化
    window.addEventListener('resize', () => {
      inventoryPieChart?.resize()
      inventoryTrendChart?.resize()
      financeTrendChart?.resize()
      businessTrendChart?.resize()
      customerRankChart?.resize()
    })
  })
</script>

<style scoped>
.report {
  padding: 0;
}

.header-actions {
  display: flex;
  gap: 16px;
  align-items: center;
}

.text-success {
  color: #52c41a;
}

.text-danger {
  color: #ff4d4f;
}
</style>
