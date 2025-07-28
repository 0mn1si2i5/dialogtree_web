<template>
  <div class="session-sidebar">
    <!-- 顶部标题和新建按钮 -->
    <div class="sidebar-header">
      <h2 class="title">DialogTree</h2>
      <a-button 
        type="primary" 
        size="small" 
        @click="createNewSession"
        :loading="loading"
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
      >
        <a-option :value="null">全部分类</a-option>
        <a-option 
          v-for="category in categories" 
          :key="category.id" 
          :value="category.id"
        >
          {{ category.name || '未命名分类' }}
        </a-option>
      </a-select>
    </div>

    <!-- Session列表 -->
    <div class="session-list">
      <a-spin :spinning="loadingSessions">
        <div v-if="filteredSessions.length === 0" class="empty-state">
          <a-empty description="暂无对话" />
        </div>
        <div v-else>
          <div 
            v-for="session in filteredSessions" 
            :key="session.id"
            class="session-item"
            :class="{ active: session.id === currentSessionId }"
            @click="selectSession(session.id)"
          >
            <div class="session-content">
              <div class="session-title">{{ session.title }}</div>
              <div class="session-meta">
                <span class="session-time">
                  {{ formatTime(session.createdAt) }}
                </span>
              </div>
              <div v-if="session.summary" class="session-summary">
                {{ session.summary }}
              </div>
            </div>
            <div class="session-actions">
              <a-dropdown :popup-visible="false">
                <a-button type="text" size="mini">
                  <template #icon>
                    <icon-more />
                  </template>
                </a-button>
                <template #content>
                  <a-doption @click="deleteSession(session.id)">
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
      </a-spin>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { IconPlus, IconMore, IconDelete } from '@arco-design/web-vue/es/icon'
import { useSessionStore } from '@/stores/session'
import { formatTime } from '@/utils/format'
import type { Session, Category } from '@/types'

const sessionStore = useSessionStore()

// 响应式数据
const loading = ref(false)
const loadingSessions = ref(false)
const selectedCategoryId = ref<number | null>(null)

// 计算属性
const sessions = computed(() => sessionStore.sessions)
const categories = computed(() => sessionStore.categories)
const currentSessionId = computed(() => sessionStore.currentSessionId)

const filteredSessions = computed(() => {
  if (selectedCategoryId.value === null) {
    return sessions.value
  }
  return sessions.value.filter(session => session.categoryID === selectedCategoryId.value)
})

// 方法
const createNewSession = async () => {
  loading.value = true
  try {
    await sessionStore.createSession({
      title: '新的对话',
      categoryID: selectedCategoryId.value || 1
    })
  } catch (error) {
    console.error('创建会话失败:', error)
  } finally {
    loading.value = false
  }
}

const selectSession = (sessionId: number) => {
  sessionStore.setCurrentSession(sessionId)
}

const deleteSession = async (sessionId: number) => {
  try {
    await sessionStore.deleteSession(sessionId)
  } catch (error) {
    console.error('删除会话失败:', error)
  }
}

const onCategoryChange = () => {
  // 分类变化时的处理逻辑
}

// 生命周期
onMounted(async () => {
  loadingSessions.value = true
  try {
    await Promise.all([
      sessionStore.fetchSessions(),
      sessionStore.fetchCategories()
    ])
  } catch (error) {
    console.error('加载数据失败:', error)
  } finally {
    loadingSessions.value = false
  }
})
</script>

<style lang="less" scoped>
.session-sidebar {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 16px;
}

.sidebar-header {
  margin-bottom: 16px;
  
  .title {
    font-size: 18px;
    font-weight: 600;
    margin-bottom: 12px;
    color: var(--text-primary);
  }
}

.category-filter {
  margin-bottom: 16px;
}

.session-list {
  flex: 1;
  overflow-y: auto;
}

.session-item {
  display: flex;
  align-items: flex-start;
  padding: 12px;
  margin-bottom: 8px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid transparent;
  
  &:hover {
    background-color: var(--bg-tertiary);
  }
  
  &.active {
    background-color: #e6f7ff;
    border-color: var(--primary-color);
  }
}

.session-content {
  flex: 1;
  min-width: 0;
}

.session-title {
  font-weight: 500;
  color: var(--text-primary);
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.session-meta {
  display: flex;
  align-items: center;
  margin-bottom: 4px;
}

.session-time {
  font-size: 12px;
  color: var(--text-tertiary);
}

.session-summary {
  font-size: 12px;
  color: var(--text-secondary);
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.session-actions {
  margin-left: 8px;
  opacity: 0;
  transition: opacity 0.2s;
}

.session-item:hover .session-actions {
  opacity: 1;
}

.empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
}
</style> 