import dayjs from 'dayjs'

/**
 * 格式化日期
 * @param {string|Date} date 日期
 * @param {string} format 格式，默认为'YYYY-MM-DD'
 * @returns {string} 格式化后的日期字符串
 */
export function formatDate(date, format = 'YYYY-MM-DD') {
  if (!date) return ''
  return dayjs(date).format(format)
}

/**
 * 格式化日期时间
 * @param {string|Date} date 日期时间
 * @param {string} format 格式，默认为'YYYY-MM-DD HH:mm:ss'
 * @returns {string} 格式化后的日期时间字符串
 */
export function formatDateTime(date, format = 'YYYY-MM-DD HH:mm:ss') {
  if (!date) return ''
  return dayjs(date).format(format)
}

/**
 * 格式化日期范围
 * @param {string|Date} startDate 开始日期
 * @param {string|Date} endDate 结束日期
 * @param {boolean} ongoing 是否持续中
 * @returns {string} 格式化后的日期范围字符串
 */
export function formatDateRange(startDate, endDate, ongoing = false) {
  if (!startDate) return ''
  const start = formatDate(startDate)
  if (ongoing) return `${start} 至 今`
  return endDate ? `${start} 至 ${formatDate(endDate)}` : start
}

/**
 * 格式化案件类型
 * @param {Array} types 类型数组
 * @returns {string} 格式化后的类型字符串
 */
export function formatCaseTypes(types) {
  if (!types || !types.length) return ''
  return types.join('、')
} 