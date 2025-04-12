import request from './request'

// 获取验证码
export function getCaptcha() {
  return request({
    url: '/auth/captcha',
    method: 'post'
  })
}

// 用户登录
export function login(data) {
  // 使用JSON格式提交登录信息
  return request({
    url: '/auth/login',
    method: 'post',
    data: {
      username: data.username,
      password: data.password
    },
    headers: {
      'Content-Type': 'application/json'
    }
  })
}

// 验证令牌
export function verifyToken() {
  return request({
    url: '/auth/verify',
    method: 'get'
  })
}

// 获取当前用户信息
export function getUserInfo() {
  return request({
    url: '/users/me',
    method: 'get'
  })
}

// 获取用户资料
export function getUserProfile() {
  return request({
    url: '/users/me/profile',
    method: 'get'
  })
}

// 更新当前用户信息
export function updateUserInfo(data) {
  return request({
    url: '/users/me',
    method: 'put',
    data
  })
}

// 更新用户资料
export function updateUserProfile(data) {
  return request({
    url: '/users/me/profile',
    method: 'put',
    data
  })
}

// 修改密码
export function changePassword(data) {
  return request({
    url: `/users/${data.userId}/password`,
    method: 'put',
    data: {
      old_password: data.oldPassword,
      new_password: data.newPassword
    }
  })
} 