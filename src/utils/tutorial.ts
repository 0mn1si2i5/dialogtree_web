/**
 * 教程相关的工具函数
 */

// 存储键名
const TUTORIAL_COMPLETED_KEY = 'dialogtree-tutorial-completed'
const TUTORIAL_SESSION_KEY = 'dialogtree-tutorial-session-shown'

/**
 * 检查是否应该显示教程
 * 逻辑：
 * 1. 从未完成过教程的用户（localStorage中无标记）
 * 2. 当前浏览器会话中未显示过教程（sessionStorage中无标记）
 * 3. 两个条件都满足才显示教程
 */
export function shouldShowTutorial(): boolean {
  try {
    // 检查是否已完成过教程（永久记录）
    const hasCompleted = localStorage.getItem(TUTORIAL_COMPLETED_KEY) === 'true'
    
    // 检查当前会话是否已显示过（会话级记录）
    const hasShownInSession = sessionStorage.getItem(TUTORIAL_SESSION_KEY) === 'true'
    
    // 只有从未完成且当前会话未显示过的用户才显示教程
    return !hasCompleted && !hasShownInSession
  } catch (error) {
    console.warn('Failed to check tutorial status:', error)
    return false
  }
}

/**
 * 标记教程已完成
 * 这会永久记录用户已完成教程，之后不再显示
 */
export function markTutorialCompleted(): void {
  try {
    localStorage.setItem(TUTORIAL_COMPLETED_KEY, 'true')
    sessionStorage.setItem(TUTORIAL_SESSION_KEY, 'true')
  } catch (error) {
    console.warn('Failed to mark tutorial as completed:', error)
  }
}

/**
 * 标记教程已跳过
 * 只记录当前会话，下次新会话时仍可能显示
 */
export function markTutorialSkipped(): void {
  try {
    sessionStorage.setItem(TUTORIAL_SESSION_KEY, 'true')
  } catch (error) {
    console.warn('Failed to mark tutorial as skipped:', error)
  }
}

/**
 * 标记教程已显示
 * 用于防止同一会话中重复显示
 */
export function markTutorialShown(): void {
  try {
    sessionStorage.setItem(TUTORIAL_SESSION_KEY, 'true')
  } catch (error) {
    console.warn('Failed to mark tutorial as shown:', error)
  }
}

/**
 * 重置教程状态（用于测试或重新查看教程）
 */
export function resetTutorialStatus(): void {
  try {
    localStorage.removeItem(TUTORIAL_COMPLETED_KEY)
    sessionStorage.removeItem(TUTORIAL_SESSION_KEY)
  } catch (error) {
    console.warn('Failed to reset tutorial status:', error)
  }
}

/**
 * 检查用户是否已完成过教程
 */
export function hasTutorialCompleted(): boolean {
  try {
    return localStorage.getItem(TUTORIAL_COMPLETED_KEY) === 'true'
  } catch (error) {
    console.warn('Failed to check tutorial completion status:', error)
    return false
  }
}

/**
 * 手动显示教程（忽略所有检查）
 */
export function showTutorialManually(): void {
  try {
    // 清除会话标记，允许再次显示
    sessionStorage.removeItem(TUTORIAL_SESSION_KEY)
  } catch (error) {
    console.warn('Failed to prepare manual tutorial display:', error)
  }
}