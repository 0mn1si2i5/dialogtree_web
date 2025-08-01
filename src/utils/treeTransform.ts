import type { DialogNode, ConversationTreeNode, Conversation } from '@/types'

/**
 * 将后端Dialog树结构转换为前端Conversation树结构
 * 
 * 转换逻辑：
 * 1. 每个dialog内的conversations按时间排序，形成线性链
 * 2. 分叉点连接到子dialog的第一个conversation
 * 3. 每个conversation作为一个单独的节点展示(不再分离user/assistant)
 */
export function transformDialogTreeToConversationTree(
  dialogNodes: DialogNode[] | null
): ConversationTreeNode | null {
  if (!dialogNodes || dialogNodes.length === 0) {
    return null
  }

  // 递归转换每个dialog节点
  function transformDialogNode(dialog: DialogNode): ConversationTreeNode[] {
    const nodes: ConversationTreeNode[] = []
    
    // 按时间排序conversations
    const sortedConversations = [...dialog.conversations].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    )

    let previousNode: ConversationTreeNode | null = null

    for (let i = 0; i < sortedConversations.length; i++) {
      const conv = sortedConversations[i]
      
      // 每个conversation创建为单个节点
      const conversationNode: ConversationTreeNode = {
        id: conv.id, // 直接使用conversation ID
        type: 'conversation', // 新类型表示完整对话
        content: conv.answer, // 主要内容显示回答
        conversationId: conv.id,
        dialogId: conv.dialogID,
        title: conv.title,
        summary: conv.summary,
        isStarred: conv.isStarred,
        comment: conv.comment,
        createdAt: conv.createdAt,
        children: [],
      }

      // 建立父子关系
      if (i === 0) {
        // 第一个conversation作为这个dialog的根节点
        nodes.push(conversationNode)
        previousNode = conversationNode
      } else {
        // 后续conversations连接到前一个节点
        if (previousNode) {
          previousNode.children.push(conversationNode)
          previousNode = conversationNode
        }
      }

      // 如果是最后一个conversation且有子dialog，连接分叉
      if (i === sortedConversations.length - 1 && dialog.children.length > 0) {
        for (const childDialog of dialog.children) {
          const childNodes = transformDialogNode(childDialog)
          if (childNodes.length > 0) {
            conversationNode.children.push(...childNodes)
          }
        }
      }
    }

    return nodes
  }

  // 转换根dialog（通常是第一个）
  const rootNodes = transformDialogNode(dialogNodes[0])
  
  // 返回根节点
  return rootNodes.length > 0 ? rootNodes[0] : null
}

/**
 * 从对话树中提取聊天历史记录
 * 根据选中的conversation ID，提取从根节点到该节点的完整路径
 */
export function extractChatHistoryFromConversationTree(
  conversationTree: ConversationTreeNode | null,
  targetConversationId: number
): ConversationTreeNode[] {
  if (!conversationTree) return []

  const path: ConversationTreeNode[] = []

  function findPath(node: ConversationTreeNode): boolean {
    path.push(node)

    // 找到目标节点
    if (node.conversationId === targetConversationId) {
      return true
    }

    // 递归搜索子节点
    for (const child of node.children) {
      if (findPath(child)) {
        return true
      }
    }

    // 回溯：如果当前路径不通向目标，移除当前节点
    path.pop()
    return false
  }

  findPath(conversationTree)
  return path
}

/**
 * 从祖先API数据构建聊天历史
 * 用于在聊天面板中显示完整的问答历史
 */
export function buildChatHistoryFromAncestors(
  ancestors: Conversation[],
  currentConversation?: Conversation
): ConversationTreeNode[] {
  const history: ConversationTreeNode[] = []
  
  // 处理祖先节点，为每个conversation创建用户问题和AI回答
  for (const conv of ancestors) {
    // 添加用户问题
    if (conv.prompt && conv.prompt.trim()) {
      history.push({
        id: conv.id * 1000, // 使用特殊ID避免冲突
        type: 'user',
        content: conv.prompt,
        conversationId: conv.id,
        dialogId: conv.dialogID,
        title: conv.title,
        summary: conv.summary,
        isStarred: conv.isStarred,
        comment: conv.comment,
        createdAt: conv.createdAt,
        children: [],
      })
    }

    // 添加AI回答
    if (conv.answer && conv.answer.trim()) {
      history.push({
        id: conv.id * 1000 + 1, // 使用特殊ID避免冲突
        type: 'assistant',
        content: conv.answer,
        conversationId: conv.id,
        dialogId: conv.dialogID,
        title: conv.title,
        summary: conv.summary,
        isStarred: conv.isStarred,
        comment: conv.comment,
        createdAt: conv.createdAt,
        children: [],
      })
    }
  }

  // 如果提供了当前conversation且不在ancestors中，添加它
  if (currentConversation && !ancestors.find(a => a.id === currentConversation.id)) {
    if (currentConversation.prompt && currentConversation.prompt.trim()) {
      history.push({
        id: currentConversation.id * 1000,
        type: 'user',
        content: currentConversation.prompt,
        conversationId: currentConversation.id,
        dialogId: currentConversation.dialogID,
        title: currentConversation.title,
        summary: currentConversation.summary,
        isStarred: currentConversation.isStarred,
        comment: currentConversation.comment,
        createdAt: currentConversation.createdAt,
        children: [],
      })
    }

    if (currentConversation.answer && currentConversation.answer.trim()) {
      history.push({
        id: currentConversation.id * 1000 + 1,
        type: 'assistant',
        content: currentConversation.answer,
        conversationId: currentConversation.id,
        dialogId: currentConversation.dialogID,
        title: currentConversation.title,
        summary: currentConversation.summary,
        isStarred: currentConversation.isStarred,
        comment: currentConversation.comment,
        createdAt: currentConversation.createdAt,
        children: [],
      })
    }
  }

  return history
}

/**
 * 获取节点的所有祖先节点ID
 * 用于高亮显示祖先路径
 */
export function getAncestorNodeIds(
  conversationTree: ConversationTreeNode | null,
  targetConversationId: number
): number[] {
  const path = extractChatHistoryFromConversationTree(conversationTree, targetConversationId)
  return path.map(node => node.conversationId).filter((id, index, arr) => arr.indexOf(id) === index)
}

/**
 * 获取所有收藏的节点ID
 */
export function getStarredNodeIds(conversationTree: ConversationTreeNode | null): number[] {
  if (!conversationTree) return []

  const starredIds: number[] = []

  function traverse(node: ConversationTreeNode) {
    if (node.isStarred) {
      starredIds.push(node.conversationId)
    }
    for (const child of node.children) {
      traverse(child)
    }
  }

  traverse(conversationTree)
  return Array.from(new Set(starredIds)) // 去重
}

/**
 * 获取对话树中最新的conversation ID
 * 遍历整个树找到 createdAt 时间最新的节点
 */
export function getLatestConversationId(conversationTree: ConversationTreeNode | null): number | null {
  if (!conversationTree) return null

  let latestNode: ConversationTreeNode | null = null
  let latestTime = 0

  function traverse(node: ConversationTreeNode) {
    const nodeTime = new Date(node.createdAt).getTime()
    if (nodeTime > latestTime) {
      latestTime = nodeTime
      latestNode = node
    }
    
    for (const child of node.children) {
      traverse(child)
    }
  }

  traverse(conversationTree)
  return latestNode ? latestNode.conversationId : null
}