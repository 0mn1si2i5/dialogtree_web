import http from './http'
import type { ApiResponse, Conversation, CreateDialogRequest, SSEMessage } from '@/types'

// ===== 对话相关API =====

export const dialogApi = {
  // 创建新对话 (SSE流式响应)
  async createDialog(
    data: CreateDialogRequest,
    onMessage: (content: string) => void,
    onComplete: (result: { dialogId: number; conversationId: number }) => void,
    onError: (error: string) => void
  ): Promise<void> {
    let timeoutId: ReturnType<typeof setTimeout> | null = null
    
    try {
      // 设置30秒超时
      timeoutId = setTimeout(() => {
        onError('响应超时，请重试')
      }, 30000)

      const response = await fetch('/api/dialog/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) {
        throw new Error('无法获取响应流')
      }

      let buffer = ''
      let hasReceivedDone = false
      let lastMessageTime = Date.now()

      while (true) {
        const { done, value } = await reader.read()
        
        if (done) {
          // 如果流结束但没有收到完成信号，说明后端没有发送done信号
          // 这是正常情况，我们需要手动触发完成回调
          if (!hasReceivedDone) {
            console.log('SSE stream ended without done signal, triggering completion manually')
            // 由于后端没有提供具体的ID信息，我们传递一个特殊标记
            // 让上层逻辑去获取最新创建的对话信息
            onComplete({
              dialogId: -1, // 特殊标记，表示需要从树数据中获取
              conversationId: -1 // 特殊标记，表示需要从树数据中获取
            })
          }
          break
        }

        // 更新最后接收消息的时间
        lastMessageTime = Date.now()

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        
        // 保留最后一行可能不完整的数据
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('event:message')) continue
          
          if (line.startsWith('data:')) {
            const content = line.substring(5).trim()
            
            if (content === '') continue
            
            try {
              // 尝试解析JSON结构的完成数据
              const parsed = JSON.parse(content) as SSEMessage
              if (parsed.type === 'done' && parsed.data) {
                hasReceivedDone = true
                if (timeoutId) clearTimeout(timeoutId)
                onComplete(parsed.data)
                return
              }
            } catch {
              // 如果不是JSON，则是普通消息内容
              onMessage(content)
            }
          }
        }
      }
    } catch (error) {
      console.error('SSE Error:', error)
      onError(error instanceof Error ? error.message : '流式响应错误')
    } finally {
      if (timeoutId) clearTimeout(timeoutId)
    }
  },

  // 创建新对话 (同步版本，用于测试)
  async createDialogSync(data: CreateDialogRequest): Promise<{
    dialogId: number
    conversationId: number
    title: string
    summary: string
  }> {
    const response = await http.post<ApiResponse<{
      dialogId: number
      conversationId: number
      title: string
      summary: string
    }>>('/dialog/chat-sync', data)
    return response.data.data
  },

  // 标星/取消标星对话
  async toggleStar(conversationId: number): Promise<{ isStarred: boolean }> {
    const response = await http.put<ApiResponse<{ isStarred: boolean }>>(`/dialog/conversations/${conversationId}/star`)
    return response.data.data
  },

  // 更新对话评论
  async updateComment(data: { id: number; comment: string }): Promise<void> {
    await http.put('/dialog/conversations/comment', data)
  },

  // 删除对话评论
  async deleteComment(conversationId: number): Promise<void> {
    await http.delete(`/dialog/conversations/${conversationId}`)
  },

  // 获取祖先对话链
  async getAncestors(conversationId: number): Promise<Conversation[]> {
    const response = await http.get<ApiResponse<Conversation[]>>(`/dialog/conversations/${conversationId}/ancestors`)
    return response.data.data
  },
}