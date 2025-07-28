<template>
  <a-modal
    :visible="visible"
    title="对话详情"
    width="600px"
    :footer="false"
    @cancel="closeModal"
    @update:visible="(value: boolean) => emit('update:visible', value)"
  >
    <div v-if="conversation" class="conversation-detail">
      <!-- 对话基本信息 -->
      <div class="conversation-info">
        <div class="info-row">
          <span class="label">对话标题:</span>
          <span class="value">{{ conversation.title || '无标题' }}</span>
        </div>
        <div class="info-row">
          <span class="label">创建时间:</span>
          <span class="value">{{ formatTime(conversation.createdAt) }}</span>
        </div>
        <div class="info-row" v-if="conversation.summary">
          <span class="label">对话摘要:</span>
          <span class="value">{{ conversation.summary }}</span>
        </div>
      </div>

      <!-- 用户提问 -->
      <div class="conversation-content">
        <div class="question-section">
          <h4><icon-user /> 用户提问</h4>
          <div class="content-box">
            {{ conversation.prompt || '无提问内容' }}
          </div>
        </div>

        <!-- AI回答 -->
        <div class="answer-section">
          <h4><icon-robot /> AI回答</h4>
          <div class="content-box">
            {{ conversation.answer || '无回答内容' }}
          </div>
        </div>
      </div>

      <!-- 用户评论 -->
      <div class="comment-section">
        <h4><icon-message /> 用户评论</h4>
        <div class="comment-input-wrapper">
          <a-textarea
            v-model="localComment"
            placeholder="添加您的评论... (Ctrl+Enter快速提交)"
            :auto-size="{ minRows: 2, maxRows: 4 }"
            @keydown="handleCommentKeydown"
            @blur="handleCommentBlur"
          />
          <div class="comment-actions">
            <a-button 
              size="small" 
              type="primary" 
              @click="saveComment"
              :loading="commentSaving"
              :disabled="!isCommentChanged"
            >
              {{ commentSaving ? '保存中...' : '保存评论' }}
            </a-button>
            <a-button 
              size="small" 
              @click="cancelComment"
              :disabled="commentSaving"
            >
              取消
            </a-button>
          </div>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="action-buttons">
        <a-button 
          :type="conversation.isStarred ? 'primary' : 'secondary'"
          @click="toggleStar"
          :loading="starLoading"
        >
          <template #icon>
            <icon-star :style="{ color: conversation.isStarred ? '#faad14' : '' }" />
          </template>
          {{ conversation.isStarred ? '已收藏' : '收藏' }}
        </a-button>
        
        <a-button type="primary" @click="continueFromHere">
          <template #icon>
            <icon-branch />
          </template>
          从此处继续对话
        </a-button>
        
        <a-button @click="closeModal">
          关闭
        </a-button>
      </div>
    </div>
  </a-modal>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { 
  IconUser, 
  IconRobot, 
  IconMessage, 
  IconStar, 
  IconBranch 
} from '@arco-design/web-vue/es/icon'
import { useDialogStore } from '@/stores/dialog'
import { formatTime } from '@/utils/format'
import type { Conversation } from '@/types'

interface Props {
  visible: boolean
  conversationId?: number | null
}

interface Emits {
  (e: 'update:visible', value: boolean): void
  (e: 'continue-from-here', conversationId: number): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const dialogStore = useDialogStore()

// 响应式数据
const localComment = ref('')
const starLoading = ref(false)
const commentSaving = ref(false)

// 计算属性
const conversation = computed(() => {
  if (!props.conversationId) return null
  return dialogStore.selectedConversation
})

const isCommentChanged = computed(() => {
  return localComment.value !== (conversation.value?.comment || '')
})

// 监听conversationId变化，设置选中的对话
watch(() => props.conversationId, (newId) => {
  if (newId) {
    dialogStore.setSelectedConversation(newId)
  }
}, { immediate: true })

// 监听选中的对话变化，更新本地评论
watch(conversation, (newConversation) => {
  if (newConversation) {
    localComment.value = newConversation.comment || ''
  }
}, { immediate: true })

// 方法
const closeModal = () => {
  emit('update:visible', false)
  // 清空选中状态
  dialogStore.setSelectedConversation(null)
}

const toggleStar = async () => {
  if (!conversation.value) return
  
  starLoading.value = true
  try {
    const newStarStatus = await dialogStore.starConversation(conversation.value.id)
    // 更新本地状态
    conversation.value.isStarred = newStarStatus
  } catch (error) {
    console.error('标星操作失败:', error)
  } finally {
    starLoading.value = false
  }
}

const saveComment = async () => {
  if (!conversation.value || commentSaving.value || !isCommentChanged.value) return
  
  commentSaving.value = true
  try {
    await dialogStore.updateComment(conversation.value.id, localComment.value)
    // 更新本地状态
    conversation.value.comment = localComment.value
    
    // 提示保存成功
    console.log('评论已保存')
  } catch (error) {
    console.error('保存评论失败:', error)
    // 恢复原始评论
    localComment.value = conversation.value.comment || ''
  } finally {
    commentSaving.value = false
  }
}

const cancelComment = () => {
  // 恢复到原始评论
  localComment.value = conversation.value?.comment || ''
}

const handleCommentKeydown = (event: KeyboardEvent) => {
  // Ctrl+Enter 快速提交
  if (event.ctrlKey && event.key === 'Enter') {
    event.preventDefault()
    saveComment()
  }
}

const handleCommentBlur = () => {
  // 失焦时不自动保存，等用户主动点击保存按钮
  // 这样用户有更多控制权
}

const continueFromHere = () => {
  if (!conversation.value) return
  
  // 触发从此处继续对话的事件
  emit('continue-from-here', conversation.value.id)
  closeModal()
}
</script>

<style lang="less" scoped>
.conversation-detail {
  .conversation-info {
    margin-bottom: 20px;
    padding: 16px;
    background: var(--bg-tertiary);
    border-radius: 8px;
    
    .info-row {
      display: flex;
      margin-bottom: 8px;
      
      &:last-child {
        margin-bottom: 0;
      }
      
      .label {
        width: 80px;
        color: var(--text-secondary);
        font-weight: 500;
      }
      
      .value {
        flex: 1;
        color: var(--text-primary);
      }
    }
  }
  
  .conversation-content {
    margin-bottom: 20px;
    
    .question-section,
    .answer-section {
      margin-bottom: 16px;
      
      h4 {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 8px;
        color: var(--text-primary);
        font-size: 14px;
        font-weight: 500;
      }
      
      .content-box {
        padding: 12px;
        background: var(--bg-secondary);
        border-radius: 6px;
        line-height: 1.6;
        color: var(--text-primary);
        white-space: pre-wrap;
        word-wrap: break-word;
      }
    }
    
    .question-section {
      h4 {
        color: #1890ff;
      }
      
      .content-box {
        border-left: 3px solid #1890ff;
      }
    }
    
    .answer-section {
      h4 {
        color: #52c41a;
      }
      
      .content-box {
        border-left: 3px solid #52c41a;
      }
    }
  }
  
  .comment-section {
    margin-bottom: 20px;
    
    h4 {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;
      color: var(--text-primary);
      font-size: 14px;
      font-weight: 500;
    }
    
    .comment-input-wrapper {
      .comment-actions {
        margin-top: 8px;
        display: flex;
        gap: 8px;
        justify-content: flex-end;
      }
    }
  }
  
  .action-buttons {
    display: flex;
    gap: 12px;
    justify-content: flex-end;
    padding-top: 16px;
    border-top: 1px solid var(--border-color-light);
  }
}
</style> 