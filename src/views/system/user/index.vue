<template>
  <div class="user-manage card">
    <div class="operation-bar" style="margin-bottom: 20px;">
      <el-button type="primary" @click="handleAdd">新增用户</el-button>
    </div>
    <el-table :data="tableData" style="width: 100%" v-loading="loading" border>
      <el-table-column prop="username" label="用户名" />
      <el-table-column label="角色">
        <template #default="{ row }">
          <el-tag size="small" v-if="row.role">
            {{ getRoleName(row.role) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="状态">
        <template #default="{ row }">
          <el-tag :type="row.isActive ? 'success' : 'danger'">{{ row.isActive ? '启用' : '禁用' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="200">
        <template #default="{ row }">
          <el-button type="primary" link @click="handleEdit(row)">编辑</el-button>
          <el-button type="danger" link @click="handleDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog :title="dialogTitle" v-model="dialogVisible" width="500px">
      <el-form :model="form" label-width="80px">
        <el-form-item label="用户名">
          <el-input v-model="form.username" :disabled="!!form.id && form.id !== ''" />
        </el-form-item>
        <el-form-item label="密码" v-if="!form.id">
          <el-input v-model="form.password" type="password" />
        </el-form-item>
         <el-form-item label="新密码" v-if="form.id">
          <el-input v-model="form.password" type="password" placeholder="留空不修改" />
        </el-form-item>
        <el-form-item label="角色" required>
          <el-select v-model="form.role" placeholder="请选择角色" style="width: 100%">
            <el-option
              v-for="item in roleList"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-switch v-model="form.isActive" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { systemAPI } from '@/api';
import { ElMessage, ElMessageBox } from 'element-plus';

const tableData = ref([]);
const loading = ref(false);
const dialogVisible = ref(false);
const dialogTitle = ref('新增用户');
const form = ref({
  id: '',
  username: '',
  password: '',
  isActive: true,
  role: 'employee', 
});

// Static role list as per requirement
const roleList = [
  { label: '管理员', value: 'admin' },
  { label: '员工', value: 'employee' }
];

const getRoleName = (roleVal) => {
    const r = roleList.find(i => i.value === roleVal);
    return r ? r.label : roleVal;
}

const loadData = async () => {
  loading.value = true;
  try {
    const users = await systemAPI.getUserList();
    tableData.value = users;
  } finally {
    loading.value = false;
  }
};

const handleAdd = () => {
  dialogTitle.value = '新增用户';
  form.value = { id: '', username: '', password: '', isActive: true, role: 'employee' }; 
  dialogVisible.value = true;
};

const handleEdit = (row: any) => {
  dialogTitle.value = '编辑用户';
  // Backend now returns 'role' field directly
  form.value = { 
      ...row, 
      password: '',
      role: row.role || 'employee'
  }; 
  dialogVisible.value = true;
};

const handleDelete = (row: any) => {
  ElMessageBox.confirm('确认删除该用户吗？', '提示', {
    type: 'warning'
  }).then(async () => {
    await systemAPI.deleteUser(row.id);
    ElMessage.success('删除成功');
    loadData();
  });
};

const handleSubmit = async () => {
  try {
    const data = { ...form.value };
    if (!data.password) delete data.password;
    
    // Ensure role is sent
    if (!data.role) data.role = 'employee';

    if (form.value.id) {
      await systemAPI.updateUser(form.value.id, data);
      ElMessage.success('更新成功');
    } else {
      await systemAPI.createUser(data);
      ElMessage.success('创建成功');
    }
    dialogVisible.value = false;
    loadData();
  } catch (error) {
    // Error handled by interceptor
  }
};

onMounted(loadData);
</script>

<style scoped>
.user-manage {
  padding: 20px;
  background: #fff;
}
</style>
