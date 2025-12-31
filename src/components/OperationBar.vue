<template>
  <div class="operation-bar">
    <div class="operation-inner">
      <slot name="button">
        <el-button
          type="primary"
          :loading="loading"
          :disabled="disabled"
          size="default"
          @click="$emit('submit')"
        >
          {{ label }}
        </el-button>
      </slot>
    </div>
  </div>
  <slot name="extra" />
</template>

<script setup lang="ts">
defineProps<{
  loading?: boolean
  disabled?: boolean
  label?: string
}>()
defineEmits<{ (e: 'submit'): void }>()
</script>

<style scoped>
.operation-bar {
  position: fixed;
  left: 200px;
  right: 0;
  bottom: 0;
  z-index: 20;
  background: var(--el-bg-color);
  box-shadow: 0 -6px 14px rgba(0,0,0,0.06);
  contain: layout paint;
}
.operation-inner {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 10px 16px;
  display: flex;
  justify-content: center;
  gap: 8px;
}
</style>
