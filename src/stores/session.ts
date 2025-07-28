import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Session, Category, CreateSessionRequest, ApiResponse } from '@/types'
import { sessionApi } from '@/api/session'

export const useSessionStore = defineStore('session', () => {
  // 状态
  const sessions = ref<Session[]>([])
  const categories = ref<Category[]>([])
  const currentSessionId = ref<number | null>(null)
  const loading = ref(false)

  // 计算属性
  const currentSession = computed(() => {
    if (!currentSessionId.value) return null
    return sessions.value.find(session => session.id === currentSessionId.value) || null
  })

  const sessionsByCategory = computed(() => {
    const grouped: Record<number, Session[]> = {}
    sessions.value.forEach(session => {
      if (!grouped[session.categoryID]) {
        grouped[session.categoryID] = []
      }
      grouped[session.categoryID].push(session)
    })
    return grouped
  })

  // 方法
  const fetchSessions = async (): Promise<void> => {
    loading.value = true
    try {
      const response = await sessionApi.getSessions()
      if (response.code === 0) {
        sessions.value = response.data || []
      }
    } catch (error) {
      console.error('获取会话列表失败:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  const fetchCategories = async (): Promise<void> => {
    try {
      const response = await sessionApi.getCategories()
      if (response.code === 0) {
        categories.value = response.data?.list || []
      }
    } catch (error) {
      console.error('获取分类列表失败:', error)
      throw error
    }
  }

  const createSession = async (request: CreateSessionRequest): Promise<Session | null> => {
    try {
      const response = await sessionApi.createSession(request)
      if (response.code === 0) {
        const newSession: Session = {
          id: response.data.sessionId,
          title: response.data.title,
          summary: '',
          categoryID: request.categoryID,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
        sessions.value.unshift(newSession)
        setCurrentSession(newSession.id)
        return newSession
      }
      return null
    } catch (error) {
      console.error('创建会话失败:', error)
      throw error
    }
  }

  const deleteSession = async (sessionId: number): Promise<void> => {
    try {
      const response = await sessionApi.deleteSession(sessionId)
      if (response.code === 0) {
        sessions.value = sessions.value.filter(session => session.id !== sessionId)
        if (currentSessionId.value === sessionId) {
          currentSessionId.value = null
        }
      }
    } catch (error) {
      console.error('删除会话失败:', error)
      throw error
    }
  }

  const setCurrentSession = (sessionId: number | null): void => {
    currentSessionId.value = sessionId
  }

  const updateSessionTitle = (sessionId: number, title: string): void => {
    const session = sessions.value.find(s => s.id === sessionId)
    if (session) {
      session.title = title
    }
  }

  const updateSessionSummary = (sessionId: number, summary: string): void => {
    const session = sessions.value.find(s => s.id === sessionId)
    if (session) {
      session.summary = summary
    }
  }

  // 清理状态
  const reset = (): void => {
    sessions.value = []
    categories.value = []
    currentSessionId.value = null
    loading.value = false
  }

  return {
    // 状态
    sessions,
    categories,
    currentSessionId,
    loading,
    
    // 计算属性
    currentSession,
    sessionsByCategory,
    
    // 方法
    fetchSessions,
    fetchCategories,
    createSession,
    deleteSession,
    setCurrentSession,
    updateSessionTitle,
    updateSessionSummary,
    reset
  }
}) 