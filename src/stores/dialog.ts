import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { sessionApi, dialogApi } from '@/api'
import { 
  transformDialogTreeToConversationTree,
  buildChatHistoryFromAncestors,
  getAncestorNodeIds,
  getStarredNodeIds 
} from '@/utils/treeTransform'
import type { 
  DialogTreeData, 
  ConversationTreeNode, 
  ChatMessage, 
  Conversation,
  CreateDialogRequest 
} from '@/types'

export const useDialogStore = defineStore('dialog', () => {
  // ===== 状态 =====
  const dialogTreeData = ref<DialogTreeData | null>(null)
  const conversationTree = ref<ConversationTreeNode | null>(null)
  const selectedConversationId = ref<number | null>(null)
  const ancestorConversations = ref<Conversation[]>([])
  const chatHistory = ref<ChatMessage[]>([])
  
  // SSE流式响应状态
  const isStreaming = ref(false)
  const streamingContent = ref('')
  const streamingError = ref('')
  
  const loading = ref(false)
  const error = ref('')

  // ===== 计算属性 =====

  // 当前选中的对话节点
  const selectedConversation = computed(() => {
    if (!conversationTree.value || !selectedConversationId.value) return null
    
    function findNode(node: ConversationTreeNode): ConversationTreeNode | null {
      if (node.conversationId === selectedConversationId.value) return node
      for (const child of node.children) {
        const found = findNode(child)
        if (found) return found
      }
      return null
    }
    
    return findNode(conversationTree.value)
  })

  // 祖先节点ID列表（用于高亮显示）
  const ancestorNodeIds = computed(() => 
    selectedConversationId.value 
      ? getAncestorNodeIds(conversationTree.value, selectedConversationId.value)
      : []
  )

  // 收藏节点ID列表
  const starredNodeIds = computed(() => 
    getStarredNodeIds(conversationTree.value)
  )

  // 当前聊天历史（基于祖先API数据）
  const currentChatHistory = computed(() => {
    if (ancestorConversations.value.length === 0) return []
    
    const history = buildChatHistoryFromAncestors(ancestorConversations.value)
    
    // 转换为ChatMessage格式
    return history.map(node => ({
      id: node.id,
      role: node.type,
      content: node.content,
      timestamp: node.createdAt,
      conversationId: node.conversationId,
      isStarred: node.isStarred,
      comment: node.comment,
    }))
  })

  // 是否有对话树数据
  const hasDialogTree = computed(() => 
    dialogTreeData.value?.dialogTree && dialogTreeData.value.dialogTree.length > 0
  )

  // ===== Actions =====

  // 清空对话状态
  function clearDialogState() {
    dialogTreeData.value = null
    conversationTree.value = null
    selectedConversationId.value = null
    ancestorConversations.value = []
    // 清空流式状态
    isStreaming.value = false
    streamingContent.value = ''
    streamingError.value = ''
  }

  // 获取会话的对话树
  async function fetchDialogTree(sessionId: number) {
    try {
      loading.value = true
      error.value = ''
      
      // 首先清空之前的所有对话状态
      clearDialogState()
      
      const data = await sessionApi.getSessionTree(sessionId)
      dialogTreeData.value = data
      
      // 转换为前端对话树结构
      conversationTree.value = transformDialogTreeToConversationTree(data.dialogTree)
      
      // 清除之前的选中状态和聊天历史
      selectedConversationId.value = null
      ancestorConversations.value = []
      
      // 如果没有对话树数据，确保聊天历史为空
      if (!data.dialogTree || data.dialogTree.length === 0) {
        ancestorConversations.value = []
      }
      
    } catch (err) {
      error.value = err instanceof Error ? err.message : '获取对话树失败'
      console.error('Failed to fetch dialog tree:', err)
      
      // 清空所有状态
      dialogTreeData.value = null
      conversationTree.value = null
      selectedConversationId.value = null
      ancestorConversations.value = []
    } finally {
      loading.value = false
    }
  }

  // 创建新对话（SSE流式响应）
  async function createDialog(request: CreateDialogRequest) {
    return new Promise<{ dialogId: number; conversationId: number }>((resolve, reject) => {
      isStreaming.value = true
      streamingContent.value = ''
      streamingError.value = ''

      dialogApi.createDialog(
        request,
        // onMessage
        (content: string) => {
          streamingContent.value += content
        },
        // onComplete
        async (result) => {
          try {
            isStreaming.value = false
            
            // 重新获取对话树以更新显示
            if (dialogTreeData.value) {
              await fetchDialogTree(dialogTreeData.value.sessionId)
            }
            
            // 自动选中新创建的对话
            selectedConversationId.value = result.conversationId
            await fetchAncestors(result.conversationId)
            
            resolve(result)
          } catch (err) {
            console.error('Failed to refresh dialog tree after creation:', err)
            reject(err)
          }
        },
        // onError
        (errorMsg: string) => {
          isStreaming.value = false
          streamingError.value = errorMsg
          reject(new Error(errorMsg))
        }
      )
    })
  }

  // 获取祖先对话链
  async function fetchAncestors(conversationId: number) {
    try {
      loading.value = true
      error.value = ''
      
      const ancestors = await dialogApi.getAncestors(conversationId)
      ancestorConversations.value = ancestors
      
    } catch (err) {
      error.value = err instanceof Error ? err.message : '获取祖先对话失败'
      console.error('Failed to fetch ancestors:', err)
      
      // 清空祖先数据
      ancestorConversations.value = []
    } finally {
      loading.value = false
    }
  }

  // 标星/取消标星对话
  async function toggleStar(conversationId: number) {
    try {
      const result = await dialogApi.toggleStar(conversationId)
      
      // 重新获取对话树以更新显示
      if (dialogTreeData.value) {
        await fetchDialogTree(dialogTreeData.value.sessionId)
      }
      
      // 如果是当前选中的对话，重新获取祖先数据
      if (selectedConversationId.value === conversationId) {
        await fetchAncestors(conversationId)
      }
      
      return result
    } catch (err) {
      error.value = err instanceof Error ? err.message : '标星操作失败'
      console.error('Failed to toggle star:', err)
      throw err
    }
  }

  // 更新对话评论
  async function updateComment(conversationId: number, comment: string) {
    try {
      await dialogApi.updateComment({ id: conversationId, comment })
      
      // 重新获取对话树以更新显示
      if (dialogTreeData.value) {
        await fetchDialogTree(dialogTreeData.value.sessionId)
      }
      
      // 如果是当前选中的对话，重新获取祖先数据
      if (selectedConversationId.value === conversationId) {
        await fetchAncestors(conversationId)
      }
      
    } catch (err) {
      error.value = err instanceof Error ? err.message : '更新评论失败'
      console.error('Failed to update comment:', err)
      throw err
    }
  }

  // 删除对话评论
  async function deleteComment(conversationId: number) {
    try {
      await dialogApi.deleteComment(conversationId)
      
      // 重新获取对话树以更新显示
      if (dialogTreeData.value) {
        await fetchDialogTree(dialogTreeData.value.sessionId)
      }
      
      // 如果是当前选中的对话，重新获取祖先数据
      if (selectedConversationId.value === conversationId) {
        await fetchAncestors(conversationId)
      }
      
    } catch (err) {
      error.value = err instanceof Error ? err.message : '删除评论失败'
      console.error('Failed to delete comment:', err)
      throw err
    }
  }

  // ===== 辅助方法 =====

  // 设置选中的对话
  async function setSelectedConversation(conversationId: number | null) {
    selectedConversationId.value = conversationId
    
    if (conversationId) {
      await fetchAncestors(conversationId)
    } else {
      ancestorConversations.value = []
    }
  }

  // 清除流式响应状态
  function clearStreamingState() {
    isStreaming.value = false
    streamingContent.value = ''
    streamingError.value = ''
  }

  // 清除错误状态
  function clearError() {
    error.value = ''
    streamingError.value = ''
  }

  // 重置所有状态
  function reset() {
    dialogTreeData.value = null
    conversationTree.value = null
    selectedConversationId.value = null
    ancestorConversations.value = []
    chatHistory.value = []
    clearStreamingState()
    clearError()
  }

  return {
    // 状态
    dialogTreeData,
    conversationTree,
    selectedConversationId,
    ancestorConversations,
    chatHistory,
    isStreaming,
    streamingContent,
    streamingError,
    loading,
    error,
    
    // 计算属性
    selectedConversation,
    ancestorNodeIds,
    starredNodeIds,
    currentChatHistory,
    hasDialogTree,
    
    // Actions
    clearDialogState,
    fetchDialogTree,
    createDialog,
    fetchAncestors,
    toggleStar,
    updateComment,
    deleteComment,
    setSelectedConversation,
    clearStreamingState,
    clearError,
    reset,
  }
})