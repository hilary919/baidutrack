<template>
  <el-popover placement="bottom" :width="220" trigger="click">
    <template #reference>
      <el-button>列配置</el-button>
    </template>
    <el-checkbox-group v-model="checkedNames" @change="onChange">
      <div v-for="m in metrics" :key="m.name" class="metric-item">
        <el-checkbox :label="m.name" :disabled="required.includes(m.name)">{{ m.label }}</el-checkbox>
      </div>
    </el-checkbox-group>
  </el-popover>
</template>

<script setup>
import { ref } from 'vue'
import { loadMetrics, saveMetrics } from '@/utils/metrics'

const props = defineProps({
  storageKey: { type: String, required: true },
  metrics: { type: Array, required: true },
  required: { type: Array, default: () => ['pv_count', 'visitor_count'] },
})

const emit = defineEmits(['change'])

const initial = loadMetrics(props.storageKey, props.metrics)
// 确保必选项始终存在
const initialNames = initial.map(m => m.name)
props.required.forEach(name => {
  if (!initialNames.includes(name)) {
    const m = props.metrics.find(metric => metric.name === name)
    if (m) initial.push(m)
  }
})
const checkedNames = ref(initial.map(m => m.name))

function onChange(names) {
  // 确保必选项不会被移除
  const merged = [...new Set([...names, ...props.required])]
  const selected = props.metrics.filter(m => merged.includes(m.name))
  saveMetrics(props.storageKey, selected)
  checkedNames.value = merged
  emit('change', selected)
}
</script>

<style scoped>
.metric-item {
  padding: 4px 0;
}
</style>
