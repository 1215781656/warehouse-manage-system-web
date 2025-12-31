<template>
  <div class="general-file-upload">
    <div v-if="!readonly" class="upload-area">
      <el-upload
        :multiple="true"
        :file-list="[]"
        :show-file-list="false"
        :accept="accepts"
        :http-request="handleUpload"
        :auto-upload="true"
      >
        <el-button type="primary">上传其他附件</el-button>
        <div class="el-upload__tip">支持 PDF/DOC/XLS 等，单文件 ≤ 20MB</div>
      </el-upload>
    </div>
    <el-progress v-if="uploading" :percentage="uploadPercent" style="max-width: 240px" />
    <div class="file-list">
      <div v-for="f in attachments" :key="f.id" class="file-item">
        <el-icon :size="18" class="icon">
          <Document />
        </el-icon>
        <span class="name">{{ displayName(f) }}</span>
        <div class="actions">
          <el-button link type="primary" @click="download(f.id)">下载</el-button>
          <el-button v-if="!readonly" link type="danger" @click="remove(f.id)">删除</el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Document } from '@element-plus/icons-vue'
import { financeAPI } from '@/api'
import type { OtherAttachment } from '@/types'

interface Props {
  modelValue: OtherAttachment[]
  recordType: 'receivable' | 'payable'
  recordId: string
  readonly?: boolean
  deferred?: boolean
}
const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'update:modelValue', v: OtherAttachment[]): void
}>()

const uploadRef = ref()
const attachments = ref<OtherAttachment[]>(props.modelValue || [])
const localFiles = ref<any[]>([])

watch(
  () => props.modelValue,
  (v) => {
    if (!props.deferred) {
      attachments.value = v || []
    }
  }
)

const uploading = ref(false)
const uploadPercent = ref(0)
const accepts =
  '.pdf,.doc,.docx,.xls,.xlsx,.txt,.zip,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

const displayName = (f: OtherAttachment) => {
  const name = f.originalName
  if (name && typeof name === 'string' && name.trim()) return name
  const last = (f.path || '').split('/').pop() || ''
  try {
    return decodeURIComponent(last)
  } catch {
    return last
  }
}

// Expose submit method for deferred upload
const submit = () => {
  if (uploadRef.value) {
    uploadRef.value.submit()
  }
}
defineExpose({ submit })

const handleChange = (file: any, fileList: any[]) => {
  if (props.deferred) {
    localFiles.value.push({
      id: file.uid,
      path: '',
      raw: file.raw
    })
    // Also update attachments list for display
    attachments.value = [...attachments.value, {
      id: String(file.uid),
      refId: '',
      path: '',
      originalName: file.name,
      uploadedAt: new Date()
    } as any]
  }
}

const handleUpload = async (option: any) => {
  const file: File = option.file
  const max = 20 * 1024 * 1024
  if (file.size > max) {
    ElMessage.error('单文件大小不能超过20MB')
    option.onError?.(new Error('file-too-large'))
    return
  }
  try {
    uploading.value = true
    uploadPercent.value = 10
    let resp
    if (props.recordType === 'receivable') {
      resp = await financeAPI.uploadOtherAttachmentsForReceivable(props.recordId, [file])
    } else {
      resp = await financeAPI.uploadOtherAttachmentsForPayable(props.recordId, [file])
    }
    const list: OtherAttachment[] = resp.data || resp
    
    if (!props.deferred) {
      attachments.value = list
      emit('update:modelValue', list)
    }

    ElMessage.success('上传成功')
    option.onSuccess?.(resp)
  } catch (e) {
    option.onError?.(e)
  } finally {
    uploading.value = false
    uploadPercent.value = 0
  }
}

const download = async (id: string) => {
  // Deferred mode cannot download local files easily unless we handle blob url
  if (props.deferred) {
     ElMessage.warning('请先保存后再下载')
     return
  }
  const item = attachments.value.find((x) => x.id === id)
  if (!item) return
  const fileBase = (import.meta as any)?.env?.VITE_FILE_BASE || 'http://localhost:3001'
  const fname = (item.path || '').split('/').pop() || ''
  const url = `${fileBase}/files/finance/other/${fname}`
  const a = document.createElement('a')
  a.href = url
  a.download = item.originalName || '附件'
  a.click()
}

const remove = async (id: string) => {
  if (props.deferred) {
     // Local remove
     const idx = localFiles.value.findIndex(f => String(f.id) === String(id))
     if (idx > -1) {
       localFiles.value.splice(idx, 1)
     }
     attachments.value = attachments.value.filter(x => String(x.id) !== String(id))
     if (uploadRef.value) {
       const f = uploadRef.value.uploadFiles?.find((f: any) => String(f.uid) === String(id))
       if (f) uploadRef.value.handleRemove(f)
     }
     return
  }

  try {
    await financeAPI.deleteAttachment('other', id)
    attachments.value = attachments.value.filter((x) => x.id !== id)
    emit('update:modelValue', attachments.value)
    ElMessage.success('删除成功')
  } catch {
    ElMessage.error('删除失败')
  }
}
</script>

<style scoped>
.general-file-upload {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.upload-area {
  display: flex;
  align-items: center;
  gap: 12px;
}
.file-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.file-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border: 1px solid #ebeef5;
  border-radius: 6px;
  background: #f8fafc;
}
.name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.icon {
  color: #606266;
}
.actions {
  display: flex;
  align-items: center;
  gap: 8px;
}
</style>
