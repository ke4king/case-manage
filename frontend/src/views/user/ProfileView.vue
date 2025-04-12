<template>
  <div class="profile-container">
    <div class="profile-card">
      <h2>个人资料</h2>
      <el-divider />
      
      <el-form
        ref="profileFormRef"
        :model="profileForm"
        :rules="rules"
        label-width="100px"
        v-loading="loading"
      >
        <el-form-item label="用户名" prop="username">
          <el-input v-model="profileForm.username" disabled />
        </el-form-item>
        
        <el-form-item label="姓名" prop="full_name">
          <el-input v-model="profileForm.full_name" />
        </el-form-item>
        
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="profileForm.email" />
        </el-form-item>
        
        <el-form-item label="手机号" prop="phone">
          <el-input v-model="profileForm.phone" />
        </el-form-item>
        
        <el-divider content-position="left">修改密码 (可选)</el-divider>
        
        <el-form-item label="当前密码" prop="current_password">
          <el-input 
            v-model="profileForm.current_password" 
            type="password" 
            show-password
            placeholder="仅修改密码时需要填写" 
          />
        </el-form-item>
        
        <el-form-item label="新密码" prop="new_password">
          <el-input 
            v-model="profileForm.new_password" 
            type="password" 
            show-password
            placeholder="仅需要修改密码时填写" 
          />
        </el-form-item>
        
        <el-form-item label="确认密码" prop="confirm_password">
          <el-input 
            v-model="profileForm.confirm_password" 
            type="password" 
            show-password
            placeholder="仅需要修改密码时填写" 
          />
        </el-form-item>
        
        <el-form-item>
          <el-button type="primary" @click="handleSubmit">保存修改</el-button>
          <el-button @click="resetForm">重置</el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getUserProfile, updateUserProfile } from '@/api/user'
import { useUserStore } from '@/store/user'

// 用户状态管理
const userStore = useUserStore()

// 表单和加载状态
const profileFormRef = ref(null)
const loading = ref(false)

// 表单数据
const profileForm = reactive({
  username: '',
  full_name: '',
  email: '',
  phone: '',
  current_password: '',
  new_password: '',
  confirm_password: ''
})

// 表单验证规则
const validatePass = (rule, value, callback) => {
  if (value && value.length < 6) {
    callback(new Error('密码长度至少6个字符'))
  } else if (value && profileForm.confirm_password && value !== profileForm.confirm_password) {
    callback(new Error('两次输入的密码不一致'))
  } else {
    callback()
  }
}

const validatePass2 = (rule, value, callback) => {
  if (value && value !== profileForm.new_password) {
    callback(new Error('两次输入的密码不一致'))
  } else {
    callback()
  }
}

const rules = {
  full_name: [
    { required: true, message: '请输入姓名', trigger: 'blur' },
    { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
  ],
  phone: [
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码', trigger: 'blur' }
  ],
  current_password: [
    { required: false, message: '修改密码时需要填写当前密码', trigger: 'blur' }
  ],
  new_password: [
    { validator: validatePass, trigger: 'blur' }
  ],
  confirm_password: [
    { validator: validatePass2, trigger: 'blur' }
  ]
}

// 获取用户资料
const fetchUserProfile = async () => {
  loading.value = true
  try {
    const response = await getUserProfile()
    if (response) {
      // 更新表单数据
      profileForm.username = response.username || ''
      profileForm.full_name = response.full_name || ''
      profileForm.email = response.email || ''
      profileForm.phone = response.phone || ''
    }
  } catch (error) {
    ElMessage.error('获取用户资料失败')
  } finally {
    loading.value = false
  }
}

// 提交表单
const handleSubmit = async () => {
  if (!profileFormRef.value) return
  
  await profileFormRef.value.validate(async (valid) => {
    if (!valid) {
      ElMessage.warning('请检查表单填写是否正确')
      return
    }
    
    loading.value = true
    try {
      // 构建提交数据
      const updateData = {
        full_name: profileForm.full_name,
        email: profileForm.email,
        phone: profileForm.phone
      }
      
      // 如果填写了密码相关信息，则添加到更新数据中
      if (profileForm.current_password && profileForm.new_password) {
        updateData.current_password = profileForm.current_password
        updateData.new_password = profileForm.new_password
      }
      
      await updateUserProfile(updateData)
      ElMessage.success('更新资料成功')
      
      // 更新用户状态
      userStore.updateUserInfo({
        name: profileForm.full_name
      })
      
      // 清空密码字段
      resetPasswordFields()
    } catch (error) {
      ElMessage.error('更新资料失败')
    } finally {
      loading.value = false
    }
  })
}

// 重置表单
const resetForm = () => {
  if (profileFormRef.value) {
    profileFormRef.value.resetFields()
  }
}

// 清空密码字段
const resetPasswordFields = () => {
  profileForm.current_password = ''
  profileForm.new_password = ''
  profileForm.confirm_password = ''
}

// 页面加载时获取用户资料
onMounted(() => {
  fetchUserProfile()
})
</script>

<style scoped>
.profile-container {
  padding: 20px;
}

.profile-card {
  background-color: #fff;
  border-radius: 4px;
  padding: 20px;
  max-width: 700px;
  margin: 0 auto;
}

h2 {
  text-align: center;
  margin-bottom: 20px;
  color: #303133;
}

:deep(.el-divider__text) {
  font-size: 16px;
  font-weight: bold;
  color: #409eff;
}
</style> 