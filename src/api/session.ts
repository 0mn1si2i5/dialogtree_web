import { api } from './index'
import type { 
  ApiResponse, 
  Session, 
  Category, 
  CreateSessionRequest,
  CreateCategoryRequest,
  UpdateCategoryRequest,
  PaginatedResponse 
} from '@/types'

export const sessionApi = {
  // 获取会话列表
  getSessions(): Promise<ApiResponse<Session[]>> {
    return api.get('/sessions')
  },

  // 创建新会话
  createSession(data: CreateSessionRequest): Promise<ApiResponse<{ sessionId: number; title: string }>> {
    return api.post('/sessions', data)
  },

  // 删除会话
  deleteSession(sessionId: number): Promise<ApiResponse> {
    return api.delete(`/sessions/${sessionId}`)
  },

  // 获取会话对话树
  getSessionTree(sessionId: number): Promise<ApiResponse> {
    return api.get(`/sessions/${sessionId}/tree`)
  },

  // 获取分类列表
  getCategories(): Promise<ApiResponse<PaginatedResponse<Category>>> {
    return api.get('/categories')
  },

  // 创建新分类
  createCategory(data: CreateCategoryRequest): Promise<ApiResponse> {
    return api.post('/categories', data)
  },

  // 更新分类
  updateCategory(data: UpdateCategoryRequest): Promise<ApiResponse> {
    return api.put('/categories/update', data)
  },

  // 删除分类
  deleteCategory(categoryId: number): Promise<ApiResponse> {
    return api.delete(`/categories/${categoryId}`)
  }
} 