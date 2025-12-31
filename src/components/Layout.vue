<template>
  <div class="layout-container">
    <el-container>
      <el-aside width="200px" class="layout-aside">
        <div class="logo">
          <h2>色布管理系统</h2>
        </div>
        <el-menu
          :default-active="activeMenu"
          class="layout-menu"
          background-color="#304156"
          text-color="#bfcbd9"
          active-text-color="#409EFF"
          router
        >
          <template v-for="route in filteredRoutes" :key="route.path">
            <el-sub-menu v-if="route.children && route.children.length" :index="route.path">
              <template #title>
                <el-icon>
                  <component :is="route.meta?.icon" />
                </el-icon>
                <span>{{ route.meta?.title }}</span>
              </template>
              <el-menu-item
                v-for="child in route.children"
                :key="child.path"
                :index="`/${route.path}/${child.path}`"
              >
                <el-icon>
                  <component :is="child.meta?.icon" />
                </el-icon>
                <span>{{ child.meta?.title }}</span>
              </el-menu-item>
            </el-sub-menu>
            <el-menu-item v-else :index="`/${route.path}`">
              <el-icon>
                <component :is="route.meta?.icon" />
              </el-icon>
              <span>{{ route.meta?.title }}</span>
            </el-menu-item>
          </template>
        </el-menu>
      </el-aside>
      
      <el-container>
        <el-header class="layout-header">
          <div class="header-left">
            <el-breadcrumb separator="/">
              <el-breadcrumb-item
                v-for="item in breadcrumbs"
                :key="item.path"
                :to="item.path"
              >
                {{ item.title }}
              </el-breadcrumb-item>
            </el-breadcrumb>
          </div>
          <div class="header-right">
            <el-dropdown @command="handleCommand">
              <span class="user-info">
                <el-avatar :size="32" :src="userInfo?.avatar" v-if="userInfo?.avatar" />
                <el-avatar :size="32" v-else>
                  <el-icon><User /></el-icon>
                </el-avatar>
                <span class="username">{{ userInfo?.username || '用户' }}</span>
              </span>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="profile">个人设置</el-dropdown-item>
                  <el-dropdown-item divided command="logout">退出登录</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </el-header>
        
        <el-main class="layout-main">
          <router-view />
        </el-main>
      </el-container>
    </el-container>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { User } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores'
import { storeToRefs } from 'pinia'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const { userInfo } = storeToRefs(userStore)

const handleCommand = (command: string) => {
  if (command === 'logout') {
    userStore.logout()
    ElMessage.success('已退出登录')
  }
}

// Filter routes based on permissions
const filteredRoutes = computed(() => {
  const rootChildren = router.options.routes.find(r => r.path === '/')?.children || []
  
  return rootChildren
    .map((r: RouteRecordRaw) => {
      // Check permission for parent route
      if (r.meta?.permission && !userStore.hasPermission(r.meta.permission as string)) {
        return null;
      }
      
      // Filter children
      const children = Array.isArray(r.children) 
        ? r.children.filter(c => {
            // Filter hidden routes
            if (c.meta?.hidden === true) return false;
            // Check permission
            if (c.meta?.permission && !userStore.hasPermission(c.meta.permission as string)) {
                return false;
            }
            return true;
          }) 
        : undefined;

      // If it has children defined but all filtered out (and not originally empty), hide parent if parent is just a wrapper
      // But some parents are wrappers (like Inventory) that have children.
      // If a parent has permission check (Inventory has none in router def, but children do), we keep it if children exist.
      // Actually, if children array is present but length is 0, we filter it out in the next step.
      
      return { ...r, children };
    })
    .filter((r: any) => {
      if (!r) return false; // Filtered out parent
      // If it was a group node (has children) but now has no children, hide it.
      // Unless it's a leaf node itself (no children property originally or intended leaf).
      // In our router, leaf nodes like Dashboard don't have children array usually.
      if (r.children && r.children.length === 0) return false;
      return true;
    });
})

const activeMenu = computed(() => {
  const { meta, path } = route
  if (meta.activeMenu) {
    return meta.activeMenu as string
  }
  return path
})

const breadcrumbs = computed(() => {
  const matched = route.matched.filter(item => item.meta?.title)
  return matched.map(item => ({
    path: item.path,
    title: item.meta?.title
  }))
})
</script>

<style scoped>
.layout-container {
  height: 100vh;
}

.layout-aside {
  background-color: #304156;
}

.logo {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #2b2f3a;
  color: white;
}

.logo h2 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.layout-menu {
  border-right: none;
}

.layout-header {
  background-color: white;
  border-bottom: 1px solid #e6e6e6;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
}

.header-left {
  display: flex;
  align-items: center;
}

.header-right {
  display: flex;
  align-items: center;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  color: #606266;
}

.layout-main {
  background-color: #f5f5f5;
  padding: 20px;
  padding-bottom: 100px;
}
</style>
