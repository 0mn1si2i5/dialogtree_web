import { api, createSSEConnection } from './index'
import type { 
  ApiResponse, 
  CreateDialogRequest,
  UpdateCommentRequest,
  DialogTreeData
} from '@/types'

export const dialogApi = {
  // 获取对话树
  getDialogTree(sessionId: number): Promise<ApiResponse<DialogTreeData>> {
    return api.get(`/sessions/${sessionId}/tree`)
  },

  // 创建新对话 (流式响应)
  createDialog(
    data: CreateDialogRequest,
    onMessage: (content: string) => void,
    onComplete: () => void,
    onError: (error: Error) => void
  ): void {
    createSSEConnection(
      '/api/dialog/chat',
      data,
      onMessage,
      onComplete,
      onError
    )
  },

  // 创建新对话 (同步响应，用于测试)
  createDialogSync(data: CreateDialogRequest): Promise<ApiResponse> {
    return api.post('/dialog/chat-sync', data)
  },

  // 标星/取消标星对话
  starConversation(conversationId: number): Promise<ApiResponse<{ isStarred: boolean }>> {
    return api.put(`/dialog/conversations/${conversationId}/star`)
  },

  // 更新对话评论
  updateComment(data: UpdateCommentRequest): Promise<ApiResponse> {
    return api.put('/dialog/conversations/comment', data)
  },

  // 删除对话评论
  deleteComment(conversationId: number): Promise<ApiResponse> {
    return api.delete(`/dialog/conversations/${conversationId}`)
  },

  // 获取对话的祖先节点
  getConversationAncestors(conversationId: number): Promise<ApiResponse> {
    return api.get(`/api/dialog/conversations/${conversationId}/ancestors`)
  }
} 