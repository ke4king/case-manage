import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

/**
 * 将DOM元素导出为PDF
 * @param {HTMLElement} element 要导出的DOM元素
 * @param {string} fileName 文件名（不带扩展名）
 * @param {boolean} openInNewWindow 是否在新窗口打开
 */
export async function exportElementToPDF(element, fileName = 'export', openInNewWindow = false) {
  try {
    // 创建截图
    const canvas = await html2canvas(element, {
      useCORS: true,
      scale: 2,
      logging: false,
      allowTaint: true
    })
    
    // 计算PDF的尺寸
    const contentWidth = canvas.width
    const contentHeight = canvas.height
    
    // 根据内容尺寸计算PDF的尺寸和方向
    const orientation = contentWidth > contentHeight ? 'landscape' : 'portrait'
    const imgWidth = orientation === 'landscape' ? 297 : 210
    const imgHeight = (imgWidth * contentHeight) / contentWidth
    
    // 创建PDF文档
    const pdf = new jsPDF(orientation, 'mm', 'a4')
    const pageHeight = pdf.internal.pageSize.getHeight()
    
    // 计算分页
    let position = 0
    const imgData = canvas.toDataURL('image/jpeg', 1.0)
    
    // 添加首页
    pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight)
    position -= pageHeight
    
    // 处理多页的情况
    while (position > -imgHeight) {
      pdf.addPage()
      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight)
      position -= pageHeight
    }
    
    // 保存PDF
    if (openInNewWindow) {
      // 在新窗口打开
      const pdfBlob = pdf.output('blob')
      window.open(URL.createObjectURL(pdfBlob))
    } else {
      // 直接下载
      pdf.save(`${fileName}.pdf`)
    }
    
    return true
  } catch (error) {
    console.error('导出PDF失败:', error)
    return false
  }
} 