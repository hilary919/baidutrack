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
      <template>
        <el-form-item v-if="showGroup" label="组别">
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
        <el-form-item v-else label="url关键字">
          <el-input v-model="keyword" clearable> </el-input>
        </el-form-item>
      </template>
      <el-form-item label="统计方式">
        <el-radio-group v-model="countby" @change="onChangeCountby">
          <el-radio-button label="默认"></el-radio-button>
          <el-radio-button label="按日"></el-radio-button>
          <el-radio-button label="按组"></el-radio-button>
        </el-radio-group>
      </el-form-item>

      <el-form-item>
        <el-button type="primary" @click="onSearch">查询</el-button>
      </el-form-item>
      <el-form-item>
        <el-button type="success" :disabled="loading" @click="exportData">导出</el-button>
      </el-form-item>
    </el-form>
    <div class="result-container">
      <ul class="result-show" v-show="countby !== '按日'">
        <li v-for="(item, index) in searchItems" :key="index">
          {{ item.label }}
          <span class="count">{{ item.value }}</span>
        </li>
        <template v-for="(count, key) in filterData">
          <li v-if="count !== 0" :key="key">
            {{ key }}
            <span class="count">{{ count }}</span>
          </li>
        </template>
      </ul>
      <el-table v-loading="loading" :data="tableData" style="width: 100%" :default-sort = "{prop: 'pv_count', order: 'descending'}">
        <el-table-column type="index" label="序号" width="50"> </el-table-column>
        <el-table-column prop="date" label="日期" v-if="countby === '按日'" sortable>
        </el-table-column>
        <el-table-column
          prop="group"
          label="组"
          v-else-if="countby === '按组' && group === ''"
        >
        </el-table-column>
        <el-table-column prop="url" label="页面URL" v-else> </el-table-column>
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
  name: 'WeeklyReport',
  data () {
    return {
      date: [],
      period: 0,
      reportPeriod: ['当月', '环比', '同比'],
      searchItems: [
        { name: 'pv_count', label: 'PV', value: '0' },
        { name: 'visitor_count', label: 'UV', value: '0' },
        { name: 'outward_count', label: '贡献下游流量', value: '0' },
        { name: 'average_stay_time', label: '平均停留时长', value: '0' },
        { name: 'exit_count', label: '退出页次数', value: '0' },
        { name: 'exit_ratio', label: '退出率', value: '0%' }
      ],
      tableData: [],
      keyword: '',
      totalNum: 0,
      params: {
        site_id: '',
        start_date: '',
        end_date: '',
        metrics: '',
        method: 'visit/toppage/a',
        start_index: 0,
        max_results: 1000000
      },
      filterData: {
        pv_count: 0,
        visitor_count: 0,
        outward_count: 0,
        average_stay_time: 0,
        exit_count: 0,
        exit_ratio: 0
      },
      json_fields: null,
      loading: false,
      countby: '默认',
      showGroup: false,
      group: '',
      urlGroup: [{
        name: '首页',
        link: ['']
      }, {
        name: '全屋智能照明',
        link: ['activity/wholehome', 'products/wholehomeproducts']
      }, {
        name: '家居产品',
        link: ['activity/fanlight', 'activity/yuanrui2pro', 'activity/bp30', 'activity/langyu', 'products/customerproducts']
      }, {
        name: '商照产品',
        link: ['products/businessproducts']
      }, {
        name: '商照服务',
        link: ['service/commercialafter']
      }, {
        name: '行业解决方案',
        link: ['commercial']
      }, {
        name: '道路照明',
        link: ['roadwaylighting', 'products/roadwayproducts']
      }, {
        name: '门店查询',
        link: ['service/dealer']
      }, {
        name: '预约服务',
        link: ['service/appointment']
      }, {
        name: '售后服务',
        link: ['service/afterservice']
      }, {
        name: '收费标准',
        link: ['service/charge']
      }, {
        name: '联系我们',
        link: ['service/contact']
      }, {
        name: '企业介绍',
        link: ['aboutus/aboutus']
      }, {
        name: '品牌新闻',
        link: ['news/brand']
      }, {
        name: '品牌活动',
        link: ['news/brandactivity']
      }, {
        name: '精彩视频',
        link: ['news/brandvideo']
      }, {
        name: '下载专区',
        link: ['news/download']
      }, {
        name: '品牌资讯详情',
        link: ['news/branddetail/']
      }, {
        name: '欧普生态光',
        link: ['aboutus/ecolight']
      }, {
        name: '人才培养',
        link: ['aboutus/personnel']
      }, {
        name: '投资者关系',
        link: ['aboutus/organization']
      }, {
        name: '搜索',
        link: ['search']
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
    onChangeCountby (type) {
      const _json = {}
      this.searchItems.forEach((item) => {
        _json[item.label] = item.name
      })
      switch (type) {
        case '按日':
          this.json_fields = { '日期': 'date', ..._json }
          break
        case '按组':
          this.showGroup = true
          this.json_fields = this.group === '' ? { '组别': 'group', ..._json } : { '页面URL': 'url', ..._json }
          break
        default:
          this.showGroup = false
          this.json_fields = { '页面URL': 'url', ..._json }
          break
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
      const _metrics = this.searchItems.map(item => item.name)
      this.params.metrics = _metrics.join(',')
      this.params.start_index = 0
      this.getData()
    },
    getData (date) {
      this.loading = true
      this.filterData = {
        pv_count: 0, visitor_count: 0, outward_count: 0,
        average_stay_time: 0, exit_ratio: 0, exit_count: 0
      }
      if (this.countby === '按日') {
        if (!date) {
          this.tableData.length = 0
          date = this.date[0]
        }
        this.params.start_date = date
        this.params.end_date = date
      } else {
        this.params.start_date = this.date[0]
        this.params.end_date = this.date[1]
        this.tableData.length = 0
      }
      api.getData(this.params).then((res) => {
        if (!res) { this.loading = false; return; }
        if (res.header.desc === 'success') {
          const resData = res.body.data[0].result
          this.totalNum = resData.total
          this.searchItems.map((item, index) => {
            return (item.value = resData.sum[0][index])
          })
          if (this.keyword) {
            if (this.params.max_results < resData.total) {
              this.params.start_index = 0
              this.params.max_results = resData.total
              this.getData(date)
            } else {
              resData.items[0].forEach((url, index) => {
                if (url[0].name.toLowerCase().indexOf(this.keyword.toLowerCase()) !== -1) {
                  const searchs = {}
                  this.searchItems.forEach((search, index2) => {
                    searchs[search.name] = resData.items[1][index][index2]
                    if (search.name === 'average_stay_time') {
                      this.filterData[search.name] += resData.items[1][index][index2] * resData.items[1][index][0]
                    } else if (search.name === 'exit_ratio') {
                      this.filterData[search.name] += searchs.exit_count
                    } else {
                      this.filterData[search.name] += resData.items[1][index][index2]
                    }
                  })
                  this.countby !== '按日' && this.tableData.push({ url: url[0].name, ...searchs })
                }
              })
              const pv = this.filterData.pv_count || 0
              this.filterData.exit_ratio = pv ? (this.filterData.exit_count / pv * 100).toFixed(2) + '%' : '0.00%'
              this.filterData.average_stay_time = pv ? this.toTime(this.filterData.average_stay_time / pv) : '0:0:0'
              this.tableData.push({ date: date, ...this.filterData })
              if (this.date[1] == date || this.countby !== '按日') {
                this.loading = false
              } else {
                this.getData(this.addDate(date, 1))
              }
            }
          } else {
            if (this.countby === '按日') {
              const _data = {}
              this.searchItems.forEach((item, index) => {
                _data[item.name] = resData.sum[0][index]
              })
              this.tableData.push({ date: date, ..._data })
              if (this.date[1] == date) {
                this.loading = false
              } else {
                this.getData(this.addDate(date, 1))
              }
            } else if (this.countby === '按组') {
              if (this.group !== '') {
                const curGroup = this.urlGroup[this.group]
                curGroup.link.forEach((item) => {
                  resData.items[0].filter((url, index) => {
                    if ((item !== '' && url[0].name.indexOf('opple.com.cn/' + item) > 0) || (item === '' && url[0].name === 'https://www.opple.com.cn')) {
                      const _data = {}
                      this.searchItems.forEach((search, index2) => {
                        _data[search.name] = resData.items[1][index][index2]
                        if (search.name === 'average_stay_time') {
                          this.filterData[search.name] += resData.items[1][index][index2] * resData.items[1][index][0]
                        } else if (search.name === 'exit_ratio') {
                          this.filterData[search.name] += _data.exit_count
                        } else {
                          this.filterData[search.name] += resData.items[1][index][index2]
                        }
                      })
                      this.tableData.push({ url: url[0].name, ..._data })
                      return true
                    }
                  })
                })
                const pv = this.filterData.pv_count || 0
                this.filterData.exit_ratio = pv ? (this.filterData.exit_count / pv * 100).toFixed(2) + '%' : '0.00%'
                this.filterData.average_stay_time = pv ? this.toTime(this.filterData.average_stay_time / pv) : '0:0:0'
              } else {
                this.urlGroup.forEach((g) => {
                  const _data = {}
                  g.link.forEach((item) => {
                    resData.items[0].filter((url, index) => {
                      if ((item !== '' && url[0].name.indexOf('opple.com.cn/' + item) > 0) || (item === '' && url[0].name === 'https://www.opple.com.cn')) {
                        this.searchItems.forEach((search, index2) => {
                          const value = resData.items[1][index][index2]
                          if (_data[search.name] !== undefined) {
                            if (search.name === 'average_stay_time') {
                              _data[search.name] += value * resData.items[1][index][0]
                            } else if (search.name === 'exit_ratio') {
                              _data[search.name] += _data.exit_count
                            } else {
                              _data[search.name] += value
                            }
                          } else {
                            if (search.name === 'average_stay_time') {
                              _data[search.name] = value * resData.items[1][index][0]
                            } else if (search.name === 'exit_ratio') {
                              _data[search.name] = _data.exit_count || 0
                            } else {
                              _data[search.name] = value
                            }
                          }
                        })
                        return true
                      }
                    })
                  })
                  const pv = _data.pv_count || 0
                  _data.exit_ratio = pv ? (_data.exit_count / pv * 100).toFixed(2) + '%' : '0.00%'
                  _data.average_stay_time = pv ? this.toTime(_data.average_stay_time / pv) : '0:0:0'
                  this.tableData.push({ group: g.name, ..._data })
                })
              }
              this.loading = false
            } else {
              resData.items[0].forEach((url) => {
                this.tableData.push({ url: url[0].name })
              })
              resData.items[1].forEach((item, index) => {
                this.searchItems.forEach((search, index2) => {
                  this.tableData[index][search.name] = item[index2]
                })
              })
              this.loading = false
            }
          }
        }
      })
    },
    addDate (date, adddays) {
      const y = parseInt(date.substr(0, 4))
      const m = parseInt(date.substr(4, 2)) - 1
      const d = parseInt(date.substr(6, 2))
      const dateTime = new Date(y, m, d)
      dateTime.setDate(dateTime.getDate() + adddays)
      return dayjs(dateTime).format('YYYYMMDD')
    },
    toTime (seconds) {
      const h = Math.floor(seconds / 3600)
      const m = Math.floor((seconds % 3600) / 60)
      const s = Math.round(seconds % 60)
      return `${h}:${m}:${s}`
    },
    exportData () {
      if (this.json_fields) {
        const exportArr = this.tableData.map(row => {
          const obj = {}
          for (const [key, val] of Object.entries(this.json_fields)) {
            obj[key] = row[val]
          }
          return obj
        })
        exportExcel(exportArr, `周报${this.date.join('_')}`)
      }
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
