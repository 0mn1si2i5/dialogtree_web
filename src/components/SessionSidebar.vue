<template>
  <div class="session-sidebar">
    <!-- 标题 -->
    <div class="sidebar-header">
      <h2 class="title">DialogTree</h2>
    </div>

    <!-- 标签页 -->
    <div class="sidebar-tabs">
      <a-tabs v-model:active-key="activeTab" size="small">
        <!-- 会话列表标签页 -->
        <a-tab-pane key="sessions" title="会话列表">
          <!-- 新建会话按钮 -->
          <div class="tab-header">
            <a-button 
              type="primary" 
              size="small" 
              @click="createNewSession"
              :loading="loading"
              block
            >
              <template #icon>
                <icon-plus />
              </template>
              新建对话
            </a-button>
          </div>

          <!-- 分类筛选 -->
          <div class="category-filter">
            <a-select 
              v-model="selectedCategoryId"
              placeholder="选择分类"
              size="small"
              style="width: 100%"
              @change="onCategoryChange"
              allow-clear
            >
              <a-option :value="null">全部分类</a-option>
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
            <div v-if="filteredSessions.length === 0" class="empty-state">
              <a-empty description="暂无会话">
                <a-button size="small" @click="createNewSession">
                  创建第一个对话
                </a-button>
              </a-empty>
            </div>

            <div
              v-for="session in filteredSessions"
              :key="session.id"
              class="session-item"
              :class="{ active: isCurrentSession(session.id) }"
              @click="selectSession(session.id)"
            >
              <div class="session-content">
                <div class="session-title">{{ truncateText(session.title || '未命名对话', 20) }}</div>
                <div class="session-summary">{{ truncateText(session.summary || '暂无摘要', 30) }}</div>
                <div class="session-meta">
                  <span class="session-time">{{ formatRelativeTime(session.createdAt) }}</span>
                </div>
              </div>
              
              <div class="session-actions" @click.stop>
                <a-dropdown trigger="click">
                  <a-button type="text" size="mini">
                    <template #icon>
                      <icon-more />
                    </template>
                  </a-button>
                  <template #content>
                    <a-doption @click="editSession(session)">
                      <template #icon>
                        <icon-edit />
                      </template>
                      重命名
                    </a-doption>
                    <a-doption @click="moveToCategory(session)">
                      <template #icon>
                        <icon-folder />
                      </template>
                      移动分类
                    </a-doption>
                    <a-doption @click="deleteSession(session)" class="danger">
                      <template #icon>
                        <icon-delete />
                      </template>
                      删除
                    </a-doption>
                  </template>
                </a-dropdown>
              </div>
            </div>
          </div>
        </a-tab-pane>
        
        <!-- 分类管理标签页 -->
        <a-tab-pane key="categories" title="分类管理">
          <!-- 新建分类按钮 -->
          <div class="tab-header">
            <a-button 
              type="primary" 
              size="small" 
              @click="createNewCategory"
              block
            >
              <template #icon>
                <icon-plus />
              </template>
              新建分类
            </a-button>
          </div>

          <!-- 分类列表 -->
          <div class="category-list">
            <div v-if="categories.length === 0" class="empty-state">
              <a-empty description="暂无分类">
                <a-button size="small" @click="createNewCategory">
                  创建第一个分类
                </a-button>
              </a-empty>
            </div>

            <div
              v-for="category in categories"
              :key="category.id"
              class="category-item"
            >
              <div class="category-content">
                <div class="category-name">{{ category.name }}</div>
                <div class="category-count">{{ getCategorySessionCount(category.id) }} 个会话</div>
              </div>
              
              <div class="category-actions" @click.stop>
                <a-dropdown trigger="click">
                  <a-button type="text" size="mini">
                    <template #icon>
                      <icon-more />
                    </template>
                  </a-button>
                  <template #content>
                    <a-doption @click="editCategory(category)">
                      <template #icon>
                        <icon-edit />
                      </template>
                      重命名
                    </a-doption>
                    <a-doption @click="deleteCategory(category)" class="danger">
                      <template #icon>
                        <icon-delete />
                      </template>
                      删除
                    </a-doption>
                  </template>
                </a-dropdown>
              </div>
            </div>
          </div>
        </a-tab-pane>
      </a-tabs>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { 
  IconPlus, 
  IconMore, 
  IconEdit, 
  IconDelete,
  IconFolder
} from '@arco-design/web-vue/es/icon'
import { useSessionStore } from '@/stores/session'
import { formatRelativeTime, truncateText } from '@/utils/format'
import type { Session, Category } from '@/types'

const sessionStore = useSessionStore()

// 响应式数据
const activeTab = ref('sessions')
const selectedCategoryId = ref<number | null>(null)
const loading = ref(false)

// 计算属性
const sessions = computed(() => sessionStore.sessions)
const categories = computed(() => sessionStore.categories)

const filteredSessions = computed(() => {
  if (!selectedCategoryId.value) {
    return sessions.value
  }
  return sessions.value.filter(session => session.categoryID === selectedCategoryId.value)
})

// 方法
const isCurrentSession = (sessionId: number): boolean => {
  return sessionStore.currentSessionId === sessionId
}

const selectSession = (sessionId: number) => {
  sessionStore.setCurrentSession(sessionId)
}

const createNewSession = async () => {
  loading.value = true
  try {
    await sessionStore.createSession({
      title: '新对话',
      categoryID: selectedCategoryId.value || 1
    })
  } catch (error) {
    console.error('创建会话失败:', error)
  } finally {
    loading.value = false
  }
}

const editSession = (session: Session) => {
  console.log('编辑会话:', session)
  // TODO: 实现编辑会话功能
}

const moveToCategory = (session: Session) => {
  console.log('移动分类:', session)
  // TODO: 实现移动分类功能
}

const deleteSession = async (session: Session) => {
  try {
    await sessionStore.deleteSession(session.id)
  } catch (error) {
    console.error('删除会话失败:', error)
  }
}

const createNewCategory = () => {
  console.log('创建新分类')
  // TODO: 实现创建分类功能
}

const editCategory = (category: Category) => {
  console.log('编辑分类:', category)
  // TODO: 实现编辑分类功能
}

const deleteCategory = (category: Category) => {
  console.log('删除分类:', category)
  // TODO: 实现删除分类功能
}

const getCategorySessionCount = (categoryId: number): number => {
  return sessions.value.filter(session => session.categoryID === categoryId).length
}

const onCategoryChange = () => {
  // 分类变化时的处理
}

// 初始化
sessionStore.fetchSessions()
sessionStore.fetchCategories()
</script>

<style lang="less" scoped>
.session-sidebar {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--bg-secondary);
}

.sidebar-header {
  padding: 16px;
  border-bottom: 1px solid var(--border-color-light);
  
  .title {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
    color: var(--text-primary);
  }
}

.sidebar-tabs {
  flex: 1;
  padding: 0 8px;
  overflow: hidden;
  
  :deep(.arco-tabs-content) {
    height: calc(100vh - 120px);
    overflow: hidden;
  }
  
  :deep(.arco-tabs-pane) {
    height: 100%;
    display: flex;
    flex-direction: column;
  }
}

.tab-header {
  padding: 12px 8px;
}

.category-filter {
  padding: 0 8px 12px;
}

.session-list,
.category-list {
  flex: 1;
  overflow-y: auto;
  padding: 0 8px;
}

.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 200px;
}

.session-item,
.category-item {
  display: flex;
  align-items: center;
  padding: 12px;
  margin-bottom: 8px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  background: var(--bg-primary);
  border: 1px solid var(--border-color-light);
  
  &:hover {
    background: var(--bg-tertiary);
    border-color: var(--primary-color);
  }
  
  &.active {
    background: var(--primary-1);
    border-color: var(--primary-color);
  }
}

.session-content,
.category-content {
  flex: 1;
  min-width: 0;
}

.session-title,
.category-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
  margin-bottom: 4px;
  word-wrap: break-word;
  line-height: 1.4;
}

.session-summary {
  font-size: 12px;
  color: var(--text-secondary);
  margin-bottom: 6px;
  line-height: 1.3;
  word-wrap: break-word;
}

.session-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.session-time {
  font-size: 11px;
  color: var(--text-tertiary);
}

.category-count {
  font-size: 12px;
  color: var(--text-secondary);
}

.session-actions,
.category-actions {
  opacity: 0;
  transition: opacity 0.2s;
}

.session-item:hover .session-actions,
.category-item:hover .category-actions {
  opacity: 1;
}

:deep(.arco-dropdown-option.danger) {
  color: var(--color-danger-6);
  
  &:hover {
    background: var(--color-danger-1);
  }
}
</style> 