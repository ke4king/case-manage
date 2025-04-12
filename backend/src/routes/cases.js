import { Hono } from 'hono';
import { processRowResult, parseJsonFields, objectToParams, buildUpdateQuery } from '../utils/db';

const caseRoutes = new Hono();

// 获取案件列表
caseRoutes.get('/', async (c) => {
  try {
    const currentUser = c.get('jwtPayload');
    
    // 解析分页参数
    const skip = parseInt(c.req.query('skip')) || 0;
    const limit = parseInt(c.req.query('limit')) || 10;
    
    // 基础查询
    let query = `
      SELECT c.*, u.username as creator_name
      FROM cases c
      LEFT JOIN users u ON c.created_by = u.id
      WHERE c.is_deleted = 0
    `;
    
    let countQuery = `
      SELECT COUNT(*) as total
      FROM cases c
      WHERE c.is_deleted = 0
    `;
    
    // 准备查询参数数组
    const queryParams = [];
    
    // 如果不是超级管理员，只能看到自己创建的案件
    if (!currentUser.is_superuser) {
      query += ` AND c.created_by = ?`;
      countQuery += ` AND c.created_by = ?`;
      queryParams.push(currentUser.id);
    }
    
    // 添加排序和分页
    query += ` ORDER BY c.created_at DESC LIMIT ? OFFSET ?`;
    const paginationParams = [...queryParams, limit, skip];
    
    // 执行查询
    console.log('执行查询:', query, '参数:', paginationParams);
    const result = await c.env.DB.prepare(query).bind(...paginationParams).run();
    
    // 处理 JSON 字段
    const cases = [];
    if (result && result.results) {
      for (const caseItem of result.results) {
        cases.push(parseJsonFields(caseItem, ['case_types', 'platform_types', 'server_location', 'permissions']));
      }
    }
    
    // 获取总数
    console.log('执行计数查询:', countQuery, '参数:', queryParams);
    const countResult = await c.env.DB.prepare(countQuery).bind(...queryParams).run();
    const total = countResult && countResult.results && countResult.results[0] ? countResult.results[0].total : 0;
    
    return c.json({ 
      cases,
      pagination: {
        total,
        skip,
        limit
      }
    });
  } catch (error) {
    console.error('Get cases error:', error);
    return c.json({ error: '获取案件列表失败: ' + error.message }, 500);
  }
});

// 创建新案件
caseRoutes.post('/', async (c) => {
  try {
    const currentUser = c.get('jwtPayload');
    const data = await c.req.json();
    
    // 必要字段验证
    const requiredFields = ['case_name', 'case_types', 'platform_types', 'operation_date'];
    for (const field of requiredFields) {
      if (!data[field]) {
        return c.json({ error: `缺少必要字段: ${field}` }, 400);
      }
    }
    
    // 将operation_start_date转换回operation_date (兼容处理)
    if (data.operation_start_date && !data.operation_date) {
      data.operation_date = data.operation_start_date;
      delete data.operation_start_date;
    }
    
    // 准备数据
    const caseData = { ...data };
    
    // 添加创建人信息
    caseData.created_by = currentUser.id;
    
    // 移除前端可能传入的敏感字段
    delete caseData.id;
    delete caseData.created_at;
    delete caseData.updated_at;
    delete caseData.is_deleted;
    delete caseData.deleted_at;
    delete caseData.creator_name;
    
    // 自动生成案件编号
    const timestamp = new Date().getTime();
    const randomPart = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    const prefix = 'CASE';
    caseData.case_number = `${prefix}-${timestamp.toString().slice(-6)}-${randomPart}`;
    
    // 生成32位随机token用于分享功能
    caseData.token = Array.from(crypto.getRandomValues(new Uint8Array(16)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    
    // 处理JSON字段，将它们转换为字符串
    const jsonFields = ['case_types', 'platform_types', 'server_location', 'permissions'];
    for (const field of jsonFields) {
      if (caseData[field] && typeof caseData[field] === 'object') {
        caseData[field] = JSON.stringify(caseData[field]);
      }
    }
    
    // 准备数据
    const columns = Object.keys(caseData).join(', ');
    const placeholders = Object.keys(caseData).map((_, index) => `?${index + 1}`).join(', ');
    const params = Object.values(caseData);
    
    console.log('插入数据:', { columns, placeholders, params });
    
    // 插入数据
    const query = `INSERT INTO cases (${columns}) VALUES (${placeholders})`;
    const result = await c.env.DB.prepare(query).bind(...params).run();
    
    if (!result || !result.meta || !result.meta.last_row_id) {
      return c.json({ error: '创建案件失败' }, 500);
    }
    
    // 查询新创建的案件
    const caseResult = await c.env.DB.prepare(
      'SELECT * FROM cases WHERE id = ?'
    )
      .bind(result.meta.last_row_id)
      .run();
    
    const newCase = caseResult.results[0];
    
    // 处理 JSON 字段
    const parsedCase = parseJsonFields(newCase, jsonFields);
    
    return c.json({ 
      message: '案件创建成功',
      case: parsedCase 
    }, 201);
  } catch (error) {
    console.error('Create case error:', error);
    return c.json({ error: '创建案件失败: ' + error.message }, 500);
  }
});

// 获取单个案件详情
caseRoutes.get('/:id', async (c) => {
  try {
    const caseId = c.req.param('id');
    const currentUser = c.get('jwtPayload');
    
    console.log('获取案件详情:', caseId);
    
    // 使用参数化查询获取案件详情
    const result = await c.env.DB.prepare(`
      SELECT c.*, u.username as creator_name
      FROM cases c
      LEFT JOIN users u ON c.created_by = u.id
      WHERE c.id = ? AND c.is_deleted = 0
    `)
      .bind(caseId)
      .run();
    
    if (!result || !result.results || result.results.length === 0) {
      return c.json({ error: '案件不存在或已删除' }, 404);
    }
    
    const caseItem = result.results[0];
    
    // 权限检查：非超级管理员只能查看自己创建的案件
    if (!currentUser.is_superuser && caseItem.created_by !== currentUser.id) {
      return c.json({ error: '权限不足' }, 403);
    }
    
    // 处理 JSON 字段
    const jsonFields = ['case_types', 'platform_types', 'server_location', 'permissions'];
    const parsedCase = parseJsonFields(caseItem, jsonFields);
    
    // 查询案件的文件列表
    const filesResult = await c.env.DB.prepare(`
      SELECT * FROM case_files 
      WHERE case_id = ? 
      ORDER BY uploaded_at DESC
    `)
      .bind(caseId)
      .run();
    
    return c.json({ 
      case: parsedCase,
      files: filesResult.results || [] 
    });
  } catch (error) {
    console.error('Get case error:', error);
    return c.json({ error: '获取案件详情失败: ' + error.message }, 500);
  }
});

// 更新案件信息
caseRoutes.put('/:id', async (c) => {
  try {
    const caseId = c.req.param('id');
    const currentUser = c.get('jwtPayload');
    const data = await c.req.json();
    
    // 查询案件
    const caseResult = await c.env.DB.prepare(
      'SELECT * FROM cases WHERE id = ? AND is_deleted = 0'
    )
      .bind(caseId)
      .run();
    
    if (!caseResult || !caseResult.results || caseResult.results.length === 0) {
      return c.json({ error: '案件不存在或已删除' }, 404);
    }
    
    const caseItem = caseResult.results[0];
    
    // 权限检查：非超级管理员只能更新自己创建的案件
    if (!currentUser.is_superuser && caseItem.created_by !== currentUser.id) {
      return c.json({ error: '权限不足' }, 403);
    }
    
    // 处理operation_start_date字段映射到operation_date (兼容处理)
    if (data.operation_start_date && !data.operation_date) {
      data.operation_date = data.operation_start_date;
      delete data.operation_start_date;
    }
    
    // 准备更新数据
    const updateData = { ...data };
    
    // 移除不应该被更新的字段
    delete updateData.id;
    delete updateData.created_at;
    delete updateData.updated_at;
    delete updateData.is_deleted;
    delete updateData.deleted_at;
    delete updateData.created_by;
    delete updateData.creator_name;
    
    // 处理JSON字段，将它们转换为字符串
    const jsonFields = ['case_types', 'platform_types', 'server_location', 'permissions'];
    for (const field of jsonFields) {
      if (updateData[field] && typeof updateData[field] === 'object') {
        updateData[field] = JSON.stringify(updateData[field]);
      }
    }
    
    if (Object.keys(updateData).length === 0) {
      return c.json({ error: '没有提供有效的更新字段' }, 400);
    }
    
    // 构建SET部分
    const setParts = Object.keys(updateData).map(key => `${key} = ?`).join(', ');
    const params = [...Object.values(updateData), caseId];
    
    // 更新案件信息
    const query = `UPDATE cases SET ${setParts}, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND is_deleted = 0`;
    console.log('更新查询:', query, '参数:', params);
    
    await c.env.DB.prepare(query).bind(...params).run();
    
    // 查询更新后的案件信息
    const updatedResult = await c.env.DB.prepare(`
      SELECT c.*, u.username as creator_name
      FROM cases c
      LEFT JOIN users u ON c.created_by = u.id
      WHERE c.id = ? AND c.is_deleted = 0
    `)
      .bind(caseId)
      .run();
    
    const updatedCase = updatedResult.results[0];
    
    // 处理 JSON 字段
    const parsedCase = parseJsonFields(updatedCase, jsonFields);
    
    return c.json({ 
      message: '案件信息更新成功',
      case: parsedCase 
    });
  } catch (error) {
    console.error('Update case error:', error);
    return c.json({ error: '更新案件信息失败: ' + error.message }, 500);
  }
});

// 软删除案件
caseRoutes.delete('/:id', async (c) => {
  try {
    const caseId = c.req.param('id');
    const currentUser = c.get('jwtPayload');
    
    // 查询案件
    const caseResult = await c.env.DB.prepare(
      'SELECT * FROM cases WHERE id = ? AND is_deleted = 0'
    )
      .bind(caseId)
      .run();
    
    if (!caseResult || !caseResult.results || caseResult.results.length === 0) {
      return c.json({ error: '案件不存在或已删除' }, 404);
    }
    
    const caseItem = caseResult.results[0];
    
    // 权限检查：非超级管理员只能删除自己创建的案件
    if (!currentUser.is_superuser && caseItem.created_by !== currentUser.id) {
      return c.json({ error: '权限不足' }, 403);
    }
    
    // 软删除案件
    await c.env.DB.prepare(`
      UPDATE cases 
      SET is_deleted = 1, deleted_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `)
      .bind(caseId)
      .run();
    
    return c.json({ message: '案件已删除' });
  } catch (error) {
    console.error('Delete case error:', error);
    return c.json({ error: '删除案件失败: ' + error.message }, 500);
  }
});

// 通过token获取案件（无需登录）
caseRoutes.get('/shared/:token', async (c) => {
  try {
    const token = c.req.param('token');
    
    console.log('通过token获取案件:', token);
    
    if (!token || token.length !== 32) {
      return c.json({ error: '无效的分享链接' }, 400);
    }
    
    // 使用参数化查询获取案件详情
    const result = await c.env.DB.prepare(`
      SELECT c.*, u.username as creator_name
      FROM cases c
      LEFT JOIN users u ON c.created_by = u.id
      WHERE c.token = ? AND c.is_deleted = 0
    `)
      .bind(token)
      .run();
    
    if (!result || !result.results || result.results.length === 0) {
      return c.json({ error: '案件不存在或已删除' }, 404);
    }
    
    const caseItem = result.results[0];
    
    // 处理 JSON 字段
    const jsonFields = ['case_types', 'platform_types', 'server_location', 'permissions'];
    const parsedCase = parseJsonFields(caseItem, jsonFields);
    
    // 查询案件的文件列表
    const filesResult = await c.env.DB.prepare(`
      SELECT * FROM case_files 
      WHERE case_id = ? 
      ORDER BY uploaded_at DESC
    `)
      .bind(caseItem.id)
      .run();
    
    return c.json({ 
      case: parsedCase,
      files: filesResult.results || [] 
    });
  } catch (error) {
    console.error('Get shared case error:', error);
    return c.json({ error: '获取共享案件详情失败: ' + error.message }, 500);
  }
});

// 导出路由
export { caseRoutes };