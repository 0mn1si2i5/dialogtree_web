// ===== 基础数据类型 =====

export interface Session {
  id: number
  title: string
  summary: string
  categoryID: number
  createdAt: string
  updatedAt: string
}

export interface Category {
  id: number
  name: string
  createdAt: string
  updatedAt: string
}

export interface Conversation {
  id: number
  title: string
  summary: string
  prompt: string
  answer: string
  isStarred: boolean
  comment: string
  createdAt: string
  sessionID: number
  dialogID: number
}

// ===== Dialog树相关类型 =====

export interface DialogNode {
  dialogId: number
  parentId: number | null
  conversations: Conversation[]
  children: DialogNode[]
}

export interface DialogTreeData {
  sessionId: number
  sessionInfo: Session
  dialogTree: DialogNode[] | null
}

// ===== 前端转换后的Conversation树类型 =====

export interface ConversationTreeNode {
  id: number
  type: 'user' | 'assistant' | 'conversation'
  content: string
  conversationId: number
  dialogId: number
  title: string
  summary: string
  isStarred: boolean
  comment: string
  createdAt: string
  children: ConversationTreeNode[]
  parentId?: number
}

// ===== API响应类型 =====

export interface ApiResponse<T = any> {
  code: number
  data: T
  msg: string
}

// ===== SSE相关类型 =====

export interface SSEMessage {
  type: 'message' | 'done' | 'error'
  content?: string
  data?: {
    dialogId: number
    conversationId: number
  }
}

// ===== Chat相关类型 =====

export interface ChatMessage {
  id: number
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  conversationId?: number
  isStarred?: boolean
  comment?: string
}

export interface CreateDialogRequest {
  content: string
  sessionId: number
  parentConversationId?: number
}

// ===== UI状态类型 =====

export type PanelMode = 'hidden' | 'normal' | 'expanded'

export interface LayoutState {
  sidebarVisible: boolean
  chatPanelMode: PanelMode
}

// ===== 组件Props类型 =====

export interface TreeVisualizationProps {
  conversationTree: ConversationTreeNode | null
  selectedNodeId: number | null
  ancestorNodeIds: number[]
  starredNodeIds: number[]
}

export interface ChatPanelProps {
  panelMode: PanelMode
  messages: ChatMessage[]
  isStreaming: boolean
  streamingContent: string
}