<template>
  <div class="case-list-container">
    <div class="case-list-header">
      <h2>案件列表</h2>
      <el-button type="primary" @click="handleCreateCase">创建案件</el-button>
    </div>
    
    <el-table
      v-loading="loading"
      :data="caseList"
      style="width: 100%"
      @row-click="handleRowClick"
      row-key="id"
      border
    >
      <el-table-column prop="case_number" label="案件编号" width="150" />
      <el-table-column prop="case_name" label="案件名称" min-width="180" />
      <el-table-column label="案件类型" width="200">
        <template #default="scope">
          {{ formatCaseTypes(scope.row.case_types) }}
        </template>
      </el-table-column>
      <el-table-column label="运营时间" width="220">
        <template #default="scope">
          {{ formatDate(scope.row.operation_date) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="150" fixed="right">
        <template #default="scope">
          <el-button type="primary" link @click.stop="handleViewDetail(scope.row)">
            查看
          </el-button>
          <el-button type="primary" link @click.stop="handleEdit(scope.row)">
            编辑
          </el-button>
        </template>
      </el-table-column>
    </el-table>
    
    <div class="pagination-container">
      <el-pagination
        background
        layout="total, sizes, prev, pager, next"
        :total="total"
        :page-size="pageSize"
        :current-page="currentPage"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
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
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getCaseList, getCaseDetail } from '@/api/case'
import { formatCaseTypes, formatDate } from '@/utils/format'
import CaseDetailComponent from '@/components/CaseDetailComponent.vue'

const router = useRouter()
const loading = ref(false)
const caseList = ref([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)

// 案件详情对话框相关
const caseDetailVisible = ref(false)
const caseDetail = ref(null)
const detailLoading = ref(false)

// 获取案件列表
const fetchCaseList = async () => {
  loading.value = true
  try {
    const params = {
      skip: (currentPage.value - 1) * pageSize.value,
      limit: pageSize.value
    }
    const response = await getCaseList(params)
    caseList.value = response.cases || []
    total.value = response.pagination?.total || 0
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

// 处理创建案件
const handleCreateCase = () => {
  router.push('/cases/new')
}

// 处理查看详情
const handleViewDetail = (row) => {
  fetchCaseDetail(row.id)
  caseDetailVisible.value = true
}

// 处理编辑
const handleEdit = (row) => {
  router.push(`/cases/edit/${row.id}`)
}

// 处理行点击
const handleRowClick = (row) => {
  handleViewDetail(row)
}

// 处理分页大小变化
const handleSizeChange = (size) => {
  pageSize.value = size
  fetchCaseList()
}

// 处理页码变化
const handleCurrentChange = (page) => {
  currentPage.value = page
  fetchCaseList()
}

onMounted(() => {
  fetchCaseList()
})
</script>

<style scoped>
.case-list-container {
  padding: 20px;
  background-color: #fff;
  border-radius: 4px;
}

.case-list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style> 