<template>
  <div :class="['responsive-actions', props.fixed ? 'fixed-bar' : '']" ref="container">
    <div class="actions-visible">
      <el-button
        v-for="(item, idx) in visibleItems"
        :key="idx"
        type="primary"
        link
        :style="item.danger ? 'color:#ff4d4f' : ''"
        :disabled="item.disabled"
        :loading="item.loading"
        @click="item.onClick()"
      >
        {{ item.label }}
      </el-button>
      <el-dropdown v-if="hiddenItems.length">
        <el-button type="primary" link>
          更多
          <el-icon><ArrowDown /></el-icon>
        </el-button>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item
              v-for="(item, idx) in hiddenItems"
              :key="idx"
            >
              <span
                :style="item.danger ? 'color:#ff4d4f' : ''"
                @click="item.onClick()"
              >
                {{ item.label }}
              </span>
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
    <div class="actions-measure" ref="measure">
      <el-button
        v-for="(item, idx) in items"
        :key="idx"
        :type="item.type || props.buttonType || 'default'"
      >
        {{ item.label }}
      </el-button>
      <el-button type="primary" link ref="moreBtn">更多</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, onMounted, onBeforeUnmount, computed } from 'vue'
import { ArrowDown } from '@element-plus/icons-vue'

type ActionItem = {
  label: string
  onClick: () => void
  danger?: boolean
  type?: string
  disabled?: boolean
  loading?: boolean
}

const props = defineProps<{ items: ActionItem[]; fixed?: boolean; buttonType?: string }>()

const container = ref<HTMLElement | null>(null)
const measure = ref<HTMLElement | null>(null)
const moreBtn = ref<any>(null)
const widths = ref<number[]>([])
const moreWidth = ref<number>(0)
const visibleCount = ref<number>(props.items.length)

const throttle = (fn: Function, wait: number) => {
  let t = 0
  return (...args: any[]) => {
    const now = Date.now()
    if (now - t > wait) {
      t = now
      fn(...args)
    }
  }
}

const compute = async () => {
  await nextTick()
  const btns = measure.value?.querySelectorAll('.el-button') || []
  widths.value = Array.from(btns)
    .slice(0, props.items.length)
    .map(el => (el as HTMLElement).offsetWidth)
  moreWidth.value = (moreBtn.value?.$el as HTMLElement)?.offsetWidth || 0
  const gap = 8
  const total = container.value?.clientWidth || 0
  let used = 0
  let count = 0
  for (let i = 0; i < widths.value.length; i++) {
    const w = widths.value[i]
    const nextUsed = count === 0 ? w : used + gap + w
    const needMore = i < widths.value.length - 1
    const reserve = needMore ? gap + moreWidth.value : 0
    if (nextUsed + reserve <= total) {
      used = nextUsed
      count++
    } else {
      break
    }
  }
  visibleCount.value = count
}

const onResize = throttle(() => compute(), 120)

onMounted(() => {
  compute()
  window.addEventListener('resize', onResize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', onResize)
})

watch(() => props.items, () => compute(), { deep: true })

const visibleItems = computed(() => props.items.slice(0, visibleCount.value))
const hiddenItems = computed(() => props.items.slice(visibleCount.value))
</script>

<style scoped>
.responsive-actions {
  display: flex;
  align-items: center;
  width: 100%;
}
.actions-visible {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  flex-wrap: nowrap;
}
.actions-measure {
  position: absolute;
  visibility: hidden;
  pointer-events: none;
  height: 0;
  overflow: hidden;
}
@media (max-width: 768px) {
  .actions-visible {
    gap: 12px;
  }
}
  .responsive-actions :deep(.el-button) {
  --el-button-padding-horizontal: 0;
  --el-button-padding-vertical: 0;
  padding: 0;
  transition: opacity .2s ease, transform .2s ease;
}
.fixed-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  background: var(--el-fill-color-blank);
  border-top: 1px solid var(--el-border-color);
  padding: 8px 16px;
  z-index: 1000;
}
</style>
