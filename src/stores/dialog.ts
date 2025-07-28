import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { DialogTreeData, DialogTreeNode, Conversation, CreateDialogRequest } from '@/types'
import { dialogApi } from '@/api/dialog'

export const useDialogStore = defineStore('dialog', () => {
  // 状态
  const dialogTreeData = ref<DialogTreeData | null>(null)
  const selectedConversationId = ref<number | null>(null)
  const isStreaming = ref(false)
  const streamingContent = ref('')
  const loading = ref(false)

  // 计算属性
  const dialogTree = computed(() => dialogTreeData.value?.dialogTree || null)
  
  const sessionInfo = computed(() => dialogTreeData.value?.sessionInfo || null)
  
  const selectedConversation = computed(() => {
    if (!selectedConversationId.value || !dialogTree.value) return null
    
    // 递归查找选中的对话
    const findConversation = (node: DialogTreeNode): Conversation | null => {
      if (node.conversationId === selectedConversationId.value) {
        // 这里需要根据实际的数据结构来构造Conversation对象
        return {
          id: node.conversationId,
          prompt: '',
          answer: node.content || '',
          title: node.title,
          isStarred: false,
          comment: '',
          createdAt: new Date().toISOString()
        }
      }
      
      if (node.children) {
        for (const child of node.children) {
          const found = findConversation(child)
          if (found) return found
        }
      }
      
      return null
    }
    
    return findConversation(dialogTree.value)
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

  const setSelectedConversation = (conversationId: number | null): void => {
    selectedConversationId.value = conversationId
  }

  const clearStreaming = (): void => {
    isStreaming.value = false
    streamingContent.value = ''
  }

  // 清理状态
  const reset = (): void => {
    dialogTreeData.value = null
    selectedConversationId.value = null
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
    selectedConversation,
    
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