<template>
  <div class="fixed-submit-bar" :style="{ height: `${height}px` }">
    <div class="fixed-submit-inner">
      <el-button
        type="primary"
        :loading="loading"
        :disabled="disabled"
        size="default"
        @click="$emit('click')"
      >
        提交
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  loading?: boolean
  disabled?: boolean
  height?: number
}>()
</script>

<style scoped>
.fixed-submit-bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--el-bg-color);
  box-shadow: 0 -6px 14px rgba(0,0,0,0.06);
  display: flex;
  align-items: center;
  z-index: 1000;
}
.fixed-submit-inner {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 10px 16px;
  display: flex;
  justify-content: flex-end;
}
</style>
