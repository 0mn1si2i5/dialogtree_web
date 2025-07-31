<template>
  <a-modal
    v-model:visible="visible"
    :width="1100"
    :footer="false"
    :closable="false"
    mask-closable
    @cancel="handleClose"
    class="tutorial-modal"
  >
    <div class="tutorial-container">

      <!-- 教学内容区域 -->
      <div class="tutorial-content">
        <!-- 第一页：欢迎介绍 -->
        <div v-if="currentPage === 0" class="tutorial-page welcome-page">
          <div class="welcome-content">
            <div class="logo-section">
              <img src="/dt-logo.png" alt="DialogTree Logo" class="tutorial-logo" />
              <h1 class="tutorial-title">{{ $t('tutorial.welcome.title') }}</h1>
<!--              <p class="tutorial-subtitle">{{ $t('tutorial.welcome.subtitle') }}</p>-->
            </div>
            
            <div class="pain-points">
              <h3 class="pain-title">{{ $t('tutorial.welcome.intro.title') }}</h3>
              <div class="pain-list">
                <div class="pain-item">
                  <span class="pain-icon"></span>
                  <span>{{ $t('tutorial.welcome.intro.pain1') }}</span>
                </div>
                <div class="pain-item">
                  <span class="pain-icon"></span>
                  <span>{{ $t('tutorial.welcome.intro.pain2') }}</span>
                </div>
                <div class="pain-item">
                  <span class="pain-icon"></span>
                  <span>{{ $t('tutorial.welcome.intro.pain3') }}</span>
                </div>
                <div class="pain-item">
                  <span class="pain-icon"></span>
                  <span>{{ $t('tutorial.welcome.intro.pain4') }}</span>
                </div>
              </div>
            </div>
            
            <div class="solution-section">
              <h3 class="solution-title">{{ $t('tutorial.welcome.solution.title') }}</h3>
              <p class="solution-desc">{{ $t('tutorial.welcome.solution.desc') }}</p>
            </div>
            
            <div class="features-section">
              <h3 class="features-title">{{ $t('tutorial.welcome.features.title') }}</h3>
              <div class="feature-list">
                <div class="feature-item">
                  <span>{{ $t('tutorial.welcome.features.feature1') }}</span>
                  <span class="feature-icon">📝</span>
                </div>
                <div class="feature-item">
                  <span>{{ $t('tutorial.welcome.features.feature2') }}</span>
                  <span class="feature-icon">🗺️</span>
                </div>
                <div class="feature-item">
                  <span>{{ $t('tutorial.welcome.features.feature3') }}</span>
                  <span class="feature-icon">🎯</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 第二页：基本布局 -->
        <div v-if="currentPage === 1" class="tutorial-page carousel-page">
          <h2 class="page-title">{{ $t('tutorial.basics.title') }}</h2>
          
          <!-- 轮播指示器 -->
          <div class="carousel-indicators-top">
            <span 
              v-for="(slide, index) in basicSlides"
              :key="index"
              class="indicator"
              :class="{ active: basicSlideIndex === index }"
              @click="goToSlide('basics', index)"
            ></span>
          </div>
          
          <div class="carousel-wrapper">
            <div class="carousel-content">
              <div 
                v-for="(slide, index) in basicSlides" 
                :key="index"
                class="carousel-slide"
                :class="{ active: basicSlideIndex === index }"
              >
                <div class="slide-image">
                  <img :src="slide.image" :alt="slide.title" />
                </div>
                <div class="slide-text">
                  <h3>{{ slide.title }}</h3>
                  <p>{{ slide.desc }}</p>
                </div>
              </div>
            </div>
            
            <!-- 轮播箭头 -->
            <div 
              class="carousel-btn prev"
              @click="prevSlide('basics')"
            >
              ←
            </div>
            
            <div 
              class="carousel-btn next"
              @click="nextSlide('basics')"
            >
              →
            </div>
          </div>
        </div>

        <!-- 第三页：对话管理 -->
        <div v-if="currentPage === 2" class="tutorial-page carousel-page">
          <h2 class="page-title">{{ $t('tutorial.advanced.title') }}</h2>
          
          <!-- 轮播指示器 -->
          <div class="carousel-indicators-top">
            <span 
              v-for="(slide, index) in advancedSlides"
              :key="index"
              class="indicator"
              :class="{ active: advancedSlideIndex === index }"
              @click="goToSlide('advanced', index)"
            ></span>
          </div>
          
          <div class="carousel-wrapper">
            <div class="carousel-content">
              <div 
                v-for="(slide, index) in advancedSlides" 
                :key="index"
                class="carousel-slide"
                :class="{ active: advancedSlideIndex === index }"
              >
                <div class="slide-image">
                  <img :src="slide.image" :alt="slide.title" />
                </div>
                <div class="slide-text">
                  <h3>{{ slide.title }}</h3>
                  <p>{{ slide.desc }}</p>
                </div>
              </div>
            </div>
            
            <!-- 轮播箭头 -->
            <div 
              class="carousel-btn prev"
              @click="prevSlide('advanced')"
            >
              ←
            </div>
            
            <div 
              class="carousel-btn next"
              @click="nextSlide('advanced')"
            >
              →
            </div>
          </div>
        </div>

        <!-- 第四页：完成页 -->
        <div v-if="currentPage === 3" class="tutorial-page complete-page">
          <div class="complete-content">
            <div class="complete-icon">🎉</div>
            <h2 class="complete-title">{{ $t('tutorial.complete.title') }}</h2>
            <p class="complete-desc">{{ $t('tutorial.complete.desc') }}</p>
            
            <div class="demo-notice">
              <p class="demo-text">{{ $t('tutorial.complete.demo') }}</p>
              <p class="github-link">
                <span>{{ $t('tutorial.complete.reference') }}</span>
                <a :href="$t('tutorial.complete.githubUrl')" target="_blank">
                  {{ $t('tutorial.complete.github') }}
                </a>
                <span>{{ $t('tutorial.complete.or') }}</span>
                <a :href="$t('tutorial.complete.blogUrl')" target="_blank">
                  {{ $t('tutorial.complete.blog') }}
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>


      <!-- 进度指示器 -->
      <div class="progress-dots">
        <div
            v-for="(page, index) in pages"
            :key="index"
            class="progress-dot"
            :class="{ active: currentPage === index }"
            @click="goToPage(index)"
        ></div>
      </div>


      <!-- 底部导航区域 -->
      <div class="tutorial-bottom">
        <!-- 导航按钮和进度指示器在一行 -->
        <div class="tutorial-navigation">
          <a-button 
            v-if="currentPage > 0" 
            @click="previousPage"
            class="nav-button"
            shape="round"
            size="large"
          >
            {{ $t('tutorial.nav.previous') }}
          </a-button>
          
          <div class="nav-spacer"></div>
          

          
          <div class="nav-spacer"></div>

          <a-button
              @click="skipTutorial"
              type="text"
              class="skip-button"
              shape="round"
              size="large"
          >
            {{ $t('tutorial.nav.skip') }}
          </a-button>

          <a-button 
            v-if="currentPage < pages.length - 1"
            @click="nextPage"
            type="primary"
            shape="round"
            class="nav-button"
            size="large"
          >
            {{ $t('tutorial.nav.next') }}
          </a-button>

          <a-button 
            v-if="currentPage === pages.length - 1"
            @click="completeTutorial"
            type="primary"
            class="nav-button"
            shape="round"
            size="large"
          >
            {{ $t('tutorial.nav.start') }}
          </a-button>
          

        </div>
      </div>
    </div>
  </a-modal>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import i18n from '@/locales'

interface Props {
  visible: boolean
}

interface Emits {
  (e: 'update:visible', value: boolean): void
  (e: 'complete'): void
  (e: 'skip'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()
const { t, locale } = useI18n()

// 本地状态
const visible = ref(props.visible)
const currentPage = ref(0)
const pages = ref(['welcome', 'basics', 'advanced', 'complete'])

// 轮播数据
const basicSlideIndex = ref(0)
const advancedSlideIndex = ref(0)

// 定义slide类型
interface SlideData {
  title: string
  desc: string
  image: string
}

// 轮播数据 - 使用ref存储，通过watch动态更新
const basicSlides = ref<SlideData[]>([])
const advancedSlides = ref<SlideData[]>([])

// 更新slide数据的函数
function updateSlideData() {
  const currentLocale = locale.value as 'zh-CN' | 'en-US'
  const messages = i18n.global.messages.value[currentLocale] as any
  basicSlides.value = messages.tutorial.basics.slides as SlideData[]
  advancedSlides.value = messages.tutorial.advanced.slides as SlideData[]
}

// 监听locale变化，更新slide数据
watch(locale, () => {
  updateSlideData()
})

// 初始化slide数据
updateSlideData()

// 监听外部visible变化
watch(() => props.visible, (newVal) => {
  visible.value = newVal
  if (newVal) {
    currentPage.value = 0
    basicSlideIndex.value = 0
    advancedSlideIndex.value = 0
  }
})

// 监听内部visible变化
watch(visible, (newVal) => {
  emit('update:visible', newVal)
})

// 导航方法
function goToPage(index: number) {
  currentPage.value = index
  basicSlideIndex.value = 0
  advancedSlideIndex.value = 0
}

function nextPage() {
  if (currentPage.value < pages.value.length - 1) {
    currentPage.value++
  }
}

function previousPage() {
  if (currentPage.value > 0) {
    currentPage.value--
  }
}

function completeTutorial() {
  visible.value = false
  emit('complete')
}

function skipTutorial() {
  visible.value = false
  emit('skip')
}

function handleClose() {
  visible.value = false
  emit('skip')
}

// 轮播控制方法
function prevSlide(pageType: string) {
  if (pageType === 'basics') {
    const maxIndex = basicSlides.value.length - 1
    basicSlideIndex.value = basicSlideIndex.value > 0 ? basicSlideIndex.value - 1 : maxIndex
  } else if (pageType === 'advanced') {
    const maxIndex = advancedSlides.value.length - 1
    advancedSlideIndex.value = advancedSlideIndex.value > 0 ? advancedSlideIndex.value - 1 : maxIndex
  }
}

function nextSlide(pageType: string) {
  if (pageType === 'basics') {
    const maxIndex = basicSlides.value.length - 1
    basicSlideIndex.value = basicSlideIndex.value < maxIndex ? basicSlideIndex.value + 1 : 0
  } else if (pageType === 'advanced') {
    const maxIndex = advancedSlides.value.length - 1
    advancedSlideIndex.value = advancedSlideIndex.value < maxIndex ? advancedSlideIndex.value + 1 : 0
  }
}

function goToSlide(pageType: string, index: number) {
  if (pageType === 'basics') {
    basicSlideIndex.value = index
  } else if (pageType === 'advanced') {
    advancedSlideIndex.value = index
  }
}
</script>

<style lang="less" scoped>
.tutorial-modal {
  .arco-modal-body {
    padding: 0;
    max-height: 85vh;
    overflow: hidden;
  }
}

.tutorial-container {
  height: 75vh;
  max-height: 800px;
  display: flex;
  flex-direction: column;
  position: relative;
}

/* 轮播页面顶部指示器 */
.carousel-indicators-top {
  display: flex;
  gap: 12px;
  justify-content: center;
  margin-bottom: 1px;
  
  .indicator {
    width: 4px;
    height: 4px;
    border-radius: 50%;
    background: #d1d5db;
    cursor: pointer;
    transition: all 0.2s ease;
    
    &.active {
      background: #1890ff;
      transform: scale(1.25);
    }
    
    &:hover:not(.active) {
      background: #9ca3af;
    }
  }
}

/* 底部导航区域 */
.tutorial-bottom {
  flex-shrink: 0;
  padding-top: 4px;
}

/* 内容区域 */
.tutorial-content {
  flex: 1;
  //padding-top: 2px;
  //padding-bottom: 2px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.tutorial-page {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

/* 欢迎页样式 */
.welcome-page {
  .welcome-content {
    text-align: center;
    width: 100%;
    max-width: 900px;
    height: 100%;
    overflow: hidden;
    padding: 0 24px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }
  
  .logo-section {
    
    .tutorial-logo {
      width: 120px;
      height: 120px;
    }
    
    .tutorial-title {
      font-size: 44px;
      font-weight: 600;
      color: #1a1a1a;
      margin: 0 0 20px 0;
      height: 60px;
    }
    
    .tutorial-subtitle {
      font-size: 15px;
      color: #6b7280;
      margin: 0 0 16px 0;
    }
  }
  
  .pain-points {
    margin-bottom: 20px;
    
    .pain-title {
      font-size: 20px;
      font-weight: 600;
      color: #1a1a1a;
      margin: 0 0 10px 0;
    }
    
    .pain-list {
      margin-left: 50px;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px 16px;
      text-align: left;
      
      .pain-item {
        display: flex;
        align-items: flex-start;
        gap: 8px;
        font-size: 14px;
        color: #555555;
        line-height: 1.4;
        
        .pain-icon {
          font-size: 16px;
          flex-shrink: 0;
          margin-top: 1px;
        }
      }
    }
  }
  
  .solution-section {
    
    .solution-title {
      font-size: 20px;
      font-weight: 600;
      color: #1a1a1a;
      margin: 0 0 6px 0;
    }
    
    .solution-desc {
      font-size: 16px;
      color: #555555;
      line-height: 1.4;
      margin: 0;
    }
  }
  
  .features-section {
    .features-title {
      font-size: 20px;
      font-weight: 600;
      color: #1a1a1a;
      margin: 0 0 10px 0;
      padding-top: 20px;
    }
    
    .feature-list {
      display: flex;
      flex-direction: column;
      gap: 4px;
      text-align: left;
      padding-bottom: 20px;
      
      .feature-item {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        font-size: 16px;
        font-weight: 400;
        color: #555555;
        
        .feature-icon {
          font-size: 17px;
          flex-shrink: 0;
        }
      }
    }
  }
}

/* 轮播页样式 */
.carousel-page {
  .page-title {
    font-size: 30px;
    font-weight: 600;
    color: #333;
    margin: 0 0 12px 0;
    text-align: center;
  }
  
  .carousel-wrapper {
    width: 100%;
    flex: 1;
    display: flex;
    flex-direction: column;
    position: relative;
  }
  
  .carousel-content {
    position: relative;
    width: 100%;
    height: 550px;
    flex: 1;
    overflow: hidden;
  }
  
  .carousel-slide {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    opacity: 0;
    transition: opacity 0.5s ease;
    display: flex;
    background: #fff;
    
    &.active {
      opacity: 1;
    }
    
    .slide-image {
      flex: 9;
      display: flex;
      align-items: center;
      justify-content: center;
      //background: #f9fafb;
      
      img {
        max-width: 100%;
        max-height: 100%;
        object-fit: contain;
        border-radius: 8px;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
      }
    }
    
    .slide-text {
      flex: 3;
      //padding: 20px 12px;
      display: flex;
      flex-direction: column;
      margin-top: 25px;
      padding-left: 20px;
      //justify-content: center;
      background: #ffffff;
      //border-left: 1px solid #e5e7eb;
      
      h3 {
        font-size: 28px;
        font-weight: 600;
        color: #1a1a1a;
        margin: 0 0 6px 0;
        line-height: 1.3;
      }
      
      p {
        font-size: 16px;
        color: #6b7280;
        line-height: 1.8;
        margin: 0;
      }
    }
  }
  
  
  .carousel-btn {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    width: 44px;
    height: 44px;
    border-radius: 50%;
    background: white;
    color: #1890ff;
    border: 2px solid #1890ff;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    font-size: 20px;
    font-weight: bold;
    user-select: none;
    transition: all 0.2s ease;
    outline: none;
    z-index: 10;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    
    &.prev {
      left: 10px;
    }

    &.next {
      right: 10px;
    }
    
    &:hover {
      background: #1890ff;
      color: white;
      transform: translateY(-50%) scale(1.1);
      box-shadow: 0 4px 12px rgba(24, 144, 255, 0.3);
    }
    
    &:active {
      transform: translateY(-50%) scale(0.95);
    }
  }
  
}

/* 完成页样式 */
.complete-page {
  .complete-content {
    text-align: center;
    
    .complete-icon {
      font-size: 64px;
    }
    
    .complete-title {
      font-size: 34px;
      font-weight: 600;
      color: #333;
      margin: 0 0 36px 0;
    }
    
    .complete-desc {
      font-size: 20px;
      color: #1a1a1a;
      line-height: 1.6;
      margin: 0 0 32px 0;
      max-width: 470px;
      margin-left: auto;
      margin-right: auto;
    }
    
    .demo-notice {
      padding: 24px;
      //background: #f0f9ff;
      border-radius: 12px;
      //border: 1px solid #e1f5fe;
      max-width: 600px;
      margin: 0 auto;
      
      .demo-text {
        font-size: 12px;
        color: #666;
        margin: 0 0 8px 0;
      }
      
      .github-link {
        margin: 0;
        
        a {
          font-size: 14px;
          color: #1890ff;
          text-decoration: none;
          
          &:hover {
            font-weight: 600;
          }
        }
      }
    }
  }
}

.progress-dots {
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: center;
  margin-top: 12px;

  .progress-dot {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: #e5e5e5;
    cursor: pointer;
    transition: all 0.3s ease;

    &.active {
      background: #1890ff;
      transform: scale(1.2);
    }

    &:hover {
      background: #91d5ff;
    }
  }
}

/* 导航按钮 */
.tutorial-navigation {
  display: flex;
  align-items: center;
  gap: 12px;
  justify-content: space-between;
  height: 48px;
  
  .nav-spacer {
    flex: 1;
  }
  
  .nav-button {
    min-width: 180px;
    min-height: 45px;
    font-size: 16px;
  }
  
  .nav-button.arco-btn-size-large {
    font-size: 18px;
    font-weight: 600;
  }
  
  .skip-button {
    color: #999;
    
    &:hover {
      color: #666;
    }
  }
  

}

/* 响应式设计 */
@media (max-width: 768px) {
  .tutorial-modal {
    .arco-modal {
      width: 90vw !important;
      margin: 20px auto;
    }
  }
  
  .tutorial-container {
    padding: 16px;
    min-height: 500px;
  }
  
  .welcome-page {
    .tutorial-title {
      font-size: 20px;
    }
  }
  
  .carousel-page {
    .carousel-content {
      height: 350px;
    }
    
    .carousel-slide {
      flex-direction: column;
      
      .slide-image {
        flex: 3;
      }
      
      .slide-text {
        flex: 1;
        border-left: none;
        border-top: 1px solid #e5e7eb;
      }
    }
  }
}
</style>