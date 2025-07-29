import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { sessionApi, categoryApi } from '@/api'
import type { Session, Category } from '@/types'

export const useSessionStore = defineStore('session', () => {
  // ===== 状态 =====
  const sessions = ref<Session[]>([])
  const categories = ref<Category[]>([])
  const currentSessionId = ref<number | null>(null)
  const selectedCategoryId = ref<number | null>(null)
  const loading = ref(false)
  const error = ref<string>('')

  // ===== 计算属性 =====
  const currentSession = computed(() => 
    sessions.value.find(s => s.id === currentSessionId.value) || null
  )

  const filteredSessions = computed(() => {
    if (selectedCategoryId.value === null) {
      return sessions.value
    }
    return sessions.value.filter(s => s.categoryID === selectedCategoryId.value)
  })

  const currentCategory = computed(() =>
    categories.value.find(c => c.id === selectedCategoryId.value) || null
  )

  // ===== Actions =====

  // 获取所有会话
  async function fetchSessions() {
    try {
      loading.value = true
      error.value = ''
      sessions.value = await sessionApi.getSessions()
    } catch (err) {
      error.value = err instanceof Error ? err.message : '获取会话列表失败'
      console.error('Failed to fetch sessions:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // 获取所有分类
  async function fetchCategories() {
    try {
      loading.value = true
      error.value = ''
      const result = await categoryApi.getCategories()
      categories.value = result.list
    } catch (err) {
      error.value = err instanceof Error ? err.message : '获取分类列表失败'
      console.error('Failed to fetch categories:', err)
    } finally {
      loading.value = false
    }
  }

  // 创建新会话
  async function createSession(title: string, categoryID: number) {
    try {
      loading.value = true
      error.value = ''
      const result = await sessionApi.createSession({ title, categoryID })
      
      // 重新获取会话列表以更新状态
      await fetchSessions()
      
      // 自动选中新创建的会话
      currentSessionId.value = result.sessionId
      
      return result
    } catch (err) {
      error.value = err instanceof Error ? err.message : '创建会话失败'
      console.error('Failed to create session:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // 删除会话
  async function deleteSession(sessionId: number) {
    try {
      loading.value = true
      error.value = ''
      await sessionApi.deleteSession(sessionId)
      
      // 如果删除的是当前选中的会话，清除选中状态
      if (currentSessionId.value === sessionId) {
        currentSessionId.value = null
      }
      
      // 重新获取会话列表
      await fetchSessions()
    } catch (err) {
      error.value = err instanceof Error ? err.message : '删除会话失败'
      console.error('Failed to delete session:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // 更新会话信息
  async function updateSession(sessionId: number, data: { title: string; categoryID: number }) {
    try {
      loading.value = true
      error.value = ''
      
      // 调用API更新会话
      const result = await sessionApi.updateSession(sessionId, data)
      
      // 重新获取所有sessions以确保数据同步
      await fetchSessions()
      
      return result
    } catch (err) {
      error.value = err instanceof Error ? err.message : '更新会话失败'
      console.error('Failed to update session:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // 根据分类获取会话
  async function fetchSessionsByCategory(categoryId: number) {
    try {
      loading.value = true
      error.value = ''
      
      // 简化逻辑：直接重新获取所有会话数据，避免复杂的本地状态管理
      await fetchSessions()
      
      // 返回筛选后的结果
      const categoryName = categories.value.find(c => c.id === categoryId)?.name || '未知分类'
      const categorySessions = sessions.value.filter(s => s.categoryID === categoryId)
      
      return {
        categoryId,
        categoryName,
        sessions: categorySessions
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : '获取分类会话失败'
      console.error('Failed to fetch sessions by category:', err)
      
      // 降级处理：使用客户端过滤
      return {
        categoryId,
        categoryName: currentCategory.value?.name || '未知分类',
        sessions: sessions.value.filter(s => s.categoryID === categoryId)
      }
    } finally {
      loading.value = false
    }
  }

  // 创建新分类
  async function createCategory(name: string) {
    try {
      loading.value = true
      error.value = ''
      await categoryApi.createCategory({ name })
      await fetchCategories()
    } catch (err) {
      error.value = err instanceof Error ? err.message : '创建分类失败'
      console.error('Failed to create category:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // 更新分类
  async function updateCategory(id: number, name: string) {
    try {
      loading.value = true
      error.value = ''
      await categoryApi.updateCategory({ id, name })
      await fetchCategories()
    } catch (err) {
      error.value = err instanceof Error ? err.message : '更新分类失败'
      console.error('Failed to update category:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // 删除分类
  async function deleteCategory(categoryId: number) {
    try {
      loading.value = true
      error.value = ''
      await categoryApi.deleteCategory(categoryId)
      
      // 如果删除的是当前选中的分类，清除选中状态
      if (selectedCategoryId.value === categoryId) {
        selectedCategoryId.value = null
      }
      
      await fetchCategories()
      // 删除成功后不抛出错误
    } catch (err) {
      error.value = err instanceof Error ? err.message : '删除分类失败'
      console.error('Failed to delete category:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // ===== 辅助方法 =====

  // 设置当前会话
  function setCurrentSession(sessionId: number | null) {
    currentSessionId.value = sessionId
  }

  // 设置选中的分类
  function setSelectedCategory(categoryId: number | null) {
    selectedCategoryId.value = categoryId
  }

  // 清除错误状态
  function clearError() {
    error.value = ''
  }

  // 初始化数据
  async function initialize() {
    await Promise.all([
      fetchSessions(),
      fetchCategories()
    ])
  }

  return {
    // 状态
    sessions,
    categories,
    currentSessionId,
    selectedCategoryId,
    loading,
    error,
    
    // 计算属性
    currentSession,
    filteredSessions,
    currentCategory,
    
    // Actions
    fetchSessions,
    fetchCategories,
    createSession,
    updateSession,
    deleteSession,
    fetchSessionsByCategory,
    createCategory,
    updateCategory,
    deleteCategory,
    setCurrentSession,
    setSelectedCategory,
    clearError,
    initialize,
  }
})