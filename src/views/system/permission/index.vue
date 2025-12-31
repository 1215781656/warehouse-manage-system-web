<template>
  <div class="permission-manage">
    <div class="left-panel">
      <div class="panel-header">用户列表</div>
      <el-input v-model="searchKeyword" placeholder="搜索用户" clearable class="search-input" />
      <div class="user-list" v-loading="loadingUsers">
        <div
          v-for="user in filteredUsers"
          :key="user.id"
          class="user-item"
          :class="{ active: currentUserId === user.id }"
          @click="handleSelectUser(user)"
        >
          {{ user.username }}
          <el-tag size="small" v-if="user.role">{{ getRoleName(user.role) }}</el-tag>
        </div>
      </div>
    </div>
    <div class="right-panel">
      <div class="panel-header">
        权限配置
        <el-button type="primary" size="small" :disabled="!currentUserId" @click="handleSave" style="float: right">
          保存配置
        </el-button>
      </div>
      <div class="permission-tree" v-if="currentUserId" v-loading="loadingPermissions">
        <el-tree
          ref="treeRef"
          :data="permissionTree"
          show-checkbox
          node-key="id"
          default-expand-all
          :props="{ label: 'name' }"
        >
          <template #default="{ node, data }">
            <span class="custom-tree-node">
              <span>{{ node.label }}</span>
              <el-tag size="small" :type="getTypeTag(data.type)" style="margin-left: 8px">
                {{ getTypeName(data.type) }}
              </el-tag>
            </span>
          </template>
        </el-tree>
      </div>
      <div class="empty-tip" v-else>请选择左侧用户进行权限配置</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue';
import { systemAPI } from '@/api';
import { ElMessage, ElMessageBox } from 'element-plus';

const users = ref([]);
const permissions = ref([]);
const searchKeyword = ref('');
const currentUserId = ref('');
const treeRef = ref(null);
const loadingUsers = ref(false);
const loadingPermissions = ref(false);

// Static role list map
const roleMap = {
  'admin': '管理员',
  'employee': '员工'
};

const getRoleName = (role) => roleMap[role] || role;

const filteredUsers = computed(() => {
  if (!searchKeyword.value) return users.value;
  return users.value.filter(u => u.username.includes(searchKeyword.value));
});

const permissionTree = computed(() => {
  const list = JSON.parse(JSON.stringify(permissions.value));
  const map = {};
  const roots = [];
  
  // Helper to check if a node is system management
  const isSystemNode = (item) => {
    return item.code === 'system:menu' || item.code === 'system:view';
  };

  list.forEach(item => {
    map[item.id] = item;
    item.children = [];
    
    // Disable system management nodes
    if (isSystemNode(item)) {
      item.disabled = true;
    }
  });
  list.forEach(item => {
    if (item.parentId && map[item.parentId]) {
      map[item.parentId].children.push(item);
    } else {
      roots.push(item);
    }
  });
  return roots;
});

const loadData = async () => {
  loadingUsers.value = true;
  try {
    const [userRes, permRes] = await Promise.all([
      systemAPI.getUserList(),
      systemAPI.getPermissionList()
    ]);
    users.value = userRes;
    permissions.value = permRes;
  } finally {
    loadingUsers.value = false;
  }
};

const handleSelectUser = async (user) => {
  if (loadingPermissions.value) return; // Prevent multiple clicks while loading
  currentUserId.value = user.id;
  loadingPermissions.value = true;
  
  // Try to use already loaded permissions if user list has them detailed
  const doSet = (userPerms) => {
     // Safety check: ensure we are still setting permissions for the currently selected user
     if (currentUserId.value !== user.id) return;

     // Enforce system permission rule based on role
     const role = user.role;
     const systemNodes = permissions.value.filter(p => p.code === 'system:menu' || p.code === 'system:view');
     const systemIds = systemNodes.map(p => p.id);
     
     // Remove existing system perms from the list first to avoid duplicates or stale state
     let finalPerms = userPerms.filter(p => !systemIds.includes(p.id));
     
     if (role === 'admin') {
         // Admin MUST have system permissions
         finalPerms = [...finalPerms, ...systemNodes];
     } else {
         // Employee MUST NOT have system permissions (already filtered out)
     }
     
     nextTick(() => {
        setCheckedKeys(finalPerms);
        loadingPermissions.value = false;
     });
  };

  if (user.permissions) {
     doSet(user.permissions);
  } else {
     try {
        const res = await systemAPI.getUserDetail(user.id);
        // Double check if user is still selected after async call
        if (currentUserId.value !== user.id) return;
        
        // Update local user permissions to keep sync
        user.permissions = res.permissions;
        doSet(res.permissions);
     } catch (e) {
        loadingPermissions.value = false;
     }
  }
};

const setCheckedKeys = (userPermissions) => {
  if (!treeRef.value) return;
  if (!userPermissions || userPermissions.length === 0) {
      treeRef.value.setCheckedKeys([], false);
      return;
  }
  
  // CRITICAL FIX: Only set leaf nodes as checked.
  const leafIds = userPermissions
      .filter(p => !permissions.value.some(child => child.parentId === p.id))
      .map(p => p.id);

  treeRef.value.setCheckedKeys(leafIds, false);
};

const handleSave = async () => {
  if (!currentUserId.value) return;
  
  const user = users.value.find(u => u.id === currentUserId.value);
  if (!user) {
      ElMessage.error('找不到当前用户');
      return;
  }

  try {
    await ElMessageBox.confirm(
      `确定要修改用户 "${user.username}" 的权限吗？此操作将立即生效。`,
      '权限修改确认',
      {
        confirmButtonText: '确定修改',
        cancelButtonText: '取消',
        type: 'warning',
      }
    );

    const checkedKeys = treeRef.value.getCheckedKeys();
    const halfCheckedKeys = treeRef.value.getHalfCheckedKeys();
    let allKeys = [...checkedKeys, ...halfCheckedKeys];
    
    // Safety Net: Ensure Role Isolation on Frontend Send
    const systemNodes = permissions.value.filter(p => p.code === 'system:menu' || p.code === 'system:view');
    const systemIds = systemNodes.map(p => p.id);
    
    if (user.role !== 'admin') {
        // Filter out system permissions for non-admins
        allKeys = allKeys.filter(id => !systemIds.includes(id));
    } else {
        // Ensure system permissions are INCLUDED for admins (even if UI disabled them/unchecked them somehow)
        // But if they are disabled and checked in UI, they should be in checkedKeys.
        // If they are disabled and UNCHECKED (impossible if logic is correct), we might want to force add them?
        // Let's trust the tree state but ensure we don't accidentally remove them if they were supposed to be there.
        // Actually, if the admin unchecks everything, they lose system perms?
        // The tree disables them, so user CANNOT uncheck them if they are checked.
        // But if they were not checked initially, user cannot check them.
        // Admin SHOULD have them.
        const missingSystemIds = systemIds.filter(id => !allKeys.includes(id));
        if (missingSystemIds.length > 0) {
            allKeys.push(...missingSystemIds);
        }
    }

    await systemAPI.assignPermissions(currentUserId.value, allKeys);
    ElMessage.success('权限保存成功');
    
    // Update local user data so we don't need to re-fetch detail immediately
    if (user) {
        const detail = await systemAPI.getUserDetail(currentUserId.value);
        user.permissions = detail.permissions;
        // Re-set keys to reflect exactly what was saved/returned (sanitized)
        // Ensure we are still on the same user
        if (currentUserId.value === user.id) {
            setCheckedKeys(user.permissions);
        }
    }
  } catch (error) {
    if (error !== 'cancel') {
        console.error(error);
    }
  }
};

const getTypeTag = (type) => {
  const map = { system: 'danger', menu: 'primary', button: 'info' };
  return map[type] || '';
};

const getTypeName = (type) => {
  const map = { system: '系统', menu: '菜单', button: '按钮' };
  return map[type] || type;
};

onMounted(loadData);
</script>

<style scoped>
.permission-manage {
  display: flex;
  height: calc(100vh - 120px);
  gap: 20px;
  padding: 20px;
}
.left-panel {
  width: 300px;
  background: #fff;
  border-radius: 4px;
  display: flex;
  flex-direction: column;
  border: 1px solid #e4e7ed;
}
.right-panel {
  flex: 1;
  background: #fff;
  border-radius: 4px;
  display: flex;
  flex-direction: column;
  border: 1px solid #e4e7ed;
}
.panel-header {
  padding: 15px;
  font-weight: bold;
  border-bottom: 1px solid #ebeef5;
  background: #f5f7fa;
}
.search-input {
  margin: 10px;
  width: calc(100% - 20px);
}
.user-list {
  flex: 1;
  overflow-y: auto;
}
.user-item {
  padding: 10px 15px;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.user-item:hover {
  background: #f5f7fa;
}
.user-item.active {
  background: #ecf5ff;
  color: #409eff;
}
.permission-tree {
  padding: 20px;
  flex: 1;
  overflow-y: auto;
}
.empty-tip {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  color: #909399;
}
</style>
