import { Hono } from 'hono';
import { processRowResult } from '../utils/db';
import { generateFilePath, getContentType, uploadFile, getFile, deleteFile, generateFileHash, checkFileExists } from '../utils/storage';

const fileRoutes = new Hono();

// 用于存储已上传图片的哈希映射（内存缓存）
// 格式：{ 用户ID: { 文件哈希: { url, filePath } } }
let fileHashMap = {};

// 简单图片上传
fileRoutes.post('/upload', async (c) => {
  try {
    const currentUser = c.get('jwtPayload');
    const userId = currentUser.id;
    
    // 确保用户的哈希映射存在
    if (!fileHashMap[userId]) {
      fileHashMap[userId] = {};
    }
    
    // 获取表单数据
    const formData = await c.req.formData();
    const file = formData.get('file');
    
    if (!file) {
      return c.json({ error: '未提供文件' }, 400);
    }
    
    // 读取文件内容和信息
    const fileContent = await file.arrayBuffer();
    const fileName = file.name;
    const fileSize = fileContent.byteLength;
    const fileType = file.type || getContentType(fileName);
    
    // 严格限制只允许上传图片
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(fileType)) {
      return c.json({ error: '只支持上传JPG、PNG、GIF和WEBP格式图片' }, 400);
    }
    
    // 限制文件大小（5MB）
    const maxSize = 5 * 1024 * 1024;
    if (fileSize > maxSize) {
      return c.json({ error: '图片大小不能超过5MB' }, 400);
    }
    
    // 计算文件内容的哈希值
    const fileHash = await generateFileHash(fileContent);
    console.log(`文件哈希值: ${fileHash}`);
    
    // 获取文件扩展名
    const fileExt = fileName.split('.').pop().toLowerCase();
    
    // 检查是否已上传过相同内容的文件（通过内存缓存）
    if (fileHashMap[userId][fileHash]) {
      console.log(`文件已存在，直接返回URL: ${fileHashMap[userId][fileHash].url}`);
      return c.json({
        message: '图片上传成功（使用已存在文件）',
        url: fileHashMap[userId][fileHash].url,
        file_hash: fileHash
      }, 200);
    }
    
    // 基于哈希值创建文件路径
    const filePath = `uploads/${userId}/${fileHash}.${fileExt}`;
    
    // 检查R2存储中是否已存在此文件
    const exists = await checkFileExists(c.env.CASE_FILES, filePath);
    if (exists) {
      // 文件已存在，不需要重新上传
      const fileUrl = `/api/v1/files/view/${fileHash}.${fileExt}?uid=${userId}`;
      
      // 更新哈希映射
      fileHashMap[userId][fileHash] = {
        url: fileUrl,
        filePath: filePath
      };
      
      return c.json({
        message: '图片上传成功（使用已存在文件）',
        url: fileUrl,
        file_hash: fileHash
      }, 200);
    }
    
    // 上传到 R2 存储
    await uploadFile(c.env.CASE_FILES, filePath, fileContent, fileType);
    
    // 生成访问URL
    const fileUrl = `/api/v1/files/view/${fileHash}.${fileExt}?uid=${userId}`;
    
    // 更新哈希映射
    fileHashMap[userId][fileHash] = {
      url: fileUrl,
      filePath: filePath
    };
    
    // 返回结果，包含URL
    return c.json({ 
      message: '图片上传成功',
      url: fileUrl,
      file_hash: fileHash,
      file_name: fileName,
      file_path: filePath,
      file_size: fileSize,
      file_type: fileType
    }, 201);
  } catch (error) {
    console.error('Upload file error:', error);
    return c.json({ error: '图片上传失败: ' + error.message }, 500);
  }
});

// 查看图片 - 公开访问，不需要验证
fileRoutes.get('/view/:fileName', async (c) => {
  try {
    const fileName = c.req.param('fileName');
    
    // 从文件名提取哈希部分和用户ID
    const fileHashParts = fileName.split('.');
    const fileExt = fileHashParts.pop();
    const fileHash = fileHashParts.join('.');
    
    // 尝试从JWT获取用户ID，但不要求必须携带令牌
    let userId;
    try {
      const currentUser = c.get('jwtPayload');
      userId = currentUser.id;
    } catch (e) {
      // 如果获取不到用户ID，则尝试从URL查询参数获取
      userId = c.req.query('uid');
      
      // 如果没有提供用户ID，则设置一个默认值（适用于公开图片）
      if (!userId) {
        console.warn('访问图片时未提供用户ID，尝试寻找任何匹配的图片');
      }
    }
    
    let file = null;
    
    // 如果有用户ID，先尝试特定用户路径
    if (userId) {
      const userFilePath = `uploads/${userId}/${fileName}`;
      file = await getFile(c.env.CASE_FILES, userFilePath);
      console.log(`尝试获取特定用户图片: ${userFilePath}, 结果: ${file ? '找到' : '未找到'}`);
    }
    
    // 如果没有找到，尝试遍历所有用户查找该哈希文件（仅适用于公开系统或开发环境）
    if (!file) {
      // 从哈希映射中查找
      for (const [mappedUserId, userFiles] of Object.entries(fileHashMap)) {
        if (userFiles[fileHash]) {
          const altFilePath = userFiles[fileHash].filePath;
          file = await getFile(c.env.CASE_FILES, altFilePath);
          if (file) {
            console.log(`在用户${mappedUserId}的文件中找到匹配: ${altFilePath}`);
            break;
          }
        }
      }
    }
    
    // 如果仍然没有找到，尝试在公共区域寻找
    if (!file) {
      // 此处可以添加在公共区域查找的逻辑，例如一个专门的公共文件夹
      const publicFilePath = `public/${fileName}`;
      file = await getFile(c.env.CASE_FILES, publicFilePath);
      console.log(`尝试获取公共图片: ${publicFilePath}, 结果: ${file ? '找到' : '未找到'}`);
    }
    
    // 如果所有尝试都失败，返回404
    if (!file) {
      return c.json({ error: '图片不存在' }, 404);
    }
    
    // 从文件名判断内容类型
    const fileType = getContentType(fileName);
    
    // 验证是否为图片类型
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(fileType)) {
      return c.json({ error: '不支持的文件类型' }, 400);
    }
    
    // 设置响应头
    const headers = new Headers();
    headers.set('Content-Type', fileType);
    headers.set('Content-Disposition', 'inline');
    headers.set('Cache-Control', 'public, max-age=31536000'); // 缓存一年
    headers.set('Access-Control-Allow-Origin', '*'); // 允许跨域访问
    headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    
    // 返回图片内容
    return new Response(file.body, { headers });
  } catch (error) {
    console.error('View image error:', error);
    return c.json({ error: '查看图片失败: ' + error.message }, 500);
  }
});

export { fileRoutes }; 