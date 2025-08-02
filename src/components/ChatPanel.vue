<template>
  <div class="chat-panel" :data-mode="chatPanelMode">
    <!-- 顶部工具栏 -->
    <div class="chat-header">
      <div class="header-title">
        <span v-if="currentSession">{{ currentSession.title }}</span>
        <span v-else>{{ $t('chat.selectSession') }}</span>
        
        <!-- 重命名会话按钮 -->
        <a-button 
          v-if="currentSession"
          type="text" 
          size="mini"
          @click="showRenameSessionDialog"
          :title="$t('chat.renameSession')"
          class="rename-session-btn"
        >
          <template #icon>
            <icon-edit />
          </template>
        </a-button>
      </div>
      
      <div class="header-actions">
        <!-- 按钮 a: 隐藏聊天面板 -->
        <a-button 
          v-if="chatPanelMode !== 'hidden'"
          type="text" 
          size="small" 
          @click="hideChatPanel"
          :title="$t('chat.hidePanel')"
        >
          <template #icon>
            <icon-right />
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
                  :title="message.isStarred ? $t('chat.unstar') : $t('chat.star')"
                >
                  <template #icon>
                    <icon-star-fill v-if="message.isStarred" />
                    <icon-star v-else />
                  </template>
                </a-button>
                
                <a-button 
                  type="text" 
                  size="mini"
                  @click="showCommentModal(message)"
                  :class="{ commented: message.comment && message.comment.trim() }"
                  :title="$t('chat.addComment')"
                >
                  <template #icon>
                    <icon-message />
                  </template>
                </a-button>
                
                <a-button 
                  v-if="message.role === 'assistant'"
                  type="text" 
                  size="mini"
                  @click="continueFromMessage(message)"
                  :title="$t('chat.continueConversation')"
                >
                  <template #icon>
                    <icon-branch />
                  </template>
                </a-button>
                
                <a-button 
                  type="text" 
                  size="mini"
                  @click="copyMessageContent(message.content)"
                  :title="$t('chat.copyContent')"
                  class="copy-button"
                >
                  <template #icon>
                    <icon-copy />
                  </template>
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
          <a-empty :description="$t('chat.emptyState')" />
        </div>
      </div>
    </div>

    <!-- 输入区域 -->
    <div class="chat-input" v-if="currentSession">
      <div class="input-container">
        <a-textarea
          v-model="inputMessage"
          :placeholder="$t('chat.inputPlaceholder')"
          :auto-size="{ minRows: 1, maxRows: 12}"
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
          {{ $t('chat.send') }}
        </a-button>
      </div>
      
      <div class="input-tip">
        <span>{{ $t('chat.sendTip') }}</span>
<!--        <span v-if="selectedConversationId">-->
<!--          {{ $t('chat.continueFromNode') }}-->
<!--        </span>-->
      </div>
    </div>

    <!-- 评论模态框 -->
    <a-modal
      v-model:visible="showCommentModalVisible"
      :title="$t('chat.addCommentModal')"
      width="600px"
      :body-style="{ padding: '10px 20px 0 20px' }"
      :footer-style="{ borderTop: '10px solid #f0f0f0', paddingTop: '10px' }"
      @ok="handleSaveComment"
      @cancel="handleCancelComment"
    >
      <a-form :model="commentForm" layout="vertical">
        <a-form-item>
          <a-textarea
            v-model="commentForm.comment"
            :placeholder="$t('chat.addCommentPlaceholder')"
            :auto-size="{ minRows: 4, maxRows: 10 }"
            @keydown.ctrl.enter="handleSaveComment"
          />
        </a-form-item>
      </a-form>
      
      <template #footer>
        <a-button @click="handleCancelComment">{{ $t('common.cancel') }}</a-button>
        <a-button 
          type="primary" 
          @click="handleSaveComment"
          :loading="commentLoading"
        >
          {{ $t('common.save') }}
        </a-button>
      </template>
    </a-modal>

    <!-- 重命名会话模态框 -->
    <a-modal
      v-model:visible="showRenameSessionModal"
      :title="$t('chat.renameSession')"
      width="400px"
      :body-style="{ padding: '20px' }"
      :ok-loading="renameSessionLoading"
      @ok="handleRenameSession"
      @cancel="resetRenameSessionForm"
    >
      <a-form :model="renameSessionForm" layout="vertical">
        <a-form-item :label="$t('session.sessionTitle')" required>
          <a-input 
            v-model="renameSessionForm.title"
            :placeholder="$t('session.enterSessionTitle')"
            @keydown.enter="handleRenameSession"
          />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
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
  IconLeft,
  IconRight,
  IconCopy,
  IconEdit
} from '@arco-design/web-vue/es/icon'
import dayjs from 'dayjs'
import type { ChatMessage } from '@/types'
import MarkdownRenderer from '@/components/MarkdownRenderer.vue'

// 使用stores和i18n
const sessionStore = useSessionStore()
const dialogStore = useDialogStore()
const layoutStore = useLayoutStore()
const { t } = useI18n()

// 响应式状态
const inputMessage = ref('')
const messagesRef = ref<HTMLElement>()
const showCommentModalVisible = ref(false)
const commentLoading = ref(false)
const commentForm = ref({
  conversationId: null as number | null,
  comment: '',
})

// 重命名会话相关状态
const showRenameSessionModal = ref(false)
const renameSessionLoading = ref(false)
const renameSessionForm = ref({
  sessionId: null as number | null,
  title: '',
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
      commentForm.value.comment // 不使用 trim()，允许保存空评论（包括空字符串）
    )
    Message.success(t('chat.commentSaveSuccess'))
    showCommentModalVisible.value = false
  } catch (error) {
    Message.error(t('chat.commentSaveFailed'))
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
    Message.info(t('chat.nodeSelected'))
  }
}

// 复制消息内容到剪贴板
async function copyMessageContent(content: string) {
  try {
    await navigator.clipboard.writeText(content)
    Message.success(t('chat.copySuccess'))
  } catch (error) {
    console.error('复制失败:', error)
    Message.error(t('chat.copyFailed'))
  }
}

// 滚动到底部
function scrollToBottom() {
  if (messagesRef.value) {
    const element = messagesRef.value
    element.scrollTop = element.scrollHeight
  }
}

// 隐藏聊天面板
function hideChatPanel() {
  layoutStore.setChatPanelMode('hidden')
}

// 显示重命名会话对话框
function showRenameSessionDialog() {
  if (!currentSession.value) return
  
  renameSessionForm.value = {
    sessionId: currentSession.value.id,
    title: currentSession.value.title
  }
  showRenameSessionModal.value = true
}

// 处理会话重命名
async function handleRenameSession() {
  if (!renameSessionForm.value.title?.trim() || !renameSessionForm.value.sessionId) {
    Message.warning(t('chat.enterTitle'))
    return
  }
  
  try {
    renameSessionLoading.value = true
    const currentSession = sessionStore.currentSession
    
    await sessionStore.updateSession(renameSessionForm.value.sessionId, {
      title: renameSessionForm.value.title.trim(),
      categoryID: currentSession?.categoryID || 1,
    })
    
    Message.success(t('chat.renameSuccess'))
    showRenameSessionModal.value = false
    resetRenameSessionForm()
  } catch (error) {
    Message.error(t('chat.renameFailed'))
  } finally {
    renameSessionLoading.value = false
  }
}

// 重置重命名表单
function resetRenameSessionForm() {
  renameSessionForm.value = {
    sessionId: null,
    title: '',
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
  padding: 8px 16px;
  border-bottom: 1px solid #f0f0f0;
  background-color: #fff;
  flex-shrink: 0;
  height: 60px;
}

.header-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;
  font-size: 16px;
  color: #333;
  
  .rename-session-btn {
    opacity: 0;
    transition: opacity 0.2s ease;
    
    &:hover {
      color: #1890ff;
    }
  }
  
  &:hover .rename-session-btn {
    opacity: 1;
  }
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
  gap: 10px;
  padding: 0 16px;
  min-height: calc(100% - 32px);
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
  padding: 10px 12px;
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

// 用户消息中的时间颜色调整
.user-message .message-time {
  color: rgba(255, 255, 255, 0.8);
}

.action-buttons {
  display: flex;
  gap: 4px;
  
  // 放大按钮尺寸
  .arco-btn {
    font-size: 16px !important;
    width: 28px !important;
    height: 28px !important;
  }
  
  .arco-btn.starred {
    color: #fa8c16;
  }
  
  .arco-btn.commented {
    color: #fa8c16;
  }
}

.chat-input {
  border-top: 1px solid #f0f0f0;
  padding: 16px 16px 6px 16px;
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
  margin-top: 4px;
  font-size: 12px;
  color: #999;
}

.empty-chat {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
  min-height: 200px;
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