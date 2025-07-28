// 基础接口定义

// API响应基础结构
export interface ApiResponse<T = any> {
  code: number
  data: T
  msg: string
}

// 分类 Category
export interface Category {
  id: number
  name: string
  createdAt: string
  updatedAt: string
}

// 会话 Session  
export interface Session {
  id: number
  title: string
  summary: string
  categoryID: number
  createdAt: string
  updatedAt: string
}

// 对话 Conversation
export interface Conversation {
  id: number
  prompt: string
  answer: string
  title?: string
  summary?: string
  isStarred: boolean
  comment: string
  createdAt: string
  dialogId?: number
  parentConversationId?: number
}

// Dialog 分支
export interface Dialog {
  id: number
  sessionId: number
  parentId: number | null
  conversations: Conversation[]
  createdAt: string
}

// 对话树节点 (用于D3.js可视化)
export interface DialogTreeNode {
  id: number
  title?: string
  content?: string
  type: 'user' | 'assistant' | 'root'
  conversationId?: number
  dialogId?: number
  children?: DialogTreeNode[]
  x?: number
  y?: number
}

// 对话树数据结构
export interface DialogTreeData {
  sessionId: number
  sessionInfo: Session
  dialogTree: DialogTreeNode | null
}

// 创建会话的请求参数
export interface CreateSessionRequest {
  title: string
  categoryID: number
}

// 创建对话的请求参数
export interface CreateDialogRequest {
  content: string
  sessionId: number
  parentConversationId?: number
}

// SSE事件类型
export interface SSEEvent {
  type: 'message' | 'done' | 'error'
  content?: string
  data?: any
}

// 评论更新请求
export interface UpdateCommentRequest {
  id: number
  comment: string
}

// 分类创建请求
export interface CreateCategoryRequest {
  name: string
}

// 分类更新请求  
export interface UpdateCategoryRequest {
  id: number
  name: string
}

// 分页响应数据
export interface PaginatedResponse<T> {
  count: number
  list: T[]
}

// 用户状态
export interface UserState {
  isAuthenticated: boolean
  username?: string
}

// 应用状态
export interface AppState {
  loading: boolean
  error: string | null
  theme: 'light' | 'dark'
}

// 聊天状态
export interface ChatState {
  isStreaming: boolean
  streamingContent: string
  currentInput: string
}

// 缩放配置
export interface ZoomConfig {
  scale: number
  translateX: number
  translateY: number
  minScale: number
  maxScale: number
} 