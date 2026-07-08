<template>
  <div class="container">
    <el-form :inline="true" ref="form" label-width="80px">
      <el-form-item label="统计周期">
        <el-select
          v-model="period"
          clearable
          placeholder="请选择周期"
          @change="periodChange"
        >
          <el-option
            v-for="(item, index) in reportPeriod"
            :key="index"
            :label="item"
            :value="index"
          >
          </el-option>
        </el-select>
      </el-form-item>
      <el-form-item label="统计日期">
        <el-date-picker
          v-model="date"
          type="daterange"
          align="center"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          value-format="YYYYMMDD"
        >
        </el-date-picker>
      </el-form-item>
      <el-form-item label="组别">
        <el-select
          v-model="group"
          clearable
          placeholder="请选择组别"
        >
          <el-option
            v-for="(item, index) in urlGroup"
            :key="index"
            :label="item.name"
            :value="index"
          >
          </el-option>
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="onSearch">查询</el-button>
      </el-form-item>
      <el-form-item>
        <el-button type="success" :disabled="loading" @click="exportData">导出</el-button>
      </el-form-item>
    </el-form>
    <div class="result-container">
      <el-table v-loading="loading" :data="tableData" style="width: 100%" :default-sort = "{prop: 'pv_count', order: 'descending'}">
        <el-table-column type="index" label="序号" width="50"> </el-table-column>
        <el-table-column prop="product" label="产品名"> </el-table-column>
        <template v-for="item in searchItems" :key="item.name">
          <el-table-column
            :prop="item.name"
            :label="item.label"
            sortable
          >
          </el-table-column>
        </template>
      </el-table>
    </div>
  </div>
</template>

<script>
import dayjs from 'dayjs'
import { exportExcel } from '@/utils/export'
import api from '@/http/api'

export default {
  name: 'ProductPage',
  data () {
    return {
      date: [],
      period: 0,
      reportPeriod: ['当月', '环比', '同比'],
      searchItems: [
        { name: 'pv_count', label: 'PV' },
        { name: 'visitor_count', label: 'UV' },
        { name: 'outward_count', label: '贡献下游流量' },
        { name: 'average_stay_time', label: '平均停留时长' },
        { name: 'exit_count', label: '退出页次数' },
        { name: 'exit_ratio', label: '退出率' }
      ],
      tableData: [],
      params: {
        site_id: '',
        start_date: '',
        end_date: '',
        metrics: '',
        method: 'visit/toppage/a',
        start_index: 0,
        max_results: 1000000
      },
      loading: false,
      group: '',
      urlGroup: [{
        name: '全屋智能照明',
        link: ['products/wholehomeproducts']
      }, {
        name: '家居产品',
        link: ['activity/fanlight', 'activity/yuanrui2pro', 'activity/bp30', 'activity/langyu', 'products/customerproducts']
      }, {
        name: '商照产品',
        link: ['products/businessproducts']
      }, {
        name: '行业解决方案',
        link: ['commercial/industrysolution']
      }, {
        name: '道路照明',
        link: ['products/roadwayproducts']
      }]
    }
  },
  created () {
    this.periodChange(this.period)
    this.getSiteList()
  },
  methods: {
    async getSiteList () {
      const res = await api.getSiteList()
      if (res && res.header.desc === 'success') {
        this.params.site_id = res.body.data[0].list[0].site_id
      }
    },
    periodChange (index) {
      const now = new Date()
      const year = now.getFullYear()
      const month = now.getMonth()
      const day = now.getDay()
      const sunday = day === 0 ? now : new Date(now.getTime() + (7 - day) * 24 * 60 * 60 * 1000)
      const sundayDate = sunday.getDate()
      switch (index) {
        case 0: {
          const FirstTime = new Date(year, month, 1)
          this.date = [dayjs(FirstTime).format('YYYYMMDD'), dayjs(sunday).format('YYYYMMDD')]
          break
        }
        case 1: {
          const FirstTime = new Date(year, month - 1, 1)
          const SundayTime = new Date(year, month - 1, sundayDate)
          this.date = [dayjs(FirstTime).format('YYYYMMDD'), dayjs(SundayTime).format('YYYYMMDD')]
          break
        }
        case 2: {
          const FirstTime = new Date(year - 1, month, 1)
          const SundayTime = new Date(year - 1, month, sundayDate)
          this.date = [dayjs(FirstTime).format('YYYYMMDD'), dayjs(SundayTime).format('YYYYMMDD')]
          break
        }
      }
    },
    onSearch () {
      if (this.group === '') return
      const _metrics = this.searchItems.map(item => item.name)
      this.params.metrics = _metrics.join(',')
      this.params.start_index = 0
      this.getData()
    },
    getData () {
      this.loading = true
      this.tableData.length = 0
      this.params.start_date = this.date[0]
      this.params.end_date = this.date[1]

      api.getData(this.params).then((res) => {
        if (!res) { this.loading = false; return; }
        if (res.header.desc === 'success') {
          const resData = res.body.data[0].result
          const curGroup = this.urlGroup[this.group]
          const _data = {}
          curGroup.link.forEach((item) => {
            resData.items[0].filter((url, index) => {
              const isAct = item.indexOf('activity/') === 0
              const path = url[0].name.split('opple.com.cn/' + item + '/')
              if (path.length > 1 || (isAct && url[0].name.indexOf('opple.com.cn/' + item) > 0)) {
                const pathname = isAct ? item.split('/')[1] : path[1].split('/')[0].split('?')[0].split('#')[0]
                this.searchItems.forEach((search, index2) => {
                  if (_data[pathname] && _data[pathname][search.name] !== undefined) {
                    const dataVal = _data[pathname]
                    if (search.name === 'average_stay_time') {
                      dataVal[search.name] += resData.items[1][index][index2] * resData.items[1][index][0]
                    } else if (search.name === 'exit_ratio') {
                      dataVal[search.name] += dataVal.exit_count
                    } else {
                      dataVal[search.name] += resData.items[1][index][index2]
                    }
                  } else {
                    if (!_data[pathname]) {
                      _data[pathname] = {}
                    }
                    if (search.name === 'average_stay_time') {
                      _data[pathname][search.name] = resData.items[1][index][index2] * resData.items[1][index][0]
                    } else if (search.name === 'exit_ratio') {
                      _data[pathname][search.name] = _data[pathname].exit_count || 0
                    } else {
                      _data[pathname][search.name] = resData.items[1][index][index2]
                    }
                  }
                })
              }
            })
          })
          for (const key in _data) {
            if (Object.hasOwnProperty.call(_data, key)) {
              const pv = _data[key].pv_count || 0
              const exitCount = _data[key].exit_count || 0
              _data[key].exit_ratio = pv ? (exitCount / pv * 100).toFixed(2) + '%' : '0.00%'
              _data[key].average_stay_time = pv ? this.toTime(_data[key].average_stay_time / pv) : '0:0:0'
              this.tableData.push({ product: key, ..._data[key] })
            }
          }
          this.loading = false
        }
      })
    },
    toTime (seconds) {
      const h = Math.floor(seconds / 3600)
      const m = Math.floor((seconds % 3600) / 60)
      const s = Math.round(seconds % 60)
      return `${h}:${m}:${s}`
    },
    exportData () {
      const fields = {
        '产品名称': 'product',
        'PV': 'pv_count',
        'UV': 'visitor_count',
        '贡献下游流量': 'outward_count',
        '平均停留时长': 'average_stay_time',
        '退出页次数': 'exit_count',
        '退出率': 'exit_ratio'
      }
      const exportData = this.tableData.map(row => {
        const obj = {}
        for (const [key, val] of Object.entries(fields)) {
          obj[key] = row[val]
        }
        return obj
      })
      exportExcel(exportData, `产品页${this.date.join('_')}`)
    }
  }
}
</script>

<style scoped>
.result-show {
  display: flex;
  justify-content: center;
  padding: 24px 0;
}
.result-show li {
  list-style: none;
  margin: 0 20px;
  font-size: 30px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.result-show li .count {
  font-weight: bold;
  color: burlywood;
}
</style>
