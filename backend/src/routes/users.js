import { Hono } from 'hono';
import { processRowResult, objectToParams, buildUpdateQuery } from '../utils/db';
import { verifyPassword, hashPassword } from '../utils/auth';

const userRoutes = new Hono();

// 获取用户列表（仅限管理员）
userRoutes.get('/', async (c) => {
  try {
    // 从请求中获取用户信息
    const currentUser = c.get('jwtPayload');
    
    // 权限检查：仅超级管理员可访问
    if (!currentUser || !currentUser.is_superuser) {
      return c.json({ error: '权限不足' }, 403);
    }
    
    // 查询所有用户
    const result = await c.env.DB.prepare(
      'SELECT id, username, email, full_name, is_active, is_superuser, created_at FROM users ORDER BY id DESC'
    ).run();
    
    return c.json({ users: result.results || [] });
  } catch (error) {
    console.error('Get users error:', error);
    return c.json({ error: '获取用户列表失败' }, 500);
  }
});

// 修改用户密码
userRoutes.put('/:id/password', async (c) => {
  try {
    const userId = c.req.param('id');
    const currentUser = c.get('jwtPayload');
    const { old_password, new_password } = await c.req.json();
    
    // 权限检查：用户只能修改自己的密码，管理员可以修改任何人的密码
    if (!currentUser || (currentUser.id !== parseInt(userId) && !currentUser.is_superuser)) {
      return c.json({ error: '权限不足' }, 403);
    }
    
    // 参数验证
    if (!new_password || new_password.length < 8) {
      return c.json({ error: '新密码长度必须至少为8个字符' }, 400);
    }
    
    // 如果是普通用户修改自己的密码，需要验证旧密码
    if (currentUser.id === parseInt(userId) && !currentUser.is_superuser) {
      if (!old_password) {
        return c.json({ error: '必须提供旧密码' }, 400);
      }
      
      // 获取用户当前密码哈希
      const userResult = await c.env.DB.prepare(
        'SELECT hashed_password FROM users WHERE id = ?1'
      )
        .bind(userId)
        .run();
      
      const user = processRowResult(userResult);
      
      if (!user) {
        return c.json({ error: '用户不存在' }, 404);
      }
      
      // 验证旧密码
      const isValid = await verifyPassword(old_password, user.hashed_password);
      
      if (!isValid) {
        return c.json({ error: '旧密码不正确' }, 401);
      }
    }
    
    // 生成新密码的哈希
    const hashedPassword = await hashPassword(new_password);
    
    // 更新密码
    await c.env.DB.prepare(
      'UPDATE users SET hashed_password = ?1, updated_at = CURRENT_TIMESTAMP WHERE id = ?2'
    )
      .bind(hashedPassword, userId)
      .run();
    
    return c.json({ message: '密码修改成功' });
  } catch (error) {
    console.error('Change password error:', error);
    return c.json({ error: '修改密码失败' }, 500);
  }
});

// 获取单个用户信息
userRoutes.get('/:id', async (c) => {
  try {
    const userId = c.req.param('id');
    const currentUser = c.get('jwtPayload');
    
    // 权限检查：仅允许用户查看自己或超级管理员查看任何人
    if (!currentUser || (currentUser.id !== parseInt(userId) && !currentUser.is_superuser)) {
      return c.json({ error: '权限不足' }, 403);
    }
    
    // 查询用户
    const result = await c.env.DB.prepare(
      'SELECT id, username, email, full_name, is_active, is_superuser, created_at FROM users WHERE id = ?1'
    )
      .bind(userId)
      .run();
    
    const user = processRowResult(result);
    
    if (!user) {
      return c.json({ error: '用户不存在' }, 404);
    }
    
    return c.json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    return c.json({ error: '获取用户信息失败' }, 500);
  }
});

// 更新用户信息
userRoutes.put('/:id', async (c) => {
  try {
    const userId = c.req.param('id');
    const currentUser = c.get('jwtPayload');
    const data = await c.req.json();
    
    // 权限检查：仅允许用户更新自己或超级管理员更新任何人
    if (!currentUser || (currentUser.id !== parseInt(userId) && !currentUser.is_superuser)) {
      return c.json({ error: '权限不足' }, 403);
    }
    
    // 排除不允许更新的字段
    const excludeFields = ['id', 'username', 'is_superuser', 'created_at', 'updated_at', 'hashed_password'];
    
    // 如果不是超级管理员，还需排除 is_active 字段
    if (!currentUser.is_superuser) {
      excludeFields.push('is_active');
    }
    
    // 构建更新查询
    const { setParts, params } = buildUpdateQuery(data, excludeFields);
    
    // 如果没有需要更新的字段
    if (!setParts) {
      return c.json({ error: '没有提供有效的更新字段' }, 400);
    }
    
    // 更新用户信息
    const query = `UPDATE users SET ${setParts}, updated_at = CURRENT_TIMESTAMP WHERE id = ?${Object.keys(params).length + 1}`;
    params[Object.keys(params).length + 1] = userId;
    
    await c.env.DB.prepare(query).bind(params).run();
    
    // 查询更新后的用户信息
    const result = await c.env.DB.prepare(
      'SELECT id, username, email, full_name, is_active, is_superuser, created_at FROM users WHERE id = ?1'
    )
      .bind(userId)
      .run();
    
    const user = processRowResult(result);
    
    return c.json({ 
      message: '用户信息更新成功',
      user 
    });
  } catch (error) {
    console.error('Update user error:', error);
    return c.json({ error: '更新用户信息失败' }, 500);
  }
});

export { userRoutes }; 