import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { jwt } from 'hono/jwt';

import { authRoutes } from './routes/auth';
import { userRoutes } from './routes/users';
import { caseRoutes } from './routes/cases';
import { fileRoutes } from './routes/files';
import { hashPassword } from './utils/auth';

// 创建 Hono 应用
const app = new Hono();

// 配置 CORS
app.use('*', cors({
  origin: ['*', 'https://challenges.cloudflare.com'],
  allowHeaders: ['Authorization', 'Content-Type'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  exposeHeaders: ['Authorization'],
  maxAge: 86400,
  credentials: true
}));

// 健康检查端点
app.get('/health', (c) => {
  const environment = c.env.ENV || 'production';
  console.log(`当前环境: ${environment}`);
  
  return c.json({ 
    status: 'healthy',
    environment,
    database: c.env.DB ? 'connected' : 'not connected'
  });
});

// 环境信息端点
app.get('/api/v1/environment', (c) => {
  return c.json({ 
    environment: c.env.ENV || 'production'
  });
});

// 初始化系统管理员账户
async function initializeAdmin(env) {
  if (!env.DB) {
    console.error('数据库未连接，无法初始化管理员账户');
    return;
  }

  try {
    // 检查是否已有管理员用户
    const adminCheck = await env.DB.prepare(
      'SELECT COUNT(*) as count FROM users WHERE is_superuser = 1'
    ).run();
    
    const adminCount = adminCheck.results?.[0]?.count || 0;
    
    // 如果已经有管理员用户，不需要创建
    if (adminCount > 0) {
      console.log('系统中已有管理员账户，跳过初始化');
      return;
    }
    
    // 从环境变量获取管理员凭据
    const adminUsername = env.ADMIN_USERNAME;
    const adminPassword = env.ADMIN_PASSWORD;
    
    // 验证环境变量是否设置
    if (!adminUsername || !adminPassword) {
      console.error('未设置ADMIN_USERNAME或ADMIN_PASSWORD环境变量，无法创建初始管理员');
      return;
    }
    
    // 对密码进行哈希处理
    const hashedPassword = await hashPassword(adminPassword);
    
    // 创建管理员用户
    await env.DB.prepare(`
      INSERT INTO users (username, hashed_password, email, full_name, is_active, is_superuser)
      VALUES (?1, ?2, ?3, ?4, 1, 1)
    `).bind(
      adminUsername,
      hashedPassword,
      `${adminUsername}@example.com`, // 默认邮箱
      '系统管理员'                     // 默认全名
    ).run();
    
    console.log(`成功创建初始管理员账户: ${adminUsername}`);
  } catch (error) {
    console.error('初始化管理员账户失败:', error);
  }
}

// API 路由
const api = new Hono();

// 身份验证路由（不需要 JWT 验证）
api.route('/auth', authRoutes);

// 需要 JWT 验证的路由
api.use('*', async (c, next) => {
  // 公共端点无需认证
  const publicPaths = [
    '/auth/login',       // 登录接口无需认证
    '/files/view/',      // 图片查看接口无需认证
    '/cases/shared/'     // 案件分享接口无需认证
  ];
  
  // 检查请求路径是否是公共路径
  const path = c.req.path;
  if (publicPaths.some(publicPath => path.endsWith(publicPath) || path.includes(publicPath))) {
    return next();
  }
  
  // 获取请求头中的Authorization
  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ 
      error: '未提供有效的授权令牌',
      message: '请登录后再访问此API',
      code: 'UNAUTHORIZED'
    }, 401);
  }
  
  // JWT 验证中间件
  try {
    const jwtMiddleware = jwt({
      secret: c.env.JWT_SECRET,
    });
    
    return jwtMiddleware(c, next);
  } catch (error) {
    console.error('JWT验证错误:', error);
    return c.json({ 
      error: '无效的授权令牌',
      message: '登录凭证已过期或无效，请重新登录',
      code: 'INVALID_TOKEN'
    }, 401);
  }
});

// 受保护的路由
api.route('/users', userRoutes);
api.route('/cases', caseRoutes);
api.route('/files', fileRoutes);

// 挂载 API 到 /api/v1 前缀
app.route('/api/v1', api);

// 导出 fetch 处理程序
export default {
  async fetch(request, env, ctx) {
    // 记录当前环境
    console.log(`Worker运行在 ${env.ENV || 'production'} 环境`);
    
    // 初始化管理员账户
    await initializeAdmin(env);
    
    // 解析URL
    const url = new URL(request.url);
    
    // 检查是否是API请求
    if (url.pathname.startsWith('/api/')) {
      // 将环境变量绑定到请求上下文
      return app.fetch(request, env, ctx);
    }
    
    // 优先通过 Assets 绑定处理静态资源
    try {
      // 直接尝试从 Assets 获取资源
      const assetUrl = new URL(request.url);
      const pathname = assetUrl.pathname.startsWith('/') ? assetUrl.pathname.substring(1) : assetUrl.pathname;
      
      // 对有扩展名的请求，直接尝试获取对应资源
      if (pathname.includes('.')) {
        try {
          // 使用fetch方法而不是get方法
          const assetResponse = await env.ASSETS.fetch(new Request(`http://assets.local/${pathname}`));
          if (assetResponse.ok) {
            return assetResponse;
          }
        } catch (assetError) {
          console.log(`无法获取资源 ${pathname}:`, assetError);
        }
      }
      
      // 对于前端路由(没有扩展名的路径)或直接访问根路径，返回index.html
      try {
        // 使用fetch方法获取index.html
        const indexResponse = await env.ASSETS.fetch(new Request('http://assets.local/index.html'));
        if (indexResponse.ok) {
          return new Response(await indexResponse.text(), { 
            headers: { 'Content-Type': 'text/html' } 
          });
        }
      } catch (indexError) {
        console.log('无法获取index.html:', indexError);
      }
      
      // 如果无法获取index.html，返回一个简单的HTML
      return new Response(
        '<html><body><h1>案件管理系统</h1><p>前端资源未部署</p></body></html>',
        { 
          headers: { 'Content-Type': 'text/html' } 
        }
      );
    } catch (error) {
      console.error('静态资源处理错误:', error);
      return new Response(
        '<html><body><h1>服务器错误</h1><p>抱歉，无法加载请求的资源。</p></body></html>',
        { 
          status: 500,
          headers: { 'Content-Type': 'text/html' }
        }
      );
    }
  }
}; 