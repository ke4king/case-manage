<template>
  <div class="case-form-wrapper">
    <div class="case-form-container">
      <el-page-header @back="handleBack" :content="isEdit ? '编辑案件' : '创建案件'" />
      
      <CaseFormComponent
        ref="caseFormRef"
        :is-edit="isEdit"
        :initial-data="initialData"
        :loading="loading"
        @submit="handleSubmit"
        @cancel="handleBack"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { useRouter, useRoute } from 'vue-router'
import CaseFormComponent from '@/components/CaseFormComponent.vue'
import { getCaseDetail, createCase, updateCase } from '@/api/case'

// 路由相关
const router = useRouter()
const route = useRoute()
const isEdit = computed(() => route.params.id !== undefined)

// 表单引用和状态
const caseFormRef = ref(null)
const loading = ref(false)
const initialData = ref({})

// 返回上一页
const handleBack = () => {
  router.back()
}

// 获取案件详情（编辑模式）
const fetchCaseDetail = async () => {
  if (!isEdit.value) return
  
  loading.value = true
  try {
    const response = await getCaseDetail(route.params.id)
    if (response && response.case) {
      // 将服务器返回的案件数据保存为初始数据
      initialData.value = response.case
      console.log('获取的案件数据:', initialData.value)
    } else {
      ElMessage.warning('获取案件数据格式异常')
      console.warn('案件数据格式异常:', response)
    }
  } catch (error) {
    ElMessage.error('获取案件详情失败')
    console.error('获取案件详情错误:', error)
  } finally {
    loading.value = false
  }
}

// 处理表单提交
const handleSubmit = async (formData) => {
  loading.value = true
  try {
    // 提交表单数据
    if (isEdit.value) {
      await updateCase(route.params.id, formData)
      ElMessage.success('更新案件成功')
    } else {
      console.log('提交案件数据:', JSON.stringify(formData))
      await createCase(formData)
      ElMessage.success('创建案件成功')
    }
    
    // 返回到仪表板界面
    router.push('/dashboard')
  } catch (error) {
    console.error('提交错误:', error)
    ElMessage.error(isEdit.value ? '更新案件失败' : '创建案件失败')
  } finally {
    loading.value = false
  }
}

// 页面加载时获取数据
onMounted(async () => {
  if (isEdit.value) {
    await fetchCaseDetail()
  }
})
</script>

<style scoped>
.case-form-wrapper {
  padding: 20px;
}

.case-form-container {
  background-color: #fff;
  border-radius: 4px;
  padding: 20px;
}
</style> 