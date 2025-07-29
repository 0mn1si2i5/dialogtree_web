<template>
  <div>
    <!-- 新建会话模态框 -->
    <a-modal
      :visible="showCreateSessionModal"
      :title="$t('session.createSession')"
      @ok="$emit('create-session')"
      @cancel="$emit('reset-create-session-form')"
      @update:visible="$emit('update:showCreateSessionModal', $event)"
    >
      <a-form :model="createSessionForm" layout="vertical">
        <a-form-item :label="$t('session.sessionTitle')" required>
          <a-input 
            v-model="createSessionForm.title" 
            :placeholder="$t('session.enterSessionTitle')"
            @keyup.enter="$emit('create-session')"
          />
        </a-form-item>
        <a-form-item :label="$t('sidebar.selectCategory')" required>
          <a-select v-model="createSessionForm.categoryID" :placeholder="$t('sidebar.selectCategory')">
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
      :title="$t('session.createCategory')"
      @ok="$emit('create-category')"
      @cancel="$emit('reset-create-category-form')"
      @update:visible="$emit('update:showCreateCategoryModal', $event)"
    >
      <a-form :model="createCategoryForm" layout="vertical">
        <a-form-item :label="$t('session.categoryName')" required>
          <a-input 
            v-model="createCategoryForm.name" 
            :placeholder="$t('session.enterCategoryName')"
            @keyup.enter="$emit('create-category')"
          />
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 会话重命名模态框 -->
    <a-modal
      :visible="showRenameSessionModal"
      :title="$t('session.renameSession')"
      @ok="$emit('rename-session')"
      @cancel="$emit('reset-rename-session-form')"
      @update:visible="$emit('update:showRenameSessionModal', $event)"
    >
      <a-form :model="renameSessionForm" layout="vertical">
        <a-form-item :label="$t('session.sessionTitle')" required>
          <a-input 
            v-model="renameSessionForm.title" 
            :placeholder="$t('session.enterNewSessionTitle')"
            @keyup.enter="$emit('rename-session')"
          />
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 会话修改分类模态框 -->
    <a-modal
      :visible="showMoveSessionModal"
      :title="$t('session.moveSession')"
      @ok="$emit('move-session')"
      @cancel="$emit('reset-move-session-form')"
      @update:visible="$emit('update:showMoveSessionModal', $event)"
    >
      <a-form :model="moveSessionForm" layout="vertical">
        <a-form-item :label="$t('sidebar.selectCategory')" required>
          <a-select v-model="moveSessionForm.categoryID" :placeholder="$t('session.selectNewCategory')">
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
      :title="$t('session.renameCategory')"
      @ok="$emit('rename-category')"
      @cancel="$emit('reset-rename-category-form')"
      @update:visible="$emit('update:showRenameCategoryModal', $event)"
    >
      <a-form :model="renameCategoryForm" layout="vertical">
        <a-form-item :label="$t('session.categoryName')" required>
          <a-input 
            v-model="renameCategoryForm.name" 
            :placeholder="$t('session.enterNewCategoryName')"
            @keyup.enter="$emit('rename-category')"
          />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { Category } from '@/types'

const { t } = useI18n()

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