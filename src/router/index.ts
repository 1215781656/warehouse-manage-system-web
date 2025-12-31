import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import Layout from '@/components/Layout.vue'
import { useUserStore } from '@/stores'
import { P } from '@/constants/permissions'
import { ElMessage } from 'element-plus'

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/login/index.vue')
  },
  {
    path: '/',
    component: Layout,
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/dashboard/index.vue'),
        meta: { title: '仪表盘', icon: 'Odometer' }
      },
      {
        path: 'inventory',
        name: 'Inventory',
        redirect: '/inventory/in',
        meta: { title: '库存管理', icon: 'Box' },
        children: [
          {
            path: 'in',
            name: 'InventoryIn',
            component: () => import('@/views/inbound-management/index.vue'),
            meta: { title: '入库管理', icon: 'Upload', permission: P.Inventory.In.View }
          },
          {
            path: 'in/add',
            name: 'InventoryInAdd',
            component: () => import('@/views/inbound-management/components/Add.vue'),
            meta: { title: '新增入库', icon: 'Plus', hidden: true, activeMenu: '/inventory/in', permission: P.Inventory.In.Add },
            alias: '/inbound/add'
          },
          {
            path: 'in/edit/:id',
            name: 'InventoryInEdit',
            component: () => import('@/views/inbound-management/components/Edit.vue'),
            meta: { title: '编辑入库', icon: 'Edit', hidden: true, activeMenu: '/inventory/in', permission: P.Inventory.In.Edit },
            alias: '/inbound/edit/:id'
          },
          {
            path: 'in/detail/:id',
            name: 'InventoryInDetail',
            component: () => import('@/views/inbound-management/components/Detail.vue'),
            meta: { title: '入库详情', icon: 'Document', hidden: true, activeMenu: '/inventory/in', permission: P.Inventory.In.View },
            alias: '/inbound/detail/:id'
          },
          {
            path: 'out',
            name: 'InventoryOut',
            component: () => import('@/views/outbound-management/index.vue'),
            meta: { title: '出库管理', icon: 'Download', permission: P.Inventory.Out.View }
          },
          {
            path: 'out/add',
            name: 'InventoryOutAdd',
            component: () => import('@/views/outbound-management/components/Add.vue'),
            meta: { title: '新增出库', icon: 'Minus', hidden: true, activeMenu: '/inventory/out', permission: P.Inventory.Out.Add },
            alias: '/outbound/add'
          },
          {
            path: 'out/edit/:id',
            name: 'InventoryOutEdit',
            component: () => import('@/views/outbound-management/components/Edit.vue'),
            meta: { title: '编辑出库', icon: 'Edit', hidden: true, activeMenu: '/inventory/out', permission: P.Inventory.Out.Edit },
            alias: '/outbound/edit/:id'
          },
          {
            path: 'out/detail/:id',
            name: 'InventoryOutDetail',
            component: () => import('@/views/outbound-management/components/Detail.vue'),
            meta: { title: '出库详情', icon: 'Document', hidden: true, activeMenu: '/inventory/out', permission: P.Inventory.Out.View },
            alias: '/outbound/detail/:id'
          },
          {
            path: 'stock',
            name: 'InventoryStock',
            component: () => import('@/views/stock-query/index.vue'),
            meta: { title: '库存查询', icon: 'Search', permission: P.Inventory.Stock.View }
          }
        ]
      },
      {
        path: 'finance',
        name: 'Finance',
        redirect: '/finance/receivable',
        meta: { title: '财务管理', icon: 'Money' },
        children: [
          {
            path: 'receivable',
            name: 'Receivable',
            component: () => import('@/views/receivable-management/index.vue'),
            meta: { title: '应收管理', icon: 'Coin', permission: P.Finance.Receivable.View }
          },
          {
            path: 'receivable/add',
            name: 'ReceivableAdd',
            component: () => import('@/views/receivable-management/components/Add.vue'),
            meta: { title: '新增应收', icon: 'Plus', hidden: true, activeMenu: '/finance/receivable', permission: P.Finance.Receivable.Add }
          },
          {
            path: 'receivable/edit/:id',
            name: 'ReceivableEdit',
            component: () => import('@/views/receivable-management/components/Edit.vue'),
            meta: { title: '编辑应收', icon: 'Edit', hidden: true, activeMenu: '/finance/receivable', permission: P.Finance.Receivable.Edit }
          },
          {
            path: 'receivable/detail/:id',
            name: 'ReceivableDetail',
            component: () => import('@/views/receivable-management/components/Detail.vue'),
            meta: { title: '应收详情', icon: 'Document', hidden: true, activeMenu: '/finance/receivable', permission: P.Finance.Receivable.View }
          },
          {
            path: 'payable',
            name: 'Payable',
            component: () => import('@/views/payable-management/index.vue'),
            meta: { title: '应付管理', icon: 'CreditCard', permission: P.Finance.Payable.View }
          },
          {
            path: 'payable/add',
            name: 'PayableAdd',
            component: () => import('@/views/payable-management/components/Add.vue'),
            meta: { title: '新增应付', icon: 'Plus', hidden: true, activeMenu: '/finance/payable', permission: P.Finance.Payable.Add }
          },
          {
            path: 'payable/edit/:id',
            name: 'PayableEdit',
            component: () => import('@/views/payable-management/components/Edit.vue'),
            meta: { title: '编辑应付', icon: 'Edit', hidden: true, activeMenu: '/finance/payable', permission: P.Finance.Payable.Edit }
          },
          {
            path: 'payable/detail/:id',
            name: 'PayableDetail',
            component: () => import('@/views/payable-management/components/Detail.vue'),
            meta: { title: '应付详情', icon: 'Document', hidden: true, activeMenu: '/finance/payable', permission: P.Finance.Payable.View }
          }
        ]
      },
      {
        path: 'system',
        name: 'System',
        redirect: '/system/user',
        meta: { title: '系统设置', icon: 'Setting', permission: P.System.View },
        children: [
          {
            path: 'user',
            name: 'SystemUser',
            component: () => import('@/views/system/user/index.vue'),
            meta: { title: '用户管理', icon: 'User', permission: P.System.View }
          },
          {
            path: 'permission',
            name: 'SystemPermission',
            component: () => import('@/views/system/permission/index.vue'),
            meta: { title: '权限管理', icon: 'Lock', permission: P.System.View }
          }
        ]
      },
    ]
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

router.beforeEach(async (to, _from, next) => {
  const publicPaths = ['/login']
  if (publicPaths.includes(to.path)) return next()
  
  const token = localStorage.getItem('token')
  if (!token) return next('/login')
  
  const userStore = useUserStore()
  if (!userStore.userInfo) {
    await userStore.fetchUserInfo()
  }

  const permission = to.meta.permission as string | undefined
  if (permission) {
    if (!userStore.hasPermission(permission)) {
      ElMessage.error('没有权限访问该页面')
      return next('/dashboard') // Or some error page
    }
  }
  
  next()
})

export default router
