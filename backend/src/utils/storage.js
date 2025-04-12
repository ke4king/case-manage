// 生成唯一的文件存储路径
export function generateFilePath(caseId, fileName) {
  const timestamp = Date.now();
  const randomPart = Math.random().toString(36).substring(2, 10);
  
  // 提取文件扩展名
  const fileExtension = fileName.split('.').pop();
  
  // 构建安全的文件名
  const safeName = fileName
    .replace(/[^a-zA-Z0-9.-]/g, '_') // 替换非法字符
    .replace(/_{2,}/g, '_'); // 移除连续下划线
  
  return `case-${caseId}/${timestamp}-${randomPart}-${safeName}`;
}

// 生成文件内容的哈希值 (SHA-256)
export async function generateFileHash(buffer) {
  // 使用 Web Crypto API 计算哈希值
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  
  // 将 ArrayBuffer 转换为十六进制字符串
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  return hashHex;
}

// 从文件内容获取内容类型
export function getContentType(fileName) {
  const extension = fileName.split('.').pop().toLowerCase();
  
  const contentTypes = {
    pdf: 'application/pdf',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xls: 'application/vnd.ms-excel',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ppt: 'application/vnd.ms-powerpoint',
    pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    txt: 'text/plain',
    csv: 'text/csv',
    zip: 'application/zip',
    rar: 'application/x-rar-compressed',
    '7z': 'application/x-7z-compressed'
  };
  
  return contentTypes[extension] || 'application/octet-stream';
}

// 检查文件是否已存在于存储桶中
export async function checkFileExists(bucket, filePath) {
  try {
    const object = await bucket.head(filePath);
    return object !== null;
  } catch (error) {
    return false;
  }
}

// 上传文件到 R2 存储
export async function uploadFile(bucket, filePath, fileContent, contentType) {
  await bucket.put(filePath, fileContent, {
    httpMetadata: {
      contentType: contentType
    }
  });
  
  return {
    path: filePath,
    url: `/${filePath}`  // 实际项目中可能需要构建完整的 URL
  };
}

// 从 R2 存储获取文件
export async function getFile(bucket, filePath) {
  const file = await bucket.get(filePath);
  
  if (file === null) {
    return null;
  }
  
  return file;
}

// 从 R2 存储删除文件
export async function deleteFile(bucket, filePath) {
  await bucket.delete(filePath);
  return { success: true };
} 