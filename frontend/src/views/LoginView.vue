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
        <el-form-item label="验证码" prop="turnstileResponse">
          <div id="cf-turnstile" class="turnstile-container" theme="light"></div>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="loading" style="width: 100%;" @click="handleLogin">登录</el-button>
        </el-form-item>
      </el-form>
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
      console.log('Turnstile 脚本已加载');
      resolve();
      return;
    }

    console.log('开始加载 Turnstile 脚本');
    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    script.async = true;
    script.defer = true;
    script.crossOrigin = 'anonymous'; // 添加跨域标记
    
    script.onload = () => {
      console.log('Turnstile 脚本加载成功');
      resolve();
    };
    
    script.onerror = (e) => {
      console.error('Turnstile 脚本加载失败:', e);
      reject(new Error('加载验证码失败'));
    };
    
    document.head.appendChild(script);
  });
};

// 初始化 Turnstile 组件
const initTurnstile = () => {
  if (window.turnstile) {
    console.log('开始初始化 Turnstile 组件');
    // 如果已经有一个小部件，先重置它
    if (turnstileWidget) {
      window.turnstile.reset(turnstileWidget);
    }
    
    // 渲染 Turnstile 小部件
    turnstileWidget = window.turnstile.render('#cf-turnstile', {
      sitekey: TURNSTILE_SITE_KEY,
      callback: function(token) {
        console.log('验证成功，获取到 token');
        loginForm.turnstileResponse = token;
      },
      'expired-callback': function() {
        console.log('验证码已过期');
        loginForm.turnstileResponse = '';
        ElMessage.warning('验证码已过期，请重新验证');
      },
      'error-callback': function(error) {
        console.error('验证码错误:', error);
        loginForm.turnstileResponse = '';
        ElMessage.error('验证码加载失败，请刷新重试');
      }
    });
    console.log('Turnstile 组件初始化完成');
  } else {
    console.error('window.turnstile 未定义，验证码组件加载失败');
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
      console.log('未完成验证码验证');
      ElMessage.warning('请先完成人机验证');
      return;
    }
    
    console.log('开始提交登录，验证码令牌长度:', loginForm.turnstileResponse.length);
    
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
      console.log('登录成功');
      ElMessage.success('登录成功');
      router.push('/');
    } catch (error) {
      console.error('登录失败:', error);
      ElMessage.error('登录失败，请检查用户名和密码');
      // 重置验证码
      if (window.turnstile && turnstileWidget) {
        console.log('重置验证码');
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

.turnstile-container {
  display: flex;
  justify-content: center;
  margin-top: 10px;
}
</style> 