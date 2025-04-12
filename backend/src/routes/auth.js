import { Hono } from 'hono';
import { generateJWT, verifyPassword } from '../utils/auth';
import { processRowResult } from '../utils/db';

const authRoutes = new Hono();

// 验证 Turnstile 响应
async function verifyTurnstile(token, remoteip, secretKey) {
  const TURNSTILE_VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
  
  console.log('验证 Turnstile 响应开始', { remoteip });
  
  try {
    const formData = new FormData();
    formData.append('secret', secretKey);
    formData.append('response', token);
    if (remoteip) {
      formData.append('remoteip', remoteip);
    }
    
    console.log('发送验证请求到 Cloudflare');
    
    const result = await fetch(TURNSTILE_VERIFY_URL, {
      method: 'POST',
      body: formData
    });
    
    const verifyResult = await result.json();
    console.log('Turnstile 验证结果:', verifyResult);
    
    return verifyResult;
  } catch (error) {
    console.error('Turnstile verification error:', error);
    return { success: false, 'error-codes': ['internal-error'] };
  }
}

// 获取验证码
authRoutes.post('/captcha', async (c) => {
  try {
    // 简单验证码实现，实际项目中应使用更安全的方法
    // 这里只是模拟返回一个假的验证码
    
    // 生成一个随机的4位数字验证码
    const captchaCode = Math.floor(1000 + Math.random() * 9000).toString();
    
    // 在实际项目中，您应该将验证码存储在服务器端(如Redis)并关联到用户会话
    // 这里简化处理，直接返回验证码
    
    return c.json({
      success: true,
      captcha: captchaCode,
      expires_in: 300 // 验证码有效期5分钟
    });
  } catch (error) {
    console.error('Generate captcha error:', error);
    return c.json({ error: '生成验证码失败' }, 500);
  }
});

// 用户登录
authRoutes.post('/login', async (c) => {
  try {
    const requestData = await c.req.json();
    const { username, password, turnstileResponse } = requestData;

    console.log('接收到登录请求', { 
      username, 
      hasTurnstileResponse: !!turnstileResponse 
    });

    // 参数验证
    if (!username || !password) {
      return c.json({ error: '用户名和密码不能为空' }, 400);
    }
    
    // 验证 Turnstile 响应
    if (!turnstileResponse) {
      console.log('未提供 turnstileResponse');
      return c.json({ error: '请完成人机验证' }, 400);
    }
    
    // 获取客户端 IP
    const clientIP = c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For') || '127.0.0.1';
    console.log('客户端 IP:', clientIP);
    
    // 检查是否配置了Turnstile密钥
    const turnstileSecretKey = c.env.TURNSTILE_SECRET_KEY;
    if (!turnstileSecretKey) {
      console.error('未配置Turnstile密钥，跳过验证');
    } else {
      console.log('开始 Turnstile 验证');
      // 验证 Turnstile 响应
      const turnstileResult = await verifyTurnstile(turnstileResponse, clientIP, turnstileSecretKey);
      
      if (!turnstileResult.success) {
        const errorCodes = turnstileResult['error-codes'] || [];
        let errorMessage = '人机验证失败';
        
        console.error('Turnstile 验证失败:', errorCodes);
        
        // 提供更具体的错误信息
        if (errorCodes.includes('timeout-or-duplicate')) {
          errorMessage = '验证码已过期或已使用，请重新验证';
        } else if (errorCodes.includes('invalid-input-response')) {
          errorMessage = '无效的验证码响应';
        }
        
        return c.json({ 
          error: errorMessage, 
          'error-codes': errorCodes 
        }, 400);
      }
      console.log('Turnstile 验证通过');
    }

    // 查询用户
    const result = await c.env.DB.prepare(
      'SELECT id, username, hashed_password, is_active, is_superuser FROM users WHERE username = ?1'
    )
      .bind(username)
      .run();

    const user = processRowResult(result);

    // 用户不存在
    if (!user) {
      return c.json({ error: '用户名或密码错误' }, 401);
    }

    // 用户被禁用
    if (user.is_active !== 1) {
      return c.json({ error: '账号已被禁用' }, 403);
    }

    // 验证密码
    const isValid = await verifyPassword(password, user.hashed_password);
    
    if (!isValid) {
      return c.json({ error: '用户名或密码错误' }, 401);
    }

    // 生成 JWT
    const token = await generateJWT(user, c.env.JWT_SECRET);

    return c.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        is_superuser: user.is_superuser
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return c.json({ error: '登录失败，服务器错误' }, 500);
  }
});

// 验证当前令牌
authRoutes.get('/verify', async (c) => {
  try {
    // 从请求中获取用户信息（在 JWT 中间件通过后可用）
    const user = c.get('jwtPayload');
    
    if (!user) {
      return c.json({ valid: false }, 401);
    }
    
    return c.json({ 
      valid: true, 
      user: {
        id: user.id,
        username: user.username,
        is_superuser: user.is_superuser 
      }
    });
  } catch (error) {
    console.error('Token verification error:', error);
    return c.json({ valid: false, error: '验证失败' }, 500);
  }
});

export { authRoutes }; 