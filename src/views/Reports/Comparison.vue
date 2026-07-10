<template>
  <div class="container">
    <div class="query-card">
      <el-form :inline="true" label-width="80px">
        <el-form-item label="对比模式">
          <el-radio-group v-model="compareMode" @change="onModeChange">
            <el-radio-button label="m-o-m">环比</el-radio-button>
            <el-radio-button label="y-o-y">同比</el-radio-button>
            <el-radio-button label="custom">自定义</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <template v-if="compareMode === 'custom'">
          <el-form-item label="当期">
            <el-date-picker v-model="customA" type="daterange" range-separator="至"
              start-placeholder="开始" end-placeholder="结束"
              value-format="YYYYMMDD" format="YYYY-MM-DD" />
          </el-form-item>
          <el-form-item label="对比期">
            <el-date-picker v-model="customB" type="daterange" range-separator="至"
              start-placeholder="开始" end-placeholder="结束"
              value-format="YYYYMMDD" format="YYYY-MM-DD" />
          </el-form-item>
        </template>
        <el-form-item v-else>
          <span class="period-display">
            <span class="period-tag current">{{ periodLabel.current }}</span>
            <span class="vs-text">vs</span>
            <span class="period-tag compare">{{ periodLabel.compare }}</span>
          </span>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="onSearch">查询</el-button>
        </el-form-item>
      </el-form>
    </div>

    <div v-if="summary.length" class="compare-grid">
      <div class="compare-card" v-for="m in summary" :key="m.key">
        <div class="cc-header">{{ m.label }}</div>
        <div class="cc-body">
          <div class="cc-period current">
            <span class="cc-val">{{ m.current }}</span>
            <span class="cc-tag">当期</span>
          </div>
          <div class="cc-period compare">
            <span class="cc-val">{{ m.compare }}</span>
            <span class="cc-tag">对比期</span>
          </div>
        </div>
        <div class="cc-footer" :class="m.trend">
          <el-icon :size="18">
            <CaretTop v-if="m.trend === 'up'" />
            <CaretBottom v-else-if="m.trend === 'down'" />
            <Minus v-else />
          </el-icon>
          <span class="cc-diff">{{ m.diffText }}</span>
          <span class="cc-rate">{{ m.rateText }}</span>
        </div>
      </div>
    </div>

    <div v-else-if="!loading" class="empty-hint">选择对比模式后点击查询</div>
  </div>
</template>

<script>
import dayjs from 'dayjs'
import store from '@/store'
import api from '@/http/api'
import { VISITED_PAGE_METRICS } from '@/utils/metrics'
import { CaretTop, CaretBottom, Minus } from '@element-plus/icons-vue'

function isPctMetric(name) {
  return name.includes('ratio')
}
function isTimeMetric(name) {
  return name === 'average_stay_time'
}

export default {
  name: 'ComparisonPage',
  data() {
    return {
      compareMode: 'm-o-m',
      periodA: [],
      periodB: [],
      customA: [],
      customB: [],
      summary: [],
      loading: false,
    }
  },
  components: { CaretTop, CaretBottom, Minus },
  computed: {
    periodLabel() {
      const fmt = 'YYYY年MM月'
      if (this.compareMode === 'm-o-m') {
        const prev = dayjs().subtract(1, 'month')
        return { current: prev.format(fmt), compare: prev.subtract(1, 'month').format(fmt) }
      }
      if (this.compareMode === 'y-o-y') {
        const prev = dayjs().subtract(1, 'month')
        return { current: prev.format(fmt), compare: prev.subtract(1, 'year').format(fmt) }
      }
      return { current: '', compare: '' }
    },
  },
  created() {
    this.onModeChange('m-o-m')
  },
  methods: {
    onModeChange(mode) {
      this.summary = []
      const prevMonth = dayjs().subtract(1, 'month')
      if (mode === 'm-o-m') {
        this.periodA = [prevMonth.startOf('month').format('YYYYMMDD'), prevMonth.endOf('month').format('YYYYMMDD')]
        this.periodB = [prevMonth.subtract(1, 'month').startOf('month').format('YYYYMMDD'), prevMonth.subtract(1, 'month').endOf('month').format('YYYYMMDD')]
      } else if (mode === 'y-o-y') {
        this.periodA = [prevMonth.startOf('month').format('YYYYMMDD'), prevMonth.endOf('month').format('YYYYMMDD')]
        this.periodB = [prevMonth.subtract(1, 'year').startOf('month').format('YYYYMMDD'), prevMonth.subtract(1, 'year').endOf('month').format('YYYYMMDD')]
      }
    },
    onSearch() {
      const siteId = store.state.site.site_id
      if (!siteId) return
      this.loading = true
      const metrics = VISITED_PAGE_METRICS.map(m => m.name).join(',')
      const base = { site_id: siteId, metrics, method: 'visit/toppage/a', start_index: 0, max_results: 1 }
      const a = this.compareMode === 'custom' ? this.customA : this.periodA
      const b = this.compareMode === 'custom' ? this.customB : this.periodB
      if (!a[0] || !b[0]) { this.loading = false; return }
      const pA = { ...base, start_date: a[0], end_date: a[1] }
      const pB = { ...base, start_date: b[0], end_date: b[1] }

      Promise.all([api.getData(pA), api.getData(pB)]).then(([resA, resB]) => {
        this.loading = false
        if (!resA || !resB) return
        const sumA = resA.body?.data?.[0]?.result?.sum?.[0] || []
        const sumB = resB.body?.data?.[0]?.result?.sum?.[0] || []
        this.summary = VISITED_PAGE_METRICS.map((m, i) => {
          const aVal = Number(sumA[i]) || 0
          const bVal = Number(sumB[i]) || 0
          const diff = aVal - bVal
          const rate = bVal ? ((diff / bVal) * 100) : (aVal ? 100 : 0)
          const trend = diff > 0 ? 'up' : diff < 0 ? 'down' : ''
          return {
            key: m.name,
            label: m.label,
            current: this.fmtVal(aVal, m.name),
            compare: this.fmtVal(bVal, m.name),
            trend,
            diffText: this.fmtDiff(diff, m.name),
            rateText: this.fmtRate(rate),
          }
        })
      }).catch(() => { this.loading = false })
    },
    fmtVal(v, name) {
      if (isPctMetric(name)) return v.toFixed(1) + '%'
      if (isTimeMetric(name)) return this.fmtDuration(v)
      return v.toLocaleString('zh-CN')
    },
    fmtDiff(diff, name) {
      const sign = diff >= 0 ? '+' : ''
      if (isPctMetric(name)) return sign + diff.toFixed(2) + '%'
      if (isTimeMetric(name)) return sign + this.fmtDuration(Math.abs(diff))
      return sign + Math.abs(diff).toLocaleString('zh-CN')
    },
    fmtRate(rate) {
      const sign = rate >= 0 ? '+' : ''
      return sign + rate.toFixed(1) + '%'
    },
    fmtDuration(s) {
      if (!s) return '0秒'
      const m = Math.floor(s / 60)
      const sec = Math.round(Math.abs(s % 60))
      return m > 0 ? `${m}分${sec}秒` : `${sec}秒`
    },
  },
}
</script>

<style scoped lang="less">
.container {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.query-card {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.04);
  padding: 16px 24px;
  :deep(.el-form-item) { margin-bottom: 0; }
}
.period-display {
  display: flex; align-items: center; gap: 10px; font-size: 14px;
  .period-tag {
    padding: 5px 14px; border-radius: 4px; font-weight: 600;
    &.current { background: #ecf5ff; color: #409eff; }
    &.compare { background: #fef0f0; color: #e34d59; }
  }
  .vs-text { color: #bbb; font-weight: 700; font-size: 16px; }
}
.compare-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}
.compare-card {
  background: #fff;
  border-radius: 10px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.04);
  padding: 20px 24px;
  display: flex; flex-direction: column; gap: 16px;
  transition: box-shadow 0.2s;
  &:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.08); }
  .cc-header {
    font-size: 14px; font-weight: 600; color: #666;
  }
  .cc-body {
    display: flex; gap: 16px;
    .cc-period {
      flex: 1; display: flex; flex-direction: column; gap: 4px;
      .cc-val { font-size: 28px; font-weight: 700; color: #1a1a1a; line-height: 1.1; }
      .cc-tag { font-size: 11px; color: #bbb; }
      &.compare .cc-val { color: #888; }
    }
  }
  .cc-footer {
    display: flex; align-items: center; gap: 8px;
    padding-top: 12px; border-top: 1px solid #f0f0f0;
    font-size: 14px; font-weight: 600;
    .cc-diff { font-size: 16px; }
    .cc-rate { font-size: 13px; margin-left: auto; }
    &.up   { color: #e34d59; }
    &.down { color: #00a870; }
    color: #bbb;
  }
}
.empty-hint {
  text-align: center; padding: 60px 0; color: #bbb; font-size: 15px;
}
</style>
