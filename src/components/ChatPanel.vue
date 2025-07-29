<template>
  <div class="chat-panel" :data-mode="chatPanelMode">
    <!-- 顶部工具栏 -->
    <div class="chat-header">
      <div class="header-title">
        <span v-if="currentSession">{{ currentSession.title }}</span>
        <span v-else>选择会话开始对话</span>
      </div>
      
      <div class="header-actions">
        <!-- 按钮 a: 最大化/恢复正常大小 -->
        <a-button 
          v-if="chatPanelMode !== 'hidden'"
          type="text" 
          size="small" 
          @click="toggleMaximize"
          :title="chatPanelMode === 'normal' ? '最大化聊天面板' : '恢复正常大小'"
        >
          <template #icon>
            <icon-fullscreen v-if="chatPanelMode === 'normal'" />
            <icon-fullscreen-exit v-else />
          </template>
        </a-button>
      </div>
    </div>

    <!-- 聊天消息区域 -->
    <div class="chat-messages" ref="messagesRef">
      <div class="message-list">
        <!-- 历史消息 -->
        <div 
          v-for="message in currentChatHistory"
          :key="message.id"
          class="message-item"
          :class="`${message.role}-message`"
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
            <div class="message-text">
              <MarkdownRenderer :content="message.content" />
            </div>
            <div class="message-actions">
              <div class="message-time">
                {{ formatTime(message.timestamp) }}
              </div>
              <div class="action-buttons">
                <a-button 
                  type="text" 
                  size="mini"
                  @click="toggleStar(message.conversationId!)"
                  :class="{ starred: message.isStarred }"
                >
                  <template #icon>
                    <icon-star-fill v-if="message.isStarred" />
                    <icon-star v-else />
                  </template>
                </a-button>
                
                <a-button type="text" size="mini" @click="showCommentModal(message)">
                  <template #icon>
                    <icon-message />
                  </template>
                </a-button>
                
                <a-button 
                  v-if="message.role === 'assistant'"
                  type="text" 
                  size="mini"
                  @click="continueFromMessage(message)"
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
        <div 
          v-if="isStreaming && streamingContent"
          class="message-item assistant-message streaming"
        >
          <div class="message-avatar">
            <div class="assistant-avatar">
              <icon-robot />
            </div>
          </div>
          <div class="message-content">
            <div class="message-text">
              <MarkdownRenderer :content="streamingContent" />
              <span class="cursor">|</span>
            </div>
          </div>
        </div>

        <!-- 空状态 -->
        <div v-if="currentChatHistory.length === 0 && !isStreaming" class="empty-chat">
          <a-empty description="点击对话树中的节点查看对话历史" />
        </div>
      </div>
    </div>

    <!-- 输入区域 -->
    <div class="chat-input" v-if="currentSession">
      <div class="input-container">
        <a-textarea
          v-model="inputMessage"
          placeholder="输入您的问题..."
          :auto-size="{ minRows: 1, maxRows: 4 }"
          :disabled="isStreaming"
          @keydown.ctrl.enter="sendMessage"
          @keydown.meta.enter="sendMessage"
        />
        <a-button 
          type="primary" 
          :loading="isStreaming"
          :disabled="!inputMessage.trim() || isStreaming"
          @click="sendMessage"
        >
          <template #icon>
            <icon-send />
          </template>
          发送
        </a-button>
      </div>
      
      <div class="input-tip">
        <span>Ctrl + Enter 快速发送</span>
        <span v-if="selectedConversationId">
          将从选中节点继续对话
        </span>
      </div>
    </div>

    <!-- 评论模态框 -->
    <a-modal
      v-model:visible="showCommentModalVisible"
      title="添加评论"
      @ok="handleSaveComment"
      @cancel="handleCancelComment"
    >
      <a-form :model="commentForm" layout="vertical">
        <a-form-item label="评论内容">
          <a-textarea
            v-model="commentForm.comment"
            placeholder="请输入评论..."
            :auto-size="{ minRows: 3, maxRows: 6 }"
            @keydown.ctrl.enter="handleSaveComment"
          />
        </a-form-item>
      </a-form>
      
      <template #footer>
        <a-button @click="handleCancelComment">取消</a-button>
        <a-button 
          type="primary" 
          @click="handleSaveComment"
          :loading="commentLoading"
        >
          保存
        </a-button>
      </template>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { Message } from '@arco-design/web-vue'
import { useSessionStore, useDialogStore, useLayoutStore } from '@/stores'
import { 
  IconUser, 
  IconRobot, 
  IconStar, 
  IconStarFill, 
  IconMessage, 
  IconBranch, 
  IconSend,
  IconFullscreen,
  IconFullscreenExit
} from '@arco-design/web-vue/es/icon'
import dayjs from 'dayjs'
import type { ChatMessage } from '@/types'
import MarkdownRenderer from '@/components/MarkdownRenderer.vue'

// 使用stores
const sessionStore = useSessionStore()
const dialogStore = useDialogStore()
const layoutStore = useLayoutStore()

// 响应式状态
const inputMessage = ref('')
const messagesRef = ref<HTMLElement>()
const showCommentModalVisible = ref(false)
const commentLoading = ref(false)
const commentForm = ref({
  conversationId: null as number | null,
  comment: '',
})

// 计算属性
const currentSession = computed(() => sessionStore.currentSession)
const currentChatHistory = computed(() => dialogStore.currentChatHistory)
const selectedConversationId = computed(() => dialogStore.selectedConversationId)
const isStreaming = computed(() => dialogStore.isStreaming)
const streamingContent = computed(() => dialogStore.streamingContent)
const streamingError = computed(() => dialogStore.streamingError)
const chatPanelMode = computed(() => layoutStore.chatPanelMode)

// 监听聊天历史变化，自动滚动到底部
watch(currentChatHistory, () => {
  nextTick(() => {
    scrollToBottom()
  })
}, { deep: true })

// 监听流式内容变化，自动滚动
watch(streamingContent, () => {
  nextTick(() => {
    scrollToBottom()
  })
})

// 监听流式错误
watch(streamingError, (error) => {
  if (error) {
    Message.error(`对话失败: ${error}`)
    dialogStore.clearStreamingState()
  }
})

// ===== 方法 =====

// 格式化时间
function formatTime(timeStr: string): string {
  return dayjs(timeStr).format('MM-DD HH:mm')
}

// 发送消息
async function sendMessage() {
  if (!inputMessage.value.trim() || !currentSession.value || isStreaming.value) {
    return
  }

  const content = inputMessage.value.trim()
  inputMessage.value = ''

  try {
    const request = {
      content,
      sessionId: currentSession.value.id,
      parentConversationId: selectedConversationId.value || undefined,
    }

    await dialogStore.createDialog(request)
    Message.success('对话创建成功')
  } catch (error) {
    console.error('Failed to create dialog:', error)
    Message.error('发送失败，请重试')
  }
}

// 标星/取消标星
async function toggleStar(conversationId: number) {
  try {
    const result = await dialogStore.toggleStar(conversationId)
    const action = result.isStarred ? '已标星' : '已取消标星'
    Message.success(action)
  } catch (error) {
    Message.error('操作失败')
  }
}

// 显示评论模态框
function showCommentModal(message: ChatMessage) {
  if (!message.conversationId) return
  
  commentForm.value = {
    conversationId: message.conversationId,
    comment: message.comment || '',
  }
  showCommentModalVisible.value = true
}

// 保存评论
async function handleSaveComment() {
  if (!commentForm.value.conversationId) return

  try {
    commentLoading.value = true
    await dialogStore.updateComment(
      commentForm.value.conversationId,
      commentForm.value.comment.trim()
    )
    Message.success('评论保存成功')
    showCommentModalVisible.value = false
  } catch (error) {
    Message.error('保存失败')
  } finally {
    commentLoading.value = false
  }
}

// 取消评论
function handleCancelComment() {
  showCommentModalVisible.value = false
  commentForm.value = {
    conversationId: null,
    comment: '',
  }
}

// 从消息继续对话
function continueFromMessage(message: ChatMessage) {
  if (message.conversationId) {
    dialogStore.setSelectedConversation(message.conversationId)
    Message.info('已选择此节点作为分叉起点，现在可以输入新问题')
  }
}

// 滚动到底部
function scrollToBottom() {
  if (messagesRef.value) {
    const element = messagesRef.value
    element.scrollTop = element.scrollHeight
  }
}

// 切换最大化状态
function toggleMaximize() {
  if (chatPanelMode.value === 'normal') {
    layoutStore.setChatPanelMode('expanded')
  } else if (chatPanelMode.value === 'expanded') {
    layoutStore.setChatPanelMode('normal')
  }
}

</script>

<style lang="less" scoped>
.chat-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: #fff;
}

.chat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid #e5e5e5;
  background-color: #fff;
  flex-shrink: 0;
}

.header-title {
  font-weight: 500;
  color: #333;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px 0;
}

.message-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 0 16px;
}

.message-item {
  display: flex;
  gap: 12px;
  
  &.user-message {
    flex-direction: row-reverse;
    
    .message-content {
      background-color: #1890ff;
      color: white;
      max-width: 70%;
      
      .message-text {
        word-wrap: break-word;
      }
    }
  }
  
  &.assistant-message {
    .message-content {
      background-color: #f5f5f5;
      color: #333;
      max-width: 70%;
      
      .message-text {
        word-wrap: break-word;
      }
    }
    
    &.streaming {
      .cursor {
        animation: blink 1s infinite;
      }
    }
  }
}

// 全屏模式下增加对话框的最大宽度，优化头像位置
.chat-panel[data-mode="expanded"] {
  .message-list {
    padding: 0 8px; // 减少左右内边距，从16px减到8px
  }
  
  .message-item {
    gap: 8px; // 减少头像和消息的间距，从12px减到8px
    
    &.user-message .message-content {
      max-width: 80%;
    }
    
    &.assistant-message .message-content {
      max-width: 90%;
    }
  }
}

.message-avatar {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  
  .user-avatar,
  .assistant-avatar {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
  }
  
  .user-avatar {
    background-color: #1890ff;
    color: white;
  }
  
  .assistant-avatar {
    background-color: #52c41a;
    color: white;
  }
}

.message-content {
  border-radius: 12px;
  padding: 12px 16px;
  position: relative;
  min-width: 0;
}

.message-text {
  line-height: 1.6;
  margin-bottom: 8px;
  
  // 确保markdown渲染器占满整个文本区域
  .markdown-renderer {
    width: 100%;
  }
}

.message-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 8px;
  opacity: 0.7;
  transition: opacity 0.2s;
  
  .message-item:hover & {
    opacity: 1;
  }
}

.message-time {
  font-size: 12px;
  color: #999;
}

.action-buttons {
  display: flex;
  gap: 4px;
  
  .arco-btn.starred {
    color: #fa8c16;
  }
}

.chat-input {
  border-top: 1px solid #e5e5e5;
  padding: 16px;
  flex-shrink: 0;
}

.input-container {
  display: flex;
  gap: 12px;
  align-items: flex-end;
  
  .arco-textarea-wrapper {
    flex: 1;
  }
}

.input-tip {
  display: flex;
  justify-content: space-between;
  margin-top: 8px;
  font-size: 12px;
  color: #999;
}

.empty-chat {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: #999;
}

// 光标闪烁动画
@keyframes blink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0; }
}

// 展开模式样式调整
.chat-panel[data-mode="expanded"] {
  .chat-messages {
    .message-list {
      max-width: calc(100vw - 40px); // todo
      margin: 0 auto;
    }
  }
}

// 隐藏模式样式
.chat-panel[data-mode="hidden"] {
  .chat-header {
    display: none;
  }
  
  .chat-messages,
  .chat-input {
    display: none;
  }
}
</style>