import axios from 'axios'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/store/user'
import router from '@/router'

// 创建axios实例
const request = axios.create({
  baseURL: '/api/v1',
  timeout: 10000
})

// 直接连接到后端服务器的实例（绕过Vite代理）
const directRequest = axios.create({
  baseURL: '/api/v1',
  timeout: 10000
})

// 请求拦截器
const setupInterceptors = (axiosInstance) => {
  axiosInstance.interceptors.request.use(
    config => {
      const userStore = useUserStore()
      const token = userStore.token
      
      // 如果有token且请求需要认证（默认需要认证），添加到请求头
      if (token && !config.noAuth) {
        // 确保使用Bearer认证头并指定正确的格式
        config.headers['Authorization'] = `Bearer ${token}`
      }
      
      // 确保所有请求都包含这些头
      config.headers['Accept'] = 'application/json';
      
      return config
    },
    error => {
      return Promise.reject(error)
    }
  )

  // 响应拦截器
  axiosInstance.interceptors.response.use(
    response => {
      console.log('请求成功:', response.config.url, response.data);
      return response.data
    },
    error => {
      // 获取详细的错误信息
      const status = error.response?.status
      const url = error.config?.url
      const method = error.config?.method
      
      console.error('请求失败:', { 
        url, 
        method, 
        status, 
        error: error.message,
        response: error.response?.data
      });
      
      // 根据状态码处理不同的错误
      if (status === 401 && !error.config.noAuth) {
        const userStore = useUserStore()
        userStore.logout()
        router.push('/login')
        ElMessage.error('登录已过期，请重新登录')
      } else if (status === 403) {
        ElMessage.error('无权限访问')
      } else if (status === 404) {
        ElMessage.error('请求的资源不存在')
      } else if (status === 499) {
        // 处理 Cloudflare 499 错误
        ElMessage.error('验证服务连接失败，请刷新页面重试')
      } else {
        const msg = error.response?.data?.error || error.response?.data?.detail || '请求失败'
        ElMessage.error(msg)
      }
      
      return Promise.reject(error)
    }
  )
}

// 设置拦截器
setupInterceptors(request)
setupInterceptors(directRequest)

// 封装的请求方法，根据参数决定使用哪个实例
export default function(config) {
  // 如果指定了直接请求，则使用directRequest实例
  if (config.directRequest) {
    const { directRequest: _, ...restConfig } = config
    return directRequest(restConfig)
  }
  return request(config)
} 