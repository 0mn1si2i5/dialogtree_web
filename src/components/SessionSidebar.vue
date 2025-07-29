<template>
  <div class="session-sidebar">
    <!-- 顶部工具栏 -->
    <div class="sidebar-header">
      <a-tabs v-model:active-key="activeTab" size="small" class="sidebar-tabs">
        <a-tab-pane key="sessions" title="会话列表" />
        <a-tab-pane key="categories" title="分类管理" />
      </a-tabs>
    </div>

    <!-- 会话列表标签页 -->
    <div v-if="activeTab === 'sessions'" class="tab-content">
      <!-- 分类筛选 -->
      <div class="category-filter">
        <a-select
          v-model="selectedCategoryId"
          placeholder="选择分类"
          allow-clear
          @change="handleCategoryChange"
          @clear="handleCategoryClear"
        >
          <a-option value="all">全部分类</a-option>
          <a-option 
            v-for="category in categories"
            :key="category.id"
            :value="category.id"
          >
            {{ category.name }}
          </a-option>
        </a-select>
        
        <a-button 
          type="primary" 
          size="small" 
          @click="showCreateSessionModal = true"
        >
          新建会话
        </a-button>
      </div>

      <!-- 会话列表 -->
      <div class="session-list">
        <a-spin :loading="sessionStore.loading">
          <div 
            v-for="session in filteredSessions"
            :key="session.id"
            class="session-item"
            :class="{ active: session.id === currentSessionId }"
            @click="selectSession(session.id)"
          >
            <div class="session-info">
              <div class="session-title" :title="session.title">
                {{ session.title }}
              </div>
              <div class="session-meta">
                <span class="session-time">
                  {{ formatTime(session.updatedAt) }}
                </span>
                <span v-if="session.summary" class="session-summary">
                  {{ session.summary }}
                </span>
              </div>
            </div>
            
            <a-dropdown trigger="click" @select="(key) => handleSessionAction(key, session)">
              <a-button type="text" size="mini" @click.stop class="session-more-btn">
                <template #icon>
                  <icon-more />
                </template>
              </a-button>
              <template #content>
                <a-doption value="rename">重命名</a-doption>
                <a-doption value="move">移动到分类</a-doption>
                <a-doption value="delete" class="danger">删除</a-doption>
              </template>
            </a-dropdown>
          </div>
          
          <a-empty 
            v-if="filteredSessions.length === 0 && !sessionStore.loading"
            description="暂无会话"
          />
        </a-spin>
      </div>
    </div>

    <!-- 分类管理标签页 -->
    <div v-if="activeTab === 'categories'" class="tab-content">
      <div class="category-actions">
        <a-button 
          type="primary" 
          size="small" 
          @click="showCreateCategoryModal = true"
        >
          新建分类
        </a-button>
      </div>

      <div class="category-list">
        <a-spin :loading="sessionStore.loading">
          <div 
            v-for="category in categories"
            :key="category.id"
            class="category-item"
          >
            <div class="category-info">
              <div class="category-name">{{ category.name }}</div>
              <div class="category-count">
                {{ getSessionCountByCategory(category.id) }} 个会话
              </div>
            </div>
            
            <a-dropdown trigger="click" @select="(key) => handleCategoryAction(key, category)">
              <a-button type="text" size="mini">
                <template #icon>
                  <icon-more />
                </template>
              </a-button>
              <template #content>
                <a-doption value="rename">重命名</a-doption>
                <a-doption value="delete" class="danger">删除</a-doption>
              </template>
            </a-dropdown>
          </div>
          
          <a-empty 
            v-if="categories.length === 0 && !sessionStore.loading"
            description="暂无分类"
          />
        </a-spin>
      </div>
    </div>

    <!-- 新建会话模态框 -->
    <a-modal
      v-model:visible="showCreateSessionModal"
      title="新建会话"
      @ok="handleCreateSession"
      @cancel="resetCreateSessionForm"
    >
      <a-form :model="createSessionForm" layout="vertical">
        <a-form-item label="会话标题" required>
          <a-input 
            v-model="createSessionForm.title" 
            placeholder="请输入会话标题"
            @keyup.enter="handleCreateSession"
          />
        </a-form-item>
        <a-form-item label="选择分类" required>
          <a-select v-model="createSessionForm.categoryID" placeholder="选择分类">
            <a-option 
              v-for="category in categories"
              :key="category.id"
              :value="category.id"
            >
              {{ category.name }}
            </a-option>
          </a-select>
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 新建分类模态框 -->
    <a-modal
      v-model:visible="showCreateCategoryModal"
      title="新建分类"
      @ok="handleCreateCategory"
      @cancel="resetCreateCategoryForm"
    >
      <a-form :model="createCategoryForm" layout="vertical">
        <a-form-item label="分类名称" required>
          <a-input 
            v-model="createCategoryForm.name" 
            placeholder="请输入分类名称"
            @keyup.enter="handleCreateCategory"
          />
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 会话重命名模态框 -->
    <a-modal
      v-model:visible="showRenameSessionModal"
      title="重命名会话"
      @ok="handleRenameSession"
      @cancel="resetRenameSessionForm"
    >
      <a-form :model="renameSessionForm" layout="vertical">
        <a-form-item label="会话标题" required>
          <a-input 
            v-model="renameSessionForm.title" 
            placeholder="请输入新的会话标题"
            @keyup.enter="handleRenameSession"
          />
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 会话修改分类模态框 -->
    <a-modal
      v-model:visible="showMoveSessionModal"
      title="修改分类"
      @ok="handleMoveSession"
      @cancel="resetMoveSessionForm"
    >
      <a-form :model="moveSessionForm" layout="vertical">
        <a-form-item label="选择分类" required>
          <a-select v-model="moveSessionForm.categoryID" placeholder="选择新的分类">
            <a-option 
              v-for="category in categories"
              :key="category.id"
              :value="category.id"
            >
              {{ category.name }}
            </a-option>
          </a-select>
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 分类重命名模态框 -->
    <a-modal
      v-model:visible="showRenameCategoryModal"
      title="重命名分类"
      @ok="handleRenameCategory"
      @cancel="resetRenameCategoryForm"
    >
      <a-form :model="renameCategoryForm" layout="vertical">
        <a-form-item label="分类名称" required>
          <a-input 
            v-model="renameCategoryForm.name" 
            placeholder="请输入新的分类名称"
            @keyup.enter="handleRenameCategory"
          />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Message, Modal } from '@arco-design/web-vue'
import { useSessionStore, useDialogStore, useLayoutStore } from '@/stores'
import { 
  IconMore 
} from '@arco-design/web-vue/es/icon'
import dayjs from 'dayjs'
import type { Session, Category } from '@/types'

// 使用stores
const sessionStore = useSessionStore()
const dialogStore = useDialogStore()
const layoutStore = useLayoutStore()

// 响应式状态
const activeTab = ref('sessions')
const selectedCategoryId = ref<number | string | null>(null)
const showCreateSessionModal = ref(false)
const showCreateCategoryModal = ref(false)
const showRenameSessionModal = ref(false)
const showMoveSessionModal = ref(false)
const showRenameCategoryModal = ref(false)

// 表单数据
const createSessionForm = ref({
  title: '',
  categoryID: null as number | null,
})

const createCategoryForm = ref({
  name: '',
})

const renameSessionForm = ref({
  sessionId: null as number | null,
  title: '',
})

const moveSessionForm = ref({
  sessionId: null as number | null,
  categoryID: null as number | null,
})

const renameCategoryForm = ref({
  categoryId: null as number | null,
  name: '',
})

// 计算属性
const currentSessionId = computed(() => sessionStore.currentSessionId)
const categories = computed(() => sessionStore.categories)
const filteredSessions = computed(() => sessionStore.filteredSessions)

// 监听分类选择变化
watch(selectedCategoryId, (newCategoryId) => {
  if (newCategoryId === 'all') {
    sessionStore.setSelectedCategory(null)
  } else {
    sessionStore.setSelectedCategory(newCategoryId as number)
  }
})

// ===== 方法 =====

// 格式化时间
function formatTime(timeStr: string): string {
  return dayjs(timeStr).format('MM-DD HH:mm')
}

// 获取分类下的会话数量
function getSessionCountByCategory(categoryId: number): number {
  return sessionStore.sessions.filter(s => s.categoryID === categoryId).length
}

// 选择会话
async function selectSession(sessionId: number) {
  try {
    sessionStore.setCurrentSession(sessionId)
    await dialogStore.fetchDialogTree(sessionId)
  } catch (error) {
    Message.error('加载会话失败')
  }
}

// 分类筛选变化
async function handleCategoryChange(categoryId: number | string) {
  if (categoryId !== 'all') {
    try {
      await sessionStore.fetchSessionsByCategory(categoryId as number)
    } catch (error) {
      // 降级处理已在store中实现
    }
  }
}

// 清除分类筛选
function handleCategoryClear() {
  selectedCategoryId.value = null
}

// 会话操作
function handleSessionAction(action: string, session: Session) {
  switch (action) {
    case 'rename':
      showRenameSessionDialog(session)
      break
    case 'move':
      showMoveSessionDialog(session)
      break
    case 'delete':
      confirmDeleteSession(session)
      break
  }
}

// 分类操作
function handleCategoryAction(action: string, category: Category) {
  switch (action) {
    case 'rename':
      showRenameCategoryDialog(category)
      break
    case 'delete':
      confirmDeleteCategory(category)
      break
  }
}

// 确认删除会话
function confirmDeleteSession(session: Session) {
  Modal.confirm({
    title: '确认删除',
    content: `确定要删除会话"${session.title}"吗？此操作不可恢复。`,
    onOk: async () => {
      try {
        await sessionStore.deleteSession(session.id)
        Message.success('删除成功')
      } catch (error) {
        Message.error('删除失败')
      }
    }
  })
}

// 确认删除分类
function confirmDeleteCategory(category: Category) {
  const sessionCount = getSessionCountByCategory(category.id)
  if (sessionCount > 0) {
    Message.warning(`该分类下还有 ${sessionCount} 个会话，请先移动或删除这些会话`)
    return
  }

  Modal.confirm({
    title: '确认删除',
    content: `确定要删除分类"${category.name}"吗？`,
    onOk: async () => {
      try {
        await sessionStore.deleteCategory(category.id)
        Message.success('删除成功')
      } catch (error) {
        Message.error('删除失败')
      }
    }
  })
}

// 创建会话
async function handleCreateSession() {
  if (!createSessionForm.value.title?.trim()) {
    Message.warning('请输入会话标题')
    return
  }
  if (!createSessionForm.value.categoryID) {
    Message.warning('请选择分类')
    return
  }

  try {
    await sessionStore.createSession(
      createSessionForm.value.title.trim(),
      createSessionForm.value.categoryID
    )
    Message.success('创建成功')
    showCreateSessionModal.value = false
    resetCreateSessionForm()
  } catch (error) {
    Message.error('创建失败')
  }
}

// 创建分类
async function handleCreateCategory() {
  if (!createCategoryForm.value.name?.trim()) {
    Message.warning('请输入分类名称')
    return
  }

  try {
    await sessionStore.createCategory(createCategoryForm.value.name.trim())
    Message.success('创建成功')
    showCreateCategoryModal.value = false
    resetCreateCategoryForm()
  } catch (error) {
    Message.error('创建失败')
  }
}

// 重置表单
function resetCreateSessionForm() {
  createSessionForm.value = {
    title: '',
    categoryID: null,
  }
}

function resetCreateCategoryForm() {
  createCategoryForm.value = {
    name: '',
  }
}

// 显示会话重命名对话框
function showRenameSessionDialog(session: Session) {
  renameSessionForm.value = {
    sessionId: session.id,
    title: session.title,
  }
  showRenameSessionModal.value = true
}

// 显示会话移动分类对话框
function showMoveSessionDialog(session: Session) {
  moveSessionForm.value = {
    sessionId: session.id,
    categoryID: session.categoryID,
  }
  showMoveSessionModal.value = true
}

// 显示分类重命名对话框
function showRenameCategoryDialog(category: Category) {
  renameCategoryForm.value = {
    categoryId: category.id,
    name: category.name,
  }
  showRenameCategoryModal.value = true
}

// 处理会话重命名
async function handleRenameSession() {
  if (!renameSessionForm.value.title?.trim() || !renameSessionForm.value.sessionId) {
    Message.warning('请输入会话标题')
    return
  }

  try {
    const sessionId = renameSessionForm.value.sessionId
    const currentSession = sessionStore.sessions.find(s => s.id === sessionId)
    if (!currentSession) {
      Message.error('会话不存在')
      return
    }

    await sessionStore.updateSession(sessionId, {
      title: renameSessionForm.value.title.trim(),
      categoryID: currentSession.categoryID,
    })
    
    Message.success('重命名成功')
    showRenameSessionModal.value = false
    resetRenameSessionForm()
  } catch (error) {
    Message.error('重命名失败')
  }
}

// 处理会话移动分类
async function handleMoveSession() {
  if (!moveSessionForm.value.categoryID || !moveSessionForm.value.sessionId) {
    Message.warning('请选择分类')
    return
  }

  try {
    const sessionId = moveSessionForm.value.sessionId
    const currentSession = sessionStore.sessions.find(s => s.id === sessionId)
    if (!currentSession) {
      Message.error('会话不存在')
      return
    }

    await sessionStore.updateSession(sessionId, {
      title: currentSession.title,
      categoryID: moveSessionForm.value.categoryID,
    })
    
    Message.success('移动成功')
    showMoveSessionModal.value = false
    resetMoveSessionForm()
  } catch (error) {
    Message.error('移动失败')
  }
}

// 处理分类重命名
async function handleRenameCategory() {
  if (!renameCategoryForm.value.name?.trim() || !renameCategoryForm.value.categoryId) {
    Message.warning('请输入分类名称')
    return
  }

  try {
    await sessionStore.updateCategory(
      renameCategoryForm.value.categoryId,
      renameCategoryForm.value.name.trim()
    )
    
    Message.success('重命名成功')
    showRenameCategoryModal.value = false
    resetRenameCategoryForm()
  } catch (error) {
    Message.error('重命名失败')
  }
}

// 重置表单
function resetRenameSessionForm() {
  renameSessionForm.value = {
    sessionId: null,
    title: '',
  }
}

function resetMoveSessionForm() {
  moveSessionForm.value = {
    sessionId: null,
    categoryID: null,
  }
}

function resetRenameCategoryForm() {
  renameCategoryForm.value = {
    categoryId: null,
    name: '',
  }
}

</script>

<style lang="less" scoped>
.session-sidebar {
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: #fff;
}

.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px 16px;
  border-bottom: 1px solid #e5e5e5;
  background-color: #fff;
  flex-shrink: 0;
}

.sidebar-tabs {
  flex: 0 0 auto;
}

.tab-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.category-filter {
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.category-actions {
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;
}

.session-list,
.category-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px 0;
  width: 100%; // 确保列表容器占满宽度
}

.session-item,
.category-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  cursor: pointer;
  transition: background-color 0.2s;
  min-height: 60px; // 确保有足够高度
  width: 100%; // 确保占满宽度

  &:hover {
    background-color: #f5f5f5;
  }

  &.active {
    background-color: #e6f7ff;
    border-right: 3px solid #1890ff;
  }
}

.session-info,
.category-info {
  flex: 1;
  min-width: 0;
}

// 确保下拉按钮靠右
.category-item .arco-dropdown,
.session-item .arco-dropdown {
  flex-shrink: 0;
  margin-left: 8px;
}

// 会话更多按钮样式
.session-more-btn {
  opacity: 1 !important;
  visibility: visible !important;
  background-color: rgba(0, 0, 0, 0.04) !important;
  border: 1px solid #d9d9d9 !important;
  transition: all 0.2s;
  
  &:hover {
    opacity: 1 !important;
    background-color: rgba(0, 0, 0, 0.08) !important;
    border-color: #40a9ff !important;
  }
  
  // 确保图标可见
  .arco-icon {
    color: #666 !important;
    font-size: 12px !important;
  }
}

.session-item:hover .session-more-btn {
  opacity: 1 !important;
  background-color: rgba(0, 0, 0, 0.06) !important;
}

.session-title,
.category-name {
  font-weight: 500;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.session-meta {
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: 12px;
  color: #666;
}

.session-time {
  color: #999;
}

.session-summary {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.category-count {
  font-size: 12px;
  color: #999;
}

// 危险操作样式
:deep(.arco-dropdown-option.danger) {
  color: #f5222d;
  
  &:hover {
    background-color: #fff2f0;
  }
}
</style>