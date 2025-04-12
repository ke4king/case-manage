import { defineStore } from 'pinia'
import { getCaseList, getCaseDetail, createCase, updateCase, deleteCase, getCaseStats } from '@/api/case'

export const useCaseStore = defineStore('case', {
  state: () => ({
    caseList: [],
    currentCase: null,
    caseStats: null,
    loading: false,
    totalCount: 0
  }),
  
  getters: {
    getCaseById: (state) => (id) => {
      return state.caseList.find(item => item.id == id)
    }
  },
  
  actions: {
    // 获取案件列表
    async fetchCaseList(params) {
      this.loading = true
      try {
        const response = await getCaseList(params)
        this.caseList = response.cases || []
        this.totalCount = response.total || this.caseList.length
        return this.caseList
      } catch (error) {
        throw error
      } finally {
        this.loading = false
      }
    },
    
    // 获取案件统计信息
    async fetchCaseStats() {
      try {
        const response = await getCaseStats()
        this.caseStats = response
        return response
      } catch (error) {
        throw error
      }
    },
    
    // 获取案件详情
    async fetchCase(id) {
      this.loading = true
      try {
        const response = await getCaseDetail(id)
        this.currentCase = response.case
        return response
      } catch (error) {
        throw error
      } finally {
        this.loading = false
      }
    },
    
    // 创建案件
    async createCase(caseData) {
      this.loading = true
      try {
        const response = await createCase(caseData)
        // 将新创建的案件添加到列表中
        if (response.case) {
          this.caseList.unshift(response.case)
        }
        return response
      } catch (error) {
        throw error
      } finally {
        this.loading = false
      }
    },
    
    // 更新案件
    async updateCase(id, caseData) {
      this.loading = true
      try {
        const response = await updateCase(id, caseData)
        // 更新当前案件
        if (response.case) {
          this.currentCase = response.case
          
          // 更新列表中的案件
          const index = this.caseList.findIndex(item => item.id == id)
          if (index !== -1) {
            this.caseList[index] = response.case
          }
        }
        return response
      } catch (error) {
        throw error
      } finally {
        this.loading = false
      }
    },
    
    // 删除案件
    async deleteCase(id) {
      try {
        const response = await deleteCase(id)
        // 从列表中移除已删除的案件
        this.caseList = this.caseList.filter(item => item.id != id)
        return response
      } catch (error) {
        throw error
      }
    },
    
    // 清除当前案件
    clearCurrentCase() {
      this.currentCase = null
    }
  }
}) 