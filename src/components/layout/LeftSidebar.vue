<template>
  <div class="left-sidebar">
    <!-- 项目Logo区域 -->
    <div class="logo-header">
      <div class="logo-content">
        <div class="logo-icon">
          <img src="/dt-logo.png" alt="DialogTree Logo" />
        </div>
        <span class="logo-text">DialogTree</span>
      </div>
    </div>
    
    <!-- 标签页工具栏 -->
    <div class="sidebar-header">
      <a-tabs v-model:active-key="activeTab" size="small" class="sidebar-tabs" type="text" hide-content>
        <a-tab-pane key="sessions" :title="$t('sidebar.sessions')" />
        <a-tab-pane key="categories" :title="$t('sidebar.categories')" />
      </a-tabs>
    </div>

    <!-- 会话列表标签页 -->
    <div v-if="activeTab === 'sessions'" class="tab-content">
      <!-- 分类筛选 -->
      <div class="category-filter">
        <a-select
          v-model="selectedCategoryId"
          :placeholder="$t('sidebar.selectCategory')"
          allow-clear
          @change="handleCategoryChange"
          @clear="handleCategoryClear"
        >
          <a-option value="all">{{ $t('sidebar.allCategories') }}</a-option>
          <a-option 
            v-for="category in categories"
            :key="category.id"
            :value="category.id"
          >
            {{ category.name }}
          </a-option>
        </a-select>
      </div>

      <!-- 会话列表 -->
      <div class="session-list">
        <a-spin :loading="sessionStore.loading">
          <transition-group name="session-list" tag="div" class="session-list-container">
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
            
            <a-dropdown trigger="click" @select="(key: string) => handleSessionAction(key, session)">
              <a-button type="text" size="mini" @click.stop>
                <template #icon>
                  <icon-more />
                </template>
              </a-button>
              <template #content>
                <a-doption value="rename">{{ $t('session.rename') }}</a-doption>
                <a-doption value="move">{{ $t('session.move') }}</a-doption>
                <a-doption value="delete" class="danger">{{ $t('session.delete') }}</a-doption>
              </template>
            </a-dropdown>
            </div>
          </transition-group>
          
          <a-empty 
            v-if="filteredSessions.length === 0 && !sessionStore.loading"
            :description="$t('sidebar.noSessions')"
          />
        </a-spin>
      </div>
      
      <!-- 底部新建会话按钮 -->
      <div class="session-footer">
        <a-button 
          type="primary" 
          size="medium"
          block
          @click="showCreateSessionModal = true"
        >
          {{ $t('sidebar.newSession') }}
        </a-button>
      </div>
    </div>

    <!-- 分类管理标签页 -->
    <div v-if="activeTab === 'categories'" class="tab-content">
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
            
            <a-dropdown trigger="click" @select="(key: string) => handleCategoryAction(key, category)">
              <a-button type="text" size="mini">
                <template #icon>
                  <icon-more />
                </template>
              </a-button>
              <template #content>
                <a-doption value="rename">{{ $t('session.rename') }}</a-doption>
                <a-doption value="delete" class="danger">{{ $t('session.delete') }}</a-doption>
              </template>
            </a-dropdown>
          </div>
          
          <a-empty 
            v-if="categories.length === 0 && !sessionStore.loading"
            :description="$t('sidebar.noCategories')"
          />
        </a-spin>
      </div>
      
      <!-- 底部新建分类按钮 -->
      <div class="category-footer">
        <a-button 
          type="primary" 
          size="medium"
          block
          @click="showCreateCategoryModal = true"
        >
          {{ $t('sidebar.newCategory') }}
        </a-button>
      </div>
    </div>

    <!-- 模态框组件 -->
    <SessionModals
      v-model:showCreateSessionModal="showCreateSessionModal"
      v-model:showCreateCategoryModal="showCreateCategoryModal"
      v-model:showRenameSessionModal="showRenameSessionModal"
      v-model:showMoveSessionModal="showMoveSessionModal"
      v-model:showRenameCategoryModal="showRenameCategoryModal"
      :createSessionForm="createSessionForm"
      :createCategoryForm="createCategoryForm"
      :renameSessionForm="renameSessionForm"
      :moveSessionForm="moveSessionForm"
      :renameCategoryForm="renameCategoryForm"
      :categories="categories"
      @create-session="handleCreateSession"
      @create-category="handleCreateCategory"
      @rename-session="handleRenameSession"
      @move-session="handleMoveSession"
      @rename-category="handleRenameCategory"
      @reset-create-session-form="resetCreateSessionForm"
      @reset-create-category-form="resetCreateCategoryForm"
      @reset-rename-session-form="resetRenameSessionForm"
      @reset-move-session-form="resetMoveSessionForm"
      @reset-rename-category-form="resetRenameCategoryForm"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { Message, Modal } from '@arco-design/web-vue'
import { useSessionStore, useDialogStore, useLocaleStore } from '@/stores'
import { IconMore } from '@arco-design/web-vue/es/icon'
import dayjs from 'dayjs'
import type { Session, Category } from '@/types'
import SessionModals from './SessionModals.vue'

// 使用stores和i18n
const sessionStore = useSessionStore()
const dialogStore = useDialogStore()
const localeStore = useLocaleStore()
const { t } = useI18n()

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
    // 直接设置选中的分类ID，让计算属性自动过滤
    sessionStore.setSelectedCategory(categoryId as number)
  } else {
    // 显示所有分类
    sessionStore.setSelectedCategory(null)
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
.left-sidebar {
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: #fff;
  overflow-x: hidden;
  width: 100%;
  box-sizing: border-box;
}

.logo-header {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px 16px;
  border-bottom: 1px solid #e5e5e5;
  background-color: #fff;
  flex-shrink: 0;
  height: 65px;
}

.logo-content {
  display: flex;
  align-items: center;
  gap: 8px;
}

.logo-icon {
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  
  img {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }
}

.logo-text {
  font-size: 18px;
  font-weight: bold;
  color: #1890ff;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 45px;
  //border-bottom: 1px solid #e5e5e5;
  //border-top: 1px solid #e5e5e5;
  background-color: #fff;
  flex-shrink: 0;
  width: 100%;
  box-sizing: border-box;
  min-height: 48px;
}

.sidebar-tabs {
  flex: 0 0 auto;
  width: 100%;
}

// 修改arco-tabs-content的布局，不使用flex
:deep(.sidebar-tabs .arco-tabs-content) {
  justify-content: center;
  position: relative;
  width: 100%;
  height: auto;
}

// 让tabs标签在水平方向居中
:deep(.sidebar-tabs .arco-tabs-nav) {
  justify-content: center;
}

:deep(.sidebar-tabs .arco-tabs-nav-tab-list) {
  justify-content: center;
}

.tab-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  width: 100%;
  max-width: 100%;
  height: 100%;
}

.category-filter {
  padding: 6px 16px;
  width: 100%;
  box-sizing: border-box;
  flex-shrink: 0;
}

.session-list,
.category-list {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  width: 100%;
  box-sizing: border-box;
  position: relative;
  
  // 让a-spin组件占据全部高度
  .arco-spin {
    height: 100%;
    display: flex;
    flex-direction: column;
  }
  
  // 当没有内容时，让a-empty垂直居中
  .arco-empty {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
  }
}

.session-footer,
.category-footer {
  padding: 16px 16px 16px 16px;
  border-top: 1px solid #f0f0f0;
  background-color: #fff;
  width: 100%;
  box-sizing: border-box;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  
  .arco-btn {
    width: 100%;
  }
}

.session-item,
.category-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  cursor: pointer;
  transition: background-color 0.2s;
  min-height: 60px;
  width: 100%;
  box-sizing: border-box;
  overflow: hidden;

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
  overflow: hidden;
  padding-right: 8px;
  word-break: break-all;
  word-wrap: break-word;
  box-sizing: border-box;
}

// 确保下拉按钮固定位置和大小
.category-item .arco-dropdown,
.session-item .arco-dropdown {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  display: flex;
  justify-content: center;
  align-items: center;
}

// 确保按钮本身可点击
.category-item .arco-dropdown .arco-btn,
.session-item .arco-dropdown .arco-btn {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  pointer-events: auto;
  min-width: 0;
}

.session-title,
.category-name {
  font-weight: 500;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  min-width: 0;
}

.session-meta {
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: 12px;
  color: #666;
  width: 100%;
  max-width: 100%;
  overflow: hidden;
  min-width: 0;
}

.session-time {
  color: #999;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  width: 100%;
  min-width: 0;
}

.session-summary {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  min-width: 0;
}

.category-count {
  font-size: 12px;
  color: #999;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  width: 100%;
  min-width: 0;
}

// 修复arco-spin导致的宽度问题
:deep(.arco-spin) {
  display: block !important;
  width: 100% !important;
}

// 危险操作样式
:deep(.arco-dropdown-option.danger) {
  color: #f5222d;
  
  &:hover {
    background-color: #fff2f0;
  }
}

// 会话列表动画
.session-list-container {
  position: relative;
}

.session-list-move,
.session-list-enter-active,
.session-list-leave-active {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.session-list-enter-from {
  opacity: 0;
  transform: translateY(-10px);
}

.session-list-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

.session-list-leave-active {
  position: absolute;
  width: 100%;
}

// 为会话项添加过渡效果
.session-item {
  transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  
  &:hover {
    transform: translateX(2px);
  }
}
</style>