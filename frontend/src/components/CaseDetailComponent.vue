<template>
    <div v-loading="loading" class="case-detail-component">
      <template v-if="caseData">
        <div class="detail-header">
          <h2>{{ caseData.case_name }}</h2>
          <div class="case-number">案件编号: {{ caseData.case_number }}</div>
          <div class="header-actions">
            <el-button type="primary" size="small" class="export-btn" @click="exportPDF">
              <el-icon><Printer /></el-icon>
              <span>导出PDF</span>
            </el-button>
          </div>
        </div>
        
        <el-divider content-position="left">基本信息</el-divider>
        
        <!-- 基本信息 -->
        <div class="info-row">
          <div class="info-card">
            <div class="info-card-label">案件类型</div>
            <div class="info-card-value">{{ formatCaseTypes(caseData.case_types) }}</div>
          </div>
          <div class="info-card">
            <div class="info-card-label">平台类型</div>
            <div class="info-card-value">{{ formatCaseTypes(caseData.platform_types) }}</div>
          </div>
          <div class="info-card">
            <div class="info-card-label">运营时间</div>
            <div class="info-card-value">{{ formatDate(caseData.operation_date) }}</div>
          </div>
          <div class="info-card">
            <div class="info-card-label">客服信息</div>
            <div class="info-card-value">{{ caseData.customer_service || '无' }}</div>
          </div>
          <div class="info-card">
            <div class="info-card-label">更新时间</div>
            <div class="info-card-value">{{ caseData.updated_at ? formatDate(caseData.updated_at) : (caseData.created_at ? formatDate(caseData.created_at) : '无') }}</div>
          </div>
        </div>
        
        <!-- 其他信息 -->
          <div v-if="caseData.other_info" class="section analysis-section">
            <div class="section-header">
              <el-icon><Shop /></el-icon>
              <h3>其他信息</h3>
            </div>
            <div class="markdown-content">
              <md-preview :modelValue="caseData.other_info" preview-theme="github" :config="mdPreviewConfig" />
            </div>
          </div>
        
        <el-divider content-position="left">技术信息</el-divider>
        
        <!-- 技术信息 -->
        <div class="info-row">
          <div class="info-card">
            <div class="info-card-label">CDN信息</div>
            <div class="info-card-value">{{ caseData.cdn_info || '无' }}</div>
          </div>
          <div class="info-card">
            <div class="info-card-label">服务器所在地</div>
            <div class="info-card-value primary-wrapper">
              <el-tag size="small" effect="light" type="primary"  v-if="formatServerLocation !== '未知'">
                <el-icon class="location-icon"><Location /></el-icon>
                {{ formatServerLocation }}
              </el-tag>
              <span v-else>未知</span>
            </div>
          </div>
          <div class="info-card">
            <div class="info-card-label">已获得权限</div>
            <div class="info-card-value permissions-wrapper">
              <template v-if="caseData.permissions && caseData.permissions.length > 0">
                <el-tag 
                  v-for="(perm, idx) in caseData.permissions" 
                  :key="idx"
                  size="small" 
                  class="permission-tag"
                  effect="light"
                >
                  {{ perm }}
                </el-tag>
              </template>
              <span v-else>无</span>
            </div>
          </div>
        </div>
        
        <!-- 数据分析 -->
        <template v-if="hasAnalysisData">
          <el-divider content-position="left">数据分析</el-divider>
          
          <!-- 平台数据分析 -->
          <div v-if="caseData.platform_analysis" class="section analysis-section">
            <div class="section-header">
              <el-icon><Monitor /></el-icon>
              <h3>平台数据分析</h3>
            </div>
            <div class="markdown-content">
              <md-preview :modelValue="caseData.platform_analysis" preview-theme="github" :config="mdPreviewConfig" />
            </div>
          </div>
          
          <!-- 代理数据分析 -->
          <div v-if="caseData.agent_analysis" class="section analysis-section">
            <div class="section-header">
              <el-icon><User /></el-icon>
              <h3>代理数据分析</h3>
            </div>
            <div class="markdown-content">
              <md-preview :modelValue="caseData.agent_analysis" preview-theme="github" :config="mdPreviewConfig" />
            </div>
          </div>
          
          <!-- 会员数据分析 -->
          <div v-if="caseData.member_analysis" class="section analysis-section">
            <div class="section-header">
              <el-icon><UserFilled /></el-icon>
              <h3>会员数据分析</h3>
            </div>
            <div class="markdown-content">
              <md-preview :modelValue="caseData.member_analysis" preview-theme="github" :config="mdPreviewConfig" />
            </div>
          </div>
        </template>
      </template>
      <div v-else-if="!loading" class="empty-case">
        <el-empty description="没有找到案件信息">
          <template #image>
            <el-icon :size="64"><DocumentDelete /></el-icon>
          </template>
        </el-empty>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, computed } from 'vue'
  import { ElMessage } from 'element-plus'
  import { 
    Document, 
    Download, 
    Location, 
    Monitor, 
    User, 
    UserFilled,
    DocumentDelete,
    Printer,
    Shop
  } from '@element-plus/icons-vue'
  import { formatCaseTypes, formatDate } from '@/utils/format'
  import { MdPreview } from 'md-editor-v3'
  import 'md-editor-v3/lib/preview.css'
  import { jsPDF } from 'jspdf'
  import html2canvas from 'html2canvas'
  
  // 定义props
  const props = defineProps({
    caseData: {
      type: Object,
      default: null
    },
    loading: {
      type: Boolean,
      default: false
    }
  })
  
  // 计算是否有数据分析
  const hasAnalysisData = computed(() => {
    if (!props.caseData) return false
    
    return props.caseData.platform_analysis || 
      props.caseData.agent_analysis || 
      props.caseData.member_analysis
  })
  
  // 格式化服务器位置，简化版本
  const formatServerLocation = computed(() => {
    if (!props.caseData || !props.caseData.server_location) return '未知';
    
    try {
      const location = typeof props.caseData.server_location === 'string' 
        ? JSON.parse(props.caseData.server_location) 
        : props.caseData.server_location;
        
      if (location.country) {
        // 中国大陆显示省市
        if (location.country === 'China' && location.province && location.city) {
          return `中国 ${location.province} ${location.city}`;
        } 
        // 港澳台使用本地化名称
        else if (['Hong Kong', 'Macao', 'Taiwan'].includes(location.country)) {
          const nameMap = {
            'Hong Kong': '中国香港',
            'Macao': '中国澳门',
            'Taiwan': '中国台湾'
          };
          return nameMap[location.country] || location.country;
        }
        // 其他国家
        else {
          return location.country;
        }
      } else if (location.province && location.city) {
        return `${location.province} ${location.city}`;
      } else {
        return JSON.stringify(location);
      }
    } catch (e) {
      return props.caseData.server_location;
    }
  })
  
  
  // Markdown 预览配置
  const mdPreviewConfig = {
    autoDetectCode: true,
    showCodeRowNumber: true
  };
  
  // PDF导出函数 - 使用jsPDF直接生成PDF而不使用打印
  const exportPDF = async () => {
    ElMessage.success('正在生成PDF，请稍候...');
    
    try {
      // 获取案例标题和编号用于文件名
      const title = props.caseData?.case_name || '案件详情';
      const caseNumber = props.caseData?.case_number || '未知编号';
      const filename = `${title}_${caseNumber}.pdf`;
      
      // 创建一个克隆组件用于处理
      const originalElement = document.querySelector('.case-detail-component');
      if (!originalElement) {
        ElMessage.error('无法获取案件详情内容');
        return;
      }
      
      // 创建临时容器用于渲染PDF内容
      const container = document.createElement('div');
      container.className = 'pdf-export-container';
      
      // 设置容器样式
      container.style.position = 'fixed';
      container.style.left = '-9999px';
      container.style.width = '794px'; // A4宽度，约等于210mm
      container.style.backgroundColor = 'white';
      container.style.padding = '30px';
      container.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", sans-serif';
      container.style.color = '#1e293b';
      
      // 克隆节点
      const contentToExport = originalElement.cloneNode(true);
      
      // 移除不需要的元素
      const headerActions = contentToExport.querySelector('.header-actions');
      if (headerActions) headerActions.remove();
      
      const attachmentActions = contentToExport.querySelectorAll('.attachment-actions');
      attachmentActions.forEach(el => el.remove());
      
      // 优化标题样式
      const titleElement = contentToExport.querySelector('h2');
      if (titleElement) {
        titleElement.style.fontSize = '28px';
        titleElement.style.textAlign = 'center';
        titleElement.style.margin = '0 0 12px 0';
        titleElement.style.color = '#1e293b';
        // 添加标识类，使其他处理能识别这是主标题
        titleElement.classList.add('case-title');
      }
      
      // 优化案件编号样式
      const caseNumberElement = contentToExport.querySelector('.case-number');
      if (caseNumberElement) {
        caseNumberElement.style.fontSize = '16px';
        caseNumberElement.style.textAlign = 'center';
        caseNumberElement.style.marginBottom = '25px';
        caseNumberElement.style.display = 'block';
        caseNumberElement.style.color = '#64748b';
      }
      
      // 优化间距设置
      const infoRows = contentToExport.querySelectorAll('.info-row');
      infoRows.forEach(row => {
        row.style.marginBottom = '40px';
      });
      
      // 处理所有可能会受影响的标题元素
      const allHeadings = contentToExport.querySelectorAll('h1, h2, h3, h4, h5, h6');
      allHeadings.forEach(heading => {
        // 只有主标题保持居中，其他标题强制左对齐
        if (!heading.classList.contains('case-title') && heading !== titleElement) {
          heading.style.textAlign = 'left';
          heading.style.borderBottom = 'none';
        }
      });
      
      // 内容处理
      // const markdownContents = contentToExport.querySelectorAll('.markdown-content');
      // markdownContents.forEach(content => {
      //   content.style.backgroundColor = '#ffffff';
      //   content.style.padding = '20px';
      //   // 移除Markdown内容边框
      //   content.style.border = 'none';
      //   content.style.boxShadow = 'none';
      //   content.style.borderRadius = '0';
        
        // 明确设置Markdown标题为左对齐
        // const mdHeadings = content.querySelectorAll('.markdown-body h1, .markdown-body h2, .markdown-body h3, .markdown-body h4');
        // mdHeadings.forEach(heading => {
        //   heading.style.textAlign = 'left';
        //   heading.style.margin = '20px 0 16px 0';
        //   heading.style.borderBottom = 'none';
        // });
        
        // 增强文本清晰度
        // const paragraphs = content.querySelectorAll('p, li, td, th, code, pre, blockquote');
        // paragraphs.forEach(p => {
        //   p.style.textRendering = 'optimizeLegibility';
        //   p.style.webkitFontSmoothing = 'antialiased';
        //   p.style.mozOsxFontSmoothing = 'grayscale';
        // });
      // });
      
      // 确保分析部分有足够的留白和标题左对齐
      const analysisSections = contentToExport.querySelectorAll('.analysis-section');
      analysisSections.forEach(section => {
        section.style.marginBottom = '25px';
        section.style.padding = '20px';
        section.style.backgroundColor = '#ffffff';
        // 移除分析部分边框
        // section.style.border = 'none';
        // section.style.boxShadow = 'none';
        // section.style.borderRadius = '0';
        
        // 确保分析部分标题左对齐
        const sectionHeadings = section.querySelectorAll('h3');
        sectionHeadings.forEach(heading => {
          heading.style.textAlign = 'left';
        });
      });
      
      
      // 将内容添加到容器
      container.appendChild(contentToExport);
      document.body.appendChild(container);
      console.log('container:');
      console.log(container);
      // 等待内容渲染完成，增加等待时间以确保所有内容完全渲染
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // 使用html2canvas将DOM转为图像 - 平衡清晰度和文件大小的优化设置
      const canvas = await html2canvas(container, {
        scale: 5, // 提高清晰度，但仍保持合理大小
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
        imageTimeout: 0, // 避免图片渲染超时
        letterRendering: true, // 增强文字渲染清晰度
        allowTaint: true, // 允许加载跨域图片
        // onclone: (document) => {
        //   // 在克隆的文档中提高文本清晰度
        //   const styles = document.createElement('style');
        //   styles.innerHTML = `
        //     * {
        //       text-rendering: optimizeLegibility !important;
        //       -webkit-font-smoothing: antialiased !important;
        //       -moz-osx-font-smoothing: grayscale !important;
        //     }
        //     .markdown-body, p, li, td, th, h1, h2, h3, h4, h5, h6 {
        //       font-weight: 400 !important;
        //     }
        //   `;
        //   document.head.appendChild(styles);
        // }
      });

      // 计算高宽比并创建PDF
      const imgWidth = 210; // 基准宽度 (mm)
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      // 创建适合内容高度的PDF，避免分页
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [imgWidth, imgHeight]
      });
      
      // 将内容添加到PDF - 平衡质量和大小的设置
      const imgData = canvas.toDataURL('image/jpeg', 1); // 提高JPEG质量到92%以增强清晰度
      console.log('imgData:');
      console.log(imgData);
      pdf.addImage(
        imgData,
        'JPEG', 
        0, // x位置
        0, // y位置
        imgWidth, // 宽度
        imgHeight, // 高度
        '', // 别名
        'SLOW' // 使用较慢的压缩但质量更高
      );
      
      // 保存PDF，设置压缩选项
      pdf.save(filename);
      
      // 清理临时DOM元素
      document.body.removeChild(container);
      
      ElMessage.success('PDF导出成功');
    } catch (error) {
      console.error('PDF导出失败:', error);
      ElMessage.error('PDF导出失败: ' + (error.message || '未知错误'));
    }
  };
  </script>
  
  <style scoped>
  .case-detail-component {
    padding: 20px;
    color: #2c3e50;
    background-color: #f9fafc;
    border-radius: 12px;
    box-shadow: 0 0 20px rgba(0, 0, 0, 0.03);
    max-width: 1200px;
    margin: 0 auto;
  }
  
  .detail-header {
    margin-bottom: 24px;
    padding-bottom: 16px;
    border-bottom: 1px solid #ebeef5;
    position: relative;
  }
  
  .detail-header h2 {
    font-size: 24px;
    font-weight: 600;
    color: #1e293b;
    margin-bottom: 8px;
    line-height: 1.3;
  }
  
  .case-number {
    color: #64748b;
    font-size: 14px;
    font-weight: 500;
    display: flex;
    align-items: center;
  }
  
  .header-actions {
    position: absolute;
    top: 0;
    right: 0;
  }
  
  .export-btn {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  
  .info-row {
    margin-bottom: 40px;
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 30px;
    width: 100%;
  }
  
  .info-card {
    background: #ffffff;
    border-radius: 10px;
    padding: 18px;
    height: 100%;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.03);
    transition: all 0.3s ease;
    border: 1px solid #f0f0f0;
    position: relative;
    overflow: hidden;
    width: 100%;
  }
  
  .info-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 4px;
    height: 100%;
    background: linear-gradient(180deg, #3b82f6, #93c5fd);
    opacity: 0;
    transition: opacity 0.3s ease;
  }
  
  .info-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px 0 rgba(0, 0, 0, 0.06);
    border-color: #e6efff;
  }
  
  .info-card:hover::before {
    opacity: 1;
  }
  
  .info-card-label {
    font-size: 14px;
    color: #64748b;
    margin-bottom: 10px;
    font-weight: 500;
  }
  
  .info-card-value {
    font-size: 16px;
    font-weight: 500;
    color: #1e293b;
    word-break: break-word;
    line-height: 1.5;
  }
  
  /* 确保每排最多3个卡片，最后一行不满时也能保持间距 */
  .info-row {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
  
  .section {
    margin: 28px 0;
  }
  
  .section-header {
    display: flex;
    align-items: center;
    margin-bottom: 16px;
  }
  
  .section-header .el-icon {
    margin-right: 10px;
    font-size: 20px;
    color: #3b82f6;
  }
  
  .section h3 {
    margin: 0;
    font-weight: 600;
    color: #1e293b;
    font-size: 18px;
  }
  
  .analysis-section {
    background: #ffffff;
    border-radius: 12px;
    padding: 20px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
    transition: all 0.3s ease;
    border: 1px solid #f0f0f0;
  }
  
  .analysis-section:hover {
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.06);
  }
  
  .markdown-content {
    background: #ffffff;
    border-radius: 8px;
    padding: 20px;
    min-height: 100px;
    box-shadow: none;
    border: none;
  }
  
  .permissions-wrapper {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  
  .permission-tag {
    margin: 0;
  }
  .primary-tag {
    margin: 0;
  }

  .primary-wrapper {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .location-icon {
    margin-right: 4px;
  }
  
  .attachment-card {
    display: flex;
    align-items: center;
    margin-bottom: 16px;
    padding: 16px;
    background-color: #ffffff;
    border-radius: 10px;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.04);
    transition: all 0.3s ease;
    border: 1px solid #f0f0f0;
  }
  
  .attachment-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
    border-color: #e6efff;
  }
  
  .attachment-icon {
    margin-right: 16px;
    color: #3b82f6;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 56px;
    height: 56px;
    background-color: rgba(59, 130, 246, 0.08);
    border-radius: 10px;
    flex-shrink: 0;
  }
  
  .attachment-info {
    flex: 1;
    overflow: hidden;
  }
  
  .attachment-name {
    font-weight: 500;
    margin-bottom: 8px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    color: #1e293b;
    font-size: 15px;
  }
  
  .attachment-meta {
    font-size: 13px;
    color: #64748b;
    display: flex;
    justify-content: space-between;
  }
  
  .attachment-actions {
    margin-left: 16px;
  }
  
  .attachment-actions .el-button {
    background-color: #3b82f6;
    border-color: #3b82f6;
    transition: all 0.3s ease;
  }
  
  .attachment-actions .el-button:hover {
    transform: scale(1.05);
    background-color: #2563eb;
    border-color: #2563eb;
  }
  
  .empty-case {
    padding: 60px 0;
    background-color: #ffffff;
    border-radius: 12px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.03);
    border: 1px solid #f0f0f0;
  }
  
  /* Element UI 样式覆盖 */
  :deep(.el-divider__text) {
    color: #3b82f6;
    font-weight: 600;
    font-size: 22px;
    background-color: transparent;
    padding-left: 0;
    display: block; /* 使其占据整行 */
    padding-top: 8px; /* 上方内边距 */
    left: 10px;
    width: 100%; /* 确保边框横跨整个容器 */
  }
  
  :deep(.el-divider) {
    margin: 50px 0 30px 0; /* 增加上方间距，减小下方间距 */
    position: relative;
    border-top: 1px solid #e5e7eb; /* 只在主要分隔线处添加上边框 */
  }
  
  :deep(.el-divider--horizontal) {
    height: 2px;
    background-color: transparent;
    border: none;
  }
  
  /* 移除额外的装饰性分隔线 */
  :deep(.el-divider)::after {
    display: none;
  }
  
  /* 修改分析部分的样式，移除顶部边界线 */
  .analysis-section::before {
    display: none;
  }
  
  /* Markdown 样式定制 */
  :deep(.md-editor-preview-wrapper),
  :deep(.md-editor-preview) {
    background-color: transparent !important;
    border: none !important;
    padding: 0 !important;
    box-shadow: none !important;
  }
  
  :deep(.md-editor-catalog) {
    border: none !important;
    background-color: #f8fafc !important;
    border-radius: 10px !important;
    padding: 16px !important;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.03) !important;
  }
  
  :deep(.markdown-body) {
    background-color: transparent !important;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif !important;
    color: #1e293b !important;
    font-size: 15px !important;
    line-height: 1.7 !important;
  }
  
  :deep(.markdown-body h1),
  :deep(.markdown-body h2),
  :deep(.markdown-body h3),
  :deep(.markdown-body h4) {
    border-bottom: none !important;
    padding-bottom: 8px !important;
    margin-top: 24px !important;
    margin-bottom: 16px !important;
    font-weight: 600 !important;
    color: #1e293b !important;
    text-align: left !important;
  }
  
  :deep(.markdown-body code) {
    background-color: rgba(59, 130, 246, 0.08) !important;
    border-radius: 4px !important;
    padding: 3px 6px !important;
    color: #3b82f6 !important;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace !important;
    font-size: 0.9em !important;
  }
  
  :deep(.markdown-body pre) {
    background-color: #f8fafc !important;
    border-radius: 10px !important;
    padding: 16px !important;
    margin: 16px 0 !important;
    box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.05) !important;
  }
  
  :deep(.markdown-body table) {
    border-radius: 10px !important;
    overflow: hidden !important;
    border-collapse: separate !important;
    border-spacing: 0 !important;
    border: 1px solid #e2e8f0 !important;
    margin: 16px 0 !important;
    width: 100% !important;
  }
  
  :deep(.markdown-body th) {
    background-color: #f8fafc !important;
    font-weight: 600 !important;
    padding: 12px 16px !important;
    color: #1e293b !important;
    border-bottom: 1px solid #e2e8f0 !important;
  }
  
  :deep(.markdown-body td) {
    padding: 12px 16px !important;
    border-top: 1px solid #e2e8f0 !important;
  }
  
  :deep(.markdown-body tr:nth-child(2n)) {
    background-color: #f8fafc !important;
  }
  
  :deep(.markdown-body img) {
    border-radius: 10px !important;
    max-width: 100% !important;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08) !important;
    margin: 16px 0 !important;
  }
  
  :deep(.markdown-body blockquote) {
    background-color: #f8fafc !important;
    border-left: 4px solid #3b82f6 !important;
    border-radius: 0 8px 8px 0 !important;
    padding: 12px 16px !important;
    color: #475569 !important;
    margin: 16px 0 !important;
  }
  
  :deep(.markdown-body a) {
    color: #3b82f6 !important;
    text-decoration: none !important;
    font-weight: 500 !important;
    border-bottom: 1px dashed #93c5fd !important;
    transition: all 0.2s ease !important;
  }
  
  :deep(.markdown-body a:hover) {
    color: #2563eb !important;
    border-bottom: 1px solid #60a5fa !important;
  }
  
  :deep(.markdown-body hr) {
    height: 1px !important;
    background-color: #e2e8f0 !important;
    border: none !important;
    margin: 24px 0 !important;
  }
  
  :deep(.markdown-body ul),
  :deep(.markdown-body ol) {
    padding-left: 1.5em !important;
    margin: 16px 0 !important;
  }
  
  :deep(.markdown-body li) {
    margin: 8px 0 !important;
  }
  
  /* 响应式调整 */
  @media (max-width: 1200px) {
    .info-row,
    .attachment-row {
      grid-template-columns: repeat(2, 1fr);
    }
  }
  
  @media (max-width: 768px) {
    .case-detail-component {
      padding: 16px;
    }
    
    .info-row,
    .attachment-row {
      grid-template-columns: 1fr;
      gap: 20px;
      margin-bottom: 30px;
    }
    
    .info-card {
      padding: 14px;
      margin-bottom: 12px;
    }
    
    .markdown-content {
      padding: 16px;
    }
    
    .section {
      margin: 20px 0;
    }
    
    .attachment-card {
      padding: 12px;
    }
    
    .attachment-icon {
      width: 48px;
      height: 48px;
    }
    
    :deep(.el-divider) {
      margin: 24px 0;
    }
  }
  
  /* PDF导出容器专用样式 - 合并相似样式 */
  :global(.pdf-export-container) {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
    color: #1e293b;
    background-color: #ffffff;
    padding: 40px;
    width: auto;
    max-width: 100%;
  }
  
  :global(.pdf-export-container .detail-header) {
    margin-bottom: 30px;
    padding-bottom: 20px;
    border-bottom: 1px solid #ebeef5;
  }
  
  :global(.pdf-export-container h2) {
    font-size: 30px;
    font-weight: 600;
    color: #1e293b;
    text-align: center;
    margin-bottom: 16px;
    line-height: 1.3;
  }
  
  :global(.pdf-export-container .case-number) {
    color: #64748b;
    font-size: 16px;
    font-weight: 500;
    text-align: center;
    margin-bottom: 24px;
  }
  
  :global(.pdf-export-container .info-card) {
    background: #ffffff;
    border-radius: 10px;
    padding: 18px;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.03);
    margin-bottom: 16px;
    border: 1px solid #f0f0f0;
    break-inside: avoid;
  }
  
  :global(.pdf-export-container .info-card-label) {
    font-size: 14px;
    color: #64748b;
    margin-bottom: 10px;
    font-weight: 500;
  }
  
  :global(.pdf-export-container .info-card-value) {
    font-size: 16px;
    font-weight: 500;
    color: #1e293b;
    word-break: break-word;
    line-height: 1.5;
  }
  
  :global(.pdf-export-container .markdown-content) {
    background: #ffffff;
    border-radius: 8px;
    padding: 20px;
    box-shadow: none;
    border: none;
    page-break-inside: auto;
  }
  
  /* 合并 PDF 导出中的 Markdown 样式 */
  :global(.pdf-export-container .markdown-body) {
    background-color: transparent !important;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif !important;
    color: #1e293b !important;
    font-size: 14px !important;
    line-height: 1.7 !important;
  }
  
  :global(.pdf-export-container .markdown-body table) {
    border-collapse: collapse !important;
    width: 100% !important;
    margin: 16px 0 !important;
    border: 1px solid #e2e8f0 !important;
    page-break-inside: avoid !important;
  }
  
  :global(.pdf-export-container .markdown-body th) {
    background-color: #f8fafc !important;
    font-weight: 600 !important;
    padding: 8px !important;
    color: #1e293b !important;
    border: 1px solid #e2e8f0 !important;
    text-align: left !important;
  }
  
  :global(.pdf-export-container .markdown-body td) {
    padding: 8px !important;
    border: 1px solid #e2e8f0 !important;
  }
  
  :global(.pdf-export-container .markdown-body img) {
    max-width: 100% !important;
    max-height: 800px !important;
    margin: 10px 0 !important;
    page-break-inside: avoid !important;
  }
  
  :global(.pdf-export-container .markdown-body pre) {
    background-color: #f8fafc !important;
    border-radius: 6px !important;
    padding: 12px !important;
    margin: 12px 0 !important;
    box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.05) !important;
    overflow-x: auto !important;
    white-space: pre-wrap !important;
    word-wrap: break-word !important;
    page-break-inside: avoid !important;
  }
  
  :global(.pdf-export-container .markdown-body code) {
    background-color: rgba(59, 130, 246, 0.08) !important;
    border-radius: 4px !important;
    padding: 2px 4px !important;
    color: #3b82f6 !important;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace !important;
    font-size: 0.9em !important;
  }
  
  :global(.pdf-export-container .section) {
    margin: 20px 0;
    page-break-inside: avoid;
  }
  
  :global(.pdf-export-container .attachment-card) {
    display: flex;
    align-items: center;
    margin-bottom: 16px;
    padding: 16px;
    background-color: #ffffff;
    border-radius: 10px;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.04);
    border: 1px solid #f0f0f0;
    page-break-inside: avoid;
  }
  
  /* 附件行布局 */
  .attachment-row {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 30px;
    width: 100%;
  }
  
  /* 统一的 Markdown 标题左对齐样式 */
  :global(.pdf-export-container .markdown-body h1),
  :global(.pdf-export-container .markdown-body h2),
  :global(.pdf-export-container .markdown-body h3),
  :global(.pdf-export-container .markdown-body h4),
  :global(.pdf-export-container .section-header h3),
  :global(.markdown-body h1),
  :global(.markdown-body h2),
  :global(.markdown-body h3),
  :global(.markdown-body h4),
  :global(.md-editor-preview h1),
  :global(.md-editor-preview h2),
  :global(.md-editor-preview h3),
  :global(.md-editor-preview h4) {
    text-align: left !important;
    margin: 20px 0 16px 0 !important;
    font-weight: 600 !important;
    color: #1e293b !important;
    border-bottom: none !important;
  }
  </style>