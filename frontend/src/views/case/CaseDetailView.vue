<template>
  <div class="case-detail-container" v-loading="loading" ref="caseDetailRef">
    <template v-if="caseDetail">
      <!-- 操作按钮 -->
      <div class="action-bar">
        <el-button-group>
          <el-button type="primary" @click="exportToPDF">
            <el-icon><Document /></el-icon>
            导出PDF
          </el-button>
          <el-button type="success" @click="showShareDialog">
            <el-icon><Share /></el-icon>
            分享案件
          </el-button>
        </el-button-group>
      </div>
      
      <!-- 案件基本信息 -->
      <div class="detail-section">
        <h2 class="detail-section-title">案件基本信息</h2>
        <div class="detail-item-grid">
          <div class="detail-item">
            <span class="detail-label">案件编号：</span>
            <span class="detail-value">{{ caseDetail.case_number }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">案件名称：</span>
            <span class="detail-value">{{ caseDetail.case_name }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">案件类型：</span>
            <span class="detail-value">{{ formatCaseTypes(caseDetail.case_types) }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">运营时间：</span>
            <span class="detail-value">{{ formatDate(caseDetail.operation_date) }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">平台类型：</span>
            <span class="detail-value">{{ formatCaseTypes(caseDetail.platform_types) }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">客服信息：</span>
            <span class="detail-value">{{ caseDetail.customer_service || '无' }}</span>
          </div>
        </div>

        <div v-if="caseDetail.other_info" class="detail-markdown">
          <h3 class="detail-sub-title">其他信息</h3>
          <md-preview :model-value="caseDetail.other_info" />
        </div>
      </div>

      <!-- 技术信息部分 -->
      <div v-if="caseDetail.has_technical_info" class="detail-section">
        <h2 class="detail-section-title">案件技术信息</h2>
        <div class="detail-item-grid">
          <div class="detail-item">
            <span class="detail-label">CDN信息：</span>
            <span class="detail-value">{{ caseDetail.cdn_info || '无' }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">服务器所在地：</span>
            <span class="detail-value">
              {{ caseDetail.server_location_domestic === true ? '境内' : 
                 caseDetail.server_location_domestic === false ? '境外' : '未知' }}
              {{ caseDetail.server_location ? formatServerLocation(caseDetail.server_location) : '' }}
            </span>
          </div>
          <div class="detail-item">
            <span class="detail-label">已获得权限：</span>
            <span class="detail-value">{{ caseDetail.permissions ? formatCaseTypes(caseDetail.permissions) : '无' }}</span>
          </div>
        </div>
      </div>

      <!-- 数据分析部分 -->
      <div class="detail-section">
        <h2 class="detail-section-title">案件数据分析</h2>
        
        <div v-if="caseDetail.platform_analysis" class="detail-markdown">
          <h3 class="detail-sub-title">平台数据分析</h3>
          <md-preview :model-value="caseDetail.platform_analysis" />
        </div>
        
        <div v-if="caseDetail.agent_analysis" class="detail-markdown">
          <h3 class="detail-sub-title">代理数据分析</h3>
          <md-preview :model-value="caseDetail.agent_analysis" />
        </div>
        
        <div v-if="caseDetail.member_analysis" class="detail-markdown">
          <h3 class="detail-sub-title">会员数据分析</h3>
          <md-preview :model-value="caseDetail.member_analysis" />
        </div>
        
        <div v-if="!caseDetail.platform_analysis && !caseDetail.agent_analysis && !caseDetail.member_analysis" class="empty-data">
          <span>暂无数据分析内容</span>
        </div>
      </div>
      
      <!-- 元数据信息 -->
      <div class="detail-section">
        <div class="detail-item-grid">
          <div class="detail-item">
            <span class="detail-label">创建时间：</span>
            <span class="detail-value">{{ formatDateTime(caseDetail.created_at) }}</span>
          </div>
          <div class="detail-item" v-if="caseDetail.updated_at">
            <span class="detail-label">更新时间：</span>
            <span class="detail-value">{{ formatDateTime(caseDetail.updated_at) }}</span>
          </div>
        </div>
      </div>
    </template>
  </div>
  
  <!-- 分享案件对话框 -->
  <el-dialog
    v-model="shareDialogVisible"
    title="分享案件"
    width="500px"
    destroy-on-close
  >
    <div>
      <p>通过以下链接分享此案件，任何人都可以通过此链接查看案件详情（无需登录）：</p>
      <div class="share-link-container">
        <el-input
          v-model="currentShareLink"
          readonly
          :autosize="{ minRows: 1, maxRows: 3 }"
        >
          <template #append>
            <el-button @click="copyShareLink">复制</el-button>
          </template>
        </el-input>
      </div>
      <div class="share-qrcode">
        <img 
          :src="`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(currentShareLink)}`" 
          alt="分享二维码"
        />
        <p>扫描二维码查看</p>
      </div>
    </div>
    <template #footer>
      <span>
        <el-button @click="shareDialogVisible = false">关闭</el-button>
        <el-button type="primary" @click="copyShareLink">复制链接</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, onMounted, defineProps, defineExpose } from 'vue'
import { ElMessage } from 'element-plus'
import { MdPreview } from 'md-editor-v3'
import { getCaseDetail } from '@/api/case'
import { formatCaseTypes, formatDate, formatDateTime } from '@/utils/format'
import { exportElementToPDF } from '@/utils/pdf-export'
import { Document, Share } from '@element-plus/icons-vue'

const props = defineProps({
  caseId: {
    type: [Number, String],
    required: true
  }
})

const loading = ref(false)
const caseDetail = ref(null)
const caseDetailRef = ref(null)
const shareDialogVisible = ref(false)
const currentShareLink = ref('')

// 格式化服务器位置信息
const formatServerLocation = (location) => {
  if (!location) return ''
  
  if (typeof location === 'string') {
    try {
      location = JSON.parse(location)
    } catch (e) {
      return location
    }
  }
  
  // 处理对象形式的位置信息
  if (typeof location === 'object') {
    if (location.province && location.city) {
      return `${location.province} ${location.city}`
    } else if (location.country) {
      return location.country
    }
  }
  
  return JSON.stringify(location)
}

// 获取案件详情
const fetchCaseDetail = async () => {
  if (!props.caseId) return
  
  loading.value = true
  try {
    const response = await getCaseDetail(props.caseId)
    caseDetail.value = response
  } catch (error) {
    ElMessage.error('获取案件详情失败')
  } finally {
    loading.value = false
  }
}

// 导出为PDF
const exportToPDF = async () => {
  if (!caseDetailRef.value) return
  
  const fileName = caseDetail.value ? 
    `案件-${caseDetail.value.case_number}-${caseDetail.value.case_name}` : 
    '案件详情'
  
  try {
    await exportElementToPDF(caseDetailRef.value, fileName)
    ElMessage.success('导出PDF成功')
  } catch (error) {
    ElMessage.error('导出PDF失败')
  }
}

// 显示分享对话框
const showShareDialog = () => {
  if (!caseDetail.value || !caseDetail.value.token) {
    ElMessage.error('获取分享链接失败，请稍后再试')
    return
  }
  
  const baseUrl = `${window.location.protocol}//${window.location.host}`
  currentShareLink.value = `${baseUrl}/shared/${caseDetail.value.token}`
  shareDialogVisible.value = true
}

// 复制分享链接
const copyShareLink = () => {
  navigator.clipboard.writeText(currentShareLink.value)
    .then(() => {
      ElMessage.success('分享链接已复制到剪贴板')
    })
    .catch(err => {
      console.error('复制失败:', err)
      ElMessage.error('复制失败，请手动复制')
    })
}

onMounted(() => {
  fetchCaseDetail()
})

// 暴露方法
defineExpose({
  exportToPDF
})
</script>

<style scoped>
.case-detail-container {
  padding: 20px;
  background-color: #fff;
  border-radius: 4px;
}

.detail-section {
  margin-bottom: 30px;
}

.detail-section-title {
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 1px solid #ebeef5;
  color: #303133;
}

.detail-sub-title {
  font-size: 16px;
  margin-bottom: 15px;
  color: #606266;
}

.detail-item-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 15px;
}

.detail-item {
  display: flex;
}

.detail-label {
  font-weight: bold;
  color: #606266;
  width: 100px;
  flex-shrink: 0;
}

.detail-value {
  color: #303133;
  word-break: break-all;
}

.detail-markdown {
  margin-top: 20px;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  padding: 15px;
}

.empty-data {
  text-align: center;
  color: #909399;
  padding: 30px 0;
}

.action-bar {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 20px;
}

.share-link-container {
  margin: 15px 0;
}

.share-qrcode {
  margin-top: 20px;
  text-align: center;
}

.share-qrcode img {
  width: 200px;
  height: 200px;
  margin-bottom: 10px;
  border: 1px solid #eaeaea;
  border-radius: 4px;
}

.share-qrcode p {
  color: #909399;
  font-size: 14px;
}
</style> 