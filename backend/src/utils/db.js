// 处理从 D1 数据库获取的数据
export function processRowResult(result) {
  if (!result || !result.results || result.results.length === 0) {
    return null;
  }

  return result.results[0];
}

// 处理 JSON 字段的解析
export function parseJsonFields(row, fields = []) {
  if (!row) return row;
  
  const result = { ...row };
  
  fields.forEach((field) => {
    if (result[field] && typeof result[field] === 'string') {
      try {
        result[field] = JSON.parse(result[field]);
      } catch (e) {
        console.error(`Error parsing JSON field ${field}:`, e);
      }
    }
  });
  
  return result;
}

// 将对象转换为 SQL 查询参数
export function objectToParams(obj, exclude = []) {
  const entries = Object.entries(obj).filter(([key]) => !exclude.includes(key));
  
  // 创建参数集合
  const params = {};
  // 创建列名集合
  const columns = entries.map(([key]) => key);
  // 创建参数名集合
  const placeholders = entries.map(([key], index) => `?${index+1}`);
  // 填充参数值
  entries.forEach(([_, value], index) => {
    params[`${index+1}`] = typeof value === 'object' ? JSON.stringify(value) : value;
  });
  
  return {
    columns: columns.join(', '),
    placeholders: placeholders.join(', '),
    params
  };
}

// 构建更新查询
export function buildUpdateQuery(obj, exclude = []) {
  const entries = Object.entries(obj).filter(([key]) => !exclude.includes(key));
  
  // 创建参数集合
  const params = {};
  // 创建 SET 子句
  const setParts = entries.map(([key], index) => `${key} = ?${index+1}`);
  // 填充参数值
  entries.forEach(([_, value], index) => {
    params[`${index+1}`] = typeof value === 'object' ? JSON.stringify(value) : value;
  });
  
  return {
    setParts: setParts.join(', '),
    params
  };
} 