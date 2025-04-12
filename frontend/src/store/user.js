import { defineStore } from 'pinia'
import { login as userLogin, getUserInfo, verifyToken } from '@/api/user'

export const useUserStore = defineStore('user', {
  state: () => ({
    token: localStorage.getItem('token') || '',
    userInfo: JSON.parse(localStorage.getItem('userInfo') || '{}')
  }),
  
  getters: {
    isLoggedIn: state => !!state.token,
    isAuthenticated: state => !!state.token,
    username: state => state.userInfo?.username || '',
    fullName: state => state.userInfo?.full_name || state.userInfo?.username || '',
    isAdmin: state => state.userInfo?.is_superuser || false
  },
  
  actions: {
    // 设置令牌
    setToken(token) {
      console.log('设置令牌:', token) // 调试日志
      this.token = token
      localStorage.setItem('token', token)
    },
    
    // 设置用户信息
    setUserInfo(userInfo) {
      console.log('设置用户信息:', userInfo) // 调试日志
      this.userInfo = userInfo
      localStorage.setItem('userInfo', JSON.stringify(userInfo))
    },
    
    // 登录
    async login(userData) {
      try {
        console.log('登录请求数据:', userData) // 调试日志
        const response = await userLogin(userData)
        console.log('登录响应:', response) // 调试日志
        
        // 从响应中提取token
        const token = response.token
        if (!token) {
          console.error('登录响应中没有找到token:', response)
          return Promise.reject(new Error('登录响应中没有找到token'))
        }
        this.setToken(token)
        
        // 如果API提供了用户信息，直接设置
        if (response.user) {
          this.setUserInfo(response.user)
          return Promise.resolve()
        }
        
        // 否则，获取用户信息
        try {
          await this.fetchUserInfo()
        } catch (userError) {
          console.error('获取用户信息失败', userError)
          // 不阻止登录流程继续
        }
        
        return Promise.resolve()
      } catch (error) {
        console.error('登录失败:', error) // 错误日志
        return Promise.reject(error)
      }
    },
    
    // 获取用户信息
    async fetchUserInfo() {
      console.log('开始获取用户信息, token:', this.token) // 调试日志
      try {
        const userInfo = await getUserInfo()
        console.log('获取到用户信息:', userInfo) // 调试日志
        this.setUserInfo(userInfo)
        return Promise.resolve(userInfo)
      } catch (error) {
        console.error('获取用户信息失败:', error) // 错误日志
        return Promise.reject(error)
      }
    },
    
    // 验证令牌有效性
    async verifyToken() {
      try {
        if (!this.token) {
          return Promise.resolve(false)
        }
        
        const response = await verifyToken()
        return Promise.resolve(response.valid)
      } catch (error) {
        console.error('令牌验证失败:', error)
        return Promise.resolve(false)
      }
    },
    
    // 退出登录
    logout() {
      console.log('执行登出') // 调试日志
      this.token = ''
      this.userInfo = {}
      localStorage.removeItem('token')
      localStorage.removeItem('userInfo')
    }
  }
}) 