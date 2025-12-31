<template>
  <el-select
    :model-value="modelValue"
    @update:model-value="updateModelValue"
    filterable
    remote
    :remote-method="handleSearch"
    :loading="state.loading"
    clearable
    :placeholder="placeholder || '请输入关键词搜索'"
    :allow-create="allowCreate"
    :filterable="true"
    default-first-option
    @clear="handleClear"
    style="width: 100%"
  >
    <el-option
      v-for="item in state.list"
      :key="item"
      :label="item"
      :value="item"
    />
    
    <!-- Sentinel for infinite scroll -->
    <el-option
      v-if="state.hasMore"
      value="__loading__"
      disabled
      style="height: 30px; display: flex; justify-content: center; align-items: center;"
    >
      <div v-load-more="loadNext" style="width: 100%; text-align: center; color: #999; font-size: 12px;">
        {{ state.loading ? '加载中...' : '加载更多' }}
      </div>
    </el-option>
  </el-select>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useOptionStore } from '@/stores'


const props = defineProps<{
  modelValue: string | number | undefined
  type: 'supplier' | 'productSpec' | 'composition' | 'customer'
  placeholder?: string
  allowCreate?: boolean
}>()

const emit = defineEmits(['update:modelValue'])
const store = useOptionStore()

const state = computed(() => {
  switch (props.type) {
    case 'supplier': return store.supplierState
    case 'productSpec': return store.productSpecState
    case 'composition': return store.compositionState
    case 'customer': return store.customerState
    default: return store.supplierState
  }
})

const currentQuery = ref('')
let searchTimer: any = null

const handleSearch = (query: string) => {
  if (!query) {
    return
  }
  currentQuery.value = query
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    store.loadData(props.type, query, true)
  }, 500)
}

const handleClear = () => {
  currentQuery.value = ''
  store.loadData(props.type, '', true)
}

const loadNext = () => {
  if (!state.value.loading && state.value.hasMore) {
    store.loadData(props.type, currentQuery.value, false)
  }
}

const updateModelValue = (val: string | number | undefined) => {
  emit('update:modelValue', val)
}

watch(() => props.modelValue, (val) => {
  if (!val) {
    handleClear()
  }
})

onMounted(() => {
  if (state.value.list.length === 0) {
    store.loadData(props.type, '', false)
  }
})
</script>

<style scoped>
:deep(.el-select-dropdown__item.is-disabled) {
  cursor: default;
  pointer-events: auto; /* Allow interaction with sentinel if needed */
}
</style>
