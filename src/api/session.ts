import http from './http'
import type { ApiResponse, Session, Category, DialogTreeData } from '@/types'

// ===== Session相关API =====

export const sessionApi = {
  // 获取所有会话
  async getSessions(): Promise<Session[]> {
    const response = await http.get<ApiResponse<Session[]>>('/sessions')
    return response.data.data
  },

  // 创建新会话
  async createSession(data: { title: string; categoryID: number }): Promise<{ sessionId: number; title: string }> {
    const response = await http.post<ApiResponse<{ sessionId: number; title: string }>>('/sessions', data)
    return response.data.data
  },

  // 删除会话
  async deleteSession(sessionId: number): Promise<void> {
    await http.delete(`/sessions/${sessionId}`)
  },

  // 获取会话的对话树
  async getSessionTree(sessionId: number): Promise<DialogTreeData> {
    const response = await http.get<ApiResponse<DialogTreeData>>(`/sessions/${sessionId}/tree`)
    return response.data.data
  },

  // 根据分类获取会话列表
  async getSessionsByCategory(categoryId: number): Promise<{
    categoryId: number
    categoryName: string
    sessions: Session[]
  }> {
    const response = await http.get<ApiResponse<{
      categoryId: number
      categoryName: string
      sessions: Session[]
    }>>(`/categories/${categoryId}/sessions`)
    return response.data.data
  },
}

// ===== Category相关API =====

export const categoryApi = {
  // 获取所有分类
  async getCategories(): Promise<{ count: number; list: Category[] }> {
    const response = await http.get<ApiResponse<{ count: number; list: Category[] }>>('/categories')
    return response.data.data
  },

  // 创建新分类
  async createCategory(data: { name: string }): Promise<void> {
    await http.post('/categories', data)
  },

  // 更新分类
  async updateCategory(data: { id: number; name: string }): Promise<void> {
    await http.put('/categories/update', data)
  },

  // 删除分类
  async deleteCategory(categoryId: number): Promise<void> {
    await http.delete(`/categories/${categoryId}`)
  },
}