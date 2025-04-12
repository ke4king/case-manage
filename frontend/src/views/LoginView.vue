<template>
  <div class="login-container">
    <div class="login-box">
      <div class="login-title">案件管理系统</div>
      <el-form :model="loginForm" :rules="rules" ref="loginFormRef" label-position="top">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="loginForm.username" placeholder="请输入用户名" @keyup.enter="handleLogin"></el-input>
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input type="password" v-model="loginForm.password" placeholder="请输入密码" @keyup.enter="handleLogin"></el-input>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="loading" style="width: 100%;" @click="handleLogin">登录</el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/store/user'

const router = useRouter()
const userStore = useUserStore()
const loginFormRef = ref(null)
const loading = ref(false)

// 表单数据
const loginForm = reactive({
  username: '',
  password: '',
})

// 表单验证规则
const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能小于6个字符', trigger: 'blur' }
  ],
}

// 处理登录
const handleLogin = () => {
  if (!loginFormRef.value) return
  
  loginFormRef.value.validate(async (valid) => {
    if (!valid) return
    
    loading.value = true
    try {
      // 构建登录数据
      const loginData = {
        username: loginForm.username,
        password: loginForm.password,
      }
      
      // 添加调试日志
      console.log('登录请求数据:', JSON.stringify(loginData))
      
      // 调用登录接口
      await userStore.login(loginData)
      ElMessage.success('登录成功')
      router.push('/')
    } catch (error) {
      console.error('登录请求失败:', error)
      ElMessage.error('登录失败，请检查用户名和密码')
    } finally {
      loading.value = false
    }
  })
}

// 检查已登录状态
onMounted(() => {
  // 如果已经登录，跳转到首页
  if (userStore.isLoggedIn) {
    router.push('/')
    return
  }
})
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: #2c3e50;
}

.login-box {
  width: 400px;
  padding: 30px;
  background-color: #fff;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.login-title {
  text-align: center;
  margin-bottom: 30px;
  font-size: 24px;
  color: #409EFF;
}
</style> 