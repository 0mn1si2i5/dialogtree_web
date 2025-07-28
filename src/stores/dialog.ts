import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { DialogTreeData, ConversationTreeNode, Conversation, CreateDialogRequest } from '@/types'
import { dialogApi } from '@/api/dialog'
import { transformDialogTreeToConversationTree, extractChatHistoryFromConversationTree, findConversationNodeById } from '@/utils/treeTransform'

export const useDialogStore = defineStore('dialog', () => {
  // 状态
  const dialogTreeData = ref<DialogTreeData | null>(null)
  const selectedConversationId = ref<number | null>(null)
  const ancestorConversationIds = ref<number[]>([])
  const isStreaming = ref(false)
  const streamingContent = ref('')
  const loading = ref(false)

  // 计算属性
  const dialogTree = computed(() => dialogTreeData.value?.dialogTree || [])
  
  const sessionInfo = computed(() => dialogTreeData.value?.sessionInfo || null)
  
  // 转换后的conversation树
  const conversationTree = computed(() => {
    if (!dialogTree.value || dialogTree.value.length === 0) return null
    return transformDialogTreeToConversationTree(dialogTree.value)
  })
  
  // 当前对话历史（用于ChatPanel）
  const currentChatHistory = computed(() => {
    return extractChatHistoryFromConversationTree(conversationTree.value)
  })
  
  const selectedConversation = computed(() => {
    if (!selectedConversationId.value || !conversationTree.value) return null
    
    // 使用新的工具函数查找conversation
    const foundNode = findConversationNodeById(conversationTree.value, selectedConversationId.value)
    if (!foundNode) return null
    
    // 构造Conversation对象
    return {
      id: foundNode.conversationId,
      prompt: foundNode.prompt || '',
      answer: foundNode.answer || '',
      title: foundNode.title,
      summary: foundNode.summary,
      isStarred: foundNode.isStarred,
      comment: foundNode.comment,
      createdAt: foundNode.createdAt,
      dialogId: foundNode.dialogId
    }
  })

  // 方法
  const fetchDialogTree = async (sessionId: number): Promise<void> => {
    loading.value = true
    try {
      const response = await dialogApi.getDialogTree(sessionId)
      if (response.code === 0) {
        dialogTreeData.value = response.data
      }
    } catch (error) {
      console.error('获取对话树失败:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  const createDialog = async (request: CreateDialogRequest): Promise<void> => {
    try {
      // 这里会使用SSE流式响应
      isStreaming.value = true
      streamingContent.value = ''
      
      await dialogApi.createDialog(
        request,
        (content: string) => {
          // 流式内容更新回调
          streamingContent.value += content
        },
        () => {
          // 流式完成回调
          isStreaming.value = false
          // 重新获取对话树
          if (request.sessionId) {
            fetchDialogTree(request.sessionId)
          }
        },
        (error: Error) => {
          // 错误回调
          console.error('对话创建失败:', error)
          isStreaming.value = false
        }
      )
    } catch (error) {
      console.error('创建对话失败:', error)
      isStreaming.value = false
      throw error
    }
  }

  const starConversation = async (conversationId: number): Promise<boolean> => {
    try {
      const response = await dialogApi.starConversation(conversationId)
      if (response.code === 0) {
        return response.data.isStarred
      }
      return false
    } catch (error) {
      console.error('标星操作失败:', error)
      throw error
    }
  }

  const updateComment = async (conversationId: number, comment: string): Promise<void> => {
    try {
      const response = await dialogApi.updateComment({
        id: conversationId,
        comment
      })
      if (response.code !== 0) {
        throw new Error(response.msg)
      }
    } catch (error) {
      console.error('更新评论失败:', error)
      throw error
    }
  }

  const deleteComment = async (conversationId: number): Promise<void> => {
    try {
      const response = await dialogApi.deleteComment(conversationId)
      if (response.code !== 0) {
        throw new Error(response.msg)
      }
    } catch (error) {
      console.error('删除评论失败:', error)
      throw error
    }
  }

  const setSelectedConversation = async (conversationId: number | null): Promise<void> => {
    selectedConversationId.value = conversationId
    ancestorConversationIds.value = []
    
    if (conversationId) {
      try {
        const response = await dialogApi.getConversationAncestors(conversationId)
        if (response.code === 0 && response.data) {
          // 祖先节点数组包含从根到当前节点的完整路径
          ancestorConversationIds.value = response.data.map((conv: any) => conv.id)
        }
      } catch (error) {
        console.error('获取祖先节点失败:', error)
      }
    }
  }

  const clearStreaming = (): void => {
    isStreaming.value = false
    streamingContent.value = ''
  }

  // 清理状态
  const reset = (): void => {
    dialogTreeData.value = null
    selectedConversationId.value = null
    ancestorConversationIds.value = []
    isStreaming.value = false
    streamingContent.value = ''
    loading.value = false
  }

  return {
    // 状态
    dialogTreeData,
    selectedConversationId,
    isStreaming,
    streamingContent,
    loading,
    
    // 计算属性
    dialogTree,
    sessionInfo,
    conversationTree,
    currentChatHistory,
    selectedConversation,
    ancestorConversationIds,
    
    // 方法
    fetchDialogTree,
    createDialog,
    starConversation,
    updateComment,
    deleteComment,
    setSelectedConversation,
    clearStreaming,
    reset
  }
}) 