import type { DialogNode, ConversationTreeNode, Conversation } from '@/types'

/**
 * 将后端返回的Dialog树转换为前端需要的Conversation树
 * 核心逻辑：同一dialog内的conversations按时间排序连成链，分叉点连接到子dialog
 */
export function transformDialogTreeToConversationTree(
  dialogNodes: DialogNode[]
): ConversationTreeNode | null {
  if (!dialogNodes || dialogNodes.length === 0) {
    return null
  }

  // 找到根dialog（parentId为null的第一个）
  const rootDialog = dialogNodes.find(dialog => dialog.parentId === null)
  if (!rootDialog) {
    return null
  }

  // 构建dialog映射表，方便查找
  const dialogMap = new Map<number, DialogNode>()
  dialogNodes.forEach(dialog => {
    dialogMap.set(dialog.dialogId, dialog)
  })

  /**
   * 递归构建conversation树
   * @param dialog 当前处理的dialog
   * @param branchFromConversationId 分叉起始点的conversationId（如果有）
   */
  function buildConversationTree(
    dialog: DialogNode,
    branchFromConversationId?: number
  ): ConversationTreeNode[] {
    // 1. 将当前dialog的conversations按时间排序
    const sortedConversations = [...dialog.conversations].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    )

    if (sortedConversations.length === 0) {
      return []
    }

    // 2. 为每个conversation创建节点
    const conversationNodes: ConversationTreeNode[] = sortedConversations.map((conv, index) => ({
      id: conv.id,
      type: index % 2 === 0 ? 'user' : 'assistant', // 偶数索引为user，奇数为assistant
      title: conv.title || '',
      summary: conv.summary || '',
      prompt: conv.prompt,
      answer: conv.answer,
      conversationId: conv.id,
      dialogId: dialog.dialogId,
      isStarred: conv.isStarred,
      comment: conv.comment || '',
      createdAt: conv.createdAt,
      children: []
    }))

    // 3. 将conversation连成链（父子关系）
    for (let i = 0; i < conversationNodes.length - 1; i++) {
      conversationNodes[i].children.push(conversationNodes[i + 1])
    }

    // 4. 处理子dialog的分叉逻辑
    if (dialog.children && dialog.children.length > 0) {
      // 找到最后一个conversation作为分叉点
      const lastConversationNode = conversationNodes[conversationNodes.length - 1]
      
      if (lastConversationNode) {
        // 为每个子dialog创建分支
        dialog.children.forEach(childDialog => {
          const childConversations = buildConversationTree(childDialog)
          if (childConversations.length > 0) {
            // 将子dialog的第一个conversation连接到分叉点
            lastConversationNode.children.push(childConversations[0])
          }
        })
      }
    }

    return conversationNodes
  }

  // 从根dialog开始构建树
  const rootConversations = buildConversationTree(rootDialog)
  
  // 返回第一个conversation作为树的根节点
  return rootConversations.length > 0 ? rootConversations[0] : null
}

/**
 * 从conversation树中提取线性对话历史
 * 用于ChatPanel显示当前对话路径
 */
export function extractChatHistoryFromConversationTree(
  rootNode: ConversationTreeNode | null,
  targetConversationId?: number
): Array<{
  id: number
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  isStarred: boolean
  comment?: string
  conversationId: number
}> {
  if (!rootNode) return []

  const chatHistory: Array<{
    id: number
    role: 'user' | 'assistant'
    content: string
    timestamp: string
    isStarred: boolean
    comment?: string
    conversationId: number
  }> = []

  /**
   * 深度优先搜索，找到目标conversation的路径
   * 如果没有指定目标，则返回最长路径（最新的对话）
   */
  function findConversationPath(
    node: ConversationTreeNode,
    currentPath: ConversationTreeNode[],
    targetId?: number
  ): ConversationTreeNode[] | null {
    currentPath.push(node)

    // 如果找到目标，返回当前路径
    if (targetId && node.conversationId === targetId) {
      return [...currentPath]
    }

    // 如果没有子节点
    if (!node.children || node.children.length === 0) {
      // 如果没有指定目标，返回当前路径（叶子节点路径）
      if (!targetId) {
        return [...currentPath]
      }
      currentPath.pop()
      return null
    }

    // 递归搜索子节点
    for (const child of node.children) {
      const result = findConversationPath(child, currentPath, targetId)
      if (result) {
        return result
      }
    }

    currentPath.pop()
    return null
  }

  // 找到对话路径
  const conversationPath = findConversationPath(rootNode, [], targetConversationId)
  
  if (conversationPath) {
    // 转换为ChatPanel需要的格式
    conversationPath.forEach(node => {
      chatHistory.push({
        id: node.conversationId,
        role: node.type,
        content: node.type === 'user' ? (node.prompt || node.title) : (node.answer || node.title),
        timestamp: node.createdAt,
        isStarred: node.isStarred,
        comment: node.comment,
        conversationId: node.conversationId
      })
    })
  }

  return chatHistory
}

/**
 * 根据conversationId找到对应的conversation节点
 */
export function findConversationNodeById(
  rootNode: ConversationTreeNode | null,
  conversationId: number
): ConversationTreeNode | null {
  if (!rootNode) return null

  if (rootNode.conversationId === conversationId) {
    return rootNode
  }

  if (rootNode.children) {
    for (const child of rootNode.children) {
      const found = findConversationNodeById(child, conversationId)
      if (found) return found
    }
  }

  return null
} 