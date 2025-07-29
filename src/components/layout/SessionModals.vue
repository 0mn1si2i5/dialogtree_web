<template>
  <div>
    <!-- 新建会话模态框 -->
    <a-modal
      :visible="showCreateSessionModal"
      title="新建会话"
      @ok="$emit('create-session')"
      @cancel="$emit('reset-create-session-form')"
      @update:visible="$emit('update:showCreateSessionModal', $event)"
    >
      <a-form :model="createSessionForm" layout="vertical">
        <a-form-item label="会话标题" required>
          <a-input 
            v-model="createSessionForm.title" 
            placeholder="请输入会话标题"
            @keyup.enter="$emit('create-session')"
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
      :visible="showCreateCategoryModal"
      title="新建分类"
      @ok="$emit('create-category')"
      @cancel="$emit('reset-create-category-form')"
      @update:visible="$emit('update:showCreateCategoryModal', $event)"
    >
      <a-form :model="createCategoryForm" layout="vertical">
        <a-form-item label="分类名称" required>
          <a-input 
            v-model="createCategoryForm.name" 
            placeholder="请输入分类名称"
            @keyup.enter="$emit('create-category')"
          />
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 会话重命名模态框 -->
    <a-modal
      :visible="showRenameSessionModal"
      title="重命名会话"
      @ok="$emit('rename-session')"
      @cancel="$emit('reset-rename-session-form')"
      @update:visible="$emit('update:showRenameSessionModal', $event)"
    >
      <a-form :model="renameSessionForm" layout="vertical">
        <a-form-item label="会话标题" required>
          <a-input 
            v-model="renameSessionForm.title" 
            placeholder="请输入新的会话标题"
            @keyup.enter="$emit('rename-session')"
          />
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 会话修改分类模态框 -->
    <a-modal
      :visible="showMoveSessionModal"
      title="修改分类"
      @ok="$emit('move-session')"
      @cancel="$emit('reset-move-session-form')"
      @update:visible="$emit('update:showMoveSessionModal', $event)"
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
      :visible="showRenameCategoryModal"
      title="重命名分类"
      @ok="$emit('rename-category')"
      @cancel="$emit('reset-rename-category-form')"
      @update:visible="$emit('update:showRenameCategoryModal', $event)"
    >
      <a-form :model="renameCategoryForm" layout="vertical">
        <a-form-item label="分类名称" required>
          <a-input 
            v-model="renameCategoryForm.name" 
            placeholder="请输入新的分类名称"
            @keyup.enter="$emit('rename-category')"
          />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import type { Category } from '@/types'

// Props
defineProps<{
  showCreateSessionModal: boolean
  showCreateCategoryModal: boolean
  showRenameSessionModal: boolean
  showMoveSessionModal: boolean
  showRenameCategoryModal: boolean
  createSessionForm: {
    title: string
    categoryID: number | null
  }
  createCategoryForm: {
    name: string
  }
  renameSessionForm: {
    sessionId: number | null
    title: string
  }
  moveSessionForm: {
    sessionId: number | null
    categoryID: number | null
  }
  renameCategoryForm: {
    categoryId: number | null
    name: string
  }
  categories: Category[]
}>()

// Emits
defineEmits<{
  'create-session': []
  'create-category': []
  'rename-session': []
  'move-session': []
  'rename-category': []
  'reset-create-session-form': []
  'reset-create-category-form': []
  'reset-rename-session-form': []
  'reset-move-session-form': []
  'reset-rename-category-form': []
  'update:showCreateSessionModal': [value: boolean]
  'update:showCreateCategoryModal': [value: boolean]
  'update:showRenameSessionModal': [value: boolean]
  'update:showMoveSessionModal': [value: boolean]
  'update:showRenameCategoryModal': [value: boolean]
}>()
</script>