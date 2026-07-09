<template>
  <div class="dashboard">
    <div class="welcome-section">
      <div class="welcome-text">
        <h2>欢迎回来</h2>
        <p class="subtitle">{{ greeting }}</p>
      </div>
      <div class="date-badge">{{ today }}</div>
    </div>

    <div class="realtime-section">
      <h3>今日实时数据</h3>
      <div class="realtime-grid">
        <div class="realtime-card">
          <div class="rt-icon pv-icon"><el-icon><View /></el-icon></div>
          <div class="rt-body">
            <span class="rt-value">{{ realtimeData.pv }}</span>
            <span class="rt-label">浏览量 (PV)</span>
          </div>
        </div>
        <div class="realtime-card">
          <div class="rt-icon uv-icon"><el-icon><User /></el-icon></div>
          <div class="rt-body">
            <span class="rt-value">{{ realtimeData.uv }}</span>
            <span class="rt-label">访客数 (UV)</span>
          </div>
        </div>
        <div class="realtime-card">
          <div class="rt-icon ip-icon"><el-icon><Monitor /></el-icon></div>
          <div class="rt-body">
            <span class="rt-value">{{ realtimeData.ip }}</span>
            <span class="rt-label">IP 数</span>
          </div>
        </div>
        <div class="realtime-card">
          <div class="rt-icon bounce-icon"><el-icon><TrendCharts /></el-icon></div>
          <div class="rt-body">
            <span class="rt-value">{{ realtimeData.bounceRatio }}</span>
            <span class="rt-label">跳出率</span>
          </div>
        </div>
        <div class="realtime-card">
          <div class="rt-icon time-icon"><el-icon><Clock /></el-icon></div>
          <div class="rt-body">
            <span class="rt-value">{{ realtimeData.avgVisitTime }}</span>
            <span class="rt-label">平均访问时长</span>
          </div>
        </div>
        <div class="realtime-card">
          <div class="rt-icon trans-icon"><el-icon><Finished /></el-icon></div>
          <div class="rt-body">
            <span class="rt-value">{{ realtimeData.visitCount }}</span>
            <span class="rt-label">访问次数</span>
          </div>
        </div>
      </div>
    </div>

    <div class="quick-section">
      <h3>快捷入口</h3>
      <el-row :gutter="16">
        <el-col
          v-for="item in quickLinks"
          :key="item.path"
          :span="Math.min(8, 24 / quickLinks.length)"
        >
          <div class="link-card" @click="navigateTo(item.path)">
            <el-icon :size="28"><component :is="iconMap[item.icon]" /></el-icon>
            <span class="link-title">{{ item.title }}</span>
          </div>
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, onMounted, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useStore } from 'vuex'
import dayjs from 'dayjs'
import api from '@/http/api'
import {
  View, User, Monitor, TrendCharts, Clock, Finished,
  HomeFilled, DataAnalysis, Location,
} from '@element-plus/icons-vue'

const router = useRouter()
const store = useStore()

const iconMap: Record<string, any> = {
  HomeFilled, View, Location, DataAnalysis,
}

const realtimeData = reactive({
  pv: '--',
  uv: '--',
  ip: '--',
  bounceRatio: '--',
  avgVisitTime: '--',
  visitCount: '--',
})

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

function fmt(num: number): string {
  if (num >= 10000) return (num / 10000).toFixed(1) + 'w'
  if (num >= 1000) return (num / 1000).toFixed(1) + 'k'
  return String(num)
}

function fetchRealtime() {
  const todayStr = dayjs().format('YYYYMMDD')
  const site: any = store.state.site
  api.getData({
    site_id: site?.site_id,
    start_date: todayStr,
    end_date: todayStr,
    metrics: 'pv_count,visitor_count,ip_count,bounce_ratio,avg_visit_time,visit_count',
    method: 'overview/getTimeTrendRpt',
    gran: 'day',
  }).then((res) => {
    if (!res || res.header?.desc !== 'success') return
    const result = res.body.data[0].result
    const sum = result.sum?.[0] || []
    realtimeData.pv = fmt(sum[0] || 0)
    realtimeData.uv = fmt(sum[1] || 0)
    realtimeData.ip = fmt(sum[2] || 0)
    realtimeData.bounceRatio = (sum[3] || 0).toFixed(1) + '%'
    realtimeData.avgVisitTime = fmtTime(sum[4] || 0)
    realtimeData.visitCount = fmt(sum[5] || 0)
  })
}

function fmtTime(seconds: number): string {
  if (!seconds) return '0s'
  const m = Math.floor(seconds / 60)
  const s = Math.round(seconds % 60)
  return m > 0 ? `${m}分${s}秒` : `${s}秒`
}

onMounted(() => {
  fetchRealtime()
})
</script>

<style scoped lang="less">
.dashboard {
  padding: 4px 0 0;
}
.welcome-section {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
  h2 {
    font-size: 22px;
    font-weight: 600;
    color: #1a1a1a;
    margin: 0 0 4px;
    text-align: left;
  }
  .subtitle {
    margin: 0;
    font-size: 14px;
    color: #999;
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

.realtime-section {
  margin-bottom: 32px;
  h3 {
    font-size: 16px;
    font-weight: 600;
    color: #1a1a1a;
    margin: 0 0 16px;
  }
}
.realtime-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}
.realtime-card {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
  padding: 20px 24px;
  display: flex;
  align-items: center;
  gap: 16px;
  transition: box-shadow 0.25s;
  &:hover {
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  }
  .rt-icon {
    width: 44px; height: 44px;
    border-radius: 10px;
    display: flex; align-items: center; justify-content: center;
    font-size: 22px; color: #fff; flex-shrink: 0;
    &.pv-icon     { background: linear-gradient(135deg, #409eff, #66b1ff); }
    &.uv-icon     { background: linear-gradient(135deg, #67c23a, #85ce61); }
    &.ip-icon     { background: linear-gradient(135deg, #e6a23c, #ebb563); }
    &.bounce-icon { background: linear-gradient(135deg, #f56c6c, #f89898); }
    &.time-icon   { background: linear-gradient(135deg, #909399, #b4b4b4); }
    &.trans-icon  { background: linear-gradient(135deg, #8e71d6, #a99bdb); }
  }
  .rt-body {
    display: flex; flex-direction: column;
    .rt-value {
      font-size: 24px; font-weight: 700; color: #1a1a1a; line-height: 1.2;
    }
    .rt-label {
      font-size: 12px; color: #999; margin-top: 2px;
    }
  }
}

.quick-section {
  h3 {
    font-size: 16px;
    font-weight: 600;
    color: #1a1a1a;
    margin: 0 0 16px;
  }
}
.link-card {
  cursor: pointer;
  text-align: center;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
  padding: 28px 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  transition: all 0.25s;
  .el-icon { color: #409eff; }
  .link-title { font-size: 14px; font-weight: 600; color: #1a1a1a; }
  &:hover {
    box-shadow: 0 2px 12px rgba(64, 158, 255, 0.15);
    transform: translateY(-2px);
    .el-icon { transform: scale(1.15); transition: transform 0.25s; }
  }
}
</style>
