import { SignJWT, jwtVerify } from 'jose';
// TextEncoder 在Web环境中是全局可用的，不需要从util导入
// import { TextEncoder } from 'util';

// 生成 JWT 令牌
export async function generateJWT(user, secret, expiresIn = '24h') {
  const encoder = new TextEncoder();
  const secretKey = encoder.encode(secret);
  
  const jwt = await new SignJWT({
    id: user.id,
    username: user.username,
    is_superuser: user.is_superuser === 1 || user.is_superuser === true
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(secretKey);
  
  return jwt;
}

// 安全的密码验证函数
export async function verifyPassword(plainPassword, hashedPassword) {
  try {
    // 兼容旧密码格式 (开发环境中的固定密码)
    if (hashedPassword === '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW' 
        && plainPassword === 'password') {
      console.log('使用旧密码格式验证成功');
      return true;
    }
    
    // 检查密码格式
    if (hashedPassword.includes('$')) {
      // 新格式: algorithm$iterations$salt$hash
      const parts = hashedPassword.split('$');
      
      if (parts.length === 4) {
        const [algorithm, iterations, salt, storedHash] = parts;
        
        // 使用相同的盐值和迭代次数计算输入密码的哈希
        const encoder = new TextEncoder();
        const key = await crypto.subtle.importKey(
          'raw',
          encoder.encode(plainPassword),
          { name: 'HMAC', hash: { name: 'SHA-256' } },
          false,
          ['sign']
        );
        
        const computedHash = await crypto.subtle.sign(
          'HMAC',
          key,
          encoder.encode(salt)
        );
        
        // 将计算出的哈希转换为Base64以便比较
        const computedHashBase64 = btoa(
          String.fromCharCode(...new Uint8Array(computedHash))
        );
        
        // 安全比较哈希值
        return computedHashBase64 === storedHash;
      }
    }
    
    // 环境变量中的明文密码比较（仅用于初始管理员设置，应尽快修改为哈希密码）
    if (plainPassword === hashedPassword) {
      console.log('警告: 使用明文密码比较，请尽快迁移到哈希密码');
      return true;
    }
    
    console.log('密码验证失败: 格式不支持或密码不匹配');
    return false;
  } catch (error) {
    console.error('密码验证过程中出错:', error);
    return false;
  }
}

// 使用Web Crypto API哈希密码
export async function hashPassword(password) {
  try {
    // 生成随机盐值
    const salt = generateRandomString(16);
    
    // 哈希密码
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      { name: 'HMAC', hash: { name: 'SHA-256' } },
      false,
      ['sign']
    );
    
    const hash = await crypto.subtle.sign(
      'HMAC',
      key,
      encoder.encode(salt)
    );
    
    // 将哈希转换为Base64
    const hashBase64 = btoa(
      String.fromCharCode(...new Uint8Array(hash))
    );
    
    // 返回格式化的密码哈希
    return `sha256$1$${salt}$${hashBase64}`;
  } catch (error) {
    console.error('密码哈希过程中出错:', error);
    throw error;
  }
}

// 生成随机字符串作为盐值
function generateRandomString(length) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  const randomValues = new Uint8Array(length);
  crypto.getRandomValues(randomValues);
  
  for (let i = 0; i < length; i++) {
    result += chars.charAt(randomValues[i] % chars.length);
  }
  
  return result;
}

// 从请求中提取用户信息
export async function getUserFromRequest(request, secret) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  const token = authHeader.substring(7);
  try {
    const encoder = new TextEncoder();
    const secretKey = encoder.encode(secret);
    const { payload } = await jwtVerify(token, secretKey);
    
    return payload;
  } catch (error) {
    console.error('JWT verification failed:', error);
    return null;
  }
} 