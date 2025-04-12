<template>
  <div class="app-container">
    <el-container class="layout-container">
      <!-- 头部区域 -->
      <el-header class="header">
        <div class="logo">
          <el-icon><folder /></el-icon>
          <span class="logo-text">案件管理系统</span>
        </div>
      </el-header>
      
      <el-container>
        <!-- 侧边栏 -->
        <el-aside width="220px" class="aside">
          <el-menu
            :router="true"
            :default-active="activePath"
            class="el-menu-vertical"
            background-color="#304156"
            text-color="#bfcbd9"
            active-text-color="#409EFF"
          >
            <el-menu-item index="/dashboard">
              <el-icon><data-analysis /></el-icon>
              <template #title>仪表盘</template>
            </el-menu-item>
            
            <div class="menu-spacer"></div>
            <el-menu-item @click="handleLogout" class="logout-menu-item">
              <el-icon><switch-button /></el-icon>
              <template #title>退出系统</template>
            </el-menu-item>
          </el-menu>
        </el-aside>
        
        <!-- 主内容区域 -->
        <el-main class="main">
          <router-view v-slot="{ Component }">
            <keep-alive>
              <component :is="Component" />
            </keep-alive>
          </router-view>
        </el-main>
      </el-container>
    </el-container>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessageBox } from 'element-plus'
import { DataAnalysis, Folder, SwitchButton } from '@element-plus/icons-vue'
import { useUserStore } from '@/store/user'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

// 计算当前激活的菜单项
const activePath = computed(() => {
  return route.path
})

// 处理退出登录
const handleLogout = () => {
  ElMessageBox.confirm('确定要退出系统吗?', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    userStore.logout()
    router.push('/login')
  }).catch(() => {})
}

// 检查用户登录状态
onMounted(() => {
  if (!userStore.isLoggedIn) {
    router.push('/login')
  }
})
</script>

<style scoped>
.app-container {
  height: 100%;
}

.layout-container {
  height: 100%;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: #304156;
  padding: 0 20px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.12);
}

.logo {
  font-size: 18px;
  font-weight: bold;
  color: #bfcbd9;
  display: flex;
  align-items: center;
  gap: 8px;
}

.logo-text {
  margin-left: 4px;
}

.aside {
  background-color: #304156;
  height: 100%;
  overflow-y: auto;
}

.el-menu-vertical {
  border-right: none;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.menu-spacer {
  flex-grow: 1;
}

.logout-menu-item {
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  color: #f56c6c;
}

.logout-menu-item:hover {
  color: #fff !important;
  background-color: rgba(245, 108, 108, 0.2) !important;
}

.main {
  background-color: #f5f7fa;
  padding: 20px;
  height: 100%;
  overflow-y: auto;
}
</style> 