import request from './request'

// 获取案件列表
export function getCaseList(params) {
  console.log('请求案件列表参数:', params) // 添加调试日志
  
  // 构建查询字符串
  const queryParams = new URLSearchParams();
  if (params && params.skip !== undefined) queryParams.append('skip', params.skip);
  if (params && params.limit !== undefined) queryParams.append('limit', params.limit);
  if (params && params.search) queryParams.append('search', params.search);
  
  const queryString = queryParams.toString();
  const url = queryString ? `/cases?${queryString}` : '/cases';
  
  console.log('请求完整URL:', url);
  
  return request({
    url: url,
    method: 'get',
    headers: {
      'Accept': 'application/json',
      'Cache-Control': 'no-cache'
    }
  })
}

// 获取案件详情
export function getCaseDetail(id) {
  return request({
    url: `/cases/${id}`,
    method: 'get',
    headers: {
      'Accept': 'application/json',
      'Cache-Control': 'no-cache'
    }
  })
}

// 通过分享token获取案件详情（无需登录）
export function getSharedCaseByToken(token) {
  return request({
    url: `/cases/shared/${token}`,
    method: 'get',
    headers: {
      'Accept': 'application/json',
      'Cache-Control': 'no-cache'
    },
    noAuth: true // 标记不需要认证
  })
}

// 创建案件
export function createCase(data) {
  return request({
    url: '/cases',
    method: 'post',
    data,
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache'
    }
  })
}

// 更新案件
export function updateCase(id, data) {
  return request({
    url: `/cases/${id}`,
    method: 'put',
    data,
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache'
    }
  })
}

// 删除案件
export function deleteCase(id) {
  return request({
    url: `/cases/${id}`,
    method: 'delete',
    headers: {
      'Accept': 'application/json',
      'Cache-Control': 'no-cache'
    }
  })
}

// 上传文件
export function uploadFile(caseId, file) {
  const formData = new FormData()
  formData.append('file', file)
  return request({
    url: `/files/upload/${caseId}`,
    method: 'post',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data',
      'Accept': 'application/json'
    }
  })
}

// 获取文件URL
export function getFileUrl(fileId) {
  return `/api/v1/files/${fileId}`
}

// 删除文件
export function deleteFile(fileId) {
  return request({
    url: `/files/${fileId}`,
    method: 'delete',
    headers: {
      'Accept': 'application/json',
      'Cache-Control': 'no-cache'
    }
  })
}

// 创建案件（调试版本）
export function debugCreateCase(data) {
  return request({
    url: '/cases/debug',
    method: 'post',
    data,
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache'
    }
  })
} 