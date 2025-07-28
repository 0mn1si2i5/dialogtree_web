<template>
  <div class="chat-panel">
    <!-- 顶部工具栏 -->
    <div class="chat-header">
      <div class="header-title">
        <span>对话</span>
      </div>
      <div class="header-actions">
        <a-button 
          type="text" 
          size="small"
          @click="clearChat"
          :disabled="!hasMessages"
        >
          清空
        </a-button>
      </div>
    </div>

    <!-- 对话消息区域 -->
    <div class="chat-messages" ref="messagesRef">
      <div v-if="!hasMessages" class="empty-chat">
        <div class="empty-icon">
          <icon-message />
        </div>
        <div class="empty-text">开始一段新的对话</div>
        <div class="empty-hint">选择左侧的会话或创建新会话开始聊天</div>
      </div>
      
      <div v-else class="message-list">
        <!-- 历史消息 -->
        <div 
          v-for="message in messages" 
          :key="message.id"
          class="message-item"
          :class="{ 'user-message': message.role === 'user', 'assistant-message': message.role === 'assistant' }"
        >
          <div class="message-avatar">
            <div v-if="message.role === 'user'" class="user-avatar">
              <icon-user />
            </div>
            <div v-else class="assistant-avatar">
              <icon-robot />
            </div>
          </div>
          <div class="message-content">
            <div class="message-text">{{ message.content }}</div>
            <div class="message-actions">
              <div class="message-time">
                {{ formatTime(message.timestamp) }}
              </div>
              <div class="action-buttons">
                <a-button 
                  type="text" 
                  size="mini"
                  @click="starMessage(message.id)"
                >
                  <template #icon>
                    <icon-star :style="{ color: message.isStarred ? '#faad14' : '' }" />
                  </template>
                </a-button>
                <a-button 
                  type="text" 
                  size="mini"
                  @click="showCommentDialog(message)"
                >
                  <template #icon>
                    <icon-message />
                  </template>
                </a-button>
                <a-button 
                  type="text" 
                  size="mini"
                  @click="continueFromHere(message.id)"
                  v-if="message.role === 'assistant'"
                >
                  <template #icon>
                    <icon-branch />
                  </template>
                  分叉
                </a-button>
              </div>
            </div>
          </div>
        </div>

        <!-- 流式输出消息 -->
        <div v-if="isStreaming" class="message-item assistant-message streaming">
          <div class="message-avatar">
            <div class="assistant-avatar">
              <icon-robot />
            </div>
          </div>
          <div class="message-content">
            <div class="message-text">
              {{ streamingContent }}
              <span class="cursor">|</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 底部输入区域 -->
    <div class="chat-input">
      <div class="input-container">
        <a-textarea
          v-model="inputText"
          placeholder="输入您的问题..."
          :auto-size="{ minRows: 1, maxRows: 4 }"
          :disabled="isStreaming"
          @keydown.enter.exact.prevent="sendMessage"
          @keydown.enter.shift.exact="addNewLine"
        />
        <div class="input-actions">
          <a-button 
            type="primary"
            :loading="isStreaming"
            :disabled="!inputText.trim() || isStreaming"
            @click="sendMessage"
          >
            <template #icon>
              <icon-send />
            </template>
            发送
          </a-button>
        </div>
      </div>
    </div>

    <!-- 评论对话框 -->
    <a-modal
      v-model:visible="commentModalVisible"
      title="添加评论"
      @ok="saveComment"
      @cancel="cancelComment"
    >
      <a-textarea
        v-model="commentText"
        placeholder="输入您的评论..."
        :auto-size="{ minRows: 3, maxRows: 6 }"
      />
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, watch } from 'vue'
import { 
  IconMessage, 
  IconUser, 
  IconRobot, 
  IconStar, 
  IconBranch, 
  IconSend 
} from '@arco-design/web-vue/es/icon'
import { useSessionStore } from '@/stores/session'
import { useDialogStore } from '@/stores/dialog'
import { formatTime } from '@/utils/format'

// Store
const sessionStore = useSessionStore()
const dialogStore = useDialogStore()

// 响应式数据
const inputText = ref('')
const commentModalVisible = ref(false)
const commentText = ref('')
const currentCommentMessage = ref<any>(null)
const messagesRef = ref<HTMLElement>()

// 模拟消息数据结构
interface ChatMessage {
  id: number
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  isStarred: boolean
  comment?: string
}

const messages = ref<ChatMessage[]>([])

// 计算属性
const currentSession = computed(() => sessionStore.currentSession)
const isStreaming = computed(() => dialogStore.isStreaming)
const streamingContent = computed(() => dialogStore.streamingContent)
const hasMessages = computed(() => messages.value.length > 0 || isStreaming.value)

// 监听当前会话变化
watch(currentSession, (newSession) => {
  if (newSession) {
    // 加载会话的对话历史
    loadChatHistory(newSession.id)
  } else {
    messages.value = []
  }
})

// 监听对话历史变化，同步到聊天面板
watch(() => dialogStore.currentChatHistory, (newHistory) => {
  if (newHistory && newHistory.length > 0) {
    messages.value = newHistory.map(item => ({
      id: item.conversationId,
      role: item.role,
      content: item.content,
      timestamp: item.timestamp,
      isStarred: item.isStarred,
      comment: item.comment
    }))
  }
}, { immediate: true, deep: true })

// 方法
const sendMessage = async () => {
  if (!inputText.value.trim() || !currentSession.value || isStreaming.value) {
    return
  }

  const userMessage: ChatMessage = {
    id: Date.now(),
    role: 'user',
    content: inputText.value.trim(),
    timestamp: new Date().toISOString(),
    isStarred: false
  }

  messages.value.push(userMessage)
  const messageContent = inputText.value.trim()
  inputText.value = ''

  // 滚动到底部
  await nextTick()
  scrollToBottom()

  try {
    // 发送消息到后端
    await dialogStore.createDialog({
      content: messageContent,
      sessionId: currentSession.value.id,
      parentConversationId: undefined // 暂时不支持从特定消息分叉
    })
    
    // SSE流式响应处理在dialogStore中已经完成
    // 响应完成后会自动重新加载对话树，然后通过watch更新聊天历史
  } catch (error) {
    console.error('发送消息失败:', error)
    // 可以在这里显示错误提示
  }
}

const addNewLine = () => {
  inputText.value += '\n'
}

const clearChat = () => {
  messages.value = []
  dialogStore.clearStreaming()
}

const starMessage = async (messageId: number) => {
  const message = messages.value.find(m => m.id === messageId)
  if (message) {
    try {
      // 这里需要对应的conversationId，暂时模拟
      // const isStarred = await dialogStore.starConversation(conversationId)
      message.isStarred = !message.isStarred
    } catch (error) {
      console.error('标星操作失败:', error)
    }
  }
}

const showCommentDialog = (message: ChatMessage) => {
  currentCommentMessage.value = message
  commentText.value = message.comment || ''
  commentModalVisible.value = true
}

const saveComment = async () => {
  if (currentCommentMessage.value) {
    try {
      // 这里需要对应的conversationId，暂时模拟
      // await dialogStore.updateComment(conversationId, commentText.value)
      currentCommentMessage.value.comment = commentText.value
      commentModalVisible.value = false
      currentCommentMessage.value = null
      commentText.value = ''
    } catch (error) {
      console.error('保存评论失败:', error)
    }
  }
}

const cancelComment = () => {
  commentModalVisible.value = false
  currentCommentMessage.value = null
  commentText.value = ''
}

const continueFromHere = (messageId: number) => {
  // 实现从此消息开始分叉对话的逻辑
  console.log('从此处分叉对话:', messageId)
  // 这里需要实现分叉逻辑
}

const loadChatHistory = async (sessionId: number) => {
  // 加载对话树数据，对话历史会通过watch自动更新
  await dialogStore.fetchDialogTree(sessionId)
}

const scrollToBottom = () => {
  if (messagesRef.value) {
    messagesRef.value.scrollTop = messagesRef.value.scrollHeight
  }
}

// 监听流式内容变化，自动滚动
watch(streamingContent, () => {
  nextTick(() => {
    scrollToBottom()
  })
})
</script>

<style lang="less" scoped>
.chat-panel {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid var(--border-color-light);
  background: var(--bg-primary);
}

.header-title {
  font-size: 16px;
  font-weight: 500;
  color: var(--text-primary);
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.empty-chat {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  text-align: center;
  color: var(--text-tertiary);
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.empty-text {
  font-size: 18px;
  margin-bottom: 8px;
  color: var(--text-secondary);
}

.empty-hint {
  font-size: 14px;
}

.message-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.message-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  
  &.user-message {
    flex-direction: row-reverse;
    
    .message-content {
      background: var(--primary-color);
      color: white;
      margin-right: 40px;
    }
  }
  
  &.assistant-message {
    .message-content {
      background: var(--bg-tertiary);
      margin-left: 40px;
    }
  }
  
  &.streaming {
    .message-content {
      border: 1px dashed var(--border-color);
    }
  }
}

.message-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.user-avatar {
  background: var(--primary-color);
  color: white;
}

.assistant-avatar {
  background: var(--success-color);
  color: white;
}

.message-content {
  flex: 1;
  padding: 12px 16px;
  border-radius: 12px;
  position: relative;
}

.message-text {
  line-height: 1.6;
  word-wrap: break-word;
}

.cursor {
  animation: blink 1s infinite;
}

@keyframes blink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0; }
}

.message-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 8px;
  opacity: 0;
  transition: opacity 0.2s;
}

.message-item:hover .message-actions {
  opacity: 1;
}

.message-time {
  font-size: 12px;
  color: var(--text-tertiary);
}

.action-buttons {
  display: flex;
  gap: 4px;
}

.chat-input {
  padding: 16px;
  border-top: 1px solid var(--border-color-light);
  background: var(--bg-primary);
}

.input-container {
  position: relative;
}

.input-actions {
  position: absolute;
  right: 8px;
  bottom: 8px;
}

// 重写 textarea 样式
:deep(.arco-textarea) {
  padding-right: 80px;
  resize: none;
  border-radius: 12px;
  
  &:focus {
    border-color: var(--primary-color);
    box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
  }
}
</style> 