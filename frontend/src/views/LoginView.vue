<template>
  <div class="login-container">
    <div class="login-content">
      <div class="login-box">
        <div class="brand-section">
          <div class="logo">
            <i class="el-icon-folder"></i>
          </div>
          <h1 class="login-title">案件管理系统</h1>
          <p class="login-subtitle">专业的案件管理解决方案</p>
        </div>
        
        <el-form :model="loginForm" :rules="rules" ref="loginFormRef" label-position="top" class="login-form">
          <el-form-item label="用户名" prop="username">
            <el-input 
              v-model="loginForm.username" 
              placeholder="请输入用户名" 
              prefix-icon="el-icon-user"
              @keyup.enter="handleLogin">
            </el-input>
          </el-form-item>
          
          <el-form-item label="密码" prop="password">
            <el-input 
              type="password" 
              v-model="loginForm.password" 
              placeholder="请输入密码" 
              prefix-icon="el-icon-lock"
              @keyup.enter="handleLogin">
            </el-input>
          </el-form-item>
          
          <el-form-item label="验证码" prop="turnstileResponse">
            <div id="cf-turnstile" class="turnstile-container"></div>
          </el-form-item>
          
          <el-form-item>
            <el-button 
              type="primary" 
              :loading="loading" 
              class="login-button" 
              @click="handleLogin">
              {{ loading ? '登录中...' : '登录' }}
            </el-button>
          </el-form-item>
        </el-form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/store/user'

const router = useRouter()
const userStore = useUserStore()
const loginFormRef = ref(null)
const loading = ref(false)

// Turnstile 验证码配置
const TURNSTILE_SITE_KEY = '0x4AAAAAABKQ0vSK6mtjA5tA'; // 请替换为您的实际 site key
let turnstileWidget = null;

// 表单数据
const loginForm = reactive({
  username: '',
  password: '',
  turnstileResponse: ''
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
  turnstileResponse: [
    { required: true, message: '请完成人机验证', trigger: 'change' }
  ]
}

// 加载 Turnstile 脚本
const loadTurnstileScript = () => {
  return new Promise((resolve, reject) => {
    // 检查脚本是否已经加载
    if (document.querySelector('script[src*="turnstile.js"]')) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    script.async = true;
    script.defer = true;
    
    script.onload = () => {
      resolve();
    };
    
    script.onerror = (e) => {
      reject(new Error('加载验证码失败'));
    };
    
    document.head.appendChild(script);
  });
};

// 初始化 Turnstile 组件
const initTurnstile = () => {
  if (window.turnstile) {
    // 如果已经有一个小部件，先重置它
    if (turnstileWidget) {
      window.turnstile.reset(turnstileWidget);
    }
    
    // 渲染 Turnstile 小部件
    turnstileWidget = window.turnstile.render('#cf-turnstile', {
      sitekey: TURNSTILE_SITE_KEY,
      callback: function(token) {
        loginForm.turnstileResponse = token;
      },
      'expired-callback': function() {
        loginForm.turnstileResponse = '';
        ElMessage.warning('验证码已过期，请重新验证');
      },
      'error-callback': function(error) {
        loginForm.turnstileResponse = '';
        ElMessage.error('验证码加载失败，请刷新重试');
      },
      theme: "light"
    });
  } else {
    ElMessage.error('验证码组件加载失败');
  }
};

// 处理登录
const handleLogin = () => {
  if (!loginFormRef.value) return;
  
  loginFormRef.value.validate(async (valid) => {
    if (!valid) return;
    
    // 验证是否完成验证码
    if (!loginForm.turnstileResponse) {
      ElMessage.warning('请先完成人机验证');
      return;
    }
    
    loading.value = true;
    try {
      // 构建登录数据
      const loginData = {
        username: loginForm.username,
        password: loginForm.password,
        turnstileResponse: loginForm.turnstileResponse
      };
      
      // 调用登录接口
      await userStore.login(loginData);
      ElMessage.success('登录成功');
      router.push('/');
    } catch (error) {
      ElMessage.error('登录失败，请检查用户名和密码');
      // 重置验证码
      if (window.turnstile && turnstileWidget) {
        window.turnstile.reset(turnstileWidget);
        loginForm.turnstileResponse = '';
      }
    } finally {
      loading.value = false;
    }
  });
};

// 清理 Turnstile 小部件
const cleanupTurnstile = () => {
  if (window.turnstile && turnstileWidget) {
    window.turnstile.remove(turnstileWidget);
    turnstileWidget = null;
  }
};

onMounted(async () => {
  // 如果已经登录，跳转到首页
  if (userStore.isLoggedIn) {
    router.push('/');
    return;
  }
  
  try {
    // 加载 Turnstile 脚本并初始化
    await loadTurnstileScript();
    initTurnstile();
  } catch (error) {
    ElMessage.error('验证码加载失败，请刷新页面重试');
  }
});

onBeforeUnmount(() => {
  cleanupTurnstile();
});
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.login-content {
  width: 100%;
  max-width: 440px;
  margin: auto;
}

.login-box {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  padding: 40px;
  backdrop-filter: blur(10px);
  animation: fadeIn 0.5s ease-out;
}

.brand-section {
  text-align: center;
  margin-bottom: 40px;
}

.logo {
  width: 80px;
  height: 80px;
  margin: 0 auto 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 40px;
  transform: rotate(-10deg);
  transition: transform 0.3s ease;
}

.logo:hover {
  transform: rotate(0deg);
}

.login-title {
  font-size: 28px;
  color: #2c3e50;
  margin: 0 0 8px;
  font-weight: 600;
}

.login-subtitle {
  color: #666;
  font-size: 16px;
  margin: 0;
}

.login-form {
  margin-top: 30px;
}

:deep(.el-input__inner) {
  height: 45px;
  line-height: 45px;
  border-radius: 8px;
  border: 2px solid #eee;
  transition: all 0.3s ease;
}

:deep(.el-input__inner:focus) {
  border-color: #667eea;
  box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.1);
}

:deep(.el-form-item__label) {
  font-size: 14px;
  color: #606266;
  padding-bottom: 8px;
}

.login-button {
  width: 100%;
  height: 45px;
  font-size: 16px;
  border-radius: 8px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  margin-top: 20px;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.login-button:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.login-button:active {
  transform: translateY(0);
}

.turnstile-container {
  display: flex;
  justify-content: center;
  margin-top: 8px;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 响应式设计 */
@media (max-width: 480px) {
  .login-box {
    padding: 30px 20px;
  }
  
  .login-title {
    font-size: 24px;
  }
  
  .logo {
    width: 60px;
    height: 60px;
    font-size: 30px;
  }
}
</style> 