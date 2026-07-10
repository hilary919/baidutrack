<template>
  <div class="dashboard">
    <div class="welcome-section">
      <div class="welcome-text">
        <h2>欢迎回来</h2>
        <p class="subtitle">{{ greeting }}</p>
      </div>
      <div class="date-badge">{{ today }}</div>
    </div>

    <div class="overview-section">
      <div class="section-header">
        <h3>今日概览</h3>
        <span class="header-hint">较昨日</span>
        <el-button size="small" text @click="fetchOverview" :loading="loading">
          <el-icon><Refresh /></el-icon>
        </el-button>
      </div>
      <div class="metric-grid">
        <div class="metric-card" v-for="m in metrics" :key="m.key">
          <div class="mc-label">{{ m.label }}</div>
          <div class="mc-values">
            <div class="mc-today">
              <span class="mc-num">{{ m.today }}</span>
              <span class="mc-tag">今日</span>
            </div>
            <div class="mc-yesterday">
              <span class="mc-num">{{ m.yesterday }}</span>
              <span class="mc-tag">昨日</span>
            </div>
          </div>
          <div class="mc-change" :class="m.trend">
            <el-icon :size="14">
              <CaretTop v-if="m.trend === 'up'" />
              <CaretBottom v-else-if="m.trend === 'down'" />
              <Minus v-else />
            </el-icon>
            {{ m.change }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, onMounted, reactive, ref, watch } from "vue";
import { useStore } from "vuex";
import dayjs from "dayjs";
import api from "@/http/api";
import { Refresh, CaretTop, CaretBottom, Minus } from "@element-plus/icons-vue";

const store = useStore();
const loading = ref(false);

const metrics = reactive([
  {
    key: "pv",
    label: "浏览量 (PV)",
    today: "--",
    yesterday: "--",
    change: "--",
    trend: "",
  },
  {
    key: "uv",
    label: "访客数 (UV)",
    today: "--",
    yesterday: "--",
    change: "--",
    trend: "",
  },
  {
    key: "ip",
    label: "IP 数",
    today: "--",
    yesterday: "--",
    change: "--",
    trend: "",
  },
  {
    key: "bounce",
    label: "跳出率",
    today: "--",
    yesterday: "--",
    change: "--",
    trend: "",
  },
  {
    key: "avgTime",
    label: "平均访问时长",
    today: "--",
    yesterday: "--",
    change: "--",
    trend: "",
  },
]);

const metricKeys = [
  "pv_count",
  "visitor_count",
  "ip_count",
  "bounce_ratio",
  "avg_visit_time",
];

const today = computed(() => {
  const d = new Date();
  const weekMap = ["日", "一", "二", "三", "四", "五", "六"];
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(
    2,
    "0",
  )}.${String(d.getDate()).padStart(2, "0")} 星期${weekMap[d.getDay()]}`;
});

const greeting = computed(() => {
  const h = new Date().getHours();
  if (h < 9) return "早上好，今天想查看哪些数据？";
  if (h < 12) return "上午好，数据已就绪";
  if (h < 14) return "中午好，稍作休息";
  if (h < 18) return "下午好，今天进展如何？";
  return "晚上好，辛苦了";
});

function fetchOverview() {
  const site: any = store.state.site;
  if (!site?.site_id) return;
  loading.value = true;
  const endStr = dayjs().format("YYYYMMDD");
  const startStr = dayjs().subtract(1, "day").format("YYYYMMDD");
  api
    .getData({
      site_id: site.site_id,
      start_date: startStr,
      end_date: endStr,
      metrics: metricKeys.join(","),
      method: "overview/getTimeTrendRpt",
    })
    .then((res) => {
      loading.value = false;
      if (!res || res.header?.desc !== "success") return;
      const result = res.body.data[0].result;
      const items: any[] = result.items || []
      const dates: any[] = items[0] || []
      const dataRows: any[][] = items[1] || []
      const len = dates.length
      if (len < 2) {
        const row: any[] = dataRows[0] || []
        metrics.forEach((m, i) => {
          m.today = formatMetric(i, row[i])
          m.yesterday = '--'
          m.change = '--'
          m.trend = ''
        })
        return
      }
      const yesterdayIdx = 0
      const todayIdx = len - 1
      metrics.forEach((m, i) => {
        const yesterdayVal = toNum(dataRows[yesterdayIdx]?.[i])
        const todayVal = toNum(dataRows[todayIdx]?.[i])
        m.today = formatMetric(i, todayVal)
        m.yesterday = formatMetric(i, yesterdayVal)
        m.change = formatChange(i, yesterdayVal, todayVal)
        m.trend = todayVal > yesterdayVal ? 'up' : todayVal < yesterdayVal ? 'down' : ''
      })
    })
    .catch(() => {
      loading.value = false;
    });
}

function toNum(v: any): number {
  return Number(v) || 0
}

function fmtNum(n: number): string {
  return n.toLocaleString('zh-CN')
}

function formatMetric(idx: number, val: any): string {
  const n = toNum(val)
  if (idx === 3) return n.toFixed(1) + '%'
  if (idx === 4) return fmtDuration(n)
  return fmtNum(n)
}

function formatChange(idx: number, yesterday: number, today: number): string {
  if (!yesterday) return today ? '+100%' : '--'
  const diff = today - yesterday
  const pct = (diff / yesterday) * 100
  const sign = diff >= 0 ? '+' : ''
  if (idx === 3 || idx === 4) {
    return sign + (idx === 3 ? diff.toFixed(2) + '%' : fmtDuration(Math.abs(diff)))
  }
  return sign + pct.toFixed(1) + '%'
}

function fmtDuration(s: number): string {
  if (!s) return '--'
  const m = Math.floor(s / 60)
  const sec = Math.round(s % 60)
  return m > 0 ? `${m}分${sec}秒` : `${sec}秒`
}

watch(
  () => store.state.site,
  () => fetchOverview(),
);

onMounted(() => fetchOverview());
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
.overview-section {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
  padding: 20px 24px;
}
.section-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 20px;
  h3 {
    font-size: 16px;
    font-weight: 600;
    color: #1a1a1a;
    margin: 0;
  }
  .header-hint {
    font-size: 12px;
    color: #bbb;
  }
  .el-button {
    margin-left: auto;
  }
}
.metric-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}
.metric-card {
  padding: 16px 20px;
  border-radius: 8px;
  background: #fafbfc;
  transition: background 0.2s;
  &:hover {
    background: #f0f2f5;
  }
  .mc-label {
    font-size: 13px;
    color: #888;
    margin-bottom: 12px;
  }
  .mc-values {
    display: flex;
    gap: 24px;
    margin-bottom: 10px;
    .mc-today,
    .mc-yesterday {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .mc-num {
      font-size: 24px;
      font-weight: 700;
      color: #1a1a1a;
      line-height: 1;
    }
    .mc-tag {
      font-size: 11px;
      color: #bbb;
    }
    .mc-yesterday .mc-num {
      color: #999;
    }
  }
  .mc-change {
    font-size: 13px;
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 2px;
    &.up {
      color: #e34d59;
    }
    &.down {
      color: #00a870;
    }
    color: #999;
  }
}
</style>
