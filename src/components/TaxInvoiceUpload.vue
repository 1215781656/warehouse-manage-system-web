<template>
  <div class="tax-invoice-upload">
    <div v-if="!readonly" class="upload-area">
      <el-upload
        :multiple="true"
        :file-list="[]"
        :show-file-list="false"
        :accept="'image/jpeg,image/png'"
        :http-request="handleUpload"
        :on-exceed="onExceed"
        :on-error="onError"
        :on-success="onSuccess"
        :auto-upload="true"
        :limit="10"
      >
        <el-button type="primary">上传税票图片</el-button>
        <div class="el-upload__tip">支持 JPG/PNG，单文件 ≤ 10MB</div>
      </el-upload>
    </div>
    <el-progress v-if="uploading" :percentage="uploadPercent" style="max-width: 240px" />
    <div ref="previewRef" class="thumb-grid">
      <div
        v-for="(item, idx) in attachments"
        :key="item.id"
        class="thumb-item"
      >
        <img :src="resolveUrl(item)" :alt="item.id" @click="open(idx)" />
        <div v-if="!readonly" class="ops">
          <el-button link type="danger" @click="remove(item.id)">删除</el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed, onBeforeUnmount, nextTick } from 'vue'
import Viewer from 'viewerjs'
import 'viewerjs/dist/viewer.css'
import { ElMessage } from 'element-plus'
import { financeAPI } from '@/api'
import type { TaxInvoiceAttachment } from '@/types'

interface Props {
  modelValue: TaxInvoiceAttachment[]
  recordType: 'receivable' | 'payable' | 'inbound' | 'outbound'
  recordId: string
  readonly?: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'update:modelValue', v: TaxInvoiceAttachment[]): void
}>()

const attachments = ref<TaxInvoiceAttachment[]>(props.modelValue || [])
watch(
  () => props.modelValue,
  (v) => {
    attachments.value = v || []
    refreshViewer()
  }
)

const previewRef = ref<HTMLDivElement | null>(null)
let viewer: Viewer | null = null
const uploading = ref(false)
const uploadPercent = ref(0)

const resolveUrl = (item: any) => {
  const p = item.path || ''
  const s = String(p || '')
  if (s.startsWith('http')) return s
  const fileBase = (import.meta as any)?.env?.VITE_FILE_BASE || 'http://localhost:3001'
  const fname = s.split('/').pop() || ''
  return `${fileBase}/files/finance/tax/${fname}`
}

const refreshViewer = async () => {
  await nextTick()
  if (!previewRef.value) return
  if (viewer) {
    viewer.destroy()
    viewer = null
  }
  viewer = new Viewer(previewRef.value, { toolbar: true, navbar: false, tooltip: false })
}

onMounted(() => {
  refreshViewer()
})
onBeforeUnmount(() => {
  if (viewer) {
    viewer.destroy()
    viewer = null
  }
})

const handleUpload = async (option: any) => {
  const file: File = option.file
  if (!file) return
  const max = 10 * 1024 * 1024
  if (file.size > max) {
    ElMessage.error('单文件大小不能超过10MB')
    option.onError?.(new Error('file-too-large'))
    return
  }
  try {
    uploading.value = true
    uploadPercent.value = 10
    let resp
    if (props.recordType === 'receivable') {
      resp = await financeAPI.uploadTaxInvoiceAttachmentsForReceivable(props.recordId, [file])
    } else if (props.recordType === 'payable') {
      resp = await financeAPI.uploadTaxInvoiceAttachmentsForPayable(props.recordId, [file])
    } else if (props.recordType === 'inbound') {
      resp = await financeAPI.uploadTaxInvoiceAttachmentsForInbound(props.recordId, [file])
    } else {
      resp = await financeAPI.uploadTaxInvoiceAttachmentsForOutbound(props.recordId, [file])
    }
    const list: TaxInvoiceAttachment[] = resp.data || resp
    attachments.value = list
    emit('update:modelValue', list)
    ElMessage.success('上传成功')
    refreshViewer()
    option.onSuccess?.(resp)
  } catch (e) {
    option.onError?.(e)
  } finally {
    uploading.value = false
    uploadPercent.value = 0
  }
}

const onExceed = () => {
  ElMessage.warning('单次最多选择10张图片')
}
const onError = () => {
  ElMessage.error('上传失败')
}
const onSuccess = () => {}

const open = (index: number) => {
  if (viewer) viewer.view(index)
}
const remove = async (id: string) => {
  try {
    await financeAPI.deleteAttachment('tax', id)
    attachments.value = attachments.value.filter((x) => x.id !== id)
    emit('update:modelValue', attachments.value)
    ElMessage.success('删除成功')
    refreshViewer()
  } catch {
    ElMessage.error('删除失败')
  }
}
</script>

<style scoped>
.tax-invoice-upload {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.upload-area {
  display: flex;
  align-items: center;
  gap: 12px;
}
.thumb-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 12px;
}
.thumb-item {
  position: relative;
  width: 100%;
  aspect-ratio: 1 / 1;
  overflow: hidden;
  border-radius: 6px;
  background: #f5f7fa;
  border: 1px solid #ebeef5;
}
.thumb-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.ops {
  position: absolute;
  right: 6px;
  bottom: 6px;
  background: rgba(255,255,255,0.8);
  border-radius: 4px;
  padding: 2px 6px;
}
</style>
