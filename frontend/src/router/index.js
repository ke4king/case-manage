import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/store/user'
import { ElMessage } from 'element-plus'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/LoginView.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/shared/:token',
    name: 'SharedCase',
    component: () => import('@/views/case/SharedCaseView.vue'),
    meta: { requiresAuth: false, title: '查看共享案件' },
    props: route => ({ token: route.params.token })
  },
  {
    path: '/',
    component: () => import('@/views/LayoutView.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        redirect: '/dashboard'
      },
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/DashboardView.vue'),
        meta: { title: '仪表盘' }
      },
      {
        path: 'cases',
        name: 'CaseList',
        component: () => import('@/views/case/CaseListView.vue'),
        meta: { title: '案件列表' }
      },
      {
        path: 'cases/new',
        name: 'CaseNew',
        component: () => import('@/views/case/CaseFormView.vue'),
        meta: { title: '新建案件' }
      },
      {
        path: 'cases/edit/:id',
        name: 'CaseEdit',
        component: () => import('@/views/case/CaseFormView.vue'),
        meta: { title: '编辑案件' }
      },
      {
        path: 'cases/detail/:id',
        name: 'CaseDetail',
        component: () => import('@/views/case/CaseDetailView.vue'),
        meta: { title: '案件详情' },
        props: route => ({ caseId: route.params.id })
      },
      {
        path: 'profile',
        name: 'UserProfile',
        component: () => import('@/views/user/ProfileView.vue'),
        meta: { title: '个人信息' }
      }
    ]
  },
  {
    path: '/404',
    name: 'NotFound',
    component: () => import('@/views/NotFound.vue'),
    meta: { requiresAuth: false, title: '页面未找到' }
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFoundRedirect',
    redirect: '/404'
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 导航守卫
router.beforeEach((to, from, next) => {
  const userStore = useUserStore()
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth !== false)
  const isAdmin = to.matched.some(record => record.meta.requiresAdmin === true)
  
  // 检查用户是否已登录
  if (requiresAuth && !userStore.isLoggedIn) {
    ElMessage.warning('请先登录')
    next({ path: '/login', query: { redirect: to.fullPath } })
  }
  // 检查管理员权限
  else if (isAdmin && !userStore.isAdmin) {
    ElMessage.warning('您没有权限访问该页面')
    next('/dashboard')
  } 
  else {
    next()
  }
})

export default router 