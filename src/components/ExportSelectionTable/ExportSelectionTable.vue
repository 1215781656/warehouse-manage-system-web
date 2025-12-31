<template>
  <div class="export-selection-table">
    <div class="toolbar">
      <el-checkbox
        :model-value="selectionStore.allSelected.value"
        :disabled="selectionType !== 'all'"
        @change="onMasterChange"
      >全选</el-checkbox>
      <span>已选：{{ selectedCount() }}</span>
    </div>
    <el-table
      ref="tableRef"
      :data="dataSource"
      style="width: 100%"
      @selection-change="onTableSelectionChange"
    >
      <el-table-column
        type="selection"
        width="50"
        :selectable="rowSelectable"
      />
      <slot name="columns"></slot>
    </el-table>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, defineExpose, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { useSelectionStore } from './useSelectionStore'

const props = defineProps<{
  dataSource: any[]
  selectionType?: 'all' | 'multiple'
  onSelectionChange?: (ids: Array<string | number>) => void
  storageKey?: string
  rowKey?: string
  fetchAllIds?: (queryParams: any) => Promise<Array<string | number>>
  fetchItemsByIds?: (ids: Array<string | number>) => Promise<any[]>
  queryParams?: any
}>()

const tableRef = ref()
const suppressSelectionChange = ref(false)
const selectionStore = useSelectionStore({
  storageKey: props.storageKey,
  rowKey: props.rowKey,
  fetchAllIds: props.fetchAllIds
})

const rowSelectable = (_row: any, _index: number) => !selectionStore.allSelected.value

const syncCurrentPageSelections = async () => {
  if (!tableRef.value) return
  suppressSelectionChange.value = true
  const set = selectionStore.selectedSet.value
  const key = props.rowKey || 'id'
  for (const r of props.dataSource || []) {
    const id = (r as any)[key]
    const selected = set.has(id)
    tableRef.value.toggleRowSelection(r, selected)
  }
  await nextTick()
  suppressSelectionChange.value = false
}

const onTableSelectionChange = (selection: any[]) => {
  if (suppressSelectionChange.value) return
  if (selectionStore.allSelected.value) return
  const key = props.rowKey || 'id'
  const ids = selection.map(r => r[key])
  const pageIds = (props.dataSource || []).map(r => r[key])
  for (const id of pageIds) {
    if (ids.includes(id)) selectionStore.selectId(id)
    else selectionStore.deselectId(id)
  }
  props.onSelectionChange && props.onSelectionChange(selectionStore.getSelectedIds())
}

const handleToggleAll = async () => {
  const enable = !selectionStore.allSelected.value
  try {
    await selectionStore.toggleAll(enable, props.queryParams)
    props.onSelectionChange && props.onSelectionChange(selectionStore.getSelectedIds())
  } catch {
    ElMessage.error('全选失败')
  }
}

const onMasterChange = async (val: boolean) => {
  try {
    if (val) {
      await selectionStore.toggleAll(true, props.queryParams)
    } else {
      handleClear()
    }
    syncCurrentPageSelections()
    props.onSelectionChange && props.onSelectionChange(selectionStore.getSelectedIds())
  } catch {
    ElMessage.error('全选失败')
  }
}

const handleClear = () => {
  selectionStore.clear()
  if (tableRef.value) tableRef.value.clearSelection()
  props.onSelectionChange && props.onSelectionChange([])
}

const getSelectedItems = async (): Promise<any[]> => {
  const ids = selectionStore.getSelectedIds()
  if (selectionStore.allSelected.value && props.fetchItemsByIds) {
    const chunkSize = 500
    const result: any[] = []
    for (let i = 0; i < ids.length; i += chunkSize) {
      const part = ids.slice(i, i + chunkSize)
      const res = await props.fetchItemsByIds(part)
      if (Array.isArray(res)) result.push(...res)
    }
    return result
  }
  const key = props.rowKey || 'id'
  const map = new Map<any, any>()
  for (const r of props.dataSource || []) {
    map.set(r[key], r)
  }
  const list: any[] = []
  for (const id of ids) {
    if (map.has(id)) list.push(map.get(id))
  }
  return list
}

watch(() => props.dataSource, async () => {
  suppressSelectionChange.value = true
  await nextTick()
  await syncCurrentPageSelections()
})

const selectedCount = () => selectionStore.getSelectedIds().length

onMounted(() => {
  selectionStore.restore()
  syncCurrentPageSelections()
})

defineExpose({
  getSelectedItems,
  clearSelection: handleClear,
  toggleAllSelection: handleToggleAll,
  isAllSelected: () => selectionStore.allSelected.value
})
</script>

<style scoped>
.toolbar {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-bottom: 8px;
  padding-left: 8px;
}
</style>
