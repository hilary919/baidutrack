export interface MetricItem {
  name: string
  label: string
  value: string
}

const DEFAULT_METRICS = ['pv_count', 'visitor_count']

export function loadMetrics(key: string, available: MetricItem[]): MetricItem[] {
  try {
    const saved = localStorage.getItem(`metrics_${key}`)
    if (saved) {
      const names: string[] = JSON.parse(saved)
      const filtered = available.filter(m => names.includes(m.name))
      if (filtered.length > 0) return filtered
    }
  } catch { /* ignore */ }
  return available.filter(m => DEFAULT_METRICS.includes(m.name))
}

export function formatMetricValue(name: string, val: any): string {
  const n = Number(val) || 0
  if (name.includes('ratio')) return n.toFixed(1) + '%'
  if (name === 'average_stay_time' || name === 'avg_visit_time') {
    const m = Math.floor(n / 60)
    const s = Math.round(n % 60)
    return m > 0 ? `${m}分${s}秒` : `${s}秒`
  }
  if (name === 'avg_visit_pages') return n.toFixed(1)
  return n.toLocaleString('zh-CN')
}

export function saveMetrics(key: string, metrics: MetricItem[]) {
  const names = metrics.map(m => m.name)
  localStorage.setItem(`metrics_${key}`, JSON.stringify(names))
}

// 受访页面可用指标
export const VISITED_PAGE_METRICS: MetricItem[] = [
  { name: 'pv_count', label: '浏览量(PV)', value: '0' },
  { name: 'visitor_count', label: '访客数(UV)', value: '0' },
  { name: 'ip_count', label: 'IP 数', value: '0' },
  { name: 'visit1_count', label: '入口页次数', value: '0' },
  { name: 'outward_count', label: '贡献下游流量', value: '0' },
  { name: 'exit_count', label: '退出页次数', value: '0' },
  { name: 'average_stay_time', label: '平均停留时长(秒)', value: '0' },
  { name: 'exit_ratio', label: '退出率(%)', value: '0%' },
]

// 区域页面可用指标
export const DISTRICT_METRICS: MetricItem[] = [
  { name: 'pv_count', label: '浏览量(PV)', value: '0' },
  { name: 'pv_ratio', label: '浏览量占比(%)', value: '0%' },
  { name: 'visit_count', label: '访问次数', value: '0' },
  { name: 'visitor_count', label: '访客数(UV)', value: '0' },
  { name: 'new_visitor_count', label: '新访客数', value: '0' },
  { name: 'new_visitor_ratio', label: '新访客比率(%)', value: '0%' },
  { name: 'ip_count', label: 'IP 数', value: '0' },
  { name: 'bounce_ratio', label: '跳出率(%)', value: '0%' },
  { name: 'avg_visit_time', label: '平均访问时长(秒)', value: '0' },
  { name: 'avg_visit_pages', label: '平均访问页数', value: '0' },
  { name: 'trans_count', label: '转化次数', value: '0' },
  { name: 'trans_ratio', label: '转化率(%)', value: '0%' },
]
