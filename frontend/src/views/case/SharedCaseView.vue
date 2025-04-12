<template>
  <div class="shared-case-container">
    <div v-if="!loading && !error" class="shared-header">
      <h1>查看共享案件</h1>
      <p class="shared-notice">该案件通过分享链接访问</p>
    </div>
    
    <div v-if="error" class="error-container">
      <el-result
        icon="error"
        title="无法加载案件"
        :sub-title="error"
      >
      </el-result>
    </div>
    
    <div v-else class="case-content">
      <case-detail-component
        :case-data="caseData"
        :loading="loading"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getSharedCaseByToken } from '@/api/case'
import CaseDetailComponent from '@/components/CaseDetailComponent.vue'

// 定义数据
const route = useRoute()
const token = route.params.token
const loading = ref(true)
const error = ref('')
const caseData = ref(null)

// 获取共享案件数据
const fetchSharedCase = async () => {
  if (!token || token.length !== 32) {
    error.value = '无效的分享链接'
    loading.value = false
    return
  }
  
  loading.value = true
  try {
    const response = await getSharedCaseByToken(token)
    caseData.value = response.case
  } catch (err) {
    console.error('获取共享案件失败:', err)
    error.value = err.response?.data?.error || '获取案件失败，该链接可能已失效'
    ElMessage.error(error.value)
  } finally {
    loading.value = false
  }
}

// 在组件挂载时获取数据
onMounted(() => {
  document.title = '查看共享案件'
  fetchSharedCase()
})
</script>

<style scoped>
.shared-case-container {
  min-height: 100vh;
  background-color: #f6f8fa;
  padding: 30px;
  display: flex;
  flex-direction: column;
}

.shared-header {
  text-align: center;
  margin-bottom: 30px;
}

.shared-header h1 {
  font-size: 28px;
  color: #303133;
  margin-bottom: 10px;
}

.shared-notice {
  color: #909399;
  font-size: 14px;
}

.case-content {
  flex: 1;
}

.error-container {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 50px 0;
}

.footer-actions {
  display: flex;
  justify-content: center;
  margin-top: 30px;
  padding-bottom: 20px;
}
</style> 