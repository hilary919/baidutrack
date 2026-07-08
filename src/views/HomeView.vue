<template>
  <div class="dashboard">
    <div class="welcome-section">
      <div class="welcome-text">
        <h2>欢迎回来</h2>
        <p class="subtitle">{{ greeting }}</p>
      </div>
      <div class="date-badge">{{ today }}</div>
    </div>

    <el-row :gutter="20" class="stats-row">
      <el-col :span="8">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-inner">
            <div class="stat-icon site-icon">
              <el-icon><Monitor /></el-icon>
            </div>
            <div class="stat-info">
              <span class="stat-value">{{ siteCount }}</span>
              <span class="stat-label">可用站点</span>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-inner">
            <div class="stat-icon report-icon">
              <el-icon><DataAnalysis /></el-icon>
            </div>
            <div class="stat-info">
              <span class="stat-value">{{ reportCount }}</span>
              <span class="stat-label">报表类型</span>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-inner">
            <div class="stat-icon active-icon">
              <el-icon><TrendCharts /></el-icon>
            </div>
            <div class="stat-info">
              <span class="stat-value">{{ currentSite }}</span>
              <span class="stat-label">当前站点</span>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <div class="quick-section">
      <h3>快捷入口</h3>
      <el-row :gutter="20">
        <el-col
          v-for="item in quickLinks"
          :key="item.path"
          :span="Math.min(8, 24 / quickLinks.length)"
        >
          <el-card
            shadow="hover"
            class="link-card"
            @click="navigateTo(item.path)"
          >
            <el-icon :size="28"><component :is="iconMap[item.icon]" /></el-icon>
            <span class="link-title">{{ item.title }}</span>
            <span class="link-desc">{{ item.desc || '查看详情' }}</span>
          </el-card>
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useStore } from 'vuex'
import {
  Monitor, DataAnalysis, TrendCharts,
  HomeFilled, View, Location,
} from '@element-plus/icons-vue'

const router = useRouter()
const store = useStore()

const iconMap: Record<string, any> = {
  HomeFilled, View, Location, DataAnalysis,
}

const currentSite = computed(() => {
  const site: any = store.state.site
  return site?.domain || '未选择'
})

const siteCount = computed(() => 1)
const reportCount = computed(() => store.state.menuRouter.length - 1)

const quickLinks = computed(() =>
  store.state.menuRouter.filter((item: any) => item.path !== '/home')
)

const today = computed(() => {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const weekMap = ['日', '一', '二', '三', '四', '五', '六']
  const w = weekMap[d.getDay()]
  return `${y}.${m}.${day} 星期${w}`
})

const greeting = computed(() => {
  const h = new Date().getHours()
  if (h < 9) return '早上好，今天想查看哪些数据？'
  if (h < 12) return '上午好，数据已就绪'
  if (h < 14) return '中午好，稍作休息'
  if (h < 18) return '下午好，今天进展如何？'
  return '晚上好，辛苦了'
})

function navigateTo(path: string) {
  router.push(path)
}
</script>

<style scoped lang="less">
.dashboard {
  padding: 28px 32px;
  height: calc(100vh - 140px);
  overflow-y: auto;
}

.welcome-section {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 28px;
  h2 {
    font-size: 24px;
    font-weight: 600;
    color: #303133;
    margin: 0 0 6px;
    text-align: left;
  }
  .subtitle {
    margin: 0;
    font-size: 14px;
    color: #909399;
  }
  .date-badge {
    padding: 6px 16px;
    background: #ecf5ff;
    color: #409eff;
    border-radius: 6px;
    font-size: 13px;
    font-weight: 500;
    white-space: nowrap;
  }
}

.stats-row {
  margin-bottom: 32px;
}

.stat-card {
  cursor: default;
  :deep(.el-card__body) {
    padding: 20px 24px;
  }
  &:hover {
    transform: translateY(-2px);
    transition: transform 0.25s;
  }
}

.stat-inner {
  display: flex;
  align-items: center;
  gap: 16px;
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: #fff;
  flex-shrink: 0;
  &.site-icon   { background: linear-gradient(135deg, #409eff, #337ecc); }
  &.report-icon { background: linear-gradient(135deg, #67c23a, #529b2e); }
  &.active-icon { background: linear-gradient(135deg, #e6a23c, #d48806); }
}

.stat-info {
  display: flex;
  flex-direction: column;
  .stat-value {
    font-size: 26px;
    font-weight: 700;
    color: #303133;
    line-height: 1.2;
  }
  .stat-label {
    font-size: 13px;
    color: #909399;
    margin-top: 2px;
  }
}

.quick-section {
  h3 {
    font-size: 16px;
    font-weight: 600;
    color: #303133;
    margin: 0 0 16px;
  }
}

.link-card {
  cursor: pointer;
  text-align: center;
  :deep(.el-card__body) {
    padding: 24px 16px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
  }
  .el-icon {
    color: #409eff;
  }
  .link-title {
    font-size: 15px;
    font-weight: 600;
    color: #303133;
  }
  .link-desc {
    font-size: 12px;
    color: #c0c4cc;
  }
  &:hover {
    border-color: #409eff;
    transition: border-color 0.25s;
    .el-icon {
      transform: scale(1.15);
      transition: transform 0.25s;
    }
  }
}
</style>
