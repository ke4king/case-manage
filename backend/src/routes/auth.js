import { Hono } from 'hono';
import { generateJWT, verifyPassword } from '../utils/auth';
import { processRowResult } from '../utils/db';

const authRoutes = new Hono();

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
    console.log('收到登录请求');
    const requestData = await c.req.json();
    console.log('登录请求数据:', JSON.stringify(requestData));
    
    const { username, password } = requestData;

    // 参数验证
    if (!username || !password) {
      console.log('登录失败: 用户名或密码为空');
      return c.json({ error: '用户名和密码不能为空' }, 400);
    }

    // 查询用户
    console.log('查询用户:', username);
    const result = await c.env.DB.prepare(
      'SELECT id, username, hashed_password, is_active, is_superuser FROM users WHERE username = ?1'
    )
      .bind(username)
      .run();

    const user = processRowResult(result);
    console.log('查询结果:', user ? '找到用户' : '用户不存在');

    // 用户不存在
    if (!user) {
      console.log('登录失败: 用户不存在');
      return c.json({ error: '用户名或密码错误' }, 401);
    }

    // 用户被禁用
    if (user.is_active !== 1) {
      console.log('登录失败: 用户被禁用');
      return c.json({ error: '账号已被禁用' }, 403);
    }

    // 验证密码
    console.log('开始验证密码');
    const isValid = await verifyPassword(password, user.hashed_password);
    console.log('密码验证结果:', isValid ? '验证通过' : '验证失败');
    
    if (!isValid) {
      console.log('登录失败: 密码错误');
      return c.json({ error: '用户名或密码错误' }, 401);
    }

    // 生成 JWT
    console.log('生成JWT令牌');
    const token = await generateJWT(user, c.env.JWT_SECRET);
    console.log('JWT令牌生成成功');

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