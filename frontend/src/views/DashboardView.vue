<template>
  <div class="dashboard-container">
    <!-- 案件列表 -->
    <div class="card-container">
      <div class="card-header">
        <h3 class="card-title">案件列表</h3>
        <el-button type="primary" @click="handleNewCase">新建案件</el-button>
      </div>

      <div class="search-bar">
        <el-input
          v-model="searchQuery"
          placeholder="搜索案件编号、案件名称"
          clearable
          @clear="handleSearch"
          style="width: 300px; margin-right: 10px;"
        >
          <template #suffix>
            <el-icon class="el-input__icon" @click="handleSearch"><Search /></el-icon>
          </template>
        </el-input>
        <el-button type="primary" @click="handleSearch">搜索</el-button>
        <el-button @click="resetSearch">重置</el-button>
      </div>

      <el-table
        :data="caseList"
        style="width: 100%"
        v-loading="loading"
      >
        <el-table-column prop="case_number" label="案件编号" width="240" />
        <el-table-column prop="case_name" label="案件名称" />
        <el-table-column label="案件类型" width="180">
          <template #default="scope">
            {{ formatCaseTypes(scope.row.case_types) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="280">
          <template #default="scope">
            <el-button type="primary" size="small" plain @click="viewCase(scope.row.id)">查看</el-button>
            <el-button type="warning" size="small" plain @click="editCase(scope.row.id)">编辑</el-button>
            <el-button 
              type="success" 
              size="small" 
              plain 
              @click="shareCase(scope.row)"
            >
              分享
            </el-button>
            <el-button 
              type="danger" 
              size="small" 
              plain 
              @click="handleDeleteCase(scope.row)"
              :disabled="scope.row.is_deleted"
            >
              {{ scope.row.is_deleted ? '已删除' : '删除' }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-container">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="totalItems"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </div>

    <!-- 案件详情对话框 -->
    <el-dialog
      v-model="caseDetailVisible"
      title="案件详情"
      width="70%"
      destroy-on-close
    >
      <case-detail-component
        :case-data="caseDetail"
        :loading="detailLoading"
      />
      <template #footer>
        <span>
          <el-button @click="caseDetailVisible = false">关闭</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 分享案件对话框 -->
    <el-dialog
      v-model="shareDialogVisible"
      title="分享案件"
      width="500px"
      destroy-on-close
    >
      <div v-loading="shareDialogLoading">
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
  </div>
</template>

<script setup>
import { ref, onMounted, watch, onActivated } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search } from '@element-plus/icons-vue'
import { getCaseList, getCaseDetail, deleteCase } from '@/api/case'
import { formatCaseTypes, formatDate } from '@/utils/format'
import CaseDetailComponent from '@/components/CaseDetailComponent.vue'

const router = useRouter()
const route = useRoute()
const searchQuery = ref('')
const caseList = ref([])
const loading = ref(false)
const currentPage = ref(1)
const pageSize = ref(10)
const totalItems = ref(0)

// 案件详情对话框相关
const caseDetailVisible = ref(false)
const selectedCaseId = ref(null)
const caseDetail = ref(null)
const detailLoading = ref(false)

// 分享案件对话框相关数据
const shareDialogVisible = ref(false)
const currentShareLink = ref('')
const shareDialogLoading = ref(false)

// 获取案件列表
const fetchCases = async () => {
  loading.value = true
  try {
    const response = await getCaseList({
      skip: (currentPage.value - 1) * pageSize.value,
      limit: pageSize.value,
      search: searchQuery.value
    })
    caseList.value = response.cases || []
    totalItems.value = response.pagination?.total || 0
  } catch (error) {
    ElMessage.error('获取案件列表失败')
    console.error('获取案件列表错误:', error)
  } finally {
    loading.value = false
  }
}

// 获取案件详情
const fetchCaseDetail = async (id) => {
  detailLoading.value = true
  try {
    const response = await getCaseDetail(id)
    caseDetail.value = response.case
  } catch (error) {
    ElMessage.error('获取案件详情失败')
    console.error('获取案件详情错误:', error)
  } finally {
    detailLoading.value = false
  }
}

// 刷新所有数据
const refreshData = () => {
  console.log('刷新数据...')
  fetchCases()
}

// 处理搜索
const handleSearch = () => {
  currentPage.value = 1
  fetchCases()
}

// 重置搜索
const resetSearch = () => {
  searchQuery.value = ''
  currentPage.value = 1
  fetchCases()
}

// 处理分页大小改变
const handleSizeChange = (size) => {
  pageSize.value = size
  fetchCases()
}

// 处理页码改变
const handleCurrentChange = (page) => {
  currentPage.value = page
  fetchCases()
}

// 查看案件详情
const viewCase = (id) => {
  selectedCaseId.value = id
  fetchCaseDetail(id)
  caseDetailVisible.value = true
}

// 编辑案件
const editCase = (id) => {
  router.push({ name: 'CaseEdit', params: { id } })
}

// 处理新建案件
const handleNewCase = () => {
  router.push({ name: 'CaseNew' })
}

// 处理删除案件
const handleDeleteCase = (row) => {
  ElMessageBox.confirm(`确定要删除案件"${row.case_name}"吗？`, '删除确认', {
    confirmButtonText: '确认删除',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(async () => {
    try {
      await deleteCase(row.id)
      ElMessage.success('案件删除成功')
      fetchCases() // 刷新列表
    } catch (error) {
      ElMessage.error('删除案件失败')
      console.error('删除案件错误:', error)
    }
  }).catch(() => {
    ElMessage.info('已取消删除')
  })
}

// 分享案件
const shareCase = (row) => {
  shareDialogLoading.value = true
  // 获取token
  const baseUrl = `${window.location.protocol}//${window.location.host}`
  currentShareLink.value = `${baseUrl}/shared/${row.token}`
  shareDialogVisible.value = true
  shareDialogLoading.value = false
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
  refreshData()
})

onActivated(() => {
  refreshData()
})

// 监听路由查询参数变化
watch(() => route.query, (newQuery) => {
  if (newQuery.refresh === 'true') {
    refreshData()
  }
}, { deep: true })
</script>

<style scoped>
.dashboard-container {
  padding: 20px;
}

.card-container {
  background-color: #fff;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  padding: 20px;
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.card-title {
  font-size: 18px;
  color: #303133;
  margin: 0;
}

.search-bar {
  margin-bottom: 20px;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
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